# 02 — PROTECTED COMPONENTS & FEATURE INTEGRITY

## 1. Tujuan

Dokumen ini menetapkan komponen, modul, route, dan perilaku website MWCNU Pondok Aren yang harus dilindungi selama pengembangan.

Setiap Agent wajib memahami dampak perubahan terhadap komponen yang dilindungi sebelum mengubah kode.

Prinsip utama:

**Memperbaiki satu fitur tidak boleh merusak fitur lain yang sudah berjalan.**

Perlindungan tidak berarti seluruh komponen dilarang diubah. Perubahan tetap boleh dilakukan apabila:
- Secara eksplisit termasuk ruang lingkup pekerjaan.
- Dampaknya telah dianalisis.
- Ketergantungan antarmodul diperiksa.
- Pengujian yang sesuai dilakukan.
- Perubahan berisiko memperoleh izin yang diperlukan.

## 2. Klasifikasi Perlindungan

### Tingkat P1 — Perlindungan kritis

Komponen yang berkaitan dengan keamanan, data, akses, dan layanan penting.

Contoh:
- Konsultasi Agama.
- Autentikasi staf.
- Database dan RLS.
- Edge Functions.
- Pengelolaan secret dan kredensial.
- Penyimpanan dokumen dan lampiran.

Perubahan pada area ini memerlukan pemeriksaan dampak dan otorisasi sesuai Master Skill.

### Tingkat P2 — Perlindungan fungsional

Komponen yang memengaruhi navigasi, konten, dan fungsi utama website.

Contoh:
- Routing utama.
- Berita dan detail artikel.
- CMS.
- Agenda.
- Laporan kas.
- Homepage.
- Sidebar dan navigasi.

Perubahan harus mempertahankan perilaku yang sudah berjalan di luar ruang lingkup.

### Tingkat P3 — Perlindungan visual

Komponen yang menentukan identitas visual dan konsistensi antarmuka.

Contoh:
- Hero.
- Header.
- Footer.
- Sistem warna.
- Tipografi.
- Layout desktop dan mobile.
- Komponen kartu dan gambar.

Perubahan visual tidak boleh menyebabkan regresi fungsi atau responsivitas.

## 3. Modul Konsultasi Agama

Konsultasi Agama merupakan modul layanan penting yang memerlukan perlindungan khusus.

### 3.1 Route dan entry point

Identitas route yang harus dipertahankan:

- `#konsultasi`
- `#ka-online`
- `#ka-tiket`
- `#ka-dir`

File yang tercatat sebagai bagian modul:

- `js/konsultasi.js?v=1`
- `konsultasi-staf.html`
- `js/konsultasi-staf.js`

Informasi tersebut merupakan kontrak historis proyek dan wajib diverifikasi terhadap repository aktual.

Jangan mengubah, menghapus, mengganti nama, atau memutus hubungan file dan route tersebut tanpa ruang lingkup serta izin yang sesuai.

### 3.2 Aturan fungsional

Modul memiliki konsep:
- Pengajuan konsultasi.
- Identitas pemohon yang dapat bersifat opsional sesuai aturan layanan.
- Nomor tiket dan rahasia tiket.
- Penugasan konsultan.
- Jawaban konsultan.
- Pemeriksaan dan persetujuan jawaban.
- Publikasi jawaban yang telah disetujui.
- Dashboard staf.

Agent tidak boleh mengubah alur layanan, status tiket, visibilitas jawaban, persetujuan publikasi, atau hak akses hanya untuk menyesuaikan tampilan frontend.

### 3.3 Aturan keamanan

- Jangan mengekspos service role key ke browser.
- Jangan melemahkan RLS.
- Jangan menampilkan jawaban internal yang belum disetujui.
- Jangan membocorkan ticket secret.
- Jangan melewati proses pemeriksaan atau persetujuan.
- Jangan mengubah otorisasi staf tanpa izin eksplisit.

Perubahan backend harus mengikuti `06-backend-security.md`.

### 3.4 Pengujian perlindungan

Jika pekerjaan memengaruhi halaman utama, routing, loader, atau stylesheet global, lakukan pemeriksaan bahwa entry point Konsultasi Agama tetap tersedia.

