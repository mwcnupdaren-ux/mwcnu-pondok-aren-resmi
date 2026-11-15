// ============================================================
// Uji UNIT untuk modul _shared Edge Functions konsultasi (Node murni).
//
// Yang diuji di sini: fungsi murni/isolasi (validasi, secret/HMAC,
// rate limiter memori, pemetaan error, redaksi audit, lapisan HTTP).
// Yang TIDAK diuji di sini (butuh Deno + Supabase nyata):
//   * entrypoint consultation-*/index.ts (Deno.env, GoTrue, Storage)
//   * RPC database (sudah diuji di test-konsultasi.mjs via PGlite)
//
// Cara jalan (dari folder ini):  npm run test:shared
// ============================================================
import {
  LIMITS,
  action,
  boolean,
  email,
  integer,
  isNomorTiket,
  isSecret,
  isUuid,
  kategoriKode,
  mime,
  namaFile,
  nomorTiket,
  objectBody,
  optionalText,
  secretHash,
  secretTiket,
  slug,
  statusTiket,
  text,
  ukuranFile,
  uuid,
  whatsapp,
} from '../../functions/_shared/validation.ts';
import {
  generateTicketSecret,
  hashClientId,
  hashSecret,
  timingSafeEqualHex,
} from '../../functions/_shared/secret.ts';
import { MemoryLimiter } from '../../functions/_shared/ratelimit.ts';
import { AppError, errorPayload, mapDbError, tooMany } from '../../functions/_shared/errors.ts';
import { redact } from '../../functions/_shared/audit.ts';
import {
  clientIp,
  corsHeaders,
  jsonResponse,
  readJson,
  serve,
} from '../../functions/_shared/http.ts';

let ok = 0;
let gagal = 0;

function cek(label, condition, detail = '') {
  if (condition) {
    ok++;
    console.log('OK   ' + label);
  } else {
    gagal++;
    console.log('GAGAL ' + label + (detail ? ' -> ' + detail : ''));
    process.exitCode = 1;
  }
}

function tolak(label, fn, perlu = '') {
  try {
    fn();
    cek(label + ' (harusnya ditolak)', false, 'tidak melempar');
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    cek(label, e instanceof AppError && (perlu === '' || pesan.includes(perlu)), pesan);
  }
}

async function tolakAsync(label, fn, perlu = '') {
  try {
    await fn();
    cek(label + ' (harusnya ditolak)', false, 'tidak melempar');
  } catch (e) {
    const pesan = e instanceof Error ? e.message : String(e);
    cek(label, e instanceof AppError && (perlu === '' || pesan.includes(perlu)), pesan);
  }
}

// ============ V01: validasi teks & batas ============
console.log('=== V01 validasi teks ===');
cek('V01a teks dipangkas & baris baru dinormalkan', text('  Halo\r\ndunia  ', 'X', 3, 50) === 'Halo\ndunia');
tolak('V01b teks terlalu pendek', () => text('ab', 'Judul', 5, 150), 'minimal 5');
tolak('V01c teks terlalu panjang', () => text('x'.repeat(151), 'Judul', 5, 150), 'maksimal 150');
tolak('V01d non-string ditolak (tidak dikonversi)', () => text(123, 'Judul', 1, 10), 'harus berupa teks');
tolak('V01e wajib kosong ditolak', () => text('   ', 'Judul', 1, 10), 'wajib diisi');
cek('V01f opsional kosong mengembalikan string kosong', optionalText(undefined, 'Nama', 2, 120) === '');
cek('V01g opsional terisi divalidasi', optionalText(' Budi ', 'Nama', 2, 120) === 'Budi');
cek('V01h body objek diterima', objectBody({ a: 1 }).a === 1);
tolak('V01i body array ditolak', () => objectBody([1, 2]), 'objek JSON');
tolak('V01j body null ditolak', () => objectBody(null), 'objek JSON');

