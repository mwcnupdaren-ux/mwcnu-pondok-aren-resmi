# AUDIT KESIAPAN DEPLOYMENT SUPABASE

> **STATUS HISTORIS (ditambahkan GIT-5I).** Dokumen ini adalah hasil audit pada
> **17 November 2026** terhadap kondisi repository saat itu (`HEAD = 0c1a1ab`).
> Temuan, angka, dan kesimpulan di bawah **dipertahankan apa adanya** sebagai
> catatan masa itu dan **tidak diubah** oleh GIT-5I. Dokumen ini **bukan** status
> kesiapan deployment terkini. Untuk kondisi terkini, baca laporan **GIT-5H**
> (audit baseline backend), laporan **GIT-5I** (rekonsiliasi dokumentasi), dan
> `supabase/consultation/PHASE2_BACKEND.md` versi terbaru.

## Proyek Konsultasi Agama MWCNU Pondok Aren

**Tanggal**: 2026-11-17 · **Branch**: `main` · **HEAD**: `0c1a1ab`
**Jenis audit**: read-only. Tidak ada file diubah, tidak ada commit/push, tidak ada migrasi/deploy/akses produksi.
**Satu-satunya eksekusi**: dua suite uji **lokal in-memory** (PGlite WASM + unit Node murni) — tidak menyentuh database Supabase, Storage, secrets, atau produksi, dan tidak menulis file.

---

## 1. Ringkasan Kondisi

| Aspek | Status |
|---|---|
| Git | Semua file produk & dokumentasi telah ter-commit (`dd3f775` frontend, `04a44c2` test, `0c1a1ab` docs); hanya 17 artefak sementara untracked (screenshot/skrip QA) |
| Migrasi SQL001–006 | Struktur, urutan, prasyarat, idempotensi — **valid** |
| MIGRATION_GUIDE.md | Konsisten dengan file aktual, memuat verifikasi §2/§2c/§2d & rollback §3a/§3b; tidak mengklaim migrasi sudah dijalankan |
| Edge Functions | 10/10 entry point valid, semua import `_shared` resolve, semua RPC yang dipanggil ada di SQL001–006 |
| Secrets/CORS/Storage | Nama konsisten dengan kode; CORS allowlist; Storage tanpa policy (deny default) |
| Uji lokal | `test-shared.mjs` **125/125 LULUS** ✓ · `test-konsultasi.mjs` **GAGAL** pada rantai 001→006 (test usang, bukan cacat SQL) ✗ |
| Sistem produksi | Belum ada migrasi, secrets, deploy, atau uji nyata sama sekali |

---

## 2. Temuan Audit (kategori + risiko)

### F-1 · PERLU PERBAIKAN · Risiko: TINGGI (penghalang bukti pengujian, bukan cacat produk)
**Komponen**: `supabase/consultation/tests/test-konsultasi.mjs` (blok T12, baris 229–260)
**Bukti**: Suite dijalankan (PGlite in-memory): T01 **LULUS penuh** — SQL001→006 diterapkan berurutan **dan** dijalankan ulang (idempoten) ✓; T02–T12c lulus. Pada T12d–T12j muncul 6 kegagalan ekspektasi, lalu proses **crash (uncaught)** pada UPDATE langsung baris 257:
`error: Persetujuan pemohon tidak berlaku untuk revisi konten ini` — `consultation_publication_revision_guard() line 33 at RAISE`.
Akar masalah: blok T12 memakai **7 UPDATE langsung** yang menyetel `persetujuan_pemohon/disetujui_reviewer/disetujui_admin` **tanpa** `*_revision = content_revision`, dan T12d–T12j mengharapkan pesan era SQL002/005. Blok T24 (baris 499–511) dan T27 (558–563) **sudah** diperbarui dengan binding revision — hanya blok T12 yang tertinggal.
**Dampak**: Tidak ada bukti hijau otomatis untuk rantai SQL001–006; suite berhenti sebelum T13–T31 sehingga bagian atas suite (SLA, lampiran, rate-limit, akses tiket, alur jawab/review/publikasi) tidak tereksekusi dalam run ini. Perilaku DB yang diamati **sesuai desain** SQL006 (approval wajib terikat revision — README_PHASE_2_2.md poin 8–9) — ini justru bukti guard aktif dan benar.
**Tindakan**: Perbaiki blok T12: (a) tambahkan `*_revision = content_revision` pada 7 UPDATE; (b) sesuaikan ekspektasi T12d–T12j ke pesan guard SQL006; (c) jalankan ulang hingga hijau penuh dan catat hasilnya.

