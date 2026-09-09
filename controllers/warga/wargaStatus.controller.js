// controllers/wargaStatus.controller.js
const db = require("../../config/db");

const getReportStatusSummary = (req, res) => {
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
      const statusDatabase = row.status ? row.status.toLowerCase() : '';
      const jumlahLaporan = parseInt(row.jumlah);

      switch (statusDatabase) {
        case 'pending':
          data.dilaporkan = jumlahLaporan;
          break;

        case 'diteruskan ke kepala desa':
        case 'dijadwalkan':
        case 'dalam perjalanan':
          data.diproses += jumlahLaporan;
          break;
          
        case 'selesai':
          data.selesai = jumlahLaporan;
          break;

        case 'ditolak':
          break;

        default:
          console.warn('Status tidak dikenali di database:', row.status);
      }
    });

    res.json(data);
  });
};

module.exports = {
  getReportStatusSummary,
};