const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/utils/prismaClient');

/**
 * Test utilities for setting up test data and authentication
 */

class TestHelpers {
    /**
     * Create a test user with specified role
     */
    static async createUser({ email, password = 'password123', name = 'Test User', role = 'owner' }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role.toUpperCase()
            }
        });
    }

    /**
     * Generate JWT token for a user
     */
    static generateToken(userId, email, role = 'owner') {
        return jwt.sign(
            { id: userId, email, role: role.toUpperCase() },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }

    /**
     * Create user and return token
     */
    static async createUserWithToken({ email, password = 'password123', name = 'Test User', role = 'owner' }) {
        const user = await this.createUser({ email, password, name, role });
        const token = this.generateToken(user.id, user.email, role);
        return { user, token };
    }

    /**
     * Create a test business
     */
    static async createBusiness({ name, ownerId, lawyerId = null }) {
        return await prisma.business.create({
            data: {
                name,
                ownerId,
                lawyerId
            }
        });
    }

    /**
     * Create a test consultation
     */
    static async createConsultation({ notes, businessId, lawyerId = null, status = 'PENDING' }) {
        return await prisma.consultation.create({
            data: {
                notes,
                businessId,
                lawyerId,
                status
            }
        });
    }

    /**
     * Clean up all test data from database
     */
    static async cleanup() {
        await prisma.file.deleteMany({});
        await prisma.consultation.deleteMany({});
        await prisma.permit.deleteMany({});
        await prisma.business.deleteMany({});
        await prisma.user.deleteMany({});
    }

    /**
     * Disconnect Prisma client
     */
    static async disconnect() {
        await prisma.$disconnect();
    }
}

module.exports = TestHelpers;
