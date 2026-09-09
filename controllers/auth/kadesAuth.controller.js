// controllers/kadesAuth.controller.js
const bcrypt = require("bcryptjs");
const db = require("../../config/db");

// 1. Controller Register Kepala Desa
const registerKades = async (req, res) => {
  try {
    const { nama, email, password, desa, kecamatan } = req.body;

    if (!nama || !email || !password || !desa || !kecamatan) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    const checkSql = "SELECT * FROM kepala_desa WHERE email = ?";

    db.query(checkSql, [email], async (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email sudah digunakan",
        });
      }

      // Hash password sebelum disimpan ke database
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql = `
        INSERT INTO kepala_desa (nama, email, password, desa, kecamatan)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [nama, email, hashedPassword, desa, kecamatan],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            success: true,
            message: "Register berhasil",
            kepala_desa_id: result.insertId,
          });
        }
      );
    });
  } catch (err) {
    console.error("❌ Error register kades:", err);
    res.status(500).json({ error: "Gagal memproses registrasi", detail: err.message });
  }
};

// 2. Controller Login Kepala Desa
const loginKades = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const sql = `
    SELECT *
    FROM kepala_desa
    WHERE email = ?
  `;

  db.query(sql, [email], async (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const user = result[0];

    // Verifikasi password menggunakan bcrypt
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Simpan ke session server dengan role khusus kepala_desa
    req.session.user = {
      id: user.kades_id,
      name: user.nama,
      email: user.email,
      desa: user.desa,
      kecamatan: user.kecamatan,
      role: "kepala_desa",
    };

    res.json({
      success: true,
      message: "Login berhasil",
      kades_id: user.kades_id,
      nama: user.nama,
      desa: user.desa,
      kecamatan: user.kecamatan,
      email: user.email,
    });
  });
};

module.exports = {
  registerKades,
  loginKades,
};