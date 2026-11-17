// ============================================================
// Lapisan HTTP bersama: CORS allowlist, respons JSON aman, batas body,
// dan pembungkus handler yang tidak pernah membocorkan detail internal.
//
// Modul ini murni (hanya memakai Request/Response standar) sehingga dapat
// diuji dengan Node tanpa Deno/Supabase.
// ============================================================

import {
  badRequest,
  errorPayload,
  methodNotAllowed,
  payloadTooLarge,
} from './errors.ts';

export interface HandlerCtx {
  origin: string;
  headers: Record<string, string>;
}

const HEADER_KEAMANAN: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

/**
 * Header CORS: Access-Control-Allow-Origin HANYA dipasang untuk origin
 * yang masuk allowlist (tidak pernah `*`, karena respons bisa memuat data
 * tiket/pemohon).
 */
export function corsHeaders(origin: string, allowed: Set<string>): Record<string, string> {
  const h: Record<string, string> = { ...HEADER_KEAMANAN };
  if (origin && allowed.has(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Vary'] = 'Origin';
  }
  return h;
}

export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

/** Identitas klien untuk rate-limit (hash dilakukan oleh guard.ts). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  const first = xff.split(',')[0]?.trim() ?? '';
  if (first) return first;
  const real = req.headers.get('x-real-ip')?.trim() ?? '';
  if (real) return real;
  return 'tanpa-ip';
}

/**
 * Baca body secara streaming. Batas diperiksa sebelum seluruh body diterima,
 * sehingga request besar tidak lebih dulu dimuat penuh ke memori.
 */
export async function readTextLimited(req: Request, maxBytes: number): Promise<string> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw payloadTooLarge();
  if (!req.body) return '';
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw payloadTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(all);
  } catch (_e) {
    throw badRequest('Body bukan teks UTF-8 yang valid');
  }
}

/** Baca request multipart dengan batas ukuran sebelum formData() dipanggil. */
export async function limitedRequest(req: Request, maxBytes: number): Promise<Request> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw payloadTooLarge();
  if (!req.body) return new Request(req.url, { method: req.method, headers: req.headers });
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw payloadTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  // Consolidate chunks into an ArrayBuffer-backed view. Stream chunks are
  // typed as Uint8Array<ArrayBufferLike>, which newer DOM typings reject as
  // BlobPart even though the bytes are valid.
  const bodyBytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: new Blob([bodyBytes.buffer]),
  });
}

/** Baca body JSON dengan batas ukuran; tolak array/null/non-objek. */
export async function readJson(
  req: Request,
  maxBytes = 32 * 1024,
): Promise<Record<string, unknown>> {
  const raw = await readTextLimited(req, maxBytes);
  if (raw.trim() === '') throw badRequest('Body permintaan wajib diisi');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (_e) {
    throw badRequest('Body bukan JSON yang valid');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw badRequest('Body permintaan harus objek JSON');
  }
  return parsed as Record<string, unknown>;
}

/**
 * Pembungkus standar semua Edge Function konsultasi:
 *   OPTIONS -> 204 (CORS allowlist)
 *   metode salah -> 405
 *   error -> payload aman (+ Retry-After untuk 429)
 */
export async function serve(
  req: Request,
  allowedOrigins: Set<string>,
  methods: string[],
  handler: (ctx: HandlerCtx) => Promise<Response>,
): Promise<Response> {
  const origin = req.headers.get('origin') ?? '';
  const headers = corsHeaders(origin, allowedOrigins);

  if (req.method === 'OPTIONS') {
    const pre: Record<string, string> = { ...headers };
    if (headers['Access-Control-Allow-Origin']) {
      pre['Access-Control-Allow-Methods'] = `${methods.join(', ')}, OPTIONS`;
      pre['Access-Control-Allow-Headers'] =
        'authorization, apikey, content-type, x-client-info, x-ticket-nomor';
      pre['Access-Control-Max-Age'] = '86400';
    }
    return new Response(null, { status: 204, headers: pre });
  }

  if (!methods.includes(req.method)) {
    const p = errorPayload(methodNotAllowed());
    return jsonResponse(p.status, p.body, headers);
  }

  try {
    return await handler({ origin, headers });
  } catch (error) {
    const p = errorPayload(error);
    const h: Record<string, string> = { ...headers };
    if (p.retryAfter) h['Retry-After'] = String(p.retryAfter);
    return jsonResponse(p.status, p.body, h);
  }
}
