const prisma = require('../utils/prismaClient');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to ensure only pure OWNER users can access
 * Blocks: ADMIN and LAWYER
 */
async function requireOwner(req, res, next) {
    try {
        // Block if user is ADMIN
        if (req.user.role === 'ADMIN') {
            return errorResponse(res, 403,
                'Admins cannot perform owner actions',
                'ADMIN_FORBIDDEN'
            );
        }

        // Block if user is a lawyer
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id }
        });

        if (lawyer) {
            return errorResponse(res, 403,
                'Lawyers cannot perform owner actions',
                'LAWYER_FORBIDDEN'
            );
        }

        // User is pure OWNER, allow access
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireOwner };
