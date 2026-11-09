-- =====================================================================
-- MWCNU Pondok Aren: DATA AWAL CMS (isi sama dengan situs saat ini)
-- Jalankan SETELAH schema.sql. Aman dijalankan ulang: jenis konten yang sudah ada isinya TIDAK ditimpa.
-- =====================================================================

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

do $$ begin if not exists (select 1 from public.content_items where type = 'pengurus') then
  insert into public.content_items (type, data, sort) values
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "Dr. K.H. Syuhada, M.A."}$mwc$::jsonb, 10),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "Drs. K.H. Syarief Muawan, M.Pd."}$mwc$::jsonb, 20),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "Dr. K.H. M. Sobron Zayyan, S.Q., M.A"}$mwc$::jsonb, 30),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "Dr. H. Edi Suharsongko, M.Pd."}$mwc$::jsonb, 40),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "K.H. Udan Maulana"}$mwc$::jsonb, 50),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "H. Abdul Azis Noor"}$mwc$::jsonb, 60),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "Dr. H. Budi Harsono, S.E., M.Si., CSP, CPM, CIISA"}$mwc$::jsonb, 70),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "K.H. M. Jamil, S.Q., M.Pd."}$mwc$::jsonb, 80),
    ('pengurus', $mwc${"bagian": "Mustasyar", "jabatan": "Mustasyar", "nama": "K.H. M. Soleh Ma'mun"}$mwc$::jsonb, 90),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Rois", "nama": "K.H. Mohommad Toha, S.Ag"}$mwc$::jsonb, 100),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Rois", "nama": "K.H. Irfan Zaini Abbas"}$mwc$::jsonb, 110),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Rois", "nama": "K.H. A. Misbah, S.Pd.I., M.Ag."}$mwc$::jsonb, 120),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Rois", "nama": "K. Sholeh Anas RJ"}$mwc$::jsonb, 130),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Katib", "nama": "KH. Abdul Ghofur, M.Pd."}$mwc$::jsonb, 140),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Katib", "nama": "M. Yusuf FHR, S.Sos."}$mwc$::jsonb, 150),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Katib", "nama": "Mustahdi, M.A."}$mwc$::jsonb, 160),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Katib", "nama": "Aprianif, Lc., M.A."}$mwc$::jsonb, 170),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "Wakil Katib", "nama": "Zakaria Muslim, S.Pd.I."}$mwc$::jsonb, 180),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Drs. H. Abdul Karim Jafar, MM."}$mwc$::jsonb, 190),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Drs. H. Naidin Fathullah"}$mwc$::jsonb, 200),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Dr. H. Usman Shofi"}$mwc$::jsonb, 210),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Drs. Ahmad Muhsin"}$mwc$::jsonb, 220),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Abdul Rohim Masduqi"}$mwc$::jsonb, 230),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Dr. H. Ahmad Rifa'i"}$mwc$::jsonb, 240),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "M. Irfansyah"}$mwc$::jsonb, 250),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "H. Imam Bajuri, S.Pd.I., M.Ag."}$mwc$::jsonb, 260),
    ('pengurus', $mwc${"bagian": "Syuriyah", "jabatan": "A'wan", "nama": "Zainudin, SQ."}$mwc$::jsonb, 270),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Ketua", "nama": "H. Fathur Rahman"}$mwc$::jsonb, 280),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Ketua", "nama": "Drs. K.H.M. Junaidi, M.Pd."}$mwc$::jsonb, 290),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Ketua", "nama": "Abdul Syukur, S.Q."}$mwc$::jsonb, 300),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Ketua", "nama": "K.H. Soewardi Warman, S.H., M.H."}$mwc$::jsonb, 310),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Ketua", "nama": "KH. M. Afif, M.Pd."}$mwc$::jsonb, 320),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Ketua", "nama": "Ahmad Sairin, S.Pd.I. K."}$mwc$::jsonb, 330),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Ketua", "nama": "Nasuha, S.Pd.I."}$mwc$::jsonb, 340),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Sekretaris", "nama": "Dr. (HC) Ruslani, M.M."}$mwc$::jsonb, 350),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Sekretaris", "nama": "Nurhadi, S.Pd.I., M.Pd."}$mwc$::jsonb, 360),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Sekretaris", "nama": "Suparman"}$mwc$::jsonb, 370),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Sekretaris", "nama": "Fahrial Hilal H."}$mwc$::jsonb, 380),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Sekretaris", "nama": "Kholili"}$mwc$::jsonb, 390),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Sekretaris", "nama": "K. Tamam Khaulani"}$mwc$::jsonb, 400),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Sekretaris", "nama": "Awaludin, S.Sos., M.Pd."}$mwc$::jsonb, 410),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Bendahara", "nama": "Ahmad Munir"}$mwc$::jsonb, 420),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Bendahara", "nama": "M. Rizki, S.Kom."}$mwc$::jsonb, 430),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Bendahara", "nama": "Handoko"}$mwc$::jsonb, 440),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Bendahara", "nama": "Muhidin"}$mwc$::jsonb, 450),
    ('pengurus', $mwc${"bagian": "Tanfidziyah", "jabatan": "Wakil Bendahara", "nama": "Gunawan, S.Pd.I."}$mwc$::jsonb, 460),
    ('pengurus', $mwc${"bagian": "Badan otonom", "jabatan": "Pemuda", "nama": "GP Ansor"}$mwc$::jsonb, 470),
    ('pengurus', $mwc${"bagian": "Badan otonom", "jabatan": "Perempuan muda", "nama": "Fatayat NU"}$mwc$::jsonb, 480),
    ('pengurus', $mwc${"bagian": "Badan otonom", "jabatan": "Pelajar putra", "nama": "IPNU"}$mwc$::jsonb, 490),
    ('pengurus', $mwc${"bagian": "Badan otonom", "jabatan": "Pelajar putri", "nama": "IPPNU"}$mwc$::jsonb, 500);
