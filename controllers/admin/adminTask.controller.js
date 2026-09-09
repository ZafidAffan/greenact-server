// controllers/adminTask.controller.js
const pool = require('../../config/db'); // Sesuaikan dengan koneksi database-mu
const { invalidateAdminCache } = require('./adminReport.controller'); // Opsional untuk bersihkan cache

//==============================
// 1. Ambil Semua Daftar Tugas
//=============================
const getAdminTugas = async (req, res) => {
  try {
    const dbPool = pool.promise ? pool.promise() : pool;
    const [rows] = await dbPool.query("SELECT * FROM tugas");
    return res.json(rows);
  } catch (err) {
    console.error("Error ambil tugas:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

//==========================================================
// 2. Konfirmasi / Verifikasi Tugas Selesai (Versi ID Tugas)
//=========================================================
const confirmTask = async (req, res) => {
  const { tugas_id, status_final } = req.body;

  if (!tugas_id || !status_final) {
    return res.status(400).json({ error: "tugas_id dan status_final wajib diisi" });
  }

  try {
    const admin_id = req.session && req.session.user ? req.session.user.id : 1; 

    const dbPool = pool.promise ? pool.promise() : pool;
    const [result] = await dbPool.query(
      "UPDATE tugas SET status_final = ?, verified_by = ?, verified_at = NOW() WHERE tugas_id = ?",
      [status_final, admin_id, tugas_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tugas tidak ditemukan" });
    }

    return res.json({ message: "Tugas berhasil dikonfirmasi selesai" });
  } catch (err) {
    console.error("Error konfirmasi tugas:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

//========================================================
// 3. Ambil Daftar Bukti Tugas 
//========================================================
const getBuktiList = async (req, res) => {
  try {
    const dbPool = pool.promise ? pool.promise() : pool;

    const [rows] = await dbPool.query(`
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

    return res.json({
      success: true,
      bukti: rows,
    });
  } catch (err) {
    console.error("❌ Gagal ambil daftar bukti:", err);
    return res.status(500).json({
      error: "Gagal ambil daftar bukti",
      detail: err.message,
    });
  }
};

//================================================
// 4. Verifikasi Bukti Tugas berdasarkan Report ID 
//===============================================
const verifyBukti = async (req, res) => {
  try {
    const { report_id, status_final, verified_by } = req.body;

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

    const adminId = req.session && req.session.user ? req.session.user.id : (verified_by || null);

    const dbPool = pool.promise ? pool.promise() : pool;

    await dbPool.query(
      `UPDATE tugas
       SET status_final = ?,
           verified_by = ?,
           verified_at = NOW()
       WHERE report_id = ?`,
      [status_final, adminId, report_id]
    );

    return res.json({
      success: true,
      message: `Laporan #${report_id} berhasil ${status_final}`,
    });
  } catch (err) {
    console.error("❌ Gagal verifikasi bukti:", err);
    return res.status(500).json({
      error: "Gagal verifikasi bukti",
      detail: err.message,
    });
  }
};

//================================================
// 5. Assign Task (Menugaskan Petugas ke Laporan)
//===============================================
const assignTaskToPetugas = async (req, res) => {
  try {
    const { report_id, petugas_id } = req.body;

    if (!report_id || !petugas_id) {
      return res.status(400).json({ error: "report_id dan petugas_id wajib diisi" });
    }

    const dbPool = pool.promise ? pool.promise() : pool;

    const [report] = await dbPool.query(
      "SELECT latitude, longitude FROM reports WHERE report_id = ?",
      [report_id]
    );

    if (report.length === 0) {
      return res.status(404).json({ error: "Report tidak ditemukan" });
    }

    const { latitude, longitude } = report[0];

    const [insertResult] = await dbPool.query(
      `INSERT INTO tugas 
        (report_id, petugas_id, latitude, longitude, status, assigned_at)
       VALUES (?, ?, ?, ?, 'menunggu', NOW())`,
      [report_id, petugas_id, latitude, longitude]
    );

    await dbPool.query(
      "UPDATE reports SET status = 'proses' WHERE report_id = ?",
      [report_id]
    );

    if (typeof invalidateAdminCache === 'function') {
      invalidateAdminCache();
    }

    return res.json({
      success: true,
      message: `Laporan #${report_id} berhasil dikirim ke petugas #${petugas_id}`,
      inserted_tugas_id: insertResult.insertId,
    });
  } catch (err) {
    console.error("❌ Gagal assign task:", err);
    return res.status(500).json({
      error: "Gagal assign task",
      detail: err.message,
    });
  }
};

// Tambahkan fungsi ini di dalam controllers/adminTask.controller.js

//================================================
// 6. Ambil Daftar Petugas (untuk pilihan assign task)
//===============================================
const getPetugasList = async (req, res) => {
  try {
    console.log("📡 [SERVER] Mengambil daftar petugas...");

    const dbPool = pool.promise ? pool.promise() : pool;
    const [rows] = await dbPool.query(
      "SELECT petugas_id, name AS nama, phone AS no_hp FROM petugas"
    );

    console.log("✅ [SERVER] Hasil query petugas:", rows);

    return res.json(rows);
  } catch (err) {
    console.error("❌ [SERVER] Gagal ambil petugas:", err);
    return res.status(500).json({
      error: "Gagal ambil daftar petugas",
      detail: err.message
    });
  }
};

module.exports = {
  getAdminTugas,
  confirmTask,
  getBuktiList,
  verifyBukti,
  assignTaskToPetugas,
  getPetugasList,
};