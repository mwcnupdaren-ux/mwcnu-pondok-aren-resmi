# 03. DESIGN SYSTEM
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/03-design-system.md`  
**Status:** Pedoman desain utama

## 1. Tujuan

Dokumen ini menetapkan standar visual dan pengalaman pengguna (UI/UX) untuk seluruh halaman website MWCNU Pondok Aren.

Setiap perubahan desain harus:
- Menjaga identitas resmi MWCNU dan Nahdlatul Ulama.
- Mengutamakan tampilan bersih, elegan, profesional, dan mudah digunakan.
- Konsisten antara halaman desktop, tablet, dan mobile.
- Tidak merusak fungsi, navigasi, maupun komponen yang sudah berjalan.
- Menghindari perubahan visual besar di luar ruang lingkup pekerjaan.

## 2. Karakter Visual

Arah desain utama:

- **Clean:** tidak dipenuhi elemen dekoratif yang tidak diperlukan.
- **Elegant:** memiliki komposisi, jarak, dan tipografi yang tertata.
- **Professional:** layak digunakan sebagai portal resmi organisasi.
- **Modern:** menggunakan pola antarmuka web modern tanpa mengikuti tren secara berlebihan.
- **Responsive:** nyaman digunakan pada berbagai ukuran layar.
- **NU Identity:** identitas NU hadir secara halus dan konsisten.

Hindari desain yang terlalu ramai, berlebihan, penuh efek, atau menyerupai template website generik.

## 3. Identitas Warna

Warna utama mengikuti identitas visual NU.

| Elemen | Pedoman |
|---|---|
| Hijau utama | Warna identitas utama NU |
| Hijau gelap | Navigasi, judul tertentu, atau elemen penegas |
| Hijau muda | Latar pendukung dan aksen lembut |
| Putih | Latar utama dan ruang visual |
| Abu-abu netral | Teks sekunder, garis, dan latar alternatif |
| Merah-putih | Aksen kebangsaan secara terbatas |

Ketentuan:
- Periksa warna yang sudah digunakan dalam repository sebelum membuat warna baru.
- Utamakan penggunaan CSS variables atau token warna yang sudah tersedia.
- Jangan membuat banyak variasi warna hijau tanpa kebutuhan yang jelas.
- Pastikan kontras teks dan latar tetap nyaman dibaca.
- Aksen merah-putih tidak boleh mengalahkan identitas hijau NU.

**Catatan:** Nilai warna final harus mengikuti hasil pemeriksaan stylesheet aktual. Jangan menetapkan kode warna baru hanya berdasarkan perkiraan.

## 4. Tipografi

Gunakan tipografi yang:
- Mudah dibaca pada layar kecil maupun besar.
- Memiliki hierarki visual yang jelas.
- Tidak terlalu banyak menggunakan jenis font.
- Konsisten antara judul, isi, label, navigasi, dan metadata.

Hierarki yang digunakan:
1. Judul utama halaman.
2. Judul bagian.
3. Judul kartu atau artikel.
4. Isi utama.
5. Metadata dan keterangan tambahan.

Ketentuan:
- Hindari ukuran teks terlalu kecil.
- Batasi penggunaan font weight yang berlebihan.
- Jaga panjang baris agar nyaman dibaca.
- Gunakan line-height yang memadai.
- Periksa font yang sudah digunakan sebelum menambahkan font eksternal.

## 5. Layout dan Spacing

Gunakan sistem tata letak yang konsisten.

Pedoman:
- Konten utama memiliki batas lebar yang terukur.
- Jarak antarkomponen harus konsisten.
- Gunakan alignment yang jelas.
- Hindari elemen yang saling bertumpuk.
- Jangan menggunakan margin negatif atau posisi absolut sebagai solusi umum untuk masalah layout.
- Hindari terlalu banyak nested container tanpa manfaat.

Untuk halaman dengan sidebar:
- Pastikan area konten utama tetap memiliki ruang yang cukup.
- Sidebar tidak boleh mendominasi halaman.
- Pada layar kecil, gunakan susunan yang sesuai dan mudah dipahami.
- Jangan memaksakan ukuran sidebar desktop ke perangkat mobile.

## 6. Komponen UI

Komponen yang berulang harus memiliki gaya konsisten.

### 6.1 Tombol
- Bedakan tombol utama, sekunder, dan tindakan alternatif.
- Gunakan label yang jelas dan singkat.
- Pastikan ukuran area sentuh nyaman pada perangkat mobile.
- Sediakan kondisi hover, focus, active, dan disabled jika relevan.
- Jangan menggunakan warna tombol yang tidak sesuai dengan identitas visual.

### 6.2 Kartu
- Gunakan komposisi yang konsisten.
- Jaga proporsi gambar dan teks.
- Hindari bayangan terlalu tebal.
- Gunakan border dan radius secara konsisten.
- Jangan menambahkan dekorasi yang tidak membantu pemahaman konten.

### 6.3 Formulir
- Setiap input memiliki label yang jelas.
- Pesan kesalahan harus mudah dipahami.
- Tampilkan status proses dan hasil tindakan.
- Pastikan fokus keyboard terlihat.
- Jangan mengandalkan warna saja untuk menjelaskan kesalahan.

### 6.4 Navigasi
- Navigasi harus mudah ditemukan dan dipahami.
- Status halaman aktif harus jelas.
- Menu mobile harus mudah dibuka dan ditutup.
- Jangan menghilangkan akses menuju modul penting saat melakukan redesign.

### 6.5 Badge dan Label
- Gunakan hanya jika memberikan informasi yang berguna.
- Hindari badge dekoratif yang berlebihan.
- Jangan menggunakan badge untuk mengulang informasi yang sudah terlihat jelas.

## 7. Gambar dan Media

Ketentuan umum:
- Gunakan gambar sesuai fungsi dan konteks konten.
- Pertahankan rasio gambar yang konsisten dalam satu kelompok komponen.
- Gunakan `object-fit` sesuai kebutuhan.
- Hindari gambar pecah, terdistorsi, atau terpotong secara tidak wajar.
- Gunakan teks alternatif yang sesuai.
- Pastikan media tidak menyebabkan layout bergeser secara berlebihan saat dimuat.

### 7.1 Gambar Berita
- Thumbnail berita harus menggunakan gambar milik artikel dari sumber data CMS.
- Field gambar artikel yang digunakan adalah `foto`, setelah diverifikasi terhadap implementasi aktual.
- Jika gambar tidak tersedia, gunakan placeholder netral.
- Jangan menggunakan gambar Hero sebagai pengganti thumbnail berita.

### 7.2 Hero
- Gunakan gambar desktop dan mobile secara terpisah sesuai konfigurasi CMS.
- Hero bersifat statis.
- Tidak menggunakan slideshow, autoplay, atau transisi pergantian gambar.
- Teks harus tetap terbaca dan tidak menutupi bagian penting gambar.
- Jangan mengembalikan `assets/img/og-cover.png` yang telah dihapus.

## 8. Responsive Design

Desain harus diperiksa pada setidaknya tiga kelompok perangkat:

- Mobile: sekitar 360–430 px.
- Tablet: sekitar 768 px.
- Desktop: sekitar 1280–1440 px atau lebih.

Ketentuan:
- Tidak boleh ada horizontal overflow yang tidak disengaja.
- Teks tidak boleh terpotong tanpa alasan.
- Tombol dan tautan mudah disentuh.
- Gambar harus menyesuaikan ruang yang tersedia.
- Grid harus berubah sesuai lebar layar.
- Sidebar dan navigasi harus memiliki perilaku mobile yang jelas.
- Jangan memperbaiki satu ukuran layar dengan merusak ukuran layar lainnya.

Nilai breakpoint harus mengikuti pola yang sudah digunakan dalam repository. Jangan menambah breakpoint baru tanpa alasan teknis.

## 9. Animasi dan Efek

Animasi bukan tujuan utama desain.

Gunakan hanya jika:
- Memiliki fungsi yang jelas.
- Tidak menghambat interaksi.
- Tidak mengganggu pembacaan.
- Tidak membebani perangkat.
- Menghormati preferensi `prefers-reduced-motion`.

Hindari:
- Animasi dekoratif berlebihan.
- Efek parallax yang tidak diperlukan.
- Transisi panjang.
- Autoplay media.
- Animasi yang mengubah posisi elemen secara mengganggu.

Khusus Hero, tetap ikuti ketentuan statis pada dokumen komponen terlindungi.

## 10. Aksesibilitas

Setiap perubahan UI harus memperhatikan:
- Kontras warna yang memadai.
- Struktur heading yang berurutan.
- Label yang jelas untuk input.
- Focus state yang terlihat.
- Navigasi keyboard.
- Alt text untuk gambar informatif.
- Tombol dan tautan dengan tujuan yang jelas.
- Informasi penting tidak hanya disampaikan melalui warna.

Jangan menghapus atribut aksesibilitas yang sudah tersedia.

## 11. Konsistensi Antarhalaman

Sebelum membuat komponen visual baru:
1. Periksa apakah komponen serupa sudah tersedia.
2. Periksa stylesheet dan class yang sudah digunakan.
3. Gunakan ulang komponen yang sesuai.
4. Hindari membuat variasi baru jika tidak diperlukan.
5. Pastikan perubahan tidak menimbulkan konflik dengan halaman lain.

Jangan melakukan redesign global hanya untuk menyelesaikan masalah pada satu halaman.

## 12. Batas Perubahan Desain

Agent wajib membedakan tiga jenis pekerjaan:

**A. Perbaikan visual kecil**
- Perbaikan jarak.
- Koreksi alignment.
- Perbaikan ukuran teks.
- Perbaikan overflow.
- Koreksi responsivitas lokal.

**B. Redesign terbatas**
- Mengubah susunan satu halaman.
- Mengubah komposisi kartu atau sidebar.
- Menyusun ulang bagian halaman tertentu.

**C. Redesign menyeluruh**
- Mengubah sistem visual global.
- Mengubah navigasi utama.
- Mengubah struktur komponen lintas halaman.
- Mengubah identitas visual.

Pekerjaan B dan C harus memiliki ruang lingkup yang jelas. Redesign menyeluruh tidak boleh dilakukan sebagai efek samping dari permintaan perbaikan kecil.

## 13. Pemeriksaan Sebelum dan Sesudah Perubahan

Sebelum perubahan:
- Identifikasi halaman dan komponen yang terdampak.
- Periksa stylesheet terkait.
- Catat tampilan awal.
- Periksa penggunaan ulang class dan komponen.

Sesudah perubahan:
- Periksa desktop dan mobile.
- Periksa tidak ada overflow.
- Periksa tombol, tautan, dan navigasi.
- Periksa konsistensi warna dan tipografi.
- Periksa console dan error rendering.
- Pastikan komponen lain tidak ikut berubah tanpa alasan.

## 14. Prinsip Akhir

Desain website MWCNU Pondok Aren harus terasa resmi, modern, bersih, dan mudah digunakan.

Setiap perubahan harus memperbaiki pengalaman pengguna tanpa mengorbankan identitas organisasi, keterbacaan, responsivitas, dan stabilitas sistem.

**Prinsip utama: desain yang baik bukan yang paling ramai, tetapi yang paling jelas, konsisten, dan tepat guna.**