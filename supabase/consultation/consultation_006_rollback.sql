-- ============================================================================
-- Konsultasi Agama MWCNU Pondok Aren — ROLLBACK SQL006
-- File: supabase/consultation/consultation_006_rollback.sql
--
-- TUJUAN
--   Mengembalikan keadaan database dari SETELAH SQL006 ke SETELAH SQL005.
--   Perbaikan keamanan SQL005 (C-1, C-2, rate limit persisten, visibilitas
--   lampiran, serialisasi review) TIDAK dihapus oleh skrip ini.
--
-- PRASYARAT
--   Database berada pada keadaan setelah consultation_006_security_hardening.sql
--   (SQL001..SQL006 sudah diterapkan). Skrip ini idempoten untuk objek 006
--   (memakai IF EXISTS), tetapi bukan pengganti rollback modul penuh.
--
-- YANG DIKEMBALIKAN
--   * 15 fungsi diganti kembali ke definisi persis sebelum SQL006, memakai
--     CREATE OR REPLACE (BUKAN DROP + CREATE) agar ACL/grant dari SQL003 dan
--     SQL004 tetap utuh.
--   * Trigger + fungsi revision guard 006 dihapus.
--   * 2 index dan 4 kolom tambahan 006 dihapus.
--
-- PERINGATAN KEAMANAN (disengaja)
--   Rollback ini MEMBUKA KEMBALI temuan yang hanya ditutup SQL006:
--     H-1  teks publikasi dapat diganti setelah disetujui (tanpa reset approval)
--     H-2  status menunggu_review -> terjawab dapat melewati reviewer
--     M-5  reviewer/admin dapat mengunggah/mengambil lampiran tiket mana pun
--   Selain itu aturan "jawaban terbaru saja", "satu jawaban satu review", dan
--   pengikatan persetujuan ke content_revision ikut hilang. Jalankan hanya
--   dengan persetujuan tertulis dan rencana re-apply SQL006.
--
-- PERINGATAN DATA (tidak dapat dipulihkan)
--   * Stempel *_revision pada consultation_publications hilang bersama kolomnya.
--   * Persetujuan/publikasi yang sudah direset oleh guard 006 tetap pada nilai
--     barunya (false / slug null / published false). Tidak ada audit row untuk
--     reset tersebut, sehingga tidak dapat direkonstruksi.
--   * Perubahan status tiket oleh svc_jawab versi 006 tetap berlaku.
--   * Referensi content_revision di consultation_audit_logs.detail menjadi
--     menunjuk revisi yang tidak ada lagi (audit append-only, tidak dikoreksi).
--   Persetujuan yang perlu hidup kembali harus diberikan ulang secara manual.
--
-- CATATAN OPERASIONAL
--   * Seluruh skrip berjalan dalam SATU transaksi: gagal di tengah = tidak ada
--     perubahan permanen. Hentikan trafik tulis sebelum menjalankan.
--   * Tidak ada CASCADE di mana pun.
--   * Tidak menyentuh tabel, fungsi, trigger, sequence, policy RLS, atau bucket
--     milik SQL001..SQL005.
--   * Objek Storage / Edge Function tidak diubah oleh skrip SQL ini.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Trigger baru SQL006 (harus lebih dulu: fungsi tidak dapat di-drop
--    selama trigger masih bergantung padanya).
--    Sumber: consultation_006_security_hardening.sql:673-677
-- --------------------------------------------------------------------------
drop trigger if exists trg_consultation_publication_00_revision_guard
  on public.consultation_publications;

-- --------------------------------------------------------------------------
-- 2. Fungsi baru SQL006.
--    Sumber: consultation_006_security_hardening.sql:622-671
--    Catatan: fungsi ini TIDAK pernah ada di SQL001..SQL005, jadi di-drop
--    (bukan dipulihkan). Trigger lama 002/005 tidak terpengaruh.
-- --------------------------------------------------------------------------
drop function if exists public.consultation_publication_revision_guard();

-- --------------------------------------------------------------------------
-- 3. Pulihkan 15 fungsi yang diganti SQL006 ke definisi persis sebelumnya.
--    Semua memakai CREATE OR REPLACE agar ACL service_role dari SQL003/004
--    tetap berlaku (DROP FUNCTION akan menghapus grant tersebut).
--    Urutan tidak penting secara dependensi; dikelompokkan menurut asal.
-- --------------------------------------------------------------------------

-- 3.1 consultation_review_check() — versi SQL002 (F5).
--     Sumber: consultation_002_tables.sql:641-665
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

-- 3.2 consultation_svc_akses_tiket(text,text) — versi SQL005.
--     Sumber: consultation_005_security_hardening.sql:4-76
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

