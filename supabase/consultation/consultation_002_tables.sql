-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — FASE 1
-- 002_tables: seluruh tabel, indeks, constraint, trigger, dan bucket storage.
-- Prasyarat: 001_foundation sudah dijalankan.
-- Sifat: idempotent, tanpa perubahan destruktif pada tabel existing.
-- RLS & hak akses diatur di 003_security (jalankan segera setelah file ini).
-- ============================================================================

-- ==========================================================================
-- A. REFERENSI & HAK AKSES
-- ==========================================================================

-- A1) Kategori pertanyaan (dikelola admin konsultasi; seed data = keputusan manusia)
create table if not exists public.consultation_categories (
  id         uuid primary key default gen_random_uuid(),
  kode       text unique not null check (kode ~ '^[a-z0-9_]{2,40}$'),
  nama       text not null check (char_length(btrim(nama)) between 3 and 120),
  deskripsi  text,
  sort       integer not null default 0,
  aktif      boolean not null default true,
  created_at timestamptz not null default now()
);

-- A2) Kalender hari libur (untuk SLA hari kerja; zona waktu resmi WIB)
create table if not exists public.consultation_holidays (
  tanggal    date primary key,
  keterangan text not null default ''
);

-- A3) Role konsultasi — TERPISAH dari role CMS (public.staff.role).
--     Jurnalis/ustadz/pengurus CMS TIDAK otomatis punya akses konsultasi.
--     Email harus cocok dengan identitas Google staf (auth.jwt -> email).
create table if not exists public.consultation_staff_roles (
  email          text primary key
                 check (email = lower(email)
                        and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  role_konsultasi text not null check (role_konsultasi in ('admin_konsultasi','konsultan','reviewer')),
  aktif          boolean not null default true,
  catatan        text,
  dibuat_oleh    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
-- Indeks unik komposit: dipakai FK komposit agar penugasan/review hanya boleh
-- menunjuk email yang memang ber-role konsultan/reviewer (lihat C5/C7 di bawah).
create unique index if not exists consultation_staff_roles_email_role
  on public.consultation_staff_roles (email, role_konsultasi);

-- A4) Kategori yang boleh dikerjakan seorang konsultan.
--     FK komposit + check role_tetap='konsultan' menjamin email ini benar-benar
--     terdaftar ber-role konsultan; hapus staff_roles -> pemetaan ikut terhapus.
create table if not exists public.consultation_consultant_categories (
  konsultan_email text not null,
  role_tetap      text not null default 'konsultan' check (role_tetap = 'konsultan'),
  kategori_id     uuid not null references public.consultation_categories (id) on delete cascade,
  primary key (konsultan_email, kategori_id),
  foreign key (konsultan_email, role_tetap)
    references public.consultation_staff_roles (email, role_konsultasi) on delete cascade
);

-- ==========================================================================
-- B. TRANSAKSI
-- ==========================================================================

-- B1) Tiket konsultasi — TIDAK memuat identitas pemohon (ada di tabel kontak).
create table if not exists public.consultation_tickets (
  id                  uuid primary key default gen_random_uuid(),
  nomor_tiket         text unique not null,
  kategori_id         uuid not null references public.consultation_categories (id) on delete restrict,
  judul               text not null check (char_length(btrim(judul)) between 5 and 150),
  isi_pertanyaan      text not null check (char_length(btrim(isi_pertanyaan)) between 10 and 10000),
  status              text not null default 'baru'
                      check (status in ('baru','diverifikasi','ditolak','menunggu_penugasan',
                                        'ditugaskan','menunggu_informasi','menunggu_review',
                                        'terjawab','selesai')),
  status_sebelum_pause text,                       -- target keluar dari "menunggu informasi"
  sla_deadline        timestamptz,                 -- dihitung sistem (hari kerja, WIB)
  sla_paused_at       timestamptz,                 -- berisi saat status = menunggu_informasi
  alasan_penolakan    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists consultation_tickets_status_aktif
  on public.consultation_tickets (status, sla_deadline)
  where status not in ('selesai','ditolak');
create index if not exists consultation_tickets_kategori
  on public.consultation_tickets (kategori_id);
create index if not exists consultation_tickets_created
  on public.consultation_tickets (created_at desc);

-- B2) Kontak pemohon — DATA PRIBADI, terpisah dari konten publik.
--     Minimal satu kontak (WhatsApp atau email); nama opsional.
create table if not exists public.consultation_requester_contacts (
  id                       uuid primary key default gen_random_uuid(),
  ticket_id                uuid not null unique references public.consultation_tickets (id) on delete cascade,
  nama                     text check (nama is null or char_length(btrim(nama)) between 2 and 120),
  whatsapp                 text check (whatsapp is null or whatsapp ~ '^\+?[0-9]{8,15}$'),
  email                    text check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  persetujuan_privasi      boolean not null default false,           -- wajib true saat pengajuan (divalidasi function)
  persetujuan_publikasi    boolean not null default false,           -- setelah diisi pemohon (opsional)
  persetujuan_publikasi_at timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint ccr_min_satu_kontak
    check (coalesce(btrim(whatsapp),'') <> '' or coalesce(btrim(email),'') <> '')
);

