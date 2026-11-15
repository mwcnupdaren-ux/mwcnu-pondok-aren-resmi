// ============================================================
// Edge Function: consultation-ticket-message
// Pemohon mengirim pesan lanjutan atau mengubah persetujuan publikasi.
//
// Akses: kredensial tiket. Pesan hanya dapat dikirim selama tiket belum
// ditutup (ditegakkan RPC). Pencabutan persetujuan publikasi otomatis
// menarik publikasi (trigger database) — bukan kebijakan Edge Function.
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { hashSecret } from '../_shared/secret.ts';
import { logSecurityEvent } from '../_shared/audit.ts';
import { AppError } from '../_shared/errors.ts';
import {
  LIMITS,
  action,
  boolean,
  nomorTiket,
  secretTiket,
  text,
} from '../_shared/validation.ts';

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      await guardRateLimit(db, cfg, clientIp(req), 'tiket-pesan');

      const body = await readJson(req);
      const act = action(body.action ?? 'message', ['message', 'consent']);

      const nomor = nomorTiket(body.nomor);
      const secret = secretTiket(body.secret);
      const hash = await hashSecret(secret, cfg.secretPepper);

      try {
        if (act === 'consent') {
          const setuju = boolean(body.setuju, 'setuju');
          const data = await db.rpc<unknown>('consultation_svc_persetujuan_pemohon', {
            p_nomor: nomor,
            p_secret_hash: hash,
            p_setuju: setuju,
          });
          return jsonResponse(200, { ok: true, data }, ctx.headers);
        }

        const isi = text(body.isi, 'Pesan', 1, LIMITS.pesanMax);
        const data = await db.rpc<unknown>('consultation_svc_pesan_pemohon', {
          p_nomor: nomor,
          p_secret_hash: hash,
          p_isi: isi,
        });
        return jsonResponse(201, { ok: true, data }, ctx.headers);
      } catch (error) {
        if (error instanceof AppError && error.status === 401) {
          await logSecurityEvent(db, {
            aktor: 'sistem',
            aktorJenis: 'sistem',
            aksi: 'akses_tiket_gagal',
            detail: { endpoint: 'ticket-message', aksi: act },
          });
        }
        throw error;
      }
    });
  },
};
