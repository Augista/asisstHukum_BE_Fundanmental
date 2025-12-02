const prisma = require('../utils/prismaClient');

// Create new business (OWNER only)
async function createBusiness(req, res, next) {
    try {
        const { name, nib } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Business name is required'
            });
        }

        // Owner creates business for themselves
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

        res.status(201).json({
            success: true,
            message: 'Business created successfully',
            data: business
        });
    } catch (error) {
        next(error);
    }
}

// Get businesses owned by current user
async function getMyBusinesses(req, res, next) {
    try {
        const businesses = await prisma.business.findMany({
            where: { ownerId: req.user.id },
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                },
                lawyer: {
                    select: { id: true, name: true, email: true }
                },
                permits: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            message: 'My businesses fetched successfully',
            data: businesses
        });
    } catch (error) {
        next(error);
    }
}

// Get single business by ID
async function getBusiness(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid business id'
            });
        }

        const business = await prisma.business.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                },
                lawyer: {
                    select: { id: true, name: true, email: true, role: true }
                },
                permits: true,
                consultations: {
                    include: {
                        lawyer: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Check authorization - owner can view their business, admin can view any
        if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        res.json({
            success: true,
            message: 'Business detail fetched successfully',
            data: business
        });
    } catch (error) {
        next(error);
    }
}

// Update business (OWNER of the business can update)
async function updateBusiness(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid business id'
            });
        }
        const { name, nib } = req.body;

        // Check if business exists and user owns it
        const business = await prisma.business.findUnique({ where: { id } });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        if (business.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - You can only update your own business'
            });
        }

        // Update only provided fields
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
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Business updated successfully',
            data: updated
        });
    } catch (error) {
        next(error);
    }
}

// Delete business (ADMIN only)
async function deleteBusiness(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (Number.isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid business id'
            });
        }

        // Only admin can delete (checked by route middleware)
        await prisma.business.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Business deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

// Assign business to owner or lawyer (ADMIN only)
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
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Business assignment updated successfully',
            data: business
        });
    } catch (error) {
        next(error);
    }
}

// Upload permit for business
async function uploadPermit(req, res, next) {
    try {
        const businessId = Number(req.params.id); // business id

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const business = await prisma.business.findUnique({ where: { id: businessId } });

        if (!business) {
            return res.status(404).json({
                success: false,
                message: 'Business not found'
            });
        }

        // Owner can only upload for their business, admin can upload for any
        if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const permit = await prisma.permit.create({
            data: {
                businessId,
                filename: req.file.filename
            }
        });

        res.status(201).json({
            success: true,
            message: 'Permit uploaded successfully',
            data: permit
        });
    } catch (error) {
        next(error);
    }
}

// Remove permit from business
async function removePermit(req, res, next) {
    try {
        const businessId = Number(req.params.businessId);
        const permitId = Number(req.params.permitId);

        if (Number.isNaN(businessId) || Number.isNaN(permitId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid businessId or permitId'
            });
        }

        const permit = await prisma.permit.findUnique({ where: { id: permitId } });

        if (!permit || permit.businessId !== businessId) {
            return res.status(404).json({
                success: false,
                message: 'Permit not found'
            });
        }

        // Check business ownership
        const business = await prisma.business.findUnique({ where: { id: businessId } });

        if (req.user.role === 'OWNER' && business.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        await prisma.permit.delete({ where: { id: permitId } });

        res.json({
            success: true,
            message: 'Permit deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

// List all businesses (ADMIN only)
async function listAllBusinesses(req, res, next) {
    try {
        const businesses = await prisma.business.findMany({
            include: {
                owner: {
                    select: { id: true, name: true, email: true, role: true }
                },
                lawyer: {
                    select: { id: true, name: true, email: true, role: true }
                },
                permits: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            message: 'All businesses fetched successfully',
            data: businesses
        });
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
