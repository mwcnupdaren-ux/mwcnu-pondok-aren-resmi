-- =====================================================================
-- MWCNU Pondok Aren: skema CMS (Supabase / PostgreSQL)
-- Jalankan di Supabase: SQL Editor > New query > tempel seluruh berkas ini > Run.
-- Aman dijalankan ulang (idempoten).
-- =====================================================================

-- 1) PENGELOLA (siapa yang boleh masuk /admin) -------------------------
create table if not exists public.staff (
  email      text primary key check (email = lower(email)),
  role       text not null,
  nama       text,
  created_at timestamptz not null default now()
);

-- Migrasi role lama, aman dijalankan ulang dan hanya upgrade admin/editor lama.
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff drop constraint if exists staff_role_allowed;
update public.staff set role = case role when 'admin' then 'super_admin' when 'editor' then 'pengurus' else role end;
alter table public.staff add constraint staff_role_allowed check (role in ('super_admin','pengurus','jurnalis','ustadz'));

-- Peran pengguna yang sedang login (berdasarkan email akun Google-nya)
create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff
  where email = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$ select public.staff_role() is not null $$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$ select public.staff_role() = 'super_admin' $$;

-- Super admin: semua. Pengurus: operasi harian selain Tanya Jawab. Jurnalis: Literasi/Opini.
-- Ustadz: hanya Tanya Jawab. Pembatasan ini ditegakkan di RLS, bukan hanya UI admin.
create or replace function public.can_edit(t text, d jsonb default '{}'::jsonb) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.staff_role()
    when 'super_admin' then true
    when 'pengurus' then (t = 'berita' and coalesce(d ->> 'kategori','Berita') in ('Berita','Laporan','Literasi','Opini')) or t in ('agenda','video','galeri','kegiatan','majelis','penulis')
    when 'jurnalis' then t = 'berita' and coalesce(d ->> 'kategori','') in ('Literasi','Opini')
    when 'ustadz' then t = 'tanya_jawab'
    else false end
$$;
create or replace function public.can_review(t text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.staff_role() = 'super_admin' or (public.staff_role() = 'pengurus' and t = 'berita')
$$;

-- Fungsi pembantu RLS tidak dieksekusi langsung dari luar; batasi haknya
-- dan berikan hanya ke peran yang memang menjalankan query (anon/authenticated),
-- mengikuti pola member_email_confirmed() di supabase-profiles.sql.
revoke all on function
  public.staff_role(), public.is_staff(), public.is_admin(),
  public.can_edit(text, jsonb), public.can_review(text)
from public, anon, authenticated;
grant execute on function
  public.staff_role(), public.is_staff(), public.is_admin(),
  public.can_edit(text, jsonb), public.can_review(text)
  to anon, authenticated, service_role;

-- 2) PENGATURAN SITUS (satu baris per kunci) ---------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 3) KONTEN BERDAFTAR (berita, agenda, video, galeri, dst.) -------------
create table if not exists public.content_items (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type ~ '^[a-z_]{2,30}$'),
  data       jsonb not null default '{}'::jsonb,
  sort       integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);
alter table public.content_items add column if not exists created_by text;
alter table public.content_items add column if not exists updated_by text;
create index if not exists content_items_type_sort on public.content_items (type, sort, created_at);

-- 3b) PROFIL PENULIS (tabel tersendiri) --------------------------------
-- Identitas penulis disimpan di tabel sendiri, bukan sebagai konten JSON.
-- Alasan: satu akun hanya boleh punya satu profil (dijamin unique index),
-- dan aturan "hanya pemilik yang boleh mengubah" bisa ditegakkan tepat.
-- Artikel menautkan profil lewat content_items.data.penulis_id (uuid).
create table if not exists public.author_profiles (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique check (email = lower(email)),
  nama        text not null default '',
  foto        text not null default '',
  bidang      text not null default '',
  pendidikan  text not null default '',
  pengalaman  text not null default '',   -- satu baris satu butir
  bio         text not null default '',
  kontak      text not null default '',
  published   boolean not null default false,  -- hanya true yang tampil publik
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.author_profiles is 'Profil publik penulis artikel. Satu baris per akun staf. Hanya published=true yang boleh dibaca publik.';

-- Penulisan profil tidak boleh mengubah status terbit sendiri (kecuali pengurus).
create or replace function public.guard_author_publish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.published and not public.can_review('berita') then new.published := false; end if;
    return new;
  end if;
  if new.published is distinct from old.published and not public.can_review('berita') then
    new.published := old.published;
  end if;
  return new;
end $$;
create or replace function public.touch_author() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_author_publish on public.author_profiles;
create trigger trg_author_publish before insert or update on public.author_profiles
  for each row execute function public.guard_author_publish();
drop trigger if exists trg_author_touch on public.author_profiles;
create trigger trg_author_touch before insert or update on public.author_profiles
  for each row execute function public.touch_author();

-- 3c) KONTAK PENULIS DI ARTIKEL ------------------------------------------
comment on table public.content_items is 'Konten CMS. Artikel menautkan profil penulis lewat data.penulis_id -> author_profiles.id.';

