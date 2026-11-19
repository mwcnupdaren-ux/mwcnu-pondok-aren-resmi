# GIT REVIEW DEPLOYMENT — Pemilahan File Sebelum Commit

> **STATUS HISTORIS (ditambahkan GIT-5I).** Dokumen ini mencatat pemeriksaan
> pada **17 November 2026** dengan `HEAD = 9237893`. Riwayat pemeriksaan lama
> **tidak diubah**. Status file, status `deno.lock`, dan jumlah modified/untracked
> di bawah **harus merujuk ke kondisi Git terbaru** (`git status`) sebelum
> dipakai untuk keputusan apa pun — sebagian status tersebut sudah berubah.
> Dokumen ini **bukan** status kesiapan deployment terkini. Rujuk laporan
> **GIT-5H** (audit baseline backend), laporan **GIT-5I** (rekonsiliasi
> dokumentasi), dan `supabase/consultation/PHASE2_BACKEND.md` versi terbaru.



**Tanggal**: 2026-11-17 · **Branch**: `main` · **HEAD**: `9237893` (chore: finalize consultation deployment preparation)
**Status laporan**: selesai — menunggu persetujuan sebelum perubahan Git apa pun.
**Larangan dihormati**: tidak ada `git add/commit/push/restore/reset`, tidak ada file yang diubah/dihapus/dipindahkan, tidak ada deployment/migrasi.

---

## 1. Ringkasan Kondisi Git

- Commit `9237893` sudah memuat SQL005, SQL006, rollback SQL006, `MIGRATION_GUIDE.md`, `PHASE2_BACKEND.md`, `PHASE_5_REPORT.md` ✓ — rantai migrasi dokumentasi lengkap di repo.
- Belum di-push ke remote.
- Sisa perubahan: **12 file tracked modified** (704 insertions, 39 deletions) + **30 file untracked**.
- Tidak ditemukan secret/kunci dalam perubahan; semua diff aman ditinjau.
- Perubahan tracked yang **tidak terkait konsultasi** (namun produk situs, semua wajar): `admin/admin.js` (field CMS hero "Cover potret"), bagian `css/style.css` perbaikan mobile Banom & panel Program Khidmat, bump `style.css?v=66` di `index.html`, penambahan dependensi `puppeteer` di `package.json`.

## 2. Daftar File per Kategori

### A. File produk frontend (diperlukan untuk deployment situs)

| File | Status Git | Fungsi | Diperlukan deploy? | Rekomendasi |
|---|---|---|---|---|
| `index.html` | M (modified) | Integrasi Fase 3: form konsultasi online `kx-`, panel "Cek status tiket", `<script src="/js/konsultasi.js?v=1">`; juga bump `style.css?v=66` + whitespace hero | **Ya** (tanpa ini form kx- tidak tampil) | **Commit** |
| `css/style.css` | M | Style `kx-*` (Fase 3) + perbaikan mobile Banom + perbaikan panel Program Khidmat | **Ya** (UI kx- rusak tanpa ini) | **Commit** (satu commit bersama `index.html` — diff tidak dapat dipisah bersih antara kx- dan perbaikan lain) |
| `js/konsultasi.js` | ?? (untracked) | Frontend pemohon Fase 3: form online, cek tiket, percakapan, lampiran, persetujuan publikasi | **Ya** — `index.html` merujuk `/js/konsultasi.js?v=1`; 404 jika tidak ter-deploy | **Commit (wajib)** |
| `konsultasi-staf.html` | ?? | Halaman kerja staf/konsultan/reviewer/admin Fase 4 | **Ya** untuk fitur staf | **Commit** |
| `js/konsultasi-staf.js` | ?? | Logika halaman staf Fase 4 (login Google OAuth, `apikey` + Bearer) | **Ya** — dirujuk `konsultasi-staf.html` | **Commit (wajib)** |
| `admin/admin.js` | M | Field CMS "Cover potret" hero (bukan konsultasi; fitur hero lanjutan) | Ya untuk situs umum, bukan untuk fitur konsultasi | **Commit** bersama perbaikan situs |

### B. File produk backend (diperlukan untuk deploy Edge Functions)

