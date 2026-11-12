-- ============================================================
-- SEED: Direktori pengurus MWCNU Pondok Aren — masa khidmat 2025–2030
-- Tanggal: 2026-11-12
--
-- SUMBER DATA: daftar pengurus yang SUDAH TAYANG di halaman
-- #struktur situs (js/app.js, objek T). Tidak ada nama baru,
-- tidak ada data fiktif — ini pemindahan data publik existing
-- ke tabel direktori agar bisa dikelola lewat panel admin.
--
-- SYARAT: jalankan SETELAH supabase/direktori-organisasi.sql.
-- SIFAT: idempotent (aman dijalankan ulang; konflik diabaikan).
--
-- CATATAN PEMETAAN
--   • Mustasyar ditampilkan sebagai jabatan di unit Syuriyah
--     (sesuai lingkup dewan mustasyar), bukan unit tersendiri.
--   • Foto & bio dikosongkan (NULL) — inisial otomatis dipakai UI.
--   • linked_staff_email NULL: tidak ada akun yang ditautkan.
--   • 4 badan otonom + Pagar Nusa di-seed sebagai unit struktural
--     (kind banom) tanpa orang.
-- ============================================================

-- 1) Masa khidmat aktif
insert into public.organizational_terms (label, starts_on, ends_on, is_current)
values ('2025–2030', '2025-05-28', '2030-05-28', true)
on conflict (label) do nothing;

-- 2) Badan otonom (unit struktural, tanpa orang)
insert into public.organizational_units (code, name, kind, parent_id, sort_order)
select v.code, v.name, 'banom', m.id, v.sort_order
from (values
  ('banom-gp-ansor', 'Gerakan Pemuda Ansor', 'banom', 'GP Ansor', 40),
  ('banom-fatayat', 'Fatayat Nahdlatul Ulama', 'banom', 'Fatayat NU', 40),
  ('banom-ipnu', 'Ikatan Pelajar Nahdlatul Ulama', 'banom', 'IPNU', 40),
  ('banom-ippnu', 'Ikatan Pelajar Putri Nahdlatul Ulama', 'banom', 'IPPNU', 40),
  ('banom-pagar-nusa', 'Pencak Silat Nahdlatul Ulama Pagar Nusa', 'banom', 'Pagar Nusa', 40)
) as v(code, name, kind, label, sort_order)
join public.organizational_units m on m.code = 'mwc'
on conflict (code) do nothing;

-- 3) Jabatan per unit
insert into public.organizational_positions (unit_id, name, rank)
select u.id, v.nama, v.rank
from (values
  ('syuriyah', 'Mustasyar', 0),
  ('syuriyah', 'Rois', 1),
  ('syuriyah', 'Wakil Rois', 2),
  ('syuriyah', 'Katib', 3),
  ('syuriyah', 'Wakil Katib', 4),
  ('syuriyah', 'A''wan', 5),
  ('tanfidziyah', 'Ketua', 1),
  ('tanfidziyah', 'Wakil Ketua', 2),
  ('tanfidziyah', 'Sekretaris', 3),
  ('tanfidziyah', 'Wakil Sekretaris', 4),
  ('tanfidziyah', 'Bendahara', 5),
  ('tanfidziyah', 'Wakil Bendahara', 6)
) as v(unit_code, nama, rank)
join public.organizational_units u on u.code = v.unit_code
on conflict (unit_id, name) do nothing;