-- B3) Kredensial akses tiket — secret TIDAK pernah disimpan plaintext.
--     Edge Function: secret 32 byte CSPRNG -> HMAC-SHA256(secret, pepper)
--     (pepper di secrets functions); kolom hanya menyimpan hash hex 64 char.
create table if not exists public.consultation_access_credentials (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         uuid not null unique references public.consultation_tickets (id) on delete cascade,
  secret_hash       text not null check (secret_hash ~ '^[0-9a-f]{64}$'),
  dibuat_at         timestamptz not null default now(),
  terakhir_akses_at timestamptz,
  dicabut_at        timestamptz,
  dicabut_alasan    text
);

-- B4) Pesan percakapan tiket. Append-only (trigger di bawah).
--     catatan_internal WAJIB terlihat_pemohon = false (constraint + trigger).
create table if not exists public.consultation_messages (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.consultation_tickets (id) on delete cascade,
  pengirim_jenis  text not null check (pengirim_jenis in ('pemohon','konsultan','reviewer','admin_konsultasi','sistem')),
  pengirim_email  text,
  jenis_pesan     text not null check (jenis_pesan in ('balasan_pemohon','jawaban_konsultan','jawaban_final','catatan_internal','sistem')),
  isi             text not null check (char_length(btrim(isi)) between 1 and 10000),
  terlihat_pemohon boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint ccm_internal_tersembunyi
    check (jenis_pesan <> 'catatan_internal' or terlihat_pemohon = false)
);
create index if not exists consultation_messages_tiket_at
  on public.consultation_messages (ticket_id, created_at);

-- B5) Penugasan konsultan. Satu penugasan aktif per tiket (indeks unik parsial).
create table if not exists public.consultation_assignments (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.consultation_tickets (id) on delete cascade,
  konsultan_email text not null,
  role_tetap      text not null default 'konsultan' check (role_tetap = 'konsultan'),
  ditugaskan_oleh text not null,
  ditugaskan_at   timestamptz not null default now(),
  dilepas_at      timestamptz,
  alasan_pelepasan text,
  foreign key (konsultan_email, role_tetap)
    references public.consultation_staff_roles (email, role_konsultasi) on delete restrict,
  constraint cca_pelepasan_beralasan check (dilepas_at is null or alasan_pelepasan is not null)
);
create unique index if not exists consultation_assignments_aktif_per_tiket
  on public.consultation_assignments (ticket_id) where dilepas_at is null;
create index if not exists consultation_assignments_konsultan_aktif
  on public.consultation_assignments (konsultan_email) where dilepas_at is null;

-- B6) Riwayat review jawaban. Append-only.
--     "Reviewer tidak menyetujui jawabannya sendiri" ditegakkan trigger
--     (check constraint tidak boleh ber-subquery).
create table if not exists public.consultation_reviews (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references public.consultation_tickets (id) on delete cascade,
  message_id     uuid not null references public.consultation_messages (id) on delete cascade,
  reviewer_email text not null,
  role_tetap     text not null default 'reviewer' check (role_tetap = 'reviewer'),
  keputusan      text not null check (keputusan in ('disetujui','minta_revisi')),
  catatan        text,
  reviewed_at    timestamptz not null default now(),
  foreign key (reviewer_email, role_tetap)
    references public.consultation_staff_roles (email, role_konsultasi) on delete restrict
);
create index if not exists consultation_reviews_tiket on public.consultation_reviews (ticket_id, reviewed_at desc);

