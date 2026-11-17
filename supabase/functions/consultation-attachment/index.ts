// ============================================================
// Edge Function: consultation-attachment
// Unggah & unduh lampiran tiket pada bucket PRIVAT `consultation-private`.
//
// Mengapa bucket terpisah:
//   * BUKAN bucket publik, BUKAN bucket media CMS;
//   * tanpa policy storage -> satu-satunya jalur adalah service_role di
//     dalam function ini, setelah kewenangan diverifikasi;
//   * unduhan memakai signed URL berumur pendek (120 detik), bukan URL publik.
//
// Jalur berkas SELALU `tickets/<ticket_id>/<acak>.<ext>` sehingga objek
// tidak dapat dipakai lintas tiket. Metadata divalidasi ulang oleh trigger
// dan RPC (pertahanan berlapis).
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, limitedRequest, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { authenticateStaff } from '../_shared/auth.ts';
import { hashSecret } from '../_shared/secret.ts';
import { logSecurityEvent } from '../_shared/audit.ts';
import { badRequest } from '../_shared/errors.ts';
import {
  LIMITS,
  action,
  mime,
  namaFile,
  nomorTiket,
  secretTiket,
  uuid,
} from '../_shared/validation.ts';

const BUCKET = 'consultation-private';
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

function randomHex(n: number): string {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  let s = '';
  for (const x of b) s += x.toString(16).padStart(2, '0');
  return s;
}

function buildPath(ticketId: string, ext: string): string {
  return `tickets/${ticketId}/${Date.now()}-${randomHex(8)}.${ext}`;
}

interface MetaLampiran {
  id: string;
  ticket_id?: string;
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
      const ip = clientIp(req);
      const contentType = (req.headers.get('content-type') ?? '').toLowerCase();

      // ---------- UNGGAH (multipart/form-data) ----------
      if (contentType.startsWith('multipart/form-data')) {
        // Maksimum file 5 MiB + overhead multipart yang wajar. Batasi stream
        // sebelum parser formData() mengalokasikan seluruh payload.
        const boundedReq = await limitedRequest(req, LIMITS.lampiranMaxBytes + 128 * 1024);
        const form = await boundedReq.formData();
        const file = form.get('file');
        if (!(file instanceof File)) throw badRequest('File wajib diunggah');
        if (file.size < 1 || file.size > LIMITS.lampiranMaxBytes) {
          throw badRequest('Ukuran file maksimal 5 MB');
        }
        const mimeType = mime(file.type);
        const nama = namaFile(file.name);
        const ext = EXT[mimeType];
        const bytes = new Uint8Array(await file.arrayBuffer());

        const nomorMentah = form.get('nomor');
        const jalurPemohon = typeof nomorMentah === 'string' && nomorMentah.trim() !== '';

        if (jalurPemohon) {
          await guardRateLimit(db, cfg, ip, 'tiket-lampiran');
          const nomor = nomorTiket(nomorMentah);
          const secret = secretTiket(form.get('secret'));
          const hash = await hashSecret(secret, cfg.secretPepper);
          const kred = await db.rpc<{ id: string; status: string }>(
            'consultation_svc_tiket_kredensial',
            { p_nomor: nomor, p_secret_hash: hash },
          );
          const path = buildPath(kred.id, ext);
          await db.storageUpload(BUCKET, path, bytes, mimeType);
          try {
            const meta = await db.rpc<MetaLampiran>('consultation_svc_lampiran_pemohon', {
              p_nomor: nomor,
              p_secret_hash: hash,
              p_storage_path: path,
              p_nama_file: nama,
              p_mime: mimeType,
              p_size_bytes: file.size,
            });
            return jsonResponse(201, { ok: true, data: meta }, ctx.headers);
          } catch (error) {
            await db.storageRemove(BUCKET, [path]);
            throw error;
          }
        }

        // Jalur staf: JWT + ticket. Izin diperiksa SEBELUM unggah.
        await guardRateLimit(db, cfg, ip, 'staf-lampiran');
        const staff = await authenticateStaff(req, db);
        const ticket = uuid(form.get('ticket'), 'Tiket');
        await db.rpc<{ boleh: boolean }>('consultation_svc_lampiran_izin', {
          p_ticket: ticket,
          p_aktor: staff.email,
        });
        const messageIdMentah = form.get('message_id');
        const messageId =
          typeof messageIdMentah === 'string' && messageIdMentah.trim() !== ''
            ? uuid(messageIdMentah, 'Pesan')
            : null;
        const path = buildPath(ticket, ext);
        await db.storageUpload(BUCKET, path, bytes, mimeType);
        try {
          const meta = await db.rpc<MetaLampiran>('consultation_svc_lampiran_staf', {
            p_ticket: ticket,
            p_storage_path: path,
            p_nama_file: nama,
            p_mime: mimeType,
            p_size_bytes: file.size,
            p_message_id: messageId,
            p_aktor: staff.email,
          });
          return jsonResponse(201, { ok: true, data: meta }, ctx.headers);
        } catch (error) {
          await db.storageRemove(BUCKET, [path]);
          throw error;
        }
      }

      // ---------- UNDUH (JSON -> signed URL) ----------
      if (!contentType.startsWith('application/json')) {
        throw badRequest('Gunakan multipart/form-data (unggah) atau application/json (unduh)');
      }
      const body = await readJson(req);
      action(body.action ?? 'download', ['download']);

      if (body.nomor !== undefined && body.nomor !== null) {
        await guardRateLimit(db, cfg, ip, 'tiket-unduh');
        const nomor = nomorTiket(body.nomor);
        const secret = secretTiket(body.secret);
        const hash = await hashSecret(secret, cfg.secretPepper);
        const attachment = uuid(body.attachment, 'Lampiran');
        const meta = await db.rpc<MetaLampiran>('consultation_svc_lampiran_pemohon_ambil', {
          p_nomor: nomor,
          p_secret_hash: hash,
          p_attachment: attachment,
        });
        const url = await db.storageSign(BUCKET, meta.storage_path, 120);
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

      await guardRateLimit(db, cfg, ip, 'staf-baca');
      const staff = await authenticateStaff(req, db);
      const attachment = uuid(body.attachment, 'Lampiran');
      const meta = await db.rpc<MetaLampiran>('consultation_svc_lampiran_staf_ambil', {
        p_attachment: attachment,
        p_aktor: staff.email,
      });
      const url = await db.storageSign(BUCKET, meta.storage_path, 120);
      await logSecurityEvent(db, {
        aktor: staff.email,
        aktorJenis: 'staf',
        aksi: 'lampiran_staf_diunduh',
        ticketId: meta.ticket_id ?? null,
        detail: { attachment_id: meta.id },
      });
      return jsonResponse(200, { ok: true, data: { ...meta, url, expires_in: 120 } }, ctx.headers);
    });
  },
};
