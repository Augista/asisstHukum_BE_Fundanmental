
const {
    uploadFile,
    getBusinessFiles,
    downloadFile,
    deleteFile,
} = require('../src/controllers/file.controller');
const prisma = require('../src/utils/prismaClient');
const { successResponse, errorResponse } = require('../src/utils/response');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../src/utils/prismaClient', () => ({
    file: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
}));
jest.mock('../src/utils/response');
jest.mock('fs');
jest.mock('path');

describe('File Controller - Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            body: {},
            file: null,
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            download: jest.fn(),
        };
        next = jest.fn();
    });

    describe('uploadFile', () => {
        it('harus berhasil upload file', async () => {
            // Arrange
            req.params.businessId = '1';
            req.file = {
                originalname: 'document.pdf',
                filename: 'upload_123.pdf',
            };

            const mockFile = {
                id: 1,
                businessId: 1,
                filename: 'document.pdf',
                url: 'upload_123.pdf',
            };

            prisma.file.create.mockResolvedValue(mockFile);

            // Act
            await uploadFile(req, res, next);

            // Assert
            expect(prisma.file.create).toHaveBeenCalledWith({
                data: {
                    businessId: 1,
                    filename: 'document.pdf',
                    url: 'upload_123.pdf',
                },
            });
            expect(successResponse).toHaveBeenCalledWith(res, 201, 'File uploaded successfully', mockFile);
        });

        it('harus mengembalikan error jika tidak ada file', async () => {
            // Arrange
            req.params.businessId = '1';
            req.file = null;

            // Act
            await uploadFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'No file uploaded', 'NO_FILE');
            expect(prisma.file.create).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika businessId invalid', async () => {
            // Arrange
            req.params.businessId = 'invalid';
            req.file = {
                originalname: 'document.pdf',
                filename: 'upload_123.pdf',
            };

            // Act
            await uploadFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid businessId', 'INVALID_ID');
            expect(prisma.file.create).not.toHaveBeenCalled();
        });
    });

    describe('getBusinessFiles', () => {
        it('harus berhasil mengambil files per business', async () => {
            // Arrange
            req.params.businessId = '1';
            const mockFiles = [
                { id: 1, businessId: 1, filename: 'doc1.pdf' },
                { id: 2, businessId: 1, filename: 'doc2.pdf' },
            ];

            prisma.file.findMany.mockResolvedValue(mockFiles);

            // Act
            await getBusinessFiles(req, res, next);

            // Assert
            expect(prisma.file.findMany).toHaveBeenCalledWith({
                where: { businessId: 1 },
                orderBy: { createdAt: 'desc' },
            });
            expect(successResponse).toHaveBeenCalledWith(res, 200, 'Files fetched successfully', mockFiles);
        });

        it('harus mengembalikan error jika businessId invalid', async () => {
            // Arrange
            req.params.businessId = 'invalid';

            // Act
            await getBusinessFiles(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid businessId', 'INVALID_ID');
            expect(prisma.file.findMany).not.toHaveBeenCalled();
        });
    });

    describe('downloadFile', () => {
        it('harus berhasil download file', async () => {
            // Arrange
            req.params.id = '1';
            const mockFile = {
                id: 1,
                filename: 'document.pdf',
                url: 'upload_123.pdf',
            };

            prisma.file.findUnique.mockResolvedValue(mockFile);
            path.join.mockReturnValue('/uploads/upload_123.pdf');
            fs.existsSync.mockReturnValue(true);

            // Act
            await downloadFile(req, res, next);

            // Assert
            expect(prisma.file.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(fs.existsSync).toHaveBeenCalledWith('/uploads/upload_123.pdf');
            expect(res.download).toHaveBeenCalledWith('/uploads/upload_123.pdf', 'document.pdf');
        });

        it('harus mengembalikan error jika file ID invalid', async () => {
            // Arrange
            req.params.id = 'invalid';

            // Act
            await downloadFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid file id', 'INVALID_ID');
            expect(prisma.file.findUnique).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika file tidak ditemukan di database', async () => {
            // Arrange
            req.params.id = '999';
            prisma.file.findUnique.mockResolvedValue(null);

            // Act
            await downloadFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 404, 'File not found', 'NOT_FOUND');
            expect(fs.existsSync).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika file tidak ada di server', async () => {
            // Arrange
            req.params.id = '1';
            const mockFile = {
                id: 1,
                filename: 'document.pdf',
                url: 'upload_123.pdf',
            };

            prisma.file.findUnique.mockResolvedValue(mockFile);
            path.join.mockReturnValue('/uploads/upload_123.pdf');
            fs.existsSync.mockReturnValue(false);

            // Act
            await downloadFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 404, 'File not found on server', 'FILE_NOT_FOUND');
            expect(res.download).not.toHaveBeenCalled();
        });
    });

    describe('deleteFile', () => {
        it('harus berhasil menghapus file', async () => {
            // Arrange
            req.params.id = '1';
            const mockFile = {
                id: 1,
                filename: 'document.pdf',
                url: 'upload_123.pdf',
            };

            prisma.file.findUnique.mockResolvedValue(mockFile);
            path.join.mockReturnValue('/uploads/upload_123.pdf');
            fs.existsSync.mockReturnValue(true);
            fs.unlinkSync.mockReturnValue(undefined);
            prisma.file.delete.mockResolvedValue(mockFile);

            // Act
            await deleteFile(req, res, next);

            // Assert
            expect(prisma.file.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(fs.existsSync).toHaveBeenCalledWith('/uploads/upload_123.pdf');
            expect(fs.unlinkSync).toHaveBeenCalledWith('/uploads/upload_123.pdf');
            expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(successResponse).toHaveBeenCalledWith(res, 200, 'File deleted successfully');
        });

        it('harus tetap berhasil delete dari database meski file tidak ada di server', async () => {
            // Arrange
            req.params.id = '1';
            const mockFile = {
                id: 1,
                filename: 'document.pdf',
                url: 'upload_123.pdf',
            };

            prisma.file.findUnique.mockResolvedValue(mockFile);
            path.join.mockReturnValue('/uploads/upload_123.pdf');
            fs.existsSync.mockReturnValue(false); // File tidak ada di server
            prisma.file.delete.mockResolvedValue(mockFile);

            // Act
            await deleteFile(req, res, next);

            // Assert
            expect(fs.unlinkSync).not.toHaveBeenCalled(); // Tidak mencoba delete file fisik
            expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(successResponse).toHaveBeenCalledWith(res, 200, 'File deleted successfully');
        });

        it('harus mengembalikan error jika file ID invalid', async () => {
            // Arrange
            req.params.id = 'invalid';

            // Act
            await deleteFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid file id', 'INVALID_ID');
            expect(prisma.file.findUnique).not.toHaveBeenCalled();
        });

        it('harus mengembalikan error jika file tidak ditemukan', async () => {
            // Arrange
            req.params.id = '999';
            prisma.file.findUnique.mockResolvedValue(null);

            // Act
            await deleteFile(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 404, 'File not found', 'NOT_FOUND');
            expect(prisma.file.delete).not.toHaveBeenCalled();
        });
    });
});
