const express = require('express');
const router = express.Router();

const businessCtrl = require('../controllers/business.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { requireOwner } = require('../middleware/owner');
const { validate } = require('../middleware/validate');
const {
  businessSchema,
  businessUpdateSchema,
  businessAssignSchema
} = require('../validation/schema');
const { upload } = require('../services/storage');

// Owner: get their own businesses (MUST be before :id!)
router.get(
  '/my',
  authenticate,
  requireOwner, // Block admins and lawyers
  businessCtrl.getMyBusinesses
);

// Admin: list all businesses (MUST be before :id!)
router.get(
  '/all',
  authenticate,
  authorizeRole(['admin']),
  businessCtrl.listAllBusinesses
);

// Owner creates business
router.post(
  '/',
  authenticate,
  requireOwner, // Block admins and lawyers
  validate(businessSchema),
  businessCtrl.createBusiness
);

// Owner or Admin can view business
router.get(
  '/:id',
  authenticate,
  authorizeRole(['owner', 'admin']),
  businessCtrl.getBusiness
);

// Owner only updates own business
router.put(
  '/:id',
  authenticate,
  requireOwner, // Block admins and lawyers
  validate(businessUpdateSchema),
  businessCtrl.updateBusiness
);

// Admin only deletes any business
router.delete(
  '/:id',
  authenticate,
  authorizeRole(['admin']),
  businessCtrl.deleteBusiness
);

// Admin assigns business → owner / lawyer
router.patch(
  '/:id/assign',
  authenticate,
  authorizeRole(['admin']),
  validate(businessAssignSchema),
  businessCtrl.assignBusiness
);

// Upload legal permit (Owner only)
router.post(
  '/:id/permit',
  authenticate,
  requireOwner, // Block admins and lawyers
  upload.single('file'),
  businessCtrl.uploadPermit
);

// Remove permit (Owner only)
router.delete(
  '/:businessId/permit/:permitId',
  authenticate,
  requireOwner, // Block admins and lawyers
  businessCtrl.removePermit
);

module.exports = router;
