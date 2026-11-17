-- Phase 2 security hardening: attachment visibility, answer approval,
-- review serialization, and atomic persistent rate limiting.
-- Safe to apply after consultation_004_services.sql. No data rewrite.
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
      where m.ticket_id = v_ticket.id
        and (m.terlihat_pemohon or exists (
          select 1 from public.consultation_reviews r
           where r.message_id = m.id and r.ticket_id = m.ticket_id
             and r.keputusan = 'disetujui'
        ))), '[]'::json),
    'lampiran', coalesce((select json_agg(json_build_object(
        'id', a.id, 'message_id', a.message_id, 'nama_file', a.nama_file,
        'mime', a.mime, 'size_bytes', a.size_bytes, 'created_at', a.created_at)
        order by a.created_at)
      from public.consultation_attachments a
      where a.ticket_id = v_ticket.id
        and (a.diunggah_oleh = 'pemohon' or exists (
          select 1 from public.consultation_messages m
           where m.id = a.message_id and m.ticket_id = a.ticket_id
             and (m.terlihat_pemohon or exists (
               select 1 from public.consultation_reviews r
                where r.message_id = m.id and r.ticket_id = m.ticket_id
                  and r.keputusan = 'disetujui'
             ))
        ))), '[]'::json),
    'publikasi', (select json_build_object(
        'published', p.published,
        'persetujuan_pemohon', p.persetujuan_pemohon,
        'disetujui_reviewer', p.disetujui_reviewer,
        'disetujui_admin', p.disetujui_admin,
        'dicabut', p.dicabut)
      from public.consultation_publications p where p.ticket_id = v_ticket.id)
  );
end $$;

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
  if v_a.diunggah_oleh <> 'pemohon' and not exists (
    select 1 from public.consultation_messages m
     where m.id = v_a.message_id
       and m.ticket_id = v_a.ticket_id
       and (m.terlihat_pemohon or exists (
         select 1 from public.consultation_reviews r
          where r.message_id = m.id and r.ticket_id = m.ticket_id
            and r.keputusan = 'disetujui'
       ))
  ) then
    raise exception 'Lampiran belum dapat dilihat pemohon';
  end if;
  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime);
end $$;

create or replace function public.consultation_svc_jawab(
  p_ticket uuid, p_isi text, p_aktor text
) returns json language plpgsql as $$
declare v_role text; v_t public.consultation_tickets; v_m public.consultation_messages;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'konsultan' then raise exception 'Hanya konsultan'; end if;
  select * into v_t from public.consultation_tickets where id = p_ticket for update;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if not exists (select 1 from public.consultation_assignments a
                 where a.ticket_id = p_ticket
                   and a.konsultan_email = lower(btrim(p_aktor))
                   and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  if v_t.status not in ('ditugaskan','menunggu_informasi','menunggu_review') then
    raise exception 'Status tiket tidak siap dijawab';
  end if;
  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (p_ticket, 'konsultan', lower(btrim(p_aktor)), 'jawaban_konsultan',
          btrim(p_isi), false)
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
declare
  v_role text;
  v_t public.consultation_tickets;
  v_m public.consultation_messages;
  v_visible boolean := coalesce(p_terlihat, true);
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role = 'konsultan'
     and not exists (select 1 from public.consultation_assignments a
                     where a.ticket_id = p_ticket
                       and a.konsultan_email = lower(btrim(p_aktor))
                       and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  if v_role = 'konsultan' then
    -- Jawaban konsultan selalu melalui RPC khusus dan menunggu review.
    v_visible := false;
  end if;
  if p_jenis = 'jawaban_final' and v_visible then
    if v_role <> 'admin_konsultasi' then
      raise exception 'Jawaban final hanya dapat diterbitkan admin konsultasi';
    end if;
    select * into v_t from public.consultation_tickets where id = p_ticket for update;
    if v_t.id is null or v_t.status not in ('terjawab','selesai')
       or not exists (
         select 1 from public.consultation_reviews r
          where r.ticket_id = p_ticket and r.keputusan = 'disetujui'
       ) then
      raise exception 'Jawaban final menunggu persetujuan reviewer';
    end if;
  end if;
  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (p_ticket, v_role, lower(btrim(p_aktor)), p_jenis, btrim(p_isi), v_visible)
  returning * into v_m;
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)),'staf','pesan_staf',p_ticket,
          json_build_object('jenis_pesan', p_jenis, 'message_id', v_m.id));
  return json_build_object('id', v_m.id, 'jenis_pesan', v_m.jenis_pesan,
                           'terlihat_pemohon', v_m.terlihat_pemohon);
end $$;

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
  select * into v_t from public.consultation_tickets where id = p_ticket for update;
  if v_t.id is null then raise exception 'Tiket tidak ditemukan'; end if;
  if v_t.status <> 'menunggu_review' then
    raise exception 'Tiket tidak dalam status menunggu review';
  end if;
  if not exists (
    select 1 from public.consultation_messages m
     where m.id = p_message and m.ticket_id = p_ticket
       and m.jenis_pesan = 'jawaban_konsultan'
       and m.pengirim_jenis = 'konsultan'
  ) then
    raise exception 'Jawaban konsultan tidak ditemukan pada tiket ini';
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
  -- Serialisasi per bucket+endpoint mencegah dua request lolos bersamaan.
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_endpoint, 0));
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