| File | Status Git | Fungsi | Diperlukan deploy? | Rekomendasi |
|---|---|---|---|---|
| `supabase/functions/_shared/http.ts` | M | `readTextLimited` + `limitedRequest`: batas body streaming (anti-alokasi payload besar); `readJson` kini streaming | **Ya** — `consultation-attachment` memanggil `limitedRequest` | **Commit (wajib)** — deploy tanpa ini = runtime error |
| `supabase/functions/consultation-attachment/index.ts` | M | Multipart unggah dibatasi stream sebelum `formData()` (5 MB + overhead) | **Ya** | **Commit (wajib)** |
| `supabase/functions/_shared/guard.ts` | M | Rate-limit **fail-closed**: RPC persisten wajib; gagal → 503, bukan fallback memori; pepper hilang → 503 | **Ya** — mengubah perilaku semua function konsultasi | **Commit (wajib)** |
| `supabase/functions/_shared/db.ts` | M | Perbaikan tipe Blob (`Uint8Array` → `ArrayBuffer` view) untuk unggah Storage pada Deno/TS baru | **Ya** (kompatibilitas runtime unggah lampiran) | **Commit (wajib)** |
| `supabase/functions/verify-nia/index.ts` | M | `readJsonLimited` (8 KB, 413 `payload_too_large`); komentar rate-limit diperjelas (per-instance, bukan global) | **Ya** (function produksi verifikasi NIA) | **Commit (wajib)** |
| `deno.lock` | ?? | Lock file Deno (memuat `@supabase/functions-js`, `openai`, `patchright`, `playwright-core`) — integritas dependensi saat deploy/type-check functions | Opsional tapi disarankan untuk deploy reprodusibel | **Commit** bersama backend |

### C. File pengujian yang diperlukan

| File | Status Git | Fungsi | Diperlukan deploy? | Rekomendasi |
|---|---|---|---|---|
| `supabase/consultation/tests/test-konsultasi.mjs` | M | Uji PGlite kini mengeksekusi 001→006 + re-run idempotensi; asersi baru T30l/n/o (jawaban terbaru, satu review, bypass reviewer, jawaban final, lampiran internal) | Tidak (tapi bukti validasi SQL005–006) | **Commit** |
| `supabase/consultation/tests/test-shared.mjs` | M | Helper uji untuk SQL005–006 | Tidak | **Commit** |
| `package.json` | M | Menambah `puppeteer` (dipakai skrip diagnostik kategori E, bukan oleh uji PGlite yang punya `tests/package.json` sendiri) | Tidak | **Commit** (jaga konsistensi `package-lock.json`; tidak menghalangi deployment) |
| `package-lock.json` | M | Lock dependensi (puppeteer) | Tidak | **Commit** (selalu bersama `package.json`) |

### D. Dokumentasi dan laporan

| File | Status Git | Fungsi | Rekomendasi |
|---|---|---|---|
| `PHASE_FINAL_AUDIT_REPORT.md` | ?? | Audit final backend Fase 1–2 (basis keputusan SIAP DEPLOYMENT) | **Commit** |
| `PHASE_2_1_SECURITY_AUDIT.md` | ?? | Audit keamanan SQL005 | **Commit** |
| `PHASE_3_REPORT.md` | ?? | Laporan frontend pemohon (QA 31/31) | **Commit** |
| `PHASE_4_REPORT.md` | ?? | Laporan frontend staf (QA 56/56, kendala H-1–H-4) | **Commit** |
| `README_AUDIT_FIX.md` | ?? | Ringkasan perbaikan hasil audit | **Commit** |
| `README_PHASE_2_2.md` | ?? | Ringkasan Phase 2.2 (SQL005/006) | **Commit** |
| `GIT_REVIEW_DEPLOYMENT.md` | ?? (file laporan ini) | Pemilahan commit pra-deploy | **Commit** |

### E. File sementara, screenshot, diagnostik, artefak pengujian

| File | Status Git | Fungsi | Diperlukan deploy? | Rekomendasi |
|---|---|---|---|---|
| `browser.mjs`, `diag.js`, `shot.js`, `shot2.js`, `hero-measure.mjs` | ?? | Skrip diagnostik/screenshot Puppeteer (local QA) | Tidak | Tidak diperlukan — simpan dahulu (lokal/arsip), jangan di-commit |
| `imgdim.ps1` | ?? | Cek dimensi `og-cover.png` (sementara) | Tidak | Tidak diperlukan — simpan dahulu |
| `hero.png`, `hero2.png`, `hero-check.png`, `hero-check2.png`, `hero-check3.png`, `hero-cols.png`, `hero-desktop.png`, `hero-final.png`, `hero-fixed.png`, `hero-mockup.png`, `hero-now.png`, `hero-qa.png`, `hero-qa-mobile.png` | ?? | Screenshot QA hero (13 file PNG) | Tidak | Tidak diperlukan — simpan dahulu / hapus nanti atas keputusan user |

## 3. File yang WAJIB Masuk Commit (deployment-blocking)

1. `js/konsultasi.js`, `js/konsultasi-staf.js`, `konsultasi-staf.html` — tanpa ini fitur konsultasi 404/rusak di produksi.
2. `index.html`, `css/style.css` — markup + style kx- dan script tag.
3. `supabase/functions/_shared/http.ts`, `_shared/guard.ts`, `_shared/db.ts`, `consultation-attachment/index.ts`, `verify-nia/index.ts` — deploy Edge Functions menyalin `_shared` bersama setiap function; versi lama `guard.ts` (fail-open) atau `http.ts` tanpa `limitedRequest` akan membuat `consultation-attachment` gagal runtime.
4. `deno.lock` (disarankan kuat, bersama backend).

