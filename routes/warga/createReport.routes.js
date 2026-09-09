// routes/report.routes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();

// Import controller
const reportController = require("../../controllers/warga/createReport.controller");

// Konfigurasi Multer Memory Storage
const upload = multer({
  storage: multer.memoryStorage(),
});

// Endpoint Kirim Laporan (Middleware multer dipasang di sini)
router.post("/", upload.single("image"), reportController.createReport);

module.exports = router;