/**
 * Google Apps Script Web App — Dashboard Kerjasama
 * RSUD dr. Soedono Madiun
 *
 * Ini adalah STANDALONE script (tidak perlu akses edit ke spreadsheet).
 * Cukup read-only access ke spreadsheet.
 *
 * Cara deploy:
 * 1. Buka https://script.google.com → New project
 * 2. Paste kode ini ke editor (ganti isi Code.gs)
 * 3. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy URL Web App, paste ke script.js & detail-script.js
 */

var SPREADSHEET_ID = '1sKY7LS9IsiCp8jeTIcus_BQs5-3i5xG7HFGnEg4Pla8';

// =====================================================
// KONFIGURASI SHEET
// Sesuaikan sheetName jika nama sheet di spreadsheet berbeda
// =====================================================

var SHEET_CONFIGS = [
  {
    sheetName: 'Kerjasama Klinis UPDATE',
    displayName: 'Kerjasama Klinis',
    type: 'klinis',
    // Kolom (0-indexed): A=0, B=1, ... L=11
    col: {
      mitra: 1,             // B: Mitra
      judul: 2,             // C: Judul Kerjasama
      dasarHukumMitra: 3,   // D: Dasar Hukum Mitra
      dasarHukumRs: 4,      // E: Dasar Hukum RS
      tanggalMulai: 5,      // F: Tanggal Mulai
      tanggalSelesai: 6,    // G: Tanggal Selesai
      reminder: 7,          // H: Reminder 3 Bulan
      keterangan: 8,        // I: Keterangan Kerjasama
      url: 11               // L: URL
    }
  },
  {
    sheetName: 'Kerjasama Manajemen UPDATE',
    displayName: 'Kerjasama Manajemen',
    type: 'manajemen',
    // Kolom (0-indexed): A=0, B=1, ... N=13
    col: {
      mitra1: 1,            // B: Mitra 1
      mitra2: 2,            // C: Mitra 2
      judul: 3,             // D: Judul Kerjasama
      dasarHukumMitra1: 4,  // E: Dasar Hukum Mitra 1
      dasarHukumMitra2: 5,  // F: Dasar Hukum Mitra 2
      dasarHukumRs: 6,      // G: Dasar Hukum RS
      tanggalMulai: 7,      // H: Tanggal Mulai
      tanggalSelesai: 8,    // I: Tanggal Selesai
      reminder: 9,          // J: Reminder 3 Bulan
      keterangan: 10,       // K: Keterangan Kerjasama
      url: 13               // N: URL
    }
  }
];

// =====================================================
// ENTRY POINT
// =====================================================

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'getDetail') {
      return jsonResponse_(getDetail_(e.parameter.sheet, parseInt(e.parameter.row, 10)));
    }

    return jsonResponse_(getAllData_());
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.toString() });
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================
// GET ALL DATA (ringkasan untuk tabel utama)
// =====================================================

function getAllData_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var allData = [];

  for (var s = 0; s < SHEET_CONFIGS.length; s++) {
    var config = SHEET_CONFIGS[s];
    var sheet = ss.getSheetByName(config.sheetName);
    if (!sheet) continue;

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;

    var lastCol = sheet.getLastColumn();
    var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var mitra, judul, tanggalSelesai, status, url;

      if (config.type === 'klinis') {
        mitra = cellStr_(row[config.col.mitra]);
        judul = cellStr_(row[config.col.judul]);
        tanggalSelesai = cellISO_(row[config.col.tanggalSelesai]);
        status = cellStr_(row[config.col.keterangan]);
        url = cellStr_(row[config.col.url]);
      } else {
        var m1 = cellStr_(row[config.col.mitra1]);
        var m2 = cellStr_(row[config.col.mitra2]);
        mitra = m2 ? (m1 + ' & ' + m2) : m1;
        judul = cellStr_(row[config.col.judul]);
        tanggalSelesai = cellISO_(row[config.col.tanggalSelesai]);
        status = cellStr_(row[config.col.keterangan]);
        url = cellStr_(row[config.col.url]);
      }

      // Skip baris kosong
      if (!mitra && !judul) continue;

      var item = {
        rowIndex: i + 2,
        mitra: mitra,
        judul: judul,
        tanggalSelesai: tanggalSelesai,
        status: status,
        sumberSheet: config.displayName
      };

      if (url) {
        item.url = url;
      }

      allData.push(item);
    }
  }

  return { status: 'success', data: allData };
}

// =====================================================
// GET DETAIL (satu baris lengkap untuk modal)
// =====================================================

function getDetail_(displayName, rowIndex) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var config = null;
  for (var i = 0; i < SHEET_CONFIGS.length; i++) {
    if (SHEET_CONFIGS[i].displayName === displayName) {
      config = SHEET_CONFIGS[i];
      break;
    }
  }

  if (!config) {
    return { status: 'error', message: 'Sheet tidak ditemukan: ' + displayName };
  }

  var sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) {
    return { status: 'error', message: 'Sheet tidak ditemukan di spreadsheet: ' + config.sheetName };
  }

  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    return { status: 'error', message: 'Baris tidak valid: ' + rowIndex };
  }

  var lastCol = sheet.getLastColumn();
  var row = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];

  var detail = {};

  if (config.type === 'klinis') {
    detail.namaMitra1       = cellStr_(row[config.col.mitra]);
    detail.namaMitra2       = '';
    detail.judulKerjasama   = cellStr_(row[config.col.judul]);
    detail.dasarHukumMitra1 = cellStr_(row[config.col.dasarHukumMitra]);
    detail.dasarHukumMitra2 = '';
    detail.dasarHukumRs     = cellStr_(row[config.col.dasarHukumRs]);
    detail.tanggalMulai     = cellISO_(row[config.col.tanggalMulai]);
    detail.tanggalSelesai   = cellISO_(row[config.col.tanggalSelesai]);
    detail.reminder3Bulan   = cellISO_(row[config.col.reminder]);
    detail.keteranganKerjasama = cellStr_(row[config.col.keterangan]);
  } else {
    detail.namaMitra1       = cellStr_(row[config.col.mitra1]);
    detail.namaMitra2       = cellStr_(row[config.col.mitra2]);
    detail.judulKerjasama   = cellStr_(row[config.col.judul]);
    detail.dasarHukumMitra1 = cellStr_(row[config.col.dasarHukumMitra1]);
    detail.dasarHukumMitra2 = cellStr_(row[config.col.dasarHukumMitra2]);
    detail.dasarHukumRs     = cellStr_(row[config.col.dasarHukumRs]);
    detail.tanggalMulai     = cellISO_(row[config.col.tanggalMulai]);
    detail.tanggalSelesai   = cellISO_(row[config.col.tanggalSelesai]);
    detail.reminder3Bulan   = cellISO_(row[config.col.reminder]);
    detail.keteranganKerjasama = cellStr_(row[config.col.keterangan]);
  }

  return { status: 'success', data: detail };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/** Konversi cell value ke string (trim whitespace) */
function cellStr_(val) {
  if (val === null || val === undefined || val === '') return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd MMMM yyyy');
  }
  return String(val).trim();
}

/** Konversi cell value ke ISO date string */
function cellISO_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString();
  }
  var d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return '';
}