## 4. File yang Sebaiknya Disimpan Dahulu (bukan penghalang deployment)

- Semua kategori D (dokumen/laporan) — penting untuk jejak audit, tetapi tidak memengaruhi runtime; commit setelah/sebelum deploy sama saja (disarankan commit agar tidak hilang).
- `package.json` + `package-lock.json` — hanya untuk skrip diagnostik; commit untuk konsistensi lock, tetapi tidak memengaruhi deployment.
- Seluruh kategori E — artefak lokal; tidak boleh ikut commit produk.

## 5. Daftar File Sementara

17 file: `browser.mjs`, `diag.js`, `shot.js`, `shot2.js`, `hero-measure.mjs`, `imgdim.ps1`, dan 12 PNG (`hero.png`, `hero2.png`, `hero-check.png`, `hero-check2.png`, `hero-check3.png`, `hero-cols.png`, `hero-desktop.png`, `hero-final.png`, `hero-fixed.png`, `hero-mockup.png`, `hero-now.png`, `hero-qa.png`, `hero-qa-mobile.png`). Semua untracked; **tidak diubah/dihapus** sesuai larangan — pemutusan/arsip menunggu persetujuan.

## 6. Risiko Jika File Produk Tertinggal

| File tertinggal | Dampak |
|---|---|
| `js/konsultasi.js` | `index.html` memuat `<script src="/js/konsultasi.js?v=1">` → 404; form konsultasi online & cek tiket mati (fallback WhatsApp tetap jalan) |
| `js/konsultasi-staf.js` / `konsultasi-staf.html` | Halaman kerja staf tidak tersedia; alur jawab–review–publikasi tidak dapat dijalankan |
| `css/style.css` versi lama | UI kx- tampil tanpa style (tata letak rusak); bump `?v=66` menunjuk file yang tidak ada isinya |
| `_shared/http.ts` / `consultation-attachment/index.ts` lama | Unggah lampiran memuat payload penuh ke memori sebelum cek batas (regresi hardening); `limitedRequest` undefined → 500 pada setiap unggah multipart |
| `_shared/guard.ts` lama | Rate-limit fallback memori (fail-open per instance) — perilaku lama yang sengaja dihapus; dua instans bisa lolos limit bersamaan |
| `_shared/db.ts` lama | Unggah Storage bisa gagal pada Deno/TS terbaru (tipe BlobPart) |
| `verify-nia/index.ts` lama | Endpoint NIA membaca body tanpa batas (regresi hardening 413) |
| `deno.lock` tidak di-commit | Deploy dependensi tidak reprodusibel antar mesin |

## 7. Rekomendasi Urutan Commit Berikutnya (setelah persetujuan)

Urutan disarankan (satu logika per commit, mudah di-revert):

1. **Commit 1 — Backend Edge Functions**: `supabase/functions/_shared/{http,guard,db}.ts`, `supabase/functions/consultation-attachment/index.ts`, `supabase/functions/verify-nia/index.ts`, `deno.lock`.
2. **Commit 2 — Frontend konsultasi + perbaikan situs**: `js/konsultasi.js`, `js/konsultasi-staf.js`, `konsultasi-staf.html`, `index.html`, `css/style.css`, `admin/admin.js` (diff `index.html`/`style.css` mencampur kx- dan perbaikan Banom/Program/hero — tidak dapat dipisah bersih tanpa mengedit file; disarankan satu commit).
3. **Commit 3 — Pengujian**: `supabase/consultation/tests/test-konsultasi.mjs`, `test-shared.mjs`, `package.json`, `package-lock.json`.
4. **Commit 4 — Dokumentasi**: `PHASE_FINAL_AUDIT_REPORT.md`, `PHASE_2_1_SECURITY_AUDIT.md`, `PHASE_3_REPORT.md`, `PHASE_4_REPORT.md`, `README_AUDIT_FIX.md`, `README_PHASE_2_2.md`, `GIT_REVIEW_DEPLOYMENT.md`.
5. **Kategori E**: tidak di-commit. Setelah persetujuan, opsi: pindahkan ke folder arsip di luar repo atau tambahkan ke `.gitignore`; dilarang dijalankan sekarang.
6. **Push** ke remote setelah kelima langkah di atas diverifikasi `git status` bersih dari kategori A–D.

Urutan deployment pasca-commit tetap sesuai `PHASE_5_REPORT.md` §6: migrasi SQL001–006 → verifikasi → secrets → deploy Edge Functions (`--no-verify-jwt` untuk attachment/public/ticket-*) → smoke test → deploy Vercel.

---
*Berhenti di sini — menunggu persetujuan sebelum melakukan perubahan Git apa pun.*