Jika pekerjaan secara langsung mengubah modul konsultasi, lakukan pengujian khusus sesuai ruang lingkup dan izin.

## 4. Berita dan Detail Artikel

Berita merupakan salah satu fitur utama website.

Komponen yang dilindungi:
- Grid berita homepage.
- Halaman daftar berita.
- Berita unggulan.
- Kartu berita.
- Detail artikel.
- Sidebar berita populer.
- Baca Juga.
- Navigasi artikel melalui hash route.

### 4.1 Routing

Route historis yang digunakan:

- `#berita`
- `#berita/{slug}`

Jangan mengubah kontrak routing tanpa analisis dampak terhadap:
- Link yang telah dibagikan.
- Navigasi internal.
- Refresh halaman.
- Akses langsung.
- Metadata artikel.
- Riwayat browser.

### 4.2 Thumbnail artikel

Sumber thumbnail berita adalah field gambar pada record CMS, yaitu `foto`, sesuai struktur data yang telah diverifikasi pada FASE 17D.

Aturan:
- Jangan menggunakan gambar Hero sebagai thumbnail fallback.
- Jangan mengganti gambar artikel dengan gambar berita lain.
- Jangan mengarang URL gambar.
- Jangan menganggap seluruh record memiliki foto.
- Gunakan placeholder netral apabila gambar tidak tersedia.
- Pastikan gambar yang ditampilkan sesuai dengan record artikel.

### 4.3 Sinkronisasi cache dan remote

Mekanisme cache dan pembaruan data remote merupakan bagian penting dari fungsi berita.

Perilaku yang harus dipertahankan:
- Cache valid dapat ditampilkan lebih dahulu.
- Data remote yang lebih baru harus dapat memperbarui tampilan.
- Pembaruan tidak boleh bergantung pada reload paksa yang tidak diperlukan.
- Kegagalan remote tidak boleh menghapus cache valid.
- Data identik tidak boleh menyebabkan rerender tanpa kebutuhan.
- Rerender harus memperbarui komponen yang menggunakan data tersebut.

Implementasi aktual harus diperiksa sebelum perubahan dilakukan.

### 4.4 Pengujian minimum

Untuk perubahan yang memengaruhi berita:
- Homepage.
- Daftar berita.
- Detail artikel.
- Akses langsung menggunakan URL.
- Refresh pada halaman artikel.
- Thumbnail dan placeholder.
- Baca Juga.
- Desktop dan mobile.

## 5. Homepage dan Hero

Homepage merupakan pintu masuk utama website.

Komponen yang dilindungi:
- Header.
- Hero.
- Tombol navigasi utama.
- Berita homepage.
- Agenda.
- Informasi organisasi.
- Laporan kas.
- Footer.

### 5.1 Aturan Hero

Ketentuan desain historis:
- Gambar desktop dan mobile dikelola secara terpisah melalui CMS.
- Tidak menggunakan slideshow.
- Tidak menggunakan autoplay.
- Tidak menggunakan transisi gambar otomatis.
- Gambar tidak boleh menutupi keterbacaan konten.
- Tampilan mobile harus tetap proporsional.

### 5.2 Aset yang sengaja dihapus

`assets/img/og-cover.png` tercatat sebagai aset yang sengaja dihapus oleh pengguna.

Jangan:
- Mengembalikannya.
- Membuat ulang aset dengan nama yang sama.
- Menjadikannya fallback Hero atau thumbnail.
- Mengasumsikan file tersebut masih tersedia.

Jika ditemukan referensi lama terhadap aset tersebut, laporkan dan periksa konteks pemakaiannya sebelum mengubahnya.

### 5.3 Efek visual

Perubahan Hero harus memperhatikan:
- Waktu pemuatan gambar.
- Perilaku saat gambar belum tersedia.
- Background fallback.
- Perbedaan desktop dan mobile.
- Keterbacaan teks.
- Pergantian gambar saat data CMS tersedia.

Jangan menambahkan animasi atau slideshow yang tidak diminta.

## 6. Agenda dan Laporan Kas

### 6.1 Agenda

