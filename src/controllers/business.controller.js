const prisma = require('../utils/prismaClient');
const { successResponse, errorResponse } = require('../utils/response');

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
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                }
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
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                },
                lawyer: {
                    select: {
                        idLawyer: true,
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                },
                permits: {
                    select: { id: true, filename: true, createdAt: true }
                },
                files: {
                    select: { id: true, filename: true, url: true, createdAt: true }
                },
                consultations: {
                    select: {
                        id: true,
                        status: true,
                        notes: true,
                        createdAt: true,
                        lawyer: {
                            select: {
                                idLawyer: true,
                                user: {
                                    select: { id: true, name: true, email: true }
                                }
                            }
                        }
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

        if (Number.isNaN(id)) {
            return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');
        }

        const business = await prisma.business.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                },
                lawyer: {
                    select: {
                        idLawyer: true,
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                },
                permits: {
                    select: { id: true, filename: true, createdAt: true }
                },
                files: {
                    select: { id: true, filename: true, url: true, createdAt: true }
                },
                consultations: {
                    include: {
                        lawyer: {
                            select: {
                                idLawyer: true,
                                user: {
                                    select: { id: true, name: true, email: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!business) {
            return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');
        }

        if (
            req.user.role === 'OWNER' &&
            business.ownerId !== req.user.id
        ) {
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

        if (Number.isNaN(id)) {
            return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');
        }
        const { name, nib } = req.body;

        const business = await prisma.business.findUnique({ where: { id } });

        if (!business) {
            return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');
        }

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
                owner: {
                    select: { id: true, name: true, email: true }
                },
                lawyer: {
                    select: {
                        idLawyer: true,
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
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

        if (Number.isNaN(id)) {
            return errorResponse(res, 400, 'Invalid business id', 'INVALID_ID');
        }

        await prisma.business.delete({ where: { id } });

        return successResponse(res, 200, 'Business deleted successfully');
    } catch (error) {
        next(error);
    }
}

async function assignBusiness(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { ownerId, lawyerId } = req.body;

        const data = {};
        if (ownerId !== undefined) data.ownerId = ownerId;
        if (lawyerId !== undefined) data.lawyerId = lawyerId;

        const business = await prisma.business.update({
            where: { id },
            data,
            include: {
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                },
                lawyer: {
                    select: {
                        idLawyer: true,
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                }
            }
        });

        return successResponse(res, 200, 'Business assignment updated successfully', business);
    } catch (error) {
        next(error);
    }
}

async function uploadPermit(req, res, next) {
    try {
        const businessId = Number(req.params.id);

        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded', 'NO_FILE');
        }

        const business = await prisma.business.findUnique({ where: { id: businessId } });

        if (!business) {
            return errorResponse(res, 404, 'Business not found', 'NOT_FOUND');
        }

        if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
            return errorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
        }

        const permit = await prisma.permit.create({
            data: {
                businessId,
                filename: req.file.filename
            }
        });

        return successResponse(res, 201, 'Permit uploaded successfully', permit);
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

        if (!permit || permit.businessId !== businessId) {
            return errorResponse(res, 404, 'Permit not found', 'NOT_FOUND');
        }

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

async function listAllBusinesses(req, res, next) {
    try {
        const businesses = await prisma.business.findMany({
            include: {
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                },
                lawyer: {
                    select: {
                        idLawyer: true,
                        user: {
                            select: { id: true, name: true, email: true, role: true }
                        }
                    }
                },
                permits: true
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
    uploadPermit,
    removePermit,
    listAllBusinesses
};
