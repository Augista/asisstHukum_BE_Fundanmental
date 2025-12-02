const prisma = require('../utils/prismaClient');

async function createConsultation(req, res, next) {
    try {
        const { businessId, note } = req.body;
        if (!businessId || !note) {
            return res.status(400).json({
                success: false,
                message: 'businessId and note required'
            });
        }

        const biz = await prisma.business.findUnique({ where: { id: businessId } });
        if (!biz) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Owner can only create consultation for their business
        if (req.user.role === 'OWNER' && biz.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const consultation = await prisma.consultation.create({
            data: {
                businessId,
                notes: note
            },
            include: {
                business: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Consultation created successfully',
            data: consultation
        });
    } catch (e) {
        next(e);
    }
}

// List consultations for businesses owned by current user
async function listMyConsultations(req, res, next) {
    try {
        // Find businesses owned by current user
        const myBusinesses = await prisma.business.findMany({
            where: { ownerId: req.user.id },
            select: { id: true }
        });

        const businessIds = myBusinesses.map(b => b.id);

        // Find consultations for those businesses
        const consultations = await prisma.consultation.findMany({
            where: {
                businessId: { in: businessIds }
            },
            include: {
                business: true,
                lawyer: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            message: 'Consultations for my businesses fetched successfully',
            data: consultations
        });
    } catch (e) {
        next(e);
    }
}

async function listAllConsultations(req, res, next) {
    try {
        const list = await prisma.consultation.findMany({
            include: {
                lawyer: {
                    select: { id: true, name: true, email: true }
                },
                business: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            message: 'All consultations fetched successfully',
            data: list
        });
    } catch (e) {
        next(e);
    }
}

async function listLawyerConsultations(req, res, next) {
    try {
        const list = await prisma.consultation.findMany({
            where: { lawyerId: req.user.id },
            include: {
                business: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            message: 'Consultations for current lawyer fetched successfully',
            data: list
        });
    } catch (e) {
        next(e);
    }
}

async function assignLawyer(req, res, next) {
    try {
        const id = Number(req.params.id); // consultation id
        const { lawyerId } = req.body;

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid consultation id'
            });
        }

        if (!lawyerId) {
            return res.status(400).json({
                success: false,
                message: 'lawyerId is required'
            });
        }

        const consult = await prisma.consultation.update({
            where: { id },
            data: { lawyerId },
            include: {
                business: true,
                lawyer: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Consultation assigned to lawyer successfully',
            data: consult
        });
    } catch (e) {
        next(e);
    }
}

async function updateStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body; // PENDING, APPROVED, REJECTED

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'status is required'
            });
        }

        const consult = await prisma.consultation.findUnique({ where: { id } });

        if (!consult) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Lawyer can only update their assigned consultations
        if (req.user.role === 'LAWYER' && consult.lawyerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const updated = await prisma.consultation.update({
            where: { id },
            data: { status },
            include: {
                business: true,
                lawyer: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Consultation status updated successfully',
            data: updated
        });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    createConsultation,
    listMyConsultations,
    listAllConsultations,
    listLawyerConsultations,
    assignLawyer,
    updateStatus
};