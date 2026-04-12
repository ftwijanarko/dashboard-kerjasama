// =====================================================
// SIPEDAS Integration Module
// Mengintegrasikan dokumen dari SIPEDAS ke Dashboard
// =====================================================
// CATATAN: Jika terjadi error CORS, pastikan dashboard
// di-host pada domain yang sama dengan SIPEDAS, atau
// gunakan proxy server untuk mengakses SIPEDAS.
// =====================================================

const SIPEDAS_BASE_URL = '/sipedas';

let _sipedasRecords = null;
let _sipedasFetchPromise = null;

function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function _escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _isValidUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function _normalizeStr(str) {
    return str.replace(/\s+/g, '').toLowerCase();
}

/**
 * Fetch dan parse halaman SIPEDAS Suratkerjasama/tampil
 * untuk mendapatkan mapping dasar hukum → data-id
 */
function fetchSipedasRecords() {
    if (_sipedasRecords) return Promise.resolve(_sipedasRecords);
    if (_sipedasFetchPromise) return _sipedasFetchPromise;

    _sipedasFetchPromise = fetch(SIPEDAS_BASE_URL + '/Suratkerjasama/tampil')
        .then(res => {
            // fetch follows 302 automatically — check if we ended up at login page
            if (res.url && res.url.includes('/Auth')) {
                throw new Error('SIPEDAS_LOGIN_REQUIRED');
            }
            return res.text();
        })
        .then(html => {
            // Double-check: if HTML contains login form, session belum ada
            if (html.includes('name="username"') || html.includes('name="password"') || html.includes('id="login')) {
                throw new Error('SIPEDAS_LOGIN_REQUIRED');
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const rows = doc.querySelectorAll('tr');

            _sipedasRecords = [];
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) return;

                // Nomor dasar hukum ada di td ke-3 (index 2)
                const dasarHukumText = cells[2].textContent.trim();
                const dasarHukumList = dasarHukumText
                    .split(/[,\n]/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                // data-id dari button class file-datasuratkerjasama
                const fileBtn = row.querySelector('.file-datasuratkerjasama');
                if (fileBtn) {
                    _sipedasRecords.push({
                        dasarHukumList,
                        dasarHukumRaw: dasarHukumText,
                        dataId: fileBtn.getAttribute('data-id')
                    });
                }
            });

            console.log('SIPEDAS: ' + _sipedasRecords.length + ' record(s) dimuat');
            return _sipedasRecords;
        })
        .catch(err => {
            console.error('Gagal memuat data SIPEDAS:', err);
            _sipedasFetchPromise = null; // Allow retry on next call
            return [];
        });

    return _sipedasFetchPromise;
}

/**
 * Cari record SIPEDAS yang cocok berdasarkan dasar hukum mitra
 */
function findSipedasMatch(dasarHukumMitra1, dasarHukumMitra2) {
    if (!_sipedasRecords || _sipedasRecords.length === 0) return null;

    const terms = [];
    [dasarHukumMitra1, dasarHukumMitra2].forEach(dh => {
        if (dh && dh !== '-') {
            dh.split(/,/).forEach(t => {
                const trimmed = t.trim();
                if (trimmed) terms.push(_normalizeStr(trimmed));
            });
        }
    });

    if (terms.length === 0) return null;

    for (const record of _sipedasRecords) {
        for (const dh of record.dasarHukumList) {
            const ndh = _normalizeStr(dh);
            for (const term of terms) {
                if (ndh === term || ndh.includes(term) || term.includes(ndh)) {
                    return record;
                }
            }
        }
    }

    return null;
}

/**
 * Fetch daftar file dari SIPEDAS berdasarkan data-id
 */
function fetchFileLinks(dataId) {
    const formData = new FormData();
    formData.append('id', dataId);

    return fetch(SIPEDAS_BASE_URL + '/Suratkerjasama/file', {
        method: 'POST',
        body: formData
    })
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const anchors = doc.querySelectorAll('a[href]');

            const files = [];
            anchors.forEach(anchor => {
                const href = anchor.getAttribute('href');
                if (!href || !_isValidUrl(href)) return;

                const tr = anchor.closest('tr');
                const nameDiv = tr ? tr.querySelector('div') : null;
                const name = nameDiv
                    ? nameDiv.textContent.trim()
                    : decodeURIComponent(href.split('/').pop());

                files.push({ name, url: href });
            });

            return files;
        });
}

/**
 * Tampilkan daftar file di file-modal
 */
