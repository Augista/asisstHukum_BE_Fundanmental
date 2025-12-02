const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth.controller');
const businessCtrl = require('../controllers/business.controller');
const consultCtrl = require('../controllers/consultation.controller');

const { authenticate, authorizeRole } = require('../middlewares/auth');
const { upload } = require('../services/storage');

// AUTH
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);

// =======================
// BUSINESS ROUTES
// =======================

// Owner creates business
router.post('/business',
    authenticate,
    authorizeRole(['owner']),
    businessCtrl.createBusiness
);

// Owner or Admin can view business
router.get('/business/:id',
    authenticate,
    authorizeRole(['owner', 'admin']),
    businessCtrl.getBusiness
);

// Owner only updates own business
router.put('/business/:id',
    authenticate,
    authorizeRole(['owner']),
    businessCtrl.updateBusiness
);

// Admin only deletes any business
router.delete('/business/:id',
    authenticate,
    authorizeRole(['admin']),
    businessCtrl.deleteBusiness
);

// Admin assigns business → owner / lawyer
router.patch('/business/:id/assign',
    authenticate,
    authorizeRole(['admin']),
    businessCtrl.assignBusiness
);

// Upload legal permit (Owner & Admin)
router.post('/business/:id/permit',
    authenticate,
    authorizeRole(['owner', 'admin']),
    upload.single('file'),
    businessCtrl.uploadPermit
);

router.delete('/business/:id/permit/:permitId',
    authenticate,
    authorizeRole(['owner', 'admin']),
    businessCtrl.removePermit
);

// =======================
// CONSULTATION ROUTES
// =======================

// Owner creates consultation request
router.post('/consultations',
    authenticate,
    authorizeRole(['owner']),
    consultCtrl.createConsultation
);

// Admin: list all
router.get('/consultations/admin',
    authenticate,
    authorizeRole(['admin']),
    consultCtrl.listAllConsultations
);

// Lawyer: list only assigned consultations
router.get('/consultations/lawyer',
    authenticate,
    authorizeRole(['lawyer']),
    consultCtrl.listLawyerConsultations
);

// Owner: list consultations for their business
router.get('/consultations/my',
    authenticate,
    authorizeRole(['owner']),
    consultCtrl.listMyConsultations
);

// Admin assign consultation → Lawyer
router.patch('/consultations/:id/assign',
    authenticate,
    authorizeRole(['admin']),
    consultCtrl.assignLawyer
);

// Lawyer or Admin set status (approve/reject)
router.patch('/consultations/:id/status',
    authenticate,
    authorizeRole(['lawyer', 'admin']),
    consultCtrl.updateStatus
);

module.exports = router;
