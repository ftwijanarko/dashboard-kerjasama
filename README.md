# Dashboard Reminder Kerjasama — RSUD dr. Soedono Madiun

Dashboard berbasis web untuk memantau dan mengelola data kerjasama (partnership) di **RSUD dr. Soedono Madiun**. Data ditarik secara real-time dari Google Spreadsheet melalui Google Apps Script Web App, dengan integrasi dokumen dari aplikasi **SIPEDAS**.

---

## 📋 Deskripsi

Aplikasi ini menyediakan antarmuka visual untuk memonitor seluruh perjanjian kerjasama rumah sakit, termasuk status perpanjangan, masa berlaku, dan kategori kerjasama. Tujuan utamanya adalah sebagai **sistem pengingat (reminder)** agar kerjasama yang akan habis masa berlakunya dapat segera ditindaklanjuti.

### Fitur Utama

- **Kartu Ringkasan (Summary Cards)** — Menampilkan jumlah total kerjasama berdasarkan status dan kategori:
  - Total Kerjasama
  - Perlu Perpanjangan
  - Status Berjalan
  - Proses Oleh TU
  - Proses Mitra
  - Tidak Diperpanjang
  - Kerjasama Klinis
  - Kerjasama Manajemen
- **Tabel Data Interaktif** — Menampilkan daftar kerjasama dengan kolom Nama Mitra, Judul, Tanggal Selesai, Status, dan Sumber Data.
- **Pencarian Real-time** — Filter data berdasarkan nama mitra atau judul kerjasama.
- **Sorting Multi-kolom** — Klik header tabel untuk mengurutkan data secara ascending/descending.
- **Paginasi** — Navigasi halaman dengan 20 baris per halaman.
- **Modal Detail** — Klik tombol "Detail" untuk melihat informasi lengkap kerjasama (dasar hukum, tanggal mulai/selesai, reminder 3 bulan, keterangan).
- **Integrasi Dokumen SIPEDAS** — Klik tombol "Dokumen" untuk melihat dan mengunduh berkas kerjasama dari SIPEDAS. Pencarian dokumen dilakukan berdasarkan nomor dasar hukum mitra.
- **Halaman Detail per Kategori/Status** — Klik kartu ringkasan untuk masuk ke halaman detail yang sudah difilter.
- **Docker-ready** — Tersedia Dockerfile untuk deployment (termasuk di Render.com).
- **Responsif** — Tampilan menyesuaikan layar desktop, tablet, dan ponsel.

---

## 🗂️ Struktur File

```
kerjasama/
├── index.html                          # Halaman utama dashboard
├── detail.html                         # Halaman detail per kategori/status
├── script.js                           # Logika utama dashboard (fetch data, tabel, paginasi, sorting, modal)
├── detail-script.js                    # Logika halaman detail (filter berdasarkan query parameter)
├── sipedas.js                          # Modul integrasi SIPEDAS (fetch dokumen, matching dasar hukum)
├── style.css                           # Seluruh styling (layout, kartu, tabel, modal, responsif)
├── logorssmweb.png                     # Logo RSUD dr. Soedono Madiun (aset gambar)
├── Dockerfile                          # Docker image berbasis Nginx untuk deployment
├── nginx.conf.template                 # Template konfigurasi Nginx (reverse proxy SIPEDAS)
├── .dockerignore                       # File yang dikecualikan dari Docker build
├── sipedas.Suratkerjasama.tampil.html  # Contoh response HTML dari SIPEDAS (referensi)
├── sipedas.Suratkerjasama.file.html    # Contoh response file HTML dari SIPEDAS (referensi)
├── requirement.md                      # Catatan requirement integrasi dokumen
└── README.md                           # Dokumentasi proyek
```

---

## ⚙️ Arsitektur & Cara Kerja

```
                                 fetch()                                  Read
┌──────────────┐  ──────────────────────────►  ┌─────────────────────┐  ────────►  ┌────────────────────┐
│  Browser /   │                               │  Google Apps Script  │            │  Google Spreadsheet│
│  Dashboard   │  ◄──────────────────────────  │  (Web App / API)     │  ◄────────  │  (Data Kerjasama)  │
└──────┬───────┘          JSON response        └─────────────────────┘             └────────────────────┘
       │
       │  fetch() via Nginx proxy (/sipedas/)
       │
       ▼
┌──────────────┐    proxy_pass     ┌─────────────────────────────────────────────┐
│    Nginx     │  ──────────────►  │  SIPEDAS (apprssm.rssoedono.jatimprov.go.id)│
│  (Reverse    │  ◄──────────────  │  - /Suratkerjasama/tampil (list + data-id)  │
│   Proxy)     │    HTML response  │  - /Suratkerjasama/file   (link dokumen)    │
└──────────────┘                   └─────────────────────────────────────────────┘
```

1. **Google Spreadsheet** menyimpan seluruh data kerjasama (sheet Klinis & Manajemen).
2. **Google Apps Script** dipublikasikan sebagai Web App yang menyediakan dua endpoint:
   - `GET` (tanpa parameter) — mengembalikan seluruh data ringkasan.
   - `GET ?action=getDetail&sheet=...&row=...` — mengembalikan detail satu baris kerjasama.
