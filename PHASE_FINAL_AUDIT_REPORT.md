# PHASE FINAL AUDIT REPORT — Sistem Konsultasi Agama MWCNU Pondok Aren

Tanggal audit: 16 November 2026 · Mode: **READ-ONLY penuh** (tidak ada file source yang diubah, tidak ada migrasi/rollback/deploy/commit/push; satu-satunya file yang dibuat adalah laporan ini).
Audiensi: keputusan kesiapan produksi fitur Konsultasi Agama (Phase 1 + Phase 2).

---

## 1. Ringkasan hasil audit

| Lapisan | Hasil |
|---|---|
| **Database (SQL001–SQL006)** | Sehat. Semua temuan lama C-1, C-2, H-1, H-2, M-5, M-7 terbukti diperbaiki di source; rollback 006 terbukti paritas penuh lewat PGlite (47/47). |
| **Edge Functions + `_shared`** | Sehat. M-1 s.d. M-5 terbukti diperbaiki; kontrak RPC TS↔SQL konsisten; tanpa temuan CRITICAL/HIGH baru. Sisa MEDIUM/LOW tidak menghalangi. |
| **Frontend & integrasi** | **CRITICAL: fitur konsultasi belum memiliki frontend sama sekali.** Alur pemohon/tiket/lampiran, dashboard konsultan, reviewer, dan admin publikasi konsultasi tidak ada — 9 Edge Functions + 16 tabel + hardening SQL005/006 berdiri tanpa konsumen. |
| **Dokumentasi & operasional** | **HIGH: jalur migrasi kanonik (`MIGRATION_GUIDE.md`) masih 001→004** — perbaikan C-1/C-2/H-1/H-2 tidak berada di jalur deployment yang didokumentasikan; SQL005/006/rollback masih untracked; rollback 006 tidak dirujuk dokumen mana pun. |

**Keputusan: BELUM SIAP PRODUKSI.** Penghalangnya bukan kode backend maupun keamanan database — keduanya terbukti baik — melainkan (1) ketiadaan frontend konsultasi dan (2) jalur migrasi terdokumentasi yang belum memuat SQL005/SQL006. Keduanya tercantum sebagai pekerjaan wajib di §7; sisanya adalah catatan MEDIUM/LOW/INFO yang tidak menggagalkan produksi.

---

## 2. Daftar file dan komponen yang diperiksa

**Database** (`supabase/consultation/`): `consultation_001_foundation.sql`, `consultation_002_tables.sql`, `consultation_003_security.sql`, `consultation_004_services.sql`, `consultation_005_security_hardening.sql`, `consultation_006_security_hardening.sql`, `consultation_006_rollback.sql`, `consultation_rollback.sql` (modul penuh).

**Backend** (`supabase/functions/`): 10 Edge Function — `consultation-admin`, `consultation-attachment`, `consultation-consultant`, `consultation-public`, `consultation-publication`, `consultation-review`, `consultation-ticket-access`, `consultation-ticket-create`, `consultation-ticket-message`, `verify-nia` — dan 12 modul `_shared`: `audit.ts`, `auth.ts`, `bootstrap.ts`, `config.ts`, `db.ts`, `errors.ts`, `guard.ts`, `http.ts`, `ratelimit.ts`, `secret.ts`, `types.ts`, `validation.ts`.

**Frontend & integrasi**: `index.html`, `js/app.js`, `js/content.js`, `js/direktori.js`, `js/config.js`, `admin/index.html`, `admin/admin.js`, `admin/direktori.js`, `verifikasi.html`, `vercel.json`, `robots.txt`, `sitemap.xml`, `css/` (sekilas).

**Dokumentasi & operasional**: `MIGRATION_GUIDE.md`, `PHASE2_BACKEND.md`, `README_PHASE_2_2.md`, `README_AUDIT_FIX.md`, `README.md`, `PHASE_2_1_SECURITY_AUDIT.md`, `SECURITY_FINDINGS.md`, `CONSULTATION_INTEGRATION_PLAN.md`, `CURRENT_ARCHITECTURE.md`, `CONSULTATION_ERD.md`, `DATABASE_DICTIONARY.md`, `DECISIONS_C1_C7.md`, `PGlite_TEST_RESULTS.md`, `PHASE2_TEST_RESULTS.md`, `PHASE1_REVIEW_PACKAGE.md`, `supabase-profiles.sql` (patch NIA).

