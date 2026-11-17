-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — Phase 2.2
-- 006_security_hardening: current-answer review, requester visibility,
-- publication revision approvals, and ticket-scoped staff attachment access.
--
-- PRASYARAT: consultation_001_foundation.sql through
--            consultation_005_security_hardening.sql, in that order.
--
-- SAFETY:
--   * Additive migration. Does not rewrite or delete messages/reviews.
--   * Messages and reviews remain append-only.
--   * Existing publication approvals are treated as approvals for the
--     current snapshot at migration time. Any later content edit resets them.
--   * Does not deploy Edge Functions or alter Storage objects.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- A. Indexes for deterministic latest-answer and latest-review lookups.
-- --------------------------------------------------------------------------
create index if not exists consultation_messages_latest_answer
  on public.consultation_messages (ticket_id, created_at desc, id desc)
  where jenis_pesan = 'jawaban_konsultan';

create index if not exists consultation_reviews_latest_message
  on public.consultation_reviews (message_id, reviewed_at desc, id desc);

-- --------------------------------------------------------------------------
-- B. Review trigger: only the latest answer may be reviewed, once.
--    Locking the ticket serializes direct inserts with answer/review RPCs.
-- --------------------------------------------------------------------------
create or replace function public.consultation_review_check()
returns trigger language plpgsql as $$
declare
  v_ticket_status text;
  v_answer record;
begin
  select t.status into v_ticket_status
    from public.consultation_tickets t
   where t.id = new.ticket_id
   for update;
  if not found then
    raise exception 'Tiket review tidak ditemukan';
  end if;

  select m.id, m.pengirim_email, m.jenis_pesan, m.ticket_id
    into v_answer
    from public.consultation_messages m
   where m.id = new.message_id
     and m.ticket_id = new.ticket_id;
  if not found or v_answer.jenis_pesan <> 'jawaban_konsultan' then
    raise exception 'Yang dapat direview hanya jawaban konsultan pada tiket yang sama';
  end if;

  if v_answer.id is distinct from (
    select m.id
      from public.consultation_messages m
     where m.ticket_id = new.ticket_id
       and m.jenis_pesan = 'jawaban_konsultan'
     order by m.created_at desc, m.id desc
     limit 1
  ) then
    raise exception 'Hanya jawaban konsultan terbaru yang dapat direview';
  end if;

  if exists (
    select 1 from public.consultation_reviews r
     where r.message_id = new.message_id
  ) then
    raise exception 'Jawaban ini sudah pernah direview; kirim jawaban baru untuk review ulang';
  end if;

  if coalesce(v_ticket_status, '') <> 'menunggu_review' then
    raise exception 'Tiket tidak berada dalam status menunggu review';
  end if;

  if new.reviewer_email is null
     or v_answer.pengirim_email = lower(btrim(new.reviewer_email)) then
    raise exception 'Reviewer tidak dapat menyetujui jawabannya sendiri';
  end if;

  if not exists (
    select 1 from public.consultation_staff_roles r
     where r.email = lower(btrim(new.reviewer_email))
       and r.role_konsultasi = 'reviewer'
       and r.aktif
  ) then
    raise exception 'Reviewer harus ber-role reviewer dan aktif';
  end if;

  return new;
end $$;

-- Existing trigger already calls this function; CREATE OR REPLACE preserves it.

-- --------------------------------------------------------------------------
-- C. Answer submission: only assigned consultant; no second answer while
--    another answer is still waiting for review.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_jawab(
  p_ticket uuid, p_isi text, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_m public.consultation_messages;
  v_resume_status text;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'konsultan' then
    raise exception 'Hanya konsultan';
  end if;
  if coalesce(btrim(p_isi), '') = '' or char_length(btrim(p_isi)) > 10000 then
    raise exception 'Isi jawaban wajib diisi dan maksimal 10000 karakter';
  end if;

  select * into v_t
    from public.consultation_tickets
   where id = p_ticket
   for update;
  if v_t.id is null then
    raise exception 'Tiket tidak ditemukan';
  end if;
  if not exists (
    select 1 from public.consultation_assignments a
     where a.ticket_id = p_ticket
       and a.konsultan_email = lower(btrim(p_aktor))
       and a.dilepas_at is null
  ) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
  if v_t.status = 'menunggu_informasi' then
    v_resume_status := v_t.status_sebelum_pause;
    if v_resume_status not in ('ditugaskan','terjawab') then
      raise exception 'Status asal jeda tidak valid untuk melanjutkan jawaban';
    end if;
    update public.consultation_tickets
       set status = v_resume_status
     where id = p_ticket returning * into v_t;
  elsif v_t.status <> 'ditugaskan' then
    raise exception 'Tiket tidak siap dijawab; pastikan review sebelumnya telah selesai';
  end if;

  -- Jika jeda berasal dari status terjawab, pemohon telah membuka percakapan
  -- kembali. Kembalikan tiket ke tahap pengerjaan sebelum mengirim jawaban baru.
  if v_t.status = 'terjawab' then
    update public.consultation_tickets
       set status = 'ditugaskan'
     where id = p_ticket returning * into v_t;
  end if;
  if v_t.status <> 'ditugaskan' then
    raise exception 'Tiket belum kembali ke tahap pengerjaan';
  end if;

  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values
    (p_ticket, 'konsultan', lower(btrim(p_aktor)), 'jawaban_konsultan',
     btrim(p_isi), false)
  returning * into v_m;

  update public.consultation_tickets
     set status = 'menunggu_review'
   where id = p_ticket
   returning * into v_t;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'jawaban_konsultan', p_ticket,
          json_build_object('message_id', v_m.id));

  return json_build_object('message_id', v_m.id, 'status', v_t.status);
