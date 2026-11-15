-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — FASE 2
-- 004_services: RPC layanan backend + bucket privat consultation-private.
--
-- MENGAPA FILE TERPISAH:
--   * Fase 1 (001-003) adalah skema & keamanan dasar yang sudah diaudit.
--   * Fase 2 menambahkan lapisan layanan (operasi multi-tabel yang atomik)
--     TANPA mengubah tabel/trigger Fase 1.
--   * Semua RPC di sini SECURITY INVOKER dan HANYA di-grant ke service_role.
--     Edge Function memverifikasi identitas pemanggil, lalu memanggil RPC ini
--     dengan service_role. Aktor staf divalidasi ulang oleh
--     consultation_set_aktor() (B3) sebelum mutasi.
--   * Prasyarat: 001, 002, 003 sudah dijalankan.
-- ============================================================================

-- ==========================================================================
-- A. BUCKET PRIVAT consultation-private (Fase 2)
--    Tidak publik, tanpa policy storage → hanya service_role via Edge Function.
--    (Di PGlite tanpa schema storage: dilewati dengan notice.)
-- ==========================================================================
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('consultation-private','consultation-private', false, 5242880,
            array['image/jpeg','image/png','image/webp','application/pdf'])
    on conflict (id) do update
      set public = false, file_size_limit = 5242880,
          allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];
  else
    raise notice 'storage.buckets tidak tersedia — bucket consultation-private dibuat saat migrasi produksi';
  end if;
end $$;

-- ==========================================================================
-- B. HELPER OTORISASI STAF
--    consultation_svc_peran: validasi aktor aktif (via consultation_set_aktor)
--    lalu kembalikan role_konsultasi. Semua RPC staf memanggil ini lebih dulu.
-- ==========================================================================
create or replace function public.consultation_svc_peran(p_aktor text)
returns text language plpgsql as $$
declare v_role text;
begin
  perform public.consultation_set_aktor(p_aktor);
  select r.role_konsultasi into v_role
    from public.consultation_staff_roles r
   where r.email = lower(btrim(p_aktor)) and r.aktif;
  if v_role is null then
    raise exception 'Aktor bukan staf konsultasi aktif';
  end if;
  return v_role;
end $$;

-- ==========================================================================
-- C. LAYANAN PEMOHON (tanpa autentikasi staf; kredensial tiket = nomor+secret)
-- ==========================================================================

-- C1) Buat tiket baru. Nomor dari sequence (trigger), secret hanya hash.
create or replace function public.consultation_svc_buat_tiket(
  p_kategori_kode text,
  p_judul text,
  p_isi text,
  p_nama text,
  p_whatsapp text,
  p_email text,
  p_secret_hash text,
  p_setuju_privasi boolean,
  p_setuju_publikasi boolean
) returns json language plpgsql as $$
declare
  v_kategori uuid;
  v_ticket public.consultation_tickets;
begin
  if p_setuju_privasi is not true then
    raise exception 'Persetujuan privasi wajib diberikan';
  end if;
  if p_secret_hash is null or p_secret_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Hash kredensial tidak valid';
  end if;
  select c.id into v_kategori
    from public.consultation_categories c
   where c.kode = lower(btrim(p_kategori_kode)) and c.aktif;
  if v_kategori is null then
    raise exception 'Kategori tidak ditemukan atau tidak aktif';
  end if;

  insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values (v_kategori, btrim(p_judul), btrim(p_isi))
  returning * into v_ticket;

  insert into public.consultation_requester_contacts
    (ticket_id, nama, whatsapp, email, persetujuan_privasi,
     persetujuan_publikasi, persetujuan_publikasi_at)
  values (v_ticket.id, nullif(btrim(p_nama),''), nullif(btrim(p_whatsapp),''),
          nullif(lower(btrim(p_email)),''), true,
          coalesce(p_setuju_publikasi,false),
          case when coalesce(p_setuju_publikasi,false) then now() else null end);

  insert into public.consultation_access_credentials (ticket_id, secret_hash)
  values (v_ticket.id, lower(p_secret_hash));

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values ('pemohon','pemohon','tiket_dibuat', v_ticket.id,
          json_build_object('nomor_tiket', v_ticket.nomor_tiket));

  return json_build_object(
    'id', v_ticket.id,
    'nomor_tiket', v_ticket.nomor_tiket,
    'status', v_ticket.status,
    'created_at', v_ticket.created_at
  );
end $$;