---

## 3. Bukti pengujian yang sudah tersedia

Tidak diulang tanpa alasan teknis; yang dilakukan hanya **verifikasi kesamaan versi** dan satu regesi cepat:

1. **Deno check seluruh Edge Functions + `_shared` — LULUS** (bukti sebelumnya; `deno.lock` kini ter-commit).
2. **SQL006 + rollback diuji PGlite 0.5.16 (Postgres 18 WASM, in-memory)** — siklus apply → validasi → rollback → re-apply dengan dataset draft/terbit/tercabut/konten-diedit:
   - Harness `run006c.mjs` membaca SQL006 **langsung dari working tree repo**; dijalankan ulang saat audit ini dengan hasil **47/47 LULUS** — membuktikan versi yang diaudit = versi yang diuji.
   - Cakupan terbukti: apply sukses meski ada publikasi tercabut; persetujuan pra-pencabutan direset sementara yang sah dipertahankan; persetujuan atas konten berubah (RPC maupun UPDATE mentah) tidak disahkan dan baris terbit ikut di-unpublish; pengajuan ulang wajib persetujuan baru; stempel lama (`at < dicabut_at`) ditolak trigger SQL002; rollback mengembalikan kondisi SQL005 (53 fungsi identik body+ACL+atribut, inventaris objek identik, data utuh); re-apply berhasil tanpa over-reset; ACL (`service_role` EXECUTE penuh, tanpa bocor anon/authenticated) dan perbaikan SQL005 tetap utuh.
3. **Sidik jari file saat audit** (SHA-256, working tree): `consultation_006_security_hardening.sql` = `0D1B6CA0…52F162B`, `consultation_006_rollback.sql` = `5D770349…D03532B`, `consultation_005_security_hardening.sql` = `5606CBEC…2FAEF`.
4. **Status git saat audit**: HEAD `9bec326`; `consultation_005_security_hardening.sql`, `consultation_006_security_hardening.sql`, `consultation_006_rollback.sql` masih **untracked** (lihat temuan D-1).
5. Hasil pengecekan `supabase/consultation/tests/test-konsultasi.mjs` + `test-shared.mjs` (suite utama, sebelumnya lulus) — file `M` di working tree, belum di-commit, tetapi bersifat pengujian (tidak mengubah skema).

---

## 4. Temuan

Format: ID · kategori · file:lokasi · bukti · dampak · mitigasi · penghalang produksi.

### CRITICAL

**F-1 · Frontend konsultasi tiket tidak ada sama sekali.**
- Lokasi: seluruh `index.html`, `js/*.js`, `admin/*`.
- Bukti: grep `consultation-` di semua `*.js`/`*.html` = **0 hasil**; satu-satunya pemanggilan `functions/v1` di frontend adalah `verify-nia` (`verifikasi.html:40`); seksi `#konsultasi` di `index.html:302-318` hanyalah formulir yang dikirim lewat WhatsApp (`js/app.js:930-934`, `window.open('https://wa.me/…')`); `/admin` hanya memuat `admin/direktori.js` + `admin/admin.js` tanpa tab konsultan/reviewer/publikasi konsultasi; "Pengelola" di `admin/admin.js:470-479` mengelola `staff` CMS, bukan `consultation_staff_roles`.
- Dampak: seluruh alur yang menjadi objek audit (buat tiket KON-XXXXXX → akses → pesan → lampiran → jawaban → review → persetujuan → publikasi → pencabutan) **tidak dapat dijalankan oleh siapa pun**. Kriteria "alur utama konsultasi berjalan" tidak terpenuhi.
- Mitigasi: tidak ada (rencana integrasi `CONSULTATION_INTEGRATION_PLAN.md:35-38,68-69` sendiri menandai fase 3–4 ini "Baru" dan belum dikerjakan).
- **Penghalang produksi: YA** (untuk fitur konsultasi; situs publik/KTA/CMS yang sudah berjalan tidak terpengaruh dan tetap sehat).

### HIGH

