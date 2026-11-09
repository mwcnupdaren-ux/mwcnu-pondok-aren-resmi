
-- =====================================================================
-- MWCNU Pondok Aren: DATA AWAL CMS — BAGIAN 2 dari 2 (LANJUTAN)
-- Jalankan setelah seed-1.sql. Isi: pengurus, majelis,
-- tanya jawab, halaman statis, dan site_settings.
-- =====================================================================

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
  ('sambutan', $mwc${"salam1": "Bismillahirrahmanirrahim", "salam2": "Assalamuâ€™alaikum Warahmatullahi Wabarakatuh", "kutipan": "Selamat datang di laman resmi MWCNU Pondok Aren.", "isi": "Kehadiran media digital ini merupakan bagian dari ikhtiar kita bersama untuk membangun sarana **komunikasi, informasi, dan konsolidasi dakwah** Islam Ahlussunnah wal Jama'ah (Aswaja) An-Nahdliyah di wilayah Kecamatan Pondok Aren. Di era transformasi digital ini, NU harus hadir tidak hanya di tengah-tengah majelis taklim dan musholla, tetapi juga **aktif mengisi ruang-ruang publik digital** dengan narasi keislaman yang menyejukkan, ramah, dan memersatukan.", "penutup": "Wallahul Muwaffiq Ila Aqwamitthoriq, Wassalamau'alaikum Warahmatullahi Wabarakatuh.", "nama": "H. Fathur Rahman", "jabatan": "Ketua Tanfidziyah MWCNU Pondok Aren, masa khidmat 2025 sampai 2030", "foto": "/assets/img/img-03a293b8.webp"}$mwc$::jsonb),
  ('hero', $mwc${"baris1": "Merawat Tradisi.", "baris2": "Melayani Warga.", "slides": ["/assets/img/img-1a2f09f7.webp", "/assets/img/img-a40aafe9.webp", "/assets/img/img-5d1ae212.webp", "/assets/img/img-897feccb.webp"]}$mwc$::jsonb),
  ('kartu', $mwc${"pejabat": [{"j": "Rois Syuriyah", "n": "K.H. Mohommad Toha, S.Ag", "ttd": ""}, {"j": "Ketua Tanfidziyah", "n": "H. Fathur Rahman", "ttd": ""}]}$mwc$::jsonb),
  ('pay', $mwc${"banks": [], "qris": ""}$mwc$::jsonb),
  ('identitas', $mwc${"sk1": "SK PCNU Kota Tangerang Selatan No. 12/PC.01/A.II.01.03/1208/06/2025", "sk2": "Ditetapkan 28 Mei 2025", "sk3": "Berlaku sampai 28 Mei 2030", "slogan": "Tradisi, Harmoni, Masa Depan"}$mwc$::jsonb),
  ('zakat', $mwc${"harga_emas": "2574000", "acuan": "Antam (Logam Mulia) per 13 Okt 2026"}$mwc$::jsonb),
  ('managed', $mwc${"berita": true, "agenda": true, "video": true, "galeri": true, "kegiatan": true, "layanan": true, "program": true, "ranting": true, "banom": true, "pengurus": true, "majelis": true, "tanya_jawab": true, "halaman": true}$mwc$::jsonb)
on conflict (key) do nothing;

-- â”€â”€ 10) Sinkronisasi isi publik â†” CMS (field terbaru) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Hero: teks pengantar dpt diganti dari CMS
update public.site_settings
set value = value || '{"keterangan":"Majelis Wakil Cabang Nahdlatul Ulama Kecamatan Pondok Aren, Kota Tangerang Selatan. Satu rumah bagi dakwah Aswaja An-Nahdliyah, penguatan ranting di 11 kelurahan, dan khidmat keumatan di tingkat kecamatan."}'::jsonb
where key = 'hero';

-- Identitas: judul + deskripsi pengantar beranda
update public.site_settings
set value = value || '{"org_judul":"Satu rumah bagi dakwah dan penguatan ranting.","org_deskripsi":"MWCNU Kecamatan Pondok Aren merawat dakwah Aswaja An-Nahdliyah, menguatkan ranting di 11 kelurahan, dan menghadirkan khidmat keumatan bersama warga."}'::jsonb
where key = 'identitas';

-- Tipografi global (standar penulisan)
insert into public.site_settings (key, value) values
  ('tipografi', $mwc${"font_judul": "Plus Jakarta Sans", "font_isi": "Inter", "ukuran_isi": 16, "jarak_baris": 1.75, "dropcap": false}$mwc$::jsonb)
on conflict (key) do nothing;

-- Berita: penulis default + tag/sorotan artikel pertama
update public.content_items
set data = data || jsonb_build_object('penulis', 'Redaksi MWCNU Pondok Aren')
where type = 'berita';

