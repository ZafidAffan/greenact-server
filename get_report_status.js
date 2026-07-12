// get_report_status.js
const express = require('express');
const router = express.Router();
const db = require('./db'); // pastikan ini file koneksi database MySQL-mu

// Middleware CORS dan JSON
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // biar bisa diakses dari Flutter / browser
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Content-Type', 'application/json');
  next();
});

// GET /report-status?user_id=123
router.get('/', (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID tidak ditemukan' });
  }

  const sql = `
    SELECT status, COUNT(*) AS jumlah 
    FROM reports 
    WHERE user_id = ? 
    GROUP BY status
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('SQL Error:', err);
      return res.status(500).json({ error: 'SQL Error: ' + err.message });
    }

    // Penampung data statistik eksklusif untuk 3 card di dashboard
    const data = {
      dilaporkan: 0, // Murni hanya status 'pending'
      diproses: 0,   // Gabungan status penanganan aktif
      selesai: 0     // Sukses ditangani
    };

    results.forEach(row => {
      // Mengubah string ke huruf kecil untuk menghindari error salah ketik kapital di database
      const statusDatabase = row.status ? row.status.toLowerCase() : '';
      const jumlahLaporan = parseInt(row.jumlah);

      switch (statusDatabase) {
        case 'pending':
          // Laporan baru masuk, angka akan berkurang jika status beralih ke case di bawahnya
          data.dilaporkan = jumlahLaporan;
          break;

        case 'diteruskan ke kepala desa':
        case 'dijadwalkan':
        case 'dalam perjalanan':
          // Semua status penanganan aktif digabung ke kategori diproses
          data.diproses += jumlahLaporan;
          break;
          
        case 'selesai':
          data.selesai = jumlahLaporan;
          break;

        case 'ditolak':
          // Status ditolak diabaikan dari ketiga card utama agar statistik tetap relevan
          break;

        default:
          console.warn('Status tidak dikenali di database:', row.status);
      }
    });

    res.json(data);
  });
});

module.exports = router;