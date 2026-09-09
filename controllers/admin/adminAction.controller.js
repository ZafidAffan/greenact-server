// controllers/adminAction.controller.js
const db = require('../../config/db');
const { invalidateAdminCache } = require('./adminReport.controller'); 

//======================================
// 1. Terima/Teruskan Laporan oleh Admin
//=====================================
const updateReportToForwarded = (req, res) => {
  const reportId = req.params.report_id;
  const statusBaru = 'diteruskan ke kepala desa'; 

  const getDesaSql = "SELECT desa FROM reports WHERE report_id = ?";
  
  db.query(getDesaSql, [reportId], (err, rows) => {
    if (err) {
      console.error("SQL Error saat mencari desa:", err);
      return res.status(500).json({ error: "Gagal memproses data: " + err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "Laporan tidak ditemukan." });
    }

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

      if (result.affectedRows === 0) {
        return res.status(400).json({
          error: "Laporan tidak ditemukan atau sudah diproses sebelumnya.",
        });
      }

      if (typeof invalidateAdminCache === 'function') {
        invalidateAdminCache(); 
      }

      return res.json({
        success: true,
        message: "Laporan berhasil diverifikasi dan diteruskan ke Kepala Desa!",
      });
    });
  });
};


//======================================
// 2. Ambil Daftar Bukti Tugas (Admin)
//======================================
const getBuktiList = (req, res) => {
  const query = `
    SELECT 
      t.tugas_id,
      t.report_id,
      t.petugas_id,
      t.status,
      t.status_final,
      t.img_url AS bukti_url,
      t.completed_at,
      r.address
    FROM tugas t
    LEFT JOIN reports r ON t.report_id = r.report_id
    WHERE t.img_url IS NOT NULL AND t.img_url != ''
    ORDER BY t.completed_at DESC
  `;

  db.query(query, (err, rows) => {
    if (err) {
      console.error("SQL Error saat mengambil daftar bukti:", err);
      return res.status(500).json({ error: "Gagal mengambil daftar bukti: " + err.message });
    }

    return res.json({
      success: true,
      data: rows,
    });
  });
};

//======================================
// 3. Verifikasi Bukti Tugas oleh Admin
//======================================
const verifyBukti = (req, res) => {
  const { report_id, status_final } = req.body; // status_final misal: 'diterima' atau 'ditolak'

  if (!report_id || !status_final) {
    return res.status(400).json({ error: "report_id dan status_final wajib diisi" });
  }

  const updateTugasSql = `
    UPDATE tugas 
    SET status_final = ?, verified_at = NOW()
    WHERE report_id = ?
  `;

  db.query(updateTugasSql, [status_final, report_id], (err, result) => {
    if (err) {
      console.error("SQL Error saat verifikasi bukti:", err);
      return res.status(500).json({ error: "Gagal memverifikasi bukti: " + err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tugas dengan report_id tersebut tidak ditemukan." });
    }

    // Jika status final diterima, ubah status laporan akhir menjadi selesai
    if (status_final === 'diterima') {
      const updateReportSql = `UPDATE reports SET status = 'selesai' WHERE report_id = ?`;
      db.query(updateReportSql, [report_id], (err2) => {
        if (err2) console.error("Gagal update status report ke selesai:", err2);
      });
    }

    if (typeof invalidateAdminCache === 'function') {
      invalidateAdminCache();
    }

    return res.json({
      success: true,
      message: `Bukti tugas berhasil diverifikasi dengan status: ${status_final}`,
    });
  });
};


module.exports = {
  updateReportToForwarded,
  getBuktiList,
  verifyBukti,
};