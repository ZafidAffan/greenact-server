const express = require('express');
const pool = require('./db_promise_asyncawait');
const router = express.Router();

// ✅ Middleware CORS manual (biar sama kayak login.js masyarakat)
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // izinkan semua origin
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200); // preflight request
  next();
});

// ✅ GET /get-tugas?petugas_id=123
router.get("/", async (req, res) => {
  const { petugas_id } = req.query;
  if (!petugas_id) return res.status(400).json({ error: "petugas_id wajib" });

  try {
    const [rows] = await pool.query(
      `SELECT 
          t.tugas_id, 
          t.report_id, 
          t.petugas_id, 
          t.status, 
          t.assigned_at, 
          t.completed_at, 
          t.status_final, 
          t.verified_by, 
          t.verified_at,
          t.latitude, 
          t.longitude,
          r.address,
          r.img_url
       FROM tugas t
       LEFT JOIN reports r ON t.report_id = r.report_id
       WHERE t.petugas_id = ? 
       ORDER BY t.assigned_at DESC`,
      [petugas_id]
    );

    res.json({ tugas: rows }); // ✅ kirim hasil ke frontend
  } catch (err) {
    console.error("❌ Error get tugas:", err);
    res.status(500).json({ error: "Gagal mengambil tugas" });
  }
});

module.exports = router;
