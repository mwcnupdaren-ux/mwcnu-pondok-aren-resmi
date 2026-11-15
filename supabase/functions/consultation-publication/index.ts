// ============================================================
// Edge Function: consultation-publication
// Publikasi tanya-jawab terkurasi:
//   propose (admin) -> approve (reviewer & admin) -> publish (admin)
//   withdraw (admin) / status (staf sesuai kewenangan).
//
// Aturan yang TIDAK dapat dilangkahi Edge Function:
//   * publikasi baru selalu mulai belum terbit (B1);
//   * terbit hanya bila 3 persetujuan lengkap (pemohon, reviewer, admin);
//   * published_at distempel sistem saat transisi false -> true;
//   * pencabutan persetujuan pemohon otomatis menarik publikasi (trigger).
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { authenticateStaff, requireRole } from '../_shared/auth.ts';
import { LIMITS, action, boolean, optionalText, slug, text, uuid } from '../_shared/validation.ts';

const AKSI = ['propose', 'approve', 'publish', 'withdraw', 'status'];

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      const body = await readJson(req);
      const act = action(body.action, AKSI);

      await guardRateLimit(db, cfg, clientIp(req), act === 'status' ? 'staf-baca' : 'staf-tulis');

      const staff = await authenticateStaff(req, db);

      if (act === 'propose' || act === 'publish' || act === 'withdraw') {
        requireRole(staff, 'admin_konsultasi');
      } else if (act === 'approve') {
        requireRole(staff, 'admin_konsultasi', 'reviewer');
      }

      const ticket = uuid(body.ticket, 'Tiket');

      if (act === 'status') {
        const data = await db.rpc<{ publikasi?: unknown; ticket?: { status?: string } }>(
          'consultation_svc_staf_detail',
          { p_aktor: staff.email, p_ticket: ticket },
        );
        return jsonResponse(
          200,
          { ok: true, data: { status: data?.ticket?.status ?? null, publikasi: data?.publikasi ?? null } },
          ctx.headers,
        );
      }

      if (act === 'propose') {
        const judul = text(
          body.judul,
          'Judul publikasi',
          LIMITS.judulPublikMin,
          LIMITS.judulPublikMax,
        );
        const pertanyaan = text(
          body.pertanyaan_samar,
          'Pertanyaan samar',
          10,
          LIMITS.pertanyaanSamarMax,
        );
        const jawaban = text(body.jawaban_final, 'Jawaban final', 10, LIMITS.jawabanFinalMax);
        const data = await db.rpc<unknown>('consultation_svc_ajukan_publikasi', {
          p_ticket: ticket,
          p_judul: judul,
          p_pertanyaan_samar: pertanyaan,
          p_jawaban_final: jawaban,
          p_aktor: staff.email,
        });
        return jsonResponse(201, { ok: true, data }, ctx.headers);
      }

      if (act === 'approve') {
        const setuju = boolean(body.setuju, 'setuju');
        const data = await db.rpc<unknown>('consultation_svc_setujui_publikasi', {
          p_ticket: ticket,
          p_setuju: setuju,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'publish') {
        const s = slug(body.slug);
        const data = await db.rpc<unknown>('consultation_svc_terbitkan', {
          p_ticket: ticket,
          p_slug: s,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      // act === 'withdraw'
      const alasan = optionalText(body.alasan, 'Alasan', 3, 1000);
      const data = await db.rpc<unknown>('consultation_svc_cabut_publikasi', {
        p_ticket: ticket,
        p_alasan: alasan,
        p_aktor: staff.email,
      });
      return jsonResponse(200, { ok: true, data }, ctx.headers);
    });
  },
};
