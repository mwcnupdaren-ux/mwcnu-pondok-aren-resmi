-- =====================================================================
-- MWCNU Pondok Aren: migrasi profil penulis (OPSIONAL, jalankan manual)
-- =====================================================================
-- Tujuan: memberi artikel lama tautan ke profil penulis agar kartu penulis
-- tampil di halaman artikel, dan mengganti byline "Admin" menjadi redaksi.
--
-- AMAN:
--   * idempoten: aman dijalankan berulang.
--   * hanya menyentuh data.penulis_id / data.penulis (tidak menyentuh isi artikel).
--   * profil redaksi dibuat dengan published = true agar langsung tampil.
--   * TIDAK menghapus apa pun.
--
-- Baca dulu, lalu jalankan di Supabase SQL Editor bila setuju.
-- =====================================================================

-- 1) Profil lembaga "Redaksi MWCNU Pondok Aren" (satu baris).
--    Email memakai alamat resmi organisasi agar unik dan jelas milik lembaga.
insert into public.author_profiles (email, nama, bidang, pendidikan, pengalaman, bio, published)
values (
  'mwcnu.pdaren@gmail.com',
  'Redaksi MWCNU Pondok Aren',
  'Jurnalistik & Media Dakwah',
  '',
  'Media Center NU Pondok Aren',
  'Redaksi resmi Majelis Wakil Cabang Nahdlatul Ulama Kecamatan Pondok Aren.',
  true
)
on conflict (email) do update
  set nama = excluded.nama,
      bidang = excluded.bidang,
      bio = excluded.bio,
      published = true;

-- 2) Tautkan artikel yang belum punya penulis_id:
--    a) byline "Admin" atau kosong  -> profil Redaksi
--    b) byline "Redaksi..."         -> profil Redaksi
--    (artikel yang sudah punya penulis_id TIDAK diubah)
with redaksi as (
  select id, nama from public.author_profiles where email = 'mwcnu.pdaren@gmail.com'
)
update public.content_items ci
set data = jsonb_set(
             jsonb_set(ci.data, '{penulis_id}', to_jsonb(redaksi.id::text), true),
             '{penulis}', to_jsonb(redaksi.nama), true
           ),
    updated_by = 'migrasi-10i'
from redaksi
where ci.type = 'berita'
  and coalesce(ci.data ->> 'penulis_id', '') = ''
  and (
        coalesce(trim(ci.data ->> 'penulis'), '') = ''
     or lower(trim(ci.data ->> 'penulis')) = 'admin'
     or lower(trim(ci.data ->> 'penulis')) like 'redaksi%'
  );

-- 3) Ringkasan hasil (untuk dicek sebelum percaya).
select
  count(*) filter (where coalesce(data ->> 'penulis_id', '') <> '') as artikel_tertaut,
  count(*) filter (where coalesce(data ->> 'penulis_id', '') = '')  as artikel_belum_taut,
  count(*) filter (where lower(trim(coalesce(data ->> 'penulis', ''))) = 'admin') as sisa_byline_admin
from public.content_items
where type = 'berita';
