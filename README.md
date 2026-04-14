# Dashboard Reminder Kerjasama — RSUD dr. Soedono Madiun

Dashboard berbasis web untuk memantau dan mengelola data kerjasama (partnership) di **RSUD dr. Soedono Madiun**. Data ditarik secara real-time dari Google Spreadsheet melalui Google Apps Script Web App, termasuk URL dokumen kerjasama.

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
- **Tombol Dokumen** — Klik tombol "Dokumen" untuk melihat dan mengunduh berkas kerjasama (PDF). URL dokumen diambil langsung dari kolom URL di Google Spreadsheet.
- **Halaman Detail per Kategori/Status** — Klik kartu ringkasan untuk masuk ke halaman detail yang sudah difilter.
- **Docker-ready** — Tersedia Dockerfile untuk deployment (termasuk di Render.com).
- **Responsif** — Tampilan menyesuaikan layar desktop, tablet, dan ponsel.

---

## 🗂️ Struktur File

```
kerjasama/
├── index.html          # Halaman utama dashboard
├── detail.html         # Halaman detail per kategori/status
├── script.js           # Logika utama dashboard (fetch data, tabel, paginasi, sorting, modal)
├── detail-script.js    # Logika halaman detail (filter berdasarkan query parameter)
├── sipedas.js          # Handler dokumen (parse URL dari spreadsheet, tampilkan file modal)
├── style.css           # Seluruh styling (layout, kartu, tabel, modal, responsif)
├── logorssmweb.png     # Logo RSUD dr. Soedono Madiun (aset gambar)
├── Dockerfile          # Docker image berbasis Nginx untuk deployment
├── nginx.conf.template # Template konfigurasi Nginx untuk Docker
├── .dockerignore       # File yang dikecualikan dari Docker build
├── requirement.md      # Catatan requirement proyek
└── README.md           # Dokumentasi proyek
```

---

## ⚙️ Arsitektur & Cara Kerja

```
┌──────────────┐     fetch()      ┌─────────────────────┐     Read     ┌────────────────────┐
│  Browser /   │ ──────────────►  │  Google Apps Script  │ ──────────►  │  Google Spreadsheet│
│  Dashboard   │ ◄──────────────  │  (Web App / API)     │ ◄──────────  │  (Data + URL Dok.) │
└──────────────┘   JSON response  └─────────────────────┘              └────────────────────┘
```

1. **Google Spreadsheet** menyimpan seluruh data kerjasama (sheet Klinis & Manajemen), termasuk URL dokumen:
   - Sheet "Kerjasama Klinis UPDATE" → kolom L (URL)
   - Sheet "Kerjasama Manajemen Update UPDATE" → kolom N (URL)
2. **Google Apps Script** dipublikasikan sebagai Web App yang menyediakan dua endpoint:
   - `GET` (tanpa parameter) — mengembalikan seluruh data ringkasan (termasuk field `url`).
   - `GET ?action=getDetail&sheet=...&row=...` — mengembalikan detail satu baris kerjasama.
3. **Frontend (HTML/JS/CSS)** melakukan `fetch()` ke Web App URL, lalu merender data ke dalam tabel dan kartu ringkasan. Tombol "Dokumen" langsung menggunakan URL dari data spreadsheet untuk menampilkan link dokumen PDF.

---

## 🚀 Cara Menjalankan

### Prasyarat

- Browser modern (Chrome, Firefox, Edge, Safari).
- Koneksi internet (untuk mengambil data dari Google Spreadsheet).

### Opsi 1: Langsung di browser

1. Clone atau unduh repositori ini.
2. Buka file `index.html` langsung di browser, **atau** jalankan dengan web server lokal:
   ```bash
   # Contoh menggunakan Python:
   python -m http.server 8000
   # lalu buka http://localhost:8000/index.html
   ```
3. Dashboard akan otomatis memuat data dari Google Spreadsheet yang terhubung.

### Opsi 2: Docker (untuk deployment di Render.com, dll.)

1. Build dan jalankan container:
   ```bash
   docker build -t kerjasama-dashboard .
   docker run -p 10000:10000 kerjasama-dashboard
   ```
2. Buka `http://localhost:10000/` di browser.

> **Catatan:** Data diambil dari Google Spreadsheet yang sudah dikonfigurasi. Jika ingin menggunakan spreadsheet sendiri, ubah nilai `WEB_APP_URL` di `script.js` dan `detail-script.js`, serta pastikan Google Apps Script mengembalikan field `url`.

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

### Sumber URL Dokumen

URL dokumen diambil dari field `url` yang dikembalikan oleh Google Apps Script. Field ini berisi satu atau lebih URL (dipisahkan koma) yang mengarah ke file PDF di server SIPEDAS.

Contoh format URL:
```
https://apprssm.rssoedono.jatimprov.go.id/sipedas/assets/file_surat_kerjasama/26-04-2023-1690172543-PKS_Wynacom_LIS_2023.pdf
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
| Containerization  | Docker (nginx:stable-alpine)                |
| Hosting           | Render.com atau server statis              |

---

## 👤 Updated By

**Fajar Trio Wijanarko** — RSUD dr. Soedono Madiun

&copy; 2025 RSUD dr. Soedono Madiun. All rights reserved.
