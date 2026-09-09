// routes/adminTask.routes.js
const express = require("express");
const router = express.Router();
const adminTaskController = require("../../controllers/admin/adminTask.controller");

router.get("/tugas", adminTaskController.getAdminTugas);
router.post("/confirm-tugas", adminTaskController.confirmTask);
router.get("/bukti-list", adminTaskController.getBuktiList);
router.post("/verify-bukti", adminTaskController.verifyBukti);
router.post("/assign-task", adminTaskController.assignTaskToPetugas);
router.get("/get-petugas", adminTaskController.getPetugasList);

module.exports = router;