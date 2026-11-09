-- ============================================================
--  MWCNU Pondok Aren — Skema PROFIL ANGGOTA + RLS Supabase
--  Proyek: wvfcifqolohfipvepxss
--  Cara pakai: Supabase Dashboard → SQL Editor → New query →
--  paste SEMUA isi file ini → Run. Idempoten (aman diulang).
--  Catatan: pemakai existing (Google) akan otomatis
--  dibuatkan row profil saat login berikutnya (sudah ada di kode).
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

-- ── 2) RLS aktif ───────────────────────────────────────────
alter table public.profiles enable row level security;

-- ── 3) Kebijakan akses ───────────────────────────────────────
-- Baca: hanya profil miliknya sendiri (admin kelola via role/service key)
drop policy if exists "own read" on public.profiles;
create policy "own read"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Insert: hanya baris miliknya sendiri (auto-buat profil saat daftar)
drop policy if exists "own insert" on public.profiles;
create policy "own insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Update: hanya miliknya sendiri
drop policy if exists "own update" on public.profiles;
create policy "own update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- (Tidak ada policy DELETE — profil tidak boleh dihapus user.)

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

-- ── 5) Fungsi verifikasi NIA (untuk halaman QR /v/{nia}) ───
-- Publik (anon) boleh memanggil; hanya mengembalikan
-- nama + status, tanpa membocorkan kolom lain.
create or replace function public.verify_nia(p_nia text)
returns table(nama text, status text, verified boolean)
language sql
security definer
stable
set search_path = public
as $$
  select pr.nama, pr.status, pr.status = 'verified'
  from public.profiles pr
  where pr.nia = p_nia;
$$;

drop policy if exists "anon verify" on public.profiles;
-- Anon TIDAK diberi SELECT langsung ke tabel.
-- Verifikasi harus lewat fungsi verify_nia() di atas.
grant execute on function public.verify_nia(text) to anon, authenticated;

-- ── 6) Indeks bantu ─────────────────────────────────────────
create index if not exists idx_profiles_nia on public.profiles(nia);
create index if not exists idx_profiles_status on public.profiles(status);

-- ── 7) (Opsional) Backfill profil untuk pengguna existing ──
-- Jalankan SEKALI kalau ingin profil kedua akun Google
-- langsung terisi tanpa menunggu login berikut:
-- insert into public.profiles (id, email, nama)
-- select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
-- from auth.users u
-- on conflict (id) do nothing;
