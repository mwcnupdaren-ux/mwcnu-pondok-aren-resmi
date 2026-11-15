-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — ROLLBACK (mengembalikan Phase 1 penuh)
-- Jalankan HANYA jika putusan untuk membatalkan modul konsultasi di DB.
-- Aman: tidak menyentuh tabel existing (staff, profiles, CMS, dst.).
-- PERHATIAN: menghapus tiket = menghapus data percakapan & lampiran metadata.
--   Arsip lampiran fisik di bucket tetap ada; bersihkan manual bila perlu.
-- ============================================================================

-- 1) Trigger & fungsi
--    Fungsi layanan Fase 2 (consultation_svc_*) di-drop otomatis (idempotent).
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname like 'consultation_svc_%'
  loop
    execute 'drop function if exists ' || r.sig;
  end loop;
end $$;

drop trigger if exists trg_consultation_audit_check       on public.consultation_audit_logs;
drop trigger if exists trg_consultation_review_append     on public.consultation_reviews;
drop trigger if exists trg_consultation_consent_check     on public.consultation_requester_contacts;
drop trigger if exists trg_consultation_publication_check on public.consultation_publications;
drop trigger if exists trg_consultation_publication_before on public.consultation_publications;
drop trigger if exists trg_consultation_assignment_check on public.consultation_assignments;
drop trigger if exists trg_consultation_message_append    on public.consultation_messages;
drop trigger if exists trg_consultation_auditlog_append   on public.consultation_audit_logs;
drop trigger if exists trg_consultation_statuslog_append  on public.consultation_status_logs;
drop trigger if exists trg_consultation_attachment_check  on public.consultation_attachments;
drop trigger if exists trg_consultation_review_check      on public.consultation_reviews;
drop trigger if exists trg_consultation_message_check     on public.consultation_messages;
drop trigger if exists trg_consultation_ticket_status_log on public.consultation_tickets;
drop trigger if exists trg_consultation_ticket_before     on public.consultation_tickets;
drop trigger if exists trg_consultation_touch_publikasi   on public.consultation_publications;
drop trigger if exists trg_consultation_touch_contacts    on public.consultation_requester_contacts;
drop trigger if exists trg_consultation_touch_roles       on public.consultation_staff_roles;

drop function if exists public.consultation_ubah_status(uuid, text, text, text);
drop function if exists public.consultation_audit_check();
drop function if exists public.consultation_set_aktor(text);
drop function if exists public.consultation_aktor();
drop function if exists public.consultation_consent_check();
drop function if exists public.consultation_publication_check();
drop function if exists public.consultation_publication_before();
drop function if exists public.consultation_assignment_check();
drop function if exists public.consultation_kode_nomor(bigint);
drop function if exists public.consultation_shift_deadline(timestamptz, integer);
drop function if exists public.consultation_hari_kerja_tertutup(timestamptz, timestamptz);
drop function if exists public.consultation_waktu();
drop function if exists public.consultation_append_only();
drop function if exists public.consultation_attachment_check();
drop function if exists public.consultation_review_check();
drop function if exists public.consultation_message_check();
drop function if exists public.consultation_ticket_status_log();
drop function if exists public.consultation_ticket_before();
drop function if exists public.consultation_touch();
drop function if exists public.consultation_add_workdays(timestamptz, integer);
drop function if exists public.consultation_can_transition(text, text);

-- 2) Tabel (urut ketergantungan FK antar tabel konsultasi — TANPA CASCADE,
--    audit lanjutan G: bila ada objek EKSTERNAL yang bergantung pada tabel
--    konsultasi, rollback GAGAL KERAS alih-alih diam-diam menghapusnya;
--    seluruh FK internal konsultasi di-drop bersama tabelnya secara berurutan)
drop table if exists public.consultation_rate_hits;
drop table if exists public.consultation_notifications;
drop table if exists public.consultation_audit_logs;
drop table if exists public.consultation_status_logs;
drop table if exists public.consultation_publications;
drop table if exists public.consultation_attachments;
drop table if exists public.consultation_reviews;
drop table if exists public.consultation_assignments;
drop table if exists public.consultation_messages;
drop table if exists public.consultation_access_credentials;
drop table if exists public.consultation_requester_contacts;
drop table if exists public.consultation_tickets;
drop table if exists public.consultation_consultant_categories;
drop table if exists public.consultation_staff_roles;
drop table if exists public.consultation_holidays;
drop table if exists public.consultation_categories;

-- 3) Sequence nomor tiket
drop sequence if exists public.consultation_nomor_tiket_seq;

-- 4) Bucket Storage — SENGAJA TIDAK dieksekusi otomatis di dalam rollback ini
--    (audit lanjutan G: penghapusan objek eksternal dipisah dari rollback
--    database dan membutuhkan keputusan manual). Bila bucket
--    'consultation-attachments' memang ingin dihapus, jalankan TERPISAH:
--
--    -- delete from storage.buckets where id = 'consultation-attachments';
--    -- delete from storage.buckets where id = 'consultation-private';
--
--    Catatan: objek fisik lampiran di storage tidak ikut terhapus oleh
--    perintah di atas; kosongkan/arsipkan manual bila perlu.
