const express = require("express");
const db = require("./db");

const router = express.Router();

router.post("/", (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT *
    FROM kepala_desa
    WHERE email = ?
    AND password = ?
  `;

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err.message
      });
    }

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah"
      });
    }

    const user = result[0];

    res.json({
      success: true,
      message: "Login berhasil",
      kades_id: user.kades_id,
      nama: user.nama,
      desa: user.desa,
      kecamatan: user.kecamatan,
      email: user.email
    });
  });
});

module.exports = router;