-- 3.3 consultation_svc_lampiran_pemohon_ambil(text,text,uuid) — versi SQL005.
--     Sumber: consultation_005_security_hardening.sql:78-115
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

-- 3.4 consultation_svc_jawab(uuid,text,text) — versi SQL005.
--     Sumber: consultation_005_security_hardening.sql:117-148
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

-- 3.5 consultation_svc_pesan_staf(uuid,text,text,boolean,text) — versi SQL005.
--     Sumber: consultation_005_security_hardening.sql:150-193
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

-- 3.6 consultation_svc_review(uuid,uuid,text,text,text) — versi SQL005.
--     Sumber: consultation_005_security_hardening.sql:195-232
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

-- 3.7 consultation_svc_status(uuid,text,text,text) — versi SQL004.
--     Sumber: consultation_004_services.sql:425-437
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

-- 3.8 consultation_svc_lampiran_staf(uuid,text,text,text,integer,uuid,text)
--     versi SQL004. Sumber: consultation_004_services.sql:840-884
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

-- 3.9 consultation_svc_lampiran_staf_ambil(uuid,text) — versi SQL004.
--     Sumber: consultation_004_services.sql:915-936
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

-- 3.10 consultation_svc_ajukan_publikasi(uuid,text,text,text,text) — versi SQL004.
--      Sumber: consultation_004_services.sql:590-630
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

-- 3.11 consultation_svc_persetujuan_pemohon(text,text,boolean) — versi SQL004.
--      Sumber: consultation_004_services.sql:207-241
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

-- 3.12 consultation_svc_setujui_publikasi(uuid,boolean,text) — versi SQL004.
--      Sumber: consultation_004_services.sql:632-661
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

-- 3.13 consultation_svc_terbitkan(uuid,text,text) — versi SQL004.
--      Sumber: consultation_004_services.sql:663-679
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

-- 3.14 consultation_svc_cabut_publikasi(uuid,text,text) — versi SQL004.
--      Sumber: consultation_004_services.sql:681-702
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

-- 3.15 consultation_consent_check() — versi SQL002 (F11).
--      Sumber: consultation_002_tables.sql:870-897
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

-- --------------------------------------------------------------------------
-- 4. Index tambahan SQL006.
--    Sumber: consultation_006_security_hardening.sql:22-27
--    Keduanya tidak dipakai lagi oleh definisi fungsi versi 005.
-- --------------------------------------------------------------------------
drop index if exists public.consultation_messages_latest_answer;
drop index if exists public.consultation_reviews_latest_message;

-- --------------------------------------------------------------------------
-- 5. Kolom tambahan SQL006 — dihapus TERAKHIR.
--    Sumber: consultation_006_security_hardening.sql:609-613
--    Semua fungsi/trigger yang mereferensikan kolom ini sudah dipulihkan atau
--    di-drop pada langkah 1-3, sehingga tidak ada body PL/pgSQL aktif yang
--    akan gagal saat operasi tulis berikutnya.
--    Kolom persetujuan/publikasi milik SQL002/004 TIDAK disentuh.
-- --------------------------------------------------------------------------
alter table public.consultation_publications
  drop column if exists persetujuan_pemohon_revision,
  drop column if exists disetujui_reviewer_revision,
  drop column if exists disetujui_admin_revision,
  drop column if exists content_revision;

-- --------------------------------------------------------------------------
-- 6. PEMERIKSAAN SEBELUM COMMIT.
--    Gagal keras (raise exception) bila objek khusus SQL006 masih ada atau
--    bila ACL/hasil pemulihan tidak sesuai. Kegagalan = seluruh transaksi
--    dibatalkan, database kembali ke keadaan setelah SQL006.
-- --------------------------------------------------------------------------
do $$
declare
  v_n int;
  v_sig text;
  v_rpc text[] := array[
    'public.consultation_svc_jawab(uuid,text,text)',
    'public.consultation_svc_review(uuid,uuid,text,text,text)',
    'public.consultation_svc_akses_tiket(text,text)',
    'public.consultation_svc_lampiran_pemohon_ambil(text,text,uuid)',
    'public.consultation_svc_pesan_staf(uuid,text,text,boolean,text)',
    'public.consultation_svc_status(uuid,text,text,text)',
    'public.consultation_svc_lampiran_staf(uuid,text,text,text,integer,uuid,text)',
    'public.consultation_svc_lampiran_staf_ambil(uuid,text)',
    'public.consultation_svc_ajukan_publikasi(uuid,text,text,text,text)',
    'public.consultation_svc_persetujuan_pemohon(text,text,boolean)',
    'public.consultation_svc_setujui_publikasi(uuid,boolean,text)',
    'public.consultation_svc_terbitkan(uuid,text,text)',
    'public.consultation_svc_cabut_publikasi(uuid,text,text)',
    'public.consultation_review_check()',
    'public.consultation_consent_check()'
  ];