end $$;

-- --------------------------------------------------------------------------
-- D. Review RPC: lock ticket, verify latest answer, and record one decision.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_review(
  p_ticket uuid, p_message uuid, p_keputusan text, p_catatan text, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_r public.consultation_reviews;
  v_latest uuid;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'reviewer' then
    raise exception 'Hanya reviewer';
  end if;
  if p_keputusan not in ('disetujui','minta_revisi') then
    raise exception 'Keputusan review tidak valid';
  end if;
  if p_keputusan = 'minta_revisi' and coalesce(btrim(p_catatan), '') = '' then
    raise exception 'Catatan wajib diisi saat meminta revisi';
  end if;

  select * into v_t
    from public.consultation_tickets
   where id = p_ticket
   for update;
  if v_t.id is null then
    raise exception 'Tiket tidak ditemukan';
  end if;
  if v_t.status <> 'menunggu_review' then
    raise exception 'Tiket tidak dalam status menunggu review';
  end if;

  select m.id into v_latest
    from public.consultation_messages m
   where m.ticket_id = p_ticket
     and m.jenis_pesan = 'jawaban_konsultan'
   order by m.created_at desc, m.id desc
   limit 1;
  if v_latest is null or v_latest <> p_message then
    raise exception 'Review hanya dapat diberikan untuk jawaban konsultan terbaru';
  end if;
  if exists (select 1 from public.consultation_reviews r where r.message_id = p_message) then
    raise exception 'Jawaban ini sudah pernah direview';
  end if;

  insert into public.consultation_reviews
    (ticket_id, message_id, reviewer_email, keputusan, catatan)
  values
    (p_ticket, p_message, lower(btrim(p_aktor)), p_keputusan,
     nullif(btrim(p_catatan), ''))
  returning * into v_r;

  update public.consultation_tickets
     set status = case when p_keputusan = 'disetujui' then 'terjawab' else 'ditugaskan' end
   where id = p_ticket
   returning * into v_t;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'review_' || p_keputusan, p_ticket,
          json_build_object('message_id', p_message,
                            'review_id', v_r.id,
                            'catatan', nullif(btrim(p_catatan), '')));

  return json_build_object('review_id', v_r.id, 'keputusan', v_r.keputusan,
                           'status', v_t.status);
end $$;

-- --------------------------------------------------------------------------
-- E. Requester view: consultant answers are visible only when the latest
--    answer has an approved review. Legacy visible=true cannot bypass this.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_akses_tiket(
  p_nomor text,
  p_secret_hash text
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
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

  update public.consultation_access_credentials
     set terakhir_akses_at = now()
   where ticket_id = v_ticket.id
     and secret_hash = lower(btrim(p_secret_hash))
     and dicabut_at is null;

  return json_build_object(
    'ticket', json_build_object(
      'id', v_ticket.id, 'nomor_tiket', v_ticket.nomor_tiket,
      'judul', v_ticket.judul, 'isi_pertanyaan', v_ticket.isi_pertanyaan,
      'status', v_ticket.status, 'sla_deadline', v_ticket.sla_deadline,
      'created_at', v_ticket.created_at, 'updated_at', v_ticket.updated_at
    ),
    'kontak', (select json_build_object(
        'nama', c.nama, 'whatsapp', c.whatsapp, 'email', c.email,
        'persetujuan_publikasi', coalesce((
          select p.persetujuan_pemohon from public.consultation_publications p
           where p.ticket_id = v_ticket.id
        ), false))
      from public.consultation_requester_contacts c
      where c.ticket_id = v_ticket.id),
    'pesan', coalesce((
      select json_agg(json_build_object(
        'id', m.id, 'pengirim_jenis', m.pengirim_jenis,
        'jenis_pesan', m.jenis_pesan, 'isi', m.isi, 'created_at', m.created_at
      ) order by m.created_at, m.id)
      from public.consultation_messages m
      where m.ticket_id = v_ticket.id
        and (
          (m.jenis_pesan <> 'jawaban_konsultan' and m.terlihat_pemohon)
          or (
            m.jenis_pesan = 'jawaban_konsultan'
            and m.id = (
              select ma.id from public.consultation_messages ma
               where ma.ticket_id = v_ticket.id
                 and ma.jenis_pesan = 'jawaban_konsultan'
               order by ma.created_at desc, ma.id desc limit 1
            )
            and (
              select r.keputusan from public.consultation_reviews r
               where r.message_id = m.id and r.ticket_id = m.ticket_id
               order by r.reviewed_at desc, r.id desc limit 1
            ) = 'disetujui'
          )
        )
    ), '[]'::json),
    'lampiran', coalesce((
      select json_agg(json_build_object(
        'id', a.id, 'message_id', a.message_id, 'nama_file', a.nama_file,
        'mime', a.mime, 'size_bytes', a.size_bytes, 'created_at', a.created_at
      ) order by a.created_at, a.id)
      from public.consultation_attachments a
      where a.ticket_id = v_ticket.id
        and (
          a.diunggah_oleh = 'pemohon'
          or exists (
            select 1 from public.consultation_messages m
             where m.id = a.message_id and m.ticket_id = a.ticket_id
               and (
                 (m.jenis_pesan <> 'jawaban_konsultan' and m.terlihat_pemohon)
                 or (
                   m.jenis_pesan = 'jawaban_konsultan'
                   and m.id = (
                     select ma.id from public.consultation_messages ma
                      where ma.ticket_id = v_ticket.id
                        and ma.jenis_pesan = 'jawaban_konsultan'
                      order by ma.created_at desc, ma.id desc limit 1
                   )
                   and (
                     select r.keputusan from public.consultation_reviews r
                      where r.message_id = m.id and r.ticket_id = m.ticket_id
                      order by r.reviewed_at desc, r.id desc limit 1
                   ) = 'disetujui'
                 )
               )
          )
        )
    ), '[]'::json),
    'publikasi', (select json_build_object(
        'published', p.published,
        'persetujuan_pemohon', p.persetujuan_pemohon,
        'disetujui_reviewer', p.disetujui_reviewer,
        'disetujui_admin', p.disetujui_admin,
        'dicabut', p.dicabut)
      from public.consultation_publications p where p.ticket_id = v_ticket.id)
  );
end $$;

-- --------------------------------------------------------------------------
-- F. Signed URL metadata: same requester visibility predicate as ticket view.
-- --------------------------------------------------------------------------
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
     where m.id = v_a.message_id and m.ticket_id = v_a.ticket_id
       and (
         (m.jenis_pesan <> 'jawaban_konsultan' and m.terlihat_pemohon)
         or (
           m.jenis_pesan = 'jawaban_konsultan'
           and m.id = (
             select ma.id from public.consultation_messages ma
              where ma.ticket_id = v_ticket.id
                and ma.jenis_pesan = 'jawaban_konsultan'
              order by ma.created_at desc, ma.id desc limit 1
           )
           and (
             select r.keputusan from public.consultation_reviews r
              where r.message_id = m.id and r.ticket_id = m.ticket_id
              order by r.reviewed_at desc, r.id desc limit 1
           ) = 'disetujui'
         )
       )
  ) then
    raise exception 'Lampiran belum dapat dilihat pemohon';
  end if;

  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime);
