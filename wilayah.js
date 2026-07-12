const express = require("express");
const router = express.Router();

const db = require("./db");

// Middleware CORS dan JSON
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // biar bisa diakses dari Flutter / browser
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Content-Type', 'application/json');
  next();
});
// =============================
// GET Semua Kecamatan
// =============================
router.get("/kecamatan", (req, res) => {

    const sql = `
        SELECT *
        FROM kecamatan
        ORDER BY nama_kecamatan ASC
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json(result);

    });

});


// =============================
// GET Semua Desa
// =============================
router.get("/desa", (req, res) => {

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
                message: err.message
            });
        }

        res.json(result);

    });

});


// =============================
// GET Desa berdasarkan Kecamatan
// =============================
router.get("/desa/:kecamatan_id", (req, res) => {

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
                message: err.message
            });
        }

        res.json(result);

    });

});


module.exports = router;