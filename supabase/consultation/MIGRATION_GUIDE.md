# Migration Guide — Modul Konsultasi Agama (Phase 1, 2 & 2.2)

Panduan penerapan 6 file migrasi database modul Konsultasi Agama di Supabase
**produksi** (SQL001–SQL006). Migrasi ini BELUM dijalankan di produksi —
seluruh pengujian dilakukan lokal via PGlite (lihat `PGlite_TEST_RESULTS.md`
dan `PHASE2_TEST_RESULTS.md`).

## 1. File & Urutan Eksekusi

Jalankan **berurutan** di Supabase SQL Editor (setiap file satu kali, tunggu
sukses sebelum lanjut):

| Urut | File | Isi |
|---|---|---|
| 1 | `consultation_001_foundation.sql` | Fungsi `consultation_can_transition` (mesin status 26 pasangan transisi) |
| 2 | `consultation_002_tables.sql` | 16 tabel, indeks, FK (termasuk FK komposit), sequence nomor tiket, bucket privat, 13 trigger + 17 fungsi, fungsi SLA |
| 3 | `consultation_003_security.sql` | RLS 16/16 tanpa policy (deny default), revoke seluruh hak dari anon/authenticated, hak tabel/fungsi/sequence eksplisit hanya untuk service_role |
| 4 | `consultation_004_services.sql` | **Phase 2**: RPC layanan `consultation_svc_*` (pemohon, staf, konsultan, reviewer, publikasi, lampiran, rate-limit, audit HTTP) + bucket privat `consultation-private` |
| 5 | `consultation_005_security_hardening.sql` | **Phase 2.1**: visibilitas lampiran/pesan bagi pemohon, jawaban konsultan wajib melewati review, serialisasi review, rate-limit persisten atomik (`consultation_svc_rate_hit`) |
| 6 | `consultation_006_security_hardening.sql` | **Phase 2.2**: review hanya jawaban terbaru (satu jawaban = satu review), pemulihan jawaban saat jeda informasi, visibilitas jawaban hanya setelah review disetujui, persetujuan publikasi terikat `content_revision`, guard revisi publikasi, lampiran staf terikat peran & status tiket, ACL tegas `service_role` |

Prasyarat yang **sudah tersedia bawaan Supabase** (tidak perlu dibuat):
peran `service_role`, `anon`, `authenticated`; schema `auth` dengan
`auth.jwt()`; schema `storage`.

Prasyarat antar-file (urutan wajib):
- SQL005 hanya dijalankan setelah SQL001–SQL004 sukses.
- SQL006 hanya dijalankan setelah SQL001–SQL005 sukses (transaksi
  `begin; ... commit;` di dalamnya mengasumsikan objek SQL005 sudah ada).

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

-- (4) Bucket privat ada & non-publik (Phase 1 + Phase 2)
select id, public, file_size_limit, allowed_mime_types
  from storage.buckets where id in ('consultation-attachments','consultation-private');

-- (5) Fungsi terdaftar (17 fungsi Phase 1 + 30 RPC layanan Phase 2)
select proname, count(*) from pg_proc
 where proname like 'consultation_%' group by proname order by proname;

-- (6) Sequence nomor tiket hanya untuk service_role
select has_sequence_privilege('anon','public.consultation_nomor_tiket_seq','USAGE') anon,
       has_sequence_privilege('service_role','public.consultation_nomor_tiket_seq','USAGE') svc;
```

Hasil yang diharapkan: (1) 16 baris semua `true`; (2) 0 baris; (3) 0 baris;
(4) 2 baris, `public = false`, limit 5 MB, 4 mime; (5) 17 fungsi Phase 1 +
RPC `consultation_svc_*`; (6) `anon = false`, `svc = true`.

(Setelah SQL005 dan SQL006 jumlah/versi fungsi bertambah — jalankan juga
verifikasi §2c dan §2d di bawah.)

## 2c. Verifikasi Setelah SQL005

```sql
-- (1) RPC hasil SQL005 terdaftar
select distinct proname from pg_proc
 where proname in ('consultation_svc_rate_hit',
                   'consultation_svc_akses_tiket',
                   'consultation_svc_lampiran_pemohon_ambil',
                   'consultation_svc_jawab',
                   'consultation_svc_pesan_staf',
                   'consultation_svc_review')
 order by proname;

