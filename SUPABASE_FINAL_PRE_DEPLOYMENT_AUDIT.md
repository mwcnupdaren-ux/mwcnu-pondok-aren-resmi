# Audit Final Pra-Deployment — Modul Konsultasi Agama MWCNU Pondok Aren

> **STATUS HISTORIS (ditambahkan GIT-5I).** Dokumen ini adalah hasil audit pada
> **18 November 2026** dengan basis kode `HEAD = 0c1a1ab`, `origin/main = fb6dbb9`.
> Seluruh temuan, angka pengujian, dan kesimpulan **BELUM SIAP DEPLOY** di bawah
> **dipertahankan apa adanya** dan tidak ditulis ulang. Ini **bukan** status
> kesiapan deployment terkini; untuk kondisi terkini rujuk laporan **GIT-5H**
> (audit baseline backend), laporan **GIT-5I** (rekonsiliasi dokumentasi), dan
> `supabase/consultation/PHASE2_BACKEND.md` versi terbaru. Angka 125/172/72 pada
> dokumen ini adalah rekap hasil yang tersedia saat audit, bukan pengujian baru.



**Tanggal audit:** 18 November 2026
**Sifat:** READ-ONLY (tidak ada file diubah, tidak ada SQL dijalankan, tidak ada akses Supabase remote, tidak ada deployment, tidak ada commit/push/pull/merge/rebase/reset)
**Ruang lingkup:** SQL001–SQL006, 10 Edge Functions, frontend pemohon & staf, konfigurasi deployment, rollback, pengujian, serta kondisi Git/working tree.
**Basis kode:** `HEAD = 0c1a1ab`, `origin/main = fb6dbb9` (branch `main` tertinggal 1 commit).

---

## 1. Ringkasan Kesiapan

### Kesimpulan: **BELUM SIAP DEPLOY**

Kode backend (SQL + Edge Functions) secara desain **konsisten dan teruji di tingkat unit/integrasi lokal**. Namun kandidat deployment **belum layak dilepas** karena empat hal yang bersifat memblokir:

1. Working tree `index.html` **menghapus seluruh UI pemohon** yang ada di `HEAD`.
2. Konfigurasi deployment (`supabase/config.toml`, `deploy-functions.ps1`) **tidak ada di Git**.
3. Dua berkas Edge Function yang akan di-deploy **belum di-commit** (`_shared/config.ts`, `verify-nia/index.ts`).
4. `CONSULTATION_SECRET_PEPPER` **belum dapat dipastikan ada** di project remote.

Tidak ada temuan **KRITIS** (tidak ada kebocoran secret, tidak ada `service_role` di frontend, tidak ada RPC yang hilang, tidak ada migrasi di luar prosedur). Seluruh penghambat bersifat **konsistensi artefak dan prosedur**, bukan kesalahan logika backend. Bila B1–B5 di §3 ditutup **tanpa mengubah logika SQL/function**, status dapat dinaikkan menjadi **SIAP DEPLOY**.

### Angka kunci

| Aspek | Kondisi |
|---|---|
| Tabel baru | 16 (semua ber-prefix `consultation_`) |
| RPC `consultation_svc_*` dipanggil function | 27 — **100% cocok** nama & parameter `p_*` |
| Edge Functions | 10 (9 `consultation-*` + `verify-nia`) |
| `verify_jwt=false` | 6 (5 pemohon + `verify-nia`) |
| `verify_jwt=true` | 4 (admin, consultant, review, publication) |
| Migrasi | 6 file, urutan 001→006 terdokumentasi |
| Rollback | SQL006 (1 transaksi) + rollback modul penuh + rollback function manual |
| Uji tersedia | 125 asersi shared, 172 asersi integrasi, 72 pemeriksaan rollback — semua exit 0 |
| Uji live/remote | **Belum pernah dilakukan** |

---

## 2. Temuan

### 2.1 KRITIS

**Tidak ada.**

Tidak ditemukan: secret/`service_role` hardcoded, RPC yang dipanggil tetapi tidak ada di SQL, tabel konsultasi terbuka untuk `anon`/`authenticated`, atau migrasi yang menghapus/mengubah objek existing.

### 2.2 TINGGI

#### T-1 — Working tree `index.html` menghapus UI pemohon konsultasi
**Bukti:**

| Item | `HEAD` | Working tree |
|---|---|---|
| `#ka-online` (formulir online) | baris 322 | **tidak ada** |
| `#ka-tiket` (cek status tiket) | baris 338 | **tidak ada** |
| `<script src="/js/konsultasi.js?v=1">` | baris 555 | **tidak ada** |
| `style.css?v=` | `66` | `62` (turun) |
| Total diff | — | 45 baris berubah, 38 di antaranya penghapusan |

