# Hasil Pengujian PGlite — Migrasi Konsultasi Agama (Phase 1, Revisi Audit Lanjutan)

- Lingkungan: PGlite (Postgres WASM in-memory), Node.js v24, Windows.
- Skrip: `tests/test-konsultasi.mjs` (dalam repo, dapat dijalankan pemeriksa).
- Hasil akhir: **SEMUA TES LOLOS** (exit code 0) — **96 asersi, 0 gagal**.

> **Catatan Rekonsiliasi (GIT-5I) — angka 96 adalah catatan historis.**
> Angka 96 berasal dari eksekusi **Phase 1** dengan cakupan **SQL001–SQL003**
> dan kelompok **T01–T26** (sesudah revisi audit lanjutan; sebelumnya 50 asersi
> T01–T16 pada commit `2c35fe6`). Jadi 96 **bukan** jumlah asersi suite saat ini
> dan tidak dibandingkan langsung dengan 121/154 (Phase 2, SQL001–004) maupun
> 125/172 (setelah penyesuaian guard SQL006). Angka lama **sengaja dipertahankan**
> sebagai bukti historis; tidak ada penggantian angka tanpa bukti yang dapat
> diverifikasi. Rincian sumber dan status validitas ada pada laporan GIT-5I.

## Riwayat Pengujian

| Tahap | Kelompok | Asersi | Hasil |
|---|---|---|---|
| Sebelum revisi (commit `2c35fe6`) | T01–T16 | 50 | ✅ semua lolos |
| Sesudah revisi audit lanjutan | T01–T26 | **96** | ✅ semua lolos, 0 gagal |

Perubahan terhadap asersi lama (didokumentasikan, karena premisnya berubah
oleh revisi — bukan penghapusan cakupan):
- **T03**: pasangan transisi 25 → **26** (`menunggu_informasi → terjawab`
  kini sah, hasil audit A).
- **T04c**: nomor eksplisit sekarang **DITOLAK** (audit A.2: pemanggil tidak
  boleh menentukan nomor sendiri; wajib dari sequence), bukan dipertahankan.
- **T08a**: semantik jeda berubah (audit B). Semula mengharuskan tenggat
  bergeser setelah jeda 50 ms; kini menguji hal yang benar: jeda < 1 hari
  kerja **tidak** memakan jatah (tenggat tetap). Penggeseran penuh diuji T18.
- **T09b/T10b**: pesan error yang diharapkan diperbarui mengikuti validasi
  baru audit D/E (tetap menguji penolakan yang sama, dengan presisi lebih
  tinggi).

## Metodologi

1. Emulasi prasyarat Supabase di PGlite: stub `auth.jwt()` (return null) dan
   pembuatan peran `service_role` (BYPASSRLS), `anon`, `authenticated`
   **sebelum** `003_security` (di produksi ketiganya sudah ada bawaan).
2. Eksekusi 001 → 002 → 003 berurutan, lalu dijalankan **ulang ketiganya**
   (idempotensi).
3. **Seam waktu** `app.waktu_sistem` (GUC sesi) memungkinkan uji skenario
   kalender SLA lintas hari/akhir pekan/libur tanpa menunggu waktu nyata
   (T18); produksi tidak mengeset GUC ini.
4. Uji rollback ad-hoc terpisah: migrasi penuh → rollback **dua kali** →
   hasil `tabel 16→0, fungsi 0, trigger 0, sequence 0` (idempotent, mencakup
   seluruh objek baru).

## Hasil per Kelompok (sesudah revisi lanjutan)

