const express = require('express');
const router = express.Router();

const authRouter = require('./auth.route');
const adminRouter = require('./admin.route');
const businessRouter = require('./business.route');
const consultationRouter = require('./consultation.route');
const fileRouter = require('./file.route');

router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/business', businessRouter);
router.use('/consultations', consultationRouter);
router.use('/', fileRouter);

module.exports = router;