**D-1 · Jalur migrasi kanonik tidak memuat SQL005/SQL006 — perbaikan keamanan tidak akan sampai ke produksi.**
- Lokasi: `supabase/consultation/MIGRATION_GUIDE.md:13-18,187`; `supabase/consultation/PHASE2_BACKEND.md:65-68`; status git (005/006/006_rollback untracked).
- Bukti: `MIGRATION_GUIDE.md:15-18` hanya menjabarkan 001–004 dan `:187` menyuruh "User menjalankan 001 → 002 → 003 → 004 di Supabase SQL Editor (produksi)". `005`/`006` tidak disebut sama sekali di panduan kanonik; tidak ada satu dokumen pun yang mencantumkan urutan apply lengkap 001→006.
- Dampak: operator yang mengikuti panduan utama menghasilkan **baseline tanpa C-1/C-2/H-1/H-2/M-5** — semua perbaikan yang terbukti di source tidak pernah dieksekusi. Kriteria "migrasi dan rollback terdokumentasi" tidak terpenuhi.
- Mitigasi: README audit (`README_AUDIT_FIX.md:53`, `README_PHASE_2_2.md:9`) mendokumentasikan 005/006 secara terpisah dan kini sudah ter-commit — tetapi tidak di panduan utama, dan file SQL-nya sendiri masih untracked.
- **Penghalang produksi: YA.**

### MEDIUM

**M-01 · `verify-nia`: rate limit masih in-memory per-instance.** `supabase/functions/verify-nia/index.ts:33-42,80-90` — batas 20/menit/IP & 300/menit tidak berlaku lintas instance; 9 endpoint lain sudah memakai limiter persisten fail-closed (`guard.ts:18-57`). Dampak: enumerasi NIA lebih cepat dari yang dinyatakan pada horizontal scaling. Mitigasi: diakui sendiri di komentar `:30-32`. Tidak menghalangi.

**M-02 · Instruksi deploy `consultation-attachment` ambigu.** `PHASE2_BACKEND.md:380-386` — paragraf pertama memasukkan `attachment` ke kelompok "JWT aktif", lalu kalimat berikutnya memperbaikinya ("verifikasi JWT dilakukan di dalam function … sakelar platform tidak boleh menolak pemohon lebih dulu"). Instruksi yang benar tersedia di paragraf yang sama, tetapi kontradiksi internal berisiko salah deploy → upload pemohon gagal 401 di gateway (kegagalan fungsi, bukan celah keamanan). Tidak menghalangi, tetapi wajib dipertegas sebelum deploy pertama.

**M-03 · Rollback 006 tidak dirujuk dokumen mana pun.** `consultation_006_rollback.sql` lengkap dan berkualitas (prasyarat `:10-13`, peringatan `:22-29`, verifikasi ACL `:754-776`) — grep `006_rollback` di semua `*.md` = 0 hasil. Tidak menghalangi (file ada dan teruji), tetapi melengkapi kriteria "rollback terdokumentasi".

**M-04 · M-7 belum ditutup di akar (SQL005 tanpa blok ACL).** `consultation_005_security_hardening.sql` tidak memuat `grant`/`revoke` (grep = 0). Mitigasi nyata: SQL006 §O memasang ulang ACL eksplisit untuk 13 RPC + 3 trigger fn (`consultation_006_security_hardening.sql:1178-1212`), jadi skenario apply lengkap 001→006 aman. Skenario out-of-order (005 tanpa 006) masih ber-ACL default. Tidak menghalangi selama urutan 001→006 dijalankan penuh.

**M-05 · Tidak ada prosedur darurat pasca-deploy.** Grep `darurat|emergency|kill switch` di `*.md` = 0. Satu-satunya jalur pemulihan terdokumentasi adalah rollback penuh yang destruktif (`MIGRATION_GUIDE.md:106-129`). Tidak menghalangi.

**M-06 · Verifikasi pasca-migrasi tidak mencakup 005/006.** `MIGRATION_GUIDE.md:36-68` hanya menyediakan 6 kueri verifikasi untuk 001–004; tidak ada cek ACL RPC hasil replace, keberadaan kolom `content_revision`, atau trigger revision guard. Tidak menghalangi.

