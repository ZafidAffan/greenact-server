// routes/wilayah.routes.js
const express = require("express");
const router = express.Router();
const wilayahController = require("../../controllers/warga/wilayah.controller");

// Endpoint Wilayah
router.get("/kecamatan", wilayahController.getAllKecamatan);
router.get("/desa", wilayahController.getAllDesa);
router.get("/desa/:kecamatan_id", wilayahController.getDesaByKecamatan);

module.exports = router;