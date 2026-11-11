-- ============================================================
--  MWCNU Pondok Aren — Skema PROFIL ANGGOTA + RLS Supabase
--  Proyek: wvfcifqolohfipvepxss
--  Cara pakai: Supabase Dashboard → SQL Editor → New query →
--  paste SEMUA isi file ini → Run. Idempoten (aman diulang).
--
--  Perubahan 2026-11-11 (audit AUDIT-KTA.md):
--   • NIA diterbitkan SERVER (issue_nia), tidak lagi acak di browser.
--   • Klien tidak boleh menulis nia/status (guard trigger + RLS).
--   • Pengurus ranting (staff.prnu) boleh memverifikasi anggotanya.
--   • verify_nia mengembalikan inisial + wilayah, bukan nama penuh.
--   • Perubahan profil tercatat di change_log.
-- ============================================================

-- ── 1) Tabel profil ────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  nama          text,
  hp            text,
  nia           text unique,
  wadah         text,
  tingkat       text,
  ranting       text,
  alamat        text,
  tempat_lahir  text,
  tanggal_lahir date,
  jk            text,
  pekerjaan     text,
  status        text not null default 'pending'
                check (status in ('pending','verified','rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Kolom tambahan (aman diulang pada tabel yang sudah ada)
alter table public.profiles add column if not exists issued_at   timestamptz;
alter table public.profiles add column if not exists signers     jsonb;
alter table public.profiles add column if not exists verified_by text;
alter table public.profiles add column if not exists verified_at timestamptz;

-- ── 2) RLS aktif ───────────────────────────────────────────
alter table public.profiles enable row level security;

-- ── 3) Kebijakan akses ───────────────────────────────────────
-- Baca: hanya profil miliknya sendiri (admin/pengurus via policy di 3b)
drop policy if exists "own read" on public.profiles;
create policy "own read"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Email harus sudah dikonfirmasi di Supabase Auth sebelum profil dapat dibuat.
create or replace function public.member_email_confirmed()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null)
$$;
revoke all on function public.member_email_confirmed() from public, anon;
grant execute on function public.member_email_confirmed() to authenticated;

-- Insert: hanya baris miliknya sendiri, dan TIDAK boleh mengisi nia/status.
drop policy if exists "own insert" on public.profiles;
create policy "own insert"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and nia is null
    and status = 'pending'
    and public.member_email_confirmed()
  );

-- Update diri: hanya selama belum terbit NIA & belum diverifikasi.
-- Status hanya diperbarui oleh staff, ditentukan oleh policy RLS di bawah.
-- NIA/status juga diperiksa trigger guard_profile().
drop policy if exists "own update" on public.profiles;
create policy "own update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id and nia is null and status = 'pending')
  with check (auth.uid() = id and nia is null and status = 'pending');

-- Batasi hak tulis kolom sensitif. Tidak ada hak UPDATE tabel secara umum.
revoke insert, update on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, email, nama, hp, wadah, tingkat, ranting, alamat, tempat_lahir,
              tanggal_lahir, jk, pekerjaan) on public.profiles to authenticated;
grant update (nama, hp, wadah, tingkat, ranting, alamat, tempat_lahir,
              tanggal_lahir, jk, pekerjaan) on public.profiles to authenticated;
-- Kolom `status` sengaja TIDAK di-grant ke user biasa: status hanya diubah
-- pengurus (staff update members) atau server (issue_nia / guard_profile).

-- (Tidak ada policy DELETE — profil tidak boleh dihapus user.)

-- ── 3b) Pengurus boleh kelola profil di wilayahnya ─────────
-- staff.prnu wajib diisi untuk Pengurus; NULL hanya berlaku bagi Admin MWC.
-- Pastikan akun pengurus memang terdaftar di public.staff sebelum menjalankan migrasi.
-- CATATAN: file ini bergantung pada tabel/fungsi dari supabase/schema.sql
-- (public.staff, public.is_admin, public.change_log) — jalankan schema.sql DULU.
alter table public.staff add column if not exists prnu text;

-- Kode ranting dari data profil: '00' = MWCNU, '01'..'11' = PRNU (urutan RT di app.js)
-- Pencocokan tidak peka huruf besar/kecil dan trim spasi, agar isian seperti
-- 'prnu' atau 'pondok karya' tidak salah dipetakan ke MWC ('00').
create or replace function public.profile_prnu(p_tingkat text, p_ranting text)
returns text
language sql immutable
as $$
  select case
    when upper(coalesce(p_tingkat,'')) <> 'PRNU' then '00'
    else (
      select lpad(i::text, 2, '0')
      from unnest(array['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung',
                        'Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat',
                        'Pondok Kacang Timur','Parigi Baru','Parigi Lama']) with ordinality as t(nama, i)
      where lower(nama) = lower(coalesce(trim(p_ranting),''))
    )
  end
$$;

create or replace function public.verifies(p_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    join public.profiles pr on pr.id = p_id
    where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and (s.role = 'super_admin' or
           (s.role = 'pengurus' and s.prnu is not null and s.prnu = public.profile_prnu(pr.tingkat, pr.ranting)))
  )
$$;

create or replace function public.is_profile_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.staff s
    where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and s.role in ('super_admin','pengurus'))
$$;

drop policy if exists "staff manage" on public.profiles;
drop policy if exists "staff read members" on public.profiles;
drop policy if exists "staff update members" on public.profiles;
create policy "staff read members"
  on public.profiles for select
  to authenticated
  using (public.verifies(id) or (public.is_admin() and public.is_profile_manager()));
create policy "staff update members"
  on public.profiles for update
  to authenticated
  using (public.verifies(id) or (public.is_admin() and public.is_profile_manager()))
  with check (public.verifies(id) or (public.is_admin() and public.is_profile_manager()));

-- Delete profil tidak diberikan ke pengguna melalui policy.

-- Grant table access for the profile API. Column grants above protect sensitive fields.
grant select on public.profiles to authenticated;
grant execute on function public.verifies(uuid), public.profile_prnu(text,text), public.is_profile_manager() to authenticated;

-- Akses staff dikelola oleh RLS dan grants dari supabase/schema.sql.

-- ── 4) updated_at otomatis ─────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── 4b) Guard: nia & status hanya boleh diubah server/pengurus ──
create or replace function public.guard_profile()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  privileged boolean := public.is_admin() or auth.role() = 'service_role';
  manager boolean;
begin
  if tg_op = 'INSERT' then
    if not privileged then
      if not public.member_email_confirmed() then raise exception 'Email belum diverifikasi'; end if;
      new.nia := null;
      new.status := 'pending';
      new.verified_by := null;
      new.verified_at := null;
    else
      if new.nia is not null and new.status <> 'verified' then raise exception 'NIA hanya untuk profil terverifikasi'; end if;
      if new.nia is not null and new.issued_at is null then new.issued_at := now(); end if;
    end if;
    return new;
  end if;

  manager := privileged or public.verifies(old.id);
  if new.nia is distinct from old.nia and not (manager and old.status = 'verified' and old.nia is null) then
    raise exception 'NIA hanya dapat diterbitkan sekali untuk anggota terverifikasi';
  end if;

  if new.status is distinct from old.status
     and not (privileged or public.verifies(old.id)) then
    raise exception 'Status verifikasi hanya dapat diubah pengurus';
  end if;

  if new.status is distinct from old.status then
    if not manager then raise exception 'Status verifikasi hanya dapat diubah pengurus'; end if;
    new.verified_by := lower(coalesce(auth.jwt() ->> 'email', current_user));
    new.verified_at := now();
  end if;

  if new.nia is distinct from old.nia and new.nia is not null then
    if not manager then raise exception 'Hanya pengurus wilayah yang dapat menerbitkan NIA'; end if;
    if new.status <> 'verified' then raise exception 'Profil belum diverifikasi'; end if;
    if new.issued_at is null then new.issued_at := now(); end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile on public.profiles;
create trigger trg_guard_profile
  before insert or update on public.profiles
  for each row execute function public.guard_profile();

