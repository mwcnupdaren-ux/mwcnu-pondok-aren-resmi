// ============================================================
// Konfigurasi bersama Edge Functions konsultasi.
// Tidak pernah membaca service role key dari frontend; hanya dari
// environment runtime Supabase (Deno.env).
// ============================================================

export interface Config {
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
  secretPepper: string;
  allowedOrigins: Set<string>;
}

const DEFAULT_ORIGINS = [
  'https://mwcnupondokaren.or.id',
  'https://www.mwcnupondokaren.or.id',
  'https://mwcnu-pondok-aren-resmi.vercel.app',
  'http://localhost:8643',
  'http://127.0.0.1:8643',
];

export function loadConfig(env: Record<string, string | undefined>): Config {
  const supabaseUrl = (env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const anonKey = env.SUPABASE_ANON_KEY ?? env.SUPABASE_PUBLISHABLE_KEY ?? '';
  const secretPepper = env.CONSULTATION_SECRET_PEPPER ?? '';
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    throw new Error('Konfigurasi Supabase belum lengkap');
  }
  if (secretPepper.length < 16) {
    throw new Error('CONSULTATION_SECRET_PEPPER wajib diisi (minimal 16 karakter)');
  }
  const extra = (env.CONSULTATION_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    supabaseUrl,
    serviceRoleKey,
    anonKey,
    secretPepper,
    allowedOrigins: new Set([...DEFAULT_ORIGINS, ...extra]),
  };
}
