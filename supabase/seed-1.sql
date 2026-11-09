-- =====================================================================
-- MWCNU Pondok Aren: DATA AWAL CMS — BAGIAN 1 dari 2
-- Jalankan SETELAH schema.sql. Aman dijalankan ulang.
-- BAGIAN 1: berita, agenda, video, galeri, kegiatan, layanan,
-- program, ranting, banom. Lanjutkan dengan seed-2.sql.
-- =====================================================================
-- Pastikan kolom trigger ada SEBELUM isi (anti error created_by)
alter table public.content_items add column if not exists created_by text;
alter table public.content_items add column if not exists updated_by text;
alter table public.site_settings add column if not exists updated_by text;
do $$ begin if not exists (select 1 from public.content_items where type = 'berita') then
  insert into public.content_items (type, data, sort) values
    ('berita', $mwc${"kategori": "Berita", "judul": "Halal Bi Halal Keluarga Besar NU Pondok Aren Angkat Tema Membumikan Dakwah dan Menguatkan Ranting", "tanggal": "2026-04-26", "ringkasan": "Silaturahmi keluarga besar NU Kecamatan Pondok Aren di Omah Singgah NU Alfath.", "foto": "/assets/img/img-1a2f09f7.webp", "lead": "Keluarga Besar Nahdlatul Ulama Kecamatan Pondok Aren menggelar Halal Bi Halal bertema Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi.", "caption": "Halal Bi Halal Keluarga Besar NU Kecamatan Pondok Aren di Omah Singgah NU Alfath. (Dokumentasi MWCNU Pondok Aren)", "isi": "Keluarga Besar Nahdlatul Ulama Kecamatan Pondok Aren menggelar Halal Bi Halal di Omah Singgah NU Alfath pada 8 Dzulqa'dah 1447 H atau bertepatan dengan 26 April 2026 M. Kegiatan ini mengusung tema Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi.\n\nSpanduk kegiatan memuat identitas pengurus ranting NU dari sebelas kelurahan di Pondok Aren.\n\nRangkaian kegiatan didokumentasikan oleh Media Center NU Pondok Aren dan tayang di kanal TVNU Pondok Aren, termasuk laporan ketua panitia mengenai target pembentukan anak ranting NU se-Pondok Aren.", "info": "Tanggal: 8 Dzulqa'dah 1447 H / 26 April 2026 M\nTempat: Omah Singgah NU Alfath\nTema: Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi", "foto_tambahan": ["/assets/img/img-1a2f09f7.webp", "/assets/img/img-5d1ae212.webp", "/assets/img/img-6d655717.webp", "/assets/img/img-ffb9a380.webp"], "video": "ZDuEPPinBTA"}$mwc$::jsonb, 10),
    ('berita', $mwc${"kategori": "Berita", "judul": "MWCNU Pondok Aren Gelar Lailatul Ijtima' dan Tawaqufan di Pondok Kacang Barat", "tanggal": "2026-02-07", "ringkasan": "Pengajian malam bersama pengurus MWCNU dan ranting di Majelis Taklim Annur.", "foto": "/assets/img/img-897feccb.webp", "lead": "Pengajian malam bersama pengurus MWCNU Pondok Aren dan ranting digelar di Majelis Taklim Annur, Pondok Kacang Barat.", "caption": "Lailatul Ijtima' dan Tawaqufan di Majelis Taklim Annur, Pondok Kacang Barat. (Dokumentasi MWCNU Pondok Aren)", "isi": "Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren bersama Pengurus Ranting NU (PRNU) Pondok Kacang Barat menggelar Lailatul Ijtima' dan Tawaqufan pada 7 Februari 2026 di Majelis Taklim Annur, Jl. Wisma Tajur RT 02 RW 010 No. 20, Kelurahan Pondok Kacang Barat.\n\nKegiatan berlangsung pukul 19.45 sampai 23.00 WIB dengan rangkaian acara pembukaan, yasin dan tahlil, pengajian Aswaja, doa penutup, dan ramah tamah.\n\nDokumentasi kegiatan tersedia di galeri foto laman ini.", "info": "Tanggal: 7 Februari 2026\nWaktu: 19.45 sampai 23.00 WIB\nTempat: Majelis Taklim Annur, Jl. Wisma Tajur RT 02 RW 010 No. 20, Kel. Pondok Kacang Barat", "foto_tambahan": ["/assets/img/img-a40aafe9.webp", "/assets/img/img-897feccb.webp", "/assets/img/img-6e2f9266.webp", "/assets/img/img-da3baea3.webp"], "video": ""}$mwc$::jsonb, 20),
    ('berita', $mwc${"kategori": "Laporan", "judul": "Launching QRIS, MWCNU Pondok Aren Melangkah Maju dari Koin NU", "tanggal": "2025-07-07", "ringkasan": "Peluncuran QRIS sebagai langkah lanjutan program Koin NU.", "foto": "", "lead": "Peluncuran QRIS menjadi langkah maju dari program Koin NU di Pondok Aren.", "caption": "", "isi": "Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren meluncurkan QRIS sebagai langkah maju dari program Koin NU.\n\nDokumentasi peluncuran tayang di kanal TVNU Pondok Aren pada 7 Juli 2025.", "info": "", "foto_tambahan": [], "video": "-Yb3fhDJiIU"}$mwc$::jsonb, 30),
    ('berita', $mwc${"kategori": "Laporan", "judul": "Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur", "tanggal": "2024-09-05", "ringkasan": "Kunjungan pengurus MWCNU ke ranting dalam kegiatan Turba.", "foto": "", "lead": "Pengurus MWCNU Pondok Aren mengunjungi ranting dalam kegiatan Turba.", "caption": "", "isi": "Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren melaksanakan Turba di Pengurus Ranting NU (PRNU) Jurangmangu Timur.\n\nDokumentasi kegiatan tayang di kanal TVNU Pondok Aren pada 5 September 2024.", "info": "", "foto_tambahan": [], "video": "_GaNDmYqaL8"}$mwc$::jsonb, 40);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'agenda') then
  insert into public.content_items (type, data, sort) values
    ('agenda', $mwc${"tanggal": "2026-09-15", "judul": "Lailatul Ijtima' di PRNU Pondok Karya", "kategori": "Lailatul Ijtima'", "lokasi": "Masjid Baiturrahim, Pondok Karya"}$mwc$::jsonb, 10),
    ('agenda', $mwc${"tanggal": "2026-09-09", "judul": "Rapat Harian Tanfidziyah", "kategori": "Rapat", "lokasi": "Omah Singgah NU Alfath"}$mwc$::jsonb, 20),
    ('agenda', $mwc${"tanggal": "2026-09-22", "judul": "Turba MWCNU Pondok Aren di PRNU Pondok Pucung", "kategori": "Turba", "lokasi": "Yayasan Islam Jam'iyyah Al-Munibin, Kel. Pondok Pucung"}$mwc$::jsonb, 30);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'video') then
  insert into public.content_items (type, data, sort) values
    ('video', $mwc${"youtube": "yTL2DYeYviA", "judul": "Halal Bihalal: Tradisi Khas Indonesia yang Lahir dari Pemikiran Para Ulama NU", "tanggal": "2026-05-01"}$mwc$::jsonb, 10),
    ('video', $mwc${"youtube": "MIhHbzD3RGk", "judul": "Nahdlatul Ulama Tetap Relevan: Bagaimana Mereka Seimbangkan Tradisi dan Modernitas?", "tanggal": "2026-04-29"}$mwc$::jsonb, 20),
    ('video', $mwc${"youtube": "ZDuEPPinBTA", "judul": "Target Pembentukan Anak Ranting NU Se-Pondok Aren | Laporan Ketua Panitia HBH 2026", "tanggal": "2026-04-29"}$mwc$::jsonb, 30),
    ('video', $mwc${"youtube": "iSc-NZLsOrY", "judul": "Lahirnya Kebangkitan Ulama - DR. KH. Manarul Hidayat, MA.", "tanggal": "2025-07-08"}$mwc$::jsonb, 40),
    ('video', $mwc${"youtube": "-Yb3fhDJiIU", "judul": "Louncing QRIS | MWCNU Pondok Aren Langkah Maju dari Koin NU", "tanggal": "2025-07-07"}$mwc$::jsonb, 50),
    ('video', $mwc${"youtube": "_GaNDmYqaL8", "judul": "Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur", "tanggal": "2024-09-05"}$mwc$::jsonb, 60);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'galeri') then
  insert into public.content_items (type, data, sort) values
    ('galeri', $mwc${"judul": "Halal Bi Halal di Omah Singgah NU Alfath", "foto": "/assets/img/img-1a2f09f7.webp", "kegiatan": "Halal Bi Halal"}$mwc$::jsonb, 10),
    ('galeri', $mwc${"judul": "Sambutan di Lailatul Ijtima'", "foto": "/assets/img/img-897feccb.webp", "kegiatan": "Lailatul Ijtima'"}$mwc$::jsonb, 20),
    ('galeri', $mwc${"judul": "Sambutan pada Halal Bi Halal", "foto": "/assets/img/img-5d1ae212.webp", "kegiatan": "Halal Bi Halal"}$mwc$::jsonb, 30),
    ('galeri', $mwc${"judul": "Sambutan di Pondok Kacang Barat", "foto": "/assets/img/img-6e2f9266.webp", "kegiatan": "Lailatul Ijtima'"}$mwc$::jsonb, 40),
    ('galeri', $mwc${"judul": "Lailatul Ijtima' di Pondok Kacang Barat", "foto": "/assets/img/img-a40aafe9.webp", "kegiatan": "Lailatul Ijtima'"}$mwc$::jsonb, 50),
    ('galeri', $mwc${"judul": "Pengurus dan tamu undangan", "foto": "/assets/img/img-6d655717.webp", "kegiatan": "Halal Bi Halal"}$mwc$::jsonb, 60),
    ('galeri', $mwc${"judul": "Rangkaian acara Halal Bi Halal", "foto": "/assets/img/img-ffb9a380.webp", "kegiatan": "Halal Bi Halal"}$mwc$::jsonb, 70),
    ('galeri', $mwc${"judul": "Rangkaian acara Lailatul Ijtima'", "foto": "/assets/img/img-da3baea3.webp", "kegiatan": "Lailatul Ijtima'"}$mwc$::jsonb, 80);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'kegiatan') then
  insert into public.content_items (type, data, sort) values
    ('kegiatan', $mwc${"foto": "/assets/img/img-1a2f09f7.webp", "judul": "Halal Bi Halal", "lokasi": "Omah Singgah NU Alfath", "tanggal": "26 Apr 2026"}$mwc$::jsonb, 10),
    ('kegiatan', $mwc${"foto": "/assets/img/img-a40aafe9.webp", "judul": "Lailatul Ijtima'", "lokasi": "PRNU Pondok Kacang Barat", "tanggal": "7 Feb 2026"}$mwc$::jsonb, 20),
    ('kegiatan', $mwc${"foto": "/assets/img/img-6d655717.webp", "judul": "Silaturahmi pengurus", "lokasi": "Halal Bi Halal keluarga besar NU", "tanggal": "26 Apr 2026"}$mwc$::jsonb, 30),
    ('kegiatan', $mwc${"foto": "/assets/img/img-da3baea3.webp", "judul": "Rangkaian acara", "lokasi": "Majelis Taklim Annur", "tanggal": "7 Feb 2026"}$mwc$::jsonb, 40);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'layanan') then
  insert into public.content_items (type, data, sort) values
    ('layanan', $mwc${"judul": "Ambulans 24/7", "deskripsi": "Layanan ambulans gratis untuk warga NU Pondok Aren", "ikon": "ambulans", "tautan": "#ambulans", "tampil": true}$mwc$::jsonb, 10),
    ('layanan', $mwc${"judul": "UPZ & Infaq", "deskripsi": "Zakat melalui UPZ, infaq dan sedekah melalui MWCNU", "ikon": "zakat", "tautan": "#zis", "tampil": true}$mwc$::jsonb, 20),
    ('layanan', $mwc${"judul": "Majelis Taklim", "deskripsi": "Pengajian rutin dan edukasi keagamaan", "ikon": "majelis", "tautan": "#majelis", "tampil": true}$mwc$::jsonb, 30),
    ('layanan', $mwc${"judul": "Konsultasi Agama", "deskripsi": "Tanya jawab dan konsultasi keagamaan", "ikon": "konsultasi", "tautan": "#konsultasi", "tampil": true}$mwc$::jsonb, 40),
    ('layanan', $mwc${"judul": "Beasiswa & Pendidikan", "deskripsi": "Program beasiswa dan pendidikan anak", "ikon": "beasiswa", "tautan": "#layanan", "tampil": false}$mwc$::jsonb, 50),
    ('layanan', $mwc${"judul": "Layanan Kesehatan", "deskripsi": "Pemeriksaan kesehatan dan layanan medis", "ikon": "kesehatan", "tautan": "#layanan", "tampil": false}$mwc$::jsonb, 60);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'program') then
  insert into public.content_items (type, data, sort) values
    ('program', $mwc${"judul": "Dakwah dan pengajian Aswaja", "deskripsi": "Majelis rutin yang menguatkan amaliyah Ahlussunnah wal Jama'ah An-Nahdliyah bersama warga.", "kegiatan": "Lailatul Ijtima'\nYasin dan tahlil\nPengajian Aswaja\nDoa penutup", "tombol": "Lihat kabar kegiatan", "tautan": "#berita"}$mwc$::jsonb, 10),
    ('program', $mwc${"judul": "Penguatan ranting", "deskripsi": "Pendampingan dan konsolidasi pengurus ranting di 11 kelurahan se-Pondok Aren.", "kegiatan": "Tawaqufan di ranting\nSilaturahmi pengurus dan ranting\n11 PRNU", "tombol": "Lihat daftar ranting", "tautan": "#ranting"}$mwc$::jsonb, 20),
    ('program', $mwc${"judul": "Media dan dakwah digital", "deskripsi": "Informasi dan narasi keislaman yang menyejukkan, ramah, dan memersatukan di ruang digital.", "kegiatan": "Media Center NU Pondok Aren\nTVNU Pondok Aren\nNUPA Media", "tombol": "Lihat TVNU Pondok Aren", "tautan": "#video"}$mwc$::jsonb, 30),
    ('program', $mwc${"judul": "Silaturahmi dan tradisi", "deskripsi": "Pertemuan keluarga besar NU untuk merawat kebersamaan dan menjaga tradisi.", "kegiatan": "Halal Bi Halal keluarga besar NU\nRamah tamah", "tombol": "Lihat galeri", "tautan": "#galeri"}$mwc$::jsonb, 40),
    ('program', $mwc${"judul": "Badan otonom", "deskripsi": "Kaderisasi dan gerakan bersama badan otonom di tingkat kecamatan.", "kegiatan": "GP Ansor\nFatayat NU\nIPNU\nIPPNU", "tombol": "Lihat badan otonom", "tautan": "#struktur"}$mwc$::jsonb, 50);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'ranting') then
  insert into public.content_items (type, data, sort) values
    ('ranting', $mwc${"kelurahan": "Pondok Aren", "ketua": "Ust. Zakariaa"}$mwc$::jsonb, 10),
    ('ranting', $mwc${"kelurahan": "Jurangmangu Barat", "ketua": "Ust. Muhammad Ikhwan, S.Pd.I"}$mwc$::jsonb, 20),
    ('ranting', $mwc${"kelurahan": "Jurangmangu Timur", "ketua": "Ust. Chairul Anam"}$mwc$::jsonb, 30),
    ('ranting', $mwc${"kelurahan": "Pondok Betung", "ketua": "Ust. Abdullah Yunus"}$mwc$::jsonb, 40),
    ('ranting', $mwc${"kelurahan": "Pondok Karya", "ketua": "Ust. Ma'mun Murod"}$mwc$::jsonb, 50),
    ('ranting', $mwc${"kelurahan": "Pondok Jaya", "ketua": "Ust. Ali Ikhwan"}$mwc$::jsonb, 60),
    ('ranting', $mwc${"kelurahan": "Pondok Pucung", "ketua": "Ust. Nasuha, S.Pd.I"}$mwc$::jsonb, 70),
    ('ranting', $mwc${"kelurahan": "Pondok Kacang Barat", "ketua": "Ust. Aprianif, Lc."}$mwc$::jsonb, 80),
    ('ranting', $mwc${"kelurahan": "Pondok Kacang Timur", "ketua": "Ust. Suwardi"}$mwc$::jsonb, 90),
    ('ranting', $mwc${"kelurahan": "Parigi Baru", "ketua": "Ust. Adih"}$mwc$::jsonb, 100),
    ('ranting', $mwc${"kelurahan": "Parigi Lama", "ketua": "Ust. Muhammad Ismi"}$mwc$::jsonb, 110);
