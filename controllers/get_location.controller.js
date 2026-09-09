// controllers/location.controller.js
const db = require("../config/db");

const getLocations = (req, res) => {
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
};

module.exports = {
  getLocations,
};