// ============ V02: identitas & format ============
console.log('=== V02 identitas & format ===');
const uid = '3f0c1a9e-1b2c-4d5e-8f90-abcdef123456';
cek('V02a uuid valid', uuid(uid) === uid);
cek('V02b isUuid benar', isUuid(uid) === true);
tolak('V02c uuid asal ditolak', () => uuid('bukan-uuid'), 'tidak valid');
tolak('V02d uuid kosong ditolak', () => uuid(''), 'tidak valid');
cek('V02e nomor tiket dinormalkan ke huruf besar', nomorTiket(' kon-261115-ab2 ') === 'KON-261115-AB2');
cek('V02f isNomorTiket benar', isNomorTiket('KON-261115-AB2') === true);
tolak('V02g nomor tiket tanpa prefix ditolak', () => nomorTiket('261115-AB2'), 'tidak valid');
tolak('V02h nomor tiket huruf terlarang (I) ditolak', () => nomorTiket('KON-261115-AIB'), 'tidak valid');
cek('V02i email dinormalkan', email(' Budi@Contoh.OR.ID ') === 'budi@contoh.or.id');
tolak('V02j email tanpa domain ditolak', () => email('budi@'), 'tidak valid');
cek('V02k whatsapp memisahkan spasi/strip', whatsapp('+62 812-3456-7890') === '+6281234567890');
tolak('V02l whatsapp terlalu pendek ditolak', () => whatsapp('123'), 'tidak valid');
cek('V02m kategori kode valid', kategoriKode('Ibadah') === 'ibadah');
tolak('V02n kategori kode spasi ditolak', () => kategoriKode('iba dah'), 'tidak valid');
cek('V02o slug valid', slug('niat-puasa-dhuha') === 'niat-puasa-dhuha');
tolak('V02p slug terlalu pendek ditolak', () => slug('abc'), 'tidak valid');
cek('V02q slug huruf besar dinormalkan ke huruf kecil', slug('Niat-Puasa') === 'niat-puasa');
tolak('V02q3 slug spasi ditolak', () => slug('niat puasa'), 'tidak valid');
cek('V02r boolean true diterima', boolean(true, 'x') === true);
tolak('V02s boolean dari string ditolak', () => boolean('true', 'x'), 'true/false');
cek('V02t integer default dipakai', integer(undefined, 'limit', 1, 50, 12) === 12);
tolak('V02u integer di luar batas ditolak', () => integer(500, 'limit', 1, 50, 12), '1-50');
tolak('V02v integer pecahan ditolak', () => integer(1.5, 'limit', 1, 50, 12), 'bilangan bulat');
cek('V02w status tiket sah diterima', statusTiket('Menunggu_Review') === 'menunggu_review');
tolak('V02x status tiket asing ditolak', () => statusTiket('pending'), 'tidak valid');
cek('V02y aksi sah diterima', action('LIST', ['list', 'detail']) === 'list');
tolak('V02z aksi asing ditolak', () => action('hapus', ['list']), 'tidak dikenal');

// ============ V03: lampiran ============
console.log('=== V03 lampiran ===');
cek('V03a nama file mengambil basename', namaFile('C:\\Users\\x\\bukti.pdf') === 'bukti.pdf');
cek('V03b path traversal dibuang', namaFile('../../etc/passwd.png') === 'passwd.png');
tolak('V03c nama file titik-titik ditolak', () => namaFile('..'), 'tidak valid');
tolak('V03d nama file kosong ditolak', () => namaFile('   '), 'wajib diisi');
cek('V03e mime pdf diterima', mime('application/pdf') === 'application/pdf');
tolak('V03f mime html ditolak', () => mime('text/html'), 'tidak diizinkan');
tolak('V03g mime svg ditolak', () => mime('image/svg+xml'), 'tidak diizinkan');
cek('V03h ukuran 1 byte diterima', ukuranFile(1) === 1);
tolak('V03i ukuran 0 ditolak', () => ukuranFile(0), 'maksimal 5 MB');
tolak('V03j ukuran >5MB ditolak', () => ukuranFile(LIMITS.lampiranMaxBytes + 1), 'maksimal 5 MB');

