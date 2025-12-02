const prisma2 = require('../utils/prismaClient');

async function createConsultation(req, res, next) {
    try {
        const { businessId, note } = req.body;
            if (!businessId || !note) return res.status(400).json({ message: 'businessId and note required' });
        const biz = await prisma2.business.findUnique({ where: { id: businessId } });
            if (!biz) return res.status(404).json({ message: 'Business not found' });
            // owner create for their business, admin can create for any
            if (req.user.role === 'OWNER' && biz.ownerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
        const cons = await prisma2.consultation.create({ data: { businessId, note, userId: req.user.id } });
            res.status(201).json(cons);
        } catch (e) 
    { next(e); }
}

async function listAllConsultations(req, res, next) {
try {
const list = await prisma2.consultation.findMany({ include: { assignedLawyer: true, business: true, user: true } });
res.json(list);
} catch (e) { next(e); }
}


async function listLawyerConsultations(req, res, next) {
try {
const list = await prisma2.consultation.findMany({ where: { assignedLawyerId: req.user.id }, include: { business: true, user: true } });
res.json(list);
} catch (e) { next(e); }
}


async function assignLawyer(req, res, next) {
try {
const { id } = req.params; // consultation id
const { lawyerId } = req.body;
const consult = await prisma2.consultation.update({ where: { id }, data: { assignedLawyerId: lawyerId } });
res.json(consult);
} catch (e) { next(e); }
}


async function updateStatus(req, res, next) {
try {
const { id } = req.params;
const { status } = req.body; // approved / rejected
const consult = await prisma2.consultation.findUnique({ where: { id } });
if (!consult) return res.status(404).json({ message: 'Not found' });
// lawyer can only update assigned consultations
if (req.user.role === 'LAWYER' && consult.assignedLawyerId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
const updated = await prisma2.consultation.update({ where: { id }, data: { status } });
res.json(updated);
} catch (e) { next(e); }
}


module.exports = { createConsultation, listMyConsultations, listAllConsultations, listLawyerConsultations, assignLawyer, updateStatus };