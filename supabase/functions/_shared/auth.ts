// ============================================================
// Autentikasi & otorisasi staf.
//
// Alur (tidak pernah mempercayai body):
//   1. Ambil Bearer token dari header Authorization.
//   2. Verifikasi ke GoTrue (auth.getUser) -> email tepercaya.
//   3. Tanya database role aktif lewat consultation_svc_peran(email)
//      (fungsi ini juga menetapkan aktor transaksi untuk audit).
//   4. Peran hasil database (bukan klaim klien) dipakai untuk otorisasi.
//
// Catatan: JWT harus diverifikasi lewat GoTrue karena Edge Function
// memanggil PostgREST dengan service_role, sehingga database TIDAK melihat
// email pengguna dari JWT. Tanpa langkah 2, email di body akan menjadi
// identitas palsu.
// ============================================================

import { forbidden, unauthorized } from './errors.ts';
import type { Db } from './db.ts';
import { ROLES, type Role, type StaffContext } from './types.ts';

export function bearerToken(req: Request): string | null {
  const raw = req.headers.get('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  if (!m) return null;
  const token = m[1].trim();
  return token.length > 0 ? token : null;
}

export async function authenticateStaff(req: Request, db: Db): Promise<StaffContext> {
  const token = bearerToken(req);
  if (!token) throw unauthorized('Sesi staf diperlukan');

  const user = await db.getUser(token);
  const email = (user?.email ?? '').trim().toLowerCase();
  if (!user || !email) throw unauthorized('Sesi tidak valid atau kedaluwarsa');

  // consultation_svc_peran menolak non-staf dengan pesan yang sudah aman
  // (dipetakan errors.ts menjadi 403 tanpa detail internal).
  const role = await db.rpc<string>('consultation_svc_peran', { p_aktor: email });
  if (typeof role !== 'string' || !ROLES.includes(role as Role)) {
    throw forbidden('Akun bukan staf konsultasi aktif');
  }
  return { email, role: role as Role };
}

export function requireRole(ctx: StaffContext, ...allowed: Role[]): void {
  if (!allowed.includes(ctx.role)) {
    const label = allowed
      .map((r) => (r === 'admin_konsultasi' ? 'admin konsultasi' : r))
      .join('/');
    throw forbidden(`Hanya ${label} yang berwenang`);
  }
}