-- 4) Profil publik pengurus (46 orang)
insert into public.organizational_profiles (slug, full_name, is_public)
select v.slug, v.full_name, true
from (values
  ('syuhada', 'Dr. K.H. Syuhada, M.A.'),
  ('syarief-muawan', 'Drs. K.H. Syarief Muawan, M.Pd.'),
  ('sobron-zayyan', 'Dr. K.H. M. Sobron Zayyan, S.Q., M.A'),
  ('edi-suharsongko', 'Dr. H. Edi Suharsongko, M.Pd.'),
  ('udan-maulana', 'K.H. Udan Maulana'),
  ('abdul-azis-noor', 'H. Abdul Azis Noor'),
  ('budi-harsono-e', 'Dr. H. Budi Harsono, S.E., M.Si., CSP, CPM, CIISA'),
  ('jamil', 'K.H. M. Jamil, S.Q., M.Pd.'),
  ('soleh-ma-mun', 'K.H. M. Soleh Ma''mun'),
  ('mohommad-toha', 'K.H. Mohommad Toha, S.Ag'),
  ('irfan-zaini-abbas', 'K.H. Irfan Zaini Abbas'),
  ('misbah-i', 'K.H. A. Misbah, S.Pd.I., M.Ag.'),
  ('sholeh-anas-rj', 'K. Sholeh Anas RJ'),
  ('abdul-ghofur', 'KH. Abdul Ghofur, M.Pd.'),
  ('yusuf-fhr', 'M. Yusuf FHR, S.Sos.'),
  ('mustahdi', 'Mustahdi, M.A.'),
  ('aprianif', 'Aprianif, Lc., M.A.'),
  ('zakaria-muslim-i', 'Zakaria Muslim, S.Pd.I.'),
  ('abdul-karim-jafar', 'Drs. H. Abdul Karim Jafar, MM.'),
  ('naidin-fathullah', 'Drs. H. Naidin Fathullah'),
  ('usman-shofi', 'Dr. H. Usman Shofi'),
  ('ahmad-muhsin', 'Drs. Ahmad Muhsin'),
  ('abdul-rohim-masduqi', 'Abdul Rohim Masduqi'),
  ('ahmad-rifa-i', 'Dr. H. Ahmad Rifa''i'),
  ('irfansyah', 'M. Irfansyah'),
  ('imam-bajuri-i', 'H. Imam Bajuri, S.Pd.I., M.Ag.'),
  ('zainudin', 'Zainudin, SQ.'),
  ('fathur-rahman', 'H. Fathur Rahman'),
  ('junaidi', 'Drs. K.H.M. Junaidi, M.Pd.'),
  ('abdul-syukur', 'Abdul Syukur, S.Q.'),
  ('soewardi-warman', 'K.H. Soewardi Warman, S.H., M.H.'),
  ('afif', 'KH. M. Afif, M.Pd.'),
  ('ahmad-sairin-i', 'Ahmad Sairin, S.Pd.I. K.'),
  ('nasuha-i', 'Nasuha, S.Pd.I.'),
  ('ruslani', 'Dr. (HC) Ruslani, M.M.'),
  ('nurhadi-i', 'Nurhadi, S.Pd.I., M.Pd.'),
  ('suparman', 'Suparman'),
  ('fahrial-hilal', 'Fahrial Hilal H.'),
  ('kholili', 'Kholili'),
  ('tamam-khaulani', 'K. Tamam Khaulani'),
  ('awaludin', 'Awaludin, S.Sos., M.Pd.'),
  ('ahmad-munir', 'Ahmad Munir'),
  ('rizki', 'M. Rizki, S.Kom.'),
  ('handoko', 'Handoko'),
  ('muhidin', 'Muhidin'),
  ('gunawan-i', 'Gunawan, S.Pd.I.')
) as v(slug, full_name)
on conflict (slug) do nothing;

