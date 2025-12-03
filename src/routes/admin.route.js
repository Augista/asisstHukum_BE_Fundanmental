const express = require('express');
const router = express.Router();
const { assignUserToLawyer } = require('../controllers/admin.controller');
const { authenticate, authorizeRole } = require('../middleware/auth');

router.patch(
    '/user/:userId/set-lawyer',
    authenticate,
    authorizeRole(['ADMIN']),
    assignUserToLawyer
);

module.exports = router;
