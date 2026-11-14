-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — FASE 1
-- 003_security: RLS (deny by default), least privilege, hak fungsi.
-- Prasyarat: 001_foundation + 002_tables sudah dijalankan; peran anon &
-- authenticated tersedia (bawaan Supabase).
--
-- Prinsip:
--   * SEMUA tabel consultation_* : RLS aktif TANPA policy untuk anon/authenticated
--     → ditolak by default. Akses data hanya melalui service_role DI DALAM
--     Edge Functions (service_role tidak pernah ada di frontend).
--   * Dashboard staf (Phase 3) memanggil Edge Functions, bukan tabel langsung.
--   * Bucket lampiran konsultasi: TANPA policy storage → hanya service_role.
-- ============================================================================

-- 1) RLS AKTIF (deny by default — tidak ada policy yang dibuat) --------------
alter table public.consultation_categories           enable row level security;
alter table public.consultation_holidays             enable row level security;
alter table public.consultation_staff_roles          enable row level security;
alter table public.consultation_consultant_categories enable row level security;
alter table public.consultation_tickets              enable row level security;
alter table public.consultation_requester_contacts   enable row level security;
alter table public.consultation_access_credentials   enable row level security;
alter table public.consultation_messages             enable row level security;
alter table public.consultation_assignments          enable row level security;
alter table public.consultation_reviews              enable row level security;
alter table public.consultation_attachments          enable row level security;
alter table public.consultation_publications         enable row level security;
alter table public.consultation_status_logs          enable row level security;
alter table public.consultation_audit_logs           enable row level security;
alter table public.consultation_notifications        enable row level security;
alter table public.consultation_rate_hits            enable row level security;

-- 2) LEAST PRIVILEGE: cabut seluruh hak tabel dari anon & authenticated ------
--    (Supabase memberi default grant ALL; kita cabut eksplisit.)
revoke all on public.consultation_categories,
              public.consultation_holidays,
              public.consultation_staff_roles,
              public.consultation_consultant_categories,
              public.consultation_tickets,
              public.consultation_requester_contacts,
              public.consultation_access_credentials,
              public.consultation_messages,
              public.consultation_assignments,
              public.consultation_reviews,
              public.consultation_attachments,
              public.consultation_publications,
              public.consultation_status_logs,
              public.consultation_audit_logs,
              public.consultation_notifications,
              public.consultation_rate_hits
  from anon, authenticated;

-- 3) HAK FUNGSI & SEQUENCE: hanya service_role (dipanggil dari Edge Functions)
revoke all on function
  public.consultation_can_transition(text, text),
  public.consultation_add_workdays(timestamptz, integer),
  public.consultation_waktu(),
  public.consultation_hari_kerja_tertutup(timestamptz, timestamptz),
  public.consultation_shift_deadline(timestamptz, integer),
  public.consultation_kode_nomor(bigint),
  public.consultation_touch(),
  public.consultation_ticket_before(),
  public.consultation_ticket_status_log(),
  public.consultation_message_check(),
  public.consultation_review_check(),
  public.consultation_assignment_check(),
  public.consultation_attachment_check(),
  public.consultation_append_only(),
  public.consultation_publication_before(),
  public.consultation_publication_check()
  from public, anon, authenticated;

-- Sequence nomor tiket: USAGE dipakai trigger saat insert tiket.
revoke all on sequence public.consultation_nomor_tiket_seq from public, anon, authenticated;
grant usage, select on sequence public.consultation_nomor_tiket_seq to service_role;

grant execute on function
  public.consultation_can_transition(text, text),
  public.consultation_add_workdays(timestamptz, integer),
  public.consultation_waktu(),
  public.consultation_hari_kerja_tertutup(timestamptz, timestamptz),
  public.consultation_shift_deadline(timestamptz, integer),
  public.consultation_kode_nomor(bigint),
  public.consultation_touch(),
  public.consultation_ticket_before(),
  public.consultation_ticket_status_log(),
  public.consultation_message_check(),
  public.consultation_review_check(),
  public.consultation_assignment_check(),
  public.consultation_attachment_check(),
  public.consultation_append_only(),
  public.consultation_publication_before(),
  public.consultation_publication_check()
  to service_role;

-- 4) BUCKET PRIVAT ------------------------------------------------------------
-- Bucket 'consultation-attachments' (dibuat di 002_tables, public = false)
-- SENGAJA TIDAK diberi policy storage apa pun → anon/authenticated ditolak;
-- unggah & pembacaan hanya via Edge Functions dengan signed URL berumur pendek.

-- 5) VERIFIKASI (opsional, jalankan terpisah) ----------------------------------
--   1) Semua RLS aktif:
--      select tablename, rowsecurity from pg_tables
--       where schemaname = 'public' and tablename like 'consultation_%'
--       order by tablename;
--      → 16 baris, semua rowsecurity = true.
--   2) Tidak ada policy untuk anon/authenticated:
--      select tablename, policyname from pg_policies
--       where schemaname = 'public' and tablename like 'consultation_%';
--      → 0 baris.
--   3) Hak tabel anon/authenticated kosong:
--      select grantee, table_name from information_schema.role_table_grants
--       where table_schema = 'public' and table_name like 'consultation_%'
--         and grantee in ('anon','authenticated');
--      → 0 baris.
--   4) Fungsi hanya untuk service_role:
--      select proname, proacl from pg_proc
--       where proname like 'consultation_%';
--   5) Sequence nomor tiket hanya untuk service_role:
--      select has_sequence_privilege('anon','public.consultation_nomor_tiket_seq','USAGE'),
--             has_sequence_privilege('service_role','public.consultation_nomor_tiket_seq','USAGE');
--      → anon = false, service_role = true.
