# GreenAct Backend API Documentation

## Base URL
```
http://localhost:8080
```

## Overview

GreenAct adalah sistem pelaporan warga berbasis lokasi (mirip program "Jumat Bersih") dengan 4 role pengguna:

| Role | Deskripsi |
|------|-----------|
| `warga` | Membuat laporan, memantau status laporan sendiri |
| `petugas` | Menerima & menyelesaikan tugas lapangan, upload bukti |
| `admin` | Memverifikasi laporan, assign tugas ke petugas, kelola dashboard |
| `kepala_desa` | Menjadwalkan kegiatan (jadwal_jumat_bersih) dari laporan yang diteruskan |

## Required Headers

### Authentication (Session/Cookie)
GreenAct menggunakan **session-based authentication** (`express-session`), bukan token JWT/Bearer. Setelah login berhasil, server menyimpan data user ke `req.session.user` dan mengirim session cookie ke client.

- Client (browser/Postman) harus mengizinkan cookie dikirim di setiap request (`credentials: include` di fetch, atau `withCredentials: true` di axios).
- Session cookie berlaku selama **24 jam** (`maxAge: 1000 * 60 * 60 * 24`).
- Endpoint yang dilindungi diproteksi oleh middleware `isAuthenticated` (memastikan sudah login) dan `requireRole([...roles])` (memastikan role sesuai).

```
Cookie: connect.sid=<session_id>
```

> **Catatan:** `cookie.secure` saat ini bernilai `false`. Set ke `true` saat sudah menggunakan HTTPS di production.

### Content-Type
```
Content-Type: application/json
```
Untuk endpoint upload file (bukti tugas, foto laporan), gunakan:
```
Content-Type: multipart/form-data
```

## Response Format

Response API **belum sepenuhnya seragam** antar endpoint (mengikuti implementasi aktual di controller). Pola yang umum ditemui:

**Pola 1 — dengan wrapper `success`:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

**Pola 2 — data langsung (tanpa wrapper), umum di endpoint `GET`:**
```json
[ { }, { } ]
```

**Error responses** umumnya:
```json
{
  "error": "Error message description"
}
```

---

## Table of Contents

