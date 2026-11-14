# Migration Guide — Modul Konsultasi Agama (Phase 1)

Panduan penerapan 3 file migrasi database modul Konsultasi Agama di Supabase
**produksi**. Migrasi ini BELUM dijalankan di produksi — seluruh pengujian
dilakukan lokal via PGlite (lihat `PGlite_TEST_RESULTS.md`).

## 1. File & Urutan Eksekusi

Jalankan **berurutan** di Supabase SQL Editor (setiap file satu kali, tunggu
sukses sebelum lanjut):

| Urut | File | Isi |
|---|---|---|
| 1 | `consultation_001_foundation.sql` | Fungsi `consultation_can_transition` (mesin status 25 pasangan transisi) |
| 2 | `consultation_002_tables.sql` | 16 tabel, indeks, FK (termasuk FK komposit), bucket privat, 10 trigger/fungsi trigger, fungsi SLA |
| 3 | `consultation_003_security.sql` | RLS 16/16 tanpa policy (deny default), revoke seluruh hak dari anon/authenticated, fungsi hanya untuk service_role |

Prasyarat yang **sudah tersedia bawaan Supabase** (tidak perlu dibuat):
peran `service_role`, `anon`, `authenticated`; schema `auth` dengan
`auth.jwt()`; schema `storage`.

### Sifat & Jaminan
- **Idempotent**: `create if not exists`, `create or replace`,
  `drop trigger if exists` + `create trigger` — aman dijalankan ulang.
- **Tanpa perubahan destruktif**: tidak ada `alter`/`drop` pada tabel existing
  (`staff`, `profiles`, `content_items`, `site_settings`, dst.).
- **Tanpa akses anon**: RLS aktif di semua tabel konsultasi dan **nol policy**
  dibuat → anon/authenticated ditolak by default; seluruh akses data berjalan
  lewat `service_role` di dalam Edge Functions (Phase 2). `service_role` tidak
  pernah masuk frontend.

## 2. Verifikasi Setelah Migrasi

Jalankan kueri verifikasi berikut di SQL Editor:

```sql
-- (1) 16 tabel, semua rowsecurity = true
select tablename, rowsecurity from pg_tables
 where schemaname = 'public' and tablename like 'consultation_%'
 order by tablename;

-- (2) 0 policy pada tabel konsultasi (deny default)
select tablename, policyname from pg_policies
 where schemaname = 'public' and tablename like 'consultation_%';

-- (3) 0 hak tabel anon/authenticated
select grantee, table_name from information_schema.role_table_grants
 where table_schema = 'public' and table_name like 'consultation_%'
   and grantee in ('anon','authenticated');

-- (4) Bucket privat ada & non-publik
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets where id = 'consultation-attachments';

-- (5) Fungsi terdaftar
select proname from pg_proc where proname like 'consultation_%' order by proname;
```

Hasil yang diharapkan: (1) 16 baris semua `true`; (2) 0 baris; (3) 0 baris;
(4) 1 baris, `public = false`, limit 5 MB, 4 mime; (5) 11 fungsi.

## 3. Rollback Guide

File `consultation_rollback.sql` membatalkan seluruh Phase 1 dengan urutan:
1. Drop trigger (12) lalu drop fungsi (10).
2. Drop 16 tabel `CASCADE` (urut ketergantungan; CASCADE hanya berlaku di
   antara tabel konsultasi).
3. Hapus bucket `consultation-attachments` dari `storage.buckets`.

Jaminan rollback:
- Tidak menyentuh tabel existing.
- `drop function if exists` / `drop table if exists` → aman dijalankan ulang.
- **PERHATIAN**: menghapus tiket = menghapus metadata percakapan/lampiran.
  File fisik di bucket Storage tidak ikut terhapus oleh SQL — kosongkan
  manual bila benar-benar perlu. Riwayat `status_logs`/`audit_logs` selamat
  (FK `SET NULL`) sampai tabelnya sendiri di-drop oleh rollback.

