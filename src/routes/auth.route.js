const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/schema');

// POST /api/auth/register
router.post('/register', validate(registerSchema), authCtrl.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authCtrl.login);

module.exports = router;


