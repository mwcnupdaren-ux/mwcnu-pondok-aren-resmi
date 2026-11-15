# Phase 2 — Hasil Pengujian (yang BENAR-BENAR dijalankan)

- Lingkungan: Node.js **v24.16.0**, Windows, PGlite 0.3.16 (Postgres WASM).
- Tidak ada `deno` dan tidak ada `supabase` CLI di lingkungan ini.
- Seluruh angka di bawah berasal dari eksekusi nyata; perintahnya disertakan
  agar pemeriksa dapat mengulang.

## 1. Ringkasan

| Suite | Cakupan | Asersi | Hasil | Exit |
|---|---|---|---|---|
| `test-shared.mjs` | unit modul `_shared` + entrypoint (Node murni) | **121** | 121 lolos, 0 gagal | 0 |
| `test-konsultasi.mjs` | integrasi migrasi + RPC (PGlite) | **154** | 154 lolos, 0 gagal | 0 |
| `node --check` | sintaks 20 berkas `.ts` (11 shared + 9 entrypoint) | 20 | 20 lolos | 0 |
| verifikasi rollback | 001–004 lalu rollback **dua kali** | 5 metrik | 16→0 tabel; 0 fungsi/trigger/sequence | 0 |

## 2. Uji Unit — `supabase/consultation/tests/test-shared.mjs`

```powershell
cd supabase/consultation/tests
node test-shared.mjs
# -> == HASIL: SEMUA TES UNIT LOLOS ==
# -> Ringkasan: 121 lolos, 0 gagal
```

| Kelompok | Asersi | Isi |
|---|---|---|
| V01 | 10 | teks wajib/opsional, batas panjang, non-string ditolak, body objek |
| V02 | 24 | uuid, nomor tiket, secret, email, WhatsApp, kategori, slug, boolean, integer, status, aksi |
| V03 | 10 | basename nama file, path traversal, mime allowlist, batas ukuran |
| S01 | 20 | secret 160-bit (32 karakter Crockford), HMAC deterministik, pepper berbeda, normalisasi, hash klien, timing-safe |
| R01 | 8 | limiter memori: kuota, penolakan, `retry_after`, jendela waktu, batas global, reset |
| E01 | 10 | pemetaan error DB → HTTP aman; error tak dikenal tidak membocorkan pesan asli; `Retry-After` |
| A01 | 6 | redaksi email/HP/secret/kunci sensitif, array, batas kedalaman |
| H01 | 23 | CORS allowlist (bukan `*`), header keamanan, body JSON/batas ukuran, preflight, 405, 429, 500 generik, IP dari XFF |
| M01 | 10 | 9 entrypoint dapat dimuat & mengekspor `default.fetch`; konfigurasi kosong → 500 aman tanpa nama env |

**Yang dibuktikan:** tidak ada wildcard CORS; pesan error tidak memuat detail
internal; secret tidak pernah muncul di log; validasi menolak input di luar
batas constraint database; kesembilan entrypoint dapat dimuat (import path dan
ekspor benar) dan gagal secara aman bila konfigurasi belum lengkap.

### 2b. Pemeriksaan Sintaks TypeScript

```powershell
node --check supabase/functions/_shared/*.ts
node --check supabase/functions/consultation-*/index.ts
# -> 20 berkas, 0 gagal
```

Ini **hanya** pemeriksaan sintaks/parse (Node type stripping), bukan
type-check penuh. `deno check` tetap belum dijalankan (Deno tidak tersedia).

## 3. Uji Integrasi Database — `test-konsultasi.mjs`

```powershell
cd supabase/consultation/tests
node test-konsultasi.mjs
# -> == HASIL: SEMUA TES LOLOS ==   (154 baris "OK", 0 "GAGAL")
```

Migrasi dijalankan **001 → 002 → 003 → 004**, lalu **diulang** (idempotensi),
sebelum asersi. Kelompok T01–T31 mencakup Phase 1, gate B1/B2/B3, dan layanan
Phase 2:

- **T01–T29** (Phase 1 + gate): mesin status, SLA, RLS deny-default, hak
  `service_role` eksplisit (16 tabel + sequence), invarian `published_at`,
  aktor terverifikasi, append-only, lampiran lintas tiket.
- **T30** (20 asersi): RPC layanan end-to-end — buat tiket (nomor dari
  sequence, secret hash), akses kredensial, pesan pemohon, daftar/detail per
  role, verifikasi → penugasan → jawaban → review → publikasi → cabut,
  tolak tiket, isolasi antar tiket, aktor palsu ditolak, `anon` tidak dapat
  memanggil RPC, `service_role` punya hak eksekusi.
