// ============================================================
// Validasi input — sisi Edge Function, SEBELUM menyentuh database.
// Batas harus konsisten dengan constraint di consultation_002_tables.sql.
// Semua fungsi melempar AppError 400 (pesan aman, tanpa data internal).
// ============================================================

import { badRequest } from './errors.ts';

export const LIMITS = {
  judulMin: 5,
  judulMax: 150,
  isiMin: 10,
  isiMax: 10000,
  namaMin: 2,
  namaMax: 120,
  pesanMax: 10000,
  judulPublikMin: 5,
  judulPublikMax: 200,
  pertanyaanSamarMax: 5000,
  jawabanFinalMax: 20000,
  slugMin: 6,
  slugMax: 120,
  namaFileMax: 200,
  lampiranMaxBytes: 5 * 1024 * 1024,
  bodyMaxBytes: 32 * 1024,
};

export const MIME_DIIZINKAN = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOMOR_RE = /^KON-[0-9]{6}-[0-9A-HJKMNP-TV-Z]{1,12}$/;
const SECRET_RE = /^[0-9A-HJKMNP-TV-Z]{32}$/;
const HASH_RE = /^[0-9a-f]{64}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const WA_RE = /^\+?[0-9]{8,15}$/;
const KODE_RE = /^[a-z0-9_]{2,40}$/;

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Teks wajib/opsional dengan batas panjang. Baris baru dinormalkan,
 * spasi tepi dibuang. Nilai non-string DITOLAK (tidak dikonversi diam-diam).
 */
export function text(
  value: unknown,
  field: string,
  min: number,
  max: number,
  optional = false,
): string {
  if (value === undefined || value === null) {
    if (optional) return '';
    throw badRequest(`${field} wajib diisi`);
  }
  if (typeof value !== 'string') throw badRequest(`${field} harus berupa teks`);
  const t = value.replace(/\r\n/g, '\n').trim();
  if (t === '') {
    if (optional) return '';
    throw badRequest(`${field} wajib diisi`);
  }
  if (t.length < min) throw badRequest(`${field} minimal ${min} karakter`);
  if (t.length > max) throw badRequest(`${field} maksimal ${max} karakter`);
  return t;
}

export function optionalText(value: unknown, field: string, min: number, max: number): string {
  return text(value, field, min, max, true);
}

export function uuid(value: unknown, field = 'id'): string {
  const s = asText(value).trim();
  if (!UUID_RE.test(s)) throw badRequest(`${field} tidak valid`);
  return s.toLowerCase();
}

export function nomorTiket(value: unknown): string {
  const s = asText(value).trim().toUpperCase();
  if (!NOMOR_RE.test(s)) throw badRequest('Nomor tiket tidak valid');
  return s;
}

export function secretTiket(value: unknown): string {
  const s = asText(value).trim().toUpperCase().replace(/[\s-]/g, '');
  if (!SECRET_RE.test(s)) throw badRequest('Kredensial tiket tidak valid');
  return s;
}

export function secretHash(value: unknown): string {
  const s = asText(value).trim().toLowerCase();
  if (!HASH_RE.test(s)) throw badRequest('Kredensial tidak valid');
  return s;
}

export function email(value: unknown, optional = true): string {
  const s = asText(value).trim().toLowerCase();
  if (s === '') {
    if (optional) return '';
    throw badRequest('Email wajib diisi');
  }
  if (s.length > 254 || !EMAIL_RE.test(s)) throw badRequest('Email tidak valid');
  return s;
}

export function whatsapp(value: unknown, optional = true): string {
  const s = asText(value).replace(/[\s().-]/g, '').trim();
  if (s === '') {
    if (optional) return '';
    throw badRequest('Nomor WhatsApp wajib diisi');
  }
  if (!WA_RE.test(s)) throw badRequest('Nomor WhatsApp tidak valid');
  return s;
}

export function kategoriKode(value: unknown): string {
  const s = asText(value).trim().toLowerCase();
  if (!KODE_RE.test(s)) throw badRequest('Kategori tidak valid');
  return s;
}

export function slug(value: unknown): string {
  const s = asText(value).trim().toLowerCase();
  if (s.length < LIMITS.slugMin || s.length > LIMITS.slugMax || !SLUG_RE.test(s)) {
    throw badRequest('Slug tidak valid (huruf kecil, angka, tanda hubung)');
  }
  return s;
}

export function boolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw badRequest(`${field} harus bernilai true/false`);
  return value;
}

export function integer(
  value: unknown,
  field: string,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${field} harus bilangan bulat ${min}-${max}`);
  }
  return n;
}

/** Nama file aman: hanya basename, tanpa karakter kontrol/pemisah path. */
export function namaFile(value: unknown): string {
  const raw = asText(value).trim();
  if (raw === '') throw badRequest('Nama file wajib diisi');
  const base = raw.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const bersih = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (bersih === '' || bersih === '.' || bersih === '..') {
    throw badRequest('Nama file tidak valid');
  }
  if (bersih.length > LIMITS.namaFileMax) throw badRequest('Nama file terlalu panjang');
  return bersih;
}

export function mime(value: unknown): string {
  const s = asText(value).trim().toLowerCase();
  if (!MIME_DIIZINKAN.includes(s)) {
    throw badRequest('Jenis file tidak diizinkan (JPEG, PNG, WEBP, atau PDF)');
  }
  return s;
}

export function ukuranFile(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(asText(value));
  if (!Number.isInteger(n) || n < 1 || n > LIMITS.lampiranMaxBytes) {
    throw badRequest('Ukuran file maksimal 5 MB');
  }
  return n;
}

/** Body JSON wajib objek biasa (bukan array/null). */
export function objectBody(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest('Body permintaan harus objek JSON');
  }
  return value as Record<string, unknown>;
}

export function action(value: unknown, allowed: string[]): string {
  const s = asText(value).trim().toLowerCase();
  if (!allowed.includes(s)) throw badRequest('Aksi tidak dikenal');
  return s;
}

/** Status tiket yang sah (sama dengan check constraint consultation_tickets). */
export const STATUS_TIKET = [
  'baru',
  'diverifikasi',
  'ditolak',
  'menunggu_penugasan',
  'ditugaskan',
  'menunggu_informasi',
  'menunggu_review',
  'terjawab',
  'selesai',
];

export function statusTiket(value: unknown): string {
  const s = asText(value).trim().toLowerCase();
  if (!STATUS_TIKET.includes(s)) throw badRequest('Status tiket tidak valid');
  return s;
}

export const isUuid = (value: unknown): boolean => UUID_RE.test(asText(value).trim());
export const isNomorTiket = (value: unknown): boolean => NOMOR_RE.test(asText(value).trim().toUpperCase());
export const isSecret = (value: unknown): boolean =>
  SECRET_RE.test(asText(value).trim().toUpperCase().replace(/[\s-]/g, ''));