1. [Auth - Warga](#auth---warga)
2. [Auth - Petugas](#auth---petugas)
3. [Auth - Admin](#auth---admin)
4. [Auth - Kepala Desa](#auth---kepala-desa)
5. [Wilayah](#wilayah)
6. [Lokasi (Peta)](#lokasi-peta)
7. [Warga - Profil & Status](#warga---profil--status)
8. [Warga - Laporan](#warga---laporan)
9. [Petugas - Tugas](#petugas---tugas)
10. [Admin - Dashboard](#admin---dashboard)
11. [Admin - Laporan](#admin---laporan)
12. [Admin - Aksi Laporan](#admin---aksi-laporan)
13. [Admin - Tugas & Petugas](#admin---tugas--petugas)
14. [Kepala Desa - Jadwal](#kepala-desa---jadwal)
15. [Error Responses](#error-responses)

---

## Auth - Warga

### Register Warga

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `POST` | `/api/warga/auth/register` | No |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "kecamatan": "Majalengka",
  "desa": "Cikijing",
  "password": "password123"
}
```
Semua field wajib diisi (`name`, `email`, `password`, `kecamatan`, `desa`); `phone` opsional.

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "userId": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "kecamatan": "Majalengka",
  "desa": "Cikijing"
}
```

**Error Responses:**
```json
{ "error": "Kolom email wajib diisi" }
```
```json
{ "error": "Email sudah terdaftar" }
```

---

### Login Warga

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `POST` | `/api/warga/auth/login` | No |

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "userId": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "desa": "Cikijing",
  "kecamatan": "Majalengka"
}
```
Session tersimpan di server dengan `role: "warga"`.

**Error Responses:**
```json
{ "error": "Email tidak ditemukan" }
```
```json
{ "error": "Password salah" }
```

---

## Auth - Petugas

> **Catatan:** Route ini tersedia di `routes/auth/petugasAuth.routes.js` namun tidak ditemukan pemasangannya (`app.use`) di `index.js` yang diberikan. Path di bawah mengikuti pola penamaan role lain (`/api/petugas/auth`) — sesuaikan dengan mount path aktual di `index.js` Anda.

### Register Petugas

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `POST` | `/api/petugas/auth/register` | No |

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567891",
  "password": "password123",
  "status_bertugas": "tidak"
}
```
`name`, `email`, `password` wajib. `status_bertugas` default `"tidak"` jika tidak dikirim.

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Registrasi petugas berhasil",
  "petugasId": 1,
  "name": "Budi Santoso",
  "email": "budi@example.com"
}
```

**Error Responses:**
```json
{ "error": "Nama, email, dan password wajib diisi." }
```
```json
{ "error": "Email sudah terdaftar." }
```

---

### Login Petugas

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `POST` | `/api/petugas/auth/login` | No |

**Request Body:**
```json
{
  "email": "budi@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "petugasId": 1,
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567891",
  "tugas_selesai": 0,
  "status_bertugas": "tidak"
}
```
Session tersimpan dengan `role: "petugas"`.

**Error Responses:**
```json
{ "error": "Email tidak ditemukan" }
```
```json
{ "error": "Password salah" }
```

---

## Auth - Admin

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `POST` | `/api/auth/admin/register` | No |
| `POST` | `/api/auth/admin/login` | No |
| `GET` | `/api/auth/admin/me` | Yes (session) |

### Register Admin

**Request Body:**
```json
{
  "name": "Admin Satu",
  "email": "admin@example.com",
  "password": "password123",
  "confirm": "password123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Pendaftaran berhasil. Silakan login.",
  "adminId": 1
}
```

**Error Responses:**
```json
{ "success": false, "message": "Semua kolom wajib diisi." }
```
```json
{ "success": false, "message": "Format email tidak valid." }
```
```json
{ "success": false, "message": "Konfirmasi password tidak cocok." }
```
```json
{ "success": false, "message": "Email sudah terdaftar." }
```

---

### Login Admin

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "admin": {
    "id": 1,
    "name": "Admin Satu",
    "email": "admin@example.com"
  }
}
```
Session tersimpan dengan `role: "admin"`.

**Error Responses:**
```json
{ "error": "Email dan password wajib diisi." }
```
```json
{ "error": "Email tidak ditemukan." }
```
```json
{ "error": "Password salah." }
```

---

### Get Admin Session (`/me`)

Mengecek apakah sesi admin masih aktif.

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Admin Satu",
  "email": "admin@example.com"
}
```

**Error Response (401 Unauthorized):**
```json
{ "error": "Belum login sebagai admin" }
```

---

## Auth - Kepala Desa

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `POST` | `/api/auth/kades/register` | No |
| `POST` | `/api/auth/kades/login` | No |

### Register Kepala Desa

**Request Body:**
```json
{
  "nama": "Kepala Desa A",
  "email": "kades@example.com",
  "password": "password123",
  "desa": "Cikijing",
  "kecamatan": "Majalengka"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Register berhasil",
  "kepala_desa_id": 1
}
```

**Error Responses:**
```json
{ "success": false, "message": "Semua field wajib diisi" }
```
```json
{ "success": false, "message": "Email sudah digunakan" }
```

---

### Login Kepala Desa

**Request Body:**
```json
{
  "email": "kades@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "kades_id": 1,
  "nama": "Kepala Desa A",
  "desa": "Cikijing",
  "kecamatan": "Majalengka",
  "email": "kades@example.com"
}
```
Session tersimpan dengan `role: "kepala_desa"`.

**Error Response (401 Unauthorized):**
```json
{ "success": false, "message": "Email atau password salah" }
```

---

## Wilayah

Base path: `/`

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `GET` | `/kecamatan` | No |
| `GET` | `/desa` | No |
| `GET` | `/desa/:kecamatan_id` | No |

### Get All Kecamatan

**Response (200 OK):**
```json
[
  { "kecamatan_id": 1, "nama_kecamatan": "Majalengka" }
]
```

### Get All Desa (dengan nama kecamatan)

**Response (200 OK):**
```json
[
  {
    "desa_id": 1,
    "nama_desa": "Cikijing",
    "kecamatan_id": 1,
    "nama_kecamatan": "Majalengka"
  }
]
```

### Get Desa by Kecamatan

**URL Parameters:** `kecamatan_id` (integer)

**Response (200 OK):**
```json
[
  { "desa_id": 1, "nama_desa": "Cikijing", "kecamatan_id": 1 }
]
```

Semua endpoint di atas mengembalikan array kosong `[]` jika data tidak ditemukan (bukan 404), dan `{ "success": false, "message": "..." }` jika terjadi error database.

---

## Lokasi (Peta)

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `GET` | `/locations` | No |

Mengambil seluruh titik lokasi laporan untuk ditampilkan di peta.

**Response (200 OK):**
```json
[
  {
    "title": "Sampah menumpuk di pinggir jalan",
    "lat": -6.8333,
    "lng": 108.2333
  }
]
```

**Error Response (500):**
```json
{ "error": "Gagal mengambil data lokasi: <detail>" }
```

---

## Warga - Profil & Status

### Get User Profile

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `GET` | `/user?user_id=1` | No* |

*Route ini tidak dibungkus `isAuthenticated` di `index.js`, meskipun secara logika hanya relevan untuk user yang login.

**Query Parameters:** `user_id` (integer, wajib)

**Response (200 OK):**
```json
{
  "user_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "desa": "Cikijing",
  "kecamatan": "Majalengka",
  "created_at": "2025-01-10T08:00:00.000Z"
}
```

**Error Responses:**
```json
{ "error": "User ID tidak valid" }
```
```json
{ "error": "User tidak ditemukan" }
```

---

### Get Report Status Summary

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| `GET` | `/report-status?user_id=1` | No* |

Mengambil ringkasan jumlah laporan warga per kategori status (untuk 3 card dashboard warga).

**Response (200 OK):**
```json
{
  "dilaporkan": 2,
  "diproses": 3,
  "selesai": 5
}
```

Mapping status database → kategori:
- `pending` → `dilaporkan`
- `diteruskan ke kepala desa`, `dijadwalkan`, `dalam perjalanan` → `diproses`
- `selesai` → `selesai`
- `ditolak` → tidak dihitung

**Error Response:**
```json
{ "error": "User ID tidak ditemukan" }
```

---

## Warga - Laporan

> Endpoint di bawah dilindungi `isAuthenticated` + `requireRole(['warga'])`.

### Create Report

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `POST` | `/report` | Yes | `warga` |

**Content-Type:** `multipart/form-data`

**Form Data:**
- `user_id` (wajib)
- `description` (wajib)
- `latitude` (wajib)
- `longitude` (wajib)
- `address` (wajib)
- `kecamatan` (wajib)
- `desa` (wajib)
- `image` (file, wajib — diupload ke ImgBB)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Laporan berhasil dikirim",
  "report_id": 10,
  "image_url": "https://i.ibb.co.com/xxxxx/photo.jpg",
  "kecamatan": "Majalengka",
  "desa": "Cikijing"
}
```

**Error Responses:**
```json
{ "success": false, "error": "Semua field wajib diisi termasuk kecamatan, desa, dan image" }
```
```json
{ "success": false, "error": "IMGBB_API_KEY belum diatur di environment" }
```

---

### Get My Reports

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `GET` | `/user-report?user_id=1` | Yes | `warga` |

Response di-cache di memori server (NodeCache, TTL 60 detik) per `user_id`.

**Response (200 OK):**
```json
[
  {
    "report_id": 10,
    "description": "Sampah menumpuk",
    "address": "Jl. Raya Cikijing",
    "kecamatan": "Majalengka",
    "desa": "Cikijing",
    "status": "pending",
    "image_path": "https://i.ibb.co.com/xxxxx/photo.jpg",
    "created_at": "2026-01-05T02:00:00.000Z"
  }
]
```

**Error Response:**
```json
{ "error": "user_id wajib diisi" }
```

---

## Petugas - Tugas

> Endpoint di bawah dilindungi `isAuthenticated` + `requireRole(['petugas'])`, mount path: `/petugas`.

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `GET` | `/petugas/tugas?petugas_id=1` | Yes | `petugas` |
| `GET` | `/petugas/tugas-status?petugas_id=1` | Yes | `petugas` |
| `POST` | `/petugas/confirm-done` | Yes | `petugas` |
| `POST` | `/petugas/upload-bukti` | Yes | `petugas` |

### Get Petugas Tasks

**Query Parameters:** `petugas_id` (wajib)

**Response (200 OK):**
```json
{
  "tugas": [
    {
      "tugas_id": 1,
      "report_id": 10,
      "petugas_id": 1,
      "status": "menunggu",
      "assigned_at": "2026-01-05T02:10:00.000Z",
      "completed_at": null,
      "status_final": null,
      "verified_by": null,
      "verified_at": null,
      "latitude": -6.8333,
      "longitude": 108.2333,
      "address": "Jl. Raya Cikijing",
      "img_url": null
    }
  ]
}
```

**Error Response:**
```json
{ "error": "petugas_id wajib" }
```

---

### Get Petugas Task Status

**Query Parameters:** `petugas_id` (wajib)

**Response (200 OK):**
```json
{
  "baru": 2,
  "dalamProses": 1,
  "selesai": 5
}
```

---

### Confirm Done Task (Upload Bukti Penyelesaian)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `report_id` (wajib)
- `keterangan` (wajib)
- `image` (file, wajib)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bukti laporan #10 berhasil dikirim & menunggu verifikasi.",
  "bukti_url": "https://i.ibb.co.com/xxxxx/bukti.jpg"
}
```
Efek samping: `reports.status` → `selesai`, `tugas.status` → `selesai`, `tugas.status_final` → `menunggu verifikasi`.

**Error Response:**
```json
{ "error": "report_id, keterangan, dan foto bukti wajib diisi" }
```

---

### Upload Bukti Tugas

**Content-Type:** `multipart/form-data`

**Form Data:**
- `tugas_id` (wajib)
- `bukti` (file, wajib)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "✅ Bukti berhasil diupload dan status tugas diperbarui.",
  "img_url": "https://i.ibb.co.com/xxxxx/bukti.jpg"
}
```
Efek samping: `tugas.status` → `selesai`, `tugas.completed_at` diisi.

**Error Response:**
```json
{ "error": "tugas_id dan file bukti wajib dikirim" }
```

---

## Admin - Dashboard

> Mount path: `/api/admin`, dilindungi `isAuthenticated` + `requireRole(['admin'])`.

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `GET` | `/api/admin/dashboard` | Yes | `admin` |
| `GET` | `/api/admin/dashboard-data` | Yes | `admin` |
| `GET` | `/admin/peta` | Yes | `admin` |

### Get Dashboard Data

**Response (200 OK):**
```json
{
  "success": true,
  "pending": 4,
  "proses": 2,
  "selesai": 10
}
```

### Get Dashboard Page / Get Peta Page

Mengembalikan file HTML statis (`admin_dashboard.html`, `admin_peta.html`) — bukan JSON.

---

## Admin - Laporan

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `GET` | `/api/admin/laporan` | Yes | `admin` |

Response di-cache di Redis (key `all_admin_reports`, TTL 300 detik).

**Response (200 OK):**
```json
[
  {
    "report_id": 10,
    "user_id": 1,
    "description": "Sampah menumpuk",
    "latitude": -6.8333,
    "longitude": 108.2333,
    "address": "Jl. Raya Cikijing",
    "kecamatan": "Majalengka",
    "desa": "Cikijing",
    "img_url": "https://i.ibb.co.com/xxxxx/photo.jpg",
    "status": "pending",
    "created_at": "2026-01-05T02:00:00.000Z"
  }
]
```

---

## Admin - Aksi Laporan

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `PUT` | `/api/admin/terima-laporan/:report_id` | Yes | `admin` |
| `GET` | `/api/admin/bukti-list` | Yes | `admin` |
| `POST` | `/api/admin/verify-bukti` | Yes | `admin` |

> **Catatan:** `GET /api/admin/bukti-list` dan `POST /api/admin/verify-bukti` didefinisikan **dua kali** — sekali di `adminAction.routes.js` dan sekali di `adminTask.routes.js`, keduanya di-mount ke prefix `/api/admin`. Router yang terakhir didaftarkan di `index.js` (`adminTask.routes`) akan menimpa/mengalahkan handler dari `adminAction.routes` untuk path yang sama. Disarankan untuk merapikan agar tidak ambigu.

### Terima / Teruskan Laporan ke Kepala Desa

**URL Parameters:** `report_id`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil diverifikasi dan diteruskan ke Kepala Desa!"
}
```
Hanya berhasil jika status laporan saat ini `pending`.

**Error Responses:**
```json
{ "error": "Laporan tidak ditemukan." }
```
```json
{ "error": "Laporan tidak ditemukan atau sudah diproses sebelumnya." }
```

### Get Bukti List (Admin)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "tugas_id": 1,
      "report_id": 10,
      "petugas_id": 1,
      "status": "selesai",
      "status_final": "menunggu verifikasi",
      "bukti_url": "https://i.ibb.co.com/xxxxx/bukti.jpg",
      "completed_at": "2026-01-05T05:00:00.000Z",
      "address": "Jl. Raya Cikijing"
    }
  ]
}
```

### Verify Bukti (Admin)

**Request Body:**
```json
{
  "report_id": 10,
  "status_final": "diterima"
}
```
`status_final`: `"diterima"` atau `"ditolak"`. Jika `"diterima"`, `reports.status` otomatis diubah menjadi `selesai`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bukti tugas berhasil diverifikasi dengan status: diterima"
}
```

---

## Admin - Tugas & Petugas

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `GET` | `/api/admin/tugas` | Yes | `admin` |
| `POST` | `/api/admin/confirm-tugas` | Yes | `admin` |
| `GET` | `/api/admin/bukti-list` | Yes | `admin` |
| `POST` | `/api/admin/verify-bukti` | Yes | `admin` |
| `POST` | `/api/admin/assign-task` | Yes | `admin` |
| `GET` | `/api/admin/get-petugas` | Yes | `admin` |

### Get Admin Tugas (Semua)

**Response (200 OK):**
```json
[
  { "tugas_id": 1, "report_id": 10, "petugas_id": 1, "status": "menunggu" }
]
```

### Confirm Task

**Request Body:**
```json
{
  "tugas_id": 1,
  "status_final": "diterima"
}
```

**Response (200 OK):**
```json
{ "message": "Tugas berhasil dikonfirmasi selesai" }
```

**Error Responses:**
```json
{ "error": "tugas_id dan status_final wajib diisi" }
```
```json
{ "error": "Tugas tidak ditemukan" }
```

### Get Bukti List (versi adminTask)

Sama seperti pada [Admin - Aksi Laporan](#admin---aksi-laporan), namun query JOIN ke `reports` dan `tugas` sekaligus, termasuk `user_id`.

### Verify Bukti (versi adminTask)

**Request Body:**
```json
{
  "report_id": 10,
  "status_final": "disetujui",
  "verified_by": 1
}
```
`status_final` harus salah satu dari: `menunggu`, `menunggu verifikasi`, `disetujui`, `ditolak`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan #10 berhasil disetujui"
}
```

### Assign Task ke Petugas

**Request Body:**
```json
{
  "report_id": 10,
  "petugas_id": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan #10 berhasil dikirim ke petugas #1",
  "inserted_tugas_id": 5
}
```
Efek samping: insert ke `tugas`, `reports.status` → `proses`.

**Error Response:**
```json
{ "error": "Report tidak ditemukan" }
```

### Get Daftar Petugas

**Response (200 OK):**
```json
[
  { "petugas_id": 1, "nama": "Budi Santoso", "no_hp": "081234567891" }
]
```

---

## Kepala Desa - Jadwal

> Mount path: `/kepala-desa`, dilindungi `isAuthenticated` + `requireRole(['kepala_desa'])`. Data di-cache di Redis (TTL 300 detik per desa).

| Method | Endpoint | Auth Required | Role |
|--------|----------|---------------|------|
| `GET` | `/kepala-desa/laporan-siap-jadwal/:desa` | Yes | `kepala_desa` |
| `POST` | `/kepala-desa/buat-jadwal` | Yes | `kepala_desa` |
| `PUT` | `/kepala-desa/jadwal/:id/status` | Yes | `kepala_desa` |
| `GET` | `/kepala-desa/jadwal/:desa` | Yes | `kepala_desa` |
| `PUT` | `/kepala-desa/jadwal/:id/selesai` | Yes | `kepala_desa` |

### Get Laporan Siap Dijadwalkan

**URL Parameters:** `desa`

Mengambil laporan dengan status `diteruskan ke kepala desa` untuk desa tersebut.

**Response (200 OK):**
```json
[
  {
    "report_id": 10,
    "desa": "Cikijing",
    "status": "diteruskan ke kepala desa"
  }
]
```

### Buat Jadwal

**Request Body:**
```json
{
  "report_id": 10,
  "tanggal": "2026-01-16",
  "waktu": "07:00",
  "lokasi": "Balai Desa Cikijing",
  "deskripsi": "Kerja bakti membersihkan saluran air",
  "latitude": -6.8333,
  "longitude": 108.2333
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Jadwal berhasil dibuat dan status laporan diperbarui!",
  "jadwal_id": 3
}
```
Efek samping: insert ke `jadwal_jumat_bersih` (status `dijadwalkan`), update `reports.status` → `dijadwalkan`, invalidasi cache.

**Error Response:**
```json
{ "error": "Report tidak ditemukan" }
```

### Update Status Jadwal

**URL Parameters:** `id` (jadwal_id)

**Request Body:**
```json
{ "status": "dalam perjalanan" }
```
Nilai valid: `dijadwalkan`, `dalam perjalanan`, `selesai`.

**Response (200 OK):**
```json
{ "success": true, "message": "Status berhasil diupdate" }
```

**Error Response:**
```json
{ "error": "Status tidak valid" }
```

### Get Jadwal per Desa

**URL Parameters:** `desa`

**Response (200 OK):**
```json
[
  {
    "jadwal_id": 3,
    "report_id": 10,
    "desa": "Cikijing",
    "status": "dijadwalkan",
    "tanggal": "2026-01-16",
    "waktu": "07:00",
    "lokasi": "Balai Desa Cikijing"
  }
]
```

### Selesaikan Jadwal + Upload Bukti Foto

**URL Parameters:** `id` (jadwal_id)

**Request Body:**
```json
{ "bukti_foto": "https://i.ibb.co.com/xxxxx/kegiatan.jpg" }
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Kegiatan selesai + bukti foto tersimpan"
}
```

**Error Responses:**
```json
{ "error": "Bukti foto wajib diisi" }
```
```json
{ "error": "Jadwal tidak ditemukan" }
```

---

## Error Responses

Error umum yang mungkin muncul di berbagai endpoint:

### 400 Bad Request
```json
{ "error": "Field wajib tidak lengkap" }
```

### 401 Unauthorized
```json
{ "success": false, "message": "Unauthorized: Silakan login terlebih dahulu" }
```

### 404 Not Found
```json
{ "error": "Data tidak ditemukan" }
```

### 500 Internal Server Error
```json
{ "error": "Terjadi kesalahan server", "detail": "<pesan error>" }
```

---

## Catatan Teknis

1. Autentikasi berbasis **session/cookie** (`express-session`), bukan JWT — semua request ke endpoint terproteksi wajib mengirim cookie session.
2. Upload gambar (foto laporan, bukti tugas) disimpan via **ImgBB** (`imgbb-uploader`), memerlukan `IMGBB_API_KEY` di environment. URL hasil upload dengan domain `i.ibb.co/` otomatis diubah menjadi `i.ibb.co.com/`.
3. Cache diterapkan di dua lapisan:
   - **Redis** — untuk data laporan admin, jadwal & laporan siap-jadwal per desa (TTL 300 detik).
   - **In-memory (NodeCache)** — untuk riwayat laporan warga per `user_id` (TTL 60 detik).
4. Status laporan (`reports.status`) yang dikenali: `pending`, `diteruskan ke kepala desa`, `dijadwalkan`, `dalam perjalanan`, `selesai`, `ditolak`, `proses`.
5. Status tugas petugas (`tugas.status_final`) yang dikenali: `menunggu`, `menunggu verifikasi`, `disetujui`/`diterima`, `ditolak`.
6. File statis hasil upload dapat diakses melalui path `/upload`.
7. Ditemukan beberapa route yang **path-nya duplikat** antar file (`GET /api/admin/bukti-list` dan `POST /api/admin/verify-bukti` ada di `adminAction.routes.js` maupun `adminTask.routes.js`) — perlu dirapikan agar tidak terjadi konflik handler.
