const prisma = require('../utils/prismaClient');
const { errorResponse } = require('../utils/response');

async function requireOwner(req, res, next) {
    try {
        if (req.user.role === 'ADMIN') {
            return errorResponse(res, 403,
                'Admins cannot perform owner actions',
                'ADMIN_FORBIDDEN'
            );
        }

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id }
        });

        if (lawyer) {
            return errorResponse(res, 403,
                'Lawyers cannot perform owner actions',
                'LAWYER_FORBIDDEN'
            );
        }
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireOwner };
