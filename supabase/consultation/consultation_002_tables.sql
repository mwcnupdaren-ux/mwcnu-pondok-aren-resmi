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

-- A5) Sequence nomor tiket — sumber keunikan yang aman terhadap transaksi
--     bersamaan: nextval() tidak pernah mengembalikan nilai yang sama untuk
--     dua transaksi, sehingga generator tidak pernah gagal akibat benturan
--     (audit C). Nomor = KON-YYMMDD-<kode base-32>; nomor BUKAN rahasia
--     akses (secret akses tetap HMAC-SHA256 di access_credentials).
create sequence if not exists public.consultation_nomor_tiket_seq;

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
  published_at              timestamptz,          -- diisi sistem sekali; tidak dapat dimanipulasi
  dicabut                   boolean not null default false, -- pernah dicabut pemohon
  dicabut_at                timestamptz,          -- waktu pencabutan pertama (riwayat)
  dicabut_alasan            text,
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

-- D2) Waktu sistem dengan seam pengujian: bila GUC sesi 'app.waktu_sistem'
--     di-set, nilai itu dipakai; bila tidak, now(). Dipakai trigger tiket agar
--     skenario kalender SLA dapat diuji di PGlite. Produksi TIDAK mengeset
--     GUC ini; hanya service_role yang dapat memengaruhi perhitungan karena
--     hanya itulah role yang boleh menulis tabel tiket.
create or replace function public.consultation_waktu()
returns timestamptz
language sql
stable
as $$
  select coalesce(nullif(current_setting('app.waktu_sistem', true), '')::timestamptz, now())
$$;

-- D3) Hari kerja yang TERTUTUP penuh oleh interval jeda (audit B):
--     hari kerja d dengan tanggal_jeda < d < tanggal_resume (ketat di antara
--     kedua tanggal — hari jeda dan hari resume sendiri tidak dihitung,
--     karena jam operasional belum ditetapkan; granularitas = level hari).
create or replace function public.consultation_hari_kerja_tertutup(pause_at timestamptz, resume_at timestamptz)
returns integer
language sql
stable
as $$
  select count(*)::int
  from generate_series(
         ((pause_at at time zone 'Asia/Jakarta')::date + 1)::timestamp,
         ((resume_at at time zone 'Asia/Jakarta')::date - 1)::timestamp,
         interval '1 day'
       ) as g(d)
  where extract(isodow from g.d) < 6
    and not exists (select 1 from public.consultation_holidays h where h.tanggal = g.d::date)
$$;

-- D4) Geser tanggal tenggat (yang selalu jatuh pada hari kerja) sebanyak N
--     hari kerja ke depan; hasil selalu EOD (23:59:59 WIB) hari kerja valid —
--     tidak pernah jatuh pada Sabtu/Minggu/libur.
create or replace function public.consultation_shift_deadline(tenggat timestamptz, hari integer)
returns timestamptz
language plpgsql
stable
as $$
declare
  d    date := (tenggat at time zone 'Asia/Jakarta')::date;
  sisa integer := hari;
begin
  if sisa <= 0 then return tenggat; end if;
  while sisa > 0 loop
    d := d + 1;
    if extract(isodow from d) < 6
       and not exists (select 1 from public.consultation_holidays h where h.tanggal = d) then
      sisa := sisa - 1;
    end if;
  end loop;
  return (d + time '23:59:59') at time zone 'Asia/Jakarta';
end $$;

-- D5) Encoder base-32 (alfabet tanpa 0/O/1/I) untuk kode nomor tiket.
--     Mapping bigint -> kode BIJEKTIF: nilai berbeda tidak pernah menghasilkan
--     kode sama, sehingga keunikan nomor = keunikan nilai sequence.
--     Lebar 6 karakter (32^6 = ±1,07 miliar); bila melebihi, otomatis 7+ char.
create or replace function public.consultation_kode_nomor(nilai bigint)
returns text
language plpgsql
immutable
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  s     text := '';
  n     bigint := nilai;
begin
  if n is null or n < 0 then raise exception 'Nilai kode nomor tidak valid'; end if;
  loop
    s := substr(chars, (n % 32)::int + 1, 1) || s;
    n := n / 32;
    exit when n = 0;
  end loop;
  if length(s) >= 6 then return s; end if;  -- jangan memotong (lpad memotong!)
  return lpad(s, 6, 'A');
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
  covered integer;          -- hari kerja yang tertutup penuh oleh jeda
  v_deadline_diubah boolean;
  v_jeda_diubah    boolean;
begin
  if tg_op = 'INSERT' then
    -- Nomor tiket WAJIB dibuat oleh sistem dari sequence (audit lanjutan A):
    -- pemanggil tidak boleh menentukan nomor sendiri.
    if new.nomor_tiket is not null and btrim(new.nomor_tiket) <> '' then
      raise exception 'Nomor tiket wajib dibuat oleh sistem (sequence)';
    end if;
    new.nomor_tiket := 'KON-'
      || to_char(public.consultation_waktu() at time zone 'Asia/Jakarta', 'YYMMDD')
      || '-' || public.consultation_kode_nomor(nextval('public.consultation_nomor_tiket_seq')::bigint);
    -- Status awal wajib 'baru' dan kolom SLA/jeda wajib kosong (audit lanjutan B).
    if new.status <> 'baru' then
      raise exception 'Tiket baru wajib dimulai dengan status baru';
    end if;
    if new.sla_deadline is not null or new.sla_paused_at is not null
       or new.status_sebelum_pause is not null then
      raise exception 'Kolom SLA/jeda wajib kosong saat pengajuan';
    end if;
    -- kategori harus aktif saat pengajuan
    if not exists (select 1 from public.consultation_categories c where c.id = new.kategori_id and c.aktif) then
      raise exception 'Kategori tidak ditemukan atau tidak aktif';
    end if;
  else
    -- kolom identitas tidak boleh berubah
    if new.nomor_tiket is distinct from old.nomor_tiket then
      raise exception 'Nomor tiket tidak boleh diubah';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'Waktu pembuatan tiket tidak boleh diubah';
    end if;

    -- Perlindungan SLA di SETIAP UPDATE (audit lanjutan C): perubahan status
    -- tidak boleh menjadi jalan memanipulasi kolom SLA.
    v_deadline_diubah := new.sla_deadline is distinct from old.sla_deadline;
    v_jeda_diubah := (new.sla_paused_at is distinct from old.sla_paused_at)
                  or (new.status_sebelum_pause is distinct from old.status_sebelum_pause);

    if new.status is distinct from old.status then
      -- transisi harus valid menurut mesin status
      if not public.consultation_can_transition(old.status, new.status) then
        raise exception 'Transisi status tidak valid: % -> %', old.status, new.status;
      end if;
      if old.status = 'menunggu_informasi' then
        -- keluar dari pause hanya boleh ke status asal
        if new.status <> old.status_sebelum_pause then
          raise exception 'Keluar dari menunggu informasi hanya ke status sebelumnya (%)',
            coalesce(old.status_sebelum_pause, '(kosong)');
        end if;
        if old.sla_paused_at is null then
          raise exception 'Data jeda SLA tidak lengkap';
        end if;
        -- manipulasi tenggat lewat perubahan status ditolak
        if v_deadline_diubah then
          raise exception 'Kolom SLA/status_sebelum_pause hanya dikelola sistem';
        end if;
        -- Jeda TIDAK memakan jatah pemohon (audit B): hanya hari kerja yang
        -- tertutup penuh oleh jeda (level tanggal, ketat di antara hari jeda
        -- dan hari resume) yang menggeser tanggal tenggat. Hasil selalu EOD
        -- hari kerja valid — bukan penambahan durasi kalender mentah.
        covered := public.consultation_hari_kerja_tertutup(old.sla_paused_at, public.consultation_waktu());
        if covered > 0 and new.sla_deadline is not null then
          new.sla_deadline := public.consultation_shift_deadline(new.sla_deadline, covered);
        end if;
        -- jatah minimal: saat resume, tenggat tidak boleh sudah lewat
        if new.sla_deadline is null or new.sla_deadline <= public.consultation_waktu() then
          new.sla_deadline := public.consultation_add_workdays(public.consultation_waktu(), 1);
        end if;
        new.sla_paused_at := null;
        new.status_sebelum_pause := null;
      elsif new.status = 'menunggu_informasi' then
        -- masuk pause: tenggat tidak boleh disentuh pemanggil; kolom jeda
        -- diisi sistem (nilai yang dikirim pemanggil ditimpa, bukan dipercaya)
        if v_deadline_diubah then
          raise exception 'Kolom SLA/status_sebelum_pause hanya dikelola sistem';
        end if;
        new.status_sebelum_pause := old.status;
        new.sla_paused_at := public.consultation_waktu();
      else
        -- transisi biasa: seluruh kolom SLA wajib tidak tersentuh pemanggil
        if v_deadline_diubah or v_jeda_diubah then
          raise exception 'Kolom SLA/status_sebelum_pause hanya dikelola sistem';
        end if;
      end if;
      -- mulai SLA saat pertama kali diverifikasi / masuk antrean (target 3 hari kerja)
      if new.sla_deadline is null and new.status in ('diverifikasi','menunggu_penugasan') then
        new.sla_deadline := public.consultation_add_workdays(public.consultation_waktu(), 3);
      end if;
    elsif v_deadline_diubah or v_jeda_diubah then
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
  -- Identitas pengirim harus cocok dengan role yang DIKLAIM (audit D):
  -- nilai pengirim_jenis identik dengan nilai role_konsultasi yang sah,
  -- dan role tersebut harus aktif. Konsultan tidak dapat menyamar sebagai
  -- reviewer/admin, dan sebaliknya.
  if new.pengirim_jenis in ('konsultan','reviewer','admin_konsultasi') then
    if new.pengirim_email is null then
      raise exception 'Pengirim staf wajib memiliki email';
    end if;
    new.pengirim_email := lower(new.pengirim_email);
    if not exists (select 1 from public.consultation_staff_roles r
                   where r.email = new.pengirim_email
                     and r.role_konsultasi = new.pengirim_jenis
                     and r.aktif) then
      raise exception 'Pengirim tidak memiliki role % yang aktif', new.pengirim_jenis;
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
  -- Reviewer wajib ber-role reviewer DAN aktif (audit E): FK komposit hanya
  -- menjamin keberadaan baris role, bukan status aktifnya.
  if not exists (select 1 from public.consultation_staff_roles r
                 where r.email = lower(new.reviewer_email)
                   and r.role_konsultasi = 'reviewer' and r.aktif) then
    raise exception 'Reviewer harus ber-role reviewer dan aktif';
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_review_check on public.consultation_reviews;
create trigger trg_consultation_review_check
  before insert on public.consultation_reviews
  for each row execute function public.consultation_review_check();

-- F6) Lampiran: pengunggah harus staf konsultasi aktif atau 'pemohon', dan
--     lampiran wajib merujuk pesan pada TIKET YANG SAMA (audit lanjutan E).
--     Validasi memakai trigger (bukan FK komposit + SET NULL) karena
--     penghapusan pesan menyetel message_id = NULL tanpa mengubah ticket_id.
create or replace function public.consultation_attachment_check()
returns trigger language plpgsql as $$
declare tiket_pesan uuid;
begin
  if new.diunggah_oleh <> 'pemohon'
     and not exists (select 1 from public.consultation_staff_roles r
                     where r.email = lower(new.diunggah_oleh) and r.aktif) then
    raise exception 'Pengunggah bukan staf konsultasi yang aktif';
  end if;
  if new.message_id is not null then
    select ticket_id into tiket_pesan from public.consultation_messages where id = new.message_id;
    if tiket_pesan is distinct from new.ticket_id then
      raise exception 'Lampiran tidak cocok dengan tiket pesan yang dirujuk';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_attachment_check on public.consultation_attachments;
create trigger trg_consultation_attachment_check
  before insert or update on public.consultation_attachments
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

-- F8) Publikasi: stempel waktu terbit diisi sistem sekali — nilai yang dikirim
--     pemanggil SELALU ditimpa (audit lanjutan D); penerbitan ulang setelah
--     pencabutan mempertahankan waktu terbit pertama (published_at abadi).
create or replace function public.consultation_publication_before()
returns trigger language plpgsql as $$
begin
  if new.published and not old.published then
    new.published_at := coalesce(old.published_at, now());
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_publication_before on public.consultation_publications;
create trigger trg_consultation_publication_before
  before update on public.consultation_publications
  for each row execute function public.consultation_publication_before();

-- F9) Penugasan: konsultan wajib ber-role konsultan DAN aktif saat menerima
--     penugasan baru (audit E). FK komposit hanya menjamin keberadaan baris
--     role, bukan status aktifnya.
create or replace function public.consultation_assignment_check()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.consultation_staff_roles r
                 where r.email = lower(new.konsultan_email)
                   and r.role_konsultasi = 'konsultan' and r.aktif) then
    raise exception 'Konsultan harus ber-role konsultan dan aktif';
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_assignment_check on public.consultation_assignments;
create trigger trg_consultation_assignment_check
  before insert on public.consultation_assignments
  for each row execute function public.consultation_assignment_check();

-- F10) Publikasi: verifikasi KEWENANGAN ketiga persetujuan (audit F) —
--      nilai boolean true saja BUKAN bukti otorisasi:
--        * pemohon : harus konsisten dengan persetujuan_publikasi pada
--                    consultation_requester_contacts tiket yang sama + waktu;
--        * reviewer: email staf ber-role reviewer aktif + waktu;
--        * admin   : email staf ber-role admin_konsultasi aktif + waktu;
--        * nilai false wajib "bersih" (tanpa identitas/waktu) agar tidak ada
--          sisa persetujuan yang menyesatkan.
--      Aturan terbit (3 persetujuan + slug) tetap pada constraint ccp_*.
--      Tambahan audit lanjutan D:
--        * published_at dilindungi: INSERT wajib tanpa published_at (diisi
--          sistem saat terbit pertama); UPDATE tidak boleh mengubah/mengosong-
--          kan kecuali transisi terbit pertama yang nilainya ditetapkan sistem;
--        * waktu persetujuan pemohon tidak boleh mendahului waktu persetujuan
--          pada data kontak;
--        * setelah pencabutan (dicabut_at terisi), seluruh persetujuan wajib
--          DIPERBARUI (timestamp >= dicabut_at) sebelum penerbitan ulang.
create or replace function public.consultation_publication_check()
returns trigger language plpgsql as $$
declare kontak record;
begin
  if tg_op = 'INSERT' then
    if new.published_at is not null then
      raise exception 'published_at hanya dikelola sistem (diisi saat terbit pertama)';
    end if;
  else
    -- perubahan/penyanjangan published_at di luar transisi terbit pertama
    -- ditolak (transisi terbit ditangani trigger publication_before yang
    -- selalu menimpa nilai pemanggil)
    if new.published_at is distinct from old.published_at
       and not (not old.published and new.published) then
      raise exception 'published_at hanya dikelola sistem (diisi saat terbit pertama)';
    end if;
  end if;

  if new.persetujuan_pemohon then
    select c.persetujuan_publikasi, c.persetujuan_publikasi_at into kontak
      from public.consultation_requester_contacts c where c.ticket_id = new.ticket_id;
    if kontak is null or kontak.persetujuan_publikasi is distinct from true then
      raise exception 'Persetujuan pemohon belum tercatat pada data kontak tiket';
    end if;
    if new.persetujuan_pemohon_at is null then
      raise exception 'Persetujuan pemohon wajib menyertakan waktu';
    end if;
    -- setelah pencabutan, persetujuan kontak wajib diperbarui
    if old.dicabut_at is not null and kontak.persetujuan_publikasi_at < old.dicabut_at then
      raise exception 'Persetujuan pemohon/kontak wajib diperbarui setelah pencabutan';
    end if;
    -- persetujuan pemohon tidak boleh mendahului persetujuan pada kontak
    if new.persetujuan_pemohon_at < kontak.persetujuan_publikasi_at then
      raise exception 'Persetujuan pemohon mendahului persetujuan pada data kontak';
    end if;
  elsif new.persetujuan_pemohon_at is not null then
    raise exception 'Persetujuan pemohon bernilai false tetapi waktu terisi';
  end if;

  if new.disetujui_reviewer then
    if new.disetujui_reviewer_oleh is null or new.disetujui_reviewer_at is null then
      raise exception 'Persetujuan reviewer wajib menyertakan identitas dan waktu';
    end if;
    if not exists (select 1 from public.consultation_staff_roles r
                   where r.email = lower(new.disetujui_reviewer_oleh)
                     and r.role_konsultasi = 'reviewer' and r.aktif) then
      raise exception 'Penyetuju reviewer tidak memiliki role reviewer yang aktif';
    end if;
    if old.dicabut_at is not null and new.disetujui_reviewer_at < old.dicabut_at then
      raise exception 'Persetujuan reviewer wajib diperbarui setelah pencabutan';
    end if;
  elsif new.disetujui_reviewer_oleh is not null or new.disetujui_reviewer_at is not null then
    raise exception 'Persetujuan reviewer bernilai false tetapi identitas/waktu terisi';
  end if;

  if new.disetujui_admin then
    if new.disetujui_admin_oleh is null or new.disetujui_admin_at is null then
      raise exception 'Persetujuan admin wajib menyertakan identitas dan waktu';
    end if;
    if not exists (select 1 from public.consultation_staff_roles r
                   where r.email = lower(new.disetujui_admin_oleh)
                     and r.role_konsultasi = 'admin_konsultasi' and r.aktif) then
      raise exception 'Penyetuju admin tidak memiliki role admin_konsultasi yang aktif';
    end if;
    if old.dicabut_at is not null and new.disetujui_admin_at < old.dicabut_at then
      raise exception 'Persetujuan admin wajib diperbarui setelah pencabutan';
    end if;
  elsif new.disetujui_admin_oleh is not null or new.disetujui_admin_at is not null then
    raise exception 'Persetujuan admin bernilai false tetapi identitas/waktu terisi';
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_publication_check on public.consultation_publications;
create trigger trg_consultation_publication_check
  before insert or update on public.consultation_publications
  for each row execute function public.consultation_publication_check();

-- F11) Pencabutan persetujuan publikasi oleh pemohon (audit lanjutan D):
--      waktu persetujuan wajib konsisten dengan boolean pada kontak; bila
--      persetujuan kontak ditarik (true -> false) sementara publikasi masih
--      menyertakan persetujuan pemohon / masih terbit, sistem MEMAKSA
--      pembatalan terbit (unpublish) dan mencatat pencabutan pada publikasi —
--      tidak ada publikasi aktif yang bertahan tanpa persetujuan yang sah.
create or replace function public.consultation_consent_check()
returns trigger language plpgsql as $$
begin
  -- waktu persetujuan wajib konsisten dengan nilai boolean
  if new.persetujuan_publikasi and new.persetujuan_publikasi_at is null then
    raise exception 'Persetujuan publikasi wajib menyertakan waktu';
  end if;
  if not new.persetujuan_publikasi and new.persetujuan_publikasi_at is not null then
    raise exception 'Persetujuan publikasi bernilai false tetapi waktu terisi';
  end if;
  if tg_op = 'UPDATE' and old.persetujuan_publikasi and not new.persetujuan_publikasi then
    update public.consultation_publications
       set published = false,
           persetujuan_pemohon = false,
           persetujuan_pemohon_at = null,
           dicabut = true,
           dicabut_at = now(),
           dicabut_alasan = coalesce(dicabut_alasan, 'Persetujuan publikasi dicabut pemohon')
     where ticket_id = new.ticket_id
       and (published or persetujuan_pemohon);
  end if;
  return new;
end $$;

drop trigger if exists trg_consultation_consent_check on public.consultation_requester_contacts;
create trigger trg_consultation_consent_check
  after insert or update on public.consultation_requester_contacts
  for each row execute function public.consultation_consent_check();

-- F12) Review append-only (audit lanjutan F): keputusan review TIDAK boleh
--      diubah atau dihapus — setiap tinjauan tercatat permanen. UPDATE dan
--      DELETE manual ditolak (efek CASCADE via penghapusan tiket tetap
--      diizinkan melalui pg_trigger_depth() > 1).
drop trigger if exists trg_consultation_review_append on public.consultation_reviews;
create trigger trg_consultation_review_append
  before update or delete on public.consultation_reviews
  for each row execute function public.consultation_append_only();
