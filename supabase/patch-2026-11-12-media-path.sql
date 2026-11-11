-- ============================================================
-- PATCH P0-2: Isolasi path policy media_insert (bucket "media")
-- Tanggal: 2026-11-12
--
-- MASALAH: policy lama hanya memeriksa bucket_id + peran staff
-- (can_upload_media), sehingga akun staff yang terkompromi dapat
-- INSERT ke path/kedalaman folder sembarangan di bucket media.
--
-- PERBAIKAN: tambahkan validasi `name` pada policy INSERT:
--   • hanya karakter aman, wajib ber-ekstensi gambar
--   • tanpa traversal '..' dan tanpa slash ganda '//'
--   • kedalaman folder maksimal 3 tingkat
--   • tanpa awalan '/'
--
-- SIFAT: non-destruktif, aman dijalankan ulang (idempotent).
-- CARA: jalankan seluruh blok di Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1) Ganti policy INSERT dengan validasi path.
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.can_upload_media()
    and left(name, 1) <> '/'
    and name !~ '[^A-Za-z0-9/_.\-]'
    and name ~ '^[A-Za-z0-9][A-Za-z0-9/_.\-]*\.(jpg|jpeg|png|webp)$'
    and name not like '%..%'
    and name not like '%//%'
    and (length(name) - length(replace(name, '/', ''))) <= 3
  );

-- Policy UPDATE/DELETE tidak berubah:
--   update/delete tetap hanya untuk is_admin() — lihat schema.sql bagian 8.

-- 2) Pemeriksaan cepat setelah patch:
--    Harus mengembalikan 1 (policy aktif dengan WITH CHECK path):
--    select count(*) from pg_policies
--    where schemaname='storage' and tablename='objects'
--      and policyname='media_insert' and cmd='INSERT';