-- C2) Baca tiket + percakapan terlihat-pemohon dengan kredensial valid.
create or replace function public.consultation_svc_akses_tiket(
  p_nomor text,
  p_secret_hash text
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
  v_cred uuid;
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;
  select c.id into v_cred
    from public.consultation_access_credentials c
   where c.ticket_id = v_ticket.id;
  update public.consultation_access_credentials
     set terakhir_akses_at = now() where id = v_cred;

  return json_build_object(
    'ticket', json_build_object(
      'id', v_ticket.id,
      'nomor_tiket', v_ticket.nomor_tiket,
      'judul', v_ticket.judul,
      'isi_pertanyaan', v_ticket.isi_pertanyaan,
      'status', v_ticket.status,
      'sla_deadline', v_ticket.sla_deadline,
      'created_at', v_ticket.created_at,
      'updated_at', v_ticket.updated_at
    ),
    'kontak', (select json_build_object(
        'nama', c.nama, 'whatsapp', c.whatsapp, 'email', c.email,
        'persetujuan_publikasi', c.persetujuan_publikasi)
      from public.consultation_requester_contacts c where c.ticket_id = v_ticket.id),
    'pesan', coalesce((select json_agg(json_build_object(
        'id', m.id, 'pengirim_jenis', m.pengirim_jenis,
        'jenis_pesan', m.jenis_pesan, 'isi', m.isi, 'created_at', m.created_at)
        order by m.created_at)
      from public.consultation_messages m
      where m.ticket_id = v_ticket.id and m.terlihat_pemohon), '[]'::json),
    'lampiran', coalesce((select json_agg(json_build_object(
        'id', a.id, 'message_id', a.message_id, 'nama_file', a.nama_file,
        'mime', a.mime, 'size_bytes', a.size_bytes, 'created_at', a.created_at)
        order by a.created_at)
      from public.consultation_attachments a
      where a.ticket_id = v_ticket.id), '[]'::json),
    'publikasi', (select json_build_object(
        'published', p.published,
        'persetujuan_pemohon', p.persetujuan_pemohon,
        'disetujui_reviewer', p.disetujui_reviewer,
        'disetujui_admin', p.disetujui_admin,
        'dicabut', p.dicabut)
      from public.consultation_publications p where p.ticket_id = v_ticket.id)
  );
end $$;

-- C3) Pesan lanjutan pemohon (hanya bila tiket masih terbuka).
create or replace function public.consultation_svc_pesan_pemohon(
  p_nomor text,
  p_secret_hash text,
  p_isi text
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
  v_msg public.consultation_messages;
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;
  if v_ticket.status in ('selesai','ditolak') then
    raise exception 'Tiket sudah ditutup';
  end if;
  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (v_ticket.id, 'pemohon', null, 'balasan_pemohon', btrim(p_isi), true)
  returning * into v_msg;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id)
  values ('pemohon','pemohon','pesan_pemohon', v_ticket.id);
  return json_build_object('id', v_msg.id, 'created_at', v_msg.created_at);
end $$;

-- C4) Persetujuan/pencabutan publikasi oleh pemohon.
create or replace function public.consultation_svc_persetujuan_pemohon(
  p_nomor text,
  p_secret_hash text,
  p_setuju boolean
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
  v_setuju boolean := coalesce(p_setuju, false);
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;
  update public.consultation_requester_contacts
     set persetujuan_publikasi = v_setuju,
         persetujuan_publikasi_at = case when v_setuju then now() else null end
   where ticket_id = v_ticket.id;
  -- Sinkronkan persetujuan pemohon pada publikasi (bila sudah diajukan).
  -- Pencabutan sudah ditangani trigger consent_check (unpublish + dicabut).
  if v_setuju then
    update public.consultation_publications
       set persetujuan_pemohon = true, persetujuan_pemohon_at = now()
     where ticket_id = v_ticket.id and not published;
  end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values ('pemohon','pemohon',
          case when v_setuju then 'persetujuan_publikasi_diberikan' else 'persetujuan_publikasi_dicabut' end,
          v_ticket.id, json_build_object('setuju', v_setuju));
  return json_build_object('persetujuan_publikasi', v_setuju);
end $$;

-- ==========================================================================
-- D. LAYANAN STAF — DAFTAR, DETAIL, RIWAYAT, SLA
-- ==========================================================================

-- D1) Daftar tiket sesuai kewenangan role.
create or replace function public.consultation_svc_staf_daftar(
  p_aktor text,
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
) returns json language plpgsql as $$
declare
  v_role text;
  v_limit integer := greatest(1, least(coalesce(p_limit,50), 100));
  v_offset integer := greatest(0, coalesce(p_offset,0));
  v_data json;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role = 'admin_konsultasi' then
    select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into v_data
      from (select t.id, t.nomor_tiket, t.judul, t.status, t.sla_deadline, t.created_at
              from public.consultation_tickets t
             where p_status is null or t.status = p_status
             order by t.created_at desc limit v_limit offset v_offset) x;
  elsif v_role = 'konsultan' then
    select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into v_data
      from (select t.id, t.nomor_tiket, t.judul, t.status, t.sla_deadline, t.created_at
              from public.consultation_tickets t
              join public.consultation_assignments a
                on a.ticket_id = t.id and a.dilepas_at is null
             where a.konsultan_email = lower(btrim(p_aktor))
               and (p_status is null or t.status = p_status)
             order by t.created_at desc limit v_limit offset v_offset) x;
  else -- reviewer: antrean jawaban menunggu review
    select coalesce(json_agg(x order by x.created_at desc), '[]'::json) into v_data
      from (select t.id, t.nomor_tiket, t.judul, t.status, t.sla_deadline, t.created_at
              from public.consultation_tickets t
             where t.status = 'menunggu_review'
               and (p_status is null or t.status = p_status)
             order by t.created_at desc limit v_limit offset v_offset) x;
  end if;
  return json_build_object('peran', v_role, 'tiket', v_data);
end $$;