-- ── 4c) Riwayat perubahan profil (siapa memverifikasi siapa) ──
create or replace function public.log_profile()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare r record;
begin
  if tg_op = 'DELETE' then
    if auth.uid() is null then
      insert into public.change_log(who, tabel, aksi, jenis, ref, ringkas)
      values ('service_role', 'profiles', tg_op, 'anggota', old.id::text,
              left(coalesce(old.nama, old.email, '') || ' · ' || coalesce(old.status, ''), 120));
      return old;
    end if;
    insert into public.change_log(who, tabel, aksi, jenis, ref, ringkas)
    values (lower(coalesce(auth.jwt() ->> 'email', current_user)), 'profiles', tg_op, 'anggota', old.id::text,
            left(coalesce(old.nama, old.email, '') || ' · ' || coalesce(old.status, ''), 120));
    return old;
  end if;
  if auth.uid() is null then
    insert into public.change_log(who, tabel, aksi, jenis, ref, ringkas)
    values ('service_role', 'profiles', tg_op, 'anggota', new.id::text,
            left(coalesce(new.nama, new.email, '') || ' · ' || coalesce(new.status, '') ||
                 case when new.nia is not null then ' · ' || new.nia else '' end, 120));
    return new;
  end if;
  insert into public.change_log(who, tabel, aksi, jenis, ref, ringkas)
  values (lower(coalesce(auth.jwt() ->> 'email', current_user)), 'profiles', tg_op, 'anggota', new.id::text,
          left(coalesce(new.nama, new.email, '') || ' · ' || coalesce(new.status, '') ||
               case when new.nia is not null then ' · ' || new.nia else '' end, 120));
  return new;
end;
$$;

drop trigger if exists trg_log_profiles on public.profiles;
create trigger trg_log_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.log_profile();

-- ── 5) Penerbitan NIA (SERVER SAJA) ────────────────────────
-- Nomor urut per (kode wilayah, tahun terbit). Atomik lewat upsert.
create table if not exists public.nia_seq (
  scope text primary key,          -- contoh: '01-26'
  n     integer not null default 0
);
alter table public.nia_seq enable row level security;   -- tanpa policy = tertutup

-- Angka cek Mod-10 bobot 3/1 dari kanan — HARUS sama dengan
-- cd() di js/app.js dan verifikasi.html.
create or replace function public.nia_check(p_body text)
returns integer
language sql immutable
as $$
  select (10 - (sum(substr(p_body, g.i, 1)::int *
          case when (length(p_body) - g.i) % 2 = 1 then 3 else 1 end) % 10)) % 10
  from generate_series(1, length(p_body)) as g(i)
$$;

