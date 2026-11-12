-- ============================================================
-- MIGRASI: Direktori Organisasi MWCNU Pondok Aren (FASE 2–3)
-- Tanggal: 2026-11-12   Status: DISETUJUI, BELUM DIEKSEKUSI
--
-- Sifat: idempotent (aman dijalankan ulang). TIDAK mengubah tabel
-- existing (staff, profiles, content_items, change_log, storage).
-- Rollback: lihat bagian 8 di docs/skema-direktori-organisasi.md
--
-- Cara: Supabase Dashboard → SQL Editor → tempel seluruh isi file.
-- ============================================================

-- ============ 1) UNIT ORGANISASI ============
create table if not exists public.organizational_units (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.organizational_units(id) on delete restrict,
  code        text not null unique,
  name        text not null,
  kind        text not null,
  prnu_code   text,
  sort_order  int  not null default 0,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint organizational_units_kind_chk check
    (kind in ('mwc','prnu','syuriyah','tanfidziyah','lembaga','badan_khusus','banom')),
  constraint organizational_units_prnu_chk check
    (prnu_code is null or prnu_code ~ '^(0[1-9]|1[01])$'),
  constraint organizational_units_self_chk check (parent_id is null or parent_id <> id),
  constraint organizational_units_prnu_uniq unique (prnu_code),
  constraint organizational_units_name_chk check (length(btrim(name)) between 2 and 120)
);
create index if not exists organizational_units_parent_idx
  on public.organizational_units (parent_id);
create index if not exists organizational_units_kind_idx
  on public.organizational_units (kind, sort_order);

-- ============ 2) MASA KHIDMAT ============
create table if not exists public.organizational_terms (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,
  starts_on  date not null,
  ends_on    date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint organizational_terms_dates_chk check (ends_on is null or ends_on > starts_on),
  constraint organizational_terms_label_chk check (length(btrim(label)) between 4 and 40)
);
-- maksimal satu masa khidmat aktif
create unique index if not exists organizational_terms_current_uniq
  on public.organizational_terms (is_current) where is_current;

-- ============ 3) PROFIL PUBLIK DIREKTORI ============
create table if not exists public.organizational_profiles (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  full_name          text not null,
  photo_url          text,
  bio                text,
  is_public          boolean not null default false,
  linked_staff_email text references public.staff(email) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint organizational_profiles_slug_chk check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint organizational_profiles_name_chk check (length(btrim(full_name)) between 2 and 120),
  constraint organizational_profiles_photo_chk check (photo_url is null or photo_url ~* '^https?://')
);
create unique index if not exists organizational_profiles_staff_uniq
  on public.organizational_profiles (linked_staff_email) where linked_staff_email is not null;

-- ============ 4) JABATAN ============
create table if not exists public.organizational_positions (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references public.organizational_units(id) on delete restrict,
  name       text not null,
  rank       int  not null default 0,
  created_at timestamptz not null default now(),
  constraint organizational_positions_uniq unique (unit_id, name),
  constraint organizational_positions_name_chk check (length(btrim(name)) between 2 and 80)
);
create index if not exists organizational_positions_unit_idx
  on public.organizational_positions (unit_id, rank);

-- ============ 5) KEPENGURUSAN ============
create table if not exists public.organizational_memberships (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.organizational_profiles(id) on delete cascade,
  position_id uuid not null references public.organizational_positions(id) on delete restrict,
  term_id     uuid not null references public.organizational_terms(id) on delete restrict,
  notes       text,
  created_at  timestamptz not null default now(),
  constraint organizational_memberships_uniq unique (profile_id, position_id, term_id)
);
create index if not exists organizational_memberships_position_idx
  on public.organizational_memberships (position_id, term_id);
create index if not exists organizational_memberships_profile_idx
  on public.organizational_memberships (profile_id);
create index if not exists organizational_memberships_term_idx
  on public.organizational_memberships (term_id);

-- ============ 6) updated_at otomatis ============
create or replace function public.organizational_touch()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists trg_org_units_touch on public.organizational_units;
create trigger trg_org_units_touch before update on public.organizational_units
  for each row execute function public.organizational_touch();
drop trigger if exists trg_org_profiles_touch on public.organizational_profiles;
create trigger trg_org_profiles_touch before update on public.organizational_profiles
  for each row execute function public.organizational_touch();

-- ============ 7) HELPER OTORISASI ============
create or replace function public.my_prnu()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select s.prnu from public.staff s
                   where s.email = lower(coalesce(auth.jwt() ->> 'email','')) limit 1), '')
$$;

