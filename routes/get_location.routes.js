// routes/location.routes.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/get_location.controller');

// GET endpoint untuk lokasi
router.get('/', locationController.getLocations);

module.exports = router;