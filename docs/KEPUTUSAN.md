# Catatan keputusan

## Identitas
- Gelar Ketua Tanfidziyah: **H. Fathur Rahman** (mengikuti SK). Rois Syuriyah: K.H. Mohommad Toha, S.Ag (ejaan sesuai SK).
- SK: 12/PC.01/A.II.01.03/1208/06/2025, ditetapkan 28 Mei 2025, berakhir 28 Mei 2030.
- Slogan: Tradisi, Harmoni, Masa Depan.

## Struktur halaman
- Lembaga tingkat MWC ditiadakan (sesuai peraturan PBNU); halaman dan menunya dihapus.
- Zakat melalui UPZ; infaq dan sedekah melalui MWCNU.
- Layanan Kesehatan dan Beasiswa & Pendidikan disembunyikan (data di `LSV_HIDDEN`).
- Menu header: Beranda, Profil, Berita, Program & Layanan, Kontak. Badan Otonom dan Ranting hanya di bagian Jelajahi.

## Kartu Anggota
- Nama: Kartu Anggota MWCNU Pondok Aren (kartu lokal, model data dan tanda tangan mirip KARTANU, desain berbeda).
- Tanda tangan: Rois Syuriyah dan Ketua Tanfidziyah (gambar belum diterima).
- Wadah Khidmah: MWCNU, Jama'ah, GP Ansor, Fatayat NU, IPNU, IPPNU.
- Asal: MWCNU (Kecamatan Pondok Aren, otomatis) atau PRNU (pilih kelurahan).
- Nomor induk otomatis; masa berlaku selamanya; tanpa NIK.
- QR multifungsi: verifikasi, absensi kegiatan, akses layanan. Alamat: `/v/<nomor>`.

## Teknologi
- Domain di IDCloudHost, kode di GitHub, deploy di Vercel.
- Backend: Supabase (gratis saat pengembangan, paket Pro saat dipakai warga; paket gratis dijeda setelah seminggu tanpa aktivitas).
- Login: Google saja. Pemilik semua layanan: akun organisasi, bukan pribadi.
- Peran: jamaah, pengurus PRNU (verifikasi kelurahannya), admin MWC, petugas absensi.
- Privasi: persetujuan eksplisit (UU PDP), data minimal, foto privat, tampilan publik QR hanya nama, wilayah, status.

## CMS /admin
- Backend: Supabase (Postgres + Storage + login Google). Pemilik layanan: akun organisasi.
- Peran: Admin (semua) dan Editor (berita, agenda, video, galeri, kegiatan pilihan, majelis, tanya jawab).
- Konten "dikelola" memakai data database; yang belum dikelola memakai data bawaan di app.js. seed.sql menandai semuanya dikelola.
- Foto: dikecilkan di peramban (maks 1600 px), disimpan di bucket publik `media`.
- Nomor WhatsApp, email, alamat, dan tautan medsos diganti di seluruh situs dari satu tempat (Kontak & Alamat, Media Sosial).
- Tanda tangan kartu (Rois dan Ketua) diunggah lewat menu Kartu Anggota.
- Admin pertama: mwcnu.pdaren@gmail.com (akun Google organisasi, sama dengan email di situs).
