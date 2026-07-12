// routes/assign_task.js
const express = require("express");
const pool = require("./db_promise_asyncawait");
const router = express.Router();

router.post("/assign-task", async (req, res) => {
  try {
    const { report_id, petugas_id } = req.body;

    console.log("📥 Request body diterima:", req.body);

    // 🧩 Validasi input
    if (!report_id || !petugas_id) {
      console.warn("⚠️ Data tidak lengkap:", { report_id, petugas_id });
      return res
        .status(400)
        .json({ error: "report_id dan petugas_id wajib diisi" });
    }

    // 🧭 Ambil data latitude & longitude dari tabel reports
    const [report] = await pool.query(
      "SELECT latitude, longitude FROM reports WHERE report_id = ?",
      [report_id]
    );

    if (report.length === 0) {
      console.warn("⚠️ Report tidak ditemukan:", report_id);
      return res.status(404).json({ error: "Report tidak ditemukan" });
    }

    const { latitude, longitude } = report[0];
    console.log("📍 Koordinat laporan ditemukan:", { latitude, longitude });

    // 📝 Insert ke tabel tugas
    console.log("📝 Menjalankan query INSERT ke tabel tugas");
    const [insertResult] = await pool.query(
      `INSERT INTO tugas 
        (report_id, petugas_id, latitude, longitude, status, assigned_at)
       VALUES (?, ?, ?, ?, 'menunggu', NOW())`,
      [report_id, petugas_id, latitude, longitude]
    );

    console.log("✅ Hasil INSERT:", insertResult);

    // 🔄 Update status di tabel reports
    console.log(`📝 Update status report_id ${report_id} jadi 'proses'`);
    const [updateResult] = await pool.query(
      "UPDATE reports SET status = 'proses' WHERE report_id = ?",
      [report_id]
    );

    console.log("✅ Hasil UPDATE:", updateResult);

    // 🟢 Respon sukses
    res.json({
      success: true,
      message: `Laporan #${report_id} berhasil dikirim ke petugas #${petugas_id}`,
      inserted_tugas_id: insertResult.insertId,
    });
  } catch (err) {
    console.error("❌ Gagal assign task:", err);
    res.status(500).json({
      error: "Gagal assign task",
      detail: err.message,
      stack: err.stack,
    });
  }
});

module.exports = router;
