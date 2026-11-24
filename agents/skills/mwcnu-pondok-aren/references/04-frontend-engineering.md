# 04. FRONTEND ENGINEERING
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/04-frontend-engineering.md`  
**Status:** Standar pengembangan frontend

## 1. Tujuan

Dokumen ini menjadi pedoman teknis untuk seluruh pekerjaan frontend website MWCNU Pondok Aren.

Tujuan utamanya:
- Menjaga kualitas dan konsistensi kode.
- Mencegah regresi fungsi yang sudah berjalan.
- Menghindari perubahan yang tidak diperlukan.
- Memastikan kompatibilitas lintas perangkat dan browser.
- Memudahkan pemeliharaan oleh Agent maupun pengembang manusia.

## 2. Prinsip Utama Pengembangan

Setiap perubahan frontend wajib mengikuti prinsip berikut:

1. **Inspect before editing:** pahami implementasi aktual sebelum mengubah kode.
2. **Minimal changes:** ubah hanya bagian yang diperlukan.
3. **Preserve existing behavior:** pertahankan fungsi yang tidak termasuk ruang lingkup.
4. **Reuse before creating:** gunakan ulang fungsi, komponen, dan pola yang sudah tersedia.
5. **No speculative rewrite:** jangan menulis ulang kode hanya karena memiliki preferensi implementasi berbeda.
6. **Verify after editing:** lakukan pemeriksaan setelah perubahan.
7. **Document important decisions:** jelaskan perubahan yang berdampak pada struktur atau perilaku sistem.

## 3. HTML

### 3.1 Struktur
- Gunakan struktur HTML yang semantik.
- Pertahankan struktur elemen yang sudah menjadi kontrak dengan JavaScript.
- Gunakan elemen sesuai fungsinya, seperti `header`, `nav`, `main`, `section`, `article`, dan `footer`.
- Hindari elemen bersarang yang tidak diperlukan.
- Pastikan setiap elemen interaktif memiliki tujuan yang jelas.

### 3.2 ID dan Class
- Jangan mengubah atau menghapus ID yang digunakan JavaScript, CSS, navigasi, atau integrasi lain tanpa audit dampak.
- Hindari penggunaan ID yang sama lebih dari sekali dalam satu dokumen.
- Gunakan class yang deskriptif dan konsisten.
- Periksa apakah class yang akan dibuat sudah tersedia.

### 3.3 Atribut
- Pertahankan atribut aksesibilitas.
- Gunakan `alt` yang sesuai untuk gambar.
- Gunakan `type` yang tepat pada tombol.
- Gunakan atribut `aria-*` hanya sesuai kebutuhan dan perilaku aktual komponen.
- Hindari atribut duplikat atau tidak valid.

### 3.4 Script dan Stylesheet
- Pertahankan urutan pemuatan script jika urutan tersebut menjadi ketergantungan aplikasi.
- Jangan menghapus script hanya karena tidak terlihat langsung digunakan.
- Jangan mengubah versi cache-busting secara sembarangan.
- Periksa seluruh referensi file sebelum memindahkan atau mengganti nama aset.

## 4. CSS

### 4.1 Pengelolaan Style
- Periksa stylesheet dan aturan yang sudah ada sebelum menambahkan aturan baru.
- Utamakan penggunaan CSS variables yang tersedia.
- Hindari duplikasi deklarasi.
- Gunakan selector sesempit mungkin sesuai kebutuhan.
- Jangan mengubah style global untuk memperbaiki masalah lokal jika tidak diperlukan.

### 4.2 Specificity
- Hindari penggunaan `!important` sebagai solusi pertama.
- Jangan menambah selector yang semakin kompleks untuk menimpa konflik CSS lama tanpa memahami sumber konflik.
- Jika terdapat aturan yang saling bertentangan, identifikasi sumbernya dan lakukan perbaikan terarah.
- Hindari perubahan massal terhadap selector yang digunakan banyak halaman.

### 4.3 Responsive CSS
- Ikuti breakpoint yang sudah digunakan.
- Pastikan perubahan tidak menyebabkan layout bergeser atau bertumpuk.
- Gunakan pendekatan layout yang sesuai, seperti Flexbox atau Grid.
- Hindari ukuran tetap yang membuat konten tidak fleksibel.
- Periksa horizontal overflow.

### 4.4 Animasi
- Gunakan animasi seperlunya.
- Hindari animasi yang membebani perangkat.
- Perhatikan `prefers-reduced-motion`.
- Jangan menambahkan autoplay atau animasi pergantian Hero.

### 4.5 CSS Cleanup
Pembersihan CSS harus dilakukan secara terukur.

Agent tidak boleh:
- Menghapus aturan hanya karena tampak duplikat tanpa memeriksa penggunaannya.
- Menghapus media query tanpa memeriksa dampaknya.
- Menggabungkan selector berbeda tanpa memastikan kesamaan perilaku.
- Melakukan refactor seluruh stylesheet dalam tugas perbaikan lokal.

## 5. JavaScript

### 5.1 Dasar Implementasi
- Ikuti pola JavaScript yang sudah digunakan proyek.
- Gunakan nama variabel dan fungsi yang mudah dipahami.
- Hindari global variable baru jika tidak diperlukan.
- Gunakan strict comparison (`===`) jika sesuai.
- Tangani kondisi `null`, `undefined`, dan data kosong.
- Hindari fungsi yang terlalu panjang dan memiliki banyak tanggung jawab.

### 5.2 DOM Manipulation
- Pastikan elemen tersedia sebelum digunakan.
- Gunakan event listener secara terkontrol.
- Hindari memasang event listener berulang setiap kali halaman dirender.
- Jangan mengganti seluruh isi DOM jika hanya sebagian yang perlu diperbarui.
- Pertahankan ID dan class yang menjadi kontrak antarfungsi.

### 5.3 Data dan Rendering
- Bedakan data cache, data remote, dan data hasil rendering.
- Pastikan perubahan data diikuti pembaruan tampilan jika halaman sedang aktif.
- Hindari memuat ulang halaman hanya untuk memperbarui satu bagian data.
- Pertahankan tampilan cache ketika permintaan remote gagal jika mekanisme cache tersebut memang digunakan.
- Hindari render berulang jika data tidak berubah.
- Pastikan data kosong ditangani dengan tampilan yang wajar.

### 5.4 Asynchronous Operations
- Tangani Promise dengan `async/await` atau pola yang sudah digunakan.
- Tangani error secara eksplisit.
- Hindari permintaan berulang yang tidak diperlukan.
- Cegah hasil permintaan lama menimpa data yang lebih baru jika terdapat permintaan bersamaan.
- Tampilkan status loading, sukses, atau gagal jika dibutuhkan pengguna.

### 5.5 Keamanan Frontend
- Jangan memasukkan secret key atau kredensial privat ke JavaScript frontend.
- Jangan mengandalkan validasi frontend sebagai satu-satunya perlindungan keamanan.
- Hindari memasukkan data tidak tepercaya ke HTML menggunakan `innerHTML` tanpa sanitasi yang tepat.
- Gunakan `textContent` ketika hanya membutuhkan teks.
- Jangan menampilkan informasi internal atau data sensitif kepada pengguna yang tidak berwenang.

### 5.6 Error Handling
- Jangan menelan error secara diam-diam.
- Berikan fallback yang aman.
- Hindari menampilkan stack trace atau informasi internal kepada pengguna.
- Jangan menghapus logging yang dibutuhkan untuk diagnosis tanpa alasan.
- Jangan meninggalkan `console.log` debugging sementara setelah pekerjaan selesai.

## 6. Integrasi Supabase dari Frontend

Ketentuan:
- Gunakan pola inisialisasi Supabase yang sudah tersedia.
- Jangan membuat client kedua tanpa alasan teknis yang jelas.
- Jangan mengubah konfigurasi autentikasi atau mekanisme sesi dalam tugas frontend biasa.
- Jangan mengekspos `service_role` key.
- Jangan menganggap data yang dikirim browser dapat dipercaya.
- Jangan melewati pemeriksaan otorisasi backend.
- Jangan mengubah tabel, RLS, SQL, atau Edge Functions sebagai efek samping pekerjaan frontend.

Jika ditemukan masalah yang membutuhkan perubahan backend, catat sebagai temuan terpisah dan jangan memperluas ruang lingkup secara otomatis.

## 7. Pengelolaan Aset

- Periksa penggunaan aset sebelum menghapus atau menggantinya.
- Gunakan format gambar yang sesuai dengan kebutuhan.
- Hindari aset duplikat yang tidak diperlukan.
- Pertahankan nama file dan lokasi aset yang sudah menjadi referensi kode.
- Jangan mengganti aset resmi tanpa dasar yang jelas.
- Jangan mengembalikan `assets/img/og-cover.png` yang telah dihapus.
- Jangan menggunakan Hero sebagai fallback thumbnail berita.

## 8. Cache dan Versioning

- Periksa mekanisme cache aktual sebelum mengubahnya.
- Pertahankan kompatibilitas antara cache dan data remote.
- Jangan menghapus cache pengguna tanpa kebutuhan yang jelas.
- Jangan menaikkan versi cache-busting pada file yang tidak berubah tanpa alasan.
- Jika file yang di-cache berubah dan membutuhkan invalidasi, perbarui versi referensinya secara konsisten.
- Pastikan tidak ada kombinasi versi script yang saling tidak kompatibel.

Perubahan mekanisme cache harus diuji pada kondisi:
- Cache tersedia dan data remote berhasil.
- Cache tersedia dan data remote gagal.
- Cache kosong.
- Data remote berubah ketika halaman sedang terbuka.
- Pengguna berpindah halaman saat permintaan masih berlangsung.

## 9. Arsitektur dan Batas Refactor

Sebelum melakukan refactor:
1. Identifikasi fungsi yang akan diubah.
2. Cari seluruh pemanggil fungsi tersebut.
3. Periksa dependensi HTML, CSS, dan JavaScript.
4. Tentukan dampak terhadap modul lain.
5. Pastikan ruang lingkup perubahan disetujui.

Jangan melakukan:
- Rewrite seluruh `app.js` untuk memperbaiki satu fungsi.
- Migrasi framework tanpa keputusan arsitektur.
- Pemindahan file besar-besaran tanpa kebutuhan.
- Penggantian library secara sepihak.
- Perubahan API internal tanpa pemeriksaan seluruh pemanggil.

Refactor harus memberikan manfaat nyata dan tidak memperbesar risiko tanpa alasan.

## 10. Kompatibilitas Browser

Periksa kompatibilitas fitur JavaScript dan CSS yang digunakan.

Utamakan:
- Fitur web standar yang didukung browser modern.
- Fallback jika fitur tertentu belum tersedia.
- Tidak mengandalkan perilaku browser yang tidak konsisten.
- Pengujian pada browser yang relevan dengan pengguna website.

Jangan menambahkan polyfill atau library baru tanpa kebutuhan yang jelas.

## 11. Standar Pemeriksaan Kode

Setelah perubahan, lakukan pemeriksaan yang sesuai dengan jenis file.

Contoh:
- JavaScript: `node --check`.
- Git whitespace: `git diff --check`.
- HTML: validasi struktur dan referensi aset.
- CSS: periksa syntax, selector, dan konflik.
- Browser: periksa rendering, navigasi, interaksi, dan console.

Pemeriksaan harus benar-benar dijalankan. Jangan melaporkan hasil yang belum dilakukan.

## 12. Standar Pengujian Frontend

Pengujian minimal mengikuti dampak perubahan.

Periksa:
- Halaman utama.
- Halaman yang diubah.
- Halaman lain yang menggunakan komponen bersama.
- Desktop dan mobile.
- Navigasi langsung dan navigasi melalui klik.
- Kondisi data tersedia dan kosong.
- Kondisi loading dan error jika relevan.

Jika browser automation tidak tersedia, jelaskan keterbatasannya dan gunakan pemeriksaan alternatif yang benar-benar dapat dilakukan.

## 13. Pelaporan Perubahan

Setiap pekerjaan frontend harus melaporkan:

1. File yang diperiksa.
2. File yang diubah.
3. Ringkasan perubahan.
4. Alasan perubahan.
5. Pemeriksaan yang dijalankan.
6. Hasil pengujian.
7. Risiko atau keterbatasan yang ditemukan.
8. Bagian yang sengaja tidak disentuh.

Jangan menyatakan pekerjaan selesai jika masih terdapat error penting yang belum dijelaskan.

## 14. Prinsip Akhir

Frontend MWCNU Pondok Aren harus dikembangkan secara hati-hati, terukur, dan konsisten.

**Utamakan perbaikan yang tepat sasaran daripada perubahan besar yang tidak diperlukan.**

Kode yang baik bukan hanya terlihat rapi, tetapi juga menjaga fungsi, keamanan, kompatibilitas, dan kemudahan pemeliharaan.