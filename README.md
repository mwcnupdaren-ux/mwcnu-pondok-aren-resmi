# MWCNU Pondok Aren (situs + Kartu Anggota)

Situs statis tanpa proses build. Cukup HTML, CSS, JavaScript, dan gambar.
Halaman memakai router hash (`#agenda`, `#zis`, `#daftar`, dst.), jadi tidak perlu aturan server khusus.
Pengecualian yang sudah diatur di `vercel.json` adalah alamat QR `/v/<nomor>`, halaman admin `/admin`,
dan halaman Program Khidmat yang dapat diakses langsung melalui `/program`.

## Isi proyek

```
index.html            halaman utama (semua bagian/halaman SPA)
verifikasi.html       halaman tujuan QR  (/v/<nomor>); sementara hanya memeriksa format nomor
vercel.json           pengalihan /v/*, cache gambar, header keamanan
css/style.css         seluruh gaya
js/app.js             seluruh logika dan data bawaan (halaman, kartu anggota, formulir)
js/content.js         pemuat konten CMS (Supabase) lalu menjalankan app.js
js/config.js          alamat dan kunci publik Supabase (isi sendiri)
js/vendor/supabase.js library klien Supabase (dipakai /admin)
admin/                aplikasi CMS (/admin)
supabase/schema.sql   skema database + aturan akses; supabase/seed.sql = data awal
js/vendor/qrcode.js   pembuat QR (qrcode-generator, MIT), dimuat lokal tanpa CDN
assets/img/           foto kegiatan, foto ketua, logo, favicon (nama berkas = hash isi)
assets/ttd/           taruh tanda tangan pengurus di sini (lihat LIHAT-INI.txt)
docs/KEPUTUSAN.md     catatan keputusan yang sudah disepakati
```

## Menjalankan di komputer

Harus lewat server lokal karena alamat gambar memakai jalur absolut (`/assets/...`):

```bash
npx serve . -l 8080        # atau: python3 -m http.server 8080
```
Lalu buka http://localhost:8080

## Unggah ke GitHub

1. Buat repositori baru di akun/organisasi GitHub (disarankan akun organisasi).
2. Unggah **isi** folder ini (bukan folder pembungkusnya) lewat *Add file > Upload files*, atau:
   ```bash
   git init && git add . && git commit -m "Situs MWCNU Pondok Aren"
   git branch -M main && git remote add origin <URL-REPO> && git push -u origin main
   ```

## Deploy di Vercel

1. *Add New > Project*, impor repositori tadi.
2. **Framework Preset: Other.** Kosongkan *Build Command* dan *Output Directory* (atau isi `.`).
3. *Deploy*. Setiap `git push` ke `main` akan otomatis diterbitkan ulang.

> Catatan: paket Hobby Vercel ditujukan untuk penggunaan pribadi non-komersial. Karena ini situs organisasi,
> periksa ketentuan terbarunya. Cloudflare Pages atau Netlify bekerja serupa untuk situs statis ini.

## Menyambungkan domain (IDCloudHost)

1. Di Vercel: *Project > Settings > Domains > Add* `mwcnupondokaren.or.id` (dan `www.mwcnupondokaren.or.id`).
2. Vercel menampilkan catatan DNS yang harus dibuat. **Pakai nilai yang ditampilkan Vercel.**
   Biasanya: record `A` untuk `@` dan `CNAME` untuk `www`.
3. Di panel IDCloudHost buka pengelolaan DNS domain, tambahkan/ubah catatan tersebut dan hapus catatan `A`/`CNAME`
   lama yang bentrok. Perubahan bisa butuh beberapa menit hingga beberapa jam. HTTPS dipasang otomatis oleh Vercel.

## CMS /admin

Semua isi situs yang berubah dari waktu ke waktu dikelola lewat **https://mwcnupondokaren.or.id/admin** (login Google).
Data disimpan di Supabase. Jika Supabase belum diisi atau tidak terjangkau, situs otomatis memakai data bawaan di `js/app.js`.

### Pemasangan (sekali saja)

