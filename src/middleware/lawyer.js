const prisma = require('../utils/prismaClient');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to verify if the authenticated user is a lawyer
 * Checks if user has an entry in the Lawyer table
 * Blocks: ADMIN and OWNER (non-lawyers)
 */
async function isLawyer(req, res, next) {
    try {
        // Block if user is ADMIN
        if (req.user.role === 'ADMIN') {
            return errorResponse(res, 403,
                'Admins cannot perform lawyer actions',
                'ADMIN_FORBIDDEN'
            );
        }

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id }
        });

        if (!lawyer) {
            return errorResponse(res, 403,
                'Only lawyers can perform this action',
                'NOT_A_LAWYER'
            );
        }

        // Attach lawyer to request for use in controller
        req.lawyer = lawyer;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { isLawyer };