-- D2) Detail tiket untuk staf sesuai kewenangan.
create or replace function public.consultation_svc_staf_detail(
  p_aktor text,
  p_ticket uuid
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;

  if v_role = 'konsultan'
     and not exists (select 1 from public.consultation_assignments a
                     where a.ticket_id = p_ticket
                       and a.konsultan_email = lower(btrim(p_aktor))
                       and a.dilepas_at is null) then
    raise exception 'Tidak berwenang atas tiket ini';
  end if;
  if v_role = 'reviewer'
     and v_t.status not in ('menunggu_review','terjawab','selesai')
     and not exists (select 1 from public.consultation_messages m
                     where m.ticket_id = p_ticket and m.jenis_pesan = 'jawaban_konsultan') then
    raise exception 'Tidak berwenang atas tiket ini';
  end if;

  return json_build_object(
    'peran', v_role,
    'ticket', json_build_object(
      'id', v_t.id, 'nomor_tiket', v_t.nomor_tiket, 'judul', v_t.judul,
      'isi_pertanyaan', v_t.isi_pertanyaan, 'status', v_t.status,
      'sla_deadline', v_t.sla_deadline, 'created_at', v_t.created_at,
      'updated_at', v_t.updated_at, 'alasan_penolakan', v_t.alasan_penolakan),
    'kontak', case when v_role = 'admin_konsultasi' then
      (select json_build_object('nama', c.nama, 'whatsapp', c.whatsapp, 'email', c.email,
              'persetujuan_publikasi', c.persetujuan_publikasi)
         from public.consultation_requester_contacts c where c.ticket_id = p_ticket)
      else null end,
    'pesan', coalesce((select json_agg(json_build_object(
        'id', m.id, 'pengirim_jenis', m.pengirim_jenis, 'pengirim_email', m.pengirim_email,
        'jenis_pesan', m.jenis_pesan, 'isi', m.isi, 'terlihat_pemohon', m.terlihat_pemohon,
        'created_at', m.created_at) order by m.created_at)
      from public.consultation_messages m where m.ticket_id = p_ticket), '[]'::json),
    'penugasan', coalesce((select json_agg(json_build_object(
        'id', a.id, 'konsultan_email', a.konsultan_email, 'ditugaskan_oleh', a.ditugaskan_oleh,
        'ditugaskan_at', a.ditugaskan_at, 'dilepas_at', a.dilepas_at,
        'alasan_pelepasan', a.alasan_pelepasan) order by a.ditugaskan_at desc)
      from public.consultation_assignments a where a.ticket_id = p_ticket), '[]'::json),
    'review', coalesce((select json_agg(json_build_object(
        'id', r.id, 'message_id', r.message_id, 'reviewer_email', r.reviewer_email,
        'keputusan', r.keputusan, 'catatan', r.catatan, 'reviewed_at', r.reviewed_at)
        order by r.reviewed_at desc)
      from public.consultation_reviews r where r.ticket_id = p_ticket), '[]'::json),
    'publikasi', (select json_build_object(
        'slug', p.slug, 'judul_publik', p.judul_publik, 'published', p.published,
        'published_at', p.published_at, 'dicabut', p.dicabut,
        'persetujuan_pemohon', p.persetujuan_pemohon,
        'disetujui_reviewer', p.disetujui_reviewer, 'disetujui_admin', p.disetujui_admin)
      from public.consultation_publications p where p.ticket_id = p_ticket)
  );
end $$;

-- D3) Riwayat aktivitas (status + audit) — admin konsultasi.
create or replace function public.consultation_svc_staf_riwayat(
  p_aktor text,
  p_ticket uuid
) returns json language plpgsql as $$
declare v_role text;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then
    raise exception 'Hanya admin konsultasi';
  end if;
  return json_build_object(
    'status', coalesce((select json_agg(json_build_object(
        'status_lama', s.status_lama, 'status_baru', s.status_baru,
        'oleh', s.oleh, 'alasan', s.alasan, 'at', s.at) order by s.at)
      from public.consultation_status_logs s where s.ticket_id = p_ticket), '[]'::json),
    'audit', coalesce((select json_agg(json_build_object(
        'aktor', a.aktor, 'aktor_jenis', a.aktor_jenis, 'aksi', a.aksi,
        'detail', a.detail, 'at', a.at) order by a.at)
      from public.consultation_audit_logs a where a.ticket_id = p_ticket), '[]'::json)
  );
end $$;

-- D4) Pemantauan SLA — admin konsultasi.
create or replace function public.consultation_svc_sla(p_aktor text)
returns json language plpgsql as $$
declare v_role text;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then
    raise exception 'Hanya admin konsultasi';
  end if;
  return coalesce((select json_agg(json_build_object(
      'id', t.id, 'nomor_tiket', t.nomor_tiket, 'judul', t.judul,
      'status', t.status, 'sla_deadline', t.sla_deadline,
      'terlambat', (t.sla_deadline is not null and t.sla_deadline < now()))
      order by t.sla_deadline)
    from public.consultation_tickets t
   where t.status not in ('selesai','ditolak')), '[]'::json);
end $$;

-- ==========================================================================
-- E. LAYANAN ADMIN — VERIFIKASI, PENOLAKAN, PENUGASAN, STATUS
-- ==========================================================================
create or replace function public.consultation_svc_verifikasi(p_ticket uuid, p_aktor text)
returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  update public.consultation_tickets set status = 'diverifikasi'
   where id = p_ticket returning * into v_t;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id)
  values (lower(btrim(p_aktor)),'staf','tiket_diverifikasi',p_ticket);
  return json_build_object('id', v_t.id, 'status', v_t.status, 'sla_deadline', v_t.sla_deadline);
