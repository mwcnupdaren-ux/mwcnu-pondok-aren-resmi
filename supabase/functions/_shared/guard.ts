// ============================================================
// Penjaga rate-limit: wajib memakai lapisan persisten (RPC), fail-closed.
// ============================================================

import { AppError, tooMany } from './errors.ts';
import { hashClientId } from './secret.ts';
import { policy } from './ratelimit.ts';
import { logWarn } from './audit.ts';
import type { Db } from './db.ts';
import type { Config } from './config.ts';
import type { RateResult } from './types.ts';

/**
 * Tolak permintaan bila melewati kebijakan endpoint.
 * @param clientId identitas klien mentah (IP) — di-hash sebelum disimpan
 * @param policyName kunci kebijakan di ratelimit.POLICIES
 */
export async function guardRateLimit(
  db: Db,
  cfg: Config,
  clientId: string,
  policyName: string,
): Promise<void> {
  const p = policy(policyName);
  let bucket: string;
  try {
    bucket = await hashClientId(clientId, cfg.secretPepper);
  } catch (error) {
    logWarn('rate-limit tidak dapat membuat identitas bucket', {
      endpoint: policyName,
      sebab: error instanceof Error ? error.message : 'tidak diketahui',
    });
    throw new AppError(503, 'rate_limit_unavailable', 'Layanan sementara tidak tersedia. Coba lagi nanti.');
  }

  try {
    const r = await db.rpc<RateResult>('consultation_svc_rate_hit', {
      p_bucket: bucket,
      p_endpoint: policyName,
      p_limit: p.limit,
      p_window_seconds: p.windowSeconds,
    });
    if (!r || r.allowed !== true) {
      const retry = Number(r?.retry_after ?? p.windowSeconds);
      throw tooMany('Terlalu banyak permintaan. Coba lagi nanti.', retry > 0 ? retry : 60);
    }
    return;
  } catch (error) {
    if (error instanceof AppError && error.status === 429) throw error;
    logWarn('rate-limit persisten gagal; permintaan ditolak', {
      endpoint: policyName,
      sebab: error instanceof Error ? error.message : 'tidak diketahui',
    });
    // Fail closed: limiter memori per instance bukan pengganti rate-limit
    // persisten lintas instance dan tidak boleh menjadi fallback keamanan.
    throw new AppError(503, 'rate_limit_unavailable', 'Layanan sementara tidak tersedia. Coba lagi nanti.');
  }
}