-- Pengurus ranting boleh mengelola unit miliknya DAN seluruh turunannya
-- (mis. Syuriyah/Tanfidziyah PRNU yang prnu_code-nya null tapi parent-nya
-- prnu-XX miliknya). Penelusuran naik dibatasi kedalaman 10 agar pohon yang
-- cacat (siklus) tidak membuat kueri berputar tanpa henti.
create or replace function public.manages_unit(p_unit uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or (
    public.staff_role() = 'pengurus' and exists (
      with recursive up as (
        select u.id, u.parent_id, u.prnu_code, 1 as depth
        from public.organizational_units u where u.id = p_unit
        union all
        select u.id, u.parent_id, u.prnu_code, up.depth + 1
        from public.organizational_units u
        join up on u.id = up.parent_id
        where up.depth < 10
      )
      select 1 from up
      where up.prnu_code is not null and up.prnu_code = public.my_prnu()
    )
  )
$$;

create or replace function public.manages_position(p_pos uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizational_positions p
                 where p.id = p_pos and public.manages_unit(p.unit_id))
$$;

-- bantuan baca publik (menghindari subquery RLS berlapis)
create or replace function public.unit_is_public(p_unit uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizational_units u
                 where u.id = p_unit and u.is_public)
$$;

create or replace function public.directory_row_public(p_profile uuid, p_position uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizational_profiles p
                 where p.id = p_profile and p.is_public)
     and exists (select 1 from public.organizational_positions po
                 join public.organizational_units u on u.id = po.unit_id
                 where po.id = p_position and u.is_public)
$$;

revoke all on function public.my_prnu(), public.manages_unit(uuid),
  public.manages_position(uuid), public.organizational_touch()
  from public, anon;
revoke all on function public.unit_is_public(uuid), public.directory_row_public(uuid, uuid)
  from public;
grant execute on function public.my_prnu(), public.manages_unit(uuid),
  public.manages_position(uuid) to authenticated;
grant execute on function public.unit_is_public(uuid), public.directory_row_public(uuid, uuid)
  to anon, authenticated;

-- ============ 8) RLS ============
alter table public.organizational_units       enable row level security;
alter table public.organizational_terms       enable row level security;
alter table public.organizational_profiles    enable row level security;
alter table public.organizational_positions   enable row level security;
alter table public.organizational_memberships enable row level security;

-- Baca publik: hanya baris yang ditandai publik.
drop policy if exists org_units_read on public.organizational_units;
create policy org_units_read on public.organizational_units
  for select to anon, authenticated using (is_public);

drop policy if exists org_terms_read on public.organizational_terms;
create policy org_terms_read on public.organizational_terms
  for select to anon, authenticated using (true);

drop policy if exists org_profiles_read on public.organizational_profiles;
create policy org_profiles_read on public.organizational_profiles
  for select to anon, authenticated using (is_public);

drop policy if exists org_positions_read on public.organizational_positions;
create policy org_positions_read on public.organizational_positions
  for select to anon, authenticated using (public.unit_is_public(unit_id));

drop policy if exists org_memberships_read on public.organizational_memberships;
create policy org_memberships_read on public.organizational_memberships
  for select to anon, authenticated
  using (public.directory_row_public(profile_id, position_id));

-- Tulis: admin semua; pengurus hanya unit prnu miliknya, DAN boleh membuat
-- unit turunan di bawah unit yang dikelolanya (Syuriyah/Tanfidziyah ranting).
-- Unit turunan wajib prnu_code null dan bukan kind mwc/prnu agar pengurus
-- tidak bisa mengklaim kode PRNU lain lewat jalur parent.
drop policy if exists org_units_staff_write on public.organizational_units;
create policy org_units_staff_write on public.organizational_units
  for all to authenticated
  using (
    public.is_admin() or (
      public.staff_role() = 'pengurus' and (
        (prnu_code is not null and prnu_code = public.my_prnu())
        or (parent_id is not null and prnu_code is null and kind not in ('mwc','prnu')
            and public.manages_unit(parent_id))
      )
    )
  )
  with check (
    public.is_admin() or (
      public.staff_role() = 'pengurus' and (
        (prnu_code is not null and prnu_code = public.my_prnu())
        or (parent_id is not null and prnu_code is null and kind not in ('mwc','prnu')
            and public.manages_unit(parent_id))
      )
    )
  );

drop policy if exists org_terms_admin_write on public.organizational_terms;
create policy org_terms_admin_write on public.organizational_terms
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists org_profiles_admin_write on public.organizational_profiles;
create policy org_profiles_admin_write on public.organizational_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists org_positions_staff_write on public.organizational_positions;
create policy org_positions_staff_write on public.organizational_positions
  for all to authenticated
  using (public.manages_unit(unit_id)) with check (public.manages_unit(unit_id));