-- 5) Kepengurusan: orang x jabatan x masa khidmat
insert into public.organizational_memberships (profile_id, position_id, term_id)
select p.id, po.id, t.id
from (values
  ('syuhada', 'syuriyah', 'Mustasyar'),
  ('syarief-muawan', 'syuriyah', 'Mustasyar'),
  ('sobron-zayyan', 'syuriyah', 'Mustasyar'),
  ('edi-suharsongko', 'syuriyah', 'Mustasyar'),
  ('udan-maulana', 'syuriyah', 'Mustasyar'),
  ('abdul-azis-noor', 'syuriyah', 'Mustasyar'),
  ('budi-harsono-e', 'syuriyah', 'Mustasyar'),
  ('jamil', 'syuriyah', 'Mustasyar'),
  ('soleh-ma-mun', 'syuriyah', 'Mustasyar'),
  ('mohommad-toha', 'syuriyah', 'Rois'),
  ('irfan-zaini-abbas', 'syuriyah', 'Wakil Rois'),
  ('misbah-i', 'syuriyah', 'Wakil Rois'),
  ('sholeh-anas-rj', 'syuriyah', 'Wakil Rois'),
  ('abdul-ghofur', 'syuriyah', 'Katib'),
  ('yusuf-fhr', 'syuriyah', 'Wakil Katib'),
  ('mustahdi', 'syuriyah', 'Wakil Katib'),
  ('aprianif', 'syuriyah', 'Wakil Katib'),
  ('zakaria-muslim-i', 'syuriyah', 'Wakil Katib'),
  ('abdul-karim-jafar', 'syuriyah', 'A''wan'),
  ('naidin-fathullah', 'syuriyah', 'A''wan'),
  ('usman-shofi', 'syuriyah', 'A''wan'),
  ('ahmad-muhsin', 'syuriyah', 'A''wan'),
  ('abdul-rohim-masduqi', 'syuriyah', 'A''wan'),
  ('ahmad-rifa-i', 'syuriyah', 'A''wan'),
  ('irfansyah', 'syuriyah', 'A''wan'),
  ('imam-bajuri-i', 'syuriyah', 'A''wan'),
  ('zainudin', 'syuriyah', 'A''wan'),
  ('fathur-rahman', 'tanfidziyah', 'Ketua'),
  ('junaidi', 'tanfidziyah', 'Wakil Ketua'),
  ('abdul-syukur', 'tanfidziyah', 'Wakil Ketua'),
  ('soewardi-warman', 'tanfidziyah', 'Wakil Ketua'),
  ('afif', 'tanfidziyah', 'Wakil Ketua'),
  ('ahmad-sairin-i', 'tanfidziyah', 'Wakil Ketua'),
  ('nasuha-i', 'tanfidziyah', 'Wakil Ketua'),
  ('ruslani', 'tanfidziyah', 'Sekretaris'),
  ('nurhadi-i', 'tanfidziyah', 'Wakil Sekretaris'),
  ('suparman', 'tanfidziyah', 'Wakil Sekretaris'),
  ('fahrial-hilal', 'tanfidziyah', 'Wakil Sekretaris'),
  ('kholili', 'tanfidziyah', 'Wakil Sekretaris'),
  ('tamam-khaulani', 'tanfidziyah', 'Wakil Sekretaris'),
  ('awaludin', 'tanfidziyah', 'Wakil Sekretaris'),
  ('ahmad-munir', 'tanfidziyah', 'Bendahara'),
  ('rizki', 'tanfidziyah', 'Wakil Bendahara'),
  ('handoko', 'tanfidziyah', 'Wakil Bendahara'),
  ('muhidin', 'tanfidziyah', 'Wakil Bendahara'),
  ('gunawan-i', 'tanfidziyah', 'Wakil Bendahara')
) as v(slug, unit_code, posisi)
join public.organizational_profiles p on p.slug = v.slug
join public.organizational_units u on u.code = v.unit_code
join public.organizational_positions po on po.unit_id = u.id and po.name = v.posisi
join public.organizational_terms t on t.label = '2025–2030'
on conflict (profile_id, position_id, term_id) do nothing;

-- 6) Pemeriksaan
--   select count(*) as profil from public.organizational_profiles;          -- 46
--   select count(*) as kepengurusan from public.organizational_memberships; -- 46
--   select unit_name, position_name, full_name from public.directory_public
--     order by unit_sort, position_rank limit 10;