**Dampak:** `js/konsultasi.js` (tracked, lengkap) menjadi **dead code**. Bila commit/deploy dilakukan dari working tree, pengguna tidak dapat mengajukan tiket maupun mengecek tiket, walaupun 10 Edge Function dan 6 migrasi berhasil dipasang. Backend aktif tanpa pintu masuk.
**Catatan:** Vercel men-deploy dari commit, sehingga `HEAD` masih utuh. Risiko muncul pada langkah commit berikutnya — dan itulah yang paling mungkin dilakukan operator.
**Status:** memblokir.

#### T-2 — Konfigurasi deployment tidak ada di Git
`supabase/config.toml` dan `deploy-functions.ps1` berstatus **untracked**. `verify_jwt` per fungsi hanya hidup di dua berkas lokal itu (dan di `PHASE2_BACKEND.md` sebagai prosa).

**Dampak:** deploy dari clone/CI lain tidak mereproduksi konfigurasi. Bila `config.toml` tidak ikut, `npx supabase functions deploy` memakai default `verify_jwt = true` → **seluruh permintaan pemohon ditolak 401**. Sebaliknya, salah menerapkan `--no-verify-jwt` pada fungsi staf menghapus lapisan pertahanan pertama.
**Status:** memblokir (reproduksibilitas).

#### T-3 — Artefak function yang di-deploy ≠ `HEAD`
Berkas modified tetapi belum di-commit:

| Berkas | Perubahan |
|---|---|
| `supabase/functions/_shared/config.ts` | +13 baris (origin localhost diperluas) |
| `supabase/functions/verify-nia/index.ts` | +11 baris (origin localhost diperluas) |

**Dampak:** "rollback = deploy ulang source dari revisi Git yang diketahui baik" (§9.1 `PHASE2_BACKEND.md`) **tidak berlaku** selama kode live berasal dari working tree yang tidak pernah di-commit. Tidak ada revisi Git yang merepresentasikan apa yang berjalan.
**Status:** memblokir.

#### T-4 — `CONSULTATION_SECRET_PEPPER` belum terverifikasi
`loadConfig` mewajibkan pepper ≥16 karakter. Bila kosong, `resolveConfig` mengembalikan **500 `misconfigured`** untuk seluruh fungsi. Tidak ada `.env` di repo (baik), dan tidak ada akses remote pada audit ini (sesuai batasan), sehingga keberadaan secret **tidak dapat dibuktikan**.
**Dampak:** kegagalan total seluruh modul, bukan kegagalan sebagian.
**Status:** memblokir (wajib diverifikasi operator sebelum deploy).

### 2.3 SEDANG

| ID | Temuan | Dampak |
|---|---|---|
| **S-1** | `tests/test-konsultasi.mjs` modified (+44 baris) belum di-commit. Hasil 172 asersi berasal dari working tree; `HEAD` masih 154 asersi. | Hasil uji tidak dapat direproduksi dari commit mana pun. |
| **S-2** | Allowlist CORS default memuat 9 origin `localhost`/`127.0.0.1` (port 8643, 5500, 5501, 3000, 8000, 5173). `CONSULTATION_ALLOWED_ORIGINS` **hanya menambah** (`new Set([...DEFAULT_ORIGINS, ...extra])`), sehingga **tidak dapat mempersempit**. Komentar "untuk produksi, sempitkan lewat `CONSULTATION_ALLOWED_ORIGINS`" menyesatkan. | Origin dev tetap diterima di produksi. Bukan kebocoran lintas-origin (browser tidak dapat memalsukan `Origin`), tetapi permukaan dev ikut aktif dan dokumentasi menyesatkan operator. |
| **S-3** | Working tree mencampur pekerjaan non-konsultasi: `js/app.js`, `js/content.js`, `admin/admin.js` (field kontak), `README_PHASE_2_2.md`, restrukturisasi hero, penurunan versi CSS. | Deploy dari working tree akan mengirim perubahan yang tidak pernah diaudit di sini. |
| **S-4** | `main` tertinggal 1 commit (`fb6dbb9`, hanya menghapus 1 aset gambar). Tidak ada commit lokal yang belum di-push. | Deploy dari keadaan divergen menyulitkan penelusuran versi; baseline rollback menjadi ambigu. |
| **S-5** | Dokumen hasil uji memuat angka lama (`PHASE2_TEST_RESULTS.md`: 121 shared / 154 integrasi; `PGlite_TEST_RESULTS.md`: 96) sedangkan suite saat ini 125 / 172. | Operator dapat menyimpulkan cakupan uji lebih kecil dari kenyataan, atau mengira ada regresi. |

