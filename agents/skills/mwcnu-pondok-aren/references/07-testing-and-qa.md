# 07. TESTING AND QA
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/07-testing-and-qa.md`  
**Status:** Standar pengujian dan jaminan kualitas

## 1. Tujuan

Dokumen ini mengatur standar pengujian untuk seluruh pekerjaan pengembangan dan pemeliharaan website MWCNU Pondok Aren.

Tujuan:
- Memastikan perubahan bekerja sesuai kebutuhan.
- Mencegah regresi pada fitur yang sudah berjalan.
- Memastikan tampilan desktop dan mobile tetap baik.
- Memastikan data ditampilkan dengan benar.
- Memastikan keamanan tidak menurun.
- Menyediakan laporan pengujian yang dapat diverifikasi.

## 2. Prinsip Pengujian

Seluruh Agent wajib mengikuti prinsip berikut:

1. **Test what changed:** uji seluruh bagian yang mengalami perubahan.
2. **Test what may break:** uji komponen lain yang memiliki ketergantungan.
3. **Evidence-based:** setiap klaim pengujian harus berdasarkan hasil aktual.
4. **No false claims:** jangan mengaku telah melakukan pengujian yang tidak dijalankan.
5. **Risk-based testing:** kedalaman pengujian mengikuti tingkat risiko perubahan.
6. **Regression awareness:** pastikan fungsi lama tetap berjalan.
7. **Honest limitations:** jelaskan jika pengujian tertentu tidak dapat dilakukan.

## 3. Tingkat Pengujian

Pengujian dibagi menjadi empat tingkat.

### 3.1 Level 1: Static Checks

Pemeriksaan kode tanpa menjalankan aplikasi secara penuh.

Contoh:
- `node --check` untuk JavaScript.
- `git diff --check`.
- Pemeriksaan struktur HTML.
- Pemeriksaan referensi file.
- Pemeriksaan konfigurasi.
- Pemeriksaan konflik atau duplikasi kode.

### 3.2 Level 2: Functional Tests

Memeriksa fungsi aplikasi secara langsung.

Contoh:
- Tombol dan tautan.
- Navigasi.
- Formulir.
- Pengambilan data.
- Proses rendering.
- Validasi input.
- Penanganan data kosong.
- Penanganan error.

### 3.3 Level 3: Browser Tests

Memeriksa aplikasi melalui browser.

Contoh:
- Homepage.
- Halaman berita.
- Detail artikel.
- Halaman agenda.
- Laporan kas.
- Modul konsultasi.
- Dashboard jika termasuk ruang lingkup.

Periksa tampilan, interaksi, navigasi, dan error console.

### 3.4 Level 4: Integration and Security Tests

Digunakan jika perubahan menyentuh integrasi atau backend.

Contoh:
- Integrasi Supabase.
- Autentikasi.
- Otorisasi.
- RLS.
- Edge Functions.
- Alur data antar layanan.
- Pengujian akses yang diizinkan dan ditolak.

Pengujian level ini harus menggunakan lingkungan yang sesuai dan tidak boleh merusak data produksi.

## 4. Penentuan Kedalaman Pengujian

Tidak semua perubahan membutuhkan seluruh tingkat pengujian.

| Jenis perubahan | Pengujian minimum |
|---|---|
| Koreksi teks | Static check dan pemeriksaan halaman |
| Perubahan CSS | Pemeriksaan visual desktop dan mobile |
| Perubahan HTML | Struktur, fungsi, dan browser |
| Perubahan JavaScript | Syntax, fungsi, dan regresi |
| Perubahan CMS | Integritas data dan sinkronisasi |
| Perubahan autentikasi | Functional dan security tests |
| Perubahan database | Migrasi, integrasi, dan keamanan |
| Perubahan lintas modul | Regression test pada modul terdampak |

Agent wajib meningkatkan kedalaman pengujian jika dampak perubahan lebih luas daripada perkiraan awal.

## 5. Pengujian Tampilan Responsif

Jika perubahan memengaruhi UI, periksa setidaknya:

| Perangkat | Ukuran acuan |
|---|---:|
| Mobile kecil | 360 px |
| Mobile umum | 390 px |
| Tablet | 768 px |
| Desktop | 1440 px |

Periksa:
- Tidak ada horizontal overflow.
- Tidak ada elemen bertumpuk.
- Teks dapat dibaca.
- Gambar tampil dengan proporsi benar.
- Tombol mudah digunakan.
- Navigasi berfungsi.
- Sidebar menyesuaikan ukuran layar.
- Layout tidak rusak saat ukuran viewport berubah.

Ukuran tersebut adalah acuan pengujian, bukan breakpoint wajib.

## 6. Regression Testing

Sebelum perubahan dilakukan, identifikasi fitur yang berpotensi terdampak.

Periksa:
- Fungsi sebelum perubahan.
- Fungsi setelah perubahan.
- Hubungan komponen yang digunakan bersama.
- Perilaku navigasi.
- Data yang ditampilkan.
- Integrasi dengan modul lain.

### 6.1 Komponen Penting MWCNU

Jika perubahan berpotensi memengaruhi komponen berikut, lakukan pengujian regresi yang relevan:

- Homepage dan Hero.
- Daftar berita.
- Detail artikel.
- Thumbnail berita.
- Agenda kegiatan.
- Laporan kas.
- Navigasi utama.
- CMS dan dashboard.
- Modul Konsultasi Agama.
- Tampilan mobile.

Jangan menganggap sebuah modul aman hanya karena halaman yang sedang dikerjakan terlihat normal.

## 7. Pengujian Berita dan Cache

Jika perubahan menyentuh berita, rendering, atau cache, uji kondisi berikut:

1. Cache tersedia dan data remote berhasil.
2. Cache tersedia dan data remote gagal.
3. Cache kosong.
4. Data remote berubah ketika halaman terbuka.
5. Pengguna membuka detail artikel secara langsung.
6. Pengguna berpindah dari daftar berita ke detail artikel.
7. Pengguna melakukan refresh pada halaman detail.
8. Thumbnail sesuai dengan artikel.
9. Artikel tanpa foto menggunakan placeholder netral.
10. Berita terkait ditampilkan dengan benar atau disembunyikan jika tidak tersedia.

Pastikan pembaruan data tidak membutuhkan reload halaman jika mekanisme aplikasi memang mendukung pembaruan tanpa reload.

## 8. Pengujian Navigasi

Periksa:
- Navigasi melalui klik.
- Akses langsung melalui URL.
- Refresh halaman.
- Perpindahan antarhalaman.
- Tombol kembali browser.
- Hash atau route yang digunakan.
- Kondisi ketika halaman tujuan tidak ditemukan.

Pastikan URL dan perilaku navigasi tetap konsisten dengan arsitektur aktual proyek.

## 9. Pengujian Modul Konsultasi Agama

Jika perubahan berpotensi memengaruhi modul Konsultasi Agama, periksa bagian yang relevan:

- Akses halaman konsultasi publik.
- Pengiriman permohonan.
- Pembuatan dan pemeriksaan tiket.
- Perlindungan `ticket_secret`.
- Hak akses dashboard staf.
- Penugasan konsultan.
- Pengiriman jawaban.
- Proses review.
- Visibilitas jawaban.
- Persetujuan publikasi.
- Akses lampiran.
- Penanganan error dan sesi.

Jangan menggunakan tiket atau data pemohon produksi sebagai data uji tanpa izin.

Pengujian harus menjaga agar data konsultasi dan identitas pemohon tidak bocor.

## 10. Pengujian Data CMS

Periksa:
- Data sesuai sumber CMS.
- Field tidak tertukar.
- Tidak ada data fiktif.
- Data kosong ditangani dengan benar.
- Format tanggal sesuai.
- Format angka sesuai.
- URL gambar valid.
- Kegagalan remote tidak merusak cache.
- Tidak ada perubahan data sumber yang tidak diminta.

Jika menggunakan data simulasi, pastikan data tersebut tidak masuk ke produksi.

## 11. Pengujian Console dan Network

Jika browser tersedia, periksa:

### Console
- JavaScript errors.
- Unhandled promise rejection.
- Error rendering.
- Warning baru yang relevan.

### Network
- File penting berhasil dimuat.
- Tidak ada aset yang gagal dimuat tanpa penanganan.
- Request API sesuai kebutuhan.
- Tidak ada request berulang yang tidak diperlukan.
- Tidak ada kebocoran secret atau data sensitif.

Bedakan error baru akibat perubahan dengan error lama yang memang sudah ada.

Error lama tetap perlu dicatat jika berdampak pada fungsi atau keamanan, tetapi jangan mengklaim error tersebut disebabkan oleh perubahan baru tanpa bukti.

## 12. Pengujian Keamanan

Jika perubahan berkaitan dengan keamanan, uji:
- Akses tanpa autentikasi.
- Akses dengan autentikasi.
- Perbedaan hak akses.
- Input tidak valid.
- Data milik pengguna lain.
- Token tidak valid atau kedaluwarsa.
- Akses endpoint yang seharusnya ditolak.
- Kebocoran informasi sensitif.

Jangan melakukan eksploitasi destruktif terhadap sistem produksi.

## 13. Penanganan Test Failure

Jika pengujian gagal:

1. Identifikasi jenis kegagalan.
2. Tentukan apakah kegagalan berasal dari perubahan baru atau kondisi lama.
3. Jangan menyembunyikan error.
4. Jangan mengubah bagian lain secara sembarangan.
5. Perbaiki masalah sesuai ruang lingkup.
6. Jalankan ulang pengujian yang relevan.
7. Laporkan kegagalan yang belum terselesaikan.

Jika perbaikan membutuhkan perubahan di luar ruang lingkup, hentikan perubahan tersebut dan laporkan sebagai temuan terpisah.

## 14. Penggunaan Browser Automation

Jika tersedia, Agent dapat menggunakan browser automation untuk menguji aplikasi.

Ketentuan:
- Gunakan environment yang sesuai.
- Catat ukuran viewport.
- Catat halaman yang diuji.
- Verifikasi interaksi secara nyata.
- Jangan mengklaim pengujian browser hanya berdasarkan pembacaan kode.
- Jangan mengklaim pengujian perangkat fisik jika hanya menggunakan emulasi viewport.

Screenshot dapat digunakan sebagai bukti visual jika relevan.

## 15. Kriteria Penyelesaian

Pekerjaan dapat dinyatakan selesai jika:

- Perubahan sesuai ruang lingkup.
- Pemeriksaan kode yang relevan lulus.
- Fungsi utama berjalan.
- Tidak ada regresi penting yang diketahui.
- Data tetap akurat.
- Tampilan sesuai pada ukuran layar yang relevan.
- Error baru yang penting telah diselesaikan atau dijelaskan.
- Tidak ada perubahan di luar ruang lingkup yang disembunyikan.

Jika sebagian pengujian belum dapat dilakukan, status pekerjaan harus dinyatakan sebagai selesai dengan keterbatasan atau belum terverifikasi, sesuai kondisinya.

## 16. Format Laporan QA

Setiap laporan pengujian menggunakan struktur berikut:

### A. Informasi
- Nama fase:
- Branch:
- HEAD awal:
- HEAD akhir:
- Ruang lingkup:

### B. Perubahan
- File yang diubah:
- Ringkasan perubahan:
- Bagian yang tidak disentuh:

### C. Pengujian

| Pemeriksaan | Hasil | Keterangan |
|---|---|---|
| Syntax check | Lulus/Gagal/Belum | Bukti aktual |
| Diff check | Lulus/Gagal/Belum | Bukti aktual |
| Functional test | Lulus/Gagal/Belum | Bukti aktual |
| Browser test | Lulus/Gagal/Belum | Bukti aktual |
| Regression test | Lulus/Gagal/Belum | Bukti aktual |
| Security test | Lulus/Gagal/Belum | Bukti aktual jika relevan |

### D. Temuan
- Error baru:
- Error lama:
- Risiko tersisa:
- Keterbatasan pengujian:

### E. Kesimpulan
- Status pekerjaan:
- Status verifikasi:
- Tindakan lanjutan:

Jangan mengisi hasil dengan asumsi. Gunakan status belum diuji jika memang belum diuji.

## 17. Prinsip Akhir

Pengujian bukan formalitas untuk melengkapi laporan.

**Pekerjaan baru dapat dipercaya jika hasilnya telah diperiksa dan bukti pemeriksaannya dapat dijelaskan.**

Lebih baik melaporkan keterbatasan secara jujur daripada menyatakan seluruh pengujian berhasil tanpa bukti.