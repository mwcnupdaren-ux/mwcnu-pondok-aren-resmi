# Paket Review Independen — Phase 1 Modul Konsultasi Agama

Paket ini memungkinkan pemeriksa independen memverifikasi seluruh deliverable
Phase 1 **tanpa bantuan penulis**, tanpa menyentuh Supabase produksi.

## 1. Identitas

| Item | Nilai |
|---|---|
| Commit Phase 1 | `2c35fe6` + commit revisi audit di atasnya (lihat `git log`); **belum di-push** |
| Lingkungan produksi | **Tidak disentuh** — migrasi belum pernah dijalankan di Supabase |
| Status | Menunggu persetujuan berikutnya; implementasi Phase 2 belum dimulai |

## 2. Daftar Deliverable

| File | Peran |
|---|---|
| `consultation_001_foundation.sql` | Migrasi 1/3: mesin status (`consultation_can_transition`) |
| `consultation_002_tables.sql` | Migrasi 2/3: 16 tabel, indeks, FK komposit, bucket privat, 10 trigger, fungsi SLA |
| `consultation_003_security.sql` | Migrasi 3/3: RLS deny-by-default, revoke anon/authenticated, hak fungsi ke service_role |
| `consultation_rollback.sql` | Pembatalan penuh Phase 1 (idempotent, aman ke tabel existing) |
| `CONSULTATION_ERD.md` | Diagram relasi + mesin status + batas integrasi |
| `DATABASE_DICTIONARY.md` | Kamus data 16 tabel (kolom, constraint, penegakan) |
| `MIGRATION_GUIDE.md` | Panduan penerapan, verifikasi produksi, rollback guide, risiko, dependency C1–C7 |
| `PGlite_TEST_RESULTS.md` | Hasil uji + metodologi + batas pengujian |
| `DECISIONS_C1_C7.md` | Keputusan final C1–C7 untuk perencanaan Phase 2 |
| `tests/test-konsultasi.mjs` | Skrip uji PGlite — dapat dijalankan ulang oleh pemeriksa |

## 3. Cara Pemeriksa Menjalankan Uji Ulang

```bash
cd supabase/consultation/tests
node test-konsultasi.mjs
```

- Butuh Node.js ≥ 18. Bila paket `@electric-sql/pglite` belum terpasang
  (`npm i @electric-sql/pglite`), skrip otomatis memakai cache npx lokal
  pada mesin dev.
- Hasil yang diharapkan: **22 kelompok (T01–T21), 82 asersi, semua `OK`,
  baris akhir `== HASIL: SEMUA TES LOLOS ==`, exit code 0.**
- Skrip berjalan penuh **in-memory** (PGlite WASM): tidak ada koneksi jaringan,
  tidak menyentuh Supabase.
- Pemeriksa dianjurkan membaca langsung isi skrip (±420 baris) untuk memverifi-
  kasi bahwa asersinya sungguhan (bukan asersi kosong).

## 4. Verifikasi Tanpa Menjalankan Kode

1. **Diff nol terhadap sistem existing**:
   `git diff 2c35fe6^ 2c35fe6 --stat` — hanya menambah file di
   `supabase/consultation/`; tidak ada satu byte perubahan pada
   `supabase/schema.sql`, `staff`, `profiles`, atau file CMS.
2. **Prefix**: `grep -n "create table" supabase/consultation/consultation_002_tables.sql`
   — semua 16 `create table if not exists public.consultation_*`.
3. **Tanpa akses anon**: `grep -n "policy" supabase/consultation/consultation_003_security.sql`
   — tidak ada `create policy` sama sekali (deny default), hanya
   `revoke ... from anon, authenticated`; sequence juga di-revoke dari public.
4. **Tanpa rahasia di repo**:
   `grep -rniE "service_role|resend|api[_-]?key" supabase/consultation/ --include=*.sql --include=*.mjs`
   — hanya rujukan peran/grant, tidak ada nilai kredensial.
5. **Idempotensi**: cari `drop trigger if exists` sebelum tiap
   `create trigger`; `create table if not exists`; `create or replace function`;
   `create sequence if not exists`.
6. **Keamanan nomor tiket (audit C)**: generator memakai
   `nextval('consultation_nomor_tiket_seq')` — bukan `random()` + `NOT EXISTS`.
7. **Seam waktu (audit B)**: `app.waktu_sistem` hanya dibaca fungsi
   `consultation_waktu()`; produksi tidak mengesetnya (dicatat sebagai risiko).

## 5. Poin Pemeriksaan yang Direkomendasikan

- RLS 16/16 aktif **tanpa policy** — cocok dengan ketentuan "tanpa akses anon".
- FK komposit `(email, role)` menjamin penugasan/review hanya menunjuk role
  yang tepat; ON DELETE RESTRICT/CASCADE/SET NULL sesuai kamus data.
- Append-only 3 tabel log dengan pengecualian CASCADE (`pg_trigger_depth() = 1`).
- Secret akses: hanya kolom `secret_hash` (64 hex), tidak ada kolom plaintext.
- Publikasi: check 3-persetujuan + slug **plus** trigger kewenangan
  (pemohon konsisten kontak, reviewer/admin ber-role aktif, waktu wajib,
  state false wajib bersih).
- Jeda SLA: definisi matematis hari-kerja-tertutup (MIGRATION_GUIDE §2b) —
  tanpa penambahan durasi kalender mentah.
- Batas pengujian yang diakui terbuka (bucket storage, `auth.jwt()` asli,
  konkurensi nyata) — tercantum di `PGlite_TEST_RESULTS.md` §Batas Pengujian.

## 6. Keputusan & Batasan yang Berlaku Saat Ini

- Keputusan C1–C7 final tercatat di `DECISIONS_C1_C7.md`.
- File SQL Phase 1 **tidak boleh diubah** sampai instruksi berikutnya.
- Tidak ada push, deploy, atau eksekusi migrasi produksi tanpa persetujuan
  eksplisit pengguna.
