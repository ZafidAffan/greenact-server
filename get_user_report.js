// get_user_report.js
const db = require('./db'); // pastikan ada koneksi db.js sesuai config MySQL kamu

async function getUserReport(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT report_id, description, address, status, img_url, created_at 
      FROM reports 
      WHERE user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);

      const reports = results.map(row => ({
        report_id: row.report_id,
        description: row.description,
        address: row.address,
        status: row.status,
        image_path: row.img_url, // tetap konsisten untuk frontend
        created_at: row.created_at
      }));

      resolve(reports);
    });
  });
}

module.exports = getUserReport;
