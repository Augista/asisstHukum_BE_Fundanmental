const express = require('express');
const router = express.Router();

const businessCtrl = require('../controllers/business.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { businessSchema, businessUpdateSchema } = require('../validation/schema');
const { upload } = require('../services/storage');

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

// Owner: get their own businesses
router.get(
  '/my',
  authenticate,
  authorizeRole(['OWNER']),
  businessCtrl.getMyBusinesses
);

// Admin: list all businesses
router.get(
  '/all',
  authenticate,
  authorizeRole(['ADMIN']),
  businessCtrl.listAllBusinesses
);

module.exports = router;