-- Terbitkan NIA untuk profil terverifikasi. Hanya issue_nia_verified yang di-grant
-- ke authenticated; fungsi ini sendiri tidak dapat dipanggil langsung oleh klien.
-- Mengembalikan NIA yang sudah ada bila profil sudah punya NIA.
create or replace function public.issue_nia(p_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  r record; sc text; n integer; body text; digits text;
begin
  if not (public.is_admin() or public.verifies(p_id) or auth.role() = 'service_role') then
    raise exception 'Hanya pengurus wilayah yang dapat menerbitkan NIA';
  end if;

  select * into r from public.profiles where id = p_id for update; 
  if not found then raise exception 'Profil tidak ditemukan'; end if;
  if r.nia is not null then return r.nia; end if;
  if r.status <> 'verified' then raise exception 'Profil belum diverifikasi pengurus'; end if;

  sc := public.profile_prnu(r.tingkat, r.ranting);
  if sc is null then raise exception 'Ranting anggota tidak valid'; end if;
  sc := sc || '-' ||
        to_char(coalesce(r.issued_at, now()), 'YY');

  insert into public.nia_seq(scope, n) values (sc, 1)
    on conflict (scope) do update set n = public.nia_seq.n + 1
    returning n into n;

  body := sc || '-' || lpad(n::text, 6, '0');
  digits := replace(body, '-', '');

  update public.profiles
     set nia = 'MWC-' || body || '-' || public.nia_check(digits),
         issued_at = coalesce(issued_at, now())
   where id = p_id
   returning nia into body;

  return body;
end;
$$;

revoke all on function public.issue_nia(uuid) from public, anon, authenticated;
-- SECURITY DEFINER issue_nia_verified (owner postgres) dapat memanggilnya.
-- Jangan pernah beri grant UPDATE nia ke anon/authenticated.

-- Terbitkan NIA untuk profil yang sudah diverifikasi tapi belum bernomor.
-- Pemeriksaan wilayah dilakukan di issue_nia() dan trigger guard_profile().
create or replace function public.issue_nia_verified(p_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare st text;
begin
  select status into st from public.profiles where id = p_id;
  if not found then raise exception 'Profil tidak ditemukan'; end if;
  if st <> 'verified' then raise exception 'Profil belum diverifikasi pengurus'; end if;
  return public.issue_nia(p_id);
end;
$$;
revoke all on function public.issue_nia_verified(uuid) from public, anon;
grant execute on function public.issue_nia_verified(uuid) to authenticated;

-- Fungsi SECURITY DEFINER diberi hak UPDATE yang diperlukan untuk menerbitkan NIA.
grant update (nia, issued_at) on public.profiles to postgres, service_role;

-- ── 6) Fungsi verifikasi NIA (untuk halaman QR /v/{nia}) ───
-- Publik (anon) boleh memanggil. ANTI-ENUMERASI: hanya kartu berstatus
-- 'verified' yang dibalas data (nama inisial + wilayah). Nomor yang belum
-- terverifikasi, ditolak, atau tidak ada sama-sama mengembalikan baris kosong,
-- sehingga pihak luar tidak bisa memetakan nomor mana yang terdaftar.
-- NIA diterbitkan berurutan per wilayah/tahun, jadi batasan ini penting.
-- Saran tambahan: aktifkan rate limit (Dashboard → Authentication → Rate
-- Limits / Edge Function) di depan RPC ini.
drop function if exists public.verify_nia(text);
create or replace function public.verify_nia(p_nia text)
returns table(nama text, wilayah text, status text, verified boolean)
language sql
security definer
stable
set search_path = public
as $$
  select
    case
      when pr.nama is null or pr.nama = '' then null
      else split_part(pr.nama, ' ', 1) ||
           case when array_length(regexp_split_to_array(trim(pr.nama), '\s+'), 1) > 1
                then ' ' || left(split_part(trim(pr.nama), ' ', 2), 1) || '.' else '' end
    end,
    case when public.profile_prnu(pr.tingkat, pr.ranting) = '00'
         then 'MWCNU Kec. Pondok Aren'
         else 'PRNU ' || coalesce(pr.ranting, '-') end,
    pr.status,
    pr.status = 'verified'
  from public.profiles pr
  where pr.nia = upper(trim(p_nia))   -- NIA selalu tersimpan huruf besar; sama dengan idx_profiles_nia
    and pr.status = 'verified';
$$;

-- Anon TIDAK diberi SELECT langsung ke tabel.
-- Verifikasi harus lewat fungsi verify_nia() di atas.
revoke all on function public.verify_nia(text) from public, anon, authenticated;
grant execute on function public.verify_nia(text) to anon, authenticated;

-- ── 7) Indeks bantu ─────────────────────────────────────────
create index if not exists idx_profiles_nia on public.profiles(nia);
create index if not exists idx_profiles_status on public.profiles(status);

-- ── 8) (Opsional) Backfill profil untuk pengguna existing ──
-- Jalankan SEKALI kalau ingin profil akun lama langsung terisi:
-- insert into public.profiles (id, email, nama)
-- select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
-- from auth.users u
-- on conflict (id) do nothing;

-- ── 9) (Opsional) Terbitkan NIA untuk profil lama yang belum punya ──
-- Jalankan di SQL Editor (auth.role() = 'service_role').
-- select public.issue_nia(id) from public.profiles where nia is null order by created_at;
--
-- CATATAN MIGRASI: NIA lama yang dibuat browser (acak) TIDAK dihapus otomatis.
-- Periksa dulu:  select nia, nama, status from public.profiles order by created_at;
-- NIA lama yang sudah tercetak tetap dipertahankan; yang belum tercetak sebaiknya
-- dikosongkan lalu diterbitkan ulang:  update public.profiles set nia = null where ...;