| Kelompok | Asersi | Hasil |
|---|---|---|
| T01 | Migrasi 001→002→003 + dijalankan ulang (idempotensi) | ✅ 6 |
| T02 | 16 tabel; RLS 16/16; 0 policy (deny default) | ✅ 3 |
| T03 | Mesin status: **26** pasangan transisi valid/ilegal | ✅ 1 |
| T04 | Nomor `KON-YYMMDD-<base32>` dari sequence; status awal `baru`; SLA belum jalan; nomor eksplisit ditolak | ✅ 5 |
| T04b | Kategori non-aktif ditolak saat insert | ✅ 1 |
| T04c-duplikat | Nomor selalu unik lewat sequence (detail T19) | ✅ 1 |
| T05 | Transisi ilegal `baru → terjawab` ditolak | ✅ 1 |
| T06 | Kontak minimal satu; WA saja lolos | ✅ 2 |
| T07 | Alur penuh; SLA = EOD hari kerja ke-3 WIB; penugasan/pelepasan; unik parsial; non-konsultan ditolak | ✅ 5 |
| T08 | Perlindungan SLA pada UPDATE; jeda < 1 hari kerja tenggat tetap; kolom pause bersih; edit SLA manual ditolak | ✅ 3 |
| T09 | Pesan: catatan internal tersembunyi; email asing ditolak per role; jenis↔pengirim | ✅ 3 |
| T10 | Review: anti self-approval; non-reviewer ditolak; enum keputusan | ✅ 3 |
| T11 | Append-only 4/4 (update/delete status_logs, update messages, delete audit_logs) | ✅ 4 |
| T12 | Publikasi: terbit dini ditolak; tanpa slug/persetujuan ditolak; kewenangan 3 persetujuan semua ditolak; terbit valid + published_at | ✅ 11 |
| T13 | SLA hari kerja; libur dilewati | ✅ 2 |
| T14 | Deny default: anon/authenticated semua `permission denied`; sesi pulih | ✅ 5 |
| T15 | Kredensial hash-only; prefix path; whitelist mime; notifikasi & rate | ✅ 4 |
| T16 | Log status otomatis: 8 transisi tepat urut | ✅ 1 |
| **T17 (A)** | `terjawab → jeda → terjawab` sah; keluar jeda ke status lain ditolak (2 kasus); status_sebelum_pause tepat | ✅ 4 |
| **T18 (B)** | SLA seluruh kasus kalender: S1 hari sama, S2 lewat akhir pekan, S3 lewat libur, S4 akhir pekan+libur, S5 beberapa hari kerja (+3 hari kerja), S6 tenggat lewat selama jeda (jatah minimal) | ✅ 6 |
| **T19 (C)** | 100 nomor berturut semua unik; format konsisten; paralel dijamin sequence (tidak teruji penuh di PGlite) | ✅ 3 |
| **T20 (D)** | Pengirim: konsultan↛admin/reviewer; reviewer↛konsultan/admin; admin↛konsultan; staf nonaktif; pemohon tanpa email staf | ✅ 7 |
| **T21 (E)** | Konsultan nonaktif tak menerima penugasan; reviewer nonaktif tak bisa review; status dipulihkan | ✅ 3 |
| **T22 (B)** | Status awal wajib `baru`; insert dengan status lain / SLA terisi ditolak | ✅ 2 |
| **T23 (C)** | Perlindungan SLA di setiap UPDATE & perubahan status: entry pause, exit pause, transisi biasa, edit manual — semua ditolak | ✅ 3 |
| **T24 (D)** | `published_at` insert/update ditolak; pencabutan kontak → unpublish + dicabut; re-publication dengan persetujuan lama ditolak | ✅ 5 |
| **T25 (E)** | Lampiran lintas tiket (`message_id` beda tiket) ditolak | ✅ 1 |
| **T26 (F)** | Review append-only: UPDATE dan DELETE ditolak | ✅ 2 |

Total: **96 asersi, 96 lolos, 0 gagal.**

## Catatan Kejujuran

1. **Perbaikan harness pada pengujian awal** (sebelum revisi): T11d butuh
   baris data agar DELETE memicu trigger; T14b/c/d butuh `SET ROLE` level
   sesi (bukan `begin…rollback` dalam satu exec). Keduanya masalah skrip uji,
   bukan migrasi — dijelaskan di versi dokumen sebelumnya.
2. **Perubahan asersi karena revisi** (T03/T04c/T08a/T09b/T10b) tercantum di
   riwayat di atas — cakupan tidak berkurang, justru menajam.
3. **Uji transaksi paralel nomor tiket tidak dimungkinkan di PGlite**
   (satu koneksi, database in-memory per instans). Keamanan paralel dijamin
   mekanisme `sequence` (`nextval()` tidak pernah mengembalikan nilai sama
   untuk dua transaksi — perilaku bawaan PostgreSQL); verifikasi penuh
   membutuhkan Postgres nyata.

## Batas Pengujian (apa yang TIDAK teruji di PGlite)

- Bucket Storage `consultation-attachments`: schema storage tidak ada di
  PGlite → wajib diverifikasi saat migrasi produksi (MIGRATION_GUIDE §2).
- `auth.jwt()` asli Supabase (pengisian `oleh` pada log status dari JWT).
- Konkurensi nyata multi-koneksi (nomor tiket paralel; beban nyata).
- Edge Functions, rate-limit, SMTP: bukan scope Phase 1 (dependency C1–C7).

## Kesimpulan

Seluruh temuan audit lanjutan (A–H) memiliki penegakan di level database dan
terbukti oleh pengujian otomatis: nomor tiket wajib dari sequence, status awal
`baru`, perlindungan SLA di setiap UPDATE, kewenangan 3 persetujuan publikasi
+ pencabutan + published_at terlindungi, integritas lampiran lintas tiket,
review append-only, rollback tanpa CASCADE & bucket dipisah, migrasi
idempotent, RLS deny-by-default utuh, dan tidak ada jalan akses bagi
`anon`/`authenticated`.
