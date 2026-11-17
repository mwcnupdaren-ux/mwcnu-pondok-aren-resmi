# Phase 2 Security Hardening (lokal)

## File yang ditambahkan/diubah

**Ditambahkan**
- `supabase/consultation/consultation_005_security_hardening.sql`

**Diubah**
- `supabase/functions/_shared/http.ts`
- `supabase/functions/_shared/guard.ts`
- `supabase/functions/consultation-attachment/index.ts`
- `supabase/functions/verify-nia/index.ts`
- `supabase/consultation/tests/test-konsultasi.mjs`
- `supabase/consultation/tests/test-shared.mjs`

Migrasi `001` sampai `004` disertakan sebagai basis uji, bukan file yang perlu diganti jika sudah ada di repo.

## Perbaikan

1. Daftar lampiran dan RPC signed-URL pemohon hanya mengizinkan lampiran pemohon atau lampiran staf yang terhubung ke pesan yang terlihat/di-review disetujui.
2. Jawaban konsultan dibuat tersembunyi. Visibilitasnya ditentukan oleh baris review `disetujui`, sehingga tabel pesan tetap append-only.
3. Jawaban final admin yang terlihat ditolak sampai tiket berstatus `terjawab`/`selesai` dan ada review yang disetujui.
4. Review mengunci baris tiket (`FOR UPDATE`) dan memvalidasi bahwa pesan jawaban benar-benar milik tiket tersebut.
5. Rate-limit persisten memakai advisory transaction lock per bucket+endpoint. Jika RPC atau pepper gagal, request ditolak dengan 503, bukan fallback limiter memori per-instance.
6. Pembacaan JSON dan multipart dibatasi secara streaming sebelum parsing penuh.
7. `verify-nia` juga membatasi body JSON 8 KiB. Batas 20/IP dan 300 agregat tetap hanya berlaku per instance; komentar tidak lagi mengklaim batas global.

## Pengujian yang dijalankan

- Migrasi SQL PGlite `001`–`005`, termasuk pengulangan migrasi `005`: lulus.
- SQL regression test: seluruh asersi yang ada dan tambahan lulus.
- Shared unit test: **125 lolos, 0 gagal**.
- Pemeriksaan sintaks TypeScript Node: **22 file lolos**.

Perintah:
```bash
cd supabase/consultation/tests
npm ci
node test-konsultasi.mjs
node --experimental-strip-types test-shared.mjs
```

## Batas verifikasi

Belum dijalankan:
- `deno check` terhadap Edge Functions.
- E2E HTTP dengan Supabase nyata, GoTrue `auth.getUser`, Storage upload/signed URL.
- Uji konkurensi multi-koneksi PostgreSQL nyata (PGlite test tidak membuktikan perilaku konkurensi produksi).
- Deploy, push, atau migrasi produksi.

## Penerapan lokal

Tambahkan migrasi `005` setelah `004` pada urutan migrasi lokal. Jangan menjalankannya di proyek Supabase produksi sebelum audit dan persetujuan eksplisit.
