// ============================================================
// Klien database untuk Edge Functions.
//
// SEMUA akses data konsultasi melewati PostgREST RPC (consultation_svc_*)
// dengan service_role. Tidak ada query tabel langsung dari klien ini,
// sehingga aturan bisnis tetap terpusat di database.
//
// service_role HANYA hidup di server (env runtime); tidak pernah dikirim
// ke browser dan tidak pernah muncul di pesan error.
// ============================================================

import { AppError, conflict, internal, mapDbError } from './errors.ts';

export interface AuthUser {
  id?: string;
  email?: string;
}

const TIMEOUT_MS = 15_000;

function encodePath(path: string): string {
  return path.split('/').map((seg) => encodeURIComponent(seg)).join('/');
}

function pesanError(text: string): string {
  try {
    const j = JSON.parse(text) as { message?: unknown; error?: unknown };
    if (typeof j.message === 'string') return j.message;
    if (typeof j.error === 'string') return j.error;
  } catch (_e) {
    /* bukan JSON — jangan bocorkan isi mentah */
  }
  return '';
}

export class Db {
  url: string;
  serviceKey: string;
  anonKey: string;
  timeoutMs: number;

  constructor(url: string, serviceKey: string, anonKey: string, timeoutMs = TIMEOUT_MS) {
    this.url = url.replace(/\/+$/, '');
    this.serviceKey = serviceKey;
    this.anonKey = anonKey;
    this.timeoutMs = timeoutMs;
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.url}${path}`, {
        ...init,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (_e) {
      throw new AppError(502, 'upstream', 'Layanan database tidak tersedia');
    }
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      ...extra,
    };
  }

  /** Panggil RPC PostgREST; error database dipetakan ke pesan aman. */
  async rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    const res = await this.request(`/rest/v1/rpc/${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(args),
    });
    const text = await res.text();
    if (!res.ok) throw mapDbError(pesanError(text) || `rpc gagal (${res.status})`);
    if (text.trim() === '') return null as T;
    try {
      return JSON.parse(text) as T;
    } catch (_e) {
      throw internal();
    }
  }

  /** Verifikasi JWT pengguna lewat GoTrue — identitas TIDAK diambil dari body. */
  async getUser(token: string): Promise<AuthUser | null> {
    let res: Response;
    try {
      res = await fetch(`${this.url}/auth/v1/user`, {
        method: 'GET',
        headers: { apikey: this.anonKey, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (_e) {
      throw new AppError(502, 'auth_upstream', 'Layanan autentikasi tidak tersedia');
    }
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new AppError(502, 'auth_upstream', 'Layanan autentikasi tidak tersedia');
    try {
      return (await res.json()) as AuthUser;
    } catch (_e) {
      return null;
    }
  }

  async storageUpload(
    bucket: string,
    path: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void> {
    const res = await this.request(`/storage/v1/object/${bucket}/${encodePath(path)}`, {
      method: 'POST',
      headers: this.headers({
        'Content-Type': contentType,
        'x-upsert': 'false',
        'Cache-Control': 'no-store',
      }),
      body: new Blob([bytes], { type: contentType }),
    });
    if (!res.ok) {
      const msg = pesanError(await res.text());
      if (res.status === 409 || /already exists|duplicate/i.test(msg)) {
        throw conflict('Lampiran dengan nama yang sama sudah ada');
      }
      throw new AppError(502, 'storage_error', 'Gagal menyimpan lampiran');
    }
  }

  async storageSign(bucket: string, path: string, expiresIn = 120): Promise<string> {
    const res = await this.request(`/storage/v1/object/sign/${bucket}/${encodePath(path)}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn }),
    });
    if (!res.ok) {
      throw new AppError(502, 'storage_error', 'Gagal membuat tautan unduhan');
    }
    let data: { signedURL?: string } = {};
    try {
      data = (await res.json()) as { signedURL?: string };
    } catch (_e) {
      throw new AppError(502, 'storage_error', 'Gagal membuat tautan unduhan');
    }
    if (!data.signedURL) {
      throw new AppError(502, 'storage_error', 'Gagal membuat tautan unduhan');
    }
    return `${this.url}/storage/v1${data.signedURL}`;
  }

  async storageRemove(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    try {
      await this.request(`/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: this.headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefixes: paths }),
      });
    } catch (_e) {
      /* pembersihan bersifat best-effort; tidak boleh menggagalkan respons */
    }
  }
}
