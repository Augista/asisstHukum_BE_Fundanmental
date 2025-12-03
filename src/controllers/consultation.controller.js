const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

async function createConsultation(req, res, next) {
    try {
        const { businessId, note } = req.body;

        const biz = await prisma.business.findUnique({ where: { id: businessId } });

        if (!biz) {
            return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');
        }

        if (req.user.role === 'OWNER' && biz.ownerId !== req.user.id) {
            return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
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

        return successResponse(res, 201, 'Consultation created successfully', consultation);
    } catch (e) {
        next(e);
    }
}

async function listMyConsultations(req, res, next) {
    try {
        const myBusinesses = await prisma.business.findMany({
            where: { ownerId: req.user.id },
            select: { id: true }
        });

        const businessIds = myBusinesses.map((b) => b.id);

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

        return successResponse(res, 200, 'Consultations for my businesses fetched successfully', consultations);
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

        return successResponse(res, 200, 'All consultations fetched successfully', list);
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

        return successResponse(res, 200, 'Consultations for current lawyer fetched successfully', list);
    } catch (e) {
        next(e);
    }
}

async function assignLawyer(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { lawyerId } = req.body;

        if (Number.isNaN(id)) {
            return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');
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

        return successResponse(res, 200, 'Consultation assigned to lawyer successfully', consult);
    } catch (e) {
        next(e);
    }
}

async function updateStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        const consult = await prisma.consultation.findUnique({ where: { id } });

        if (!consult) {
            return errorResponse(res, 404, 'Consultation not found', 'NOT_FOUND');
        }

        if (req.user.role === 'LAWYER' && consult.lawyerId !== req.user.id) {
            return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
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

        return successResponse(res, 200, 'Consultation status updated successfully', updated);
    } catch (e) {
        next(e);
    }
}

async function submitResult(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { notes, status } = req.body;

        if (Number.isNaN(id)) {
            return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');
        }

        const consult = await prisma.consultation.findUnique({ where: { id } });

        if (!consult) {
            return errorResponse(res, 404, 'Consultation not found', 'NOT_FOUND');
        }

        if (req.user.role !== 'LAWYER' || consult.lawyerId !== req.user.id) {
            return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
        }

        const data = {};

        if (typeof notes === 'string') {
            data.notes = notes;
        }

        if (typeof status === 'string') {
            data.status = status;
        }

        const updated = await prisma.consultation.update({
            where: { id },
            data,
            include: {
                business: true,
                lawyer: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        return successResponse(res, 200, 'Consultation result submitted successfully', updated);
    } catch (e) {
        next(e);
    }
}

async function uploadResultFile(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');
        }

        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded', 'NO_FILE');
        }

        const consult = await prisma.consultation.findUnique({
            where: { id }
        });

        if (!consult) {
            return errorResponse(res, 404, 'Consultation not found', 'NOT_FOUND');
        }

        if (req.user.role !== 'LAWYER' || consult.lawyerId !== req.user.id) {
            return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
        }

        const file = await prisma.file.create({
            data: {
                businessId: consult.businessId,
                filename: req.file.originalname,
                url: req.file.filename,
                consultation: {
                    connect: { id }
                }
            }
        });

        const updated = await prisma.consultation.findUnique({
            where: { id },
            include: {
                business: true,
                lawyer: {
                    select: { id: true, name: true, email: true }
                },
                resultFile: true
            }
        });

        return successResponse(res, 201, 'Consultation result file uploaded successfully', {
            consultation: updated,
            file
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
    updateStatus,
    submitResult,
    uploadResultFile
};