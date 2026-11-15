// ============================================================
// Edge Function: consultation-consultant
// Konsultan: daftar tiket yang DITUGASKAN kepadanya, detail, kirim
// jawaban (masuk antrean review), dan catatan internal.
//
// Akses: JWT staf terverifikasi + role konsultan. Kewenangan per tiket
// (hanya tiket yang ditugaskan) ditegakkan ulang di database.
//
// Catatan: jawaban konsultan SELALU berstatus menunggu_review; tidak ada
// jalur yang membuat jawaban langsung final.
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { authenticateStaff, requireRole } from '../_shared/auth.ts';
import { LIMITS, action, integer, statusTiket, text, uuid } from '../_shared/validation.ts';

const AKSI = ['list', 'detail', 'answer', 'message'];

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      const body = await readJson(req);
      const act = action(body.action, AKSI);

      await guardRateLimit(
        db,
        cfg,
        clientIp(req),
        act === 'list' || act === 'detail' ? 'staf-baca' : 'staf-tulis',
      );

      const staff = await authenticateStaff(req, db);
      requireRole(staff, 'konsultan');

      if (act === 'list') {
        const status =
          body.status === undefined || body.status === null || body.status === ''
            ? null
            : statusTiket(body.status);
        const limit = integer(body.limit, 'limit', 1, 100, 50);
        const offset = integer(body.offset, 'offset', 0, 100000, 0);
        const data = await db.rpc<unknown>('consultation_svc_staf_daftar', {
          p_aktor: staff.email,
          p_status: status,
          p_limit: limit,
          p_offset: offset,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      const ticket = uuid(body.ticket, 'Tiket');

      if (act === 'detail') {
        const data = await db.rpc<unknown>('consultation_svc_staf_detail', {
          p_aktor: staff.email,
          p_ticket: ticket,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'answer') {
        const isi = text(body.isi, 'Jawaban', LIMITS.isiMin, LIMITS.pesanMax);
        const data = await db.rpc<unknown>('consultation_svc_jawab', {
          p_ticket: ticket,
          p_isi: isi,
          p_aktor: staff.email,
        });
        return jsonResponse(201, { ok: true, data }, ctx.headers);
      }

      // act === 'message' — konsultan hanya boleh menulis catatan INTERNAL.
      const isi = text(body.isi, 'Catatan', 1, LIMITS.pesanMax);
      const data = await db.rpc<unknown>('consultation_svc_pesan_staf', {
        p_ticket: ticket,
        p_jenis: 'catatan_internal',
        p_isi: isi,
        p_terlihat: false,
        p_aktor: staff.email,
      });
      return jsonResponse(201, { ok: true, data }, ctx.headers);
    });
  },
};
