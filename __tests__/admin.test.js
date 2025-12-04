/**
 * Unit Test untuk Admin Controller
 * Menggunakan Jest mocking untuk mengisolasi logic dari dependencies
 */

const { assignUserToLawyer } = require('../src/controllers/admin.controller');
const prisma = require('../src/utils/prismaClient');
const { successResponse, errorResponse } = require('../src/utils/response');

// Mock dependencies
jest.mock('../src/utils/prismaClient', () => ({
    user: {
        update: jest.fn(),
    },
}));
jest.mock('../src/utils/response');

describe('Admin Controller - Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            params: {},
            user: { id: 1, role: 'ADMIN' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    describe('assignUserToLawyer', () => {
        it('harus berhasil assign user sebagai lawyer', async () => {
            // Arrange
            req.params.userId = '5';
            const updatedUser = {
                id: 5,
                name: 'New Lawyer',
                email: 'newlawyer@test.com',
                role: 'LAWYER',
            };

            prisma.user.update.mockResolvedValue(updatedUser);

            // Act
            await assignUserToLawyer(req, res, next);

            // Assert
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: {
                    role: 'LAWYER',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });
            expect(successResponse).toHaveBeenCalledWith(
                res,
                200,
                'User assigned as Lawyer successfully',
                updatedUser
            );
        });

        it('harus mengembalikan error jika user ID invalid', async () => {
            // Arrange
            req.params.userId = 'invalid';

            // Act
            await assignUserToLawyer(req, res, next);

            // Assert
            expect(errorResponse).toHaveBeenCalledWith(res, 400, 'Invalid user id', 'INVALID_ID');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('harus memanggil next jika terjadi error', async () => {
            // Arrange
            req.params.userId = '5';
            const error = new Error('Database error');
            prisma.user.update.mockRejectedValue(error);

            // Act
            await assignUserToLawyer(req, res, next);

            // Assert
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