begin
  -- 6.1 Trigger revision guard 006 harus hilang.
  select count(*) into v_n
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'consultation_publications'
     and t.tgname = 'trg_consultation_publication_00_revision_guard';
  if v_n <> 0 then
    raise exception 'Rollback 006 gagal: trigger trg_consultation_publication_00_revision_guard masih ada';
  end if;

  -- 6.2 Fungsi revision guard 006 harus hilang.
  select count(*) into v_n
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'consultation_publication_revision_guard';
  if v_n <> 0 then
    raise exception 'Rollback 006 gagal: fungsi consultation_publication_revision_guard() masih ada';
  end if;

  -- 6.3 Index 006 harus hilang.
  select count(*) into v_n
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'i'
     and c.relname in ('consultation_messages_latest_answer',
                       'consultation_reviews_latest_message');
  if v_n <> 0 then
    raise exception 'Rollback 006 gagal: % index SQL006 masih ada', v_n;
  end if;

  -- 6.4 Kolom 006 harus hilang.
  select count(*) into v_n
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'consultation_publications'
     and column_name in ('content_revision',
                         'persetujuan_pemohon_revision',
                         'disetujui_reviewer_revision',
                         'disetujui_admin_revision');
  if v_n <> 0 then
    raise exception 'Rollback 006 gagal: % kolom SQL006 masih ada', v_n;
  end if;

  -- 6.5 Kolom milik SQL002/004 (termasuk yang dipakai 15 fungsi versi 005)
  --     harus tetap ada — bukti rollback tidak berlebihan.
  select count(*) into v_n
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'consultation_publications'
     and column_name in ('published', 'slug', 'published_at',
                         'persetujuan_pemohon', 'persetujuan_pemohon_at',
                         'disetujui_reviewer', 'disetujui_admin',
                         'dicabut', 'dicabut_at', 'dicabut_alasan');
  if v_n <> 10 then
    raise exception 'Rollback 006 gagal: kolom publikasi SQL002/004 hilang (ditemukan %)', v_n;
  end if;

  -- 6.6 Ke-15 fungsi hasil pemulihan harus ada (distinct: overload tak
  --     terduga tidak boleh menggagalkan rollback; signature tepat diperiksa 6.7).
  select count(distinct p.proname) into v_n
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('consultation_review_check',
                       'consultation_svc_jawab',
                       'consultation_svc_review',
                       'consultation_svc_akses_tiket',
                       'consultation_svc_lampiran_pemohon_ambil',
                       'consultation_svc_pesan_staf',
                       'consultation_svc_status',
                       'consultation_svc_lampiran_staf',
                       'consultation_svc_lampiran_staf_ambil',
                       'consultation_svc_ajukan_publikasi',
                       'consultation_svc_persetujuan_pemohon',
                       'consultation_svc_setujui_publikasi',
                       'consultation_svc_terbitkan',
                       'consultation_svc_cabut_publikasi',
                       'consultation_consent_check');
  if v_n <> 15 then
    raise exception 'Rollback 006 gagal: fungsi hasil pemulihan tidak lengkap (% dari 15)', v_n;
  end if;

  -- 6.7 ACL harus tetap seperti SQL005: service_role boleh EXECUTE, dan
  --     anon/authenticated tidak. CREATE OR REPLACE seharusnya mempertahankan
  --     grant SQL003/004; pemeriksaan ini membuktikannya, bukan mengasumsikan.
  foreach v_sig in array v_rpc loop
    if to_regprocedure(v_sig) is null then
      raise exception 'Rollback 006 gagal: fungsi % tidak ditemukan', v_sig;
    end if;
    if to_regrole('service_role') is not null
       and not has_function_privilege('service_role', v_sig, 'execute') then
      raise exception 'Rollback 006 gagal: ACL service_role hilang pada %', v_sig;
    end if;
    if to_regrole('anon') is not null
       and has_function_privilege('anon', v_sig, 'execute') then
      raise exception 'Rollback 006 gagal: ACL bocor ke anon pada %', v_sig;
    end if;
    if to_regrole('authenticated') is not null
       and has_function_privilege('authenticated', v_sig, 'execute') then
      raise exception 'Rollback 006 gagal: ACL bocor ke authenticated pada %', v_sig;
    end if;
  end loop;

  raise notice 'Rollback 006 OK: objek 006 hilang, 15 fungsi versi 005 dipulihkan, ACL utuh.';
end $$;

commit;