// ============ S01: secret & HMAC ============
console.log('=== S01 secret & HMAC ===');
const PEPPER = 'pepper-uji-yang-cukup-panjang-123';
const s1 = generateTicketSecret();
const s2 = generateTicketSecret();
cek('S01a secret 32 karakter', s1.length === 32, s1.length);
cek('S01b secret hanya alfabet Crockford', /^[0-9A-HJKMNP-TV-Z]{32}$/.test(s1), s1);
cek('S01c secret lolos validator', isSecret(s1) === true);
cek('S01d dua secret berbeda', s1 !== s2);
const h1 = await hashSecret(s1, PEPPER);
const h1b = await hashSecret(s1, PEPPER);
const h2 = await hashSecret(s2, PEPPER);
const h3 = await hashSecret(s1, PEPPER + '-lain');
cek('S01e hash 64 hex', /^[0-9a-f]{64}$/.test(h1), h1);
cek('S01f hash deterministik', h1 === h1b);
cek('S01g secret berbeda -> hash berbeda', h1 !== h2);
cek('S01h pepper berbeda -> hash berbeda', h1 !== h3);
cek('S01i hash dinormalkan (huruf kecil/spasi)', (await hashSecret(s1.toLowerCase(), PEPPER)) === h1);
cek('S01j secretTiket menerima secret sistem', secretTiket(s1) === s1);
tolak('S01k secretTiket menolak teks pendek', () => secretTiket('abc'), 'tidak valid');
cek('S01l secretHash menerima hash', secretHash(h1) === h1);
tolak('S01m secretHash menolak non-hex', () => secretHash('z'.repeat(64)), 'tidak valid');
const ipHash = await hashClientId('203.0.113.7', PEPPER);
cek('S01n hash klien 32 hex', /^[0-9a-f]{32}$/.test(ipHash), ipHash);
cek('S01o hash klien deterministik', ipHash === (await hashClientId('203.0.113.7', PEPPER)));
cek('S01p IP berbeda -> hash berbeda', ipHash !== (await hashClientId('203.0.113.8', PEPPER)));
cek('S01q timingSafeEqualHex sama', timingSafeEqualHex(h1, h1.toUpperCase()) === true);
cek('S01r timingSafeEqualHex beda', timingSafeEqualHex(h1, h2) === false);
cek('S01s timingSafeEqualHex panjang beda', timingSafeEqualHex('aa', 'aaa') === false);
try {
  await hashSecret(s1, 'pendek');
  cek('S01t pepper terlalu pendek ditolak', false, 'tidak melempar');
} catch (e) {
  cek('S01t pepper terlalu pendek ditolak', /Pepper/.test(String(e?.message ?? '')), String(e?.message));
}

// ============ R01: rate limiter memori ============
console.log('=== R01 rate limiter memori ===');
const rl = new MemoryLimiter(60_000, 100);
const t0 = 1_000_000;
const hasil = [];
for (let i = 0; i < 4; i++) hasil.push(rl.check('kunci-a', 3, t0 + i));
cek('R01a 3 permintaan pertama diizinkan', hasil.slice(0, 3).every((r) => r.allowed === true));
cek('R01b permintaan ke-4 ditolak', hasil[3].allowed === false);
cek('R01c sisa kuota menurun', hasil[0].sisa === 2 && hasil[2].sisa === 0);
cek('R01d retry_after masuk akal', hasil[3].retry_after >= 1 && hasil[3].retry_after <= 60, hasil[3].retry_after);
cek('R01e kunci lain tidak terpengaruh', rl.check('kunci-b', 3, t0 + 5).allowed === true);
cek('R01f setelah jendela lewat diizinkan lagi', rl.check('kunci-a', 3, t0 + 61_000).allowed === true);
const rlGlobal = new MemoryLimiter(60_000, 2);
rlGlobal.check('x', 10, t0);
rlGlobal.check('y', 10, t0);
cek('R01g batas global menolak lintas kunci', rlGlobal.check('z', 10, t0).allowed === false);
rl.reset();
cek('R01h reset mengosongkan hit', rl.check('kunci-a', 1, t0 + 62_000).allowed === true);

