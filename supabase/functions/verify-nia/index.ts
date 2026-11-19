// ============================================================
// Edge Function: verify-nia  (versi editor Dashboard Supabase)
// Proksi rate-limited untuk RPC verify_nia di PostgREST.
//
// Mengapa: RPC langsung (grant anon) dapat di-brute-force untuk
// memetakan nomor NIA yang valid. Function ini menahan laju di
// depan RPC dan memakai service_role agar anon TIDAK lagi butuh
// hak execute langsung ke RPC (di-revoke lewat SQL patch terpisah).
//
// Env otomatis (disediakan runtime Supabase):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — tanpa secret manual.
//
// Catatan deploy dashboard:
//   • Nama function HARUS: verify-nia (dipakai klien di /v/<nia>)
//   • Jika ada sakelar "Verify JWT" / "Enforce JWT verification":
//     NONAKTIFKAN — pemanggil /v/<nia> adalah pengunjung anonim
//     (perlindungan: rate-limit + validasi input + CORS allowlist)
// ============================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ALLOWED_ORIGINS = new Set([
  'https://mwcnupondokaren.or.id',
  'https://www.mwcnupondokaren.or.id',
  'https://mwcnu-pondok-aren-resmi.vercel.app',
  // Hanya origin produksi; samakan dengan DEFAULT_ORIGINS di
  // _shared/config.ts. Function ini memakai daftar tetap dan TIDAK membaca
  // CONSULTATION_ALLOWED_ORIGINS; origin tambahan tidak berlaku di sini.
]);

// Batas laju lokal per instance: 20 permintaan/menit per IP dan
// 300/menit agregat pada instance ini. BUKAN batas global lintas instance;
// untuk jaminan terdistribusi, endpoint ini perlu RPC rate-limit persisten.
const PER_IP_LIMIT = 20;
const GLOBAL_LIMIT = 300;
const WINDOW_MS = 60_000;

// NIA resmi: MWC-<scope 2 digit>-<YY>-<6 digit>-<check 1 digit>
const NIA_RE = /^MWC-\d{2}-\d{2}-\d{6}-\d$/;

const g = globalThis as any;
const rl: { ip: Map<string, number[]>; global: number[] } =
  g.__rl ?? (g.__rl = { ip: new Map(), global: [] });

function prune(arr: number[], now: number): number[] {
  const cut = now - WINDOW_MS;
  while (arr.length && arr[0] <= cut) arr.shift();
  return arr;
}

async function readJsonLimited(req: Request, maxBytes = 8 * 1024): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('payload_too_large');
  if (!req.body) throw new Error('empty_body');
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
        throw new Error('payload_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

function tooFast(ip: string, now: number): boolean {
  const gl = prune(rl.global, now);
  if (gl.length >= GLOBAL_LIMIT) return true;
  const a = prune(rl.ip.get(ip) ?? [], now);
  if (a.length >= PER_IP_LIMIT) return true;
  gl.push(now);
  a.push(now);
  rl.ip.set(ip, a);
  if (rl.ip.size > 10_000) rl.ip = new Map(); // pembersihan ringan memori
  return false;
}

function cors(origin: string, extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (ALLOWED_ORIGINS.has(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Vary'] = 'Origin';
  }
  return h;
}

export default {
  async fetch(req: Request): Promise<Response> {
    const now = Date.now();
    const origin = req.headers.get('origin') ?? '';

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: cors(origin, {
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
          'Access-Control-Max-Age': '86400',
        }),
      });
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: cors(origin, { 'Content-Type': 'application/json' }),
      });
    }

    // Identifikasi klien: platform menyetel x-forwarded-for.
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    if (tooFast(ip, now)) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: cors(origin, { 'Content-Type': 'application/json', 'Retry-After': '60' }),
      });
    }

    // Validasi input sebelum menyentuh database.
    let nia = '';
    try {
      const body = await readJsonLimited(req) as Record<string, unknown>;
      nia = String(body?.p_nia ?? '').trim().toUpperCase().slice(0, 40);
    } catch (e) {
      const oversized = e instanceof Error && e.message === 'payload_too_large';
      return new Response(JSON.stringify({ error: oversized ? 'payload_too_large' : 'bad_request' }), {
        status: oversized ? 413 : 400,
        headers: cors(origin, { 'Content-Type': 'application/json' }),
      });
    }
    if (!NIA_RE.test(nia)) {
      // Format salah = pasti bukan NIA resmi; balaskan bentuk "tidak
      // terverifikasi" agar tidak bisa dipakai sebagai orakel format.
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: cors(origin, { 'Content-Type': 'application/json' }),
      });
    }

    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      return new Response(JSON.stringify({ error: 'misconfigured' }), {
        status: 500,
        headers: cors(origin, { 'Content-Type': 'application/json' }),
      });
    }

    try {
      const r = await fetch(`${url}/rest/v1/rpc/verify_nia`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_nia: nia }),
      });
      if (!r.ok) {
        return new Response(JSON.stringify({ error: 'upstream' }), {
          status: 502,
          headers: cors(origin, { 'Content-Type': 'application/json' }),
        });
      }
      const data = await r.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: cors(origin, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }),
      });
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'upstream' }), {
        status: 502,
        headers: cors(origin, { 'Content-Type': 'application/json' }),
      });
    }
  },
};