1. **Proyek Supabase.** Buat proyek baru (Region: *Southeast Asia (Singapore)*). Catat *Project URL* dan kunci *anon / publishable* di *Project Settings > API*. Jangan pernah memakai `service_role` pada situs.
2. **Database dan sinkronisasi.** Buka *SQL Editor > New query*:
   - Untuk database baru: pastikan email Super Admin pada baris akhir `schema.sql` benar, jalankan `schema.sql`, lalu jalankan `seed.sql` satu kali untuk konten bawaan.
   - Untuk database lama: buat backup dulu, jalankan `schema.sql` yang baru. Migrasi mempertahankan tabel/konten dan mengubah `admin` → `super_admin`, `editor` → `pengurus`; jangan jalankan `seed.sql` di database lama karena seed hanya mengisi `site_settings` yang belum ada.
   - Skema baru membatasi RLS sesuai peran. Konten baru `created_by` otomatis dicatat. Untuk konten lama yang `created_by`-nya kosong, super admin perlu meninjau/migrasikan kepemilikan sebelum pengurus/jurnalis mengeditnya.
   - Jangan hapus tabel atau reset project saat sinkronisasi. Uji dulu pada project/staging sebelum produksi.
3. **Peran CMS.** `super_admin` mengelola semua data, konfigurasi dan staf. `pengurus` mengelola berita umum/laporan, agenda, video, galeri, kegiatan pilihan, dan majelis. `jurnalis` mengelola usulan kategori `Literasi` dan `Opini`, terlihat untuk tindak lanjut Pengurus sebelum terbit. `ustadz` hanya mengelola `Tanya Jawab Agama`. Batas izin juga diterapkan oleh RLS database.
4. **Login Google.** Batasi OAuth consent ke akun organisasi/pengguna yang diperlukan; akses `/admin` tetap ditolak bagi email yang belum tercatat di `staff`.
   - Google Cloud Console > *APIs & Services > Credentials > Create credentials > OAuth client ID* (Web application).
     *Authorized redirect URI*: `https://<PROJECT-REF>.supabase.co/auth/v1/callback`.
   - Atur status consent sesuai kebijakan organisasi. Jangan membuka login untuk semua akun bila tidak diperlukan; izin `/admin` tetap dibatasi daftar staf Supabase.
   - Supabase > *Authentication > Providers > Google*: aktifkan, tempel *Client ID* dan *Client Secret*.
   - Supabase > *Authentication > URL Configuration*: *Site URL* `https://mwcnupondokaren.or.id`; *Redirect URLs*:
     `https://mwcnupondokaren.or.id/admin` dan `http://localhost:8080/admin`.
5. **Konfigurasi situs.** Isi `supabaseUrl` dan `supabaseKey` pada `js/config.js`, atau atur pipeline deployment agar nilai tersebut disuntikkan ke berkas JS publik saat build. Ini situs statis tanpa build bawaan; environment variables saja tidak otomatis terbaca. `anon/publishable` key memang publik dan dibatasi RLS; jangan memasukkan `service_role` ke HTML/JS, hasil build, atau repository. Deploy versi baru setelah konfigurasi.
6. Buka `/admin`, klik *Masuk dengan Google*.

### Peran

| Peran | Boleh mengelola |
|---|---|
| **Super Admin** | Semua konten, pengaturan situs, struktur pengurus, ranting, banom, halaman, pengelola, dan riwayat |
| **Pengurus / Editor** | Berita umum/laporan, agenda, video TVNU, galeri, kegiatan pilihan, dan majelis taklim; dapat melihat/menindaklanjuti usulan Literasi/Opini |
| **Jurnalis** | Mengirim/mengelola draf Jurnal Literasi dan Opini untuk ditinjau Pengurus sebelum terbit |
| **Ustadz** | Tanya Jawab Agama |

Penambahan dan perubahan peran hanya dilakukan Super Admin di menu **Pengelola**. Super Admin terakhir tidak dapat dihapus
atau diturunkan. Semua perubahan tercatat di **Riwayat perubahan**.

### Yang bisa diedit

| Menu admin | Tampil di situs |
|---|---|
| Berita | Portal berita dan halaman baca |
| Agenda | Halaman Agenda dan kartu kegiatan terbaru |
| Video TVNU | Galeri video dan video terkait berita |
| Galeri Foto | Galeri foto |
| Kegiatan Pilihan | Kartu "Kegiatan Pilihan" di beranda |
| Majelis Taklim | Direktori majelis taklim |
| Tanya Jawab Agama | Tanya jawab di halaman Konsultasi Agama |
| Program & Layanan | Empat kartu di beranda dan halaman Layanan (ada pilihan tampil/sembunyi) |
| Program Khidmat | Halaman Program |
| Struktur Pengurus | Halaman Struktur Pengurus dan pimpinan inti |
| Ranting (PRNU) | Halaman Ranting |
| Badan Otonom | Kartu Badan Otonom di beranda |
| Halaman Statis | Isi halaman Sejarah, Visi & Misi, dan halaman detail banom |
| Kontak & Alamat | Nomor WhatsApp (semua tautan WA), email, alamat sekretariat |
| Media Sosial | Tautan Facebook, Instagram, TikTok, YouTube |
| Sambutan Ketua | Teks, nama, jabatan, dan foto sambutan |
| Hero Beranda | Judul hero dan empat foto slideshow |
| Kartu Anggota | Penandatangan dan gambar tanda tangan pada kartu |
| Rekening & QRIS | Rekening dan QRIS di halaman Zakat |
| Zakat (Harga Emas) | Nilai awal kalkulator zakat dan keterangan acuan |
| Identitas Organisasi | Keterangan SK dan slogan footer |