// ============ E01: pemetaan error aman ============
console.log('=== E01 pemetaan error ===');
const p401 = errorPayload(mapDbError('Kredensial tiket tidak valid'));
cek('E01a kredensial salah -> 401', p401.status === 401 && p401.body.message === 'Kredensial tiket tidak valid');
const p403 = errorPayload(mapDbError('Aktor bukan staf konsultasi aktif'));
cek('E01b aktor bukan staf -> 403', p403.status === 403);
cek('E01c pesan 403 tidak memuat detail internal', !JSON.stringify(p403.body).includes('consultation_'));
const p409 = errorPayload(mapDbError('new row violates check constraint "ccp_terbit_butuh_persetujuan"'));
cek('E01d constraint publikasi -> 409 aman', p409.status === 409 && /persetujuan/i.test(String(p409.body.message)));
const p409b = errorPayload(mapDbError('new row violates check constraint "ccr_min_satu_kontak"'));
cek('E01d2 constraint tak dikenal -> 409 generik', p409b.status === 409 && p409b.body.message === 'Data tidak memenuhi aturan konsultasi');
const p500 = errorPayload(new Error('password=rahasia koneksi postgres://user:pw@host'));
cek('E01e error tak dikenal -> 500 generik', p500.status === 500);
cek('E01f error tak dikenal TIDAK membocorkan pesan asli', !JSON.stringify(p500.body).includes('postgres://'));
const p429 = errorPayload(tooMany('Tenang dulu', 42));
cek('E01g 429 membawa retryAfter', p429.status === 429 && p429.retryAfter === 42);
cek('E01h body 429 memuat kode rate_limited', p429.body.error === 'rate_limited');
const appErr = new AppError(400, 'bad_request', 'Uji');
cek('E01i AppError mempertahankan status/kode', errorPayload(appErr).body.error === 'bad_request');

// ============ A01: redaksi audit ============
console.log('=== A01 redaksi audit ===');
const merah = redact({
  email: 'budi@contoh.or.id',
  catatan: 'hubungi budi@contoh.or.id atau 081234567890',
  secret: 'ABCDEFGHJKLMNPQRSTVWXYZ23456789AB',
  token: 'abc',
  nested: { hash: 'deadbeef', biasa: 'aman' },
});
cek('A01a email disamarkan', !JSON.stringify(merah).includes('budi@contoh.or.id'));
cek('A01b nomor panjang disamarkan', !JSON.stringify(merah).includes('081234567890'));
cek('A01c kunci sensitif disamarkan', merah.secret === '***' && merah.token === '***' && merah.nested.hash === '***');
cek('A01d nilai biasa dipertahankan', merah.nested.biasa === 'aman');
cek('A01e array dibatasi & disamarkan', redact(['a@b.co']).length === 1 && redact(['a@b.co'])[0] === '***@***');
cek('A01f kedalaman berlebih dipotong', redact({ a: { b: { c: { d: { e: 1 } } } } }).a.b.c.d.e === '[dalam]');

