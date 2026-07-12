const express = require("express");
const pool = require("./db_promise_asyncawait"); // sesuaikan path
const router = express.Router();

// =======================
// GET STATUS TUGAS PETUGAS
// =======================
router.get("/tugas-status", async (req, res) => {
  const { petugas_id } = req.query;

  if (!petugas_id) {
    return res.status(400).json({
      error: "petugas_id wajib diisi",
    });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        SUM(status = 'menunggu') AS baru,
        SUM(status = 'dalam perjalanan') AS dalamProses,
        SUM(status = 'selesai') AS selesai
      FROM tugas
      WHERE petugas_id = ?
      `,
      [petugas_id]
    );

    res.json({
      baru: rows[0].baru || 0,
      dalamProses: rows[0].dalamProses || 0,
      selesai: rows[0].selesai || 0,
    });
  } catch (err) {
    console.error("❌ Error get tugas status:", err);
    res.status(500).json({
      error: "Gagal mengambil status tugas",
      detail: err.message,
    });
  }
});

module.exports = router;
