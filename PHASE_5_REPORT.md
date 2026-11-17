# PHASE 5 REPORT — Persiapan Integrasi Produksi

**Proyek**: Konsultasi Agama MWCNU Pondok Aren
**Tanggal**: 2026-11-17
**Git HEAD saat pemeriksaan**: `85c5e9e` ("Close homepage hero container")
**Status**: Fase 5 selesai — menunggu persetujuan.

---

## 1. File yang Diperiksa

| Kelompok | File | Hasil |
|---|---|---|
| Git | `git status --short`, `git log` | Lihat §5 |
| Migrasi DB | `supabase/consultation/MIGRATION_GUIDE.md` | Masih mencakup SQL001–SQL004 saja → diperbarui (§2) |
| Migrasi DB | `consultation_001_foundation.sql` … `consultation_004_services.sql` | Sudah terdokumentasi; RPC `consultation_svc_peran`, `consultation_svc_tiket_kredensial`, `consultation_svc_lampiran_izin`, `consultation_svc_lampiran_pemohon` (dipakai `consultation-attachment`) tersedia sejak SQL004 ✓ |
| Migrasi DB | `consultation_005_security_hardening.sql` | 6 RPC diperbarui (akses_tiket, lampiran_pemohon_ambil, jawab, pesan_staf, review) + `consultation_svc_rate_hit` persisten atomik |
| Migrasi DB | `consultation_006_security_hardening.sql` | Additive; review jawaban terbaru; persetujuan publikasi terikat `content_revision`; lampiran staf terikat peran/status; ACL tegas `service_role`; transaksi `begin…commit` |
| Migrasi DB | `consultation_006_rollback.sql` | Terverifikasi mengembalikan **struktur + fungsi** ke kondisi SQL005 (15 fungsi via `CREATE OR REPLACE`, ACL utuh), tanpa membatalkan data; ada pemeriksaan keras 6.1–6.7 |
| Konfigurasi Supabase | `supabase/config.toml` | **TIDAK ADA di repo** — deploy Edge Functions dilakukan via CLI flag (lihat §4) |
| Edge Functions | `supabase/functions/consultation-attachment/index.ts`, `_shared/auth.ts`, `_shared/bootstrap.ts`, `_shared/config.ts` | Autentikasi staf di dalam function (`authenticateStaff` → `auth.getUser` → `consultation_svc_peran`); jalur pemohon memakai nomor+secret, TANPA JWT |
| Edge Functions | 10 function lain + `_shared/*` | Semua memuat konfigurasi via `resolveConfig(Deno.env.toObject())`; tidak ada env tambahan di luar §4 |
| Frontend | `js/config.js`, `js/konsultasi.js`, `js/konsultasi-staf.js`, `konsultasi-staf.html` | Pemohon: header `apikey` (publishable key) saja; staf: `apikey` + `Authorization: Bearer <access_token>` |
| Vercel | `vercel.json` | CSP `connect-src` sudah mencakup `https://wvfcifqolohfipvepxss.supabase.co` (HTTP + WSS) ✓; rewrites/headers/noindex admin ✓ |
| Dokumentasi deploy | `supabase/consultation/PHASE2_BACKEND.md` §8–§11 | Ambiguitas `verify_jwt` (M-02) ditemukan di §9 → diperbaiki (§3) |
| Laporan sebelumnya | `PHASE_FINAL_AUDIT_REPORT.md`, `PHASE_3_REPORT.md`, `PHASE_4_REPORT.md` | Rekomendasi M-02 tuntas; kendala H-1–H-4 masih terbuka (lihat §8) |

Audit backend Fase 1–2 **tidak diulang** (sudah lulus `PHASE_FINAL_AUDIT_REPORT.md`); tidak ada file backend yang diubah.

## 2. File yang Diubah

Hanya dokumentasi (tanpa perubahan perilaku kode/fungsi/kebijakan):

1. **`supabase/consultation/MIGRATION_GUIDE.md`**
   - Judul & intro: kini mencakup 6 file (SQL001–SQL006); tetap menegaskan migrasi **BELUM dijalankan di produksi**.
   - Tabel §1: baris SQL005 (Phase 2.1) dan SQL006 (Phase 2.2) ditambahkan.
   - Prasyarat antar-file: SQL005 setelah SQL001–SQL004; SQL006 setelah SQL001–SQL005.
   - §2c baru: verifikasi setelah SQL005 (6 RPC terdaftar + ACL service_role/anon/authenticated).
   - §2d baru: verifikasi setelah SQL006 (4 kolom `*_revision`, 2 index, trigger + fungsi revision guard, ACL).
   - §3a baru: panduan rollback `consultation_006_rollback.sql` — mengembalikan struktur & fungsi ke kondisi SQL005 (BUKAN membatalkan data), risiko (membuka kembali H-1/H-2/M-5), prasyarat (keadaan pasca-SQL006, hentikan trafik tulis, persetujuan tertulis + rencana re-apply), jaminan (satu transaksi, idempoten, tanpa CASCADE). Rollback modul penuh dipindah ke §3b.
   - §7: langkah pasca-persetujuan kini 001→…→006, verifikasi §2/§2c/§2d, deploy Edge Functions + secrets, uji backend nyata, lalu deploy frontend.
