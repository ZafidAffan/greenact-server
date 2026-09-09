// routes/adminAction.routes.js
const express = require("express");
const router = express.Router();
const adminActionController = require("../../controllers/admin/adminAction.controller");

// Endpoint Aksi Admin
router.put("/terima-laporan/:report_id", adminActionController.updateReportToForwarded);
router.get("/bukti-list", adminActionController.getBuktiList);
router.post("/verify-bukti", adminActionController.verifyBukti);

module.exports = router;