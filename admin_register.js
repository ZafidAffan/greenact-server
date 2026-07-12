const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");

const router = express.Router();

router.post("/register", (req, res) => {
  const { name, email, password, confirm } = req.body;

  if (!name || !email || !password || !confirm) {
    return res.status(400).json({ success: false, message: "Semua kolom wajib diisi." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Format email tidak valid." });
  }
  if (password !== confirm) {
    return res.status(400).json({ success: false, message: "Konfirmasi password tidak cocok." });
  }

  // cek email
  pool.query("SELECT admin_id FROM admin WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "Terjadi kesalahan koneksi" });
    }

    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar." });
    }

    // hash password lalu insert
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Hash error:", err);
        return res.status(500).json({ success: false, message: "Gagal memproses password" });
      }

      pool.query(
        "INSERT INTO admin (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err, result) => {
          if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan koneksi" });
          }

          return res.status(201).json({
            success: true,
            message: "Pendaftaran berhasil. Silakan login.",
            adminId: result.insertId,
          });
        }
      );
    });
  });
});

module.exports = router;