end $$;

create or replace function public.consultation_svc_tolak(p_ticket uuid, p_alasan text, p_aktor text)
returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  if coalesce(btrim(p_alasan),'') = '' then raise exception 'Alasan penolakan wajib diisi'; end if;
  update public.consultation_tickets
     set status = 'ditolak', alasan_penolakan = btrim(p_alasan)
   where id = p_ticket returning * into v_t;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','tiket_ditolak',p_ticket, json_build_object('alasan', btrim(p_alasan)));
  return json_build_object('id', v_t.id, 'status', v_t.status, 'alasan_penolakan', v_t.alasan_penolakan);
end $$;

-- Perubahan status umum oleh admin (mesin transisi Fase 1 tetap berlaku).
create or replace function public.consultation_svc_status(
  p_ticket uuid, p_status text, p_alasan text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  select * into v_t from public.consultation_ubah_status(p_ticket, p_status, p_alasan, p_aktor);
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','status_diubah',p_ticket,
          json_build_object('status', p_status, 'alasan', nullif(btrim(p_alasan),'')));
  return json_build_object('id', v_t.id, 'status', v_t.status);
end $$;

create or replace function public.consultation_svc_tugaskan(
  p_ticket uuid, p_konsultan text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets; v_a public.consultation_assignments;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_t.status not in ('menunggu_penugasan','ditugaskan') then
    raise exception 'Status tiket tidak siap ditugaskan';
  end if;
  if exists (select 1 from public.consultation_assignments a
             where a.ticket_id = p_ticket and a.dilepas_at is null) then
    raise exception 'Tiket sudah memiliki penugasan aktif';
  end if;
  insert into public.consultation_assignments (ticket_id, konsultan_email, ditugaskan_oleh)
  values (p_ticket, lower(btrim(p_konsultan)), lower(btrim(p_aktor)))
  returning * into v_a;
  if v_t.status = 'menunggu_penugasan' then
    update public.consultation_tickets set status = 'ditugaskan'
     where id = p_ticket returning * into v_t;
  end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','konsultan_ditugaskan',p_ticket,
          json_build_object('konsultan', lower(btrim(p_konsultan))));
  return json_build_object('assignment_id', v_a.id, 'konsultan_email', v_a.konsultan_email,
                           'status', v_t.status);
end $$;

create or replace function public.consultation_svc_lepas(
  p_ticket uuid, p_alasan text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  if coalesce(btrim(p_alasan),'') = '' then raise exception 'Alasan pelepasan wajib diisi'; end if;
  update public.consultation_assignments
     set dilepas_at = now(), alasan_pelepasan = btrim(p_alasan)
   where ticket_id = p_ticket and dilepas_at is null;
  if not found then raise exception 'Tidak ada penugasan aktif'; end if;
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.status = 'ditugaskan' then
    update public.consultation_tickets set status = 'menunggu_penugasan'
     where id = p_ticket returning * into v_t;
  end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','penugasan_dilepas',p_ticket,
          json_build_object('alasan', btrim(p_alasan)));
  return json_build_object('status', v_t.status);
end $$;

