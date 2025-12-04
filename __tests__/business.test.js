/**
 * Unit Test untuk Business Controller
 * Menggunakan Jest mocking untuk mengisolasi logic dari dependencies
 */

const {
    createBusiness,
    getMyBusinesses,
    getBusiness,
    updateBusiness,
    deleteBusiness,
    assignBusiness,
    listAllBusinesses,
} = require('../src/controllers/business.controller');
const prisma = require('../src/utils/prismaClient');
const { successResponse, errorResponse } = require('../src/utils/response');

// Mock dependencies
jest.mock('../src/utils/prismaClient', () => ({
    business: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));
jest.mock('../src/utils/response');

describe('Business Controller - Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            user: { id: 1, role: 'OWNER' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    describe('createBusiness', () => {
        it('harus berhasil membuat business baru', async () => {
            // Arrange
            req.body = { name: 'Test Business', nib: '123456' };
            const mockBusiness = {
                id: 1,
                name: 'Test Business',
                nib: '123456',
                ownerId: 1,
                owner: { id: 1, name: 'Owner', email: 'owner@test.com', role: 'OWNER' },
            };

            prisma.business.create.mockResolvedValue(mockBusiness);

            // Act
            await createBusiness(req, res, next);

            // Assert
            expect(prisma.business.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Business',
                    nib: '123456',
                    ownerId: 1,
                },
                include: {
                    owner: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                201,
                'Business created successfully',
                mockBusiness
            );
        });

        it('harus memanggil next jika terjadi error', async () => {
            // Arrange
            req.body = { name: 'Test Business' };
            const error = new Error('Database error');
            prisma.business.create.mockRejectedValue(error);

            // Act
            await createBusiness(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getMyBusinesses', () => {
        it('harus berhasil mengambil daftar business milik owner', async () => {
            // Arrange
            const mockBusinesses = [
                {
                    id: 1,
                    name: 'Business 1',
                    ownerId: 1,
                    owner: { id: 1, name: 'Owner', email: 'owner@test.com', role: 'OWNER' },
                    permits: [],
                    files: [],
                    consultations: [],
                },
            ];

            prisma.business.findMany.mockResolvedValue(mockBusinesses);

            // Act
            await getMyBusinesses(req, res, next);

            // Assert
            expect(prisma.business.findMany).toHaveBeenCalledWith({
                where: { ownerId: 1 },
                include: expect.objectContaining({
                    owner: expect.any(Object),
                    lawyer: expect.any(Object),
                    permits: expect.any(Object),
                    files: expect.any(Object),
                    consultations: expect.any(Object),
                }),
                orderBy: { createdAt: 'desc' },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'My businesses fetched successfully',
                mockBusinesses
            );
        });
    });

    describe('getBusiness', () => {
        it('harus berhasil mengambil detail business', async () => {
            // Arrange
            req.params.id = '1';
            const mockBusiness = {
                id: 1,
                name: 'Business 1',
                ownerId: 1,
                owner: { id: 1, name: 'Owner', email: 'owner@test.com', role: 'OWNER' },
            };

            prisma.business.findUnique.mockResolvedValue(mockBusiness);

            // Act
            await getBusiness(req, res, next);

            // Assert
            expect(prisma.business.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: expect.any(Object),
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Business detail fetched successfully',
                mockBusiness
            );
        });

        it('harus mengembalikan error jika ID invalid', async () => {
            // Arrange
            req.params.id = 'invalid';

            // Act
            await getBusiness(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid business id', 'INVALID_ID');
            expect(prisma.business.findUnique).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika business tidak ditemukan', async () => {
            // Arrange
            req.params.id = '999';
            prisma.business.findUnique.mockResolvedValue(null);

            // Act
            await getBusiness(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 404, 'Business not found', 'NOT_FOUND');
        });

        it('harus mengembalikan error jika OWNER mengakses business orang lain', async () => {
            // Arrange
            req.params.id = '1';
            req.user = { id: 2, role: 'OWNER' };
            const mockBusiness = { id: 1, ownerId: 1 };

            prisma.business.findUnique.mockResolvedValue(mockBusiness);

            // Act
            await getBusiness(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 403, 'Forbidden', 'FORBIDDEN');
        });
    });

    describe('updateBusiness', () => {
        it('harus berhasil update business', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { name: 'Updated Business', nib: '654321' };
            const existingBusiness = { id: 1, ownerId: 1 };
            const updatedBusiness = {
                id: 1,
                name: 'Updated Business',
                nib: '654321',
                ownerId: 1,
            };

            prisma.business.findUnique.mockResolvedValue(existingBusiness);
            prisma.business.update.mockResolvedValue(updatedBusiness);

            // Act
            await updateBusiness(req, res, next);

            // Assert
            expect(prisma.business.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { name: 'Updated Business', nib: '654321' },
                include: expect.any(Object),
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Business updated successfully',
                updatedBusiness
            );
        });

        it('harus mengembalikan error jika bukan owner', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { name: 'Updated Business' };
            req.user = { id: 2, role: 'OWNER' };
            const existingBusiness = { id: 1, ownerId: 1 };

            prisma.business.findUnique.mockResolvedValue(existingBusiness);

            // Act
            await updateBusiness(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(
                res,
                403,
                'You can only update your own business',
                'FORBIDDEN'
            );
            expect(prisma.business.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteBusiness', () => {
        it('harus berhasil menghapus business', async () => {
            // Arrange
            req.params.id = '1';
            prisma.business.delete.mockResolvedValue({ id: 1 });

            // Act
            await deleteBusiness(req, res, next);

            // Assert
            expect(prisma.business.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(successResponse).toHaveBeenCalledWith(res, 200, 'Business deleted successfully');
        });

        it('harus mengembalikan error jika ID invalid', async () => {
            // Arrange
            req.params.id = 'invalid';

            // Act
            await deleteBusiness(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid business id', 'INVALID_ID');
            expect(prisma.business.delete).not.toHaveBeenCalled();
        });
    });

    describe('assignBusiness', () => {
        it('harus berhasil assign business ke owner/lawyer', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { ownerId: 2, lawyerId: 3 };
            const updatedBusiness = {
                id: 1,
                ownerId: 2,
                lawyerId: 3,
            };

            prisma.business.update.mockResolvedValue(updatedBusiness);

            // Act
            await assignBusiness(req, res, next);

            // Assert
            expect(prisma.business.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { ownerId: 2, lawyerId: 3 },
                include: expect.any(Object),
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Business assignment updated successfully',
                updatedBusiness
            );
        });
    });

    describe('listAllBusinesses', () => {
        it('harus berhasil mengambil semua business', async () => {
            // Arrange
            const mockBusinesses = [
                { id: 1, name: 'Business 1', ownerId: 1 },
                { id: 2, name: 'Business 2', ownerId: 2 },
            ];

            prisma.business.findMany.mockResolvedValue(mockBusinesses);

            // Act
            await listAllBusinesses(req, res, next);

            // Assert
            expect(prisma.business.findMany).toHaveBeenCalledWith({
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'All businesses fetched successfully',
                mockBusinesses
            );
        });
    });
});
