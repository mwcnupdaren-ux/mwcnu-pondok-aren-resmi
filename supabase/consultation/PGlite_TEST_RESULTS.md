# Hasil Pengujian PGlite — Migrasi Konsultasi Agama (Phase 1)

- Lingkungan: PGlite (Postgres WASM in-memory), Node.js v24, Windows.
- Skrip: `test-konsultasi.mjs` (di temp folder sesi, tidak ikut repo).
- Hasil akhir: **SEMUA TES LOLOS** (exit code 0), 45 asersi dalam 16 kelompok.

## Metodologi

1. Emulasi prasyarat Supabase di PGlite: stub `auth.jwt()` (return null) dan
   pembuatan peran `service_role` (BYPASSRLS), `anon`, `authenticated`
   **sebelum** `003_security` (di produksi ketiganya sudah ada bawaan).
2. Eksekusi 001 → 002 → 003 berurutan, lalu dijalankan **ulang ketiganya**
   untuk membuktikan idempotensi.
3. Seri asersi perilaku (T03–T16) memakai data uji: 4 kategori, 1 tiket
   lengkap dialurkan dari `baru` sampai `selesai`.

## Catatan Kejujuran: Perbaikan Selama Pengujian

Dua temuan muncul saat pengujian dan diperbaiki **pada skrip uji** (bukan pada
migrasi SQL — migrasi tidak berubah karena temuan ini):

1. **T11d awalnya "lolos" tanpa error** — tabel `consultation_audit_logs`
   masih kosong sehingga `DELETE` mengenai 0 baris dan trigger `FOR EACH ROW`
   tidak pernah berjalan. Bukan cacat trigger; perbaikannya: sisipkan satu
   baris audit uji terlebih dahulu, baru uji delete → kini terbukti ditolak.
2. **T14b/c/d error `25P02` (transaction aborted)** — pola
   `begin; set local role ...; <dibatalkan>; rollback;` dalam satu `exec`
   berhenti di error pertama sehingga `rollback` tak pernah dieksekusi dan
   sesi tertinggal di transaksi aborted (yang lalu juga menggagalkan T15).
   Bukan cacat RLS; perbaikannya: uji hak akses memakai `SET ROLE` level sesi
   + `RESET ROLE` di `finally`. Kini keempat uji role terbukti ditolak dengan
   `permission denied` dan sesi tetap bersih.

Keduanya masalah harness pengujian, bukan migrasi. Hasil di bawah adalah hasil
setelah perbaikan.

## Hasil per Kelompok

| Kelompok | Asersi | Hasil |
|---|---|---|
| T01 | Migrasi 001→002→003 berurutan + ketiganya dijalankan ulang (idempotensi) | ✅ 6/6 |
| T02 | 16 tabel ada; RLS aktif 16/16; 0 policy (deny default) | ✅ 3/3 |
| T03 | Mesin status: 25 pasangan transisi valid/ilegal | ✅ |
| T04 | Nomor tiket otomatis `KON-YYMMDD-XXXXXX`; status awal `baru`; SLA belum jalan | ✅ 3/3 |
| T04b | Kategori non-aktif ditolak saat insert tiket | ✅ |
| T05 | Transisi ilegal `baru → terjawab` ditolak oleh trigger | ✅ |
| T06 | Kontak pemohon: tanpa WA & email ditolak (`ccr_min_satu_kontak`); WA saja lolos | ✅ |
| T07 | Alur lengkap: SLA terisi saat `diverifikasi` (akhir hari kerja ke-3, 23:59 WIB); penugasan + pelepasan; dua penugasan aktif ditolak (unik parsial); email non-konsultan ditolak (FK komposit) | ✅ 5/5 |
| T08 | Pause/resume: deadline bergeser setelah jeda; kolom pause dibersihkan; perubahan SLA manual ditolak | ✅ 3/3 |
| T09 | Pesan: `catatan_internal` wajib tersembunyi; pengirim tak terdaftar ditolak; jenis↔pengirim divalidasi | ✅ 3/3 |
| T10 | Review: anti self-approval; non-reviewer ditolak (FK komposit); enum keputusan | ✅ 3/3 |
| T11 | Append-only: update/delete `status_logs`, update `messages`, delete `audit_logs` semua ditolak | ✅ 4/4 |
| T12 | Publikasi: terbit tanpa persetujuan ditolak; terbit tanpa slug/persetujuan penuh ditolak; `published_at` terisi otomatis | ✅ 3/3 |
| T13 | SLA hari kerja dihitung; hari libur dilewati | ✅ |
| T14 | Deny default: anon select/insert tiket, authenticated select credentials, anon select attachments — semua `permission denied`; sesi kembali normal | ✅ 5/5 |
| T15 | Kredensial: secret non-hash-64-hex ditolak; path di luar `tickets/` ditolak; mime di luar whitelist ditolak; notifikasi & rate_hits terisi | ✅ 4/4 |
| T16 | Log status otomatis: riwayat 8 transisi tepat urut (`baru>diverifikasi>…>selesai`) | ✅ |

## Batas Pengujian (apa yang TIDAK teruji di PGlite)

- Bucket Storage `consultation-attachments`: schema storage tidak ada di
  PGlite → pembuatan bucket hanya berjalan saat migrasi produksi (ada notice).
  Verifikasi produksi wajib (lihat `MIGRATION_GUIDE.md` §2).
- `auth.jwt()` asli Supabase (diuji dengan stub null; perilaku pengisian
  `oleh` dari email JWT belum teruji di lingkungan asli).
- Ekstensi/policy Supabase lain dan concurrent write di bawah beban nyata.
- Edge Functions, rate-limit, SMTP: bukan scope Phase 1 (dependency C1–C7).

## Kesimpulan

Migrasi 001–003 idempotent, membangun 16 tabel dengan RLS deny-by-default,
mesin status & SLA berfungsi, seluruh penjaga integritas (trigger, check,
FK komposit, append-only, aturan publikasi) terbukti menolak input invalid,
dan tidak ada satu pun jalan baca/tulis bagi `anon`/`authenticated`.
Siap diterapkan ke produksi setelah persetujuan pengguna.