### 2.4 RENDAH

| ID | Temuan |
|---|---|
| **R-1** | Rate limit per-IP memakai `X-Forwarded-For` yang dapat dipalsukan klien. Mitigasi: rate limit persisten `consultation_svc_rate_hit` (SQL005) tetap berjalan. |
| **R-2** | Fallback rate limit in-memory bersifat per-instance (tidak konsisten saat function di-scale). Sudah didokumentasikan sebagai batasan. |
| **R-3** | Lampiran tidak divalidasi lewat magic bytes; hanya `Content-Type` klien + batas 5 MB. Dampak dibatasi bucket privat + ACL `service_role`. |
| **R-4** | `.gitignore` tidak mencakup `supabase/config.toml`, `supabase/.temp/`, `deploy-functions.ps1`, serta ±70 artefak (`hero*.png`, `mob-*.png`, `dbg-*`, `diag*`, `_probe*`, `cover-*.png`, `*.cjs`). |
| **R-5** | `konsultasi.js` hanya memakai `consultation-public {action:'categories'}`; `list`/`detail` publik tidak dikonsumsi. Q&A publik di `app.js` masih data statis, sehingga publikasi yang disetujui belum tampil di situs. Bukan bug, tetapi fitur belum tuntas. |
| **R-6** | `deno check` belum pernah dijalankan (Deno tidak tersedia). Type-check hanya `node --check` (sintaks, bukan tipe). |
| **R-7** | `supabase/.temp/cli-latest` (6 byte) untracked — artefak CLI, tidak sensitif, tetapi menandakan CLI pernah dijalankan di folder ini. |

---

## 3. Temuan yang Wajib Diselesaikan Sebelum Deployment

| # | Aksi | Rujukan |
|---|---|---|
| **B1** | Pulihkan `#ka-online`, `#ka-tiket`, dan `<script src="/js/konsultasi.js?v=1">` pada `index.html`, atau tegaskan bahwa rilis ini memang tanpa UI pemohon (tidak disarankan). Samakan `style.css?v=` dengan versi CSS yang benar-benar dipakai. | T-1 |
| **B2** | Masukkan `supabase/config.toml` dan `deploy-functions.ps1` ke Git (dan tambahkan `supabase/.temp/` ke `.gitignore`). | T-2, R-4 |
| **B3** | Commit `_shared/config.ts` dan `verify-nia/index.ts` agar kode live = kode Git. | T-3 |
| **B4** | Pastikan `CONSULTATION_SECRET_PEPPER` (≥16 karakter acak) sudah diset sebagai function secret **sebelum** deploy; verifikasi tidak ada 500 `misconfigured`. | T-4 |
| **B5** | Pisahkan commit konsultasi dari perubahan non-konsultasi (`js/app.js`, `js/content.js`, `admin/admin.js`, hero, CSS). | S-3 |
| **B6** | Commit `test-konsultasi.mjs` dan selaraskan angka di `PHASE2_TEST_RESULTS.md` / `PGlite_TEST_RESULTS.md`. | S-1, S-5 |
| **B7** | Sinkronkan `main` dengan `origin/main` (oleh operator, di luar audit ini) dan tetapkan satu commit sebagai baseline deploy. | S-4 |

B1–B4 bersifat **wajib mutlak**. B5–B7 wajib untuk tata kelola rilis yang dapat diaudit ulang.

---

## 4. Temuan yang Dapat Diselesaikan Setelah Deployment

| # | Temuan | Alasan dapat ditunda |
|---|---|---|
| P-1 | S-2 allowlist localhost | Tidak menimbulkan kebocoran lintas-origin; perbaikan menyentuh kode function → butuh deploy ulang. |
| P-2 | R-1 spoofing `X-Forwarded-For` | Rate limit persisten tetap aktif; perlu perubahan kode + uji beban. |
| P-3 | R-3 magic bytes lampiran | Butuh pustaka/parsing baru; dampak dibatasi bucket privat. |
| P-4 | R-5 Q&A publik masih statis | Fitur, bukan keamanan; dapat menyusul setelah data publikasi terkumpul. |
| P-5 | R-2 rate limit multi-instance | Perlu rate limit berbasis DB penuh; sudah ada jalur persisten. |
| P-6 | R-6 `deno check` | Dapat dijalankan di CI setelah pipeline tersedia; `node --check` sudah lulus 20 berkas. |

---

## 5. Daftar Pemeriksaan yang LULUS

