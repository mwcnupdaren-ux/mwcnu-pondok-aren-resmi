-- ============================================================
-- SEED: Direktori pengurus ranting (11 PRNU) — masa khidmat 2025–2030
-- Tanggal: 2026-11-12
--
-- SUMBER DATA: daftar ketua ranting yang SUDAH TAYANG di halaman
-- #ranting situs (konten CMS `ranting`, tampil juga sebagai data
-- bawaan js/app.js). Tidak ada nama baru, tidak ada data fiktif —
-- ini pemindahan data publik existing ke tabel direktori agar
-- dapat dikelola lewat panel admin.
--
-- SYARAT: jalankan SETELAH
--   1) supabase/direktori-organisasi.sql
--   2) supabase/seed-direktori-pengurus.sql  (untuk masa khidmat aktif)
--
-- SIFAT: idempotent (aman dijalankan ulang; konflik diabaikan).
--
-- CATATAN PEMETAAN
--   • Hanya jabatan "Ketua" yang di-seed, karena hanya nama ketua
--     yang sudah dipublikasikan. Jabatan lain (Wakil Ketua,
--     Sekretaris, Bendahara, ...) diisi pengurus lewat panel admin
--     setelah data resmi diterima — tidak ditebak di sini.
--   • Dua orang sudah ada di direktori MWC dengan nama yang sama
--     persis, sehingga profilnya DIPAKAI ULANG (tidak diduplikasi):
--       - nasuha-i   : "Nasuha, S.Pd.I."          → PRNU 07
--       - aprianif   : "Aprianif, Lc., M.A."      → PRNU 08
--     Keduanya tetap tampil dengan dua jabatan (MWC + ranting).
--   • "Ust. Zakariaa" (PRNU 01) sengaja TIDAK digabung dengan
--     "Zakaria Muslim, S.Pd.I." (Wakil Katib Syuriyah) karena nama
--     tertulis berbeda. Bila sekretariat memastikan orang yang sama,
--     gabungkan lewat panel admin (pindahkan jabatan, hapus profil
--     duplikat) — jangan gabung otomatis.
--   • Foto & bio dikosongkan (NULL) — UI memakai inisial nama.
-- ============================================================

-- 1) Jabatan "Ketua" untuk setiap unit PRNU
insert into public.organizational_positions (unit_id, name, rank)
select u.id, 'Ketua', 1
from public.organizational_units u
where u.kind = 'prnu'
on conflict (unit_id, name) do nothing;

-- 2) Profil publik 11 ketua ranting
--    (2 profil memakai nama kanonik yang sudah ada agar tidak duplikat)
insert into public.organizational_profiles (slug, full_name, is_public)
select v.slug, v.full_name, true
from (values
  ('zakariaa',          'Ust. Zakariaa'),
  ('muhammad-ikhwan-i', 'Ust. Muhammad Ikhwan, S.Pd.I'),
  ('chairul-anam',      'Ust. Chairul Anam'),
  ('abdullah-yunus',    'Ust. Abdullah Yunus'),
  ('ma-mun-murod',      'Ust. Ma''mun Murod'),
  ('ali-ikhwan',        'Ust. Ali Ikhwan'),
  ('nasuha-i',          'Nasuha, S.Pd.I.'),
  ('aprianif',          'Aprianif, Lc., M.A.'),
  ('suwardi',           'Ust. Suwardi'),
  ('adih',              'Ust. Adih'),
  ('muhammad-ismi',     'Ust. Muhammad Ismi')
) as v(slug, full_name)
on conflict (slug) do nothing;

-- 3) Kepengurusan: ketua ranting x masa khidmat aktif
insert into public.organizational_memberships (profile_id, position_id, term_id)
select p.id, po.id, t.id
from (values
  ('zakariaa',          'prnu-01'),  -- Pondok Aren
  ('muhammad-ikhwan-i', 'prnu-02'),  -- Jurangmangu Barat
  ('chairul-anam',      'prnu-03'),  -- Jurangmangu Timur
  ('abdullah-yunus',    'prnu-04'),  -- Pondok Betung
  ('ma-mun-murod',      'prnu-05'),  -- Pondok Karya
  ('ali-ikhwan',        'prnu-06'),  -- Pondok Jaya
  ('nasuha-i',          'prnu-07'),  -- Pondok Pucung
  ('aprianif',          'prnu-08'),  -- Pondok Kacang Barat
  ('suwardi',           'prnu-09'),  -- Pondok Kacang Timur
  ('adih',              'prnu-10'),  -- Parigi Baru
  ('muhammad-ismi',     'prnu-11')   -- Parigi Lama
) as v(slug, unit_code)
join public.organizational_profiles p on p.slug = v.slug
join public.organizational_units u on u.code = v.unit_code
join public.organizational_positions po on po.unit_id = u.id and po.name = 'Ketua'
join public.organizational_terms t on t.label = '2025–2030'
on conflict (profile_id, position_id, term_id) do nothing;

-- 4) Pemeriksaan pasca-seed
--   select count(*) as profil from public.organizational_profiles;          -- 55
--   select count(*) as kepengurusan from public.organizational_memberships; -- 57
--   select u.prnu_code, u.name, p.full_name, pos.name
--     from public.directory_public d
--     join public.organizational_units u on u.code = d.unit_code
--     join public.organizational_profiles p on p.slug = d.slug
--     join public.organizational_positions pos on pos.name = d.position_name and pos.unit_id = u.id
--    where u.kind = 'prnu' order by u.prnu_code;                            -- 11 baris
--   -- Pastikan tidak ada PRNU yang terlewat:
--   select u.code, u.name
--     from public.organizational_units u
--    where u.kind = 'prnu'
--      and not exists (select 1 from public.directory_public d where d.unit_code = u.code);
--   -- Hasil harus 0 baris.
