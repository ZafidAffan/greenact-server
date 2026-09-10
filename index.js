// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');



// 1. Import isAuthenticated dan requireRole sekaligus dari middleware/auth
const { isAuthenticated, requireRole } = require('./middleware/auth'); 

//2. import rate limitting
const { reportLimiter, authLimiter, globalLimiter } = require('./middleware/rateLimiter');


const app = express();
const PORT = process.env.PORT || 8080;

// =======================
// MIDDLEWARE GLOBAL
// =======================

app.use(cors({
  origin: true, 
  credentials: true, // Wajib agar cookie session / token terkirim dari frontend/Postman
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Konfigurasi express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set true jika sudah menggunakan HTTPS di production
      maxAge: 1000 * 60 * 60 * 24, // Sesi aktif selama 24 jam
    }
  })
);

// Serve folder upload & public
app.use('/upload', express.static('upload'));
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// ROUTES USER (Warga)
// =======================
app.use('/api/warga/auth/', authLimiter, require('./routes/auth/wargaAuth.routes'));
app.use('/locations', require('./routes/get_location.routes')); 
app.use('/report-status', require('./routes/warga/wargaStatus.routes'));
app.use('/user', require('./routes/warga/wargaProfile.routes'));
app.use('/', require("./routes/warga/wilayah.routes"));

// Rute yang membutuhkan hak akses khusus warga (sudah login + role 'warga')
app.use('/report', reportLimiter, isAuthenticated, requireRole(['warga']), require('./routes/warga/createReport.routes')); //
app.use('/user-report', isAuthenticated, requireRole(['warga']), require('./routes/warga/wargaReport.routes'));

// =======================
// ROUTES PETUGAS
// =======================

app.use('/petugas', isAuthenticated, requireRole(['petugas']), require('./routes/petugas/petugasTask.routes'));



// =======================
// ROUTES ADMIN (DIPROTEKSI DENGAN isAuthenticated & requireRole)
// =======================
app.use('/api/auth/admin', require('./routes/auth/adminAuth.routes'));

// Semua fungsionalitas admin di bawah diproteksi khusus untuk role 'admin'
app.use('/api/admin', isAuthenticated, requireRole(['admin']), require('./routes/admin/adminDashboard.routes'));
app.use('/api/admin', isAuthenticated, requireRole(['admin']), require('./routes/admin/adminReport.routes'));
app.use('/api/admin', isAuthenticated, requireRole(['admin']), require('./routes/admin/adminAction.routes'));
app.use('/api/admin', isAuthenticated, requireRole(['admin']), require('./routes/admin/adminTask.Routes'));


app.get('/admin/peta', isAuthenticated, requireRole(['admin']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin_peta.html'));
});

// =======================
// ROUTE KEPALA DESA
// =======================
app.use('/api/auth/kades', require('./routes/auth/kadesAuth.routes'));
// Fungsionalitas kepala desa diproteksi khusus untuk role 'kepala_desa'
app.use('/kepala-desa', isAuthenticated, requireRole(['kepala_desa']), require('./routes/kepala_desa/kadesTask.routes'));


// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});