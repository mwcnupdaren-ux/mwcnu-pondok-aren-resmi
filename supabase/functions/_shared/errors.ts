// ============================================================
// Error aman: respons TIDAK pernah memuat detail SQL, stack, atau
// isi rahasia konsultasi. Pesan database yang dikenal dipetakan ke
// pesan publik yang aman; sisanya menjadi 500 generik.
// ============================================================

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'bad_request', message, details);
export const unauthorized = (message = 'Autentikasi diperlukan') =>
  new AppError(401, 'unauthorized', message);
export const forbidden = (message = 'Tidak berwenang') =>
  new AppError(403, 'forbidden', message);
export const notFound = (message = 'Data tidak ditemukan') =>
  new AppError(404, 'not_found', message);
export const conflict = (message: string) =>
  new AppError(409, 'conflict', message);
export const tooMany = (message = 'Terlalu banyak permintaan', retryAfter = 60) =>
  new AppError(429, 'rate_limited', message, { retry_after: retryAfter });
export const methodNotAllowed = () =>
  new AppError(405, 'method_not_allowed', 'Metode tidak didukung');
export const payloadTooLarge = () =>
  new AppError(413, 'payload_too_large', 'Permintaan terlalu besar');
export const internal = (message = 'Terjadi kesalahan pada server') =>
  new AppError(500, 'internal', message);

const DB_MAP: Array<[RegExp, number, string]> = [
  [/Kredensial tiket tidak valid/i, 401, 'Kredensial tiket tidak valid'],
  [/Aktor bukan staf konsultasi aktif/i, 403, 'Akun bukan staf konsultasi aktif'],
  [/Aktor audit bukan staf konsultasi aktif/i, 403, 'Identitas aktor tidak sah'],
  [/Aktor sistem wajib bernilai sistem/i, 403, 'Identitas aktor tidak sah'],
  [/Aktor wajib diisi/i, 400, 'Identitas aktor wajib diisi'],
  [/Hanya admin konsultasi/i, 403, 'Hanya admin konsultasi yang berwenang'],
  [/Hanya reviewer/i, 403, 'Hanya reviewer yang berwenang'],
  [/Hanya konsultan/i, 403, 'Hanya konsultan yang berwenang'],
  [/Tidak berwenang atas tiket ini/i, 403, 'Tidak berwenang atas tiket ini'],
  [/Tiket tidak ditugaskan kepada Anda/i, 403, 'Tiket tidak ditugaskan kepada Anda'],
  [/Tiket tidak ditemukan/i, 404, 'Tiket tidak ditemukan'],
  [/Publikasi tidak ditemukan/i, 404, 'Publikasi tidak ditemukan'],
  [/Tiket sudah ditutup/i, 409, 'Tiket sudah ditutup'],
  [/Transisi status tidak valid/i, 409, 'Perubahan status tidak diizinkan'],
  [/Tiket baru wajib dimulai/i, 409, 'Tiket baru wajib dimulai dengan status baru'],
  [/Kolom SLA/i, 409, 'Kolom SLA hanya dikelola sistem'],
  [/published_at hanya dikelola sistem/i, 409, 'Waktu terbit hanya dikelola sistem'],
  [/wajib diperbarui setelah pencabutan/i, 409, 'Persetujuan wajib diperbarui setelah pencabutan'],
  [/mendahului persetujuan/i, 409, 'Waktu persetujuan tidak konsisten'],
  [/ccp_terbit_butuh_persetujuan/i, 409, 'Publikasi membutuhkan ketiga persetujuan'],
  [/ccp_terbit_butuh_slug/i, 409, 'Publikasi membutuhkan slug'],
  [/ccp_terbit_butuh_waktu/i, 409, 'Publikasi terbit wajib memiliki waktu terbit'],
  [/append-only/i, 409, 'Data riwayat tidak dapat diubah'],
  [/Lampiran tidak cocok/i, 409, 'Lampiran tidak cocok dengan tiket'],
  [/Pengunggah bukan staf/i, 403, 'Pengunggah tidak berwenang'],
  [/Persetujuan privasi wajib diberikan/i, 400, 'Persetujuan privasi wajib diberikan'],
  [/Alasan penolakan wajib diisi/i, 400, 'Alasan penolakan wajib diisi'],
  [/Alasan pelepasan wajib diisi/i, 400, 'Alasan pelepasan wajib diisi'],
  [/Catatan wajib diisi/i, 400, 'Catatan wajib diisi saat meminta revisi'],
  [/Keputusan review tidak valid/i, 400, 'Keputusan review tidak valid'],
  [/Kategori tidak ditemukan/i, 400, 'Kategori tidak ditemukan atau tidak aktif'],
  [/Hash kredensial tidak valid/i, 400, 'Kredensial tidak valid'],
  [/Status tiket tidak siap/i, 409, 'Status tiket tidak mendukung tindakan ini'],
  [/Tiket sudah memiliki penugasan aktif/i, 409, 'Tiket sudah memiliki penugasan aktif'],
  [/Tidak ada penugasan aktif/i, 409, 'Tidak ada penugasan aktif'],
  [/Tiket tidak dalam status menunggu review/i, 409, 'Tiket tidak menunggu review'],
  [/Publikasi sudah terbit/i, 409, 'Publikasi sudah terbit'],
  [/Publikasi belum diajukan/i, 404, 'Publikasi belum diajukan'],
  [/Tiket belum memiliki jawaban final/i, 409, 'Tiket belum memiliki jawaban final'],
];

export function mapDbError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error ?? '');
  for (const [re, status, safe] of DB_MAP) {
    if (re.test(message)) return new AppError(status, status === 403 ? 'forbidden' : 'db_error', safe);
  }
  // Validasi constraint yang tidak dikenal: jangan bocorkan nama kolom/nilai.
  if (/violates (check|unique|foreign key) constraint|duplicate key/i.test(message)) {
    return conflict('Data tidak memenuhi aturan konsultasi');
  }
  return internal();
}

export function errorPayload(error: unknown): { status: number; body: Record<string, unknown>; retryAfter?: number } {
  if (error instanceof AppError) {
    const retryAfter =
      error.status === 429 && error.details && typeof error.details === 'object'
        ? Number((error.details as Record<string, unknown>).retry_after ?? 60)
        : undefined;
    return {
      status: error.status,
      body: { error: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      retryAfter,
    };
  }
  const mapped = mapDbError(error);
  return { status: mapped.status, body: { error: mapped.code, message: mapped.message } };
}
