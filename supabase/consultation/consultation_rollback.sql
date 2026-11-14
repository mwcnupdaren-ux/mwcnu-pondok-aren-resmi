-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — ROLLBACK (mengembalikan Phase 1 penuh)
-- Jalankan HANYA jika putusan untuk membatalkan modul konsultasi di DB.
-- Aman: tidak menyentuh tabel existing (staff, profiles, CMS, dst.).
-- PERHATIAN: menghapus tiket = menghapus data percakapan & lampiran metadata.
--   Arsip lampiran fisik di bucket tetap ada; bersihkan manual bila perlu.
-- ============================================================================

-- 1) Trigger & fungsi
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

-- 2) Tabel (urut ketergantungan; CASCADE menangani FK antar tabel konsultasi)
drop table if exists public.consultation_rate_hits            cascade;
drop table if exists public.consultation_notifications        cascade;
drop table if exists public.consultation_audit_logs           cascade;
drop table if exists public.consultation_status_logs          cascade;
drop table if exists public.consultation_publications         cascade;
drop table if exists public.consultation_attachments          cascade;
drop table if exists public.consultation_reviews              cascade;
drop table if exists public.consultation_assignments          cascade;
drop table if exists public.consultation_messages             cascade;
drop table if exists public.consultation_access_credentials   cascade;
drop table if exists public.consultation_requester_contacts   cascade;
drop table if exists public.consultation_tickets              cascade;
drop table if exists public.consultation_consultant_categories cascade;
drop table if exists public.consultation_staff_roles          cascade;
drop table if exists public.consultation_holidays             cascade;
drop table if exists public.consultation_categories           cascade;

-- 3) Bucket privat (objek fisik tidak ikut terhapus — kosongkan manual bila perlu)
do $$
begin
  if to_regclass('storage.buckets') is not null then
    delete from storage.buckets where id = 'consultation-attachments';
  end if;
end $$;

-- 4) Sequence nomor tiket
drop sequence if exists public.consultation_nomor_tiket_seq;
