// routes/wargaProfile.routes.js
const express = require('express');
const router = express.Router();
const wargaProfileController = require('../../controllers/warga/wargaProfile.controller');

// GET endpoint profil user
router.get('/', wargaProfileController.getUserProfile);

module.exports = router;