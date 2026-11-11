-- ============================================================
-- PATCH P0-1 (LANGKAH 2): Cabut akses anon langsung ke verify_nia
-- Tanggal: 2026-11-12
--
-- SYARAT WAJIB: jalankan ini HANYA SETELAH Edge Function verify-nia
-- ter-deploy dan halaman verifikasi sudah tervalidasi memakai
-- endpoint baru /functions/v1/verify-nia.
--
-- Jika dijalankan terlalu dulu, halaman /v/<nia> akan gagal
-- memverifikasi sampai function ter-deploy (klien punya fallback
-- ke RPC selama masa transisi, tapi fallback ini ikut mati).
-- ============================================================

-- Cabut hak eksekusi langsung dari anon; sisa jalur resmi:
--   • Edge Function (service_role) untuk halaman /v/<nia>
--   • authenticated tetap boleh (dipakai modul profil bila perlu)
revoke execute on function public.verify_nia(text) from anon;

-- Pemeriksaan cepat: harus 0 hak execute untuk anon.
-- select count(*) from information_schema.role_routine_grants
-- where specific_schema='public' and routine_name='verify_nia' and grantee='anon';
