const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/utils/prismaClient');

/**
 * Test Helper Utilities
 * Provides functions to create test data and manage test database
 */
class TestHelpers {
    /**
     * Create a test user in database
     * @param {Object} userData - User data
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password (will be hashed)
     * @param {string} userData.name - User full name
     * @param {string} userData.role - User role (OWNER, ADMIN, LAWYER)
     * @returns {Promise<Object>} Created user object
     */
    static async createUser({ email, password = 'password123', name = 'Test User', role = 'OWNER' }) {
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
     * Generate JWT token for authentication
     * @param {number} userId - User ID
     * @param {string} email - User email
     * @param {string} role - User role
     * @returns {string} JWT token
     */
    static generateToken(userId, email, role = 'OWNER') {
        return jwt.sign(
            { id: userId, email, role: role.toUpperCase() },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
    }

    /**
     * Create user and generate token in one step
     * @param {Object} userData - User data (same as createUser)
     * @returns {Promise<Object>} Object with user and token properties
     */
    static async createUserWithToken({ email, password = 'password123', name = 'Test User', role = 'OWNER' }) {
        const user = await this.createUser({ email, password, name, role });
        const token = this.generateToken(user.id, user.email, role);

        return { user, token };
    }

    /**
     * Create a test business
     * @param {Object} businessData - Business data
     * @param {string} businessData.name - Business name
     * @param {number} businessData.ownerId - Owner user ID
     * @param {number} [businessData.lawyerId] - Optional lawyer ID
     * @returns {Promise<Object>} Created business object
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
     * @param {Object} consultationData - Consultation data
     * @param {string} consultationData.notes - Consultation notes
     * @param {number} consultationData.businessId - Business ID
     * @param {number} [consultationData.lawyerId] - Optional lawyer ID
     * @param {string} [consultationData.status] - Consultation status
     * @returns {Promise<Object>} Created consultation object
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
     * Call this in beforeEach or afterAll hooks
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
     * Call this in afterAll hook to prevent hanging connections
     */
    static async disconnect() {
        await prisma.$disconnect();
    }
}

module.exports = TestHelpers;
