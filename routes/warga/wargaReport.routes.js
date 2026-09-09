// routes/wargaReports.routes.js
const express = require("express");
const router = express.Router();
const wargaReportsController = require("../../controllers/warga/wargaReport.controller");

// Endpoint GET riwayat laporan warga
router.get("/", wargaReportsController.getMyReports);

module.exports = router;