**M-07 · Stored attribute-injection pada helper CMS statis.** `js/content.js:116` memakai `d.innerHTML = … + M.rich(h.isi)` **melewati `cleanHTML`**; `M.rich` (`js/content.js:18`) menyisipkan URL dari regex yang memperbolehkan `"` ke atribut `href` → attribute-injection di halaman statis CMS. Penulis hanya staff CMS berhak; jalur artikel utama (`app.js:447`→`put()`→`cleanHTML`) aman. Tidak menghalangi; wajib diperbaiki sebelum portal konsultasi memakai helper yang sama.

**M-08 · Fallback RPC `verify_nia` langsung dari halaman publik.** `verifikasi.html:42` — bila `verify-nia` tak terjangkau (mis. 404), halaman fallback ke `/rest/v1/rpc/verify_nia` dengan anon key. Bila patch revoke-anon (`supabase/patch-2026-11-12-revoke-verify-nia-anon.sql`) belum dieksekusi di DB produksi, ini jalur brute-force NIA tanpa rate-limit. Pasca-revoke, perilaku aman (halaman menampilkan pesan tak terjangkau). Tidak menghalangi; **wajib dikonfirmasi patch sudah dijalankan di produksi**.

### LOW

**L-01 ·** Judul berita CMS di kartu beranda dirender tanpa `esc` (`js/app.js:496`) — tertutup `cleanHTML` lewat `put()`; inkonsistensi, bukan XSS luar. | **L-02 ·** `X-Forwarded-For` dipakai sebagai identitas rate-limit (`http.ts:53-60`, `verify-nia/index.ts:125`) — potensi rotasi bucket/pembakaran bucket korban bila header dapat dipengaruhi klien; perlu verifikasi header di platform. | **L-03 ·** Klien tanpa IP berbagi bucket `'tanpa-ip'` (`http.ts:59`). | **L-04 ·** `CONSULTATION_ERD.md:48` menamai bucket `consultation-attachments` sedangkan jalur Edge Function memakai `consultation-private` (`consultation-attachment/index.ts:34`; `consultation_004_services.sql:25`) — kedua bucket memang dibuat, ambigu bagi operator. | **L-05 ·** `CURRENT_ARCHITECTURE.md:25,36` masih menyatakan "TIDAK ADA Edge Functions" tanpa tanda superseded. | **L-06 ·** `CONSULTATION_INTEGRATION_PLAN.md:31` menyebut secrets `CONSULTATION_PEPPER`/`CONSULTATION_RATE_*` yang tidak ada di implementasi (`config.ts:27` memakai `CONSULTATION_SECRET_PEPPER`) — operator yang menyetel nama itu akan mendapat 500 (`bootstrap.ts:17-20`). | **L-07 ·** Rollback khusus SQL005 tidak ada dan tidak terdokumentasi (mitigasi: `006_rollback.sql:6-8` memulihkan ke keadaan 005). | **L-08 ·** Inkonsistensi angka uji: `README_AUDIT_FIX.md:32` (125) vs `PHASE2_TEST_RESULTS.md:12` (121).

### INFORMATIONAL

**I-01 ·** CSP `script-src 'self' 'unsafe-inline'` (`vercel.json:108`) melemahkan mitigasi XSS (khususnya M-07). | **I-02 ·** `verify_nia` tetap di-grant ke `authenticated` via RPC langsung (`supabase-profiles.sql:396`; hanya `anon` yang dicabut) — disengaja untuk modul profil; enumerasi NIA oleh akun login tetap mungkin tanpa rate-limit di jalur RPC. | **I-03 ·** `readJson` berjalan sebelum rate-limit di beberapa endpoint staf (mis. `consultation-admin/index.ts:50-58`) — biaya kecil, berbatas 32 KB. | **I-04 ·** Keterbatasan historis backfill SQL006 terdokumentasi di source (`consultation_006_security_hardening.sql:637-647`): edit konten mentah yang ditutupi event lifecycle berikutnya tidak dapat dideteksi tanpa hash historis; hash saat migrasi sengaja tidak dipakai bukti; tulisan migrasi diaudit (`publikasi_migrasi_006`). | **I-05 ·** Notifikasi email (C4/Resend) terdokumentasi belum diimplementasikan (`PHASE2_BACKEND.md:461-462`) — konsisten dengan tidak adanya variabel SMTP. | **I-06 ·** Pointer HEAD di `PHASE_2_1_SECURITY_AUDIT.md:6` (`86ff26d`) sudah kedaluwarsa (kini `9bec326`) — substansi tetap valid. | **I-07 ·** `README.md` proyek tidak menautkan dokumentasi modul konsultasi.

