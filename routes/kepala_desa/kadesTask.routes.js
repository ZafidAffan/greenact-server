// routes/kades/kadesTask.routes.js
const express = require("express");
const router = express.Router();
const kadesController = require("../../controllers/KepalaDesa/kadesTask.controller");

router.get("/laporan-siap-jadwal/:desa", kadesController.getLaporanSiapJadwal);
router.post("/buat-jadwal", kadesController.buatJadwal);
router.put("/jadwal/:id/status", kadesController.updateJadwalStatus);
router.get("/jadwal/:desa", kadesController.getJadwalPerDesa);
router.put("/jadwal/:id/selesai", kadesController.completeJadwalWithPhoto);

module.exports = router;