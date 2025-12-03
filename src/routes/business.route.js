const express = require('express');
const router = express.Router();

const businessCtrl = require('../controllers/business.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
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
  authorizeRole(['owner']),
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
  authorizeRole(['owner']),
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
  authorizeRole(['owner']),
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

// Upload legal permit (Owner & Admin)
router.post(
  '/:id/permit',
  authenticate,
  authorizeRole(['owner', 'admin']),
  upload.single('file'),
  businessCtrl.uploadPermit
);

// Remove permit
router.delete(
  '/:businessId/permit/:permitId',
  authenticate,
  authorizeRole(['owner', 'admin']),
  businessCtrl.removePermit
);

module.exports = router;
