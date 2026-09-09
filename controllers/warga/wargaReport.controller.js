// controllers/wargaReports.controller.js
const db = require("../../config/db");
const NodeCache = require("node-cache");

// Inisialisasi cache khusus user report dengan TTL (Time-To-Live) 60 detik
const reportCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Fungsi utama mengambil riwayat laporan user berdasarkan id
const getMyReports = (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({
      error: "user_id wajib diisi",
    });
  }

  const cacheKey = `user_reports_${userId}`;

  // 1. Cek Cache Backend
  if (reportCache.has(cacheKey)) {
    console.log(`⚡ [Cache Hit] Mengambil data report user ${userId} dari memori server.`);
    return res.status(200).json(reportCache.get(cacheKey));
  }

  // 2. Ambil dari Database MySQL
  const sql = `
    SELECT
      report_id,
      description,
      address,
      kecamatan,
      desa,
      status,
      img_url,
      created_at
    FROM reports
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({
        error: "Gagal mengambil data",
        detail: err.message,
      });
    }

    const reports = results.map(row => ({
      report_id: row.report_id,
      description: row.description,
      address: row.address,
      kecamatan: row.kecamatan,
      desa: row.desa,
      status: row.status,
      image_path: row.img_url,
      created_at: row.created_at,
    }));

    // 3. Simpan ke Cache sebelum dikembalikan
    reportCache.set(cacheKey, reports);
    console.log(`📥 [Cache Miss] Mengambil data report user ${userId} dari Database MySQL.`);

    res.status(200).json(reports);
  });
};

// Fungsi bantuan untuk membersihkan cache
function invalidateUserReportCache(userId) {
  const cacheKey = `user_reports_${userId}`;
  reportCache.del(cacheKey);
  console.log(`🧹 Cache user report untuk user ID ${userId} berhasil dibersihkan.`);
}

module.exports = {
  getMyReports,
  invalidateUserReportCache,
};