// routes/upload_bukti.js
const express = require("express");
const multer = require("multer");
const pool = require("./db_promise_asyncawait"); // koneksi async/await ke MySQL
const imgbbUploader = require("imgbb-uploader");

const router = express.Router();

// 🧩 Middleware CORS (khusus untuk route ini saja)
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// 🧠 Gunakan memory storage (tidak menyimpan file di server lokal)
const upload = multer({ storage: multer.memoryStorage() });

// 📤 Endpoint: Upload bukti tugas
router.post("/", upload.single("bukti"), async (req, res) => {
  try {
    const { tugas_id } = req.body;
    const imageFile = req.file;

    // 🔍 Validasi input
    if (!tugas_id || !imageFile) {
      console.warn("⚠️ Data tidak lengkap:", { tugas_id, file: !!imageFile });
      return res
        .status(400)
        .json({ error: "tugas_id dan file bukti wajib dikirim" });
    }

    if (!process.env.IMGBB_API_KEY) {
      console.error("❌ IMGBB_API_KEY belum diatur di environment");
      return res
        .status(500)
        .json({ error: "IMGBB_API_KEY belum diatur di environment" });
    }

    console.log("📥 Upload bukti diterima untuk tugas:", tugas_id);

    // 🚀 Upload ke ImgBB
    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: imageFile.buffer.toString("base64"),
      // tidak memaksa endpoint di sini — kita hanya ubah URL hasilnya seperti di report.js
    });

    // ✅ Ambil URL hasil upload
    let imageUrl = response.url;

    // ✅ Perbaiki domain ImgBB jika perlu (sesuai yang sudah teruji di report.js)
    if (imageUrl && imageUrl.includes("i.ibb.co/")) {
      imageUrl = imageUrl.replace("i.ibb.co/", "i.ibb.co.com/");
    }

    console.log("✅ Final image URL:", imageUrl);

    // 🗂️ Update tabel tugas (pastikan kolom img_url ada di tabel tugas)
    const [updateResult] = await pool.query(
      `UPDATE tugas 
       SET img_url = ?, status = 'selesai', completed_at = NOW()
       WHERE tugas_id = ?`,
      [imageUrl, tugas_id]
    );

    console.log("📝 Update tugas selesai:", updateResult);

    // 🟢 Kirim respon sukses
    res.json({
      success: true,
      message: "✅ Bukti berhasil diupload dan status tugas diperbarui.",
      img_url: imageUrl,
    });
  } catch (err) {
    console.error("❌ Gagal upload bukti:", err);
    res.status(500).json({
      error: "Gagal upload bukti",
      detail: err.message,
    });
  }
});

module.exports = router;
