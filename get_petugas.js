// routes/get_petugas.js
const express = require("express");
const pool = require("./db_promise_asyncawait");

const router = express.Router();

// ============================
// ✅ Ambil semua daftar petugas
// Endpoint: GET /admin/get-petugas
// ============================
router.get("/get-petugas", async (req, res) => {
  try {
    console.log("📡 [SERVER] Mengambil daftar petugas...");

    const [rows] = await pool.query(
      "SELECT petugas_id, name AS nama, phone AS no_hp FROM petugas"
    );

    console.log("✅ [SERVER] Hasil query:", rows);

    res.json(rows);
  } catch (err) {
    console.error("❌ [SERVER] Gagal ambil petugas:", err);
    res.status(500).json({
      error: "Gagal ambil daftar petugas",
      detail: err.message
    });
  }
});

module.exports = router;
