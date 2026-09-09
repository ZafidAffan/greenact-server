// routes/adminAuth.routes.js
const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/auth/adminAuth.controller');

// Endpoint Auth Admin
router.post('/register', adminAuthController.registerAdmin);
router.post('/login', adminAuthController.loginAdmin);
router.get('/me', adminAuthController.checkAdminSession);

module.exports = router;