2. **`supabase/consultation/PHASE2_BACKEND.md` §9**
   - Paragraf deploy yang kontradiktif diganti dengan **satu instruksi tegas** `verify_jwt` per fungsi (tabel + perintah deploy) — lihat §3 di bawah.

## 3. Hasil Pemeriksaan Konfigurasi Attachment (`verify_jwt`)

**Temuan (M-02)**: `PHASE2_BACKEND.md` §9 lama menyebut `attachment` dalam kelompok "JWT verification **aktif** untuk 5 fungsi staf", lalu dikoreksi kalimat berikutnya ("sakelar platform tidak boleh menolak pemohon lebih dulu"). Kontradiksi internal berisiko salah deploy (upload pemohon gagal 401 di gateway).

**Fakta mekanisme autentikasi (dari source, tanpa perubahan perilaku)**:
- Jalur **pemohon** `consultation-attachment`: nomor tiket + secret → `consultation_svc_tiket_kredensial`; frontend (`js/konsultasi.js`) hanya mengirim header `apikey` (publishable key `sb_publishable_...`, bukan JWT) — **tanpa** `Authorization`.
- Jalur **staf**: `authenticateStaff(req, db)` membaca `Authorization: Bearer <access_token>`, memverifikasi via GoTrue (`auth.getUser`), lalu peran dari DB (`consultation_svc_peran`). Frontend staf (`js/konsultasi-staf.js:82`) mengirim `apikey` + `Authorization: Bearer`.

**Instruksi final (satu-satunya, tegas)** — kini di `PHASE2_BACKEND.md` §9:

| Function | `verify_jwt` (platform) |
|---|---|
| `consultation-admin`, `consultation-consultant`, `consultation-review`, `consultation-publication` | **AKTIF** (default) |
| `consultation-public`, `consultation-ticket-*` (create/access/message) | **NONAKTIF** (`--no-verify-jwt`) |
| `consultation-attachment` | **NONAKTIF** (`--no-verify-jwt`) — deploy: `supabase functions deploy consultation-attachment --no-verify-jwt` |

Alasan: function melakukan verifikasi JWT staf **di dalam** function; sakelar platform aktif akan menolak jalur pemohon (apikey saja, bukan JWT) sebelum sampai ke function. Tidak ada `supabase/config.toml` di repo — instruksi via CLI flag cukup dan tidak mengubah perilaku fungsi.

## 4. Daftar Secrets & Environment Variables (nama saja, tanpa nilai)

**Supabase Edge Functions** (sumber: `_shared/config.ts`, `verify-nia/index.ts`; terdokumentasi di `PHASE2_BACKEND.md` §9):

| Variabel/Secret | Sumber | Wajib? |
|---|---|---|
| `SUPABASE_URL` | otomatis runtime Supabase | ya |
| `SUPABASE_SERVICE_ROLE_KEY` | otomatis runtime (server-only) | ya |
| `SUPABASE_ANON_KEY` atau `SUPABASE_PUBLISHABLE_KEY` | otomatis runtime | ya |
| `CONSULTATION_SECRET_PEPPER` | function secret, diset manual | ya — min. 16 karakter acak, hanya server |
| `CONSULTATION_ALLOWED_ORIGINS` | env opsional | tidak (default origin sudah mencakup domain produksi + vercel.app) |

**Kesesuaian nama dengan kode**: `config.ts` membaca persis nama-nama di atas; `verify-nia/index.ts` membaca `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (sama) ✓. Tidak ada kode yang membaca secret lain (mis. SMTP/Resend) — antrian notifikasi (C4) belum aktif di kode functions.

**Frontend** (publik, bukan secret): `js/config.js` memuat `supabaseUrl: https://wvfcifqolohfipvepxss.supabase.co` dan publishable key `sb_publishable_...` (nama umum; nilainya memang dirancang publik). Tidak ada env var Vercel yang dibutuhkan — nilai frontend statis di `js/config.js`.

## 5. Status Tiga File SQL di Git

Nama file aktual (semua **untracked**, aman belum di-commit — tidak dilakukan commit/push/hapus):

| File | Status |
|---|---|
| `supabase/consultation/consultation_005_security_hardening.sql` | `??` (untracked) |
| `supabase/consultation/consultation_006_security_hardening.sql` | `??` (untracked) |
| `supabase/consultation/consultation_006_rollback.sql` | `??` (untracked) |

