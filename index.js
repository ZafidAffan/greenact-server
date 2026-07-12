// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors'); // <-- 1. Tambah library CORS

const app = express();
const PORT = process.env.PORT || 8080;

// =======================
// MIDDLEWARE GLOBAL
// =======================

// 2. Pasang CORS agar frontend (Live Server) bisa akses API Node.js tanpa diblokir
app.use(cors({
  origin: '*', // Izinkan semua origin (Flutter / Browser / Live Server)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder upload (gambar, dokumen, dll.)
app.use('/upload', express.static('upload'));

// Serve folder public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// ROUTES USER
// =======================
app.use('/login', require('./login'));
app.use('/register', require('./register'));
app.use('/report', require('./report'));
app.use('/locations', require('./get_locations')); 
app.use('/report-status', require('./get_report_status'));
app.use('/user', require('./get_user'));
app.use('/', require("./wilayah"));

// =======================
// ROUTES PETUGAS
// =======================
app.use('/login_petugas', require('./login_petugas'));
app.use('/register-petugas', require('./register_petugas'));
app.use('/get-tugas', require('./get_tugas'));
app.use('/upload-bukti', require('./upload_bukti'));
app.use('/user-report', require('./user_report'));

// =======================
// ROUTES ADMIN (DIBERSIHKAN & DIGABUNG)
// =======================
// Gabungkan semua rute admin di bawah prefix /admin tanpa bentrok
app.use('/admin', require('./admin_login'));
app.use('/admin', require('./admin_register'));
app.use('/admin', require('./admin_dashboard'));
app.use('/admin', require('./admin_laporan'));
app.use('/admin', require('./admin_tugas'));
app.use('/admin', require('./terima_laporan'));


// ROUTES ADMIN TAMBAHAN
app.use('/admin', require('./update_status'));
app.use('/admin', require('./assign_task'));
app.use('/admin', require('./confirm_done'));
app.use('/admin', require('./get_petugas')); 

// =======================
// ROUTE STATUS TUGAS PETUGAS
// =======================
app.use('/', require('./tugas_status'));

// =======================
// ROUTE KEPALA DESA
// =======================
app.use('/kepala-desa', require('./kepala_desa'));
app.use('/kepala-desa/login', require('./kepala_desa_login'));
app.use('/kepala-desa/register', require('./kepala_desa_register'));

// =======================
// ROUTE KHUSUS ADMIN HTML
// =======================
app.get('/admin/peta', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin_peta.html'));
});

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});