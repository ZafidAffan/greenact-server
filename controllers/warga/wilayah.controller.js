// controllers/wilayah.controller.js
const db = require("../../config/db");

// 1. GET Semua Kecamatan
const getAllKecamatan = (req, res) => {
  const sql = `
    SELECT *
    FROM kecamatan
    ORDER BY nama_kecamatan ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
    res.json(result);
  });
};

// 2. GET Semua Desa (beserta join kecamatan)
const getAllDesa = (req, res) => {
  const sql = `
    SELECT
        desa.desa_id,
        desa.nama_desa,
        desa.kecamatan_id,
        kecamatan.nama_kecamatan
    FROM desa
    INNER JOIN kecamatan
    ON desa.kecamatan_id = kecamatan.kecamatan_id
    ORDER BY kecamatan.nama_kecamatan, desa.nama_desa
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
    res.json(result);
  });
};

// 3. GET Desa berdasarkan ID Kecamatan
const getDesaByKecamatan = (req, res) => {
  const id = req.params.kecamatan_id;

  const sql = `
    SELECT *
    FROM desa
    WHERE kecamatan_id = ?
    ORDER BY nama_desa ASC
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
    res.json(result);
  });
};

module.exports = {
  getAllKecamatan,
  getAllDesa,
  getDesaByKecamatan,
};