### F-2 · PERLU PERBAIKAN · Risiko: SEDANG
**Komponen**: `supabase/consultation/consultation_006_rollback.sql`
**Bukti**: Tidak ada uji otomatis untuk rollback SQL006 (grep `rollback` di `tests/` hanya komentar T14). Rollback modul penuh (Phase 1) tervalidasi dua kali per `PGlite_TEST_RESULTS.md`; rollback 006 hanya memiliki pemeriksaan keras internal 6.1–6.7 yang berjalan saat eksekusi.
**Dampak**: Prosedur darurat belum pernah dieksekusi; jika diperlukan di produksi, dijalankan pertama kali tanpa latihan.
**Tindakan**: Jalankan dry-run rollback 006 di database staging/kop lokal setelah migrasi (atau tambahkan uji PGlite: apply 001→006 → rollback 006 → asersi 15 fungsi versi 005 + kolom/index 006 hilang), sebelum produksi.

### F-3 · PERLU PERBAIKAN · Risiko: RENDAH
**Komponen**: `README_PHASE_2_2.md` (bagian Status) & `supabase/consultation/tests/package.json`
**Bukti**: README menyatakan "Belum dijalankan … belum di-commit, belum di-push" — kini sudah ter-commit (`0c1a1ab`); header `test-shared.mjs` merujuk `npm run test:shared` tetapi `package.json` tests hanya punya script `test`. Juga `PHASE2_TEST_RESULTS.md` (154 uji) mencakup 001→004 saja.
**Dampak**: Dokumentasi status menyesatkan pemeriksa berikutnya; CI lokal tidak konsisten.
**Tindakan**: Perbarui bagian Status README; tambahkan script `test:shared`.

### F-4 · CATATAN · Risiko: RENDAH
**Komponen**: Prosedur rollback Edge Functions
**Bukti**: `PHASE2_BACKEND.md` §9 hanya memuat prosedur deploy; tidak ada prosedur eksplisit "rollback function = redeploy versi sebelumnya dari commit/tag".
**Dampak**: Prosedur darurat implisit, bergantung pada riwayat Git.
**Tindakan**: Satu paragraf di §9: rollback function = `supabase functions deploy <nama>` dari commit/tag sebelumnya + uji smoke; frontend = Vercel Instant Rollback.

