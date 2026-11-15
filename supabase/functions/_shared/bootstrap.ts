// ============================================================
// Bootstrap Edge Function: muat konfigurasi atau balas 500 aman.
// Konfigurasi tidak lengkap TIDAK boleh membocorkan nama env/stack.
// ============================================================

import { loadConfig, type Config } from './config.ts';
import { jsonResponse } from './http.ts';
import { logWarn } from './audit.ts';

export function resolveConfig(env: Record<string, string | undefined>): Config | Response {
  try {
    return loadConfig(env);
  } catch (error) {
    logWarn('konfigurasi konsultasi belum lengkap', {
      sebab: error instanceof Error ? error.message : 'tidak diketahui',
    });
    return jsonResponse(500, {
      error: 'misconfigured',
      message: 'Konfigurasi server belum lengkap',
    });
  }
}
