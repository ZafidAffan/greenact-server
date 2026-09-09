// controllers/report.controller.js
const db = require("../../config/db"); // sesuaikan path database kamu
const imgbbUploader = require("imgbb-uploader");
const { invalidateUserReportCache } = require("./wargaReport.controller");
const { invalidateAdminCache } = require("../admin/adminReport.controller");

const createReport = async (req, res) => {
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

    // Validasi Input
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
        error: "Semua field wajib diisi termasuk kecamatan, desa, dan image",
      });
    }

    if (!process.env.IMGBB_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "IMGBB_API_KEY belum diatur di environment",
      });
    }

    // Upload ke ImgBB
    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: imageFile.buffer.toString("base64"),
    });

    const imageUrl = response.url;

    // Simpan ke Database
    const sql = `
      INSERT INTO reports (
        user_id, description, latitude, longitude, address, kecamatan, desa, img_url, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    db.query(
      sql,
      [user_id, description, latitude, longitude, address, kecamatan, desa, imageUrl],
      (err, result) => {
        if (err) {
          console.error("❌ DB Error:", err);
          return res.status(500).json({
            success: false,
            error: "Gagal menyimpan ke database",
            detail: err.message,
          });
        }

        // Invalidasi Cache
        invalidateUserReportCache(user_id);
        invalidateAdminCache();

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
};

module.exports = {
  createReport,
};