-- 4) RIWAYAT PERUBAHAN --------------------------------------------------
create table if not exists public.change_log (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  who     text,
  tabel   text not null,
  aksi    text not null,
  jenis   text,
  ref     text,
  ringkas text
);
create index if not exists change_log_tabel_at on public.change_log (tabel, at desc);

-- 5) TRIGGER: cap waktu/pengubah + catat riwayat ------------------------
create or replace function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := lower(coalesce(auth.jwt() ->> 'email', current_user));
  /* Pemeriksaan via to_jsonb, bukan kondisi guarded biasa: referensi
     new.created_by di dalam IF tetap di-resolve PL/pgSQL sebelum
     evaluasi kondisi berhenti di tg_table_name, sehingga tabel tanpa
     kolom itu (mis. site_settings) tetap gagal 42703. Mencari kunci
     di JSON aman untuk tabel apa pun — hanya menghasilkan NULL. */
  if tg_table_name = 'content_items' and tg_op = 'INSERT' then
    if to_jsonb(new) ->> 'created_by' is null then
      new.created_by := new.updated_by;
    end if;
  end if;
  return new;
end $$;

create or replace function public.log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; j text; k text; s text;
begin
  r := case when tg_op = 'DELETE' then old else new end;
  if tg_table_name = 'content_items' then
    j := r.type; k := r.id::text;
    s := left(coalesce(r.data ->> 'judul', r.data ->> 'nama', r.data ->> 'q', r.data ->> 'kelurahan', ''), 120);
  else
    j := null; k := r.key; s := null;
  end if;
  /* Aksi lewat service_role (backend/SQL Editor) tetap tercatat di riwayat. */
  if auth.uid() is null then
    insert into public.change_log(who, tabel, aksi, jenis, ref, ringkas)
    values ('service_role', tg_table_name, tg_op, j, k, s);
    return r;
  end if;
  insert into public.change_log(who, tabel, aksi, jenis, ref, ringkas)
  values (lower(coalesce(auth.jwt() ->> 'email', current_user)), tg_table_name, tg_op, j, k, s);
  return r;
end $$;

drop trigger if exists trg_touch_items on public.content_items;
create trigger trg_touch_items before insert or update on public.content_items for each row execute function public.touch_row();
drop trigger if exists trg_touch_settings on public.site_settings;
create trigger trg_touch_settings before insert or update on public.site_settings for each row execute function public.touch_row();
drop trigger if exists trg_log_items on public.content_items;
create trigger trg_log_items after insert or update or delete on public.content_items for each row execute function public.log_change();
drop trigger if exists trg_log_settings on public.site_settings;
create trigger trg_log_settings after insert or update or delete on public.site_settings for each row execute function public.log_change();

-- Pengaman: admin terakhir tidak boleh dihapus atau diturunkan perannya
create or replace function public.keep_last_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'DELETE' and old.role = 'super_admin')
     or (tg_op = 'UPDATE' and old.role = 'super_admin' and new.role <> 'super_admin') then
    if (select count(*) from public.staff where role = 'super_admin' and email <> old.email) = 0 then
      raise exception 'Super Admin terakhir tidak boleh dihapus atau diturunkan perannya';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists trg_last_admin on public.staff;
create trigger trg_last_admin before update or delete on public.staff for each row execute function public.keep_last_admin();

-- 6) ROW LEVEL SECURITY -------------------------------------------------
alter table public.staff          enable row level security;
alter table public.site_settings  enable row level security;
alter table public.content_items  enable row level security;
alter table public.author_profiles enable row level security;
alter table public.change_log     enable row level security;

drop policy if exists staff_read on public.staff;
-- Daftar lengkap pengelola (email + role) hanya untuk admin. Baris sendiri tetap
-- dapat dibaca lewat staff_self_select; sisanya tertutup dari jurnalis/ustadz.
create policy staff_read   on public.staff for select to authenticated using (public.is_admin());
drop policy if exists staff_write on public.staff;
drop policy if exists staff_self_update on public.staff;
drop policy if exists staff_self_select on public.staff;
create policy staff_write  on public.staff for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy staff_self_select on public.staff for select to authenticated using (email = lower(coalesce(auth.jwt() ->> 'email','')));

drop policy if exists settings_read on public.site_settings;
create policy settings_read  on public.site_settings for select to anon, authenticated using (true);
drop policy if exists settings_write on public.site_settings;
create policy settings_write on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists items_read on public.content_items;
create policy items_read  on public.content_items for select to anon, authenticated
  using (published or public.can_edit(type, data) or public.can_review(type));
drop policy if exists items_write on public.content_items;
drop policy if exists items_insert on public.content_items;
create policy items_insert on public.content_items for insert to authenticated
  with check (public.can_edit(type, data) and (created_by is null or created_by = lower(coalesce(auth.jwt() ->> 'email','')) or public.is_admin()));
