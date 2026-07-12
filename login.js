// routes/login.js
const express = require("express");
const pool = require("./db_promise_asyncawait"); // koneksi MySQL pakai async/await
const bcrypt = require("bcryptjs");
const router = express.Router();

// Middleware CORS (kalau belum di-global di server.js)
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// === LOGIN USER ===
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi" });
    }

    /* 
      1. REVISI QUERY: 
      Tambahkan kolom `desa` dan `kecamatan` ke dalam perintah SELECT 
      (Pastikan nama kolom ini sama persis dengan yang ada di tabel 'user' database kamu)
    */
    const [rows] = await pool.query(
      "SELECT user_id, name, email, phone, password, desa, kecamatan FROM user WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Email tidak ditemukan" });
    }

    const user = rows[0];

    // Cocokkan password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Password salah" });
    }

    /* 
      2. REVISI RESPONSE JSON: 
      Kirimkan juga data `desa` dan `kecamatan` milik user tersebut ke frontend
    */
    res.json({
      message: "Login berhasil",
      userId: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      desa: user.desa,             // <-- Tambahan Baru
      kecamatan: user.kecamatan    // <-- Tambahan Baru
    });
  } catch (err) {
    console.error("❌ Error login user:", err);
    res.status(500).json({
      error: "Gagal login user",
      detail: err.message,
    });
  }
});

module.exports = router;