-- B7) Lampiran — path di bucket PRIVAT consultation-attachments.
--     Ukuran/jenis dibatasi; prefix 'tickets/' mencegah penyalahgunaan lintas bucket.
create table if not exists public.consultation_attachments (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references public.consultation_tickets (id) on delete cascade,
  message_id     uuid references public.consultation_messages (id) on delete set null,
  storage_path   text not null unique check (storage_path like 'tickets/%'),
  nama_file      text not null check (char_length(btrim(nama_file)) between 1 and 200),
  mime           text not null check (mime in ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes     integer not null check (size_bytes between 1 and 5242880),
  diunggah_oleh  text not null,                    -- email staf atau 'pemohon'
  created_at     timestamptz not null default now()
);
create index if not exists consultation_attachments_tiket on public.consultation_attachments (ticket_id);

-- ==========================================================================
-- C. OPERASIONAL
-- ==========================================================================

-- C1) Arsip tanya-jawab publik — snapshot TERsamarkan; tidak pernah ber-JOIN
--     ke data identitas. Terbit hanya bila ketiga persetujuan lengkap.
create table if not exists public.consultation_publications (
  id                        uuid primary key default gen_random_uuid(),
  ticket_id                 uuid not null unique references public.consultation_tickets (id) on delete cascade,
  slug                      text unique check (slug ~ '^[a-z0-9-]{6,120}$'),
  judul_publik              text not null check (char_length(btrim(judul_publik)) between 5 and 200),
  pertanyaan_samar          text not null,
  jawaban_final             text not null,
  disamarkan_oleh           text not null,
  persetujuan_pemohon       boolean not null default false,
  persetujuan_pemohon_at    timestamptz,
  disetujui_reviewer        boolean not null default false,
  disetujui_reviewer_oleh   text,
  disetujui_reviewer_at     timestamptz,
  disetujui_admin           boolean not null default false,
  disetujui_admin_oleh      text,
  disetujui_admin_at        timestamptz,
  published                 boolean not null default false,
  published_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint ccp_terbit_butuh_persetujuan
    check (published = false or (persetujuan_pemohon and disetujui_reviewer and disetujui_admin)),
  constraint ccp_terbit_butuh_slug check (published = false or slug is not null)
);

-- C2) Riwayat status — append-only (trigger); row dijaga dari manipulasi manual.
create table if not exists public.consultation_status_logs (
  id          bigserial primary key,
  ticket_id   uuid references public.consultation_tickets (id) on delete set null, -- riwayat selamat saat tiket dihapus
  status_lama text not null,
  status_baru text not null,
  oleh        text not null default 'sistem',
  alasan      text,
  at          timestamptz not null default now()
);
create index if not exists consultation_status_logs_tiket_at
  on public.consultation_status_logs (ticket_id, at desc);

-- C3) Audit log — aktor & aksi; append-only; detail minimal (tanpa konten pribadi).
create table if not exists public.consultation_audit_logs (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  aktor       text not null,
  aktor_jenis text not null check (aktor_jenis in ('pemohon','staf','sistem')),
  aksi        text not null,
  ticket_id   uuid references public.consultation_tickets (id) on delete set null,
  detail      jsonb not null default '{}'::jsonb
);
create index if not exists consultation_audit_logs_at on public.consultation_audit_logs (at desc);
create index if not exists consultation_audit_logs_tiket on public.consultation_audit_logs (ticket_id)
  where ticket_id is not null;

-- C4) Antrian notifikasi (email via Resend dari Edge Function; keputusan C4).
create table if not exists public.consultation_notifications (
  id         bigserial primary key,
  ticket_id  uuid references public.consultation_tickets (id) on delete set null,
  saluran    text not null check (saluran in ('email')),
  penerima   text not null,
  perihal    text not null,
  isi        text not null,
  status     text not null default 'menunggu' check (status in ('menunggu','terkirim','gagal','dibatalkan')),
  percobaan  integer not null default 0,
  error      text,
  created_at timestamptz not null default now(),
  terkirim_at timestamptz
);
create index if not exists consultation_notifications_antre
  on public.consultation_notifications (status, created_at) where status = 'menunggu';

