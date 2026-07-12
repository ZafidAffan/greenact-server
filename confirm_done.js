const express = require("express");
const multer = require("multer");
const pool = require("./db_promise_asyncawait");
const imgbbUploader = require("imgbb-uploader");

const router = express.Router();

// =======================
// CORS (aman untuk Vercel)
// =======================
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// =======================
// Multer (memory storage)
// =======================
const upload = multer({
  storage: multer.memoryStorage(),
});

/* =====================================================
📤 PETUGAS: Upload bukti penyelesaian tugas
Endpoint: POST /confirm-done
===================================================== */
router.post("/confirm-done", upload.single("image"), async (req, res) => {
  try {
    const { report_id, keterangan } = req.body;
    const imageFile = req.file;

    // 🔍 Validasi
    if (!report_id || !keterangan || !imageFile) {
      return res.status(400).json({
        error: "report_id, keterangan, dan foto bukti wajib diisi",
      });
    }

    if (!process.env.IMGBB_API_KEY) {
      return res.status(500).json({
        error: "IMGBB_API_KEY belum diatur di environment",
      });
    }

    console.log("📤 Uploading bukti ke ImgBB...");

    // 🚀 Upload ke ImgBB
    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: imageFile.buffer.toString("base64"),
    });

    let buktiUrl = response.url;

    // 🔧 Fix domain ImgBB jika perlu
    if (buktiUrl && buktiUrl.includes("i.ibb.co/")) {
      buktiUrl = buktiUrl.replace("i.ibb.co/", "i.ibb.co.com/");
    }

    console.log("✅ Bukti berhasil diupload:", buktiUrl);

    // =======================
    // Simpan bukti ke tabel
    // =======================
    await pool.query(
      `INSERT INTO bukti_tugas (report_id, keterangan, bukti_url, created_at)
       VALUES (?, ?, ?, NOW())`,
      [report_id, keterangan, buktiUrl]
    );

    // =======================
    // Update reports
    // =======================
    await pool.query(
      `UPDATE reports SET status = 'selesai' WHERE report_id = ?`,
      [report_id]
    );

    // =======================
    // 🔥 Update tugas (ENUM AMAN)
    // =======================
    await pool.query(
      `UPDATE tugas
       SET status = 'selesai',
           status_final = 'menunggu verifikasi',
           completed_at = NOW()
       WHERE report_id = ?`,
      [report_id]
    );

    res.json({
      success: true,
      message: `Bukti laporan #${report_id} berhasil dikirim & menunggu verifikasi.`,
      bukti_url: buktiUrl,
    });
  } catch (err) {
    console.error("❌ Gagal upload bukti:", err);
    res.status(500).json({
      error: "Gagal upload bukti",
      detail: err.message,
    });
  }
});

/* =====================================================
👀 ADMIN: Ambil daftar bukti laporan
Endpoint: GET /admin/bukti-list
===================================================== */
router.get("/admin/bukti-list", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.bukti_id,
        b.report_id,
        b.keterangan,
        b.bukti_url,
        b.created_at,
        t.status_final,
        r.address,
        r.user_id
      FROM bukti_tugas b
      JOIN reports r ON b.report_id = r.report_id
      JOIN tugas t ON r.report_id = t.report_id
      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      bukti: rows,
    });
  } catch (err) {
    console.error("❌ Gagal ambil daftar bukti:", err);
    res.status(500).json({
      error: "Gagal ambil daftar bukti",
      detail: err.message,
    });
  }
});

/* =====================================================
✅ ADMIN: Verifikasi bukti laporan
Endpoint: POST /admin/verify-bukti
===================================================== */
router.post("/admin/verify-bukti", async (req, res) => {
  try {
    const { report_id, status_final, verified_by } = req.body;

    // ENUM VALIDATION (WAJIB)
    const allowedStatus = [
      "menunggu",
      "menunggu verifikasi",
      "disetujui",
      "ditolak",
    ];

    if (!report_id || !status_final) {
      return res.status(400).json({
        error: "report_id dan status_final wajib diisi",
      });
    }

    if (!allowedStatus.includes(status_final)) {
      return res.status(400).json({
        error: "status_final tidak valid",
        allowed: allowedStatus,
      });
    }

    await pool.query(
      `UPDATE tugas
       SET status_final = ?,
           verified_by = ?,
           verified_at = NOW()
       WHERE report_id = ?`,
      [status_final, verified_by || null, report_id]
    );

    res.json({
      success: true,
      message: `Laporan #${report_id} berhasil ${status_final}`,
    });
  } catch (err) {
    console.error("❌ Gagal verifikasi bukti:", err);
    res.status(500).json({
      error: "Gagal verifikasi bukti",
      detail: err.message,
    });
  }
});

module.exports = router;