end $$;

-- --------------------------------------------------------------------------
-- G. Generic staff message: prevent bypass of the dedicated answer/review flow.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_pesan_staf(
  p_ticket uuid, p_jenis text, p_isi text, p_terlihat boolean, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_m public.consultation_messages;
  v_visible boolean := coalesce(p_terlihat, true);
  v_latest uuid;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if coalesce(btrim(p_isi), '') = '' or char_length(btrim(p_isi)) > 10000 then
    raise exception 'Isi pesan wajib diisi dan maksimal 10000 karakter';
  end if;
  if p_jenis = 'jawaban_konsultan' then
    raise exception 'Gunakan layanan jawaban konsultan agar wajib melalui review';
  end if;
  if p_jenis = 'jawaban_final' then
    if v_role <> 'admin_konsultasi' or not v_visible then
      raise exception 'Jawaban final hanya dapat diterbitkan admin konsultasi dan harus terlihat pemohon';
    end if;
    select * into v_t from public.consultation_tickets where id = p_ticket for update;
    if v_t.id is null or v_t.status not in ('terjawab','selesai') then
      raise exception 'Tiket belum berada pada status jawaban final';
    end if;
    select m.id into v_latest
      from public.consultation_messages m
     where m.ticket_id = p_ticket and m.jenis_pesan = 'jawaban_konsultan'
     order by m.created_at desc, m.id desc limit 1;
    if v_latest is null or (
      select r.keputusan from public.consultation_reviews r
       where r.ticket_id = p_ticket and r.message_id = v_latest
       order by r.reviewed_at desc, r.id desc limit 1
    ) is distinct from 'disetujui' then
      raise exception 'Jawaban final menunggu persetujuan atas jawaban konsultan terbaru';
    end if;
  elsif v_role = 'konsultan' then
    if not exists (
      select 1 from public.consultation_assignments a
       where a.ticket_id = p_ticket
         and a.konsultan_email = lower(btrim(p_aktor))
         and a.dilepas_at is null
    ) then
      raise exception 'Tiket tidak ditugaskan kepada Anda';
    end if;
    v_visible := false;
  end if;

  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (p_ticket, v_role, lower(btrim(p_aktor)), p_jenis, btrim(p_isi), v_visible)
  returning * into v_m;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'pesan_staf', p_ticket,
          json_build_object('jenis_pesan', p_jenis, 'message_id', v_m.id));

  return json_build_object('id', v_m.id, 'jenis_pesan', v_m.jenis_pesan,
                           'terlihat_pemohon', v_m.terlihat_pemohon);
end $$;

-- --------------------------------------------------------------------------
-- H. Generic status RPC cannot impersonate a reviewer decision.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_status(
  p_ticket uuid, p_status text, p_alasan text, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_current text;
  v_t public.consultation_tickets;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then
    raise exception 'Hanya admin konsultasi';
  end if;

  select t.status into v_current
    from public.consultation_tickets t
   where t.id = p_ticket
   for update;
  if not found then
    raise exception 'Tiket tidak ditemukan';
  end if;
  if v_current = 'menunggu_review' and p_status in ('terjawab','ditugaskan') then
    raise exception 'Transisi dari menunggu_review hanya boleh melalui keputusan reviewer';
  end if;

  select * into v_t
    from public.consultation_ubah_status(p_ticket, p_status, p_alasan, p_aktor);
  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'status_diubah', p_ticket,
          json_build_object('status', p_status, 'alasan', nullif(btrim(p_alasan), '')));
  return json_build_object('id', v_t.id, 'status', v_t.status);
end $$;

