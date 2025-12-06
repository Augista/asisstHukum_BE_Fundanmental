// controllers/business.controller.js
const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Helper: normalize lawyerId input
 * Accepts either:
 *  - lawyerId = idLawyer (int)
 *  - lawyerId = userId (int)  -> will map to idLawyer if exists
 */
async function resolveLawyerId(inputId) {
  if (inputId === undefined || inputId === null) return undefined;
  const idNum = Number(inputId);
  if (Number.isNaN(idNum)) return undefined;

  // Try as idLawyer first
  let l = await prisma.lawyer.findUnique({ where: { idLawyer: idNum } });
  if (l) return l.idLawyer;

  // Try as userId
  l = await prisma.lawyer.findUnique({ where: { userId: idNum } });
  if (l) return l.idLawyer;

  return undefined;
}

async function createBusiness(req, res, next) {
  try {
    const { name, nib } = req.body;

    const business = await prisma.business.create({
      data: {
        name,
        nib,
        ownerId: req.user.id
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true, role: true } } } }
      }
    });

    return successResponse(res, 201, 'Business created successfully', business);
  } catch (error) {
    next(error);
  }
}

async function getMyBusinesses(req, res, next) {
  try {
    const businesses = await prisma.business.findMany({
      where: { ownerId: req.user.id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true, role: true } } } },
        permits: { select: { id: true, filename: true, url: true, createdAt: true } },
        files: { select: { id: true, filename: true, url: true, createdAt: true } },
        consultations: {
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
            lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'My businesses fetched successfully', businesses);
  } catch (error) {
    next(error);
  }
}

async function getBusiness(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true, role: true } } } },
        permits: { select: { id: true, filename: true, url: true, createdAt: true } },
        files: { select: { id: true, filename: true, url: true, createdAt: true } },
        consultations: {
          include: {
            lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } }
          }
        }
      }
    });

    if (!business) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    return successResponse(res, 200, 'Business detail fetched successfully', business);
  } catch (error) {
    next(error);
  }
}

async function updateBusiness(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    const { name, nib } = req.body;

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'You can only update your own business', 'FORBIDDEN');
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (nib !== undefined) data.nib = nib;

    const updated = await prisma.business.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true } } } }
      }
    });

    return successResponse(res, 200, 'Business updated successfully', updated);
  } catch (error) {
    next(error);
  }
}

async function deleteBusiness(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    await prisma.business.delete({ where: { id } });

    return successResponse(res, 200, 'Business deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * assignBusiness: ownerId and/or lawyerId
 * lawyerId can be idLawyer or userId (mapped)
 */
async function assignBusiness(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    const { ownerId, lawyerId } = req.body;

    const data = {};
    if (ownerId !== undefined) data.ownerId = ownerId;
    if (lawyerId !== undefined) {
      const resolved = await resolveLawyerId(lawyerId);
      if (resolved === undefined) {
        // If no mapping found, unset lawyer
        data.lawyerId = null;
      } else {
        data.lawyerId = resolved;
      }
    }

    const business = await prisma.business.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true, role: true } } } }
      }
    });

    return successResponse(res, 200, 'Business assignment updated successfully', business);
  } catch (error) {
    next(error);
  }
}