### 5.1 Database & SQL
1. Urutan migrasi konsisten: `001_foundation → 002_tables → 003_security → 004_services → 005_security_hardening → 006_security_hardening`, dinyatakan eksplisit di `MIGRATION_GUIDE.md` §1 beserta prasyarat antar-file.
2. Sifat idempotent (`create if not exists`, `create or replace`, `drop trigger if exists`) dan tanpa `alter`/`drop` destruktif pada tabel existing.
3. RLS 16/16 tabel konsultasi aktif dengan **nol policy** → `anon`/`authenticated` ditolak by default.
4. Hak akses eksplisit: `revoke all` dari `public/anon/authenticated`, `grant` hanya ke `service_role` (termasuk sequence nomor tiket).
5. **27 pemanggilan `db.rpc`** diverifikasi otomatis: seluruh nama fungsi ada di SQL dan seluruh parameter `p_*` cocok (tanpa kelebihan/kekurangan).
6. SQL006 mendefinisikan 16 fungsi; rollback mengembalikan 15. Selisih 1 = `consultation_publication_revision_guard`, yang memang **di-drop** (trigger + function) oleh rollback — bukan fungsi yang hilang.
7. `consultation_006_rollback.sql` berjalan dalam **satu transaksi** `begin; … commit;`, menghapus trigger, function guard, 2 index, dan 4 kolom revisi, lalu memulihkan 15 fungsi versi SQL005.
8. Tidak ada migrasi yang perlu dijalankan di luar 6 file terdokumentasi (tidak ada `ALTER` manual, tidak ada seed wajib).
9. Bucket `consultation-private` dan objek storage dibuat oleh migrasi, bukan manual.

### 5.2 Edge Functions
10. 10 fungsi terdaftar dan lengkap (9 `consultation-*` + `verify-nia`).
11. `verify_jwt` **konsisten di tiga sumber**: `config.toml`, `deploy-functions.ps1`, dan tabel §9 `PHASE2_BACKEND.md` — 6 `false`, 4 `true`.
12. Tidak ada `service_role`, JWT, atau URL project yang hardcoded di source function; akses env hanya lewat `Deno.env` / `resolveConfig`.
13. CORS tidak pernah `*`; hanya origin dalam allowlist yang mendapat `Access-Control-Allow-Origin`.
14. Header keamanan respons: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`.
15. Otorisasi staf: `Bearer` → verifikasi GoTrue `auth.getUser` → peran dari database `consultation_svc_peran`. Peran **tidak pernah** dibaca dari body.
16. Tiket: secret 160-bit Crockford Base32; hanya **hash HMAC-SHA256** yang dikirim ke database; plaintext dikembalikan sekali; tidak pernah masuk log/audit.
17. Error tidak membocorkan detail SQL/stack; pesan DB dikenal dipetakan ke pesan publik, sisanya 500 generik.
18. Body dibatasi dan divalidasi terpusat (`validation.ts`), termasuk honeypot `website` pada pembuatan tiket.
19. `deploy-functions.ps1` valid secara sintaks, men-deploy **per fungsi** (tanpa bare deploy/`--prune`), dan berhenti pada error pertama (`$ErrorActionPreference = 'Stop'` + cek `$LASTEXITCODE`).

### 5.3 Frontend
20. Tidak ada query tabel langsung: pencarian `rest/v1/consultation*` / `from('consultation…')` = **0 hasil**. Seluruh akses lewat Edge Functions.
21. `js/config.js` hanya memuat `sb_publishable_…`; tidak ada `service_role`/secret key.
22. Pemohon hanya mengirim header `apikey` (tanpa Bearer), sesuai fungsi `--no-verify-jwt`.
23. Staf mengirim `apikey` + `Authorization: Bearer <access_token>`, sesuai 4 fungsi `verify_jwt=true`.
24. Penanganan 401 (sesi kedaluwarsa → login), 403 (akses ditolak), dan 429 (`details.retry_after`) ada di kedua frontend dan **cocok dengan bentuk error `errors.ts`**.
25. Validasi klien selaras backend: ukuran maks 5 MB, MIME `image/jpeg|png|webp|application/pdf`, batas panjang judul/isi/pesan.
26. Lampiran dikirim sebagai `FormData` (`nomor`, `secret`, `file`) — sesuai kontrak `consultation-attachment`.
27. `vercel.json`: rewrite `/konsultasi` → `/`, CSP `connect-src` memuat `https://wvfcifqolohfipvepxss.supabase.co`, `/admin` noindex.
28. `konsultasi-staf.html` memuat `config.js` + `supabase.js` + `konsultasi-staf.js` dengan urutan benar.

