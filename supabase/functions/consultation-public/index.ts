// ============================================================
// Edge Function: consultation-public
// Konten publik: kategori aktif, daftar & detail tanya-jawab TERBIT.
//
// Akses: anonim (tanpa JWT). Hanya membaca data yang sudah published=true
// melalui RPC consultation_svc_publik_*; tidak pernah menyentuh tabel
// tiket/pemohon. Rate-limit persisten per IP.
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { action, integer, slug } from '../_shared/validation.ts';

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      await guardRateLimit(db, cfg, clientIp(req), 'public-baca');

      const body = await readJson(req);
      const act = action(body.action ?? 'list', ['list', 'detail', 'categories']);

      if (act === 'categories') {
        const data = await db.rpc<unknown[]>('consultation_svc_kategori');
        return jsonResponse(200, { ok: true, data: data ?? [] }, ctx.headers);
      }

      if (act === 'detail') {
        const s = slug(body.slug);
        const data = await db.rpc<unknown>('consultation_svc_publik_detail', { p_slug: s });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      const limit = integer(body.limit, 'limit', 1, 50, 12);
      const offset = integer(body.offset, 'offset', 0, 100000, 0);
      const items = await db.rpc<unknown[]>('consultation_svc_publik_list', {
        p_limit: limit,
        p_offset: offset,
      });
      return jsonResponse(200, { ok: true, data: { items: items ?? [], limit, offset } }, ctx.headers);
    });
  },
};
