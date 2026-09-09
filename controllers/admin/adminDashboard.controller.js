// controllers/adminDashboard.controller.js
const path = require('path');
const pool = require('../../config/db'); // Sesuaikan dengan file koneksi database-mu

// 1. Middleware Cek Login Admin
const isAdminLoggedIn = (req, res, next) => {
  // Menyesuaikan dengan struktur session yang kita buat sebelumnya (req.session.user.role === 'admin')
  // Atau fallback ke req.session.admin_id sesuai kode aslimu
  if (!req.session || (!req.session.user && !req.session.admin_id)) {
    return res.status(401).json({ success: false, message: "Unauthorized: Silakan login terlebih dahulu" });
    // Atau jika berbasis web HTML murni: return res.redirect('/admin_login.html');
  }
  next();
};

// 2. Controller Serve HTML Dashboard
const getDashboardPage = (req, res) => {
  // Mengarahkan ke file html di folder public (sesuaikan path relatifnya dari folder controllers)
  res.sendFile(path.join(__dirname, '../public', 'admin_dashboard.html'));
};

// 3. Controller Ambil Data Statistik Dashboard
const getDashboardData = async (req, res) => {
  try {
    // Memastikan koneksi pool menggunakan promise
    const dbPool = pool.promise ? pool.promise() : pool;

    // Ambil jumlah laporan berdasarkan status secara paralel agar lebih cepat
    const [pendingRows] = await dbPool.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'pending'");
    const [prosesRows]  = await dbPool.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'diterima'");
    const [selesaiRows] = await dbPool.query("SELECT COUNT(*) AS count FROM reports WHERE status = 'selesai'");

    res.json({
      success: true,
      pending: pendingRows[0].count,
      proses: prosesRows[0].count,
      selesai: selesaiRows[0].count
    });
  } catch (err) {
    console.error('Error fetch dashboard data:', err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server", detail: err.message });
  }
};

module.exports = {
  isAdminLoggedIn,
  getDashboardPage,
  getDashboardData,
};