### 5.4 Pengujian (rekap hasil yang tersedia — bukan pengujian baru)
29. `test-shared.mjs`: **125 asersi, 0 gagal, exit 0**.
30. `test-konsultasi.mjs`: **172 asersi, 0 gagal, exit 0** (PGlite).
31. Rollback SQL006: **72 pemeriksaan OK, 0 gagal, exit 0**.
32. `node --check`: **20 berkas** (11 shared + 9 entrypoint) lolos.
33. `PGlite_TEST_RESULTS.md`: 96 asersi Phase 1, termasuk idempotensi 001→003 dijalankan dua kali dan rollback penuh dua kali (tabel 16→0, fungsi 0, trigger 0, sequence 0).

---

## 6. Daftar Pemeriksaan yang BELUM Dapat Diverifikasi

| # | Yang belum diverifikasi | Sebab |
|---|---|---|
| V-1 | Keberadaan & panjang `CONSULTATION_SECRET_PEPPER` di project remote | Tidak ada akses remote (batasan audit). |
| V-2 | `deno check` / type-check sebenarnya | Deno tidak terpasang; hanya `node --check`. |
| V-3 | Uji HTTP nyata 10 fungsi (status, CORS preflight, body limit) | Tidak ada deployment. |
| V-4 | Perilaku Supabase asli: `storage.buckets`, `auth.jwt()`, RLS dengan `service_role` | PGlite men-stub `auth.jwt()` dan membuat peran `service_role/anon/authenticated` manual. |
| V-5 | Rate limit persisten di bawah beban konkuren | Perlu instance nyata. |
| V-6 | Redirect URL OAuth Google di dashboard vs `config.toml` lokal | `config.toml` tidak tercermin otomatis ke project remote. |
| V-7 | Bucket `consultation-private` benar-benar terbentuk setelah SQL002/004 | Butuh eksekusi di Supabase. |
| V-8 | Vercel build & deploy aktual (termasuk CSP pada respons nyata) | Tidak ada deployment. |
| V-9 | Rollback SQL006 **setelah ada data produksi** (FK, riwayat review, publikasi) | Hanya diuji pada dataset PGlite. |
| V-10 | Keselarasan `HEAD` dengan `origin/main` setelah sinkronisasi | Pull dilarang pada audit ini. |

---

## 7. Status Keamanan

| Area | Status | Catatan |
|---|---|---|
| Secret di frontend | **Aman** | Hanya `sb_publishable_…`; `service_role` tidak ada di `js/`, `admin/`, HTML, maupun script deploy. |
| Secret di repo | **Aman** | Tidak ada `.env`, `*.pem`, `*.key`; tidak ada pola `eyJhbGci`/`sbp_` di source. |
| RLS | **Aman** | 16/16 tabel aktif, nol policy, akses hanya `service_role`. |
| Otorisasi staf | **Aman** | Verifikasi GoTrue + peran dari DB; bukan dari body/klaim klien. |
| Kredensial tiket | **Aman** | 160-bit, hash HMAC + pepper, plaintext sekali tampil, tidak di log. |
| CORS | **Cukup** | Tanpa `*`; tetapi origin localhost ikut allowlist dan tidak dapat dipersempit lewat env (S-2). |
| Rate limit | **Cukup** | Persisten (SQL) + in-memory (fallback); `X-Forwarded-For` dapat dipalsukan (R-1). |
| Unggahan berkas | **Cukup** | Batas 5 MB + MIME allowlist + bucket privat; tanpa magic bytes (R-3). |
| Kebocoran error | **Aman** | Pemetaan pesan; 500 generik. |
| Header keamanan | **Aman** | `nosniff`, `no-referrer`, `no-store`. |
| Secret deployment | **Belum terbukti** | `CONSULTATION_SECRET_PEPPER` (V-1/B4). |

**Kesimpulan keamanan:** tidak ada temuan kritis. Dua celah *hardening* (CORS dev origin, spoofing IP) bersifat sedang/rendah dan tidak menghalangi rilis pertama, tetapi harus masuk backlog.

---

## 8. Status Database

| Aspek | Status |
|---|---|
| Berkas migrasi | 6/6 ada, berurutan, idempotent |
| Ketergantungan | Rantai 001→006 dinyatakan eksplisit; SQL005 butuh 001–004; SQL006 butuh 001–005 |
| Objek baru | 16 tabel, 13 trigger (SQL002) + trigger guard (SQL006), 17 fungsi (SQL002) + fungsi layanan, 1 sequence, 1 bucket privat |
| Hak akses | `revoke all` dari `anon`/`authenticated`; `grant` hanya `service_role` |
| Rollback | SQL006 (parsial, 1 transaksi) + `consultation_rollback.sql` (penuh) |
| Kesiapan eksekusi | **Siap dijalankan**, belum pernah dijalankan di Supabase produksi |
| Verifikasi pasca-migrasi | Prosedur tersedia: `MIGRATION_GUIDE.md` §2 (001–004), §2c (005), §2d (006) |
| Risiko utama | Eksekusi tidak berurutan / lupa satu file → error FK atau fungsi hilang; mitigasi: satu file per langkah + verifikasi §2 |

