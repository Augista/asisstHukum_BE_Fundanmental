const express = require('express');
const router = express.Router();
const fs = require('fs');

const fileCtrl = require('../controllers/file.controller');
const businessCtrl = require('../controllers/business.controller');
const consultCtrl = require('../controllers/consultation.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { upload } = require('../services/storage');

// ------------------- FileBusiness -------------------

// Upload fileBusiness
router.post(
  '/business/:id/files', // sesuai controller uploadFileBusiness(req.params.id)
  authenticate,
  authorizeRole(['OWNER', 'ADMIN']),
  upload.single('file'),
  businessCtrl.uploadFileBusiness
);

// List filesBusiness
router.get(
  '/business/:id/files', // sesuai controller listFilesBusiness(req.params.id)
  authenticate,
  authorizeRole(['OWNER', 'ADMIN', 'LAWYER']),
  businessCtrl.listFilesBusiness
);

// Get single fileBusiness
router.get(
  '/business/:businessId/files/:fileId',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN', 'LAWYER']),
  businessCtrl.getFileBusiness
);

// Download fileBusiness
router.get(
  '/business/files/:fileId/download',
  authenticate,
  fileCtrl.downloadFileBusiness
);

// Delete fileBusiness
router.delete(
  '/business/:businessId/files/:fileId', // sesuai removeFileBusiness
  authenticate,
  authorizeRole(['OWNER', 'ADMIN']),
  businessCtrl.removeFileBusiness
);

// ------------------- Permit -------------------

// Upload permit
router.post(
  '/business/:id/permits',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN']),
  upload.single('file'),
  businessCtrl.uploadPermit
);

// List permits for a business
router.get(
  '/business/:id/permits',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN', 'LAWYER']),
  businessCtrl.listPermitsBusiness
);

// Get single permit
router.get(
  '/business/:businessId/permits/:permitId',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN', 'LAWYER']),
  businessCtrl.getPermit
);

// Download permit
router.get(
  '/permits/:id/download',
  authenticate,
  fileCtrl.downloadPermit
);

// Delete permit
router.delete(
  '/business/:businessId/permits/:permitId', // sesuai removePermit
  authenticate,
  authorizeRole(['OWNER', 'ADMIN']),
  businessCtrl.removePermit
);

// ------------------- FileResult (Consultation) -------------------

// Upload fileResult (by lawyer for a consultation)
router.post(
  '/consultations/:consultationId/result-file',
  authenticate,
  authorizeRole(['LAWYER', 'ADMIN']),
  upload.single('file'),
  consultCtrl.uploadResultFile
);


// List fileResults for a consultation
router.get(
  '/consultations/:consultationId/results',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN', 'LAWYER']),
  consultCtrl.listFileResults
);

// Download fileResult
router.get(
  '/results/:fileId/download',
  authenticate,
  fileCtrl.downloadFileResult
);

// Delete fileResult
router.delete(
  '/results/:fileId',
  authenticate,
  authorizeRole(['LAWYER', 'ADMIN']),
  fileCtrl.deleteFileResult
);

module.exports = router;
