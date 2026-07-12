const express = require("express");
const db = require("./db");

const router = express.Router();

// PUT /admin/terima-laporan/:report_id
router.put("/terima-laporan/:report_id", (req, res) => {
  const reportId = req.params.report_id;

  // CATATAN REVISI ENUM STATUS:
  // Pastikan string 'diteruskan ke kepala desa' ini sama persis dengan yang ada di ENUM database-mu.
  // Jika di database kamu diubah menjadi 'diteruskan', ganti teks di bawah menjadi 'diteruskan'.
  const statusBaru = 'diteruskan ke kepala desa'; 

  const updateSql = `
    UPDATE reports
    SET status = ?
    WHERE report_id = ? AND status = 'pending'
  `;

  db.query(updateSql, [statusBaru, reportId], (err, result) => {
    if (err) {
      console.error("SQL Error saat meneruskan laporan:", err);
      return res.status(500).json({
        error: "Gagal memperbarui status di database: " + err.message,
      });
    }

    // Jika affectedRows === 0, bisa jadi ID salah ATAU statusnya sudah bukan 'pending' lagi
    if (result.affectedRows === 0) {
      return res.status(400).json({
        error: "Laporan tidak ditemukan atau sudah diproses sebelumnya.",
      });
    }

    res.json({
      success: true,
      message: "Laporan berhasil diverifikasi dan diteruskan ke Kepala Desa!",
    });
  });
});

module.exports = router;