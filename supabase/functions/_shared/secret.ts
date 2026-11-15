// ============================================================
// Rahasia tiket: pembuatan secret acak + HMAC-SHA256 (pepper server).
//
// Mengapa HMAC (bukan hash polos): secret 160-bit acak sudah kuat, tetapi
// pepper server mencegah penyerang yang mencuri HANYA tabel kredensial
// dapat menguji tebakan secara offline tanpa juga mencuri env server.
//
// Catatan: plaintext secret HANYA dikembalikan sekali ke pemohon; database
// menyimpan hash 64-hex. Tidak pernah dicatat di log/audit.
// ============================================================

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Secret 160-bit dalam Crockford Base32 (32 karakter, tanpa I/L/O/U). */
export function generateTicketSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
  return out;
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** HMAC-SHA256(secret, pepper) -> 64 hex. Secret dinormalkan seperti di DB. */
export async function hashSecret(secret: string, pepper: string): Promise<string> {
  if (!pepper || pepper.length < 16) {
    throw new Error('Pepper konsultasi tidak dikonfigurasi');
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const normal = secret.trim().toUpperCase().replace(/[\s-]/g, '');
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(normal));
  return toHex(sig);
}

/** Hash identitas klien (IP) untuk rate-limit — IP mentah tidak disimpan. */
export async function hashClientId(clientId: string, pepper: string): Promise<string> {
  const full = await hashSecret(`klien:${clientId}`, pepper);
  return full.slice(0, 32);
}

/** Perbandingan waktu-konstan untuk string hex (mencegah timing leak). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
