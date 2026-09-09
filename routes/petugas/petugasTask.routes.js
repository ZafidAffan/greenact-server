// routes/taskAction.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const petugasTaskActionController = require("../../controllers/Petugas/petugasTask.controller");

// Konfigurasi Multer (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
});

// Endpoint POST /confirm-done untuk Petugas
router.post("/confirm-done", upload.single("image"), petugasTaskActionController.confirmDoneTask);

// Endpoint GET tugas petugas
router.get("/tugas", petugasTaskActionController.getPetugasTasks);

// Endpoint GET status bertugas petugas
router.get("/tugas-status", petugasTaskActionController.getPetugasTaskStatus);

// Endpoint baru untuk upload bukti tugas (POST /petugas/upload-bukti)
router.post("/upload-bukti", upload.single("bukti"),  petugasTaskActionController.uploadBuktiTugas);

module.exports = router;