end if; end $$;

insert into public.site_settings (key, value) values
  ('kontak', $mwc${"alamat": "Jl. Garuda Raya No. 107A, Kel. Jurangmangu Timur, Kec. Pondok Aren, Kota Tangerang Selatan", "wa": "6285161033689", "wa_tampil": "0851-6103-3689", "email": "mwcnu.pdaren@gmail.com"}$mwc$::jsonb),
  ('medsos', $mwc${"facebook": "https://web.facebook.com/mwcnupdaren", "instagram": "https://www.instagram.com/mwcnupondokaren/", "tiktok": "https://www.tiktok.com/@mwcnupdaren", "youtube": "https://www.youtube.com/@TVNUPondokAren"}$mwc$::jsonb),
  ('sambutan', $mwc${"salam1": "Bismillahirrahmanirrahim", "salam2": "Assalamu’alaikum Warahmatullahi Wabarakatuh", "kutipan": "Selamat datang di laman resmi MWCNU Pondok Aren.", "isi": "Kehadiran media digital ini merupakan bagian dari ikhtiar kita bersama untuk membangun sarana **komunikasi, informasi, dan konsolidasi dakwah** Islam Ahlussunnah wal Jama'ah (Aswaja) An-Nahdliyah di wilayah Kecamatan Pondok Aren. Di era transformasi digital ini, NU harus hadir tidak hanya di tengah-tengah majelis taklim dan musholla, tetapi juga **aktif mengisi ruang-ruang publik digital** dengan narasi keislaman yang menyejukkan, ramah, dan memersatukan.", "penutup": "Wallahul Muwaffiq Ila Aqwamitthoriq, Wassalamau'alaikum Warahmatullahi Wabarakatuh.", "nama": "H. Fathur Rahman", "jabatan": "Ketua Tanfidziyah MWCNU Pondok Aren, masa khidmat 2025 sampai 2030", "foto": "/assets/img/img-03a293b8.webp"}$mwc$::jsonb),
  ('hero', $mwc${"baris1": "Merawat Tradisi.", "baris2": "Melayani Warga.", "slides": ["/assets/img/img-1a2f09f7.webp", "/assets/img/img-a40aafe9.webp", "/assets/img/img-5d1ae212.webp", "/assets/img/img-897feccb.webp"]}$mwc$::jsonb),
  ('kartu', $mwc${"pejabat": [{"j": "Rois Syuriyah", "n": "K.H. Mohommad Toha, S.Ag", "ttd": ""}, {"j": "Ketua Tanfidziyah", "n": "H. Fathur Rahman", "ttd": ""}]}$mwc$::jsonb),
  ('pay', $mwc${"banks": [], "qris": ""}$mwc$::jsonb),
  ('identitas', $mwc${"sk1": "SK PCNU Kota Tangerang Selatan No. 12/PC.01/A.II.01.03/1208/06/2025", "sk2": "Ditetapkan 28 Mei 2025", "sk3": "Berlaku sampai 28 Mei 2030", "slogan": "Tradisi, Harmoni, Masa Depan"}$mwc$::jsonb),
  ('zakat', $mwc${"harga_emas": "2574000", "acuan": "Antam (Logam Mulia) per 13 Okt 2026"}$mwc$::jsonb),
  ('managed', $mwc${"berita": true, "agenda": true, "video": true, "galeri": true, "kegiatan": true, "layanan": true, "program": true, "ranting": true, "banom": true, "pengurus": true, "majelis": true, "tanya_jawab": true, "halaman": true}$mwc$::jsonb)
on conflict (key) do nothing;
