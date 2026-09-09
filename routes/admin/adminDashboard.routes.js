// routes/adminDashboard.routes.js
const express = require('express');
const router = express.Router();
const adminDashboardController = require('../../controllers/admin/adminDashboard.controller');

// Endpoint Dashboard Admin
router.get('/dashboard', adminDashboardController.isAdminLoggedIn, adminDashboardController.getDashboardPage);
router.get('/dashboard-data', adminDashboardController.getDashboardData);

module.exports = router;