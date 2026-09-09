// controllers/kades/kadesTask.controller.js
const db = require('../../config/db'); // Sesuaikan path koneksi database MySQL callback/pool-mu
const redisClient = require('../../config/redisClient'); 

// Placeholder atau import fungsi invalidasi lain jika diperlukan
// const { invalidateAdminCache } = require('../adminReport.controller');
// const { invalidateUserReportCache } = require('../userReport.controller');

const CACHE_TTL = 300; // 5 menit

//========================================================
// 1. Ambil Laporan Siap Dijadwalkan (Dengan Redis Cache)
//========================================================
const getLaporanSiapJadwal = async (req, res) => {
  const desa = req.params.desa;
  const cacheKey = `laporan_siap_jadwal_${desa.toLowerCase()}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ [Redis Cache Hit] Laporan siap jadwal desa ${desa}.`);
      return res.json(JSON.parse(cachedData));
    }

    const sql = `
      SELECT *
      FROM reports
      WHERE status = 'diteruskan ke kepala desa'
      AND desa = ?
      ORDER BY report_id DESC
    `;

    db.query(sql, [desa], async (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`📥 [Redis Cache Miss] Laporan siap jadwal desa ${desa} dari DB.`);

      return res.json(result);
    });
  } catch (err) {
    console.error("Redis Error:", err.message);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};

//========================================================
// 2. Buat Jadwal + Update Status Report
//========================================================
const buatJadwal = (req, res) => {
  const {
    report_id,
    tanggal,
    waktu,
    lokasi,
    deskripsi,
    latitude,
    longitude
  } = req.body;

  const getReport = `SELECT * FROM reports WHERE report_id = ?`;

  db.query(getReport, [report_id], (err, reports) => {
    if (err) return res.status(500).json({ error: err.message });
    if (reports.length === 0) return res.status(404).json({ error: "Report tidak ditemukan" });

    const report = reports[0];

    const insertSql = `
      INSERT INTO jadwal_jumat_bersih (
        report_id, desa, kecamatan, status, tanggal, waktu, lokasi, deskripsi, latitude, longitude
      )
      VALUES (?, ?, ?, 'dijadwalkan', ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [report_id, report.desa, report.kecamatan, tanggal, waktu, lokasi, deskripsi, latitude, longitude],
      async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const updateReportSql = `
          UPDATE reports 
          SET status = 'dijadwalkan' 
          WHERE report_id = ?
        `;

        db.query(updateReportSql, [report_id], async (updateErr) => {
          if (updateErr) {
            console.error("Gagal update status report:", updateErr.message);
          }

          // Invalidate cache terkait
          await invalidateSiapJadwalCache(report.desa);
          await invalidateJadwalCache(report.desa);
          // if (typeof invalidateAdminCache === 'function') invalidateAdminCache();
          // if (typeof invalidateUserReportCache === 'function') invalidateUserReportCache(report.user_id);

          return res.json({
            success: true,
            message: "Jadwal berhasil dibuat dan status laporan diperbarui!",
            jadwal_id: result.insertId
          });
        });
      }
    );
  });
};

//========================================================
// 3. Update Status Jadwal
//========================================================
const updateJadwalStatus = (req, res) => {
  const { status } = req.body;
  const allowedStatus = ["dijadwalkan", "dalam perjalanan", "selesai"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ error: "Status tidak valid" });
  }

  const sql = `
    UPDATE jadwal_jumat_bersih
    SET status = ?
    WHERE jadwal_id = ?
  `;

  db.query(sql, [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    return res.json({
      success: true,
      message: "Status berhasil diupdate"
    });
  });
};

//========================================================
// 4. Ambil Jadwal Per Desa (Dengan Redis Cache)
//========================================================
const getJadwalPerDesa = async (req, res) => {
  const desa = req.params.desa;
  const cacheKey = `jadwal_desa_${desa.toLowerCase()}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ [Redis Cache Hit] Jadwal desa ${desa}.`);
      return res.json(JSON.parse(cachedData));
    }

    const sql = `
      SELECT *
      FROM jadwal_jumat_bersih
      WHERE desa = ?
      ORDER BY tanggal DESC, waktu DESC
    `;

    db.query(sql, [desa], async (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
      console.log(`📥 [Redis Cache Miss] Jadwal desa ${desa} dari DB.`);

      return res.json(result);
    });
  } catch (err) {
    console.error("Redis Error:", err.message);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};

//========================================================
// 5. Selesai + Upload Bukti Foto
//========================================================
const completeJadwalWithPhoto = (req, res) => {
  const { bukti_foto } = req.body;

  if (!bukti_foto) {
    return res.status(400).json({ error: "Bukti foto wajib diisi" });
  }

  const sql = `
    UPDATE jadwal_jumat_bersih
    SET status = 'selesai',
        bukti_foto = ?
    WHERE jadwal_id = ?
  `;

  db.query(sql, [bukti_foto, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Jadwal tidak ditemukan" });
    }

    return res.json({
      success: true,
      message: "Kegiatan selesai + bukti foto tersimpan"
    });
  });
};

//========================================================
// Helper Fungsi Cache Invalidation
async function invalidateSiapJadwalCache(desa) {
  const cacheKey = `laporan_siap_jadwal_${desa.toLowerCase()}`;
  await redisClient.del(cacheKey);
  console.log(`🧹 [Redis] Cache laporan siap jadwal desa ${desa} dibersihkan.`);
}

async function invalidateJadwalCache(desa) {
  const cacheKey = `jadwal_desa_${desa.toLowerCase()}`;
  await redisClient.del(cacheKey);
  console.log(`🧹 [Redis] Cache jadwal desa ${desa} dibersihkan.`);
}
//========================================================

module.exports = {
  getLaporanSiapJadwal,
  buatJadwal,
  updateJadwalStatus,
  getJadwalPerDesa,
  completeJadwalWithPhoto,
  invalidateSiapJadwalCache,
  invalidateJadwalCache,
};