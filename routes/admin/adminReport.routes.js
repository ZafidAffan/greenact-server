// routes/adminReport.routes.js
const express = require("express");
const router = express.Router();
const adminReportController = require("../../controllers/admin/adminReport.controller");

// Endpoint GET laporan admin
router.get("/laporan", adminReportController.getAllAdminReports);

// Ekspor router dan juga fungsi invalidateAdminCache agar bisa dipakai di modul lain (misal saat update status laporan)
module.exports = {
  router,
  invalidateAdminCache: adminReportController.invalidateAdminCache,
};


module.exports = router;