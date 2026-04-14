// =====================================================
// Document URL Handler
// Menampilkan dokumen kerjasama dari URL di Spreadsheet
// =====================================================
// URL dokumen disimpan di Google Spreadsheet:
//   - Sheet "Kerjasama Klinis UPDATE" → kolom L
//   - Sheet "Kerjasama Manajemen Update UPDATE" → kolom N
// URL bisa lebih dari satu, dipisahkan koma.
// =====================================================

function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function _escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Parse string URL yang dipisahkan koma menjadi array file objects
 */
function parseDocumentUrls(urlString) {
    if (!urlString || urlString.trim() === '' || urlString.trim() === '-') return [];

    return urlString
        .split(/,\s*/)
        .map(u => u.trim())
        .filter(u => u.length > 0 && (u.startsWith('http://') || u.startsWith('https://')))
        .map(url => {
            const name = decodeURIComponent(url.split('/').pop());
            return { name, url };
        });
}

/**
 * Tampilkan daftar file di file-modal
 */
function showFileModal(files) {
    const modal = document.getElementById('file-modal');
    const fileList = document.getElementById('file-list');

    if (!files || files.length === 0) {
        fileList.innerHTML = '<p class="file-empty">Tidak ada dokumen tersedia.</p>';
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
 * Mengambil URL dokumen dari field 'url' di data spreadsheet
 */
function handleDokumenClick(itemData) {
    const files = parseDocumentUrls(itemData.url || '');
    showFileModal(files);
}

// Setup: close handler for file modal
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
});
