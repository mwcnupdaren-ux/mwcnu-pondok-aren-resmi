# 05. CMS DATA INTEGRITY
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/05-cms-data-integrity.md`  
**Status:** Standar integritas data CMS

## 1. Tujuan

Dokumen ini mengatur pengelolaan, pembacaan, penampilan, dan perubahan data CMS pada website MWCNU Pondok Aren.

Tujuan utama:
- Menjaga keakuratan informasi organisasi.
- Mencegah data palsu atau hasil asumsi Agent.
- Menjaga kesesuaian antara data CMS dan tampilan website.
- Memastikan data kosong ditangani dengan benar.
- Mencegah perubahan struktur data tanpa persetujuan.

## 2. Prinsip Integritas Data

Seluruh Agent wajib mengikuti prinsip berikut:

1. **Data is the source of truth:** data CMS menjadi sumber informasi, bukan asumsi Agent.
2. **No fabrication:** jangan membuat data, angka, tanggal, nama, atau keterangan yang tidak tersedia.
3. **Preserve original data:** jangan mengubah data sumber hanya demi menyesuaikan tampilan.
4. **Explicit fallback:** data kosong harus ditangani dengan fallback yang jelas dan tidak menyesatkan.
5. **No silent mutation:** jangan mengubah atau menghapus data CMS tanpa instruksi.
6. **Schema awareness:** pahami struktur data aktual sebelum melakukan perubahan.

## 3. Pemeriksaan Sebelum Mengubah CMS

Sebelum mengubah integrasi CMS, Agent wajib:
- Memeriksa sumber data yang digunakan.
- Memeriksa nama tabel, field, dan tipe data aktual.
- Memeriksa fungsi pengambilan dan pemrosesan data.
- Memeriksa hubungan data dengan komponen frontend.
- Memeriksa kemungkinan dampak terhadap halaman lain.
- Membedakan perubahan tampilan dengan perubahan data sumber.

Jangan menyimpulkan struktur tabel hanya dari nama variabel atau tampilan halaman.

Jika struktur belum diketahui, lakukan pemeriksaan read-only terlebih dahulu.

## 4. Berita dan Artikel

### 4.1 Sumber Data
- Gunakan data berita yang berasal dari CMS.
- Pertahankan field dan format data yang digunakan aplikasi.
- Jangan membuat artikel contoh atau berita palsu pada lingkungan produksi.
- Jangan mengubah judul, tanggal, penulis, atau isi artikel tanpa instruksi.

### 4.2 Thumbnail
- Gunakan field `foto` sebagai sumber thumbnail artikel setelah memastikan implementasi aktual.
- Jangan mengambil gambar Hero untuk menggantikan thumbnail artikel.
- Jika `foto` kosong atau tidak valid, tampilkan placeholder netral.
- Jangan menggunakan gambar artikel lain sebagai pengganti tanpa dasar yang jelas.
- Pastikan thumbnail pada daftar berita, halaman artikel, dan metadata berbagi sesuai dengan artikel yang sama.

### 4.3 Kategori dan Berita Terkait
- Gunakan kategori yang benar-benar tersedia.
- Jangan membuat kategori baru hanya untuk mengisi tampilan.
- Berita terkait harus berdasarkan hubungan yang masuk akal, seperti kategori atau relevansi konten.
- Jika tidak ada berita terkait, tampilkan kondisi kosong yang wajar atau sembunyikan bagian tersebut.
- Jangan menampilkan daftar rekomendasi kosong seolah-olah berisi konten.

### 4.4 Data Kosong
- Jangan membuat judul, tanggal, penulis, atau thumbnail pengganti yang seolah-olah merupakan data asli.
- Gunakan fallback hanya untuk kebutuhan tampilan.
- Bedakan placeholder visual dengan konten editorial.

## 5. Agenda Kegiatan

Ketentuan:
- Tampilkan agenda berdasarkan data yang tersedia.
- Jangan mengarang nama kegiatan, tanggal, waktu, lokasi, atau penyelenggara.
- Jangan menganggap tanggal kosong sebagai tanggal saat ini.
- Jangan menampilkan agenda kedaluwarsa sebagai agenda mendatang.
- Jangan mengubah zona waktu tanpa memahami format sumber data.
- Jika tidak ada agenda, tampilkan pesan bahwa belum ada agenda yang tersedia.

Jika terdapat masalah format tanggal atau zona waktu, periksa sumber data dan fungsi pemrosesan sebelum memperbaikinya.

## 6. Laporan Kas

Field CMS yang pernah digunakan dalam proyek:
- `tampil`
- `periode`
- `pemasukan`
- `pengeluaran`
- `saldo`
- `keterangan`
- `dokumen`

Daftar ini merupakan catatan historis dan wajib diverifikasi terhadap implementasi serta schema aktual.

Ketentuan:
- Jangan membuat transaksi fiktif.
- Jangan mengarang nilai pemasukan atau pengeluaran.
- Jangan menghitung saldo dari asumsi yang tidak tersedia.
- Jangan menambahkan saldo awal jika sumber data tidak menyediakannya.
- Jangan mengubah nilai keuangan hanya untuk membuat laporan terlihat seimbang.
- Jangan mengubah periode laporan tanpa dasar data.
- Jangan menampilkan dokumen yang tidak tersedia seolah-olah dapat diunduh.

Jika data tidak lengkap, tampilkan informasi yang tersedia secara jujur atau jelaskan bahwa data belum tersedia.

## 7. Konten Organisasi

Untuk profil organisasi, struktur kepengurusan, dokumentasi kegiatan, dan informasi kelembagaan:

- Gunakan informasi resmi yang tersedia.
- Jangan mengarang nama pengurus, jabatan, periode, atau riwayat organisasi.
- Jangan mengubah gelar atau identitas seseorang tanpa instruksi.
- Jangan menggabungkan data dari sumber berbeda tanpa memeriksa konsistensinya.
- Jangan menerbitkan informasi yang belum dikonfirmasi sebagai informasi resmi.

Jika ditemukan perbedaan informasi, catat sebagai temuan dan minta konfirmasi yang diperlukan.

## 8. Cache dan Sinkronisasi Data

Jika aplikasi menggunakan cache lokal dan data remote:

- Pahami urutan pengambilan data.
- Pertahankan mekanisme cache yang sudah berjalan.
- Jangan menganggap cache sebagai sumber data permanen.
- Jangan menghapus cache hanya untuk menyelesaikan masalah rendering.
- Pastikan data remote yang lebih baru dapat memperbarui tampilan.
- Hindari reload halaman yang tidak diperlukan.
- Tangani kegagalan remote tanpa merusak data cache yang masih dapat digunakan.

Setiap perubahan mekanisme sinkronisasi wajib menguji:
1. Cache tersedia dan remote berhasil.
2. Cache tersedia dan remote gagal.
3. Cache kosong.
4. Data remote berubah.
5. Halaman aktif saat data remote diterima.

Periksa konsistensi antara data sumber, state aplikasi, dan DOM yang ditampilkan.

## 9. Validasi Data

Validasi harus sesuai dengan kebutuhan field.

Contoh:
- Tanggal harus memiliki format yang dapat diproses.
- Nilai keuangan harus ditangani sebagai angka dengan format yang tepat.
- Teks kosong tidak boleh dianggap sebagai data valid.
- URL gambar harus diperiksa sebelum digunakan.
- Field opsional harus memiliki penanganan kondisi kosong.

Jangan mengubah nilai sumber secara otomatis hanya untuk melewati validasi.

Jika data tidak valid, tangani dengan fallback yang aman dan laporkan sumber masalahnya.

## 10. Keamanan dan Hak Akses CMS

- Jangan melewati mekanisme autentikasi CMS.
- Jangan mengubah hak akses pengguna tanpa persetujuan.
- Jangan mengekspos kredensial atau secret.
- Jangan mengandalkan validasi frontend sebagai perlindungan utama.
- Jangan mengubah RLS, SQL, atau kebijakan akses sebagai bagian dari pekerjaan CMS frontend biasa.
- Jangan melakukan operasi tulis atau hapus data produksi tanpa instruksi yang jelas.

Perubahan backend harus mengikuti dokumen keamanan backend.

## 11. Perubahan Schema dan Migrasi

Perubahan berikut termasuk pekerjaan backend dan tidak boleh dilakukan sebagai pekerjaan frontend biasa:

- Menambah atau menghapus tabel.
- Menambah atau menghapus kolom.
- Mengubah tipe data.
- Mengubah relasi.
- Mengubah constraint.
- Mengubah RLS atau policy.
- Mengubah fungsi database.
- Mengubah Edge Functions.

Jika perubahan schema diperlukan:
1. Identifikasi masalah dan kebutuhan.
2. Dokumentasikan dampaknya.
3. Pisahkan pekerjaan frontend dan backend.
4. Minta persetujuan ruang lingkup backend.
5. Siapkan prosedur pengujian dan pemulihan.

## 12. Pengujian Integritas Data

Setelah perubahan, periksa:

- Data yang ditampilkan sesuai dengan sumbernya.
- Tidak ada data fiktif.
- Tidak ada field yang tertukar.
- Data kosong ditangani dengan benar.
- Gambar sesuai dengan artikel.
- Tanggal dan angka ditampilkan secara benar.
- Tidak ada data yang hilang akibat perubahan rendering.
- Kegagalan remote tidak merusak cache.
- Tidak ada perubahan data sumber yang tidak diminta.

Jika memungkinkan, gunakan data uji yang terpisah dari produksi.

## 13. Pelaporan

Setiap pekerjaan yang menyentuh CMS harus melaporkan:

1. Sumber data yang diperiksa.
2. Field yang digunakan.
3. Perubahan pada proses pengambilan data.
4. Perubahan pada proses rendering.
5. Penanganan data kosong dan tidak valid.
6. Hasil pengujian.
7. Potensi risiko integritas data.
8. Apakah ada perubahan pada data sumber.

Agent wajib membedakan perubahan tampilan, perubahan logika pemrosesan, dan perubahan data sumber.

## 14. Prinsip Akhir

Website MWCNU Pondok Aren harus menyampaikan informasi yang benar dan dapat dipertanggungjawabkan.

**Lebih baik menampilkan bahwa data belum tersedia daripada menampilkan informasi yang tidak benar.**

Data CMS tidak boleh dikorbankan demi tampilan yang terlihat lengkap.