---

## 9. Status Edge Functions

| Fungsi | `verify_jwt` | Auth internal | Status |
|---|---|---|---|
| `consultation-public` | false | — (kategori publik) | Siap |
| `consultation-ticket-create` | false | honeypot + validasi + rate limit | Siap |
| `consultation-ticket-access` | false | nomor + secret per permintaan | Siap |
| `consultation-ticket-message` | false | nomor + secret | Siap |
| `consultation-attachment` | false | jalur pemohon (secret) & staf (Bearer→GoTrue) | Siap |
| `verify-nia` | false | — (publik, `/v/<nia>`) | Siap |
| `consultation-admin` | true | `authenticateStaff` + role `admin_konsultasi` | Siap |
| `consultation-consultant` | true | role konsultan | Siap |
| `consultation-review` | true | role reviewer | Siap |
| `consultation-publication` | true | role reviewer/admin | Siap |

**Konsistensi tiga sumber konfigurasi:** `config.toml` = `deploy-functions.ps1` = §9 `PHASE2_BACKEND.md` → **cocok 10/10**.
**Kontrak RPC:** 27/27 panggilan cocok dengan SQL004/005/006.
**Catatan:** kode yang akan di-deploy masih berbeda dari `HEAD` (T-3), dan konfigurasi `verify_jwt` belum ada di Git (T-2).

---

## 10. Status Frontend

| Komponen | Status | Catatan |
|---|---|---|
| `js/konsultasi.js` (pemohon) | Kode siap, **tidak terpasang** | Tracked; tidak direferensikan `index.html` working tree (T-1). |
| `index.html` — UI pemohon | **Rusak di working tree** | `#ka-online`, `#ka-tiket`, script hilang; `HEAD` masih utuh. |
| `js/konsultasi-staf.js` + `konsultasi-staf.html` | Siap | Tracked, tidak modified; OAuth Google + Bearer + penanganan 401/403/429. |
| `admin/admin.js` | Modified (non-konsultasi) | Perubahan field kontak; tidak terkait modul. |
| Endpoint | Konsisten | Semua lewat `functions/v1/consultation-*`; tidak ada URL backend lain. |
| Token | Konsisten | Pemohon `apikey` saja; staf `apikey` + Bearer. |
| Rate limit & error | Konsisten | 429 membaca `details.retry_after`. |
| Lampiran | Konsisten | `FormData` + batas 5 MB + MIME allowlist. |
| Konfigurasi backend | Konsisten | `js/config.js` → project `wvfcifqolohfipvepxss`; CSP `vercel.json` memuat domain yang sama. |

---

## 11. Status Script Deployment

| Item | Status |
|---|---|
| `deploy-functions.ps1` | Ada, valid, idempoten, deploy per fungsi; **untracked** (T-2) |
| `supabase/config.toml` | Ada, `verify_jwt` lengkap; **untracked** (T-2) |
| `MIGRATION_GUIDE.md` | Lengkap: urutan, verifikasi, rollback |
| `PHASE2_BACKEND.md` | Lengkap: §9 verify_jwt + secrets, §9.1 rollback function |
| Urutan disarankan | SQL001→006 → deploy fungsi → smoke test → frontend |
| Fungsi `--no-verify-jwt` | 6 (5 konsultasi pemohon + `verify-nia`) |
| Fungsi gateway JWT | 4 (admin, consultant, review, publication) |
| Secret wajib | `CONSULTATION_SECRET_PEPPER` (≥16 karakter) |
| Secret opsional | `CONSULTATION_ALLOWED_ORIGINS` (hanya menambah, lihat S-2) |
| Risiko deployment parsial | **Tinggi**: SQL terpasang tanpa function → data tak terjangkau; function terpasang tanpa SQL → 500 pada semua RPC; function staf ter-deploy `--no-verify-jwt` → lapisan auth pertama hilang |
| Verifikasi pasca-deploy | Tersedia (CORS preflight, kategori, buat/akses tiket, staf list) |

---

## 12. Status Rollback

| Lapisan | Mekanisme | Status |
|---|---|---|
| SQL006 | `consultation_006_rollback.sql` — satu transaksi, drop guard/trigger/2 index/4 kolom, pulihkan 15 fungsi | Siap; teruji 72 OK/0 gagal |
| Modul penuh | `consultation_rollback.sql` (drop seluruh objek konsultasi) | Tersedia di `MIGRATION_GUIDE.md` §3b |
| Edge Functions | **Manual**: deploy ulang source dari revisi Git yang diketahui baik (§9.1) | Prosedur benar & terdokumentasi, tetapi **belum dapat dijalankan** sampai T-3 ditutup |
| Frontend | Rollback commit Vercel | Bergantung pada commit yang bersih (T-1, S-3) |

