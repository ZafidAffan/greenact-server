const express = require("express");
const router = express.Router();
const db = require("./db_promise_asyncawait"); // koneksi pool async dari db_async.js

// Endpoint GET tugas berdasarkan petugas_id
router.get("/", async (req, res) => {
  const { petugas_id } = req.query;

  if (!petugas_id) {
    return res.status(400).json({ error: "petugas_id wajib dikirim" });
  }

  try {
    const [rows] = await db.query(
      `SELECT tugas_id, report_id, petugas_id, status, assigned_at, 
              completed_at, status_final, verified_by, verified_at
       FROM tugas 
       WHERE petugas_id = ? 
       ORDER BY assigned_at DESC`,
      [petugas_id]
    );

    res.json({ tugas: rows });
  } catch (err) {
    console.error("Error fetch tugas:", err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

module.exports = router;