3. **SIPEDAS** menyimpan dokumen/berkas kerjasama. Diakses melalui Nginx reverse proxy untuk menghindari masalah CORS:
   - `/Suratkerjasama/tampil` — daftar semua kerjasama beserta `data-id`.
   - `/Suratkerjasama/file` (POST `id=...`) — daftar file/dokumen per kerjasama.
4. **Frontend (HTML/JS/CSS)** merender data ke dalam tabel dan kartu ringkasan. Tombol "Dokumen" mencocokkan nomor dasar hukum dari Google Spreadsheet dengan data SIPEDAS untuk menampilkan link file.

---

## 🚀 Cara Menjalankan

### Prasyarat

- Browser modern (Chrome, Firefox, Edge, Safari).
- Koneksi internet (untuk mengambil data dari Google Spreadsheet dan SIPEDAS).
- **Nginx** (untuk reverse proxy ke SIPEDAS) atau **Docker**.

### Opsi 1: Lokal dengan Nginx

1. Clone atau unduh repositori ini.
2. Konfigurasi Nginx agar serve file dashboard dan proxy ke SIPEDAS:
   ```nginx
   server {
       listen 80;
       server_name localhost;

       location / {
           root /path/to/kerjasama;
           index index.html;
       }

       location /sipedas/ {
           proxy_pass https://apprssm.rssoedono.jatimprov.go.id/sipedas/;
           proxy_set_header Host apprssm.rssoedono.jatimprov.go.id;
           proxy_set_header Referer https://apprssm.rssoedono.jatimprov.go.id/;
           proxy_ssl_server_name on;
       }
   }
   ```
3. Buka `http://localhost/` di browser.

### Opsi 2: Docker (untuk deployment di Render.com, dll.)

1. Build dan jalankan container:
   ```bash
   docker build -t kerjasama-dashboard .
   docker run -p 10000:10000 kerjasama-dashboard
   ```
2. Buka `http://localhost:10000/` di browser.

### Opsi 3: Tanpa Nginx (tanpa fitur dokumen)

1. Buka file `index.html` langsung di browser, atau jalankan dengan web server lokal:
   ```bash
   python -m http.server 8000
   ```
2. Dashboard berfungsi normal, tetapi tombol "Dokumen" tidak akan bisa mengambil data dari SIPEDAS karena CORS.

> **Catatan:** Data diambil dari Google Spreadsheet yang sudah dikonfigurasi. Jika ingin menggunakan spreadsheet sendiri, ubah nilai `WEB_APP_URL` di `script.js` dan `detail-script.js`.

---

## 🔧 Konfigurasi

### Mengubah Sumber Data

Pada file `script.js` dan `detail-script.js`, ubah konstanta berikut dengan URL Web App Anda sendiri:

```javascript
const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### Mengubah Jumlah Baris per Halaman

Pada `script.js`, ubah nilai variabel:

```javascript
const rowsPerPage = 20; // Ubah sesuai kebutuhan
```

### Mengubah URL SIPEDAS

Pada file `sipedas.js`, ubah konstanta:

```javascript
const SIPEDAS_BASE_URL = '/sipedas'; // Path relatif melalui Nginx proxy
```

---

## 🎨 Status Kerjasama & Warna

| Status                      | Warna       | CSS Class                              |
| --------------------------- | ----------- | -------------------------------------- |
| Perlu Proses Perpanjangan   | 🟠 Oranye  | `.status-perlu-proses-perpanjangan`    |
| Berjalan                    | 🟢 Hijau   | `.status-berjalan`                     |
| Proses Oleh TU              | 🟡 Kuning  | `.status-proses-oleh-tu`               |
| Proses Mitra                | 🔴 Merah   | `.status-proses-mitra`                 |
| Tidak Diperpanjang          | ⚫ Abu tua  | `.status-tidak-diperpanjang`           |
| Default / Lainnya           | ⚪ Abu muda | `.status-default`                      |

---

## 📱 Responsivitas

- **Desktop (≥900px)** — Grid kartu 3 kolom, tabel penuh.
- **Tablet (501–899px)** — Grid kartu auto-fit (2 kolom), tabel bisa di-scroll horizontal.
- **Mobile (≤500px)** — Grid kartu 1 kolom, paginasi dan footer menumpuk vertikal.

---

## 🛠️ Teknologi

| Komponen          | Teknologi                                   |
| ----------------- | ------------------------------------------- |
| Frontend          | HTML5, CSS3, Vanilla JavaScript             |
| Backend / API     | Google Apps Script (Web App)                |
| Database          | Google Spreadsheet                          |
| Dokumen           | SIPEDAS (via Nginx reverse proxy)           |
| Reverse Proxy     | Nginx                                       |
| Containerization  | Docker (nginx:stable-alpine)                |
| Hosting           | Render.com atau server statis dengan Nginx  |

---

## 👤 Updated By

**Fajar Trio Wijanarko** — RSUD dr. Soedono Madiun

&copy; 2025 RSUD dr. Soedono Madiun. All rights reserved.