function showFileModal(files) {
    const modal = document.getElementById('file-modal');
    const fileList = document.getElementById('file-list');

    if (!files || files.length === 0) {
        fileList.innerHTML = '<p class="file-empty">Tidak ada file ditemukan.</p>';
    } else {
        fileList.innerHTML = files.map((file, i) => {
            const safeUrl = _escapeAttr(file.url);
            const safeName = _escapeHtml(file.name);
            return '<div class="file-item">' +
                '<div class="file-name">' + (i + 1) + '. ' + safeName + '</div>' +
                '<div class="file-actions">' +
                '<a href="' + safeUrl + '" class="file-btn file-btn-lihat" ' +
                'onclick="window.open(this.href,\'docview\',\'height=600,width=800,scrollbars=yes,resizable=1\'); return false;">Lihat</a>' +
                '<a href="' + safeUrl + '" target="_blank" class="file-btn file-btn-download">Download</a>' +
                '</div></div>';
        }).join('');
    }

    modal.style.display = 'block';
}

/**
 * Handler utama untuk tombol Dokumen
 * Menggunakan WEB_APP_URL yang didefinisikan di script.js / detail-script.js
 */
async function handleDokumenClick(itemData) {
    const fileList = document.getElementById('file-list');
    const fileModal = document.getElementById('file-modal');

    fileList.innerHTML = '<p style="text-align:center;">Memuat data dokumen...</p>';
    fileModal.style.display = 'block';

    try {
        // 1. Pastikan data SIPEDAS sudah di-fetch
        await fetchSipedasRecords();

        // 2. Ambil detail kerjasama untuk mendapatkan dasar hukum
        const detailUrl = `${WEB_APP_URL}?action=getDetail&sheet=${encodeURIComponent(itemData.sumberSheet)}&row=${itemData.rowIndex}`;
        const response = await fetch(detailUrl);
        const result = await response.json();

        if (result.status !== 'success' || !result.data) {
            fileList.innerHTML = '<p class="file-empty" style="color:red;">Gagal memuat detail kerjasama.</p>';
            return;
        }

        const detail = result.data;
        const dsm1 = detail.dasarHukumMitra1 || detail.dasarHukum || '';
        const dsm2 = detail.dasarHukumMitra2 || '';

        // 3. Cari record yang cocok di SIPEDAS berdasarkan dasar hukum
        const match = findSipedasMatch(dsm1, dsm2);

        if (!match) {
            fileList.innerHTML =
                '<p class="file-empty">Dokumen tidak ditemukan di SIPEDAS.</p>' +
                '<p style="text-align:center; font-size:0.85em; color:#aaa;">' +
                'Pencarian berdasarkan:<br>' +
                'Dasar Hukum Mitra 1: ' + _escapeHtml(dsm1 || '-') + '<br>' +
                'Dasar Hukum Mitra 2: ' + _escapeHtml(dsm2 || '-') +
                '</p>';
            return;
        }

        // 4. Ambil daftar file
        fileList.innerHTML = '<p style="text-align:center;">Mengambil daftar file...</p>';
        const files = await fetchFileLinks(match.dataId);

        // 5. Tampilkan file
        showFileModal(files);

    } catch (error) {
        if (error.message === 'SIPEDAS_LOGIN_REQUIRED') {
            fileList.innerHTML =
                '<div class="file-login-notice">' +
                '<p><strong>Sesi SIPEDAS belum aktif.</strong></p>' +
                '<p>Silakan login ke SIPEDAS terlebih dahulu, lalu kembali ke dashboard dan coba lagi.</p>' +
                '<a href="/sipedas/" target="_blank" class="file-btn file-btn-lihat" style="margin-top:10px; display:inline-block;">Login SIPEDAS</a>' +
                '</div>';
            // Reset cache agar bisa retry setelah login
            _sipedasRecords = null;
            _sipedasFetchPromise = null;
        } else {
            fileList.innerHTML = '<p class="file-empty" style="color:red;">Error: ' + _escapeHtml(error.message) + '</p>';
        }
    }
}

// Setup: close handler + pre-fetch SIPEDAS data
document.addEventListener('DOMContentLoaded', () => {
    const fileModal = document.getElementById('file-modal');
    if (!fileModal) return;

    const closeBtn = fileModal.querySelector('.close-file-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { fileModal.style.display = 'none'; });
    }

    window.addEventListener('click', (event) => {
        if (event.target === fileModal) fileModal.style.display = 'none';
    });

    // Pre-fetch SIPEDAS data di background
    fetchSipedasRecords();
});