drop policy if exists org_memberships_staff_write on public.organizational_memberships;
create policy org_memberships_staff_write on public.organizational_memberships
  for all to authenticated
  using (public.manages_position(position_id))
  with check (public.manages_position(position_id));

-- Staf pengelola tetap dapat melihat baris non-publik unit yang dikelolanya
-- (untuk keperluan penyuntingan di panel admin).
drop policy if exists org_positions_staff_read on public.organizational_positions;
create policy org_positions_staff_read on public.organizational_positions
  for select to authenticated using (public.manages_unit(unit_id));

drop policy if exists org_memberships_staff_read on public.organizational_memberships;
create policy org_memberships_staff_read on public.organizational_memberships
  for select to authenticated using (public.manages_position(position_id));

drop policy if exists org_profiles_staff_read on public.organizational_profiles;
create policy org_profiles_staff_read on public.organizational_profiles
  for select to authenticated using (public.is_admin() or public.staff_role() = 'pengurus');

-- ============ 9) HAK AKSES TABEL (column-level untuk data publik) ============
revoke all on public.organizational_units, public.organizational_terms,
              public.organizational_profiles, public.organizational_positions,
              public.organizational_memberships
  from anon, authenticated;

grant select (id, parent_id, code, name, kind, prnu_code, sort_order, is_public)
  on public.organizational_units to anon, authenticated;
grant select on public.organizational_terms to anon, authenticated;
grant select (id, slug, full_name, photo_url, bio, is_public)
  on public.organizational_profiles to anon, authenticated;
grant select on public.organizational_positions to anon, authenticated;
grant select on public.organizational_memberships to anon, authenticated;

grant insert, update, delete on public.organizational_units,
      public.organizational_terms, public.organizational_profiles,
      public.organizational_positions, public.organizational_memberships
  to authenticated;

-- ============ 10) VIEW BACA PUBLIK ============
create or replace view public.directory_public
with (security_invoker = true) as
select m.id,
       t.is_current,
       p.slug, p.full_name, p.photo_url, p.bio,
       u.code as unit_code, u.name as unit_name, u.kind,
       u.prnu_code, u.sort_order as unit_sort,
       pos.name as position_name, pos.rank as position_rank,
       t.label as term_label, t.starts_on, t.ends_on
from public.organizational_memberships m
join public.organizational_profiles p   on p.id  = m.profile_id
join public.organizational_positions pos on pos.id = m.position_id
join public.organizational_units u      on u.id  = pos.unit_id
join public.organizational_terms t      on t.id  = m.term_id
where p.is_public and u.is_public;

grant select on public.directory_public to anon, authenticated;

-- ============ 11) SEED UNIT STRUKTURAL (tanpa data orang) ============
insert into public.organizational_units (code, name, kind, prnu_code, sort_order)
values
  ('mwc','MWCNU Pondok Aren','mwc',null,0),
  ('syuriyah','Syuriyah MWCNU Pondok Aren','syuriyah',null,1),
  ('tanfidziyah','Tanfidziyah MWCNU Pondok Aren','tanfidziyah',null,2),
  ('prnu-01','PRNU Pondok Aren','prnu','01',10),
  ('prnu-02','PRNU Jurangmangu Barat','prnu','02',11),
  ('prnu-03','PRNU Jurangmangu Timur','prnu','03',12),
  ('prnu-04','PRNU Pondok Betung','prnu','04',13),
  ('prnu-05','PRNU Pondok Karya','prnu','05',14),
  ('prnu-06','PRNU Pondok Jaya','prnu','06',15),
  ('prnu-07','PRNU Pondok Pucung','prnu','07',16),
  ('prnu-08','PRNU Pondok Kacang Barat','prnu','08',17),
  ('prnu-09','PRNU Pondok Kacang Timur','prnu','09',18),
  ('prnu-10','PRNU Parigi Baru','prnu','10',19),
  ('prnu-11','PRNU Parigi Lama','prnu','11',20)
on conflict (code) do nothing;

-- ============ 12) PEMERIKSAAN PASCA-MIGRASI ============
-- 1) Lima tabel baru ada:
--    select tablename from pg_tables where schemaname='public'
--      and tablename like 'organizational%' order by 1;
-- 2) RLS aktif di semua tabel:
--    select relname, relrowsecurity from pg_class
--      where relname like 'organizational%' and relkind='r';
-- 3) Unit hasil seed:
--    select code, name, kind, prnu_code from public.organizational_units order by sort_order;
-- 4) Uji anon (dari klien/PostgREST): select * from directory_public → [] (belum ada orang).
