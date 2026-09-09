// controllers/adminReport.controller.js
const pool = require('../../config/db'); // Sesuaikan dengan file koneksi MySQL-mu
const redisClient = require('../../config/redisClient'); // Import client Redis

const CACHE_KEY = "all_admin_reports";
const CACHE_TTL = 300; // TTL 5 menit (300 detik)

// 1. Controller Ambil Semua Laporan untuk Admin (dengan Redis Cache)
const getAllAdminReports = async (req, res) => {
  try {
    // Pastikan pool menggunakan promise
    const dbPool = pool.promise ? pool.promise() : pool;

    // 1. Cek apakah ada di Redis Cache
    const cachedData = await redisClient.get(CACHE_KEY);
    if (cachedData) {
      console.log("⚡ [Redis Cache Hit] Mengambil laporan admin dari Redis.");
      return res.json(JSON.parse(cachedData));
    }

    // 2. Jika tidak ada, ambil dari Database MySQL
    const [rows] = await dbPool.query("SELECT * FROM reports ORDER BY created_at DESC");

    console.log("📥 [Redis Cache Miss] Mengambil data admin dari Database MySQL.");

    // Tambahkan fallback address supaya tidak kosong
    const formattedRows = rows.map(r => ({
      ...r,
      address: r.address || `Lat: ${r.latitude}, Lng: ${r.longitude}`
    }));

    // 3. Simpan ke Redis Cache (Dilengkapi TTL 300 detik)
    await redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(formattedRows));

    return res.json(formattedRows);
  } catch (err) {
    console.error("Error ambil laporan:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// 2. Fungsi Helper untuk Invalidasi Cache Redis
const invalidateAdminCache = async () => {
  try {
    await redisClient.del(CACHE_KEY);
    console.log("🧹 [Redis] Cache admin berhasil dibersihkan (Invalidated).");
  } catch (err) {
    console.error("Gagal membersihkan cache Redis:", err.message);
  }
};

module.exports = {
  getAllAdminReports,
  invalidateAdminCache,
};