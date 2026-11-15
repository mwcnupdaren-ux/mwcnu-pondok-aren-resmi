// ============================================================
// Edge Function: consultation-ticket-create
// Membuat tiket baru (pemohon anonim).
//
// Keamanan:
//   * Nomor tiket dibuat database (sequence) — tidak dapat ditentukan klien.
//   * Secret akses dibuat DI SINI (160-bit) dan hanya HASH yang dikirim ke
//     database; plaintext dikembalikan SEKALI ke pemohon.
//   * Persetujuan privasi wajib true; minimal satu kontak (WA/email).
//   * Honeypot `website` menolak bot formulir sederhana.
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { generateTicketSecret, hashSecret } from '../_shared/secret.ts';
import { badRequest } from '../_shared/errors.ts';
import {
  LIMITS,
  boolean,
  email,
  kategoriKode,
  optionalText,
  text,
  whatsapp,
} from '../_shared/validation.ts';

interface BuatTiketHasil {
  id: string;
  nomor_tiket: string;
  status: string;
  created_at: string;
}

export default {
  async fetch(req: Request): Promise<Response> {
    const cfg = resolveConfig(Deno.env.toObject());
    if (cfg instanceof Response) return cfg;

    return serve(req, cfg.allowedOrigins, ['POST'], async (ctx) => {
      const db = new Db(cfg.supabaseUrl, cfg.serviceRoleKey, cfg.anonKey);
      await guardRateLimit(db, cfg, clientIp(req), 'tiket-buat');

      const body = await readJson(req, LIMITS.bodyMaxBytes);

      // Honeypot: field tersembunyi yang hanya diisi bot.
      if (typeof body.website === 'string' && body.website.trim() !== '') {
        throw badRequest('Permintaan tidak dapat diproses');
      }

      const kategori = kategoriKode(body.kategori);
      const judul = text(body.judul, 'Judul', LIMITS.judulMin, LIMITS.judulMax);
      const isi = text(body.isi, 'Isi pertanyaan', LIMITS.isiMin, LIMITS.isiMax);
      const nama = optionalText(body.nama, 'Nama', LIMITS.namaMin, LIMITS.namaMax);
      const wa = whatsapp(body.whatsapp, true);
      const em = email(body.email, true);
      if (wa === '' && em === '') {
        throw badRequest('Isi minimal salah satu: nomor WhatsApp atau email');
      }

      const setujuPrivasi = boolean(body.persetujuan_privasi, 'persetujuan_privasi');
      if (!setujuPrivasi) throw badRequest('Persetujuan privasi wajib diberikan');
      const setujuPublikasi =
        body.persetujuan_publikasi === undefined
          ? false
          : boolean(body.persetujuan_publikasi, 'persetujuan_publikasi');

      const secret = generateTicketSecret();
      const secretHash = await hashSecret(secret, cfg.secretPepper);

      const hasil = await db.rpc<BuatTiketHasil>('consultation_svc_buat_tiket', {
        p_kategori_kode: kategori,
        p_judul: judul,
        p_isi: isi,
        p_nama: nama,
        p_whatsapp: wa,
        p_email: em,
        p_secret_hash: secretHash,
        p_setuju_privasi: true,
        p_setuju_publikasi: setujuPublikasi,
      });

      return jsonResponse(
        201,
        {
          ok: true,
          data: {
            id: hasil.id,
            nomor_tiket: hasil.nomor_tiket,
            status: hasil.status,
            created_at: hasil.created_at,
            // Plaintext secret: SIMPAN SEKARANG, tidak dapat ditampilkan lagi.
            secret,
          },
          catatan:
            'Simpan nomor tiket dan kode akses. Kode akses hanya ditampilkan sekali dan tidak dapat dipulihkan.',
        },
        ctx.headers,
      );
    });
  },
};
