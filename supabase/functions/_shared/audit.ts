// ============================================================
// Audit peristiwa keamanan dari lapisan HTTP.
//
// Aturan:
//   * RPC bisnis (consultation_svc_*) sudah menulis audit sendiri.
//   * Di sini hanya peristiwa yang TIDAK tercakup RPC: rate-limit,
//     autentikasi/otorisasi gagal, unggahan ditolak, tautan unduhan.
//   * Nilai sensitif (secret tiket, email, nomor HP, token) disamarkan
//     sebelum masuk log maupun tabel audit.
// ============================================================

import type { Db } from './db.ts';
import type { AuditEvent } from './types.ts';

const KUNCI_SENSITIF = /secret|token|password|authorization|apikey|hash|otp|kredensial/i;
const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const RE_ANGKA_PANJANG = /\+?[0-9][0-9\s().-]{6,}[0-9]/g;
const RE_SECRET = /\b[0-9A-HJKMNP-TV-Z]{32}\b/g;

/** Samarkan nilai sensitif secara rekursif (kedalaman dibatasi). */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[dalam]';
  if (typeof value === 'string') {
    return value
      .replace(RE_EMAIL, '***@***')
      .replace(RE_SECRET, '***')
      .replace(RE_ANGKA_PANJANG, '***');
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = KUNCI_SENSITIF.test(k) ? '***' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function logWarn(message: string, detail?: unknown): void {
  if (detail === undefined) {
    console.warn(`[konsultasi] ${message}`);
    return;
  }
  console.warn(`[konsultasi] ${message}`, JSON.stringify(redact(detail)));
}

export function logInfo(message: string, detail?: unknown): void {
  if (detail === undefined) {
    console.log(`[konsultasi] ${message}`);
    return;
  }
  console.log(`[konsultasi] ${message}`, JSON.stringify(redact(detail)));
}

/**
 * Catat peristiwa keamanan. Best-effort: kegagalan audit TIDAK boleh
 * mengubah hasil permintaan (dan tidak boleh membocorkan detail).
 */
export async function logSecurityEvent(db: Db, event: AuditEvent): Promise<void> {
  try {
    await db.rpc('consultation_svc_catat_audit', {
      p_aktor: event.aktor,
      p_aktor_jenis: event.aktorJenis,
      p_aksi: event.aksi,
      p_ticket: event.ticketId ?? null,
      p_detail: redact(event.detail ?? {}),
    });
  } catch (error) {
    logWarn('gagal menulis audit keamanan', {
      aksi: event.aksi,
      sebab: error instanceof Error ? error.message : 'tidak diketahui',
    });
  }
}