-- (2) ACL tetap benar: service_role boleh, anon/authenticated tidak
select
  has_function_privilege('service_role','public.consultation_svc_jawab(uuid,text,text)','execute') svc,
  has_function_privilege('anon','public.consultation_svc_jawab(uuid,text,text)','execute') anon,
  has_function_privilege('authenticated','public.consultation_svc_jawab(uuid,text,text)','execute') auth;
```

Hasil yang diharapkan: (1) 6 baris; (2) `svc = true`, `anon = false`,
`auth = false`.

## 2d. Verifikasi Setelah SQL006

```sql
-- (1) 4 kolom revision 006 ada
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'consultation_publications'
   and column_name in ('content_revision','persetujuan_pemohon_revision',
                       'disetujui_reviewer_revision','disetujui_admin_revision')
 order by column_name;

-- (2) 2 index 006 ada
select indexname from pg_indexes
 where schemaname = 'public'
   and indexname in ('consultation_messages_latest_answer',
                     'consultation_reviews_latest_message')
 order by indexname;

-- (3) trigger + fungsi revision guard 006 ada
select count(*) from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname = 'consultation_publications'
   and t.tgname = 'trg_consultation_publication_00_revision_guard';
select count(*) from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname = 'consultation_publication_revision_guard';

-- (4) ACL RPC tereplaced tetap: service_role saja
select
  has_function_privilege('service_role','public.consultation_svc_status(uuid,text,text,text)','execute') svc,
  has_function_privilege('anon','public.consultation_svc_status(uuid,text,text,text)','execute') anon,
  has_function_privilege('authenticated','public.consultation_svc_status(uuid,text,text,text)','execute') auth;