/* FileBusiness (upload/list/get/delete)*/
async function uploadFileBusiness(req, res, next) {
  try {
    const businessId = Number(req.params.id);
    if (Number.isNaN(businessId)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    if (!req.file) return errorResponse(res, 400, 'No file uploaded', 'NO_FILE');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const fileBusiness = await prisma.fileBusiness.create({
      data: {
        businessId,
        filename: req.file.originalname || req.file.filename,
        url: req.file.filename || req.file.path || req.file.originalname
      }
    });

    return successResponse(res, 201, 'File uploaded successfully', fileBusiness);
  } catch (error) {
    next(error);
  }
}

async function removeFileBusiness(req, res, next) {
  try {
    const businessId = Number(req.params.businessId);
    const fileId = Number(req.params.fileId);
    if (Number.isNaN(businessId) || Number.isNaN(fileId)) {
      return errorResponse(res, 400, 'Invalid businessId or fileId', 'INVALID_ID');
    }

    const file = await prisma.fileBusiness.findUnique({ where: { id: fileId } });
    if (!file || file.businessId !== businessId) return errorResponse(res, 404, 'File not found', 'NOT_FOUND');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    await prisma.fileBusiness.delete({ where: { id: fileId } });

    return successResponse(res, 200, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
}

async function getFileBusiness(req, res, next) {
  try {
    const fileId = Number(req.params.fileId);
    if (Number.isNaN(fileId)) return errorResponse(res, 400, 'Invalid fileId', 'INVALID_ID');

    const file = await prisma.fileBusiness.findUnique({ where: { id: fileId } });
    if (!file) return errorResponse(res, 404, 'File not found', 'NOT_FOUND');

    const business = await prisma.business.findUnique({ where: { id: file.businessId } });
    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    return successResponse(res, 200, 'File fetched successfully', file);
  } catch (error) {
    next(error);
  }
}

async function listFilesBusiness(req, res, next) {
  try {
    const businessId = Number(req.params.id);
    if (Number.isNaN(businessId)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const files = await prisma.fileBusiness.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'Files fetched successfully', files);
  } catch (error) {
    next(error);
  }
}

/* Permit */
async function uploadPermit(req, res, next) {
  try {
    const businessId = Number(req.params.id);
    if (Number.isNaN(businessId)) return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');

    if (!req.file) return errorResponse(res, 400, 'No file uploaded', 'NO_FILE');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const permit = await prisma.permit.create({
      data: {
        businessId,
        filename: req.file.originalname || req.file.filename,
        url: req.file.filename || req.file.path || req.file.originalname
      }
    });

    return successResponse(res, 201, 'Permit uploaded successfully', permit);
  } catch (error) {
    next(error);
  }
}

async function listPermitsBusiness(req, res, next) {
  try {
    const businessId = Number(req.params.id);
    if (Number.isNaN(businessId)) return errorResponse(res, 400, 'Invalid businessId', 'INVALID_ID');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');

    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    const permits = await prisma.permit.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'Permits fetched successfully', permits);
  } catch (error) {
    next(error);
  }
}

async function getPermit(req, res, next) {
  try {
    const permitId = Number(req.params.permitId);
    if (Number.isNaN(permitId)) return errorResponse(res, 400, 'Invalid permitId', 'INVALID_ID');

    const permit = await prisma.permit.findUnique({ where: { id: permitId } });
    if (!permit) return errorResponse(res, 404, 'Permit not found', 'NOT_FOUND');

    const business = await prisma.business.findUnique({ where: { id: permit.businessId } });
    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    return successResponse(res, 200, 'Permit fetched successfully', permit);
  } catch (error) {
    next(error);
  }
}

async function removePermit(req, res, next) {
  try {
    const businessId = Number(req.params.businessId);
    const permitId = Number(req.params.permitId);
    if (Number.isNaN(businessId) || Number.isNaN(permitId)) {
      return errorResponse(res, 400, 'Invalid businessId or permitId', 'INVALID_ID');
    }

    const permit = await prisma.permit.findUnique({ where: { id: permitId } });
    if (!permit || permit.businessId !== businessId) return errorResponse(res, 404, 'Permit not found', 'NOT_FOUND');

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
      return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    await prisma.permit.delete({ where: { id: permitId } });

    return successResponse(res, 200, 'Permit deleted successfully');
  } catch (error) {
    next(error);
  }
}

/* ========== List all businesses (admin) ========== */
async function listAllBusinesses(req, res, next) {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        lawyer: { select: { idLawyer: true, user: { select: { id: true, name: true, email: true, role: true } } } },
        permits: true,
        files: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return successResponse(res, 200, 'All businesses fetched successfully', businesses);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  assignBusiness,
  uploadFileBusiness,
  removeFileBusiness,
  getFileBusiness,
  listFilesBusiness,
  uploadPermit,
  listPermitsBusiness,
  getPermit,
  removePermit,
  listAllBusinesses
};