Rollback hanya dilakukan atas keputusan eksplisit pengguna.

## 4. Desain Keamanan Ringkas

| Aspek | Keputusan |
|---|---|
| RLS | Aktif 16/16, **0 policy** → deny default ke anon & authenticated |
| Akses data | Hanya `service_role` dalam Edge Functions (frontend tidak pernah memegangnya) |
| Secret tiket | CSPRNG 32 byte di Edge Function → disimpan sebagai HMAC-SHA256 (pepper di function secrets); plaintext tidak pernah disentuh DB |
| Nomor tiket | Di-generate trigger (`KON-YYMMDD-XXXXXX`) — bukan rahasia, bukan token akses |
| Role staf | `consultation_staff_roles` terpisah dari role CMS `staff.role` |
| Lampiran | Bucket privat tanpa policy storage; signed URL pendek dari function |
| Append-only | `messages`, `status_logs`, `audit_logs` dilindungi trigger; CASCADE tiket tetap diizinkan via `pg_trigger_depth()` |
| Publikasi | Butuh 3 persetujuan (pemohon, reviewer, admin) + slug; snapshot samar tanpa data identitas |

## 5. Risiko & Catatan Penting (Phase 1)

1. **PGlite ≠ Supabase 100%**: bucket Storage dan ekstensi Supabase tidak
   tersedia di PGlite; pembuatan bucket dilewati dengan notice dan baru
   tereksekusi saat migrasi produksi. Verifikasi (4) di atas wajib dilakukan.
2. **Kesesuaian kategori konsultan tidak ditegakkan DB**: penugasan
   konsultan lintas kategori lolos di level DB (hanya dicek role). Validasi
   bisnisnya di Edge Function (Phase 2).
3. **Purge `consultation_rate_hits` tidak otomatis**: tabel tersedia sejak
   Phase 1, pembersihan berkala belum ada — butuh pg_cron atau scheduled
   function (C2/C7).
4. **Nomor tiket memakai `random()`**: bukan kripto — memang disengaja
   (bukan rahasia); keunikan dijaga loop + unique constraint.
5. **`menunggu_informasi` memperlama SLA mekanis**: deadline digeser persis
   sebesar durasi jeda; kebijakan SLA aktual (target hari) masih bisa diubah
   tanpa migrasi karena hanya konstanta di trigger/fungsi.
6. **Jam operasional belum dimodelkan** — kebijakan resmi belum ditetapkan;
   tidak ada objek yang perlu diubah bila nanti ditetapkan (menjadi aturan
   Edge Function).
7. **Email staf = sumber identitas**: `consultation_staff_roles.email` harus
   persis (lowercase) sama dengan email Google staf di `auth.users`;
   ketidakcocokan akan tampak sebagai penolakan di Edge Function, bukan error DB.

## 6. Dependency Keputusan C1–C7 (dikerjakan di Phase 2)

| Kode | Keputusan | Yang sudah disiapkan di Phase 1 |
|---|---|---|
| C1 | Metode deploy Edge Functions (user menjalankan sendiri) | — |
| C2 | Pendekatan rate-limit | Tabel `consultation_rate_hits` (bucket di-hash) |
| C3 | Validasi kontak tanpa OTP | Check kontak minimal satu + persetujuan privasi |
| C4 | Kredensial Resend SMTP di function secrets | Antrian `consultation_notifications` |
| C5 | Role penyamar arsip publikasi | Usulan: `admin_konsultasi` (kolom `disamarkan_oleh` siap) |
| C6 | Batas lampiran | 5 MB, jpeg/png/webp/pdf — di check DB DAN bucket |
| C7 | Mekanisme SLA reminder (pg_cron vs scheduled function) | `sla_deadline` + kalender libur |

## 7. Langkah Setelah Persetujuan

1. User menjalankan 001 → 002 → 003 di Supabase SQL Editor (produksi).
2. Jalankan kueri verifikasi bagian 2.
3. Lanjut ke Phase 2 (Edge Functions) setelah C1–C7 diputuskan.
