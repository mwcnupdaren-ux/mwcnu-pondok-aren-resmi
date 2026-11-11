// ============================================================
// Edge Function: verify-nia
// Proksi rate-limited untuk RPC verify_nia di PostgREST.
//
// Mengapa: RPC langsung (grant anon) dapat di-brute-force untuk
// memetakan nomor NIA yang valid. Function ini menahan laju di
// depan RPC dan memakai service_role agar anon TIDAK lagi butuh
// hak execute langsung ke RPC (d revoke lewat SQL patch terpisah).
//
// Env (otomatis disediakan runtime Supabase Edge Functions):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Deploy (sekali, dari root repo):
//   supabase functions deploy verify-nia --no-verify-jwt
//   (function dipanggil publik tanpa JWT pengguna, jadi wajib
//    --no-verify-jwt; perlindungannya rate-limit + validasi input)
// ============================================================

const ALLOWED_ORIGINS = new Set([
  'https://mwcnupondokaren.or.id',
  'https://www.mwcnupondokaren.or.id',
  'https://mwcnu-pondok-aren-resmi.vercel.app',
  'http://localhost:8643',
  'http://127.0.0.1:8643',
]);

// Batas laju: 20 permintaan/menit per IP, 300/menit global.
// Implementasi in-memory per instance — untuk kebutuhan ini cukup
// menahan brute-force otomatis; batas global membatasi total lintas IP.
const PER_IP_LIMIT = 20;
const GLOBAL_LIMIT = 300;
const WINDOW_MS = 60_000;

type Bucket = Map<string, number[]>;
const rl = (globalThis as any).__rl ?? ((globalThis as any).__rl = {
  ip: new Map() as Bucket,
  global: [] as number[],
});

function prune(arr: number[], now: number): number[] {
  const cut = now - WINDOW_MS;
  while (arr.length && arr[0] <= cut) arr.shift();
  return arr;
}

function tooFast(ip: string, now: number): boolean {
  const g = prune(rl.global, now);
  if (g.length >= GLOBAL_LIMIT) return true;
  const a = prune(rl.ip.get(ip) ?? [], now);
  if (a.length >= PER_IP_LIMIT) return true;
  g.push(now); a.push(now);
  rl.ip.set(ip, a);
  // pembersihan ringan memori
  if (rl.ip.size > 10_000) rl.ip = new Map();
  return false;
}

function cors(origin: string, extra: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = { ...extra };
  if (ALLOWED_ORIGINS.has(origin)) {
    base['Access-Control-Allow-Origin'] = origin;
    base['Vary'] = 'Origin';
  }
  return base;
}

// NIA resmi: MWC-<scope 2 digit>-<YY>-<6 digit>-<check 1 digit>
const NIA_RE = /^MWC-\d{2}-\d{2}-\d{6}-\d$/;

Deno.serve(async (req: Request) => {
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
    const body = await req.json();
    nia = String(body?.p_nia ?? '').trim().toUpperCase().slice(0, 40);
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'bad_request' }), {
      status: 400,
      headers: cors(origin, { 'Content-Type': 'application/json' }),
    });
  }
  if (!NIA_RE.test(nia)) {
    // Format salah = pasti bukan NIA resmi; balaskan bentuk "tidak terverifikasi"
    // agar tidak bisa dipakai sebagai orakel format.
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
});