Aturan:
- Jangan membuat kegiatan fiktif.
- Jangan mengarang tanggal atau lokasi.
- Kondisi seluruh agenda telah berlalu harus ditangani secara jelas.
- Jangan mengubah urutan atau logika pemilihan agenda tanpa memahami implementasi aktual.

### 6.2 Laporan kas

Field CMS yang tercatat:
- `tampil`
- `periode`
- `pemasukan`
- `pengeluaran`
- `saldo`
- `keterangan`
- `dokumen`

Aturan:
- Jangan membuat saldo pembuka yang tidak tersedia.
- Jangan mengarang transaksi.
- Jangan menyimpulkan nilai keuangan dari data yang tidak lengkap.
- Jangan mengganti data kosong dengan angka buatan.
- Format angka tidak boleh mengubah nilai aslinya.

Field tersebut harus diverifikasi terhadap skema CMS aktual sebelum digunakan.

## 7. Navigasi dan Komponen Global

Komponen global dapat memengaruhi banyak halaman sekaligus.

Area yang harus diperiksa:
- Header.
- Menu desktop.
- Menu mobile.
- Footer.
- Router.
- Loader.
- Script global.
- CSS global.
- Metadata halaman.
- Mekanisme cache-busting.

Perubahan pada komponen global wajib mempertimbangkan seluruh modul yang bergantung padanya.

Jangan menghapus script, selector, class, ID, atau event listener sebelum memeriksa seluruh penggunaannya.

## 8. Kontrak Integrasi Antarmodul

Sebelum mengubah komponen yang digunakan bersama, Agent wajib menelusuri:

1. Siapa yang memanggil komponen tersebut.
2. Data apa yang dibutuhkan.
3. Route mana yang bergantung padanya.
4. Apakah komponen digunakan pada desktop dan mobile.
5. Apakah perubahan memengaruhi CMS atau backend.
6. Apakah perubahan dapat menimbulkan regresi.

Jangan memperbaiki satu modul dengan mengubah perilaku modul lain secara tidak disengaja.

## 9. Prosedur Jika Menemukan Masalah di Komponen Terlindungi

Jika Agent menemukan bug pada komponen yang tidak termasuk ruang lingkup:

1. Catat lokasi dan bukti masalah.
2. Identifikasi kemungkinan dampaknya.
3. Jangan langsung mengubahnya.
4. Selesaikan pekerjaan utama sesuai ruang lingkup.
5. Laporkan temuan sebagai pekerjaan terpisah.

Jika bug tersebut membuat pekerjaan utama tidak aman untuk dilanjutkan, hentikan bagian yang terdampak dan minta keputusan pengguna.

## 10. Checklist Perlindungan

Sebelum menyelesaikan pekerjaan, periksa:

- [ ] Tidak ada route penting yang hilang.
- [ ] Modul Konsultasi Agama tidak mengalami regresi.
- [ ] Berita dan detail artikel tetap berfungsi.
- [ ] Thumbnail sesuai record CMS.
- [ ] Cache dan data remote tetap sinkron.
- [ ] Hero tidak digunakan sebagai thumbnail fallback.
- [ ] Aset yang sengaja dihapus tidak dikembalikan.
- [ ] Agenda tidak berisi data fiktif.
- [ ] Laporan kas tidak berisi angka buatan.
- [ ] Komponen global tidak merusak modul lain.
- [ ] Desktop dan mobile tetap berfungsi sesuai ruang lingkup.

Tidak semua checklist wajib diuji secara penuh pada setiap pekerjaan. Agent harus memilih pengujian berdasarkan komponen yang benar-benar terdampak dan menyatakan bagian yang tidak diuji.

## 11. Prinsip Penutup

Komponen terlindungi bukan berarti tidak boleh berkembang.

Komponen tersebut boleh diperbaiki, disempurnakan, atau dikembangkan sesuai keputusan pengguna.

Namun, setiap perubahan harus disengaja, memiliki batas yang jelas, dan mempertahankan integritas fitur lainnya.

**Stabilitas seluruh ekosistem MWCNU lebih penting daripada keberhasilan satu perubahan yang berdiri sendiri.**