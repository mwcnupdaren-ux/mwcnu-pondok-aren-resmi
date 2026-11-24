# 06. BACKEND SECURITY
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/06-backend-security.md`  
**Status:** Standar keamanan backend

## 1. Tujuan

Dokumen ini menetapkan standar keamanan dan batas kewenangan Agent ketika bekerja dengan backend website MWCNU Pondok Aren.

Cakupan meliputi:
- Supabase.
- Database PostgreSQL.
- SQL dan migrasi.
- Row Level Security (RLS).
- Authentication dan Authorization.
- Edge Functions.
- API dan komunikasi frontend-backend.
- Secret, token, dan kredensial.
- Modul Konsultasi Agama.

Tujuan utama adalah menjaga kerahasiaan data, mencegah akses tidak sah, dan menghindari perubahan backend yang tidak terkontrol.

## 2. Prinsip Keamanan Utama

Seluruh Agent wajib mengikuti prinsip berikut:

1. **Security first:** keamanan lebih penting daripada kemudahan implementasi.
2. **Least privilege:** setiap pengguna dan proses hanya memperoleh akses yang diperlukan.
3. **Deny by default:** akses ditolak kecuali secara eksplisit diizinkan.
4. **Server-side enforcement:** aturan keamanan wajib ditegakkan di backend.
5. **No secret exposure:** kredensial privat tidak boleh masuk ke frontend atau laporan.
6. **No unauthorized mutation:** perubahan backend produksi memerlukan kewenangan yang jelas.
7. **Defense in depth:** jangan mengandalkan satu lapisan keamanan saja.

## 3. Batas Kewenangan Agent

Pekerjaan backend harus dibedakan berdasarkan tingkat risiko.

### 3.1 Pemeriksaan Read-only

Dapat dilakukan dalam audit sesuai ruang lingkup:
- Membaca struktur kode backend.
- Memeriksa konfigurasi non-rahasia.
- Meninjau SQL dan migrasi.
- Memeriksa kebijakan RLS.
- Meninjau Edge Functions.
- Menjalankan pemeriksaan lokal yang tidak mengubah sistem.
- Menganalisis log yang tidak mengandung informasi sensitif.

Pemeriksaan read-only tidak berarti Agent boleh membaca atau mencetak secret.

### 3.2 Perubahan Lokal

Perubahan kode backend lokal hanya boleh dilakukan jika backend termasuk ruang lingkup pekerjaan.

Contoh:
- Perbaikan validasi.
- Perbaikan penanganan error.
- Perbaikan konfigurasi.
- Perbaikan fungsi server.
- Penambahan atau perubahan pengujian.

Perubahan lokal tidak otomatis memberikan izin untuk menjalankan migrasi, mengubah layanan produksi, atau melakukan deployment.

### 3.3 Perubahan Berisiko Tinggi

Memerlukan persetujuan eksplisit sebelum dilakukan:
- Menjalankan SQL atau migrasi.
- Mengubah schema database.
- Mengubah RLS atau policy.
- Mengubah Authentication.
- Mengubah secret Supabase.
- Deploy Edge Functions.
- Mengubah konfigurasi proyek Supabase.
- Menghapus atau mengubah data produksi.
- Mengubah konfigurasi domain atau CORS produksi.

Persetujuan untuk satu tindakan tidak otomatis berlaku untuk tindakan berisiko tinggi lainnya.

## 4. Supabase Project

Project Supabase historis yang digunakan website:

`wvfcifqolohfipvepxss`

Informasi tersebut adalah catatan historis. Agent wajib memverifikasi konfigurasi repository aktual sebelum menggunakannya.

Ketentuan:
- Jangan mengganti project reference tanpa instruksi.
- Jangan menghubungkan repository ke project lain berdasarkan asumsi.
- Jangan menjalankan perintah yang mengubah remote project tanpa izin.
- Jangan menganggap konfigurasi lokal sama dengan konfigurasi produksi.
- Pastikan target environment diketahui sebelum tindakan remote.

## 5. Database dan SQL

### 5.1 Pemeriksaan
- Baca migrasi yang relevan sebelum melakukan perubahan.
- Pahami hubungan tabel, constraint, index, dan policy.
- Periksa ketergantungan fungsi aplikasi terhadap schema.
- Bedakan migrasi yang sudah diterapkan dengan file migrasi lokal.
- Jangan menganggap file SQL lokal sudah dijalankan di database.

### 5.2 Perubahan Schema
Perubahan schema harus:
- Memiliki alasan teknis yang jelas.
- Memiliki ruang lingkup terukur.
- Memperhitungkan kompatibilitas aplikasi.
- Memiliki prosedur pengujian.
- Memiliki rencana pemulihan jika terjadi kegagalan.

Jangan mengubah migrasi lama yang sudah diterapkan untuk mengubah keadaan database produksi. Gunakan migrasi baru sesuai strategi proyek.

### 5.3 Data Produksi
Dilarang melakukan operasi berikut tanpa izin eksplisit:
- `DELETE` data produksi.
- `TRUNCATE`.
- `DROP TABLE`.
- `DROP SCHEMA`.
- Update massal.
- Reset database.
- Penghapusan akun atau data pengguna.
- Perubahan data yang tidak dapat dipulihkan.

Jangan menggunakan data produksi sebagai data uji destruktif.

## 6. Row Level Security (RLS)

RLS merupakan lapisan keamanan penting dan tidak boleh dianggap sebagai pengaturan tambahan biasa.

Ketentuan:
- Periksa policy yang sudah tersedia sebelum mengubahnya.
- Jangan menonaktifkan RLS untuk mempermudah debugging.
- Jangan membuat policy terlalu luas.
- Jangan mengizinkan akses hanya berdasarkan asumsi dari frontend.
- Periksa akses `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` secara terpisah.
- Pastikan operasi pengguna dibatasi sesuai identitas dan hak aksesnya.
- Uji akses yang diizinkan maupun yang seharusnya ditolak.

Setiap perubahan RLS wajib disertai analisis dampak keamanan.

## 7. Authentication dan Authorization

- Bedakan autentikasi dari otorisasi.
- Jangan menganggap pengguna yang berhasil login otomatis memiliki hak akses tertentu.
- Hak akses harus diperiksa di sisi server.
- Jangan menyimpan password dalam bentuk plaintext.
- Jangan menampilkan token sesi kepada pengguna yang tidak berwenang.
- Jangan mengubah mekanisme sesi atau autentikasi tanpa ruang lingkup khusus.
- Periksa penanganan token kedaluwarsa dan sesi yang dicabut.
- Pastikan endpoint staf tidak dapat diakses oleh pengguna publik tanpa otorisasi.

Jangan menambahkan jalur bypass autentikasi untuk kebutuhan pengujian.

## 8. Secret dan Kredensial

Contoh informasi yang harus dirahasiakan:
- `service_role` key.
- Database password.
- JWT secret.
- Access token.
- Refresh token.
- API key privat.
- Password akun.
- Credential layanan eksternal.

Ketentuan:
- Jangan menampilkan isi file `.env`.
- Jangan mencetak secret melalui terminal atau laporan.
- Jangan menambahkan secret ke repository.
- Jangan memasukkan secret ke JavaScript frontend.
- Jangan menyalin secret ke dokumentasi.
- Jangan mengirim secret ke layanan eksternal yang tidak diizinkan.
- Pastikan file rahasia dikecualikan dari Git sesuai kebutuhan proyek.

Jika secret terdeteksi terlanjur terekspos, laporkan sebagai insiden keamanan. Jangan menyalin atau menyebarkan nilainya.

## 9. Edge Functions

Setiap perubahan Edge Functions harus memperhatikan:

- Validasi input.
- Autentikasi dan otorisasi.
- Pembatasan akses.
- Penanganan error.
- CORS.
- Rate limiting jika dibutuhkan.
- Validasi data dari sumber tidak tepercaya.
- Perlindungan secret.
- Logging tanpa data sensitif.

Ketentuan:
- Jangan mengubah fungsi publik menjadi fungsi staf atau sebaliknya tanpa analisis.
- Jangan mengubah konfigurasi verifikasi JWT tanpa memahami dampaknya.
- Jangan memperluas daftar origin CORS tanpa kebutuhan.
- Jangan mencetak token atau payload sensitif ke log.
- Jangan menganggap keberhasilan deploy sebagai bukti bahwa fungsi aman.

## 10. CORS dan API

- Gunakan daftar origin yang memang diperlukan.
- Hindari wildcard untuk endpoint yang menggunakan kredensial.
- Jangan mengizinkan origin sembarang hanya untuk mengatasi error browser.
- Periksa metode HTTP dan header yang digunakan.
- Validasi request pada backend.
- Jangan menganggap CORS sebagai mekanisme autentikasi.
- Pastikan error API tidak membocorkan detail internal.

Perubahan CORS produksi memerlukan persetujuan eksplisit.

## 11. Modul Konsultasi Agama

Modul Konsultasi Agama memiliki data dan alur kerja khusus sehingga membutuhkan perlindungan tambahan.

Kontrak historis yang harus diverifikasi terhadap implementasi aktual:

- Identitas pemohon bersifat opsional.
- Nomor tiket dan `ticket_secret` digunakan untuk akses tiket publik.
- Jawaban konsultasi dikelola melalui dashboard.
- Penugasan konsultan dilakukan oleh admin.
- Proses review berlaku untuk seluruh jawaban.
- Target SLA adalah tiga hari kerja WIB.
- Pemohon dapat memeriksa tiket tanpa memperoleh akses ke data internal.
- Jawaban terbaru mengikuti mekanisme visibilitas dan persetujuan yang ditetapkan.
- Publikasi menggunakan persetujuan dan revisi konten.
- Lampiran staf mengikuti aturan akses khusus.

Ketentuan keamanan:
- Jangan mengekspos `ticket_secret`.
- Jangan menyimpan secret tiket dalam URL publik jika tidak diperlukan.
- Jangan memberikan akses ke tiket hanya berdasarkan nomor tiket.
- Jangan membocorkan jawaban internal atau jawaban yang belum disetujui.
- Jangan membocorkan identitas pemohon.
- Jangan melewati proses review dan persetujuan publikasi.
- Jangan mengubah aturan visibilitas jawaban.
- Jangan memberikan akses lampiran tanpa pemeriksaan otorisasi.
- Jangan mengubah SLA atau alur penugasan tanpa instruksi.

Perubahan pada modul ini harus memperhitungkan dampak terhadap pemohon, konsultan, reviewer, dan administrator.

## 12. Logging dan Monitoring

Logging harus membantu diagnosis tanpa membocorkan informasi sensitif.

Jangan mencatat:
- Password.
- Secret tiket.
- Access token.
- Refresh token.
- Database credential.
- Data pribadi yang tidak diperlukan.
- Isi konsultasi sensitif secara berlebihan.

Gunakan informasi diagnostik yang cukup untuk mengidentifikasi jenis kesalahan, waktu kejadian, dan konteks teknis tanpa membuka data rahasia.

## 13. Pengujian Keamanan

Jika pekerjaan menyentuh backend, pengujian harus mencakup aspek yang relevan:

- Akses yang diizinkan.
- Akses yang ditolak.
- Pengguna tanpa autentikasi.
- Pengguna dengan hak akses berbeda.
- Input tidak valid.
- Data yang tidak ditemukan.
- Token kedaluwarsa atau tidak valid.
- Kebocoran data antar pengguna.
- Kegagalan layanan eksternal.
- Penanganan error dan log.

Pengujian harus dilakukan pada lingkungan yang sesuai. Jangan melakukan pengujian destruktif terhadap produksi.

## 14. Prosedur Jika Menemukan Kerentanan

Jika Agent menemukan potensi kerentanan:

1. Hentikan tindakan yang dapat memperburuk kondisi.
2. Jangan mengeksploitasi kerentanan lebih jauh dari yang diperlukan untuk verifikasi aman.
3. Jangan menyebarkan secret atau data sensitif.
4. Dokumentasikan lokasi dan dampak secara aman.
5. Tentukan apakah masalah berada di frontend, backend, konfigurasi, atau database.
6. Laporkan rekomendasi perbaikan.
7. Jangan mengubah produksi tanpa persetujuan yang sesuai.

Untuk kerentanan kritis, utamakan pengamanan daripada melanjutkan pekerjaan fitur.

## 15. Pelaporan Pekerjaan Backend

Setiap pekerjaan backend harus melaporkan:

1. Environment yang diperiksa.
2. File atau fungsi yang diperiksa.
3. Perubahan yang dilakukan.
4. SQL atau migrasi yang terlibat.
5. Policy dan hak akses yang terdampak.
6. Pengujian yang benar-benar dijalankan.
7. Hasil pengujian keamanan.
8. Status deployment jika ada.
9. Risiko yang masih tersisa.

Jangan mencantumkan secret atau data pribadi dalam laporan.

## 16. Prinsip Akhir

Backend MWCNU Pondok Aren harus menjaga kerahasiaan, integritas, dan ketersediaan data.

**Tidak ada perubahan keamanan yang boleh dilakukan hanya demi membuat fitur lebih mudah berjalan.**

Jika suatu fitur membutuhkan pengurangan keamanan, hentikan pekerjaan dan evaluasi kembali desainnya.