// controllers/taskAction.controller.js
const pool = require('../../config/db'); // Sesuaikan dengan koneksi database-mu
const imgbbUploader = require("imgbb-uploader");

///=====================================================
//1. Controller Petugas: Upload Bukti Penyelesaian Tugas
//======================================================
const confirmDoneTask = async (req, res) => {
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

    const dbPool = pool.promise ? pool.promise() : pool;

    // Simpan bukti ke tabel bukti_tugas
    await dbPool.query(
      `INSERT INTO bukti_tugas (report_id, keterangan, bukti_url, created_at)
       VALUES (?, ?, ?, NOW())`,
      [report_id, keterangan, buktiUrl]
    );

    // Update status reports
    await dbPool.query(
      `UPDATE reports SET status = 'selesai' WHERE report_id = ?`,
      [report_id]
    );

    // Update status tugas
    await dbPool.query(
      `UPDATE tugas
       SET status = 'selesai',
           status_final = 'menunggu verifikasi',
           completed_at = NOW()
       WHERE report_id = ?`,
      [report_id]
    );

    return res.json({
      success: true,
      message: `Bukti laporan #${report_id} berhasil dikirim & menunggu verifikasi.`,
      bukti_url: buktiUrl,
    });
  } catch (err) {
    console.error("❌ Gagal upload bukti:", err);
    return res.status(500).json({
      error: "Gagal upload bukti",
      detail: err.message,
    });
  }
};

///=====================================================
// 2. Ambil daftar tugas berdasarkan petugas_id
///=====================================================
const getPetugasTasks = async (req, res) => {
  const { petugas_id } = req.query;
    
    if (!petugas_id) {
      return res.status(400).json({ error: "petugas_id wajib" });
    }
  
    try {
      const [rows] = await pool.query(
        `SELECT 
            t.tugas_id, 
            t.report_id, 
            t.petugas_id, 
            t.status, 
            t.assigned_at, 
            t.completed_at, 
            t.status_final, 
            t.verified_by, 
            t.verified_at,
            t.latitude, 
            t.longitude,
            r.address,
            r.img_url
         FROM tugas t
         LEFT JOIN reports r ON t.report_id = r.report_id
         WHERE t.petugas_id = ? 
         ORDER BY t.assigned_at DESC`,
        [petugas_id]
      );
    
      return res.json({ tugas: rows });
    } catch (err) {
      console.error("❌ Error get tugas:", err);
      return res.status(500).json({ error: "Gagal mengambil tugas" });
    }
};

///=====================================================
//3. Ambil status tugas petugas
///=====================================================
const getPetugasTaskStatus = async (req, res) => {
  const { petugas_id } = req.query;

  if (!petugas_id) {
    return res.status(400).json({
      error: "petugas_id wajib diisi",
    });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        SUM(status = 'menunggu') AS baru,
        SUM(status = 'dalam perjalanan') AS dalamProses,
        SUM(status = 'selesai') AS selesai
      FROM tugas
      WHERE petugas_id = ?
      `,
      [petugas_id]
    );

    return res.json({
      baru: rows[0].baru || 0,
      dalamProses: rows[0].dalamProses || 0,
      selesai: rows[0].selesai || 0,
    });
  } catch (err) {
    console.error("❌ Error get tugas status:", err);
    return res.status(500).json({
      error: "Gagal mengambil status tugas",
      detail: err.message,
    });
  }
};

///=====================================================
// 4.  upload bukti tugas dan update database
///=====================================================

const uploadBuktiTugas = async (req, res) => {
  try {
    const { tugas_id } = req.body;
    const imageFile = req.file;

    // Validasi input
    if (!tugas_id || !imageFile) {
      console.warn("⚠️ Data tidak lengkap:", { tugas_id, file: !!imageFile });
      return res.status(400).json({ error: "tugas_id dan file bukti wajib dikirim" });
    }

    if (!process.env.IMGBB_API_KEY) {
      console.error("❌ IMGBB_API_KEY belum diatur di environment");
      return res.status(500).json({ error: "IMGBB_API_KEY belum diatur di environment" });
    }

    console.log("📥 Upload bukti diterima untuk tugas:", tugas_id);

    // Upload ke ImgBB menggunakan base64 dari memory buffer
    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: imageFile.buffer.toString("base64"),
    });

    let imageUrl = response.url;

    // Sesuaikan domain ImgBB jika diperlukan
    if (imageUrl && imageUrl.includes("i.ibb.co/")) {
      imageUrl = imageUrl.replace("i.ibb.co/", "i.ibb.co.com/");
    }

    console.log("✅ Final image URL:", imageUrl);

    // Update tabel tugas
    const [updateResult] = await pool.query(
      `UPDATE tugas 
       SET img_url = ?, status = 'selesai', completed_at = NOW()
       WHERE tugas_id = ?`,
      [imageUrl, tugas_id]
    );

    console.log("📝 Update tugas selesai:", updateResult);

    return res.json({
      success: true,
      message: "✅ Bukti berhasil diupload dan status tugas diperbarui.",
      img_url: imageUrl,
    });
  } catch (err) {
    console.error("❌ Gagal upload bukti:", err);
    return res.status(500).json({
      error: "Gagal upload bukti",
      detail: err.message,
    });
  }
};

module.exports = {
  confirmDoneTask,
  getPetugasTasks,
  getPetugasTaskStatus,
  uploadBuktiTugas,
};