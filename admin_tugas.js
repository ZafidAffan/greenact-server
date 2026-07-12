// admin_tugas.js
const express = require("express");
const pool = require("./db_promise_asyncawait"); // koneksi mysql2/promise
const router = express.Router();

// GET /admin/tugas - ambil semua tugas
router.get("/tugas", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tugas");
    console.log("Hasil query tugas:", rows);
    res.json(rows);
  } catch (err) {
    console.error("Error ambil tugas:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/confirm-tugas - konfirmasi tugas selesai
router.post("/confirm-tugas", async (req, res) => {
  const { tugas_id, status_final } = req.body;

  if (!tugas_id || !status_final) {
    return res.status(400).json({ error: "tugas_id dan status_final wajib diisi" });
  }

  try {
    const admin_id = 1; // ganti sesuai ID admin login
    const [result] = await pool.query(
      "UPDATE tugas SET status_final = ?, verified_by = ?, verified_at = NOW() WHERE tugas_id = ?",
      [status_final, admin_id, tugas_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tugas tidak ditemukan" });
    }

    res.json({ message: "Tugas berhasil dikonfirmasi selesai" });
  } catch (err) {
    console.error("Error konfirmasi tugas:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