### Poin yang TERVERIFIKASI LULUS (tanpa perlu diulang audit fase sebelumnya)
- **Urutan & ketergantungan migrasi**: header tiap file menuliskan prasyarat eksplisit (001 berurutan; 002→001; 003→001+002; 004→001–003; 006→001–005; SQL005 → setelah 004). Bukti eksekusi: T01 lulus berurutan + idempoten ulang 001–006.
- **MIGRATION_GUIDE.md vs SQL aktual**: nama file, isi tabel §1, verifikasi §2/§2c/§2d, rollback §3a/§3b — cocok; tidak ada klaim "sudah dijalankan di produksi" ✓.
- **Rollback SQL006 vs SQL006**: 15 fungsi yang diganti SQL006 (13 RPC + `review_check` + `consent_check`) dipulihkan ke definisi persis SQL005/004/002; trigger/fungsi guard, 2 index, 4 kolom dihapus; tidak menyentuh objek 001–005; satu transaksi; tanpa CASCADE; pemeriksaan keras 6.1–6.7.
- **Edge Functions**: 10/10 `index.ts` dengan `export default {fetch}`; semua import resolve ke `_shared/*` (12 modul tersedia); 31 nama RPC yang dipanggil semuanya ada di SQL001–006 (termasuk `peran`, `tiket_kredensial`, `lampiran_izin` untuk attachment).
- **`verify_jwt` (M-02 tuntas)**: satu instruksi tegas di `PHASE2_BACKEND.md` §9 — attachment/public/ticket-* NONAKTIF (`--no-verify-jwt`), 4 fungsi staf AKTIF. Sesuai mekanisme internal: jalur pemohon hanya header `apikey` publishable key; staf diverifikasi di dalam function (`authenticateStaff` → `auth.getUser` → `consultation_svc_peran`); frontend staf mengirim `apikey` + Bearer (terverifikasi di source).
- **Secrets (nama saja)**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY` (runtime), `CONSULTATION_SECRET_PEPPER` (manual, wajib), `CONSULTATION_ALLOWED_ORIGINS` (opsional) — persis yang dibaca `_shared/config.ts` & `verify-nia/index.ts`; tidak ada secret lain dibaca kode; tidak ada nilai ditampilkan.
- **CORS**: allowlist default mencakup domain produksi + vercel.app + port pengembangan lokal (`localhost`/`127.0.0.1` pada 8643, 5500, 5501, 3000, 8000, 5173), diperluas via `CONSULTATION_ALLOWED_ORIGINS`; `verify-nia` punya allowlist sendiri (disamakan); konfigurasi kosong → 500 aman tanpa bocor nama env (diuji M01b). Allowlist tetap tidak pernah memakai `*`.
- **Storage**: bucket `consultation-attachments` (SQL002) & `consultation-private` (SQL004), privat 5 MB/4 mime; **nol policy** `storage.objects` (grep membuktikan); satu-satunya jalur = service_role di dalam function; signed URL 120 detik; path terikat `tickets/<ticket_id>/…` dan divalidasi RPC + trigger.
- **Uji unit `_shared`**: **125/125 LULUS, exit 0** — mencakup guard rate-limit fail-closed baru (R02a: kegagalan RPC → 503, bukan fallback memori) dan 9 entry point.
- **Git**: produk ter-commit penuh; tidak ada drift repo vs yang akan di-deploy.

---

## 3. Evaluasi Prosedur Deployment (§5 tugas)

Urutan 1–9 (persiapan Supabase → SQL001–006 → verifikasi → secrets → deploy functions → smoke test → uji 4 peran → deploy frontend → verifikasi akhir): **logis dan lengkap**, selaras `MIGRATION_GUIDE.md` §7 dan `PHASE_5_REPORT.md` §6. Verifikasi database tersedia untuk pasca-SQL004 (§2), pasca-SQL005 (§2c), pasca-SQL006 (§2d). Catatan: verifikasi khusus pasca-SQL001–003 tersirat di §2 (dijalankan setelah 004); dapat diterima karena SQL003 wajib segera mengikuti SQL002 (ditulis di header file).

Rollback: database (modul penuh + SQL006) terdokumentasi baik di §3a/§3b dengan risiko & prasyarat; rollback Edge Functions & frontend lihat F-4.

---

## 4. Kesimpulan

## 🔶 SIAP SETELAH PERBAIKAN

**Bedakan dua hal:**

1. **Kesiapan source code** — **SIAP untuk persiapan deployment**: struktur migrasi, keamanan, dokumentasi, konfigurasi, secrets, CORS, Storage, dan ketepatan kode Edge Functions semuanya konsisten dan tervalidasi statis; guard revision SQL006 terbukti aktif dan berperilaku sesuai desain.

2. **Kesiapan sistem produksi** — **BELUM teruji secara langsung**: belum ada satu pun migrasi, secret, deployment, atau uji nyata; bukti pengujian otomatis untuk rantai penuh SQL001–006 **gagal/belum ada** (F-1), dan rollback SQL006 belum pernah dieksekusi (F-2).

**Gerbang wajib sebelum eksekusi deployment** (urutan):
1. Perbaiki blok T12 `test-konsultasi.mjs` (F-1) → jalankan hingga **hijau penuh** → catat hasil.
2. Dry-run/uji `consultation_006_rollback.sql` di lingkungan uji (F-2).
3. Perbaikan minor F-3, opsional F-4.
4. Baru lanjut ke urutan deployment §3 (eksekusi oleh user, sesuai batasan).

Tidak ada temuan BLOCKER pada produk (SQL maupun Edge Functions) — seluruh kegagalan berada di lapisan uji/dokumentasi yang dapat diperbaiki tanpa menyentuh backend yang sudah lulus audit.

---
*Audit berhenti di sini — tidak ada tindakan deployment dilakukan. Menunggu persetujuan.*
