// controllers/petugasAuth.controller.js
const bcrypt = require('bcryptjs');
const pool = require('../../config/db'); // Sesuaikan dengan file koneksi database-mu

// 1. Controller Register Petugas
const registerPetugas = async (req, res) => {
  try {
    const { name, email, phone, password, status_bertugas } = req.body;

    // Validasi field wajib
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
    }

    // Cek apakah email sudah terdaftar
    const [existing] = await pool.promise().query(
      "SELECT petugas_id FROM petugas WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email sudah terdaftar." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Nilai default jika status_bertugas tidak diisi ('tidak')
    const statusBertugasVal = status_bertugas || 'tidak';
    const tugasSelesaiVal = 0; // Default awal tugas selesai adalah 0

    const sql = `
      INSERT INTO petugas (name, email, phone, password, tugas_selesai, status_bertugas)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.promise().query(sql, [
      name,
      email,
      phone || null,
      hashedPassword,
      tugasSelesaiVal,
      statusBertugasVal
    ]);

    return res.status(201).json({
      success: true,
      message: "Registrasi petugas berhasil",
      petugasId: result.insertId,
      name,
      email
    });
  } catch (err) {
    console.error("❌ Error register petugas:", err);
    return res.status(500).json({
      error: "Gagal mendaftarkan petugas",
      detail: err.message
    });
  }
};

// 2. Controller Login Petugas (berdasarkan kode aslimu yang disempurnakan dengan session)
const loginPetugas = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi" });
    }

    const [rows] = await pool.promise().query(
      "SELECT petugas_id, name, email, phone, password, tugas_selesai, status_bertugas FROM petugas WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Email tidak ditemukan" });
    }

    const petugas = rows[0];
    const validPassword = await bcrypt.compare(password, petugas.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Password salah" });
    }

    // Simpan ke sesi server dengan role petugas
    req.session.user = {
      id: petugas.petugas_id,
      name: petugas.name,
      email: petugas.email,
      role: 'petugas'
    };

    return res.json({
      success: true,
      message: "Login berhasil",
      petugasId: petugas.petugas_id,
      name: petugas.name,
      email: petugas.email,
      phone: petugas.phone,
      tugas_selesai: petugas.tugas_selesai,
      status_bertugas: petugas.status_bertugas,
    });
  } catch (err) {
    console.error("❌ Error login petugas:", err);
    return res.status(500).json({
      error: "Gagal login petugas",
      detail: err.message,
    });
  }
};

module.exports = {
  registerPetugas,
  loginPetugas,
};