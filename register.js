const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('./db');

// =======================
// CORS MIDDLEWARE
// =======================
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// =======================
// REGISTER USER
// =======================
router.post('/', async (req, res) => {
  const {
    name,
    email,
    phone,
    kecamatan,
    desa,
    password
  } = req.body;

  // Validasi field wajib
  const required = [
    'name',
    'email',
    'password',
    'kecamatan',
    'desa'
  ];

  for (const field of required) {
    if (!req.body[field] || req.body[field].trim() === '') {
      return res.status(400).json({
        error: `Kolom ${field} wajib diisi`
      });
    }
  }

  try {
    // Cek email sudah terdaftar atau belum
    const checkEmailSql =
      "SELECT user_id FROM user WHERE email = ?";

    db.query(checkEmailSql, [email], async (checkErr, rows) => {
      if (checkErr) {
        return res.status(500).json({
          error: 'Gagal mengecek email',
          detail: checkErr.message
        });
      }

      if (rows.length > 0) {
        return res.status(409).json({
          error: 'Email sudah terdaftar'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO user (
          name,
          email,
          phone,
          kecamatan,
          desa,
          password
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          name,
          email,
          phone || null,
          kecamatan,
          desa,
          hashedPassword
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error: 'Gagal menyimpan data',
              detail: err.message
            });
          }

          res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            userId: result.insertId,
            name,
            email,
            kecamatan,
            desa
          });
        }
      );
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Gagal hash password',
      detail: err.message
    });
  }
});

module.exports = router;
