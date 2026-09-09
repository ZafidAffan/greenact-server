// middleware/auth.js

// 1. Middleware untuk mengecek apakah user sudah login
function isAuthenticated(req, res, next) {
  // Mengecek apakah objek session dan user di dalam session sudah ada
  if (req.session && req.session.user) {
    return next(); // Lanjut ke handler/route berikutnya
  }

  return res.status(401).json({ 
    error: "Unauthorized: Silakan login terlebih dahulu." 
  });
}

// 2. Middleware untuk mengecek hak akses berdasarkan Role (Authorization)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    // Pastikan user sudah login terlebih dahulu
    if (!req.session || !req.session.user) {
      return res.status(401).json({ 
        error: "Unauthorized: Sesi tidak ditemukan, silakan login." 
      });
    }

    const userRole = req.session.user.role;

    // Cek apakah role user saat ini ada di dalam daftar role yang diizinkan
    if (allowedRoles.includes(userRole)) {
      return next(); // Role sesuai, silakan lanjut
    }

    return res.status(403).json({ 
      error: "Forbidden: Anda tidak memiliki hak akses untuk halaman/fitur ini." 
    });
  };
}

module.exports = {
  isAuthenticated,
  requireRole
};