-- --------------------------------------------------------------------------
-- I. Staff attachment operations are scoped to role and ticket state.
-- --------------------------------------------------------------------------
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
  select * into v_t from public.consultation_tickets where id = p_ticket for update;
  if v_t.id is null then
    raise exception 'Tiket tidak ditemukan';
  end if;
  if v_role = 'konsultan' and not exists (
    select 1 from public.consultation_assignments a
     where a.ticket_id = p_ticket
       and a.konsultan_email = lower(btrim(p_aktor))
       and a.dilepas_at is null
  ) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  elsif v_role = 'reviewer' and v_t.status <> 'menunggu_review' then
    raise exception 'Reviewer hanya dapat mengakses lampiran tiket yang menunggu review';
  end if;
  if v_path not like 'tickets/' || p_ticket::text || '/%' then
    raise exception 'Path lampiran tidak valid';
  end if;
  if p_message_id is not null and not exists (
    select 1 from public.consultation_messages m
     where m.id = p_message_id and m.ticket_id = p_ticket
  ) then
    raise exception 'Lampiran tidak cocok dengan tiket pesan yang dirujuk';
  end if;

  insert into public.consultation_attachments
    (ticket_id, message_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
  values (p_ticket, p_message_id, v_path, btrim(p_nama_file), p_mime,
          p_size_bytes, lower(btrim(p_aktor)))
  returning * into v_a;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'lampiran_staf_diunggah', p_ticket,
          json_build_object('attachment_id', v_a.id, 'mime', v_a.mime));
  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime,
                           'size_bytes', v_a.size_bytes);
end $$;

