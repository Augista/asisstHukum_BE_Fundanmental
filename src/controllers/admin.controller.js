const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

async function assignUserToLawyer(req, res, next) {
    try {
        const userId = Number(req.params.userId);

        if (Number.isNaN(userId)) {
            return errorResponse(res, 400, 'Invalid user id', 'INVALID_ID');
        }

        // Use transaction to verify user exists and create lawyer entry
        const result = await prisma.$transaction(async (tx) => {
            // Verify user exists
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Check if lawyer entry already exists
            const existingLawyer = await tx.lawyer.findUnique({
                where: { userId }
            });

            let lawyer;
            if (!existingLawyer) {
                // Create lawyer entry
                lawyer = await tx.lawyer.create({
                    data: {
                        userId
                    },
                    select: {
                        idLawyer: true,
                        userId: true,
                        createdAt: true
                    }
                });
            } else {
                lawyer = existingLawyer;
            }

            return { user, lawyer };
        });

        return successResponse(res, 200, 'User assigned as Lawyer successfully', result);
    } catch (error) {
        console.error('Error in assignUserToLawyer:', error);
        next(error);
    }
}

module.exports = { assignUserToLawyer };