-- C5) Hit rate-limit — identitas di-hash (bukan IP mentah); purge berkala
--     adalah tanggung jawab Edge Function (keputusan C2/C7, Phase 2).
create table if not exists public.consultation_rate_hits (
  id       bigserial primary key,
  bucket   text not null,                       -- mis. hash IP / hash (tiket+endpoint)
  endpoint text not null,
  at       timestamptz not null default now()
);
create index if not exists consultation_rate_hits_bucket
  on public.consultation_rate_hits (bucket, endpoint, at desc);

-- ==========================================================================
-- D. FUNGSI SLA: hari kerja (Senin-Jumat, WIB, minus kalender libur)
-- ==========================================================================
create or replace function public.consultation_add_workdays(dari timestamptz, hari_kerja integer)
returns timestamptz
language plpgsql
stable
as $$
declare
  d date := (dari at time zone 'Asia/Jakarta')::date;
  sisa integer := hari_kerja;
begin
  if sisa <= 0 then return dari; end if;
  while sisa > 0 loop
    d := d + 1;
    if extract(isodow from d) < 6
       and not exists (select 1 from public.consultation_holidays h where h.tanggal = d) then
      sisa := sisa - 1;
    end if;
  end loop;
  -- tenggat = akhir hari kerja ke-N (23:59:59 WIB)
  return (d + time '23:59:59') at time zone 'Asia/Jakarta';
end $$;

-- ==========================================================================
-- E. BUCKET STORAGE PRIVAT untuk lampiran
--    (di PGlite/lingkungan uji tanpa storage schema: dilewati dengan notice)
-- ==========================================================================
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('consultation-attachments','consultation-attachments', false, 5242880,
            array['image/jpeg','image/png','image/webp','application/pdf'])
    on conflict (id) do update
      set public = false, file_size_limit = 5242880,
          allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];
  else
    raise notice 'storage.buckets tidak tersedia di lingkungan ini — bucket dibuat saat migrasi produksi';
  end if;
end $$;

-- ==========================================================================
-- F. TRIGGER & FUNGSI TRIGGER
-- ==========================================================================

-- F1) Stempel updated_at generik (staff_roles, contacts, publications)
create or replace function public.consultation_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_consultation_touch_roles on public.consultation_staff_roles;
create trigger trg_consultation_touch_roles before update on public.consultation_staff_roles
  for each row execute function public.consultation_touch();
drop trigger if exists trg_consultation_touch_contacts on public.consultation_requester_contacts;
create trigger trg_consultation_touch_contacts before update on public.consultation_requester_contacts
  for each row execute function public.consultation_touch();
drop trigger if exists trg_consultation_touch_publikasi on public.consultation_publications;
create trigger trg_consultation_touch_publikasi before update on public.consultation_publications
  for each row execute function public.consultation_touch();

-- F2) Tiket: nomor otomatis, penjaga transisi status, mekanisme SLA pause/resume
create or replace function public.consultation_ticket_before()
returns trigger language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- tanpa 0/O/1/I agar tak tertukar
  s     text;
  i     int;
