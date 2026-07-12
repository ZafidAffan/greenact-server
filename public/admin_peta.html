<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Peta Laporan Sampah - Admin</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background-color: #F5F0CD;
    }

    nav {
      background-color: #347433;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      color: white;
    }

    nav a {
      color: white;
      margin-right: 16px;
      text-decoration: none;
      font-weight: bold;
    }

    #map {
      height: 90vh;
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body>
  <nav>
    <div>
      <a href="/admin/dashboard">Dashboard</a>
      <a href="/admin_laporan.html">Daftar Laporan</a>
      <a href="/admin/riwayat">Riwayat</a>
      <a href="/admin/peta">Peta</a>
    </div>
    <div>Admin <i class="fas fa-user-shield"></i></div>
  </nav>

  <div id="map"></div>

  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    // inisialisasi peta
    const map = L.map('map').setView([-6.8333, 108.2167], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // ambil data laporan dari backend
    async function loadReportLocations() {
      try {
        const res = await fetch('/locations');
        if (!res.ok) throw new Error('Gagal fetch lokasi');

        const data = await res.json();

        data.forEach(report => {
          const marker = L.marker([report.lat, report.lng]).addTo(map);
          marker.bindPopup(`
            <b>${report.title}</b><br>
            Status: ${report.status}
          `);
        });

      } catch (err) {
        console.error(err);
      }
    }

    loadReportLocations();
  </script>
</body>
</html>