Belum ada di CMS (masih di kode): empat kartu keunggulan di beranda, kartu Jelajahi, daftar tautan footer,
teks ketentuan di belakang kartu anggota, dan teks bawaan halaman Ambulans/Zakat.

### Cara kerja

- Foto otomatis dikecilkan (maksimal 1600 px) dan diunggah ke bucket publik `media` di Supabase Storage. Pengurus/Jurnalis/Ustadz dapat mengunggah; penghapusan dan perubahan objek hanya Super Admin.
  Saat konten dihapus, file fotonya tidak ikut terhapus (bisa dibersihkan manual dari dashboard Supabase).
- **Terbitkan**: konten berstatus *Draf* tidak tampil di situs.
- **Urutan**: berita, agenda, dan video diurutkan otomatis berdasarkan tanggal. Jenis lain diurutkan dengan tombol naik/turun.
- **"Aktifkan pengelolaan"**: sebuah jenis konten baru dipakai situs setelah ditandai *dikelola*. `seed.sql` sudah menandai semuanya.
  Jenis yang belum dikelola tetap memakai data bawaan; yang dikelola tetapi dikosongkan akan tampil kosong.
- Pengunjung mengambil data terbaru setiap membuka situs. Jika Supabase tidak menjawab dalam 3 detik, situs memakai salinan terakhir di peramban, lalu data bawaan.

### Keamanan dan perawatan

- Keamanan sebenarnya ada pada aturan akses database (Row Level Security di `schema.sql`), bukan pada halaman admin.
  Publik hanya dapat membaca konten terbit; menulis hanya dapat dilakukan pengelola terdaftar sesuai perannya termasuk pembatasan kategori Literasi/Opini untuk Jurnalis.
- Kunci `anon` boleh publik. **Kunci `service_role` tidak boleh pernah masuk repositori.**
- Paket gratis Supabase menjeda proyek setelah sekitar seminggu tanpa aktivitas dan tidak menyediakan cadangan otomatis.
  Untuk pemakaian sungguhan, gunakan paket Pro, atau ekspor data secara berkala (*Database > Backups* atau `pg_dump`).
- Masalah umum: *"Akun belum terdaftar"* berarti email Google belum ada (atau tidak sama persis, huruf kecil) di menu Pengelola;
  *redirect_uri_mismatch* berarti alamat callback di Google Cloud belum sesuai; perubahan belum tampil di situs: muat ulang paksa
  (Ctrl+F5).

### Data bawaan (cadangan)

Data bawaan masih ada di `js/app.js` sebagai cadangan bila CMS belum terhubung. Cari: `var N=[` (berita), `var AG=[` (agenda),
`var V=[` (video), `var G=[` (galeri), `var LSV=[` (layanan), `var T=` (pengurus). Setelah CMS aktif, ubahlah lewat `/admin`.

## Kartu Anggota

- Halaman `#daftar`. Kartu digambar di browser (canvas) dan diekspor ke PDF (CR80 85,6 x 54 mm dan A4 siap potong) dan PNG.
  PDF dibuat oleh kode sendiri, tanpa library eksternal.
- Nomor induk: `MWC-<kode wilayah>-<YY>-<6 angka>-<angka cek>`. Kode wilayah `00` = MWCNU (kecamatan), `01`-`11` = PRNU kelurahan.
  Saat ini angka acak dibuat di browser; setelah basis data terhubung, nomor urut diberikan database.
- QR berisi `https://mwcnupondokaren.or.id/v/<nomor>`. Alamat ini **jangan diubah** setelah kartu dicetak.
- Masa berlaku: selamanya. Tanpa NIK pada kartu.

## Tahap berikutnya (rencana)

CMS sudah tersedia (di atas). Berikutnya, memakai Supabase yang sama dengan login Google:
- 2A: pendaftaran anggota tersimpan di database dan layar verifikasi pengurus (peran PRNU per kelurahan)
- 2B: masuk dengan Google, profil jamaah, kartu dari data tersimpan, nomor induk urut dari database
- 2C: kegiatan, pemindai absensi (kamera), verifikasi QR terhubung database
