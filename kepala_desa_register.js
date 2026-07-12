const express = require("express");
const db = require("./db");

const router = express.Router();

router.post("/", (req, res) => {
  const {
    nama,
    email,
    password,
    desa,
    kecamatan
  } = req.body;

  if (!nama || !email || !password || !desa || !kecamatan) {
    return res.status(400).json({
      success: false,
      message: "Semua field wajib diisi"
    });
  }

  const checkSql =
    "SELECT * FROM kepala_desa WHERE email = ?";

  db.query(checkSql, [email], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.message
      });
    }

    if (result.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan"
      });
    }

    const insertSql = `
      INSERT INTO kepala_desa
      (
        nama,
        email,
        password,
        desa,
        kecamatan
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [
        nama,
        email,
        password,
        desa,
        kecamatan
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            error: err.message
          });
        }

        res.json({
          success: true,
          message: "Register berhasil",
          kepala_desa_id: result.insertId
        });
      }
    );
  });
});

module.exports = router;