- **T31** (11 asersi, baru): path lampiran lintas tiket ditolak, lampiran
  pemohon tercatat & hanya dapat diambil pemiliknya, izin unggah konsultan
  (ditugaskan vs bukan), rate-limit persisten mengizinkan lalu memblokir +
  `retry_after`, audit HTTP tercatat, jenis aktor asing ditolak, kategori
  publik tanpa data internal.

## 4. Verifikasi Rollback

Skrip ad-hoc (di luar repo): muat 001–004, lalu jalankan
`consultation_rollback.sql` **dua kali**.

```json
{"tabel_sebelum":16,"tabel_sesudah":0,"fungsi_sisa":0,"trigger_sisa":0,"sequence_sisa":0}
```

Artinya: seluruh 16 tabel, semua fungsi (Phase 1 + RPC `consultation_svc_*`),
semua trigger, dan sequence terhapus; rollback idempotent (aman diulang).
Bucket storage tidak dihapus (bagian manual, sesuai desain).

## 5. Yang BELUM Diuji (tidak diklaim lulus)

| Item | Alasan | Dampak |
|---|---|---|
| `deno check` (type-check penuh) | tidak ada Deno | kesalahan tipe (bukan sintaks) di `index.ts` belum terdeteksi; sintaks sudah lolos `node --check` |
| Deploy & pemanggilan HTTP nyata | tidak ada Supabase CLI/proyek | routing, JWT platform, CORS runtime belum terbukti |
| GoTrue `auth.getUser` | butuh proyek Supabase | verifikasi sesi staf belum diuji end-to-end |
| Storage unggah/signed URL | schema storage tidak ada di PGlite | bucket `consultation-private` & URL 120 detik belum diuji |
| RLS Supabase asli | PGlite memakai peran emulasi | perilaku `auth.uid()`/PostgREST belum diuji |
| Konkurensi multi-koneksi | PGlite single-connection | race nyata belum diukur |

Semua item di atas **wajib** diverifikasi saat deploy oleh user (lihat
`PHASE2_BACKEND.md` §9 dan `MIGRATION_GUIDE.md` §2).

## 6. Berkas yang Berubah / Ditambah

**Diubah**

- `supabase/consultation/consultation_002_tables.sql` — gate B1 + fungsi aktor
  B3 + audit check + RPC perubahan status
- `supabase/consultation/consultation_003_security.sql` — hak `service_role`
  eksplisit (B2) + grant fungsi baru
- `supabase/consultation/consultation_rollback.sql` — drop otomatis
  `consultation_svc_*`, trigger/fungsi B3, catatan dua bucket
- `supabase/consultation/tests/test-konsultasi.mjs` — 001–004 + T27–T31
- `supabase/consultation/MIGRATION_GUIDE.md` — urutan 4 file, verifikasi,
  rollback, langkah deploy

**Baru**

- `supabase/consultation/consultation_004_services.sql`
- `supabase/consultation/PHASE2_BACKEND.md`
- `supabase/consultation/PHASE2_TEST_RESULTS.md`
- `supabase/consultation/tests/test-shared.mjs`
- `supabase/functions/package.json`
- `supabase/functions/_shared/` — `config`, `bootstrap`, `errors`, `validation`,
  `secret`, `ratelimit`, `guard`, `http`, `db`, `auth`, `audit`, `types`
- `supabase/functions/consultation-public/`
- `supabase/functions/consultation-ticket-create/`
- `supabase/functions/consultation-ticket-access/`
- `supabase/functions/consultation-ticket-message/`
- `supabase/functions/consultation-admin/`
- `supabase/functions/consultation-consultant/`
- `supabase/functions/consultation-review/`
- `supabase/functions/consultation-publication/`
- `supabase/functions/consultation-attachment/`

**Tidak disentuh** (perubahan lokal yang sudah ada sebelumnya, bukan bagian
pekerjaan ini): `css/style.css`, `index.html`, `js/app.js`. Tidak ada
perubahan pada tabel CMS, login staf, konfigurasi domain, atau data produksi.

## 7. Kesimpulan Pengujian

Yang **terbukti otomatis**: seluruh aturan database Phase 2 (otorisasi per
role, isolasi tiket, rate-limit persisten, audit, lampiran) dan seluruh modul
murni Edge Function (validasi, secret/HMAC, CORS, error aman, redaksi).

Yang **belum terbukti**: lapisan runtime Deno/Supabase (deploy, JWT platform,
GoTrue, Storage). Klaim "Phase 2 siap produksi" TIDAK dibuat di sini; status
yang benar adalah **siap audit lokal**, menunggu verifikasi deploy oleh user.