create or replace function public.consultation_svc_lampiran_staf_ambil(
  p_attachment uuid,
  p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_a public.consultation_attachments;
  v_status text;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  select * into v_a
    from public.consultation_attachments
   where id = p_attachment;
  if v_a.id is null then
    raise exception 'Lampiran tidak ditemukan';
  end if;

  if v_role = 'konsultan' then
    if not exists (
      select 1 from public.consultation_assignments a
       where a.ticket_id = v_a.ticket_id
         and a.konsultan_email = lower(btrim(p_aktor))
         and a.dilepas_at is null
    ) then
      raise exception 'Tiket tidak ditugaskan kepada Anda';
    end if;
  elsif v_role = 'reviewer' then
    select t.status into v_status
      from public.consultation_tickets t
     where t.id = v_a.ticket_id;
    if v_status <> 'menunggu_review' then
      raise exception 'Reviewer hanya dapat mengakses lampiran tiket yang menunggu review';
    end if;
  end if;

  return json_build_object('id', v_a.id, 'ticket_id', v_a.ticket_id,
                           'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime);
end $$;

-- --------------------------------------------------------------------------
-- J. Publication approvals are bound to a content revision.
--    Any edit to public text rotates the revision and clears every approval.
-- --------------------------------------------------------------------------
alter table public.consultation_publications
  add column if not exists content_revision uuid not null default gen_random_uuid(),
  add column if not exists persetujuan_pemohon_revision uuid,
  add column if not exists disetujui_reviewer_revision uuid,
  add column if not exists disetujui_admin_revision uuid;

-- Backfill the revision binding WITHOUT legitimising stale approvals.
--
-- Before this migration no content revision/hash was stored, so an approval may
-- be carried over only when history proves it still refers to the current
-- content. Two verifiable bases are accepted:
--   1. the approval is already bound to the current content_revision (this is a
--      re-apply: the revision guard has maintained that binding since SQL006);
--   2. the approval predates no recorded content submission: it is newer than
--      the latest audit 'publikasi_diajukan' for the ticket, the approver still
--      exists as an active staff member with that role (staff approvals), the
--      requester consent is still active and not newer than the stamp
--      (requester approval), the approval does not predate the last revocation
--      (approval_at >= dicabut_at), and the row has no write that cannot be
--      explained by a known lifecycle event (submission, approval, approval
--      change, publish, revocation, requester consent). An unexplained later
--      write may be an untracked content edit, so it is not trusted.
--   For the requester approval the stamp must reflect a consent FOR the current
--   content: either it was recorded together with the initial submission
--   (pemohon_at <= created_at) or an explicit consent event exists
--   (audit 'persetujuan_publikasi_diberikan' at/after the latest submission).
--   A general consent merely re-copied by a later re-submission is NOT proof,
--   so that approval is reset too.
-- The content hash that could be computed here is deliberately NOT used as
-- evidence. Anything that cannot be verified is RESET, never auto-approved.
-- A published row whose approvals are reset is unpublished in the same
-- statement so that ccp_terbit_butuh_persetujuan keeps holding. Revoked rows
-- keep their dicabut_at/dicabut_alasan history but lose the pre-revocation
-- approvals, so re-submission must go through fresh approvals
-- (timestamp >= dicabut_at).
-- The rewrite itself is documented with one audit row per publication
-- ('publikasi_migrasi_006'); because every UPDATE bumps updated_at, that audit
-- row lets a later apply tell the migration's own write apart from an
-- untracked (possibly content-editing) write, instead of resetting every row.
with konteks as (
  select
    p.*,
    (select max(a.at) from public.consultation_audit_logs a
      where a.ticket_id = p.ticket_id
        and a.aksi = 'publikasi_diajukan') as ajuan_terakhir,
    greatest(
      p.created_at, p.published_at, p.dicabut_at,
      p.persetujuan_pemohon_at, p.disetujui_reviewer_at, p.disetujui_admin_at,
      (select max(a.at) from public.consultation_audit_logs a
        where a.ticket_id = p.ticket_id
          and a.aksi in ('publikasi_diajukan','publikasi_disetujui',
                         'publikasi_persetujuan_dibatalkan','publikasi_terbit',
                         'publikasi_dicabut','persetujuan_publikasi_diberikan',
                         'persetujuan_publikasi_dicabut','publikasi_migrasi_006'))
    ) as tulis_dikenal
  from public.consultation_publications p
), penilaian as (
  select
    k.id,
    k.ticket_id,
    k.content_revision,
    k.published,
    coalesce(
      k.persetujuan_pemohon
      and (
        k.persetujuan_pemohon_revision = k.content_revision
        or (
          k.persetujuan_pemohon_at is not null
          and k.ajuan_terakhir is not null
          and k.persetujuan_pemohon_at >= k.ajuan_terakhir
          and (k.persetujuan_pemohon_at <= k.created_at
               or exists (
                 select 1 from public.consultation_audit_logs a
                  where a.ticket_id = k.ticket_id
                    and a.aksi = 'persetujuan_publikasi_diberikan'
                    and a.at >= k.ajuan_terakhir
                    and a.at <= k.persetujuan_pemohon_at))
          and (k.dicabut_at is null or k.persetujuan_pemohon_at >= k.dicabut_at)
          and k.updated_at <= k.tulis_dikenal
          and exists (
            select 1 from public.consultation_requester_contacts c
             where c.ticket_id = k.ticket_id
               and c.persetujuan_publikasi
               and c.persetujuan_publikasi_at is not null
               and c.persetujuan_publikasi_at <= k.persetujuan_pemohon_at)
        )
      ),
      false) as pemohon_sah,
    coalesce(
      k.disetujui_reviewer
      and (
        k.disetujui_reviewer_revision = k.content_revision
        or (
          k.disetujui_reviewer_oleh is not null
          and k.disetujui_reviewer_at is not null
          and k.ajuan_terakhir is not null
          and k.disetujui_reviewer_at >= k.ajuan_terakhir
          and (k.dicabut_at is null or k.disetujui_reviewer_at >= k.dicabut_at)
          and k.updated_at <= k.tulis_dikenal
          and exists (
            select 1 from public.consultation_staff_roles r
             where r.email = lower(k.disetujui_reviewer_oleh)
               and r.role_konsultasi = 'reviewer' and r.aktif)
        )
      ),
      false) as reviewer_sah,
    coalesce(
      k.disetujui_admin
      and (
        k.disetujui_admin_revision = k.content_revision
        or (
          k.disetujui_admin_oleh is not null
          and k.disetujui_admin_at is not null
          and k.ajuan_terakhir is not null
          and k.disetujui_admin_at >= k.ajuan_terakhir
          and (k.dicabut_at is null or k.disetujui_admin_at >= k.dicabut_at)
          and k.updated_at <= k.tulis_dikenal
          and exists (
            select 1 from public.consultation_staff_roles r
             where r.email = lower(k.disetujui_admin_oleh)
               and r.role_konsultasi = 'admin_konsultasi' and r.aktif)
        )
      ),
      false) as admin_sah
  from konteks k
), tulis as (
  update public.consultation_publications p
     set persetujuan_pemohon = n.pemohon_sah,
         persetujuan_pemohon_at = case when n.pemohon_sah then p.persetujuan_pemohon_at end,
         persetujuan_pemohon_revision = case when n.pemohon_sah then n.content_revision end,
         disetujui_reviewer = n.reviewer_sah,
         disetujui_reviewer_oleh = case when n.reviewer_sah then p.disetujui_reviewer_oleh end,
         disetujui_reviewer_at = case when n.reviewer_sah then p.disetujui_reviewer_at end,
         disetujui_reviewer_revision = case when n.reviewer_sah then n.content_revision end,
         disetujui_admin = n.admin_sah,
         disetujui_admin_oleh = case when n.admin_sah then p.disetujui_admin_oleh end,
         disetujui_admin_at = case when n.admin_sah then p.disetujui_admin_at end,
         disetujui_admin_revision = case when n.admin_sah then n.content_revision end,
         published = p.published and n.pemohon_sah and n.reviewer_sah and n.admin_sah
    from penilaian n
   where p.id = n.id
  returning p.id
)
-- Dokumentasikan tulisan migrasi (audit append-only) supaya apply berikutnya
-- dapat membedakan tulisan migrasi ini dari tulisan tak terlacak lain.
insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
select 'sistem', 'sistem', 'publikasi_migrasi_006', n.ticket_id,
       json_build_object('persetujuan_pemohon', n.pemohon_sah,
                         'disetujui_reviewer', n.reviewer_sah,
                         'disetujui_admin', n.admin_sah)
  from penilaian n
 where n.id in (select t.id from tulis t);

create or replace function public.consultation_publication_revision_guard()
returns trigger language plpgsql as $$
begin
  -- Let the established publication_check trigger report the invariant that
  -- INSERT must always start with published=false (including legacy tests).
  if tg_op = 'INSERT' and new.published then
    return new;
  end if;

  if tg_op = 'UPDATE' and (
       new.judul_publik is distinct from old.judul_publik
    or new.pertanyaan_samar is distinct from old.pertanyaan_samar
    or new.jawaban_final is distinct from old.jawaban_final
  ) then
    new.content_revision := gen_random_uuid();
    new.persetujuan_pemohon := false;
    new.persetujuan_pemohon_at := null;
    new.persetujuan_pemohon_revision := null;
    new.disetujui_reviewer := false;
    new.disetujui_reviewer_oleh := null;
    new.disetujui_reviewer_at := null;
    new.disetujui_reviewer_revision := null;
    new.disetujui_admin := false;
    new.disetujui_admin_oleh := null;
    new.disetujui_admin_at := null;
    new.disetujui_admin_revision := null;
    new.slug := null;
    new.published := false;
  end if;

  if not new.persetujuan_pemohon then
    new.persetujuan_pemohon_revision := null;
  elsif new.persetujuan_pemohon_revision is distinct from new.content_revision then
    raise exception 'Persetujuan pemohon tidak berlaku untuk revisi konten ini';
  end if;

  if not new.disetujui_reviewer then
    new.disetujui_reviewer_revision := null;
  elsif new.disetujui_reviewer_revision is distinct from new.content_revision then
    raise exception 'Persetujuan reviewer tidak berlaku untuk revisi konten ini';
  end if;

  if not new.disetujui_admin then
    new.disetujui_admin_revision := null;
  elsif new.disetujui_admin_revision is distinct from new.content_revision then
    raise exception 'Persetujuan admin tidak berlaku untuk revisi konten ini';
  end if;

  return new;
end $$;

drop trigger if exists trg_consultation_publication_00_revision_guard
  on public.consultation_publications;
create trigger trg_consultation_publication_00_revision_guard
  before insert or update on public.consultation_publications
  for each row execute function public.consultation_publication_revision_guard();

-- When requester consent is withdrawn, invalidate the entire approval chain.
-- This also avoids stale reviewer/admin stamps surviving a revocation cycle.
create or replace function public.consultation_consent_check()
returns trigger language plpgsql as $$
begin
  if new.persetujuan_publikasi and new.persetujuan_publikasi_at is null then
    raise exception 'Persetujuan publikasi wajib menyertakan waktu';
  end if;
  if not new.persetujuan_publikasi and new.persetujuan_publikasi_at is not null then
    raise exception 'Persetujuan publikasi bernilai false tetapi waktu terisi';
  end if;

  if tg_op = 'UPDATE'
     and old.persetujuan_publikasi
     and not new.persetujuan_publikasi then
    update public.consultation_publications
       set published = false,
           persetujuan_pemohon = false,
           persetujuan_pemohon_at = null,
           persetujuan_pemohon_revision = null,
           disetujui_reviewer = false,
           disetujui_reviewer_oleh = null,
           disetujui_reviewer_at = null,
           disetujui_reviewer_revision = null,
           disetujui_admin = false,
           disetujui_admin_oleh = null,
           disetujui_admin_at = null,
           disetujui_admin_revision = null,
           dicabut = true,
           dicabut_at = coalesce(dicabut_at, now()),
           dicabut_alasan = coalesce(dicabut_alasan, 'Persetujuan publikasi dicabut pemohon')
     where ticket_id = new.ticket_id
       and (published or persetujuan_pemohon or disetujui_reviewer or disetujui_admin);
  end if;
  return new;
end $$;

-- --------------------------------------------------------------------------
-- K. Publication draft: never inherit a prior/general requester consent.
--    A new explicit consent is required for the current content_revision.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_ajukan_publikasi(
  p_ticket uuid, p_judul text, p_pertanyaan_samar text, p_jawaban_final text, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_p public.consultation_publications;
  v_latest uuid;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then
    raise exception 'Hanya admin konsultasi';
  end if;

  select * into v_t from public.consultation_tickets where id = p_ticket for update;
  if v_t.id is null then
    raise exception 'Tiket tidak ditemukan';
  end if;
  if v_t.status not in ('terjawab','selesai') then
    raise exception 'Tiket belum memiliki jawaban final';
  end if;

  select m.id into v_latest
    from public.consultation_messages m
   where m.ticket_id = p_ticket and m.jenis_pesan = 'jawaban_konsultan'
   order by m.created_at desc, m.id desc limit 1;
  if v_latest is null or (
    select r.keputusan from public.consultation_reviews r
     where r.ticket_id = p_ticket and r.message_id = v_latest
     order by r.reviewed_at desc, r.id desc limit 1
  ) is distinct from 'disetujui' then
    raise exception 'Publikasi memerlukan persetujuan atas jawaban konsultan terbaru';
  end if;
  if exists (select 1 from public.consultation_publications p
              where p.ticket_id = p_ticket and p.published) then
    raise exception 'Publikasi sudah terbit';
  end if;
  if coalesce(btrim(p_judul), '') = ''
     or coalesce(btrim(p_pertanyaan_samar), '') = ''
     or coalesce(btrim(p_jawaban_final), '') = '' then
    raise exception 'Judul, pertanyaan samaran, dan jawaban final wajib diisi';
  end if;

  insert into public.consultation_publications
    (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh,
     persetujuan_pemohon, persetujuan_pemohon_at,
     disetujui_reviewer, disetujui_reviewer_oleh, disetujui_reviewer_at,
     disetujui_admin, disetujui_admin_oleh, disetujui_admin_at)
  values
    (p_ticket, btrim(p_judul), btrim(p_pertanyaan_samar), btrim(p_jawaban_final),
     lower(btrim(p_aktor)), false, null, false, null, null, false, null, null)
  on conflict (ticket_id) do update
    set judul_publik = excluded.judul_publik,
        pertanyaan_samar = excluded.pertanyaan_samar,
        jawaban_final = excluded.jawaban_final,
        disamarkan_oleh = excluded.disamarkan_oleh,
        updated_at = now()
  returning * into v_p;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'publikasi_diajukan', p_ticket,
          json_build_object('content_revision', v_p.content_revision));

  return json_build_object('id', v_p.id, 'published', v_p.published,
                           'content_revision', v_p.content_revision,
                           'persetujuan_pemohon', v_p.persetujuan_pemohon,
                           'disetujui_reviewer', v_p.disetujui_reviewer,
                           'disetujui_admin', v_p.disetujui_admin);
end $$;

-- --------------------------------------------------------------------------
-- L. Requester consent explicitly binds to the current publication revision.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_persetujuan_pemohon(
  p_nomor text,
  p_secret_hash text,
  p_setuju boolean
) returns json language plpgsql as $$
declare
  v_ticket public.consultation_tickets;
  v_setuju boolean := coalesce(p_setuju, false);
  v_publication public.consultation_publications;
begin
  select t.* into v_ticket
    from public.consultation_tickets t
    join public.consultation_access_credentials c on c.ticket_id = t.id
   where t.nomor_tiket = upper(btrim(p_nomor))
     and c.secret_hash = lower(btrim(p_secret_hash))
     and c.dicabut_at is null
   for update of t;
  if v_ticket.id is null then
    raise exception 'Kredensial tiket tidak valid';
  end if;

  update public.consultation_requester_contacts
     set persetujuan_publikasi = v_setuju,
         persetujuan_publikasi_at = case when v_setuju then now() else null end
   where ticket_id = v_ticket.id;

  if v_setuju then
    update public.consultation_publications
       set persetujuan_pemohon = true,
           persetujuan_pemohon_at = now(),
           persetujuan_pemohon_revision = content_revision,
           updated_at = now()
     where ticket_id = v_ticket.id and not published
     returning * into v_publication;
  end if;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values ('pemohon', 'pemohon',
          case when v_setuju then 'persetujuan_publikasi_diberikan'
               else 'persetujuan_publikasi_dicabut' end,
          v_ticket.id,
          json_build_object('setuju', v_setuju,
                            'content_revision', v_publication.content_revision));
  return json_build_object('persetujuan_publikasi', v_setuju);
end $$;

-- --------------------------------------------------------------------------
-- M. Reviewer/admin publication approval binds to current revision and locks.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_setujui_publikasi(
  p_ticket uuid, p_setuju boolean, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_p public.consultation_publications;
  v_setuju boolean := coalesce(p_setuju, false);
  v_latest uuid;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role not in ('reviewer','admin_konsultasi') then
    raise exception 'Hanya reviewer/admin konsultasi yang dapat menyetujui publikasi';
  end if;

  select * into v_t from public.consultation_tickets where id = p_ticket for update;
  if v_t.id is null or v_t.status not in ('terjawab','selesai') then
    raise exception 'Tiket belum siap untuk persetujuan publikasi';
  end if;
  select m.id into v_latest
    from public.consultation_messages m
   where m.ticket_id = p_ticket and m.jenis_pesan = 'jawaban_konsultan'
   order by m.created_at desc, m.id desc limit 1;
  if v_latest is null or (
    select r.keputusan from public.consultation_reviews r
     where r.ticket_id = p_ticket and r.message_id = v_latest
     order by r.reviewed_at desc, r.id desc limit 1
  ) is distinct from 'disetujui' then
    raise exception 'Jawaban konsultan terbaru belum disetujui reviewer';
  end if;

  select * into v_p from public.consultation_publications
   where ticket_id = p_ticket for update;
  if v_p.id is null then
    raise exception 'Publikasi belum diajukan';
  end if;
  if v_p.published then
    raise exception 'Publikasi sudah terbit';
  end if;

  if v_role = 'reviewer' then
    update public.consultation_publications
       set disetujui_reviewer = v_setuju,
           disetujui_reviewer_oleh = case when v_setuju then lower(btrim(p_aktor)) else null end,
           disetujui_reviewer_at = case when v_setuju then now() else null end,
           disetujui_reviewer_revision = case when v_setuju then content_revision else null end,
           updated_at = now()
     where ticket_id = p_ticket returning * into v_p;
  else
    update public.consultation_publications
       set disetujui_admin = v_setuju,
           disetujui_admin_oleh = case when v_setuju then lower(btrim(p_aktor)) else null end,
           disetujui_admin_at = case when v_setuju then now() else null end,
           disetujui_admin_revision = case when v_setuju then content_revision else null end,
           updated_at = now()
     where ticket_id = p_ticket returning * into v_p;
  end if;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf',
          case when v_setuju then 'publikasi_disetujui' else 'publikasi_persetujuan_dibatalkan' end,
          p_ticket, json_build_object('peran', v_role,
                                      'content_revision', v_p.content_revision));
  return json_build_object('persetujuan_pemohon', v_p.persetujuan_pemohon,
                           'disetujui_reviewer', v_p.disetujui_reviewer,
                           'disetujui_admin', v_p.disetujui_admin,
                           'content_revision', v_p.content_revision);
end $$;

-- --------------------------------------------------------------------------
-- N. Publish only when every approval belongs to current content revision,
--    requester contact consent is current, and latest answer remains approved.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_terbitkan(
  p_ticket uuid, p_slug text, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_t public.consultation_tickets;
  v_p public.consultation_publications;
  v_latest uuid;
  v_contact record;
  v_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then
    raise exception 'Hanya admin konsultasi';
  end if;
  if v_slug !~ '^[a-z0-9-]{6,120}$' then
    raise exception 'Slug publikasi tidak valid';
  end if;

  select * into v_t from public.consultation_tickets where id = p_ticket for update;
  if v_t.id is null or v_t.status not in ('terjawab','selesai') then
    raise exception 'Tiket belum siap diterbitkan';
  end if;
  select * into v_p from public.consultation_publications
   where ticket_id = p_ticket for update;
  if v_p.id is null then
    raise exception 'Publikasi belum diajukan';
  end if;

  select m.id into v_latest
    from public.consultation_messages m
   where m.ticket_id = p_ticket and m.jenis_pesan = 'jawaban_konsultan'
   order by m.created_at desc, m.id desc limit 1;
  if v_latest is null or (
    select r.keputusan from public.consultation_reviews r
     where r.ticket_id = p_ticket and r.message_id = v_latest
     order by r.reviewed_at desc, r.id desc limit 1
  ) is distinct from 'disetujui' then
    raise exception 'Jawaban konsultan terbaru belum disetujui reviewer';
  end if;

  select c.persetujuan_publikasi, c.persetujuan_publikasi_at into v_contact
    from public.consultation_requester_contacts c
   where c.ticket_id = p_ticket;
  if not found or v_contact.persetujuan_publikasi is distinct from true
     or v_contact.persetujuan_publikasi_at is null then
    raise exception 'Persetujuan eksplisit pemohon belum tersedia';
  end if;
  if not v_p.persetujuan_pemohon
     or v_p.persetujuan_pemohon_revision is distinct from v_p.content_revision
     or not v_p.disetujui_reviewer
     or v_p.disetujui_reviewer_revision is distinct from v_p.content_revision
     or not v_p.disetujui_admin
     or v_p.disetujui_admin_revision is distinct from v_p.content_revision then
    raise exception 'Tiga persetujuan wajib berlaku untuk revisi konten saat ini';
  end if;

  update public.consultation_publications
     set slug = v_slug, published = true, updated_at = now()
   where ticket_id = p_ticket returning * into v_p;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'publikasi_terbit', p_ticket,
          json_build_object('slug', v_p.slug,
                            'published_at', v_p.published_at,
                            'content_revision', v_p.content_revision));
  return json_build_object('slug', v_p.slug, 'published', v_p.published,
                           'published_at', v_p.published_at);
end $$;

-- --------------------------------------------------------------------------
-- N2. Admin revocation also clears all approval stamps. Re-publication then
--     requires fresh requester, reviewer, and admin approval after dicabut_at.
-- --------------------------------------------------------------------------
create or replace function public.consultation_svc_cabut_publikasi(
  p_ticket uuid, p_alasan text, p_aktor text
) returns json language plpgsql as $$
declare
  v_role text;
  v_p public.consultation_publications;
begin
  v_role := public.consultation_svc_peran(p_aktor);
  if v_role <> 'admin_konsultasi' then
    raise exception 'Hanya admin konsultasi';
  end if;

  select * into v_p from public.consultation_publications
   where ticket_id = p_ticket for update;
  if v_p.id is null then
    raise exception 'Publikasi belum diajukan';
  end if;

  update public.consultation_publications
     set published = false,
         persetujuan_pemohon = false,
         persetujuan_pemohon_at = null,
         persetujuan_pemohon_revision = null,
         disetujui_reviewer = false,
         disetujui_reviewer_oleh = null,
         disetujui_reviewer_at = null,
         disetujui_reviewer_revision = null,
         disetujui_admin = false,
         disetujui_admin_oleh = null,
         disetujui_admin_at = null,
         disetujui_admin_revision = null,
         dicabut = true,
         dicabut_at = coalesce(dicabut_at, now()),
         dicabut_alasan = coalesce(nullif(btrim(p_alasan), ''), 'Dibatalkan admin konsultasi'),
         updated_at = now()
   where ticket_id = p_ticket returning * into v_p;

  insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id, detail)
  values (lower(btrim(p_aktor)), 'staf', 'publikasi_dicabut', p_ticket,
          json_build_object('alasan', v_p.dicabut_alasan,
                            'dicabut_at', v_p.dicabut_at));
  return json_build_object('published', v_p.published, 'dicabut', v_p.dicabut,
                           'dicabut_at', v_p.dicabut_at);
end $$;

-- --------------------------------------------------------------------------
-- O. Explicit service_role ACL for all replaced RPCs. This is defensive;
--    CREATE OR REPLACE normally preserves the ACL established by migration 004.
-- --------------------------------------------------------------------------
revoke all on function
  public.consultation_svc_jawab(uuid,text,text),
  public.consultation_svc_review(uuid,uuid,text,text,text),
  public.consultation_svc_akses_tiket(text,text),
  public.consultation_svc_lampiran_pemohon_ambil(text,text,uuid),
  public.consultation_svc_pesan_staf(uuid,text,text,boolean,text),
  public.consultation_svc_status(uuid,text,text,text),
  public.consultation_svc_lampiran_staf(uuid,text,text,text,integer,uuid,text),
  public.consultation_svc_lampiran_staf_ambil(uuid,text),
  public.consultation_svc_ajukan_publikasi(uuid,text,text,text,text),
  public.consultation_svc_persetujuan_pemohon(text,text,boolean),
  public.consultation_svc_setujui_publikasi(uuid,boolean,text),
  public.consultation_svc_terbitkan(uuid,text,text),
  public.consultation_svc_cabut_publikasi(uuid,text,text)
  from public, anon, authenticated;

grant execute on function
  public.consultation_svc_jawab(uuid,text,text),
  public.consultation_svc_review(uuid,uuid,text,text,text),
  public.consultation_svc_akses_tiket(text,text),
  public.consultation_svc_lampiran_pemohon_ambil(text,text,uuid),
  public.consultation_svc_pesan_staf(uuid,text,text,boolean,text),
  public.consultation_svc_status(uuid,text,text,text),
  public.consultation_svc_lampiran_staf(uuid,text,text,text,integer,uuid,text),
  public.consultation_svc_lampiran_staf_ambil(uuid,text),
  public.consultation_svc_ajukan_publikasi(uuid,text,text,text,text),
  public.consultation_svc_persetujuan_pemohon(text,text,boolean),
  public.consultation_svc_setujui_publikasi(uuid,boolean,text),
  public.consultation_svc_terbitkan(uuid,text,text),
  public.consultation_svc_cabut_publikasi(uuid,text,text)
  to service_role;

revoke all on function public.consultation_review_check() from public, anon, authenticated;
revoke all on function public.consultation_publication_revision_guard() from public, anon, authenticated;
revoke all on function public.consultation_consent_check() from public, anon, authenticated;

commit;