-- ==========================================================================
-- F. LAYANAN KONSULTAN — JAWABAN & PESAN STAF
-- ==========================================================================
create or replace function public.consultation_svc_jawab(
  p_ticket uuid, p_isi text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets; v_m public.consultation_messages;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'konsultan' then raise exception 'Hanya konsultan'; end if;
  if not exists (select 1 from public.consultation_assignments a
                 where a.ticket_id = p_ticket
                   and a.konsultan_email = lower(btrim(p_aktor))
                   and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_t.status not in ('ditugaskan','menunggu_informasi','menunggu_review') then
    raise exception 'Status tiket tidak siap dijawab';
  end if;
  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (p_ticket, 'konsultan', lower(btrim(p_aktor)), 'jawaban_konsultan',
          btrim(p_isi), true)
  returning * into v_m;
  if v_t.status <> 'menunggu_review' then
    update public.consultation_tickets set status = 'menunggu_review'
     where id = p_ticket returning * into v_t;
  end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','jawaban_konsultan',p_ticket,
          json_build_object('message_id', v_m.id));
  return json_build_object('message_id', v_m.id, 'status', v_t.status);
end $$;

create or replace function public.consultation_svc_pesan_staf(
  p_ticket uuid, p_jenis text, p_isi text, p_terlihat boolean, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_m public.consultation_messages;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role = 'konsultan'
     and not exists (select 1 from public.consultation_assignments a
                     where a.ticket_id = p_ticket
                       and a.konsultan_email = lower(btrim(p_aktor))
                       and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (p_ticket, v_role, lower(btrim(p_aktor)), p_jenis, btrim(p_isi),
          coalesce(p_terlihat, true))
  returning * into v_m;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','pesan_staf',p_ticket,
          json_build_object('jenis_pesan', p_jenis, 'message_id', v_m.id));
  return json_build_object('id', v_m.id, 'jenis_pesan', v_m.jenis_pesan,
                           'terlihat_pemohon', v_m.terlihat_pemohon);
end $$;

-- ==========================================================================
-- G. LAYANAN REVIEWER — KEPUTUSAN REVIEW
-- ==========================================================================
create or replace function public.consultation_svc_review(
  p_ticket uuid, p_message uuid, p_keputusan text, p_catatan text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets; v_r public.consultation_reviews;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'reviewer' then raise exception 'Hanya reviewer'; end if;
  if p_keputusan not in ('disetujui','minta_revisi') then
    raise exception 'Keputusan review tidak valid';
  end if;
  if p_keputusan = 'minta_revisi' and coalesce(btrim(p_catatan),'') = '' then
    raise exception 'Catatan wajib diisi saat meminta revisi';
  end if;
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_t.status <> 'menunggu_review' then
    raise exception 'Tiket tidak dalam status menunggu review';
  end if;
  insert into public.consultation_reviews
    (ticket_id, message_id, reviewer_email, keputusan, catatan)
  values (p_ticket, p_message, lower(btrim(p_aktor)), p_keputusan, nullif(btrim(p_catatan),''))
  returning * into v_r;
  update public.consultation_tickets
     set status = case when p_keputusan = 'disetujui' then 'terjawab' else 'ditugaskan' end
   where id = p_ticket returning * into v_t;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','review_' || p_keputusan, p_ticket,
          json_build_object('message_id', p_message, 'catatan', nullif(btrim(p_catatan),'')));
  return json_build_object('review_id', v_r.id, 'keputusan', v_r.keputusan, 'status', v_t.status);
end $$;

-- ==========================================================================
-- H. LAYANAN PUBLIKASI
-- ==========================================================================
create or replace function public.consultation_svc_ajukan_publikasi(
  p_ticket uuid, p_judul text, p_pertanyaan_samar text, p_jawaban_final text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets; v_p public.consultation_publications;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_t.status not in ('terjawab','selesai') then
    raise exception 'Tiket belum memiliki jawaban final';
  end if;
  if exists (select 1 from public.consultation_publications p
             where p.ticket_id = p_ticket and p.published) then
    raise exception 'Publikasi sudah terbit';
  end if;
  insert into public.consultation_publications
    (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh,
     persetujuan_pemohon, persetujuan_pemohon_at)
  values (p_ticket, btrim(p_judul), btrim(p_pertanyaan_samar), btrim(p_jawaban_final),
          lower(btrim(p_aktor)),
          coalesce((select c.persetujuan_publikasi from public.consultation_requester_contacts c
                     where c.ticket_id = p_ticket), false),
          case when coalesce((select c.persetujuan_publikasi from public.consultation_requester_contacts c
                               where c.ticket_id = p_ticket), false) then now() else null end)
  on conflict (ticket_id) do update
    set judul_publik = excluded.judul_publik,
        pertanyaan_samar = excluded.pertanyaan_samar,
        jawaban_final = excluded.jawaban_final,
        disamarkan_oleh = excluded.disamarkan_oleh,
        persetujuan_pemohon = excluded.persetujuan_pemohon,
        persetujuan_pemohon_at = excluded.persetujuan_pemohon_at,
        updated_at = now()
  returning * into v_p;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id)
  values (lower(btrim(p_aktor)),'staf','publikasi_diajukan',p_ticket);
  return json_build_object('id', v_p.id, 'published', v_p.published,
                           'persetujuan_pemohon', v_p.persetujuan_pemohon,
                           'disetujui_reviewer', v_p.disetujui_reviewer,
                           'disetujui_admin', v_p.disetujui_admin);
end $$;

create or replace function public.consultation_svc_setujui_publikasi(
  p_ticket uuid, p_setuju boolean, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_p public.consultation_publications; v_setuju boolean := coalesce(p_setuju,false);
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role = 'reviewer' then
    update public.consultation_publications
       set disetujui_reviewer = v_setuju,
           disetujui_reviewer_oleh = case when v_setuju then lower(btrim(p_aktor)) else null end,
           disetujui_reviewer_at = case when v_setuju then now() else null end
     where ticket_id = p_ticket returning * into v_p;
  elsif v_role = 'admin_konsultasi' then
    update public.consultation_publications
       set disetujui_admin = v_setuju,
           disetujui_admin_oleh = case when v_setuju then lower(btrim(p_aktor)) else null end,
           disetujui_admin_at = case when v_setuju then now() else null end
     where ticket_id = p_ticket returning * into v_p;
  else
    raise exception 'Hanya reviewer/admin konsultasi yang dapat menyetujui publikasi';
  end if;
  if v_p.id is null then raise exception 'Publikasi belum diajukan'; end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf',
          case when v_setuju then 'publikasi_disetujui' else 'publikasi_persetujuan_dibatalkan' end,
          p_ticket, json_build_object('peran', v_role));
  return json_build_object('persetujuan_pemohon', v_p.persetujuan_pemohon,
                           'disetujui_reviewer', v_p.disetujui_reviewer,
                           'disetujui_admin', v_p.disetujui_admin);
end $$;

create or replace function public.consultation_svc_terbitkan(
  p_ticket uuid, p_slug text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_p public.consultation_publications;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  update public.consultation_publications
     set slug = lower(btrim(p_slug)), published = true
   where ticket_id = p_ticket returning * into v_p;
  if v_p.id is null then raise exception 'Publikasi belum diajukan'; end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','publikasi_terbit',p_ticket,
          json_build_object('slug', v_p.slug, 'published_at', v_p.published_at));
  return json_build_object('slug', v_p.slug, 'published', v_p.published,
                           'published_at', v_p.published_at);
end $$;

create or replace function public.consultation_svc_cabut_publikasi(
  p_ticket uuid, p_alasan text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_p public.consultation_publications;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  update public.consultation_publications
     set published = false,
         persetujuan_pemohon = false,
         persetujuan_pemohon_at = null,
         dicabut = true,
         dicabut_at = coalesce(dicabut_at, now()),
         dicabut_alasan = coalesce(nullif(btrim(p_alasan),''), 'Dibatalkan admin konsultasi')
   where ticket_id = p_ticket returning * into v_p;
  if v_p.id is null then raise exception 'Publikasi belum diajukan'; end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','publikasi_dicabut',p_ticket,
          json_build_object('alasan', v_p.dicabut_alasan));
  return json_build_object('published', v_p.published, 'dicabut', v_p.dicabut,
                           'dicabut_at', v_p.dicabut_at);
end $$;

-- ==========================================================================
-- I. LAYANAN PUBLIK (hanya konten yang sudah terbit)
-- ==========================================================================
-- I0) Kategori aktif untuk formulir pengajuan (tanpa data internal).
create or replace function public.consultation_svc_kategori()
returns json language plpgsql as $$
begin
  return coalesce((select json_agg(json_build_object(
      'kode', c.kode, 'nama', c.nama, 'deskripsi', c.deskripsi)
      order by c.sort, c.nama)
    from public.consultation_categories c
   where c.aktif), '[]'::json);
end $$;

create or replace function public.consultation_svc_publik_list(
  p_limit integer default 20, p_offset integer default 0
) returns json language plpgsql as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit,20), 100));
  v_offset integer := greatest(0, coalesce(p_offset,0));
