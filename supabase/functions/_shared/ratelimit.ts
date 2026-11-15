// ============================================================
// Rate limit.
//
// Lapisan utama  : RPC consultation_svc_rate_hit (persisten, lintas
//                  instance Edge Function) — lihat guard.ts.
// Lapisan cadangan: MemoryLimiter di bawah (dipakai bila RPC gagal agar
//                  perlindungan tetap ada walau database bermasalah).
//
// Limiter ini murni (tanpa I/O) sehingga dapat diuji dengan Node.
// ============================================================

import type { RateResult } from './types.ts';

export interface LimitPolicy {
  limit: number;
  windowSeconds: number;
}

/** Kebijakan per endpoint. Angka sengaja konservatif untuk jalur tulis. */
export const POLICIES: Record<string, LimitPolicy> = {
  'public-baca': { limit: 60, windowSeconds: 60 },
  'tiket-buat': { limit: 5, windowSeconds: 600 },
  'tiket-akses': { limit: 30, windowSeconds: 60 },
  'tiket-pesan': { limit: 10, windowSeconds: 60 },
  'tiket-lampiran': { limit: 10, windowSeconds: 600 },
  'tiket-unduh': { limit: 60, windowSeconds: 60 },
  'staf-baca': { limit: 180, windowSeconds: 60 },
  'staf-tulis': { limit: 60, windowSeconds: 60 },
  'staf-lampiran': { limit: 20, windowSeconds: 600 },
};

export function policy(name: string): LimitPolicy {
  return POLICIES[name] ?? { limit: 30, windowSeconds: 60 };
}

/**
 * Sliding-window in-memory. `check()` mengembalikan keputusan dan
 * mencatat hit hanya bila diizinkan (penolakan tidak memperpanjang ban).
 */
export class MemoryLimiter {
  windowMs: number;
  globalLimit: number;
  hits: Map<string, number[]>;
  global: number[];

  constructor(windowMs = 60_000, globalLimit = 1200) {
    this.windowMs = windowMs;
    this.globalLimit = globalLimit;
    this.hits = new Map();
    this.global = [];
  }

  private prune(arr: number[], now: number): number[] {
    const cut = now - this.windowMs;
    while (arr.length > 0 && arr[0] <= cut) arr.shift();
    return arr;
  }

  check(key: string, limit: number, now = Date.now()): RateResult {
    const g = this.prune(this.global, now);
    if (g.length >= this.globalLimit) {
      return { allowed: false, retry_after: Math.ceil(this.windowMs / 1000), sisa: 0 };
    }
    const arr = this.prune(this.hits.get(key) ?? [], now);
    if (arr.length >= limit) {
      const oldest = arr[0] ?? now;
      const retry = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.hits.set(key, arr);
      return { allowed: false, retry_after: retry, sisa: 0 };
    }
    arr.push(now);
    g.push(now);
    this.hits.set(key, arr);
    if (this.hits.size > 20_000) this.hits = new Map();
    return { allowed: true, sisa: Math.max(0, limit - arr.length) };
  }

  reset(): void {
    this.hits = new Map();
    this.global = [];
  }
}

/** Instance proses-level (bertahan antar request pada instance yang sama). */
export const memoryLimiter = new MemoryLimiter();
