const express = require('express');
const router = express.Router();
const db = require('./db');

// Middleware CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Content-Type', 'application/json');
  next();
});

// GET /user?user_id=123
router.get('/', (req, res) => {
  const user_id = parseInt(req.query.user_id);

  if (!user_id || user_id <= 0) {
    return res.status(400).json({ error: 'User ID tidak valid' });
  }

  /* 
    REVISI QUERY:
    Tambahkan kolom `desa` dan `kecamatan` ke dalam perintah SELECT 
    agar frontend profile bisa menampilkannya secara realtime dari database.
  */
  const sql = `
    SELECT user_id, name, email, phone, desa, kecamatan, created_at 
    FROM user 
    WHERE user_id = ?
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'SQL Error: ' + err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Mengembalikan data user lengkap beserta wilayahnya ke frontend
    res.json(results[0]);
  });
});

module.exports = router;