update public.content_items
set data = data || jsonb_build_object('tag', 'Halal Bi Halal, Pondok Aren', 'featured', true)
where type = 'berita' and data ->> 'judul' like 'Halal Bi Halal%';

-- â”€â”€ 11) Majelis, tanya jawab, halaman statis (dari isi publik) â”€
do $$ begin if not exists (select 1 from public.content_items where type = 'majelis') then
  insert into public.content_items (type, data, sort) values
    ('majelis', $mwc${"nama": "Majelis Taklim Annur", "asuh": "Ust. Aprianif, Lc.", "hari": "Kamis", "jam": "19.45", "tempat": "Jl. Wisma Tajur RT 02/RW 010 No. 20, Kel. Pondok Kacang Barat", "ranting": "Pondok Kacang Barat", "hp": ""}$mwc$::jsonb, 10),
    ('majelis', $mwc${"nama": "Majelis Taklim Baiturrahim", "asuh": "Ust. Ma'mun Murod", "hari": "Ahad", "jam": "09.00", "tempat": "Masjid Baiturrahim, Pondok Karya", "ranting": "Pondok Karya", "hp": ""}$mwc$::jsonb, 20),
    ('majelis', $mwc${"nama": "Majelis Taklim Fastabiqul Khairat", "asuh": "Ust. Nasuha, S.Pd.I", "hari": "Senin", "jam": "19.30", "tempat": "Musholla Al-Munibin, Pondok Pucung", "ranting": "Pondok Pucung", "hp": ""}$mwc$::jsonb, 30);
end if; end $$;

do $$ begin if not exists (select 1 from public.content_items where type = 'tanya_jawab') then
  insert into public.content_items (type, data, sort) values
    ('tanya_jawab', $mwc${"k": "Amaliyah NU", "q": "Bagaimana hukum melaksanakan tahlil di rumah orang meninggal?", "a": "Tahlil dan yasin adalah amaliah yang masyhur di NU. Hukumnya boleh dan bernilai ibadah bila tidak melanggar syariat, serta dianjurkan menjaga adab dan niat ikhlas."}$mwc$::jsonb, 10),
    ('tanya_jawab', $mwc${"k": "Ibadah", "q": "Kapan batas waktu mengqadha shalat?", "a": "Shalat yang terlewat wajib diqadha sesegera mungkin tanpa menunda lebih dari kewajiban. Bila lupa atau tertidur, shalatlah segera setelah ingat. Konsultasikan hal khusus dengan ustadz di majelis ranting Anda."}$mwc$::jsonb, 20);
end if; end $$;

do $$ begin if not exists (select 1 from public.content_items where type = 'halaman') then
  insert into public.content_items (type, data, sort) values
    ('halaman', $mwc${"slug": "sejarah", "judul": "Sejarah MWCNU Pondok Aren", "isi": "## Sejarah Singkat\nMWCNU Pondok Aren adalah Majelis Wakil Cabang Nahdlatul Ulama di Kecamatan Pondok Aren, Kota Tangerang Selatan.\n\n## Khidmat\nMWCNU bertugas membina ranting di 11 kelurahan dan badan otonom NU di tingkat kecamatan."}$mwc$::jsonb, 10),
    ('halaman', $mwc${"slug": "visi", "judul": "Visi & Misi", "isi": "## Visi\nTerwujudnya masyarakat muslim Pondok Aren yang beriman, berilmu, dan berakhlak Aswaja An-Nahdliyah.\n\n## Misi\n- Membina ranting dan badan otonom\n- Menguatkan dakwah dan pendidikan\n- Memberdayakan ekonomi umat"}$mwc$::jsonb, 20),
    ('halaman', $mwc${"slug": "banom-gpansor", "judul": "GP Ansor Pondok Aren", "isi": "Gerakan Pemuda Ansor di Pondok Aren bergerak dalam pemberdayaan, keamanan, dan pengabdian masyarakat."}$mwc$::jsonb, 30),
    ('halaman', $mwc${"slug": "banom-fatayat", "judul": "Fatayat NU Pondok Aren", "isi": "Fatayat NU di Pondok Aren bergerak untuk dakwah dan pemberdayaan keluarga."}$mwc$::jsonb, 40),
    ('halaman', $mwc${"slug": "banom-ipnu", "judul": "IPNU Pondok Aren", "isi": "IPNU membina pelajar putra untuk karakter dan kepemimpinan."}$mwc$::jsonb, 50),
    ('halaman', $mwc${"slug": "banom-ippnu", "judul": "IPPNU Pondok Aren", "isi": "IPPNU membina pelajar putri untuk dakwah, pendidikan, dan pengembangan diri."}$mwc$::jsonb, 60);
end if; end $$;