---

## 5. Daftar temuan lama dan status penyelesaiannya

| ID | Temuan | Status | Bukti di source saat ini |
|---|---|---|---|
| **C-1** | Lampiran staf terlihat pemohon sebelum waktunya | **DIPERBAIKI (SQL005)** | `consultation_005_security_hardening.sql:48-67` (filter pesan/lampiran di `akses_tiket`), `:101-111` (`lampiran_pemohon_ambil` menolak lampiran staf yang belum terlihat/disetujui); diperkuat SQL006 `:356-403` |
| **C-2** | Jawaban konsultan terlihat tanpa review | **DIPERBAIKI (SQL005)** | `:132-147` (`svc_jawab` → `terlihat_pemohon=false` + `menunggu_review`), `:171-183` (`jawaban_final` hanya admin + persetujuan reviewer); diperkuat SQL006 `:98-245` |
| **H-1** | Persetujuan publikasi tidak terikat konten | **DIPERBAIKI (SQL006)** | revision guard `consultation_006_security_hardening.sql:762-817`; approval RPC mengikat revisi `:860-1123`; publish mewajibkan ketiga `*_revision = content_revision` `:1055+`; backfill konservatif teruji PGlite 47/47 |
| **H-2** | Transisi status dapat melewati keputusan reviewer | **DIPERBAIKI (SQL006)** | `svc_status` hanya admin dan menolak bypass `menunggu_review` `:485-498`; mesin transisi 26 pasangan di `consultation_001_foundation.sql` |
| **M-1** | Autentikasi endpoint staf | **DIPERBAIKI** | `auth.ts:29-35` (JWT via GoTrue, bukan body); dipanggil semua endpoint staf: admin `:60`, consultant `:39`, review `:33`, publication `:35`, attachment `:120,183` |
| **M-2** | Role dari klaim klien | **DIPERBAIKI** | `auth.ts:39-43` (RPC `consultation_svc_peran` ke DB) + `requireRole` `auth.ts:46-53` per endpoint |
| **M-3** | Rate limit tidak persisten | **DIPERBAIKI (9/10 endpoint)** | `guard.ts:18-57` (RPC `consultation_svc_rate_hit` persisten + fail-closed); terpasang di admin `:53`, consultant `:32`, review `:31`, publication `:33`, public `:23`, ticket-create `:43`, ticket-access `:39`, ticket-message `:33`, attachment `:92,119,158,182`. **Sisa: verify-nia masih in-memory → M-01** |
| **M-4** | Validasi input | **DIPERBAIKI** | `validation.ts` dipakai semua endpoint; non-string ditolak; body dibatasi streaming `http.ts:66-137` |
| **M-5** | Akses lampiran staf | **DIPERBAIKI (SQL006)** | konsultan hanya tiket yang ditugaskan aktif (`006:582-590`); reviewer hanya saat `menunggu_review` (`:591-598`); pemohon hanya miliknya yang terlihat (`:365-403`); signed URL 120 detik (`consultation-attachment/index.ts:168,189`); bucket privat tanpa policy storage (`003:131-134`) |
| **M-6** | 005 tidak pada jalur migrasi terdokumentasi | **BELUM TERSELESAIKAN** | → naik menjadi **D-1** (HIGH): `MIGRATION_GUIDE.md:13-18,187` masih 001→004; SQL005/006/rollback untracked |
| **M-7** | 005 tanpa blok ACL | **SEBAGIAN** | blok ACL eksplisit ada di SQL006 §O `:1178-1212` (menutup apply lengkap); akar (005 tanpa grant/revoke) belum ditutup → **M-04** |
| **Temuan rollback SQL006** | Paritas rollback | **TERBUKTI** | PGlite: objek 006 hilang total, 53 fungsi identik (body+ACL+atribut), inventaris identik, data utuh, ACL utuh, 005 utuh, rate limit `[true,true,false]` |
| **Keterbatasan historis backfill SQL006** | Edit mentah tak terdeteksi | **DIKETAHUI & TERDOKUMENTASI** | `consultation_006_security_hardening.sql:637-647` → **I-04** |

