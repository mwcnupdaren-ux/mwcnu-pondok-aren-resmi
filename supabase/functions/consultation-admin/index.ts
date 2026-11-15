// ============================================================
// Edge Function: consultation-admin
// Operasional admin konsultasi: daftar, detail, riwayat, SLA,
// verifikasi, penolakan, penugasan, pelepasan, perubahan status,
// dan catatan/jawaban admin.
//
// Akses: JWT staf terverifikasi + role admin_konsultasi (dari database).
// Role TIDAK PERNAH dibaca dari body.
// ============================================================

import { resolveConfig } from '../_shared/bootstrap.ts';
import { Db } from '../_shared/db.ts';
import { clientIp, jsonResponse, readJson, serve } from '../_shared/http.ts';
import { guardRateLimit } from '../_shared/guard.ts';
import { authenticateStaff, requireRole } from '../_shared/auth.ts';
import { badRequest } from '../_shared/errors.ts';
import {
  LIMITS,
  action,
  boolean,
  email,
  integer,
  optionalText,
  statusTiket,
  text,
  uuid,
} from '../_shared/validation.ts';

const AKSI = [
  'list',
  'detail',
  'history',
  'sla',
  'verify',
  'reject',
  'assign',
  'release',
  'status',
  'message',
];
const AKSI_TULIS = ['verify', 'reject', 'assign', 'release', 'status', 'message'];

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
        AKSI_TULIS.includes(act) ? 'staf-tulis' : 'staf-baca',
      );

      const staff = await authenticateStaff(req, db);
      requireRole(staff, 'admin_konsultasi');

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

      if (act === 'sla') {
        const data = await db.rpc<unknown>('consultation_svc_sla', { p_aktor: staff.email });
        return jsonResponse(200, { ok: true, data: data ?? [] }, ctx.headers);
      }

      const ticket = uuid(body.ticket, 'Tiket');

      if (act === 'detail') {
        const data = await db.rpc<unknown>('consultation_svc_staf_detail', {
          p_aktor: staff.email,
          p_ticket: ticket,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'history') {
        const data = await db.rpc<unknown>('consultation_svc_staf_riwayat', {
          p_aktor: staff.email,
          p_ticket: ticket,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'verify') {
        const data = await db.rpc<unknown>('consultation_svc_verifikasi', {
          p_ticket: ticket,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'reject') {
        const alasan = text(body.alasan, 'Alasan penolakan', 3, 1000);
        const data = await db.rpc<unknown>('consultation_svc_tolak', {
          p_ticket: ticket,
          p_alasan: alasan,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'assign') {
        const konsultan = email(body.konsultan, false);
        if (konsultan === '') throw badRequest('Email konsultan wajib diisi');
        const data = await db.rpc<unknown>('consultation_svc_tugaskan', {
          p_ticket: ticket,
          p_konsultan: konsultan,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'release') {
        const alasan = text(body.alasan, 'Alasan pelepasan', 3, 1000);
        const data = await db.rpc<unknown>('consultation_svc_lepas', {
          p_ticket: ticket,
          p_alasan: alasan,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      if (act === 'status') {
        const status = statusTiket(body.status);
        const alasan = optionalText(body.alasan, 'Alasan', 3, 1000);
        const data = await db.rpc<unknown>('consultation_svc_status', {
          p_ticket: ticket,
          p_status: status,
          p_alasan: alasan,
          p_aktor: staff.email,
        });
        return jsonResponse(200, { ok: true, data }, ctx.headers);
      }

      // act === 'message' — default INTERNAL agar tidak tak sengaja publik.
      const isi = text(body.isi, 'Pesan', 1, LIMITS.pesanMax);
      const internal = body.internal === undefined ? true : boolean(body.internal, 'internal');
      const data = await db.rpc<unknown>('consultation_svc_pesan_staf', {
        p_ticket: ticket,
        p_jenis: internal ? 'catatan_internal' : 'jawaban_final',
        p_isi: isi,
        p_terlihat: !internal,
        p_aktor: staff.email,
      });
      return jsonResponse(201, { ok: true, data }, ctx.headers);
    });
  },
};