// ============ H01: lapisan HTTP ============
console.log('=== H01 lapisan HTTP ===');
const ORIGIN = 'https://mwcnupondokaren.or.id';
const allowed = new Set([ORIGIN]);
const hOk = corsHeaders(ORIGIN, allowed);
const hAsing = corsHeaders('https://jahat.example', allowed);
cek('H01a origin allowlist mendapat ACAO', hOk['Access-Control-Allow-Origin'] === ORIGIN);
cek('H01b origin asing TIDAK mendapat ACAO', hAsing['Access-Control-Allow-Origin'] === undefined);
cek('H01c tidak pernah memakai wildcard', hOk['Access-Control-Allow-Origin'] !== '*');
cek('H01d header keamanan terpasang', hOk['X-Content-Type-Options'] === 'nosniff' && hOk['Cache-Control'] === 'no-store');
const resp = jsonResponse(200, { ok: true }, hOk);
cek('H01e respons JSON content-type', resp.headers.get('content-type').startsWith('application/json'));
cek('H01f respons membawa ACAO', resp.headers.get('access-control-allow-origin') === ORIGIN);
const reqIp = new Request('https://x/', { headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' } });
cek('H01g IP diambil dari entri pertama XFF', clientIp(reqIp) === '203.0.113.9');
cek('H01h IP fallback', clientIp(new Request('https://x/')) === 'tanpa-ip');
const reqJson = new Request('https://x/', { method: 'POST', body: JSON.stringify({ a: 1 }) });
cek('H01i body JSON terbaca', (await readJson(reqJson)).a === 1);
await tolakAsync('H01j body bukan JSON ditolak', () =>
  readJson(new Request('https://x/', { method: 'POST', body: '{rusak' })), 'bukan JSON');
await tolakAsync('H01k body array ditolak', () =>
  readJson(new Request('https://x/', { method: 'POST', body: '[1]' })), 'objek JSON');
await tolakAsync('H01l body kosong ditolak', () =>
  readJson(new Request('https://x/', { method: 'POST', body: '' })), 'wajib diisi');
await tolakAsync('H01m body kebesaran ditolak', () =>
  readJson(new Request('https://x/', { method: 'POST', body: JSON.stringify({ a: 'x'.repeat(40_000) }) })), 'terlalu besar');

const optResp = await serve(
  new Request('https://x/', { method: 'OPTIONS', headers: { origin: ORIGIN } }),
  allowed,
  ['POST'],
  async () => jsonResponse(200, {}),
);
cek('H01n preflight 204', optResp.status === 204);
cek('H01o preflight mengizinkan POST', (optResp.headers.get('access-control-allow-methods') ?? '').includes('POST'));
const optAsing = await serve(
  new Request('https://x/', { method: 'OPTIONS', headers: { origin: 'https://jahat.example' } }),
  allowed,
  ['POST'],
  async () => jsonResponse(200, {}),
);
cek('H01p preflight origin asing tanpa ACAO', optAsing.status === 204 && optAsing.headers.get('access-control-allow-origin') === null);
const getResp = await serve(new Request('https://x/'), allowed, ['POST'], async () => jsonResponse(200, {}));
cek('H01q metode salah -> 405', getResp.status === 405);
const errResp = await serve(new Request('https://x/', { method: 'POST' }), allowed, ['POST'], async () => {
  throw tooMany('Tenang', 30);
});
cek('H01r error handler -> 429 + Retry-After', errResp.status === 429 && errResp.headers.get('retry-after') === '30');
const body429 = await errResp.json();
cek('H01s body error aman (tanpa stack)', body429.error === 'rate_limited' && !JSON.stringify(body429).includes('at '));
const err500 = await serve(new Request('https://x/', { method: 'POST' }), allowed, ['POST'], async () => {
  throw new Error('koneksi postgres://user:pw@host gagal');
});
cek('H01t error tak dikenal -> 500 generik', err500.status === 500 && !JSON.stringify(await err500.json()).includes('postgres://'));

// ============ M01: entrypoint Edge Function dapat dimuat ============
console.log('=== M01 entrypoint ===');
const ENTRYPOINTS = [
  'consultation-public',
  'consultation-ticket-create',
  'consultation-ticket-access',
  'consultation-ticket-message',
  'consultation-admin',
  'consultation-consultant',
  'consultation-review',
  'consultation-publication',
  'consultation-attachment',
];
for (const nama of ENTRYPOINTS) {
  try {
    const mod = await import(`../../functions/${nama}/index.ts`);
    cek(`M01a ${nama} mengekspor default.fetch`, typeof mod.default?.fetch === 'function');
  } catch (e) {
    cek(`M01a ${nama} mengekspor default.fetch`, false, String(e?.message ?? e));
  }
}
// Tanpa env Supabase: function WAJIB membalas 500 aman, bukan stack trace.
globalThis.Deno = { env: { toObject: () => ({}) } };
const pubMod = (await import('../../functions/consultation-public/index.ts')).default;
const respTanpaEnv = await pubMod.fetch(
  new Request('https://x/', { method: 'POST', body: '{}' }),
);
const isiTanpaEnv = await respTanpaEnv.json();
cek(
  'M01b konfigurasi kosong -> 500 aman tanpa detail env',
  respTanpaEnv.status === 500 &&
    isiTanpaEnv.error === 'misconfigured' &&
    !JSON.stringify(isiTanpaEnv).includes('SUPABASE'),
  JSON.stringify(isiTanpaEnv),
);
delete globalThis.Deno;

console.log(gagal === 0 ? '\n== HASIL: SEMUA TES UNIT LOLOS ==' : '\n== HASIL: ADA KEGAGALAN ==');
console.log(`Ringkasan: ${ok} lolos, ${gagal} gagal`);
process.exit(process.exitCode || 0);
