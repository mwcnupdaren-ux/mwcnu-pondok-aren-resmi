# 09. RECOVERY PROCEDURES
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/09-recovery-procedures.md`  
**Status:** Standar pemulihan dan penanganan kegagalan

## 1. Tujuan

Dokumen ini mengatur prosedur pemulihan ketika terjadi masalah selama pengembangan dan pemeliharaan website MWCNU Pondok Aren.

Cakupan:
- Kesalahan implementasi.
- Kegagalan pengujian.
- Regresi fitur.
- Kerusakan tampilan.
- Kegagalan integrasi.
- Konflik Git.
- Kehilangan perubahan lokal.
- Kegagalan deployment.
- Insiden keamanan.

Tujuan utama adalah memulihkan kondisi sistem secara aman tanpa memperbesar dampak kerusakan atau menghilangkan pekerjaan yang masih diperlukan.

## 2. Prinsip Pemulihan

Seluruh Agent wajib mengikuti prinsip:

1. **Stop first:** hentikan tindakan yang berpotensi memperburuk kondisi.
2. **Preserve evidence:** pertahankan informasi yang dibutuhkan untuk diagnosis.
3. **Protect user work:** jangan menghilangkan perubahan pengguna.
4. **Identify root cause:** cari penyebab sebelum melakukan pemulihan.
5. **Minimal recovery:** pilih tindakan pemulihan paling kecil dan aman.
6. **Verify recovery:** pastikan sistem kembali berfungsi.
7. **Report honestly:** jelaskan masalah dan hasil pemulihan secara terbuka.

Jangan melakukan perubahan tambahan secara acak hanya untuk membuat error menghilang.

## 3. Klasifikasi Insiden

### P1. Kritis
Contoh:
- Website tidak dapat diakses.
- Kebocoran data sensitif.
- Akses tidak sah ke dashboard.
- Data penting hilang atau rusak.
- Modul Konsultasi Agama membocorkan informasi pemohon.
- Backend produksi mengalami gangguan serius.

Tindakan:
- Hentikan pekerjaan fitur.
- Jangan melakukan perubahan tambahan yang tidak terkait.
- Identifikasi dampak.
- Laporkan segera.
- Utamakan pengamanan dan pemulihan.

### P2. Tinggi
Contoh:
- Halaman utama rusak.
- Navigasi utama tidak berfungsi.
- Modul penting gagal berjalan.
- Data CMS tidak tampil dengan benar.
- Perubahan menyebabkan regresi lintas halaman.

Tindakan:
- Hentikan pengembangan yang tidak berkaitan.
- Identifikasi perubahan penyebab.
- Siapkan perbaikan terarah.
- Jalankan pengujian regresi.

### P3. Sedang
Contoh:
- Komponen visual bergeser.
- Thumbnail tidak sesuai.
- Tombol tertentu tidak berfungsi.
- Tampilan mobile mengalami masalah.

Tindakan:
- Catat masalah.
- Perbaiki sesuai ruang lingkup.
- Periksa komponen terkait.

### P4. Rendah
Contoh:
- Ketidakkonsistenan jarak.
- Koreksi tipografi.
- Kesalahan teks kecil.
- Perbaikan visual minor.

Tindakan:
- Masukkan ke pekerjaan perbaikan sesuai prioritas.

## 4. Prosedur Awal Ketika Terjadi Masalah

Sebelum melakukan pemulihan:

1. Hentikan tindakan yang dapat mengubah kondisi lebih jauh.
2. Catat gejala dan waktu kejadian jika tersedia.
3. Periksa branch dan HEAD.
4. Periksa working tree.
5. Periksa perubahan staged dan unstaged.
6. Identifikasi file yang berkaitan dengan masalah.
7. Periksa apakah masalah muncul sebelum atau sesudah perubahan.
8. Tentukan apakah masalah terjadi di lokal, preview, atau produksi.

Jangan menghapus cache, file, atau data sebelum memahami perannya dalam masalah.

## 5. Pemulihan Kesalahan Implementasi

Jika perubahan kode menyebabkan error:

1. Identifikasi file dan bagian yang berubah.
2. Periksa diff terbaru.
3. Periksa error console atau output terminal.
4. Tentukan akar penyebab.
5. Perbaiki bagian yang bermasalah.
6. Jalankan pemeriksaan syntax.
7. Jalankan pengujian fungsi terkait.
8. Jalankan regresi pada komponen yang berpotensi terdampak.

Hindari:
- Menambahkan workaround berlapis tanpa memahami penyebab.
- Menghapus fungsi lain agar error tidak muncul.
- Mengubah banyak file sekaligus tanpa kebutuhan.
- Mengklaim perbaikan berhasil sebelum diuji.

## 6. Pemulihan Regresi

Jika fitur yang sebelumnya berjalan menjadi rusak:

1. Bandingkan perilaku sebelum dan sesudah perubahan.
2. Identifikasi perubahan yang paling mungkin menjadi penyebab.
3. Periksa dependensi antarfile.
4. Tentukan perbaikan atau pembatalan perubahan.
5. Pertahankan perubahan lain yang tidak bermasalah.
6. Jalankan pengujian regresi.

Jangan membatalkan seluruh pekerjaan jika hanya satu bagian yang bermasalah.

Jika perbaikan membutuhkan perubahan di luar ruang lingkup, laporkan dan pisahkan dari pekerjaan utama.

## 7. Pemulihan Tampilan

Jika tampilan mengalami kerusakan:

- Periksa CSS yang baru diubah.
- Periksa selector yang saling bertentangan.
- Periksa media query.
- Periksa struktur DOM.
- Periksa ukuran viewport.
- Periksa gambar dan aset.
- Periksa kemungkinan konflik stylesheet.

Utamakan mengembalikan perilaku komponen yang rusak tanpa mengubah tampilan halaman lain.

Jangan mengatasi kerusakan satu halaman dengan menambahkan aturan global yang berdampak pada seluruh website.

## 8. Pemulihan Data CMS

Jika data CMS tidak tampil atau tampil keliru:

1. Periksa sumber data.
2. Periksa respons remote.
3. Periksa cache.
4. Periksa proses pemetaan field.
5. Periksa proses rendering.
6. Tentukan apakah masalah berada pada data atau tampilan.

Ketentuan:
- Jangan mengarang data pengganti.
- Jangan menghapus data sumber.
- Jangan melakukan update massal.
- Jangan mengganti gambar dengan aset yang tidak berkaitan.
- Jangan mengubah schema untuk mengatasi masalah rendering sederhana.

Jika ditemukan kerusakan data sumber, hentikan operasi tulis dan laporkan.

## 9. Pemulihan Cache dan Sinkronisasi

Jika cache dan data remote tidak sinkron:

- Periksa urutan pemuatan data.
- Periksa waktu pembaruan.
- Periksa proses penyimpanan cache.
- Periksa mekanisme rerender.
- Periksa kemungkinan respons lama menimpa data baru.

Jangan langsung menghapus seluruh cache pengguna.

Pemulihan harus mempertahankan kemampuan aplikasi untuk:
- Menampilkan cache yang masih valid.
- Memperbarui data setelah remote berhasil.
- Tetap berfungsi saat remote gagal.
- Menghindari reload halaman yang tidak diperlukan.

## 10. Pemulihan Git

Jika terjadi masalah repository:

1. Hentikan perintah Git yang berpotensi destruktif.
2. Periksa branch dan HEAD.
3. Periksa status working tree.
4. Periksa staged, unstaged, dan untracked.
5. Identifikasi perubahan yang harus dipertahankan.
6. Tentukan penyebab konflik atau kehilangan perubahan.
7. Pilih metode pemulihan yang aman.

Jangan langsung menjalankan:
- `git reset --hard`
- `git clean -fd`
- `git checkout -- .`
- `git restore .`
- `git push --force`

Perintah tersebut dapat menghilangkan pekerjaan yang belum tersimpan.

Jika pemulihan membutuhkan perubahan riwayat Git, minta persetujuan eksplisit.

## 11. Pemulihan Konflik Merge

Jika merge menimbulkan konflik:

- Identifikasi seluruh file konflik.
- Periksa perubahan dari setiap sisi.
- Pertahankan perubahan yang masih diperlukan.
- Jangan memilih satu sisi secara otomatis.
- Periksa hasil resolusi.
- Jalankan pengujian setelah merge.

Jangan menghapus file konflik atau menyelesaikannya hanya agar Git mengizinkan commit.

## 12. Pemulihan Deployment

Jika deployment gagal atau hasil produksi bermasalah:

1. Identifikasi environment yang terdampak.
2. Catat commit yang sedang berjalan.
3. Identifikasi perubahan yang baru diterbitkan.
4. Periksa log deployment dan error aplikasi.
5. Tentukan apakah masalah memerlukan rollback atau hotfix.
6. Siapkan prosedur pemulihan.
7. Minta persetujuan sebelum tindakan produksi.
8. Verifikasi hasil setelah pemulihan.

Ketentuan:
- Jangan mengubah konfigurasi produksi secara sembarangan.
- Jangan melakukan deployment ulang tanpa memahami penyebab kegagalan.
- Jangan menganggap rollback selalu aman, terutama jika perubahan melibatkan database.
- Jangan melakukan rollback database tanpa rencana kompatibilitas dan pemulihan data.

## 13. Pemulihan Backend dan Database

Jika terjadi masalah pada Supabase, SQL, RLS, atau Edge Functions:

- Hentikan perubahan backend yang tidak berkaitan.
- Identifikasi project dan environment.
- Periksa migrasi yang terlibat.
- Periksa dampak terhadap data.
- Periksa autentikasi dan hak akses.
- Identifikasi apakah masalah berasal dari schema, policy, fungsi, atau konfigurasi.

Jangan:
- Menjalankan rollback SQL berdasarkan asumsi.
- Menonaktifkan RLS untuk memulihkan akses.
- Menghapus data untuk mengatasi error.
- Mengganti secret tanpa prosedur yang benar.
- Menjalankan migrasi ulang tanpa memeriksa status penerapan.

Pemulihan backend produksi memerlukan izin eksplisit dan rencana yang sesuai.

## 14. Penanganan Insiden Keamanan

Jika ditemukan indikasi kebocoran data atau akses tidak sah:

1. Hentikan tindakan yang dapat memperluas kebocoran.
2. Jangan menyalin atau menyebarkan data sensitif.
3. Identifikasi sistem dan data yang mungkin terdampak.
4. Dokumentasikan bukti secara aman.
5. Laporkan tingkat risiko.
6. Rekomendasikan langkah pengamanan.
7. Jangan mengganti secret atau konfigurasi produksi tanpa otorisasi yang sesuai, kecuali terdapat prosedur respons insiden yang telah secara eksplisit memberikan kewenangan tersebut.

Utamakan perlindungan pengguna dan data organisasi.

## 15. Recovery Verification

Setelah pemulihan, lakukan pemeriksaan sesuai jenis masalah.

Periksa:
- Aplikasi dapat dijalankan.
- Halaman terkait kembali berfungsi.
- Data tetap utuh.
- Navigasi berjalan.
- Tidak ada regresi baru.
- Console dan log tidak menunjukkan error baru yang penting.
- Hak akses tetap benar.
- Perubahan lokal pengguna tetap terjaga.

Jika pengujian belum lengkap, jangan menyatakan pemulihan terverifikasi sepenuhnya.

## 16. Format Laporan Insiden

### A. Identifikasi
- Waktu kejadian:
- Environment:
- Tingkat insiden:
- Modul terdampak:

### B. Gejala
- Masalah:
- Dampak:
- Kondisi awal:

### C. Analisis
- Penyebab:
- File atau komponen terkait:
- Perubahan pemicu:
- Risiko lanjutan:

### D. Pemulihan
- Tindakan:
- File atau sistem yang diubah:
- Otorisasi:
- Status pemulihan:

### E. Verifikasi
- Pengujian:
- Hasil:
- Risiko tersisa:
- Keterbatasan:

### F. Kesimpulan
- Status akhir:
- Rekomendasi pencegahan:
- Tindakan lanjutan:

Jangan mencantumkan password, token, secret, atau data pribadi dalam laporan.

## 17. Prinsip Akhir

Pemulihan harus dilakukan secara terukur, bukan berdasarkan kepanikan.

**Selamatkan pekerjaan yang masih benar, pulihkan bagian yang rusak, dan jangan memperbesar masalah dengan tindakan yang belum dipahami.**