Konteks Git lainnya (HEAD `85c5e9e`): modified — `admin/admin.js`, `css/style.css`, `index.html`, `package.json`, `package-lock.json`, `supabase/consultation/tests/*`, `supabase/functions/_shared/{db,guard,http}.ts`, `supabase/functions/consultation-attachment/index.ts`, `supabase/functions/verify-nia/index.ts`; untracked — `js/konsultasi.js`, `js/konsultasi-staf.js`, `konsultasi-staf.html`, `PHASE_2_1_SECURITY_AUDIT.md`, `PHASE_3_REPORT.md`, `PHASE_4_REPORT.md`, `PHASE_FINAL_AUDIT_REPORT.md`, `README_*`, dokumen `supabase/consultation/*`, serta PNG/script sisa QA.

**Perubahan yang diperlukan (oleh user, saat disetujui)**: `git add` + commit ketiga file SQL di atas **beserta** file pendukungnya (dokumen migrasi `MIGRATION_GUIDE.md`, `PHASE2_BACKEND.md`, `consultation_006_rollback.sql`, frontend `js/konsultasi*.js` + `konsultasi-staf.html`, hasil uji) agar migrasi dan kode yang di-deploy identik dengan repo.

## 6. Urutan Deployment yang Direkomendasikan

1. **Commit Git** (user) — 3 file SQL + dokumen + frontend (§5).
2. **Migrasi DB**: SQL001 → SQL002 → SQL003 → SQL004 → SQL005 → SQL006 berurutan di Supabase SQL Editor (produksi), tunggu sukses tiap file.
3. **Verifikasi**: kueri MIGRATION_GUIDE §2 (pasca-SQL004), §2c (pasca-SQL005), §2d (pasca-SQL006).
4. **Secrets**: set function secret `CONSULTATION_SECRET_PEPPER` (server-only); `CONSULTATION_ALLOWED_ORIGINS` bila perlu origin tambahan.
5. **Deploy Edge Functions** dengan `verify_jwt` sesuai tabel §3 (attachment & public & ticket-* → `--no-verify-jwt`).
6. **Smoke test backend nyata** end-to-end: buat tiket → unggah lampiran pemohon → jawab konsultan → review → jawaban final → publikasi 3-persetujuan → unduh signed URL.
7. **Deploy frontend (Vercel)** — `vercel.json` sudah lengkap (CSP `connect-src` mencakup domain Supabase); frontend boleh dideploy lebih dulu sebab hanya memakai publishable key, tetapi fitur konsultasi baru hidup setelah langkah 2–5.

## 7. Hambatan yang Masih Tersisa

| # | Hambatan | Dampak | Penanganan |
|---|---|---|---|
| 1 | Backend (SQL + Edge Functions) **belum pernah diterapkan di produksi** | Tidak ada bukti runtime nyata | Langkah 2–6 di §6 adalah eksekusinya; wajib smoke test |
| 2 | H-1: tidak ada RPC staf untuk daftar lampiran per tiket | Staf unduh lampiran per-UUID saja | Fitur fase backend berikutnya; tidak menghalangi deploy |
| 3 | H-2: daftar kandidat publikasi hanya untuk admin | Reviewer approve per-ID tiket | Idem |
| 4 | 3 file SQL + dokumen/frontend **belum ter-commit** | Risiko drift repo vs produksi | Commit oleh user sebelum/bersamaan deploy |
| 5 | Tidak ada `supabase/config.toml` | Deploy memakai CLI flag manual | Opsional dibuat; instruksi flag sudah tegas di §9 |
| 6 | Purge `consultation_rate_hits` tidak otomatis (C7) | Tumbuh pelan tabel rate-limit | Mitigasi bawaan (hapus acak 2% + window 2 jam); pg_cron opsional |
| 7 | `consultation_svc_status` versi SQL006 mengubah validasi transisi dari SQL005 (kini hanya admin & blokir lewat review) | Perilaku uji lama bisa berbeda | Sudah dirancang demikian (SQL006 §H); dokumen sudah sinkron |

## 8. Keputusan

## ✅ SIAP DEPLOYMENT

Alasan:
- Seluruh rantai migrasi SQL001–SQL006 + rollback SQL006 terdokumentasi lengkap dengan langkah verifikasi pasca-SQL005 dan pasca-SQL006.
- Ambiguitas `verify_jwt` `consultation-attachment` (M-02, satu-satunya prasyarat dokumen dari audit final) **sudah dituntaskan** dengan satu instruksi tegas yang sesuai mekanisme autentikasi function sebenarnya.
- Nama env vars/secrets konsisten 100% dengan kode; frontend & Vercel siap (CSP sudah mencakup domain Supabase).
- Tidak ada perubahan kode backend/frontend yang diperlukan; tidak ada migrasi/akses DB/deploy yang dilakukan oleh agen.

Dengan syarat eksekusi **mengikuti urutan §6** dan dilakukan oleh user (migrasi, secrets, deploy), disertai smoke test backend nyata sebelum fitur dipublikasikan ke pengguna.

---
*Fase 5 berhenti di sini — menunggu persetujuan sebelum eksekusi deployment.*