drop policy if exists items_update on public.content_items;
create policy items_update on public.content_items for update to authenticated
  using ((public.can_edit(type, data) and created_by = lower(coalesce(auth.jwt() ->> 'email',''))) or public.can_review(type))
  with check (public.can_edit(type, data) or public.can_review(type));

-- Penegakan alur tulis → tinjau: jurnalis TIDAK boleh menerbitkan sendiri
-- (published false → true hanya oleh can_review), dan jenis konten tidak
-- boleh diganti saat update. Ditegakkan server, bukan hanya UI admin.
create or replace function public.guard_publish() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.published and not old.published and not public.can_review(new.type) then
    raise exception 'Hanya pengurus yang dapat menerbitkan konten ini';
  end if;
  return new;
end $$;
create or replace function public.guard_item_type() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type is distinct from old.type then
    raise exception 'Jenis konten tidak boleh diubah setelah dibuat';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_publish on public.content_items;
create trigger trg_guard_publish before update on public.content_items
  for each row execute function public.guard_publish();
drop trigger if exists trg_guard_item_type on public.content_items;
create trigger trg_guard_item_type before update on public.content_items
  for each row execute function public.guard_item_type();
drop policy if exists items_delete on public.content_items;
create policy items_delete on public.content_items for delete to authenticated
  using (public.is_admin() or (public.can_edit(type, data) and created_by = lower(coalesce(auth.jwt() ->> 'email',''))));

drop policy if exists log_read on public.change_log;
create policy log_read on public.change_log for select to authenticated using (public.is_admin());

-- RLS profil penulis: publik hanya melihat yang terbit; staf hanya barisnya sendiri.
drop policy if exists author_read on public.author_profiles;
create policy author_read on public.author_profiles for select to anon, authenticated
  using (published or email = lower(coalesce(auth.jwt() ->> 'email','')) or public.can_review('berita'));

drop policy if exists author_insert_self on public.author_profiles;
create policy author_insert_self on public.author_profiles for insert to authenticated
  with check (public.is_staff() and email = lower(coalesce(auth.jwt() ->> 'email','')));

drop policy if exists author_update_self on public.author_profiles;
create policy author_update_self on public.author_profiles for update to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email','')) or public.is_admin())
  with check (email = lower(coalesce(auth.jwt() ->> 'email','')) or public.is_admin());

drop policy if exists author_delete on public.author_profiles;
create policy author_delete on public.author_profiles for delete to authenticated
  using (public.is_admin());

-- 7) HAK AKSES TABEL ----------------------------------------------------
revoke all on public.staff, public.site_settings, public.content_items, public.change_log, public.author_profiles from anon, authenticated;
grant select on public.site_settings, public.content_items to anon;
grant select, insert, update, delete on public.site_settings, public.content_items to authenticated;
grant select, insert, update, delete on public.staff to authenticated;
grant select on public.change_log to authenticated;
grant usage, select on sequence public.change_log_id_seq to authenticated;
grant select, insert, update, delete on public.author_profiles to authenticated;
/* Privasi: publik hanya boleh membaca kolom yang tampil di situs.
   Email (identitas akun) dan kolom internal tidak boleh dibaca anon,
   karena RLS membatasi baris — bukan kolom.
   Urutan penting: grant tabel penuh untuk anon harus dicabut DULU, karena
   GRANT SELECT (kolom) setelahnya TIDAK menghapus hak tabel penuh.
   Kolom `published` WAJIB ikut di-grant: query publik memakai filter
   `published=eq.true`, dan PostgREST menolak (42501) bila kolom yang dipakai
   di WHERE tidak memiliki hak select. Membaca kolom ini tidak membocorkan
   data pribadi; RLS tetap membatasi barisnya. */
revoke select on public.author_profiles from anon;
grant select (id, nama, foto, bidang, pendidikan, pengalaman, bio, kontak, published)
  on public.author_profiles to anon;

-- 8) PENYIMPANAN FOTO (bucket publik "media") ---------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create or replace function public.can_upload_media() returns boolean
language sql stable security definer set search_path = public as $$
  select public.staff_role() in ('super_admin','pengurus','jurnalis','ustadz')
$$;
revoke all on function public.can_upload_media() from public, anon, authenticated;
grant execute on function public.can_upload_media() to authenticated, service_role;
drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.can_upload_media());
drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- 9) ADMIN PERTAMA ------------------------------------------------------
-- Admin pertama: akun Google organisasi (email resmi di situs). Ganti hanya jika ingin akun lain (huruf kecil).
-- do nothing (bukan do update): menjalankan ulang skema TIDAK mengembalikan peran
-- admin yang sengaja diturunkan/diganti pengelola sebelumnya.
insert into public.staff (email, role, nama)
values ('mwcnu.pdaren@gmail.com', 'super_admin', 'Super Admin Utama')
on conflict (email) do nothing;
