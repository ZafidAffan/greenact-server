// routes/wargaAuth.routes.js
const express = require('express');
const router = express.Router();
const wargaAuthController = require('../../controllers/auth/wargaAuth.controller');

// Endpoint Auth Warga
router.post('/register', wargaAuthController.registerWarga);
router.post('/login', wargaAuthController.loginWarga);

module.exports = router;