const express = require("express");
const multer = require("multer");
const db = require("./db");
const imgbbUploader = require("imgbb-uploader");

const router = express.Router();

// =======================
// CORS MIDDLEWARE
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

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// =======================
// MULTER MEMORY STORAGE
// =======================
const upload = multer({
  storage: multer.memoryStorage(),
});

/*
📤 Endpoint Kirim Laporan

Body (form-data):
- user_id
- description
- latitude
- longitude
- address
- kecamatan
- desa
- image (file)
*/
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      user_id,
      description,
      latitude,
      longitude,
      address,
      kecamatan,
      desa,
    } = req.body;

    const imageFile = req.file;

    // =======================
    // VALIDASI INPUT
    // =======================
    if (
      !user_id ||
      !description ||
      !latitude ||
      !longitude ||
      !address ||
      !kecamatan ||
      !desa ||
      !imageFile
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Semua field wajib diisi termasuk kecamatan, desa, dan image",
      });
    }

    console.log("📥 Request diterima:", {
      user_id,
      description,
      latitude,
      longitude,
      address,
      kecamatan,
      desa,
    });

    // =======================
    // CEK API KEY IMGBB
    // =======================
    if (!process.env.IMGBB_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "IMGBB_API_KEY belum diatur di environment",
      });
    }

    console.log("🚀 Uploading ke ImgBB...");

    // =======================
    // UPLOAD GAMBAR KE IMGBB
    // =======================
    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: imageFile.buffer.toString("base64"),
    });

    const imageUrl = response.url;

    console.log("✅ Upload ImgBB sukses:", imageUrl);

    // =======================
    // SIMPAN KE DATABASE
    // =======================
    const sql = `
      INSERT INTO reports (
        user_id,
        description,
        latitude,
        longitude,
        address,
        kecamatan,
        desa,
        img_url,
        status,
        created_at
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW()
      )
    `;

    db.query(
      sql,
      [
        user_id,
        description,
        latitude,
        longitude,
        address,
        kecamatan,
        desa,
        imageUrl,
      ],
      (err, result) => {
        if (err) {
          console.error("❌ DB Error:", err);

          return res.status(500).json({
            success: false,
            error: "Gagal menyimpan ke database",
            detail: err.message,
          });
        }

        console.log(
          "✅ Insert laporan sukses. ID:",
          result.insertId
        );

        return res.status(201).json({
          success: true,
          message: "Laporan berhasil dikirim",
          report_id: result.insertId,
          image_url: imageUrl,
          kecamatan,
          desa,
        });
      }
    );
  } catch (err) {
    console.error("❌ Server Error:", err);

    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan server",
      detail: err.message,
    });
  }
});

module.exports = router;