end if; end $$;
do $$ begin if not exists (select 1 from public.content_items where type = 'banom') then
  insert into public.content_items (type, data, sort) values
    ('banom', $mwc${"nama": "GP Ansor", "nama_lengkap": "Gerakan Pemuda Ansor", "deskripsi": "Organisasi kepemudaan untuk pemberdayaan, keamanan, dan pengabdian masyarakat", "monogram": "GA", "warna": "#1B7A4A"}$mwc$::jsonb, 10),
    ('banom', $mwc${"nama": "Fatayat NU", "nama_lengkap": "Fatayat Nahdlatul Ulama", "deskripsi": "Organisasi perempuan muda untuk dakwah dan pemberdayaan keluarga", "monogram": "FN", "warna": "#C2185B"}$mwc$::jsonb, 20),
    ('banom', $mwc${"nama": "IPNU", "nama_lengkap": "Ikatan Pelajar Nahdlatul Ulama", "deskripsi": "Organisasi pelajar putra untuk pembinaan karakter dan kepemimpinan", "monogram": "IP", "warna": "#1565C0"}$mwc$::jsonb, 30),
    ('banom', $mwc${"nama": "IPPNU", "nama_lengkap": "Ikatan Pelajar Putri Nahdlatul Ulama", "deskripsi": "Organisasi pelajar putri untuk dakwah, pendidikan, dan pengembangan diri", "monogram": "PP", "warna": "#7B1FA2"}$mwc$::jsonb, 40);
end if; end $$;
