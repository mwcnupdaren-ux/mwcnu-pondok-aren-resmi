// ============================================================
// Edge Function: consultation-ticket-access
// Pemohon membaca tiketnya + membuat tautan unduh lampiran.
//
// Akses: kredensial tiket (nomor + secret). Secret dikirim plaintext oleh
// klien, di-HMAC dengan pepper server, lalu dicocokkan dengan hash di
// database. TIDAK ada jalur "cari tiket berdasarkan nomor saja".
//
// Respons pemohon tidak pernah memuat email staf internal / catatan
// internal (disaring oleh RPC di database).
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { hashSecret } from '../_shared/secret.ts';
import { logSecurityEvent } from '../_shared/audit.ts';
import { AppError } from '../_shared/errors.ts';
import { action, nomorTiket, secretTiket, uuid } from '../_shared/validation.ts';

interface MetaLampiran {
  id: string;
  storage_path: string;
  nama_file: string;
  mime: string;
}

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      const body = await readJson(req);
      const act = action(body.action ?? 'view', ['view', 'lampiran']);

      await guardRateLimit(
        db,
        cfg,
        clientIp(req),
        act === 'lampiran' ? 'tiket-unduh' : 'tiket-akses',
      );

      const nomor = nomorTiket(body.nomor);
      const secret = secretTiket(body.secret);
      const hash = await hashSecret(secret, cfg.secretPepper);

      try {
        if (act === 'lampiran') {
          const attachment = uuid(body.attachment, 'Lampiran');
          const meta = await db.rpc<MetaLampiran>('consultation_svc_lampiran_pemohon_ambil', {
            p_nomor: nomor,
            p_secret_hash: hash,
            p_attachment: attachment,
          });
          const url = await db.storageSign('consultation-private', meta.storage_path, 120);
          await logSecurityEvent(db, {
            aktor: 'pemohon',
            aktorJenis: 'pemohon',
            aksi: 'lampiran_diunduh',
            detail: { attachment_id: meta.id },
          });
          return jsonResponse(
            200,
            { ok: true, data: { ...meta, url, expires_in: 120 } },
            ctx.headers,
          );
        }

        const data = await db.rpc<unknown>('consultation_svc_akses_tiket', {
          p_nomor: nomor,
          p_secret_hash: hash,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      } catch (error) {
        // Percobaan kredensial salah dicatat (tanpa secret, tanpa isi pesan).
        if (error instanceof AppError && error.status === 401) {
          await logSecurityEvent(db, {
            aktor: 'sistem',
            aktorJenis: 'sistem',
            aksi: 'akses_tiket_gagal',
            detail: { endpoint: 'ticket-access', aksi: act },
          });
        }
        throw error;
      }
    });
  },
};
