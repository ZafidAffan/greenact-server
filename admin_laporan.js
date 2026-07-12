const express = require("express");
const pool = require("./db_promise_asyncawait"); // koneksi mysql2/promise
const router = express.Router();

// GET /admin/laporan
router.get("/laporan", async (req, res) => {
  try {
    // Ambil semua data
    const [rows] = await pool.query("SELECT * FROM reports");

    console.log("Hasil query reports:", rows);

    // Tambahkan fallback address supaya tidak kosong
    const formattedRows = rows.map(r => ({
      ...r,
      address: r.address || `Lat: ${r.latitude}, Lng: ${r.longitude}`
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("Error ambil laporan:", err.message);
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
