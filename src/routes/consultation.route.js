const express = require('express');
const router = express.Router();

const consultCtrl = require('../controllers/consultation.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { requireOwner } = require('../middleware/owner');
const { isLawyer } = require('../middleware/lawyer');
const { validate } = require('../middleware/validate');
const {
  consultationSchema,
  consultationAssignSchema,
  consultationStatusSchema,
  consultationResultSchema
} = require('../validation/schema');
const { upload } = require('../services/storage');

// Owner creates consultation
router.post(
  '/',
  authenticate,
  requireOwner, // Block admins and lawyers
  validate(consultationSchema),
  consultCtrl.createConsultation
);

router.get(
  '/admin',
  authenticate,
  authorizeRole(['admin']),
  consultCtrl.listAllConsultations
);

// Lawyer lists their consultations
router.get(
  '/lawyer',
  authenticate,
  isLawyer, // Block admins and owners
  consultCtrl.listLawyerConsultations
);

// Lawyer submits result
router.patch(
  '/:id/result',
  authenticate,
  isLawyer, // Block admins and owners
  validate(consultationResultSchema),
  consultCtrl.submitResult
);

// Lawyer uploads result file
router.post(
  '/:consultationId/result-file',
  authenticate,
  isLawyer,
  upload.single('file'),
  consultCtrl.uploadResultFile
);

// List consultation result files( admin boleh, lawyer hanya file miliknya)
router.get(
  '/:consultationId/files',
  authenticate,
  authorizeRole(['lawyer', 'admin']),
  consultCtrl.listFileResults
);


// Owner lists their consultations
router.get(
  '/my',
  authenticate,
  requireOwner, // Block admins and lawyers
  consultCtrl.listMyConsultations
);

router.patch(
  '/:id/assign',
  authenticate,
  authorizeRole(['admin']),
  validate(consultationAssignSchema),
  consultCtrl.assignLawyer
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRole(['lawyer', 'admin']),
  validate(consultationStatusSchema),
  consultCtrl.updateStatus
);

module.exports = router;