begin
  if tg_op = 'INSERT' then
    -- nomor tiket otomatis (bukan rahasia): KON-YYMMDD-XXXXXX, unik, coba ulang
    if new.nomor_tiket is null or btrim(new.nomor_tiket) = '' then
      loop
        s := '';
        for i in 1..6 loop
          s := s || substr(chars, floor(random() * length(chars))::int + 1, 1);
        end loop;
        new.nomor_tiket := 'KON-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-' || s;
        exit when not exists (select 1 from public.consultation_tickets t where t.nomor_tiket = new.nomor_tiket);
      end loop;
    end if;
    -- kategori harus aktif saat pengajuan
    if not exists (select 1 from public.consultation_categories c where c.id = new.kategori_id and c.aktif) then
      raise exception 'Kategori tidak ditemukan atau tidak aktif';
    end if;
    -- tiket yang langsung diverifikasi saat dibuat: mulai hitung SLA
    if new.sla_deadline is null and new.status in ('diverifikasi','menunggu_penugasan') then
      new.sla_deadline := public.consultation_add_workdays(now(), 3);
    end if;
  else
    -- kolom identitas tidak boleh berubah
    if new.nomor_tiket is distinct from old.nomor_tiket then
      raise exception 'Nomor tiket tidak boleh diubah';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'Waktu pembuatan tiket tidak boleh diubah';
    end if;
    if new.status is distinct from old.status then
      -- transisi harus valid menurut mesin status
      if not public.consultation_can_transition(old.status, new.status) then
        raise exception 'Transisi status tidak valid: % -> %', old.status, new.status;
      end if;
      if old.status = 'menunggu_informasi' then
        -- keluar dari pause hanya boleh ke status asal, dan geser deadline
        if new.status <> old.status_sebelum_pause then
          raise exception 'Keluar dari menunggu informasi hanya ke status sebelumnya (%)',
            coalesce(old.status_sebelum_pause, '(kosong)');
        end if;
        if old.sla_paused_at is null then
          raise exception 'Data jeda SLA tidak lengkap';
        end if;
        if new.sla_deadline is not null then
          new.sla_deadline := new.sla_deadline + (now() - old.sla_paused_at);
        end if;
        new.sla_paused_at := null;
        new.status_sebelum_pause := null;
      elsif new.status = 'menunggu_informasi' then
        -- masuk pause: simpan status asal + waktu mulai jeda (SLA berhenti dihitung)
        new.status_sebelum_pause := old.status;
        new.sla_paused_at := now();
      end if;
      -- mulai SLA saat pertama kali diverifikasi / masuk antrean (target 3 hari kerja)
      if new.sla_deadline is null and new.status in ('diverifikasi','menunggu_penugasan') then
        new.sla_deadline := public.consultation_add_workdays(now(), 3);
      end if;
    elsif (new.sla_paused_at is distinct from old.sla_paused_at)
       or (new.status_sebelum_pause is distinct from old.status_sebelum_pause)
       or (new.sla_deadline is distinct from old.sla_deadline) then
      raise exception 'Kolom SLA/status_sebelum_pause hanya dikelola sistem';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_consultation_ticket_before on public.consultation_tickets;
create trigger trg_consultation_ticket_before
  before insert or update on public.consultation_tickets
  for each row execute function public.consultation_ticket_before();

-- F3) Tiket: log status otomatis (mekanik, append-only) setiap status berubah.
--     Aktor diambil dari JWT (email staf) bila ada; service_role anonim -> 'sistem'.
--     Edge Function dapat mengisi alasan dengan: SET LOCAL app.alasan_status = '...';
create or replace function public.consultation_ticket_status_log()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.consultation_status_logs (ticket_id, status_lama, status_baru, oleh, alasan)
    values (new.id, old.status, new.status,
            lower(coalesce(auth.jwt() ->> 'email', 'sistem')),
            nullif(current_setting('app.alasan_status', true), ''));
  end if;
  return null;
end $$;

drop trigger if exists trg_consultation_ticket_status_log on public.consultation_tickets;
create trigger trg_consultation_ticket_status_log
  after update on public.consultation_tickets
  for each row execute function public.consultation_ticket_status_log();

