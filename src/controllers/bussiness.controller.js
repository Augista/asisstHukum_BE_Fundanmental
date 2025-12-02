const prisma = require('../utils/prismaClient');
async function deleteBusiness(req, res, next) {
try {
const { id } = req.params;
// only admin can delete
if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
await prisma.business.delete({ where: { id } });
res.json({ message: 'Deleted' });
} catch (e) { next(e); }
}


async function assignBusiness(req, res, next) {
try {
const { id } = req.params;
const { ownerId, lawyerId } = req.body; // admin provides either
const data = {};
if (ownerId) data.ownerId = ownerId;
if (lawyerId) data.lawyerId = lawyerId;
const biz = await prisma.business.update({ where: { id }, data });
res.json(biz);
} catch (e) { next(e); }
}


async function uploadPermit(req, res, next) {
try {
const { id } = req.params; // business id
if (!req.file) return res.status(400).json({ message: 'No file' });
const biz = await prisma.business.findUnique({ where: { id } });
if (!biz) return res.status(404).json({ message: 'Business not found' });
if (req.user.role === 'OWNER' && biz.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
const permit = await prisma.permit.create({ data: { businessId: id, filename: req.file.filename, type: req.body.type || 'general' } });
res.status(201).json(permit);
} catch (e) { next(e); }
}


async function removePermit(req, res, next) {
try {
const { businessId, permitId } = req.params;
const permit = await prisma.permit.findUnique({ where: { id: permitId } });
if (!permit || permit.businessId !== businessId) return res.status(404).json({ message: 'Not found' });
// owner or admin
const biz = await prisma.business.findUnique({ where: { id: businessId } });
if (req.user.role === 'OWNER' && biz.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
await prisma.permit.delete({ where: { id: permitId } });
res.json({ message: 'Deleted' });
} catch (e) { next(e); }
}


async function listAllBusinesses(req, res, next) {
try {
const list = await prisma.business.findMany({ include: { owner: true, lawyer: true } });
res.json(list);
} catch (e) { next(e); }
}


module.exports = { createBusiness, getMyBusinesses, getBusiness, updateBusiness, deleteBusiness, assignBusiness, uploadPermit, removePermit, listAllBusinesses };