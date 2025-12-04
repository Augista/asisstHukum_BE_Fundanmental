/**
 * Unit Test untuk Auth Controller
 * Menggunakan Jest mocking untuk mengisolasi logic dari dependencies
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { register, login } = require('../src/controllers/auth.controller');
const prisma = require('../src/utils/prismaClient');
const { successResponse, errorResponse } = require('../src/utils/response');

// Mock semua dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../src/utils/prismaClient', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
}));
jest.mock('../src/utils/response');

describe('Auth Controller - Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        // Reset semua mocks sebelum setiap test
        jest.clearAllMocks();

        // Setup mock request, response, dan next
        req = {
            body: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    describe('register', () => {
        it('harus berhasil register user baru', async () => {
            // Arrange
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            prisma.user.findUnique.mockResolvedValue(null); // Email belum terdaftar
            bcrypt.hash.mockResolvedValue('hashedPassword123');
            prisma.user.create.mockResolvedValue({
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'OWNER',
                createdAt: new Date(),
            });

            // Act
            await register(req, res, next);

            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'hashedPassword123',
                    role: 'OWNER',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                },
            });
            expect(successResponse).toHaveBeenCalledWith(res, 201, 'Registration successful', {
                user: expect.objectContaining({
                    id: 1,
                    email: 'test@example.com',
                }),
            });
        });

        it('harus gagal jika email sudah terdaftar', async () => {
            // Arrange
            req.body = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123',
            };

            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                email: 'existing@example.com',
            });

            // Act
            await register(req, res, next);

            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalled();
            expect(errorResponse).toHaveBeenCalledWith(
                res,
                400,
                'Email already registered',
                'EMAIL_EXISTS'
            );
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(prisma.user.create).not.toHaveBeenCalled();
        });

        it('harus memanggil next jika terjadi error', async () => {
            // Arrange
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
            };

            const error = new Error('Database error');
            prisma.user.findUnique.mockRejectedValue(error);

            // Act
            await register(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('login', () => {
        it('harus berhasil login dengan credentials yang benar', async () => {
            // Arrange
            req.body = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedPassword123',
                role: 'OWNER',
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-jwt-token');

            // Act
            await login(req, res, next);

            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    id: 1,
                    email: 'test@example.com',
                    role: 'OWNER',
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );
            expect(successResponse).toHaveBeenCalledWith(res, 200, 'Login successful', {
                token: 'mock-jwt-token',
                user: {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'OWNER',
                },
            });
        });

        it('harus gagal login jika user tidak ditemukan', async () => {
            // Arrange
            req.body = {
                email: 'notfound@example.com',
                password: 'password123',
            };

            prisma.user.findUnique.mockResolvedValue(null);

            // Act
            await login(req, res, next);

            // Assert
            expect(prisma.user.findUnique).toHaveBeenCalled();
            expect(errorResponse).toHaveBeenCalledWith(
                res,
                401,
                'Invalid email or password',
                'INVALID_CREDENTIALS'
            );
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('harus gagal login jika password salah', async () => {
            // Arrange
            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword123',
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            // Act
            await login(req, res, next);

            // Assert
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
            expect(errorResponse).toHaveBeenCalledWith(
                res,
                401,
                'Invalid email or password',
                'INVALID_CREDENTIALS'
            );
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('harus memanggil next jika terjadi error', async () => {
            // Arrange
            req.body = {
                email: 'test@example.com',
                password: 'password123',
            };

            const error = new Error('Database error');
            prisma.user.findUnique.mockRejectedValue(error);

            // Act
            await login(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
