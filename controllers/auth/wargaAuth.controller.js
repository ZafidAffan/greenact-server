// controllers/wargaAuth.controller.js
const bcrypt = require('bcryptjs');
const pool = require('../../config/db'); // Pastikan ini menggunakan pool promise atau kita bungkus promisenya

// ==========================================
// 1. Register Warga
// ==========================================
const registerWarga = async (req, res) => {
  try {
    const { name, email, phone, kecamatan, desa, password } = req.body;

    // Validasi field wajib
    const required = ['name', 'email', 'password', 'kecamatan', 'desa'];
    for (const field of required) {
      if (!req.body[field] || req.body[field].trim() === '') {
        return res.status(400).json({ error: `Kolom ${field} wajib diisi` });
      }
    }

    // Cek email sudah terdaftar atau belum
    const [existingRows] = await pool.promise().query(
      "SELECT user_id FROM user WHERE email = ?",
      [email]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO user (name, email, phone, kecamatan, desa, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.promise().query(sql, [
      name,
      email,
      phone || null,
      kecamatan,
      desa,
      hashedPassword
    ]);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      userId: result.insertId,
      name,
      email,
      kecamatan,
      desa
    });
  } catch (err) {
    console.error("❌ Error register user:", err);
    return res.status(500).json({
      error: 'Gagal melakukan registrasi',
      detail: err.message,
    });
  }
};

// 2. Login Warga
const loginWarga = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi" });
    }

    const [rows] = await pool.promise().query(
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

    // Simpan sesi dan role warga
    req.session.user = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      desa: user.desa,
      kecamatan: user.kecamatan,
      role: 'warga'
    };

    return res.json({
      success: true,
      message: "Login berhasil",
      userId: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      desa: user.desa,             
      kecamatan: user.kecamatan    
    });
  } catch (err) {
    console.error("❌ Error login user:", err);
    return res.status(500).json({
      error: "Gagal login user",
      detail: err.message,
    });
  }
};

module.exports = {
  registerWarga,
  loginWarga,
};