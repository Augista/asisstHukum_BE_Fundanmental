// controllers/consultation.controller.js
const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Helper to resolve lawyer id (accept idLawyer or userId)
 */
async function resolveLawyerId(inputId) {
  if (inputId === undefined || inputId === null) return undefined;

  const idNum = Number(inputId);
  if (Number.isNaN(idNum)) return undefined;

  // Only check by idLawyer
  const lawyer = await prisma.lawyer.findUnique({
    where: { idLawyer: idNum }
  });

  return lawyer ? lawyer.idLawyer : undefined;
}


/**
 * Helper: get current user's lawyer record (if any)
 */
async function getCurrentLawyer(userId) {
  return prisma.lawyer.findUnique({ where: { userId } });
}

async function createConsultation(req, res, next) {
  try {
    const { businessId, note } = req.body;
    const biz = await prisma.business.findUnique({ where: { id: Number(businessId) } });
    if (!biz) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (req.user.role === 'OWNER' && biz.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const consultation = await prisma.consultation.create({
      data: {
        businessId: biz.id,
        notes: note
      },
      include: { business: true }
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
      where: { businessId: { in: businessIds } },
      include: {
        business: true,
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } }
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
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } },
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
    // find current lawyer record for this user
    const lawyer = await getCurrentLawyer(req.user.id);
    if (!lawyer) return errorResponse(res, 403, 'Forbidden: not a lawyer', 'FORBIDDEN');

    const list = await prisma.consultation.findMany({
      where: { lawyerId: lawyer.idLawyer },
      include: { business: true },
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
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');

    const resolvedLawyerId = await resolveLawyerId(lawyerId);
    const data = {};
    if (resolvedLawyerId !== undefined) data.lawyerId = resolvedLawyerId;
    else data.lawyerId = null;

    const consult = await prisma.consultation.update({
      where: { id },
      data,
      include: {
        business: true,
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true, role: true } } } }
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
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');

    const consult = await prisma.consultation.findUnique({ where: { id } });
    if (!consult) return errorResponse(res, 404, 'Consultation not found', 'NOT_FOUND');

    // Only assigned lawyer may update status (or admin)
    const currentLawyer = await getCurrentLawyer(req.user.id);
    if (currentLawyer) {
      if (consult.lawyerId !== currentLawyer.idLawyer) {
        return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
      }
    } else if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: { status },
      include: {
        business: true,
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } }
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
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');

    const consult = await prisma.consultation.findUnique({ where: { id } });
    if (!consult) return errorResponse(res, 404, 'Consultation not found', 'NOT_FOUND');

    const currentLawyer = await getCurrentLawyer(req.user.id);
    if (!currentLawyer || consult.lawyerId !== currentLawyer.idLawyer) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const data = {};
    if (typeof notes === 'string') data.notes = notes;
    if (typeof status === 'string') data.status = status;

    const updated = await prisma.consultation.update({
      where: { id },
      data,
      include: {
        business: true,
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } }
      }
    });

    return successResponse(res, 200, 'Consultation result submitted successfully', updated);
  } catch (e) {
    next(e);
  }
}

async function uploadResultFile(req, res, next) {
  try {
    const consultationId = Number(req.params.consultationId);
    if (Number.isNaN(consultationId))
      return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');

    if (!req.file) return errorResponse(res, 400, 'No file uploaded', 'NO_FILE');

    const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!consultation) return errorResponse(res, 404, 'Consultation not found', 'NOT_FOUND');

    // Ensure uploader is assigned lawyer
    const currentLawyer = await getCurrentLawyer(req.user.id);
    if (!currentLawyer || consultation.lawyerId !== currentLawyer.idLawyer) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    // create FileResult and link to consultation via consultationId
    const fileResult = await prisma.fileResult.create({
      data: {
        businessId: consultation.businessId,
        filename: req.file.originalname || req.file.filename,
        url: req.file.filename || req.file.path || req.file.originalname,
        consultationId: consultation.id
      }
    });

    return successResponse(res, 201, 'Result file uploaded successfully', fileResult);
  } catch (err) {
    next(err);
  }
}

async function listFileResults(req, res, next) {
  try {
    const consultationId = Number(req.params.consultationId);
    if (Number.isNaN(consultationId)) return errorResponse(res, 400, 'Invalid consultation id', 'INVALID_ID');

    const files = await prisma.fileResult.findMany({
      where: { consultationId },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'Consultation result files fetched successfully', files);
  } catch (err) {
    next(err);
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
  uploadResultFile,
  listFileResults
};
