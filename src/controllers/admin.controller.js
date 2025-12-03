const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

async function assignUserToLawyer(req, res, next) {
    try {
        const userId = Number(req.params.userId);

        if (Number.isNaN(userId)) {
            return errorResponse(res, 400, 'Invalid user id', 'INVALID_ID');
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                role: 'LAWYER'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        return successResponse(res, 200, 'User assigned as Lawyer successfully', user);
    } catch (error) {
        next(error);
    }
}

module.exports = { assignUserToLawyer };
