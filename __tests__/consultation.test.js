/**
 * Unit Test untuk Consultation Controller
 * Menggunakan Jest mocking untuk mengisolasi logic dari dependencies
 */

const {
    createConsultation,
    listMyConsultations,
    listAllConsultations,
    listLawyerConsultations,
    assignLawyer,
    updateStatus,
    submitResult,
} = require('../src/controllers/consultation.controller');
const prisma = require('../src/utils/prismaClient');
const { successResponse, errorResponse } = require('../src/utils/response');

// Mock dependencies
jest.mock('../src/utils/prismaClient', () => ({
    business: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
    consultation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));
jest.mock('../src/utils/response');

describe('Consultation Controller - Unit Tests', () => {
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

    describe('createConsultation', () => {
        it('harus berhasil membuat consultation', async () => {
            // Arrange
            req.body = { businessId: 1, note: 'Need legal advice' };
            const mockBusiness = { id: 1, ownerId: 1 };
            const mockConsultation = {
                id: 1,
                businessId: 1,
                notes: 'Need legal advice',
                status: 'PENDING',
                business: mockBusiness,
            };

            prisma.business.findUnique.mockResolvedValue(mockBusiness);
            prisma.consultation.create.mockResolvedValue(mockConsultation);

            // Act
            await createConsultation(req, res, next);

            // Assert
            expect(prisma.business.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(prisma.consultation.create).toHaveBeenCalledWith({
                data: {
                    businessId: 1,
                    notes: 'Need legal advice',
                },
                include: {
                    business: true,
                },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                201,
                'Consultation created successfully',
                mockConsultation
            );
        });

        it('harus mengembalikan error jika business tidak ditemukan', async () => {
            // Arrange
            req.body = { businessId: 999, note: 'Need legal advice' };
            prisma.business.findUnique.mockResolvedValue(null);

            // Act
            await createConsultation(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 404, 'Business not found', 'NOT_FOUND');
            expect(prisma.consultation.create).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika OWNER mengakses business orang lain', async () => {
            // Arrange
            req.body = { businessId: 1, note: 'Need legal advice' };
            req.user = { id: 2, role: 'OWNER' };
            const mockBusiness = { id: 1, ownerId: 1 };

            prisma.business.findUnique.mockResolvedValue(mockBusiness);

            // Act
            await createConsultation(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 403, 'Forbidden', 'FORBIDDEN');
            expect(prisma.consultation.create).not.toHaveBeenCalled();
        });
    });

    describe('listMyConsultations', () => {
        it('harus berhasil mengambil consultations milik owner', async () => {
            // Arrange
            const mockBusinesses = [{ id: 1 }, { id: 2 }];
            const mockConsultations = [
                { id: 1, businessId: 1, status: 'PENDING' },
                { id: 2, businessId: 2, status: 'IN_PROGRESS' },
            ];

            prisma.business.findMany.mockResolvedValue(mockBusinesses);
            prisma.consultation.findMany.mockResolvedValue(mockConsultations);

            // Act
            await listMyConsultations(req, res, next);

            // Assert
            expect(prisma.business.findMany).toHaveBeenCalledWith({
                where: { ownerId: 1 },
                select: { id: true },
            });
            expect(prisma.consultation.findMany).toHaveBeenCalledWith({
                where: {
                    businessId: { in: [1, 2] },
                },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Consultations for my businesses fetched successfully',
                mockConsultations
            );
        });
    });

    describe('listAllConsultations', () => {
        it('harus berhasil mengambil semua consultations', async () => {
            // Arrange
            const mockConsultations = [
                { id: 1, status: 'PENDING' },
                { id: 2, status: 'COMPLETED' },
            ];

            prisma.consultation.findMany.mockResolvedValue(mockConsultations);

            // Act
            await listAllConsultations(req, res, next);

            // Assert
            expect(prisma.consultation.findMany).toHaveBeenCalledWith({
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'All consultations fetched successfully',
                mockConsultations
            );
        });
    });

    describe('listLawyerConsultations', () => {
        it('harus berhasil mengambil consultations lawyer', async () => {
            // Arrange
            req.user = { id: 5, role: 'LAWYER' };
            const mockConsultations = [{ id: 1, lawyerId: 5, status: 'IN_PROGRESS' }];

            prisma.consultation.findMany.mockResolvedValue(mockConsultations);

            // Act
            await listLawyerConsultations(req, res, next);

            // Assert
            expect(prisma.consultation.findMany).toHaveBeenCalledWith({
                where: { lawyerId: 5 },
                include: expect.any(Object),
                orderBy: { createdAt: 'desc' },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Consultations for current lawyer fetched successfully',
                mockConsultations
            );
        });
    });

    describe('assignLawyer', () => {
        it('harus berhasil assign lawyer ke consultation', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { lawyerId: 5 };
            const updatedConsultation = {
                id: 1,
                lawyerId: 5,
                business: {},
                lawyer: { id: 5, name: 'Lawyer', email: 'lawyer@test.com', role: 'LAWYER' },
            };

            prisma.consultation.update.mockResolvedValue(updatedConsultation);

            // Act
            await assignLawyer(req, res, next);

            // Assert
            expect(prisma.consultation.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { lawyerId: 5 },
                include: expect.any(Object),
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Consultation assigned to lawyer successfully',
                updatedConsultation
            );
        });

        it('harus mengembalikan error jika ID invalid', async () => {
            // Arrange
            req.params.id = 'invalid';
            req.body = { lawyerId: 5 };

            // Act
            await assignLawyer(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid consultation id', 'INVALID_ID');
            expect(prisma.consultation.update).not.toHaveBeenCalled();
        });
    });

    describe('updateStatus', () => {
        it('harus berhasil update status consultation', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { status: 'COMPLETED' };
            req.user = { id: 5, role: 'LAWYER' };
            const existingConsultation = { id: 1, lawyerId: 5 };
            const updatedConsultation = { id: 1, status: 'COMPLETED', lawyerId: 5 };

            prisma.consultation.findUnique.mockResolvedValue(existingConsultation);
            prisma.consultation.update.mockResolvedValue(updatedConsultation);

            // Act
            await updateStatus(req, res, next);

            // Assert
            expect(prisma.consultation.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { status: 'COMPLETED' },
                include: expect.any(Object),
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Consultation status updated successfully',
                updatedConsultation
            );
        });

        it('harus mengembalikan error jika consultation tidak ditemukan', async () => {
            // Arrange
            req.params.id = '999';
            req.body = { status: 'COMPLETED' };
            prisma.consultation.findUnique.mockResolvedValue(null);

            // Act
            await updateStatus(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 404, 'Consultation not found', 'NOT_FOUND');
            expect(prisma.consultation.update).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika lawyer mengakses consultation orang lain', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { status: 'COMPLETED' };
            req.user = { id: 6, role: 'LAWYER' };
            const existingConsultation = { id: 1, lawyerId: 5 };

            prisma.consultation.findUnique.mockResolvedValue(existingConsultation);

            // Act
            await updateStatus(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 403, 'Forbidden', 'FORBIDDEN');
            expect(prisma.consultation.update).not.toHaveBeenCalled();
        });
    });

    describe('submitResult', () => {
        it('harus berhasil submit result sebagai lawyer', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { notes: 'Consultation completed', status: 'COMPLETED' };
            req.user = { id: 5, role: 'LAWYER' };
            const existingConsultation = { id: 1, lawyerId: 5 };
            const updatedConsultation = {
                id: 1,
                notes: 'Consultation completed',
                status: 'COMPLETED',
                lawyerId: 5,
            };

            prisma.consultation.findUnique.mockResolvedValue(existingConsultation);
            prisma.consultation.update.mockResolvedValue(updatedConsultation);

            // Act
            await submitResult(req, res, next);

            // Assert
            expect(prisma.consultation.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { notes: 'Consultation completed', status: 'COMPLETED' },
                include: expect.any(Object),
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'Consultation result submitted successfully',
                updatedConsultation
            );
        });

        it('harus mengembalikan error jika bukan lawyer yang assigned', async () => {
            // Arrange
            req.params.id = '1';
            req.body = { notes: 'Result' };
            req.user = { id: 6, role: 'LAWYER' };
            const existingConsultation = { id: 1, lawyerId: 5 };

            prisma.consultation.findUnique.mockResolvedValue(existingConsultation);

            // Act
            await submitResult(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 403, 'Forbidden', 'FORBIDDEN');
            expect(prisma.consultation.update).not.toHaveBeenCalled();
        });
    });
});