begin
  return coalesce((select json_agg(json_build_object(
      'slug', x.slug, 'judul', x.judul_publik, 'pertanyaan', x.pertanyaan_samar,
      'jawaban', x.jawaban_final, 'published_at', x.published_at)
      order by x.published_at desc)
    from (select p.slug, p.judul_publik, p.pertanyaan_samar, p.jawaban_final, p.published_at
            from public.consultation_publications p
           where p.published
           order by p.published_at desc limit v_limit offset v_offset) x), '[]'::json);
end $$;

create or replace function public.consultation_svc_publik_detail(p_slug text)
returns json language plpgsql as $$
declare v_p public.consultation_publications;
begin
  select * into v_p from public.consultation_publications
   where slug = lower(btrim(p_slug)) and published;
  if v_p.id is null then
    raise exception 'Publikasi tidak ditemukan';
  end if;
  return json_build_object(
    'slug', v_p.slug, 'judul', v_p.judul_publik,
    'pertanyaan', v_p.pertanyaan_samar, 'jawaban', v_p.jawaban_final,
    'published_at', v_p.published_at);
end $$;

-- ==========================================================================
-- K. LAMPIRAN (metadata) — objek fisik ada di bucket privat
--    consultation-private; Edge Function mengunggah/menandatangani URL
--    memakai service_role SETELAH RPC ini memvalidasi kewenangan.
-- ==========================================================================

-- K0) Validasi kredensial tiket untuk unggahan lampiran (mengembalikan id).
create or replace function public.consultation_svc_tiket_kredensial(
  p_nomor text,
  p_secret_hash text
) returns json language plpgsql as $$
declare v_ticket public.consultation_tickets;
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;
  if v_ticket.status in ('selesai','ditolak') then
    raise exception 'Tiket sudah ditutup';
  end if;
  return json_build_object('id', v_ticket.id, 'status', v_ticket.status);
end $$;

