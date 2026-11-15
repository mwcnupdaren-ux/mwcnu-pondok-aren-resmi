// ============================================================
// Edge Function: consultation-review
// Reviewer: antrean jawaban menunggu review, detail, dan keputusan.
//
// Akses: JWT staf terverifikasi + role reviewer.
// Semua jawaban konsultan WAJIB melewati review sebelum menjadi terjawab.
// Keputusan review bersifat append-only (tidak dapat diubah/dihapus).
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { authenticateStaff, requireRole } from '../_shared/auth.ts';
import { badRequest } from '../_shared/errors.ts';
import { action, integer, optionalText, text, uuid } from '../_shared/validation.ts';

const AKSI = ['list', 'detail', 'decide'];
const KEPUTUSAN = ['disetujui', 'minta_revisi'];

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      const body = await readJson(req);
      const act = action(body.action, AKSI);

      await guardRateLimit(db, cfg, clientIp(req), act === 'decide' ? 'staf-tulis' : 'staf-baca');

      const staff = await authenticateStaff(req, db);
      requireRole(staff, 'reviewer');

      if (act === 'list') {
        const limit = integer(body.limit, 'limit', 1, 100, 50);
        const offset = integer(body.offset, 'offset', 0, 100000, 0);
        const data = await db.rpc<unknown>('consultation_svc_staf_daftar', {
          p_aktor: staff.email,
          p_status: null,
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

      // act === 'decide'
      const message = uuid(body.message, 'Pesan jawaban');
      const keputusan = text(body.keputusan, 'Keputusan', 3, 20).toLowerCase();
      if (!KEPUTUSAN.includes(keputusan)) throw badRequest('Keputusan review tidak valid');
      const catatan = optionalText(body.catatan, 'Catatan', 3, 2000);
      if (keputusan === 'minta_revisi' && catatan === '') {
        throw badRequest('Catatan wajib diisi saat meminta revisi');
      }
      const data = await db.rpc<unknown>('consultation_svc_review', {
        p_ticket: ticket,
        p_message: message,
        p_keputusan: keputusan,
        p_catatan: catatan,
        p_aktor: staff.email,
      });
      return jsonResponse(200, { ok: true, data }, ctx.headers);
    });
  },
};
