const express = require('express');
const router = express.Router();

// Sub-routers
const authRouter = require('./auth.route');
const adminRouter = require('./admin.route');
const businessRouter = require('./business.route');
const consultationRouter = require('./consultation.route');
const fileRouter = require('./file.route');

// Mount grouped routers under /api/*
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/business', businessRouter);
router.use('/consultations', consultationRouter);
router.use('/', fileRouter); // file routes already contain /business/:businessId/files & /files/...

module.exports = router;
