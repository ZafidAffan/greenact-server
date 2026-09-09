// routes/kadesAuth.routes.js
const express = require("express");
const router = express.Router();
const kadesAuthController = require("../../controllers/auth/kadesAuth.controller");

// Endpoint Auth Kepala Desa
router.post("/register", kadesAuthController.registerKades);
router.post("/login", kadesAuthController.loginKades);

module.exports = router;