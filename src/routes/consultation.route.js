const express = require('express');
const router = express.Router();

const consultCtrl = require('../controllers/consultation.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { consultationSchema } = require('../validation/schema');

// Owner creates consultation request
router.post(
  '/',
  authenticate,
  authorizeRole(['owner']),
  validate(consultationSchema),
  consultCtrl.createConsultation
);

// Admin: list all
router.get(
  '/admin',
  authenticate,
  authorizeRole(['admin']),
  consultCtrl.listAllConsultations
);

// Lawyer: list only assigned consultations
router.get(
  '/lawyer',
  authenticate,
  authorizeRole(['lawyer']),
  consultCtrl.listLawyerConsultations
);

// Owner: list consultations for their business
router.get(
  '/my',
  authenticate,
  authorizeRole(['owner']),
  consultCtrl.listMyConsultations
);

// Admin assign consultation → Lawyer
router.patch(
  '/:id/assign',
  authenticate,
  authorizeRole(['admin']),
  consultCtrl.assignLawyer
);

// Lawyer or Admin set status (approve/reject)
router.patch(
  '/:id/status',
  authenticate,
  authorizeRole(['lawyer', 'admin']),
  consultCtrl.updateStatus
);

module.exports = router;


