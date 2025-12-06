const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

async function assignUserToLawyer(req, res, next) {
    try {
        const userId = Number(req.params.userId);

        if (Number.isNaN(userId)) {
            return errorResponse(res, 400, 'Invalid user id', 'INVALID_ID');
        }
        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            if (!user) throw new Error('User not found');

            // Check existing lawyer entry
            let lawyer = await tx.lawyer.findUnique({
                where: { userId }
            });

            if (!lawyer) {
                lawyer = await tx.lawyer.create({
                    data: { userId },
                    select: {
                        idLawyer: true,
                        userId: true,
                        createdAt: true
                    }
                });
            }

            // Update user role -> LAWYER
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { role: 'LAWYER' },
                select: { id: true, name: true, email: true, role: true }
            });

            return { user: updatedUser, lawyer };
        });

        return successResponse(res, 200, 'User assigned as Lawyer successfully', result);
    } catch (error) {
        console.error('Error in assignUserToLawyer:', error);
        next(error);
    }
}


module.exports = { assignUserToLawyer };
