-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — FASE 1
-- 001_foundation: prasyarat & fungsi dasar (mesin status tiket)
-- Jalankan BERURUTAN: 001_foundation -> 002_tables -> 003_security.
-- Sifat: idempotent, tanpa perubahan destruktif.
-- Tabel existing (staff, profiles, content_items, site_settings, dst.)
-- TIDAK disentuh oleh migrasi ini. Seluruh objek baru berprefix consultation_.
-- ============================================================================

-- 1) MESIN STATUS TIKET ------------------------------------------------------
-- Alur layanan: Pengajuan -> Verifikasi -> Antrean -> Penugasan -> Konsultasi
--               -> Review -> Jawaban -> Penyelesaian.
-- Status: baru | diverifikasi | ditolak | menunggu_penugasan | ditugaskan |
--         menunggu_informasi | menunggu_review | terjawab | selesai
--
-- Aturan khusus:
--   * "ditolak" hanya dari verifikasi atau antrean (sebelum pengerjaan).
--   * "menunggu_informasi" menghentikan perhitungan SLA; kembali dari status
--     ini divalidasi penuh oleh trigger tiket (hanya ke status asalnya).
--   * "selesai" terminal, tetapi admin konsultasi boleh membuka kembali.
create or replace function public.consultation_can_transition(from_status text, to_status text)
returns boolean
language sql
stable
as $$
  select case
    -- verifikasi: jawab valid/tidak valid
    when from_status = 'baru'               and to_status in ('diverifikasi','ditolak') then true
    -- antrean
    when from_status = 'diverifikasi'       and to_status = 'menunggu_penugasan' then true
    when from_status = 'menunggu_penugasan' and to_status in ('ditugaskan','ditolak') then true
    -- pengerjaan konsultan: kirim jawaban / minta informasi / dilepas ke antrean
    when from_status = 'ditugaskan'         and to_status in ('menunggu_review','menunggu_informasi','menunggu_penugasan') then true
    -- review: disetujui & terkirim, atau minta revisi (kembali ke konsultan)
    when from_status = 'menunggu_review'    and to_status in ('terjawab','ditugaskan') then true
    -- jawaban terkirim: pemohon membalas (proses lanjut) / butuh info / diselesaikan
    when from_status = 'terjawab'           and to_status in ('ditugaskan','menunggu_informasi','selesai') then true
    -- keluar dari "menunggu informasi" — target sebenarnya dikunci oleh trigger
    -- tiket (harus sama dengan status_sebelum_pause)
    when from_status = 'menunggu_informasi' and to_status in ('ditugaskan','menunggu_review') then true
    -- tiket selesai dapat dibuka kembali oleh admin konsultasi
    when from_status = 'selesai'            and to_status = 'ditugaskan' then true
    else false
  end
$$;

-- Catatan desain (bukan objek):
--   * Nomor tiket & secret akses TIDAK dibuat di sini:
--       - nomor tiket di-generate trigger di 002_tables (non-kripto, bukan rahasia),
--       - secret 32 byte dibuat Edge Function (CSPRNG) dan disimpan sebagai
--         HMAC-SHA256 di consultation_access_credentials (pepper = secret functions).
--   * SLA: kolom di consultation_tickets + kalender libur; perhitungan hari kerja
--     memakai fungsi consultation_add_workdays() (002_tables, butuh tabel libur).
--   * Rate limiting (tabel consultation_rate_hits) tersedia sejak fase ini,
--     penerapannya di Edge Functions (keputusan C2, dependency Phase 2).
--   * Jam operasional SENGAJA tidak dimodelkan — kebijakan resmi belum ditetapkan.
