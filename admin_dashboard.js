// admin_dashboard.js
const express = require('express');
const path = require('path');
const pool = require('./db_promise_asyncawait'); // koneksi MySQL

const router = express.Router();

/**
 * =========================
 * Middleware cek login admin
 * =========================
 */
function isAdminLoggedIn(req, res, next) {
  // Jika session admin_id tidak ada, redirect ke halaman login
  if (!req.session || !req.session.admin_id) {
    return res.redirect('/admin_login.html');
  }
  next();
}

/**
 * =========================
 * Route serve HTML dashboard
 * =========================
 */
router.get('/dashboard', isAdminLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});

/**
 * =========================
 * Route API dashboard-data
 * =========================
 */
router.get('/dashboard-data', async (req, res) => {
  // ======== Opsi sementara ========
  // Jika ingin bypass login untuk testing di Vercel
  // return res.json({ success: true, pending: 5, proses: 3, selesai: 7 });

  try {
    const conn = await pool.getConnection();

    // Ambil jumlah laporan berdasarkan status
    const [pending] = await conn.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'pending'");
    const [proses]  = await conn.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'diterima'");
    const [selesai] = await conn.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'selesai'");

    conn.release();

    res.json({
      success: true,
      pending: pending[0].count,
      proses: proses[0].count,
      selesai: selesai[0].count
    });
  } catch (err) {
    console.error('Error fetch dashboard data:', err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
});

module.exports = router;
