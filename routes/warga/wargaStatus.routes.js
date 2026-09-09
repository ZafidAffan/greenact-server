// routes/wargaStatus.routes.js
const express = require('express');
const router = express.Router();
const wargaStatusController = require('../../controllers/warga/wargaStatus.controller');

// GET endpoint status laporan warga
router.get('/', wargaStatusController.getReportStatusSummary);

module.exports = router;