-- F4) Pesan: validasi pengirim & jenis pesan
create or replace function public.consultation_message_check()
returns trigger language plpgsql as $$
begin
  if new.pengirim_jenis in ('konsultan','reviewer','admin_konsultasi') then
    if new.pengirim_email is null then
      raise exception 'Pengirim staf wajib memiliki email';
    end if;
    new.pengirim_email := lower(new.pengirim_email);
    if not exists (select 1 from public.consultation_staff_roles r
                   where r.email = new.pengirim_email and r.aktif) then
      raise exception 'Pengirim bukan staf konsultasi yang aktif';
    end if;
  elsif new.pengirim_email is not null then
    raise exception 'Pengirim non-staf tidak boleh menyertakan email';
  end if;
  if new.jenis_pesan = 'balasan_pemohon'   and new.pengirim_jenis <> 'pemohon' then
    raise exception 'balasan_pemohon hanya dari pemohon';
  end if;
  if new.jenis_pesan = 'jawaban_konsultan' and new.pengirim_jenis <> 'konsultan' then
    raise exception 'jawaban_konsultan hanya dari konsultan';
  end if;
  if new.jenis_pesan = 'jawaban_final'
     and new.pengirim_jenis not in ('admin_konsultasi','sistem') then
    raise exception 'jawaban_final hanya dari admin konsultasi atau sistem';
  end if;
  if new.jenis_pesan = 'catatan_internal'
     and new.pengirim_jenis not in ('konsultan','reviewer','admin_konsultasi') then
    raise exception 'catatan_internal hanya dari staf konsultasi';
  end if;
  if new.jenis_pesan = 'sistem' and new.pengirim_jenis <> 'sistem' then
    raise exception 'pesan sistem hanya dari sistem';
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_message_check on public.consultation_messages;
create trigger trg_consultation_message_check
  before insert on public.consultation_messages
  for each row execute function public.consultation_message_check();

-- F5) Review: hanya jawaban konsultan; reviewer bukan penulis; tiket harus cocok
create or replace function public.consultation_review_check()
returns trigger language plpgsql as $$
declare m record;
begin
  select pengirim_email, jenis_pesan, ticket_id into m
    from public.consultation_messages where id = new.message_id;
  if m is null then raise exception 'Pesan jawaban tidak ditemukan'; end if;
  if m.jenis_pesan <> 'jawaban_konsultan' then
    raise exception 'Yang dapat direview hanya jawaban konsultan';
  end if;
  if m.ticket_id <> new.ticket_id then
    raise exception 'Review tidak cocok dengan tiket jawaban';
  end if;
  if m.pengirim_email = lower(new.reviewer_email) then
    raise exception 'Reviewer tidak dapat menyetujui jawabannya sendiri';
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_review_check on public.consultation_reviews;
create trigger trg_consultation_review_check
  before insert on public.consultation_reviews
  for each row execute function public.consultation_review_check();

-- F6) Lampiran: pengunggah harus staf konsultasi aktif atau 'pemohon'
create or replace function public.consultation_attachment_check()
returns trigger language plpgsql as $$
begin
  if new.diunggah_oleh <> 'pemohon'
     and not exists (select 1 from public.consultation_staff_roles r
                     where r.email = lower(new.diunggah_oleh) and r.aktif) then
    raise exception 'Pengunggah bukan staf konsultasi yang aktif';
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_attachment_check on public.consultation_attachments;
create trigger trg_consultation_attachment_check
  before insert on public.consultation_attachments
  for each row execute function public.consultation_attachment_check();

-- F7) Append-only: status_logs, audit_logs, messages tidak boleh diubah/dihapus
--     secara langsung. pg_trigger_depth() > 1 mengizinkan efek CASCADE
--     (mis. penghapusan tiket) agar penghapusan data tetap mungkin oleh sistem.
create or replace function public.consultation_append_only()
returns trigger language plpgsql as $$
begin
  if pg_trigger_depth() = 1 then
    raise exception 'Tabel % bersifat append-only — perubahan/hapus manual tidak diizinkan', tg_table_name;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_consultation_statuslog_append on public.consultation_status_logs;
create trigger trg_consultation_statuslog_append
  before update or delete on public.consultation_status_logs
  for each row execute function public.consultation_append_only();
drop trigger if exists trg_consultation_auditlog_append on public.consultation_audit_logs;
create trigger trg_consultation_auditlog_append
  before update or delete on public.consultation_audit_logs
  for each row execute function public.consultation_append_only();
drop trigger if exists trg_consultation_message_append on public.consultation_messages;
create trigger trg_consultation_message_append
  before update or delete on public.consultation_messages
  for each row execute function public.consultation_append_only();

-- F8) Publikasi: stempel waktu terbit diisi sistem sekali
create or replace function public.consultation_publication_before()
returns trigger language plpgsql as $$
begin
  if new.published and not old.published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_publication_before on public.consultation_publications;
create trigger trg_consultation_publication_before
  before update on public.consultation_publications
  for each row execute function public.consultation_publication_before();
