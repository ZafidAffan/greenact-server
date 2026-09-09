// controllers/adminAuth.controller.js
const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

//=========================
// 1. Login Admin
//=========================
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }

  try {
    const [results] = await pool.promise().query(
      'SELECT admin_id, name, password FROM admin WHERE email = ?',
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ error: 'Email tidak ditemukan.' });
    }

    const admin = results[0];

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Password salah.' });
    }

    // Simpan ke format req.session.user agar sinkron
    req.session.user = {
      id: admin.admin_id,
      name: admin.name,
      email: email,
      role: 'admin'
    };

    return res.json({
      success: true,
      message: 'Login berhasil',
      admin: {
        id: admin.admin_id,
        name: admin.name,
        email
      }
    });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ error: 'Kesalahan server.' });
  }
};

// 2. Controller Cek Sesi Admin (/me)
const checkAdminSession = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Belum login sebagai admin' });
  }
  return res.json({
    id: req.session.user.id,
    name: req.session.user.name,
    email: req.session.user.email
  });
};


// ====================================
// 3. Register Admin 
// ====================================
const registerAdmin = (req, res) => {
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

  // Cek duplikasi email
  pool.query("SELECT admin_id FROM admin WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ success: false, message: "Terjadi kesalahan koneksi" });
    }

    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar." });
    }

    // Hash password lalu simpan ke database
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
};

module.exports = {
  loginAdmin,
  checkAdminSession,
  registerAdmin,
};