-- K0b) Izin unggah staf — diperiksa SEBELUM objek disimpan ke storage,
--      agar tidak ada byte yang ditulis oleh pihak tak berwenang.
create or replace function public.consultation_svc_lampiran_izin(
  p_ticket uuid,
  p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_role = 'konsultan' and not exists (
    select 1 from public.consultation_assignments a
     where a.ticket_id = p_ticket
       and a.konsultan_email = lower(btrim(p_aktor))
       and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  return json_build_object('boleh', true, 'status', v_t.status);
end $$;

-- K1) Pemohon mendaftarkan lampiran untuk tiketnya (kredensial wajib valid).
--     Path WAJIB berada di bawah tickets/<ticket_id>/ agar tidak bisa
--     menunjuk objek tiket lain (pertahanan berlapis di samping trigger).
create or replace function public.consultation_svc_lampiran_pemohon(
  p_nomor text,
  p_secret_hash text,
  p_storage_path text,
  p_nama_file text,
  p_mime text,
  p_size_bytes integer
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
  v_a public.consultation_attachments;
  v_path text := btrim(coalesce(p_storage_path, ''));
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;
  if v_path not like 'tickets/' || v_ticket.id::text || '/%' then
    raise exception 'Path lampiran tidak valid';
  end if;
  insert into public.consultation_attachments
    (ticket_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
  values (v_ticket.id, v_path, btrim(p_nama_file), p_mime, p_size_bytes, 'pemohon')
  returning * into v_a;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values ('pemohon','pemohon','lampiran_diunggah', v_ticket.id,
          json_build_object('attachment_id', v_a.id, 'mime', v_a.mime, 'size', v_a.size_bytes));
  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime,
                           'size_bytes', v_a.size_bytes);
end $$;

-- K2) Staf (admin/konsultan yang ditugaskan/reviewer) mendaftarkan lampiran.
create or replace function public.consultation_svc_lampiran_staf(
  p_ticket uuid,
  p_storage_path text,
  p_nama_file text,
  p_mime text,
  p_size_bytes integer,
  p_message_id uuid,
  p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_a public.consultation_attachments;
  v_path text := btrim(coalesce(p_storage_path, ''));
begin
  v_role := public.consultation_svc_peran(p_aktor);
  select * into v_t from public.consultation_tickets where id = p_ticket;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_role = 'konsultan' and not exists (
    select 1 from public.consultation_assignments a
     where a.ticket_id = p_ticket
       and a.konsultan_email = lower(btrim(p_aktor))
       and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  if v_path not like 'tickets/' || p_ticket::text || '/%' then
    raise exception 'Path lampiran tidak valid';
  end if;
  if p_message_id is not null and not exists (
    select 1 from public.consultation_messages m
     where m.id = p_message_id and m.ticket_id = p_ticket) then
    raise exception 'Lampiran tidak cocok dengan tiket pesan yang dirujuk';
  end if;
  insert into public.consultation_attachments
    (ticket_id, message_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
  values (p_ticket, p_message_id, v_path, btrim(p_nama_file), p_mime, p_size_bytes,
          lower(btrim(p_aktor)))
  returning * into v_a;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','lampiran_staf_diunggah', p_ticket,
          json_build_object('attachment_id', v_a.id, 'mime', v_a.mime));
  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime,
                           'size_bytes', v_a.size_bytes);
end $$;

-- K3) Pemohon mengambil metadata lampiran milik tiketnya (untuk signed URL).
create or replace function public.consultation_svc_lampiran_pemohon_ambil(
  p_nomor text,
  p_secret_hash text,
  p_attachment uuid
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
  v_a public.consultation_attachments;
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;
  select * into v_a from public.consultation_attachments
   where id = p_attachment and ticket_id = v_ticket.id;
  if v_a.id is null then
    raise exception 'Lampiran tidak ditemukan';
  end if;
  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime);
end $$;

-- K4) Staf mengambil metadata lampiran sesuai kewenangan role.
create or replace function public.consultation_svc_lampiran_staf_ambil(
  p_attachment uuid,
  p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_a public.consultation_attachments;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  select * into v_a from public.consultation_attachments where id = p_attachment;
  if v_a.id is null then raise exception 'Lampiran tidak ditemukan'; end if;
  if v_role = 'konsultan' and not exists (
    select 1 from public.consultation_assignments a
     where a.ticket_id = v_a.ticket_id
       and a.konsultan_email = lower(btrim(p_aktor))
       and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  return json_build_object('id', v_a.id, 'ticket_id', v_a.ticket_id,
                           'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime);
end $$;

-- ==========================================================================
-- L. RATE LIMIT PERSISTEN (lintas instance Edge Function)
--    bucket = hash(IP) — IP mentah tidak pernah disimpan.
-- ==========================================================================
create or replace function public.consultation_svc_rate_hit(
  p_bucket text,
  p_endpoint text,
  p_limit integer,
  p_window_seconds integer
) returns json language plpgsql as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 30), 1000));
  v_window integer := greatest(1, least(coalesce(p_window_seconds, 60), 86400));
  v_count integer;
begin
  if coalesce(btrim(p_bucket), '') = '' or coalesce(btrim(p_endpoint), '') = '' then
    raise exception 'Bucket rate-limit wajib diisi';
  end if;
  -- Pembersihan oportunistik (jarang) agar tabel tidak tumbuh tanpa batas.
  if random() < 0.02 then
    delete from public.consultation_rate_hits where at < now() - interval '2 hours';
  end if;
  select count(*) into v_count
    from public.consultation_rate_hits h
   where h.bucket = p_bucket
     and h.endpoint = p_endpoint
     and h.at > now() - make_interval(secs => v_window);
  if v_count >= v_limit then
    return json_build_object('allowed', false, 'retry_after', v_window, 'sisa', 0);
  end if;
  insert into public.consultation_rate_hits (bucket, endpoint) values (p_bucket, p_endpoint);
  return json_build_object('allowed', true, 'retry_after', 0,
                           'sisa', greatest(0, v_limit - v_count - 1));
end $$;

