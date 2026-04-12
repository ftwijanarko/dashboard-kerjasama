# Description:
aku mendapat project dari teman untuk menambahkan tombol untuk melihat dan download dokumen dari dashboard ini.
sayangnya aku tidak mendapat akses database untuk inquiry dokumen yang akan ditampilkan.
aku hanya diberi akses web arsip dokumen, jadi kita akan scraping halaman web untuk mengintegrasikan dashboard dan berkas dokumennya.

# Tombol:
tambahkan tombol "lihat" dan "downlod" di kolom "Aksi"

# Key refference:
gunakan "Dasar Hukum Mitra 1" dan "Dasar Hukum Mitra 2" untuk nanti digunakan sebagai pencarian dokumen

# sumber dokumen
inquiry ke https://apprssm.rssoedono.jatimprov.go.id/sipedas/Suratkerjasama/tampil untuk mendapatkan semua list dokumen (file dokumen belum ada di inquiry ini).
inquiry dari /sipedas/Suratkerjasama/tampil akan menghasilkan string html seperti file sipedas.Suratkerjasama.tampil.html.
nomor dasar hukum ada di tag <td> ketiga.
untuk melihat daftar dokumen dari setiap kerjasama, gunakan attribut data-id yang ada di tag <button> yang memiliki class "file-datasuratkerjasama".
dari id yang didapat, inquiry ke https://apprssm.rssoedono.jatimprov.go.id/sipedas/Suratkerjasama/file dengan payload form-data:
id={selectedId}
hasil inquiry ke sipedas/Suratkerjasama/file akan menghasilkan string seperti yang ada di file sipedas.Suratkerjasama.file.html.
satu kerja sama memiliki lebih dari satu file. 
dapatkan link download file / href yang ada di dalam tag <a>