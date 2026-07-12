const express = require("express");
const db = require("./db");

const router = express.Router();


// ======================================
// 1. AMBIL LAPORAN SIAP DIJADWALKAN
// ======================================
router.get("/laporan-siaps-jadwal/:desa", (req, res) => {
  const desa = req.params.desa;

  const sql = `
    SELECT *
    FROM reports
    WHERE status = 'diteruskan ke kepala desa'
    AND desa = ?
    ORDER BY report_id DESC
  `;

  db.query(sql, [desa], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
  });
});


// ======================================
// 2. BUAT JADWAL + UPDATE STATUS REPORT (REVISI)
// ======================================
router.post("/buat-jadwal", (req, res) => {
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
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        // --- MULAI QUERY REVISI: Update status di tabel reports asli ---
        const updateReportSql = `
          UPDATE reports 
          SET status = 'dijadwalkan' 
          WHERE report_id = ?
        `;

        db.query(updateReportSql, [report_id], (updateErr) => {
          if (updateErr) {
            console.error("Gagal update status report:", updateErr.message);
            // Tetap kirim respon sukses jadwal meskipun update report utama gagal di background
          }

          res.json({
            success: true,
            message: "Jadwal berhasil dibuat dan status laporan diperbarui!",
            jadwal_id: result.insertId
          });
        });
        // --- AKHIR QUERY REVISI ---
      }
    );
  });
});


// ======================================
// 3. UPDATE STATUS JADWAL
// ======================================
router.put("/jadwal/:id/status", (req, res) => {
  const { status } = req.body;

  const allowedStatus = [
    "dijadwalkan",
    "dalam perjalanan",
    "selesai"
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      error: "Status tidak valid"
    });
  }

  const sql = `
    UPDATE jadwal_jumat_bersih
    SET status = ?
    WHERE jadwal_id = ?
  `;

  db.query(sql, [status, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      success: true,
      message: "Status berhasil diupdate"
    });
  });
});


// ======================================
// 4. AMBIL JADWAL PER DESA (DIUBAH AGAR SESUAI)
// ======================================
router.get("/jadwal/:desa", (req, res) => {
  const desa = req.params.desa;

  const sql = `
    SELECT *
    FROM jadwal_jumat_bersih
    WHERE desa = ?
    ORDER BY tanggal DESC, waktu DESC
  `;

  db.query(sql, [desa], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(result);
  });
});


// ======================================
// 5. SELESAI + UPLOAD BUKTI FOTO
// ======================================
router.put("/jadwal/:id/selesai", (req, res) => {
  const { bukti_foto } = req.body;

  if (!bukti_foto) {
    return res.status(400).json({
      error: "Bukti foto wajib diisi"
    });
  }

  const sql = `
    UPDATE jadwal_jumat_bersih
    SET status = 'selesai',
        bukti_foto = ?
    WHERE jadwal_id = ?
  `;

  db.query(sql, [bukti_foto, req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Jadwal tidak ditemukan"
      });
    }

    res.json({
      success: true,
      message: "Kegiatan selesai + bukti foto tersimpan"
    });
  });
});


// ======================================
// EXPORT ROUTER
// ======================================
module.exports = router;