---

## 6. Keterbatasan yang belum dapat diverifikasi

1. **SQL005/SQL006 belum pernah dieksekusi ke database mana pun** (produksi maupun staging) — semua README menyatakannya jujur (`README_PHASE_2_2.md:5,38-48`). Bukti PGlite adalah simulasi, bukan bukti eksekusi produksi.
2. **Status patch revoke-anon `verify_nia` di DB produksi** tidak dapat diperiksa (audit tidak boleh menyentuh DB) — menentukan apakah M-08 aktif atau tertutup.
3. **Perilaku `X-Forwarded-For` pada platform Supabase** (apakah dapat dipengaruhi klien) — menentukan tingkat risiko L-02.
4. **Kinerja backfill SQL006 pada volume produksi besar** tidak diuji (dataset PGlite 7–8 publikasi).
5. **Frontend konsultasi** tidak dapat diaudit fungsinya karena belum ada (F-1) — kontrak klien↔backend baru bisa diverifikasi setelah dibangun.
6. Audit ini read-only terhadap working tree; tidak ada pemeriksaan environment secrets produksi yang terpasang.

---

## 7. Rekomendasi sebelum produksi (pekerjaan yang benar-benar wajib)

1. **Bangun frontend konsultasi** (fase 3–4 rencana integrasi): alur pemohon (buat tiket → simpan kredensial sekali-tampil → akses → pesan → lampiran → status), dashboard konsultan, reviewer, dan admin publikasi konsultasi — mengonsumsi 9 Edge Functions yang sudah teruji. *(F-1)*
2. **Perbarui `MIGRATION_GUIDE.md`** untuk mencantumkan urutan apply lengkap 001→006, verifikasi pasca-migrasi 005/006, dan rujukan ke `consultation_006_rollback.sql`; lalu **commit `consultation_005_security_hardening.sql`, `consultation_006_security_hardening.sql`, `consultation_006_rollback.sql`** ke git. *(D-1, M-03, M-06)*
3. **Pertegas satu instruksi `verify_jwt` untuk `consultation-attachment`** (platform nonaktif; autentikasi di dalam function) sebelum deploy pertama. *(M-02)*

Catatan pendamping (tidak menghalangi, layak dikerjakan bersamaan atau setelah go-live): pindahkan limiter `verify-nia` ke `guardRateLimit` persisten (M-01); konfirmasi patch revoke-anon `verify_nia` sudah dieksekusi (M-08); tutup M-04 dengan blok ACL di 005; tulis prosedur darurat singkat (M-05); perbaiki sanitasi `M.rich` (M-07) sebelum dipakai portal konsultasi.

---

## 8. Keputusan akhir

## **BELUM SIAP PRODUKSI**

**Alasan (berdasarkan kriteria yang ditetapkan):**
- **F-1 (CRITICAL):** alur utama konsultasi tidak berjalan karena frontend-nya belum ada — backend lengkap dan teruji berdiri tanpa konsumen.
- **D-1 (HIGH):** jalur migrasi terdokumentasi masih 001→004, sehingga perbaikan C-1/C-2/H-1/H-2/M-5 tidak akan sampai ke produksi; kriteria "migrasi dan rollback terdokumentasi" belum terpenuhi.

**Yang sudah terbukti siap dan tidak perlu dikerjakan ulang:** database (SQL001–SQL006) termasuk hardening keamanan dan paritas rollback; seluruh Edge Functions + `_shared` (autentikasi, otorisasi role, rate-limit persisten fail-closed, validasi input, lampiran + signed URL, konsistensi RPC); konsistensi frontend statis (vercel/robots/sitemap); daftar secrets akurat terhadap source.

Setelah dua penghalang di §7 butir 1–2 diselesaikan dan butir 3 dipertegas, audit lanjutan hanya perlu memverifikasi frontend baru dan eksekusi migrasi — lapisan lain tidak perlu diaudit ulang.

*— Akhir laporan. Audit berhenti di sini; tidak ada perbaikan yang dilakukan, menunggu persetujuan pemilik proyek.*