**Pemisahan SQL vs function: sudah benar.** Rollback SQL tidak menyentuh function; rollback function tidak menyentuh database. Namun keduanya **saling bergantung secara kontrak**:

- Rollback SQL006 → skema kembali ke SQL005, sedangkan function versi 006 memanggil kolom/parameter revisi (`p_content_revision`, guard) → **error**. Karena itu urutan wajib: **deploy function versi 005 dulu, baru rollback SQL006**.
- Rollback function tanpa rollback SQL aman (skema superset), tetapi fitur revisi publikasi nonaktif.

**Risiko setelah deployment nyata (belum diuji):** rollback SQL006 pada data produksi akan menghapus kolom revisi yang mungkin sudah terisi; publikasi yang sedang berjalan kehilangan jejak persetujuan. Perlu backup sebelum rollback (V-9).

---

## 13. Status Git dan Working Tree

| Item | Kondisi |
|---|---|
| Branch | `main` |
| Sinkronisasi | `## main...origin/main [behind 1]` — tidak ada commit lokal belum di-push |
| `HEAD` | `0c1a1ab` |
| `origin/main` | `fb6dbb9` (hanya menghapus 1 aset gambar) |
| Tag | tidak ada |
| Modified (10) | `README_PHASE_2_2.md`, `admin/admin.js`, `index.html`, `js/app.js`, `js/content.js`, `PHASE2_BACKEND.md`, `tests/package.json`, `tests/test-konsultasi.mjs`, `_shared/config.ts`, `verify-nia/index.ts` |
| Untracked penting | `SUPABASE_DEPLOYMENT_AUDIT.md`, `deploy-functions.ps1`, `supabase/config.toml`, `supabase/.temp/` |
| Untracked artefak | ±70 berkas QA/hero (`hero*.png`, `mob-*.png`, `dbg-*`, `diag*`, `_probe*`, `cover-*.png`, `*.cjs`, `_css_old.css`, `_idx_old.html`, `media-out.txt`) |
| Berkas sensitif | Tidak ditemukan (tidak ada `.env`, kunci, atau token) |
| Risiko commit | Tinggi: `git add -A` akan menyertakan artefak QA, konfigurasi deployment, **dan** penghapusan UI pemohon |

**Pemisahan yang disarankan (belum dilakukan):**

1. Commit konsultasi-backend: `_shared/config.ts`, `verify-nia/index.ts`, `PHASE2_BACKEND.md`, `tests/*`.
2. Commit deployment: `supabase/config.toml`, `deploy-functions.ps1`, `.gitignore`.
3. Commit frontend konsultasi: hanya blok `#ka-online`, `#ka-tiket`, dan tag `konsultasi.js` pada `index.html`.
4. Commit terpisah untuk pekerjaan non-konsultasi (`js/app.js`, `js/content.js`, `admin/admin.js`, hero, CSS).
5. Artefak QA: biarkan untracked / tambahkan pola ke `.gitignore` — **jangan dihapus** (batasan audit).

---

## 14. Rekomendasi Urutan Deployment yang Aman

> Semua langkah di bawah dijalankan **oleh operator**, bukan oleh agen. Audit ini berhenti sebelum langkah 1.

**Fase A — Penutupan blocker (wajib, tanpa menyentuh logika backend)**

1. Putuskan **satu commit baseline**; jangan deploy dari working tree campuran.
2. Kerjakan B1 (pulihkan UI pemohon), B2 (track konfigurasi deployment), B3 (commit dua function), B5–B7 (pisahkan commit, selaraskan dokumen uji, sinkronkan `main`).
3. Jalankan ulang `npm run test:shared` dan `npm test` dari commit baseline → pastikan tetap 125/0 dan 172/0.
4. Verifikasi B4: set `CONSULTATION_SECRET_PEPPER` (≥16 karakter, acak, hanya server) dan pastikan tidak ada fungsi yang membalas 500 `misconfigured`.

**Fase B — Database**

