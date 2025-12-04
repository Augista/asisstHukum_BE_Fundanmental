const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/utils/prismaClient');

/**
 * Utilitas Helper untuk Testing
 * Menyediakan fungsi untuk membuat data testing dan mengelola database testing
 */
class TestHelpers {
    /**
     * Membuat user test di database
     * @param {Object} userData - Data user
     * @param {string} userData.email - Email user
     * @param {string} userData.password - Password user (akan di-hash)
     * @param {string} userData.name - Nama lengkap user
     * @param {string} userData.role - Role user (OWNER, ADMIN, LAWYER)
     * @returns {Promise<Object>} Objek user yang dibuat
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
     * Generate JWT token untuk autentikasi
     * @param {number} userId - ID User
     * @param {string} email - Email user
     * @param {string} role - Role user
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
     * Membuat user dan generate token dalam satu langkah
     * @param {Object} userData - Data user (sama seperti createUser)
     * @returns {Promise<Object>} Objek dengan properti user dan token
     */
    static async createUserWithToken({ email, password = 'password123', name = 'Test User', role = 'OWNER' }) {
        const user = await this.createUser({ email, password, name, role });
        const token = this.generateToken(user.id, user.email, role);

        return { user, token };
    }

    /**
     * Membuat business test
     * @param {Object} businessData - Data business
     * @param {string} businessData.name - Nama business
     * @param {number} businessData.ownerId - ID owner user
     * @param {number} [businessData.lawyerId] - ID lawyer (opsional)
     * @returns {Promise<Object>} Objek business yang dibuat
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
     * Membuat consultation test
     * @param {Object} consultationData - Data consultation
     * @param {string} consultationData.notes - Catatan consultation
     * @param {number} consultationData.businessId - ID Business
     * @param {number} [consultationData.lawyerId] - ID lawyer (opsional)
     * @param {string} [consultationData.status] - Status consultation
     * @returns {Promise<Object>} Objek consultation yang dibuat
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
     * Membersihkan semua data test dari database
     * Panggil ini di beforeEach atau afterAll hooks
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
     * Panggil ini di afterAll hook untuk mencegah koneksi yang menggantung
     */
    static async disconnect() {
        await prisma.$disconnect();
    }
}

module.exports = TestHelpers;
