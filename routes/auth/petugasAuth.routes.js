// routes/petugasAuth.routes.js
const express = require("express");
const router = express.Router();
const petugasAuthController = require("../../controllers/auth/petugasAuth.controller");

// Endpoint Autentikasi Petugas
router.post("/register", petugasAuthController.registerPetugas);
router.post("/login", petugasAuthController.loginPetugas);

module.exports = router;