5. Catat baseline deploy: commit, waktu, daftar fungsi, `verify_jwt` per fungsi, nama secret yang berubah (nilai tidak dicatat).
6. Backup/snapshot database.
7. Jalankan `consultation_001_foundation.sql` → verifikasi §2.
8. `002_tables.sql` → verifikasi §2 (16 tabel, RLS, bucket, sequence).
9. `003_security.sql` → verifikasi §2 (RLS 16/16 tanpa policy, grant hanya `service_role`).
10. `004_services.sql` → verifikasi §2 (RPC + bucket `consultation-private`).
11. `005_security_hardening.sql` → verifikasi §2c.
12. `006_security_hardening.sql` → verifikasi §2d.
13. **Berhenti dan periksa** sebelum lanjut: bila satu verifikasi gagal, jangan deploy function.

**Fase C — Edge Functions**

14. Deploy 6 fungsi anonim **satu per satu** dengan `--no-verify-jwt`: `consultation-public`, `-ticket-create`, `-ticket-access`, `-ticket-message`, `-attachment`, `verify-nia`.
15. Deploy 4 fungsi staf **tanpa** flag: `consultation-admin`, `-consultant`, `-review`, `-publication`.
16. Smoke test berurutan:
    - `OPTIONS` preflight → 204 + `Access-Control-Allow-Origin` yang benar.
    - `consultation-public {action:'categories'}` → 200 + daftar kategori.
    - Buat tiket → nomor + secret tampil sekali.
    - Akses tiket dengan nomor+secret → 200; dengan secret salah → 401/403.
    - Kirim pesan lanjutan → 200.
    - Unggah lampiran 1 berkas valid + 1 berkas >5 MB (harus ditolak).
    - `consultation-admin {action:'list'}` tanpa Bearer → **401**; dengan Bearer non-staf → **403**.
17. Bila salah satu gagal: rollback function ke source commit sebelumnya (§9.1), **jangan** menyentuh SQL lebih dulu.

**Fase D — Frontend**

18. Deploy commit yang sudah bersih (bukan working tree).
19. Verifikasi `/konsultasi`: formulir online, cek tiket, unggah lampiran, tampilan secret sekali.
20. Verifikasi `/konsultasi-staf.html` (login Google, daftar tiket) dan `/admin` (noindex).
21. Cek console browser: tidak ada error CSP/`connect-src`.

**Fase E — Observasi & rollback**

22. Pantau log 24 jam: 500 `misconfigured`, 429 berlebih, error RPC.
23. Urutan rollback bila gagal: **frontend → functions → SQL**. Rollback SQL006 hanya setelah function versi 005 ter-deploy, dan **jangan** mengganti `CONSULTATION_SECRET_PEPPER` saat rollback (tiket lama menjadi tidak valid).

---

## Lampiran A — Bukti Perintah yang Dijalankan (read-only)

| Pemeriksaan | Metode |
|---|---|
| Status & sinkronisasi Git | `git status -sb`, `git log`, `git rev-list --left-right --count` |
| Diff frontend | `git diff -- index.html`, `git show HEAD:index.html` |
| Konsistensi RPC ↔ SQL | Ekstraksi regex `db.rpc('…', { p_* })` vs `create or replace function` pada SQL004/005/006 → 27/27 OK |
| Konsistensi `verify_jwt` | Perbandingan `config.toml` ↔ `deploy-functions.ps1` ↔ §9 `PHASE2_BACKEND.md` |
| Cakupan rollback | Perbandingan 16 fungsi SQL006 vs 15 fungsi rollback + daftar `drop`/`alter` |
| Pemindaian secret | Pola `service_role`, `eyJhbGci`, `sbp_`, `sb_secret`, `*.pem`, `*.key`, `.env` |
| Akses tabel langsung | Pola `rest/v1/consultation`, `from('consultation…')` → 0 hasil |
| Sintaks PowerShell | Parser PowerShell terhadap `deploy-functions.ps1` |

## Lampiran B — Berkas yang Menjadi Bukti Utama

- `supabase/consultation/consultation_001_foundation.sql` … `006_security_hardening.sql`
- `supabase/consultation/consultation_006_rollback.sql`
- `supabase/consultation/MIGRATION_GUIDE.md` (§1, §2/2c/2d, §3a/3b)
- `supabase/consultation/PHASE2_BACKEND.md` (§4 kontrak API, §5 auth, §9 secrets/verify_jwt, §9.1 rollback)
- `supabase/config.toml`, `deploy-functions.ps1`
- `supabase/functions/_shared/{config,auth,db,http,errors,secret,bootstrap}.ts`
- `js/konsultasi.js`, `js/konsultasi-staf.js`, `konsultasi-staf.html`, `js/config.js`, `vercel.json`
- `supabase/consultation/tests/{test-shared,test-konsultasi}.mjs`
- `PHASE2_TEST_RESULTS.md`, `PGlite_TEST_RESULTS.md`

---

**Akhir laporan. Tidak ada perbaikan yang dilakukan. Menunggu persetujuan.**