```

Hasil yang diharapkan: (1) 4 baris; (2) 2 baris; (3) masing-masing ≥ 1;
(4) `svc = true`, `anon = false`, `auth = false`.

## 2b. Definisi Matematis Jeda SLA (hasil audit)

Perhitungan jeda **tidak memakai penambahan durasi kalender mentah**
(`deadline + (now() - paused_at)` yang dilarang audit), melainkan
**penggeseran tanggal tenggat sejumlah hari kerja yang tertutup penuh jeda**.

Notasi:
- Tenggat `D` = EOD (23:59:59 WIB) suatu hari kerja `X`.
- Interval jeda `[P, R]` (instan masuk & keluar `menunggu_informasi`).
- `HK(d)` = predikat hari kerja: Senin–Jumat dan bukan anggota
  `consultation_holidays`.
- `C` = himpunan hari kerja yang tertutup jeda:
  `C = { d | d > tanggal(P)  dan  d < tanggal(R)  dan  HK(d) }`
  (ketat di antara kedua tanggal — hari jeda dan hari resume sendiri tidak
  dihitung, karena jam operasional belum ditetapkan; granularitas = level hari).
- Aturan resume: `X_baru = geser(X, |C| hari kerja ke depan)`;
  `D_baru = EOD(X_baru)`.
- Aturan jatah minimal: bila `D_baru ≤ R`, maka `D_baru = EOD(hari kerja
  pertama setelah R)` — pemohon selalu mendapat minimal 1 hari kerja segar.
- Invarian: `X_baru ≥ X` (tenggat tidak pernah maju/memendek), dan `D_baru`
  selalu EOD hari kerja valid (tidak pernah Sabtu/Minggu/libur).

Contoh kasus (window awal: Senin → tenggat Kamis, 3 hari kerja):

| Kasus | Jeda [P → R] | C (hari kerja tertutup) | Tenggat baru |
|---|---|---|---|
| Jeda & lanjut hari sama | Sel 10:00 → Sel 15:00 | ∅ | Kamis (tetap) |
| Lewat akhir pekan | Jum 10:00 → Sen 09:00 | ∅ (Sabtu/Minggu bukan hari kerja) | tetap |
| Lewat hari libur | Sel 10:00 → Kam 09:00 (Rabu libur) | ∅ (Rabu libur) | tetap |
| Lewat akhir pekan + libur | Jum 10:00 → Sel 09:00 (Mon libur) | ∅ | tetap |
| Beberapa hari kerja | Sel 10:00 → Sen depan 09:00 | {Rabu, Kamis, Jumat} | Kamis + 3 hari kerja = Selasa depan |
| Tenggat lewat selama jeda | Kam 10:00 → Jum 10:00 | ∅ tetapi D ≤ R | Jatah minimal: Senin depan |

Kasus-kasus ini diuji otomatis (T18 S1–S6) memakai seam waktu
`app.waktu_sistem` (lihat risiko #8).

## 3. Rollback Guide

### 3a. Rollback SQL006 (`consultation_006_rollback.sql`)

Mengembalikan database dari keadaan **setelah SQL006** ke keadaan
**setelah SQL005** — mengembalikan **struktur dan fungsi**, bukan
membatalkan seluruh perubahan data:

- **Yang dikembalikan**: 15 fungsi diganti kembali ke definisi persis
  SQL005/SQL004 via `CREATE OR REPLACE` (ACL `service_role` dari SQL003/004
  tetap utuh, bukan `DROP` + `CREATE`); trigger + fungsi
  `consultation_publication_revision_guard()` milik 006 dihapus; 2 index
  (`consultation_messages_latest_answer`,
  `consultation_reviews_latest_message`) dan 4 kolom `*_revision` dihapus.
- **Yang TIDAK dikembalikan (data)**: stempel `*_revision` hilang bersama
  kolomnya; publikasi yang pernah direset guard SQL006 tetap pada nilai
  barunya (false / slug null / published false); perubahan status tiket oleh
  `svc_jawab` versi 006 tetap berlaku; audit `content_revision` yang
  menunjuk revisi yang sudah dihapus tidak dikoreksi (append-only).
- **Risiko**: membuka kembali temuan yang hanya ditutup SQL006 — H-1 (teks
  publikasi dapat diganti setelah disetujui tanpa reset approval), H-2
  (transisi `menunggu_review → terjawab` melewati reviewer), M-5 (reviewer/
  admin dapat mengunggah/mengambil lampiran tiket mana pun) — serta
  menghilangkan aturan "hanya jawaban terbaru yang dapat direview", "satu
  jawaban satu review", dan pengikatan persetujuan ke `content_revision`.
- **Prasyarat**: database berada pada keadaan setelah SQL006 (SQL001–SQL006
  sudah diterapkan); **hentikan trafik tulis** selama eksekusi; dijalankan
  hanya atas persetujuan tertulis pengguna dengan rencana re-apply SQL006.
- **Jaminan**: seluruh skrip dalam SATU transaksi (gagal di tengah = tidak
  ada perubahan permanen); idempoten (`if exists`); tidak ada CASCADE;
  tidak menyentuh objek SQL001–SQL005, tabel existing, Storage, atau Edge
  Function; diakhiri pemeriksaan keras (6.1–6.7) yang membatalkan seluruh
  transaksi bila hasil pemulihan tidak lengkap.

### 3b. Rollback modul penuh (`consultation_rollback.sql`)

File `consultation_rollback.sql` membatalkan seluruh Phase 1 + Phase 2 dengan urutan:
1. Drop seluruh fungsi layanan `consultation_svc_*` secara otomatis (blok
   `do` atas `pg_proc`), lalu drop trigger (13) dan fungsi Phase 1 (21,
   termasuk fungsi aktor B3) dan drop sequence nomor tiket.
2. Drop 16 tabel **TANPA CASCADE** (urut ketergantungan FK anak→induk; bila ada
   objek EKSTERNAL yang bergantung, rollback GAGAL KERAS alih-alih
   menghapusnya diam-diam).
3. Bucket Storage `consultation-attachments` dan `consultation-private`
   **tidak** dihapus oleh rollback database — penghapusannya dipisah ke bagian
   manual di akhir file rollback dan membutuhkan keputusan administrator.

Jaminan rollback:
- Tidak menyentuh tabel existing.
- `drop ... if exists` → aman dijalankan ulang (idempotent).
- **PERHATIAN**: menghapus tiket = menghapus metadata percakapan/lampiran.
  File fisik di bucket Storage tidak ikut terhapus oleh SQL — kosongkan
  manual bila benar-benar perlu. Riwayat `status_logs`/`audit_logs` selamat
  (FK `SET NULL`) sampai tabelnya sendiri di-drop oleh rollback.
- Tervalidasi: menjalankan rollback dua kali menghasilkan 0 tabel, 0 fungsi,
  0 trigger, 0 sequence (lihat `PGlite_TEST_RESULTS.md`).

Rollback hanya dilakukan atas keputusan eksplisit pengguna.

## 4. Desain Keamanan Ringkas

| Aspek | Keputusan |
|---|---|
| RLS | Aktif 16/16, **0 policy** → deny default ke anon & authenticated |
| Akses data | Hanya `service_role` dalam Edge Functions (frontend tidak pernah memegangnya) |
| Secret tiket | CSPRNG 32 byte di Edge Function → disimpan sebagai HMAC-SHA256 (pepper di function secrets); plaintext tidak pernah disentuh DB |
| Nomor tiket | Di-generate trigger dari sequence (`KON-YYMMDD-<kode base-32>`) — unik dijamin sequence, aman transaksi bersamaan; bukan rahasia, bukan token akses |
| Role staf | `consultation_staff_roles` terpisah dari role CMS `staff.role` |
| Lampiran | Bucket privat tanpa policy storage; signed URL pendek dari function |
| Append-only | `messages`, `status_logs`, `audit_logs`, `reviews` dilindungi trigger; CASCADE tiket tetap diizinkan via `pg_trigger_depth()` |
| Publikasi | Butuh 3 persetujuan (pemohon, reviewer, admin) + slug; snapshot samar tanpa data identitas; `published_at` tidak dapat diubah; pencabutan kontak memaksa unpublish + stempel `dicabut_at`, penerbitan ulang butuh persetujuan segar |

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
4. **Nomor tiket dari sequence**: keunikan aman terhadap transaksi bersamaan
   (nextval tidak pernah duplikat); kode base-32 6 karakter menampung ±1,07
   miliar tiket sebelum memanjang ke 7 karakter. Ada gap nilai bila transaksi
   di-rollback — wajar dan tidak berbahaya.
5. **`menunggu_informasi` memperlama SLA sebesar hari kerja yang tertutup
   jeda**: lihat definisi matematis §2b; penghitungan level hari (bukan jam)
   karena jam operasional belum ditetapkan.
6. **Jam operasional belum dimodelkan** — kebijakan resmi belum ditetapkan;
   tidak ada objek yang perlu diubah bila nanti ditetapkan (menjadi aturan
   Edge Function).
7. **Email staf = sumber identitas**: `consultation_staff_roles.email` harus
   persis (lowercase) sama dengan email Google staf di `auth.users`;
   ketidakcocokan akan tampak sebagai penolakan di Edge Function, bukan error DB.
8. **Seam waktu `app.waktu_sistem`**: GUC sesi untuk meng-override `now()`
   pada perhitungan SLA/nomor (dipakai uji T18). Produksi tidak mengesetnya;
   dampaknya terbatas karena hanya service_role (Edge Functions) yang boleh
   menulis tabel tiket. Tetap dicatat sebagai permukaan yang harus diawasi.

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

1. User menjalankan 001 → 002 → 003 → 004 → 005 → 006 di Supabase SQL Editor
   (produksi), berurutan, menunggu sukses setiap file sebelum lanjut.
2. Jalankan kueri verifikasi bagian 2 (setelah SQL004), §2c (setelah SQL005),
   dan §2d (setelah SQL006).
3. Deploy Edge Functions `consultation-*` (lihat `PHASE2_BACKEND.md` §9 —
   termasuk instruksi `verify_jwt` per fungsi) dan set function secrets yang
   tercantum di sana — user menjalankan sendiri (C1).
4. Uji backend nyata (smoke test end-to-end: buat tiket, lampiran, jawab,
   review, publikasi), lalu deploy frontend (Vercel).
