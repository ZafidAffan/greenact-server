// update_status.js
const express = require("express");
const pool = require("./db_promise_asyncawait"); // pastikan ini pool MySQL promise

const router = express.Router();

// Endpoint untuk menerima / menolak laporan
router.post("/update-status", async (req, res) => {
  try {
    // === DEBUG: cek body request ===
    console.log("📥 Body diterima:", req.body);

    const { report_id, status } = req.body;

    // DEBUG: cek tipe data
    console.log("🔎 Tipe data - report_id:", typeof report_id, ", status:", typeof status);

    // Validasi input
    if (!report_id || !status) {
      console.warn("⚠️ Data tidak lengkap:", { report_id, status });
      return res.status(400).json({ error: "report_id dan status wajib diisi" });
    }

    // DEBUG: tampilkan query yang akan dijalankan
    console.log(`🔎 Menjalankan query: UPDATE reports SET status='${status}' WHERE report_id=${report_id}`);

    const [result] = await pool.query(
      "UPDATE reports SET status = ? WHERE report_id = ?",
      [status, report_id]
    );

    // DEBUG: hasil query
    console.log("✅ Hasil query:", result);

    if (result.affectedRows > 0) {
      console.log(`🎉 Report ${report_id} berhasil diupdate ke status ${status}`);
      res.json({ message: "Status laporan berhasil diperbarui" });
    } else {
      console.warn(`⚠️ Report ${report_id} tidak ditemukan`);
      res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

  } catch (err) {
    // DEBUG: tampilkan error lengkap
    console.error("❌ Error update status laporan:", err);

    res.status(500).json({
      error: "Gagal update status laporan",
      detail: err.message,   // kirim detail error ke front-end
      stack: err.stack       // optional, bisa untuk debug di dev
    });
  }
});

module.exports = router;
