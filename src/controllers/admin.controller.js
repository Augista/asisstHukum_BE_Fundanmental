const prisma = require('../utils/prismaClient');

async function assignUserToLawyer(req, res, next) {
    try {
        const { userId } = req.params;

        const user = await prisma.user.update({
            where: { id: Number(userId) },
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

        return res.json({
            success: true,
            message: 'User assigned as Lawyer successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { assignUserToLawyer };