-- ==========================================================================
-- M. AUDIT PERISTIWA KEAMANAN (dari lapisan HTTP)
--    Hanya peristiwa yang tidak tercatat RPC bisnis (mis. rate-limit,
--    autentikasi gagal, unggahan ditolak). Aktor divalidasi trigger audit.
-- ==========================================================================
create or replace function public.consultation_svc_catat_audit(
  p_aktor text,
  p_aktor_jenis text,
  p_aksi text,
  p_ticket uuid,
  p_detail jsonb
) returns json language plpgsql as $$
declare v_jenis text := lower(btrim(coalesce(p_aktor_jenis, 'sistem')));
begin
  if v_jenis not in ('pemohon','staf','sistem') then
    raise exception 'Jenis aktor audit tidak valid';
  end if;
  if coalesce(btrim(p_aksi), '') = '' then
    raise exception 'Aksi audit wajib diisi';
  end if;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (case when v_jenis = 'staf' then lower(btrim(p_aktor))
               when v_jenis = 'sistem' then 'sistem'
               else coalesce(nullif(btrim(p_aktor), ''), 'pemohon') end,
          v_jenis, btrim(p_aksi), p_ticket, coalesce(p_detail, '{}'::jsonb));
  return json_build_object('ok', true);
end $$;

-- ==========================================================================
-- N. HAK EKSEKUSI — hanya service_role (Edge Function tepercaya)
--    (dijalankan terakhir agar seluruh RPC di atas sudah terdaftar)
-- ==========================================================================
revoke all on function
  public.consultation_svc_peran(text),
  public.consultation_svc_buat_tiket(text,text,text,text,text,text,text,boolean,boolean),
  public.consultation_svc_akses_tiket(text,text),
  public.consultation_svc_pesan_pemohon(text,text,text),
  public.consultation_svc_persetujuan_pemohon(text,text,boolean),
  public.consultation_svc_staf_daftar(text,text,integer,integer),
  public.consultation_svc_staf_detail(text,uuid),
  public.consultation_svc_staf_riwayat(text,uuid),
  public.consultation_svc_sla(text),
  public.consultation_svc_verifikasi(uuid,text),
  public.consultation_svc_tolak(uuid,text,text),
  public.consultation_svc_status(uuid,text,text,text),
  public.consultation_svc_tugaskan(uuid,text,text),
  public.consultation_svc_lepas(uuid,text,text),
  public.consultation_svc_jawab(uuid,text,text),
  public.consultation_svc_pesan_staf(uuid,text,text,boolean,text),
  public.consultation_svc_review(uuid,uuid,text,text,text),
  public.consultation_svc_ajukan_publikasi(uuid,text,text,text,text),
  public.consultation_svc_setujui_publikasi(uuid,boolean,text),
  public.consultation_svc_terbitkan(uuid,text,text),
  public.consultation_svc_cabut_publikasi(uuid,text,text),
  public.consultation_svc_lampiran_pemohon(text,text,text,text,text,integer),
  public.consultation_svc_lampiran_staf(uuid,text,text,text,integer,uuid,text),
  public.consultation_svc_lampiran_pemohon_ambil(text,text,uuid),
  public.consultation_svc_lampiran_staf_ambil(uuid,text),
  public.consultation_svc_tiket_kredensial(text,text),
  public.consultation_svc_lampiran_izin(uuid,text),
  public.consultation_svc_rate_hit(text,text,integer,integer),
  public.consultation_svc_catat_audit(text,text,text,uuid,jsonb),
  public.consultation_svc_kategori(),
  public.consultation_svc_publik_list(integer,integer),
  public.consultation_svc_publik_detail(text)
  from public, anon, authenticated;

grant execute on function
  public.consultation_svc_peran(text),
  public.consultation_svc_buat_tiket(text,text,text,text,text,text,text,boolean,boolean),
  public.consultation_svc_akses_tiket(text,text),
  public.consultation_svc_pesan_pemohon(text,text,text),
  public.consultation_svc_persetujuan_pemohon(text,text,boolean),
  public.consultation_svc_staf_daftar(text,text,integer,integer),
  public.consultation_svc_staf_detail(text,uuid),
  public.consultation_svc_staf_riwayat(text,uuid),
  public.consultation_svc_sla(text),
  public.consultation_svc_verifikasi(uuid,text),
  public.consultation_svc_tolak(uuid,text,text),
  public.consultation_svc_status(uuid,text,text,text),
  public.consultation_svc_tugaskan(uuid,text,text),
  public.consultation_svc_lepas(uuid,text,text),
  public.consultation_svc_jawab(uuid,text,text),
  public.consultation_svc_pesan_staf(uuid,text,text,boolean,text),
  public.consultation_svc_review(uuid,uuid,text,text,text),
  public.consultation_svc_ajukan_publikasi(uuid,text,text,text,text),
  public.consultation_svc_setujui_publikasi(uuid,boolean,text),
  public.consultation_svc_terbitkan(uuid,text,text),
  public.consultation_svc_cabut_publikasi(uuid,text,text),
  public.consultation_svc_lampiran_pemohon(text,text,text,text,text,integer),
  public.consultation_svc_lampiran_staf(uuid,text,text,text,integer,uuid,text),
  public.consultation_svc_lampiran_pemohon_ambil(text,text,uuid),
  public.consultation_svc_lampiran_staf_ambil(uuid,text),
  public.consultation_svc_tiket_kredensial(text,text),
  public.consultation_svc_lampiran_izin(uuid,text),
  public.consultation_svc_rate_hit(text,text,integer,integer),
  public.consultation_svc_catat_audit(text,text,text,uuid,jsonb),
  public.consultation_svc_kategori(),
  public.consultation_svc_publik_list(integer,integer),
  public.consultation_svc_publik_detail(text)
  to service_role;
