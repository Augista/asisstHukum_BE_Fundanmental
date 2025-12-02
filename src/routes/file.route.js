const express = require('express');
const router = express.Router();

const fileCtrl = require('../controllers/file.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { upload } = require('../services/storage');

// Upload file for business
router.post(
  '/business/:businessId/files',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN']),
  upload.single('file'),
  fileCtrl.uploadFile
);

// Get files for a business
router.get(
  '/business/:businessId/files',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN', 'LAWYER']),
  fileCtrl.getBusinessFiles
);

// Download specific file
router.get(
  '/files/:id/download',
  authenticate,
  fileCtrl.downloadFile
);

// Delete file
router.delete(
  '/files/:id',
  authenticate,
  authorizeRole(['OWNER', 'ADMIN']),
  fileCtrl.deleteFile
);

module.exports = router;
