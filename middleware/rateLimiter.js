const rateLimit = require('express-rate-limit');

// Limit khusus untuk endpoint buat laporan (mencegah spam)
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 laporan per IP dalam 15 menit
  message: {
    error: "Terlalu banyak mengirim laporan, silakan coba lagi setelah 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit umum untuk endpoint API lainnya
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 100, // Maksimal 100 request per menit
  message: {
    error: "Terlalu banyak permintaan, akses dibatasi sementara.",
  },
});

// Limit khusus untuk login (mencegah brute-force password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 kali percobaan salah/request per IP dalam 15 menit
  message: {
    error: "Terlalu banyak percobaan login yang gagal. Silakan coba lagi setelah 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { reportLimiter, globalLimiter, authLimiter  };