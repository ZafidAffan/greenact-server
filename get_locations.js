const express = require('express');
const router = express.Router();
const db = require('./db');

// Middleware CORS (kalau belum global)
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');
  next();
});

// GET /locations
router.get('/', (req, res) => {
  const sql = "SELECT description, latitude, longitude FROM reports";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal mengambil data lokasi: ' + err.message });
    }

    const locations = results.map(row => ({
      title: row.description,
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude)
    }));

    res.json(locations);
  });
});

module.exports = router;
