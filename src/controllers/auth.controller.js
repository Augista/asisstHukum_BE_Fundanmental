const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return errorResponse(res, 400, 'Email already registered', 'EMAIL_EXISTS');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'OWNER'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return successResponse(res, 201, 'Registration successful', {
            user
        });

    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return errorResponse(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return errorResponse(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return successResponse(res, 200, 'Login successful', {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getMe(req, res, next) {
    try {
        // Get user data from database
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return errorResponse(res, 404, 'User not found', 'NOT_FOUND');
        }

        // Check if user is a lawyer
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id },
            select: {
                idLawyer: true,
                createdAt: true
            }
        });

        return successResponse(res, 200, 'Profile retrieved successfully', {
            user,
            isLawyer: !!lawyer,
            lawyerProfile: lawyer || null
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { register, login, getMe };