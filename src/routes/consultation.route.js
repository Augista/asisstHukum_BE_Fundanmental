const express = require('express');
const router = express.Router();

const consultCtrl = require('../controllers/consultation.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  consultationSchema,
  consultationAssignSchema,
  consultationStatusSchema,
  consultationResultSchema
} = require('../validation/schema');
const { upload } = require('../services/storage');

router.post(
  '/',
  authenticate,
  authorizeRole(['owner']),
  validate(consultationSchema),
  consultCtrl.createConsultation
);

router.get(
  '/admin',
  authenticate,
  authorizeRole(['admin']),
  consultCtrl.listAllConsultations
);

router.get(
  '/lawyer',
  authenticate,
  authorizeRole(['lawyer']),
  consultCtrl.listLawyerConsultations
);

router.patch(
  '/:id/result',
  authenticate,
  authorizeRole(['lawyer']),
   validate(consultationResultSchema),
  consultCtrl.submitResult
);

router.post(
  '/:id/result-file',
  authenticate,
  authorizeRole(['lawyer']),
  upload.single('file'),
  consultCtrl.uploadResultFile
);

router.get(
  '/my',
  authenticate,
  authorizeRole(['owner']),
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


