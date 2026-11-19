# Phase 2.2 — Security Hardening Lanjutan

## Status

Migrasi `consultation_006_security_hardening.sql` sudah di-commit (`9237893`) dan di-push ke branch `main`. Migrasi ini belum dijalankan pada database lokal/produksi dan belum di-deploy.

Perbaikan test runner pada `supabase/consultation/tests/test-konsultasi.mjs` dan script `test:shared` pada `supabase/consultation/tests/package.json` sudah di-commit (`0437ac5`).

## Prasyarat

Jalankan hanya setelah migrasi `consultation_001_foundation.sql` sampai `consultation_005_security_hardening.sql` tersedia dan telah diterapkan pada database pengujian.

## Cakupan SQL 006

1. Review hanya dapat dilakukan terhadap jawaban konsultan terbaru; satu jawaban hanya memiliki satu keputusan review.
2. Pengiriman jawaban baru ditolak ketika tiket masih `menunggu_review`.
3. Pesan jawaban konsultan untuk pemohon hanya ditampilkan bila jawaban tersebut adalah yang terbaru dan sudah disetujui reviewer. Flag `terlihat_pemohon` lama tidak dapat melewati aturan ini.
4. Signed URL lampiran pemohon mengikuti aturan visibilitas pesan yang sama; lampiran staf yang tidak terhubung ke pesan yang terlihat tidak diberikan.
5. RPC pesan staf tidak dapat dipakai untuk membuat jawaban konsultan di luar alur review atau menerbitkan jawaban final tanpa review terbaru.
6. RPC perubahan status umum tidak dapat meniru keputusan reviewer dari `menunggu_review`.
7. Akses metadata lampiran staf dibatasi: konsultan harus memiliki penugasan aktif; reviewer hanya dapat mengakses tiket yang sedang menunggu review; admin konsultasi tetap memiliki kewenangan operasional.
8. Persetujuan publikasi terikat ke `content_revision`. Perubahan judul, pertanyaan samaran, atau jawaban final mengganti revision dan menghapus seluruh persetujuan lama serta slug.
9. Persetujuan pemohon tidak lagi diwariskan dari persetujuan umum di tabel kontak saat draft publikasi diajukan. Pemohon harus memberi persetujuan eksplisit untuk revision publikasi saat ini.
10. Reviewer/admin harus menyetujui revision yang sama sebelum publikasi dapat diterbitkan.
11. Pencabutan publikasi atau persetujuan pemohon membatalkan seluruh stempel persetujuan. Penerbitan ulang membutuhkan persetujuan baru dari ketiga pihak.

## Catatan penting

- Pesan dan review tetap append-only. Tidak ada penghapusan atau perubahan histori.
- Persetujuan publikasi yang sudah ada saat migrasi dipetakan ke revision awal saat migrasi. Perubahan konten setelah migrasi otomatis membatalkannya.
- Temuan Edge Function seperti X-Forwarded-For spoofing, rate limit in-memory, urutan autentikasi sebelum multipart parsing, dan validasi magic bytes **tidak diselesaikan oleh SQL 006**. Perlu patch TypeScript terpisah.
- M-5 akses lampiran staf ditangani pada RPC database. Namun uji signed URL/Storage tetap wajib karena Edge Function yang membuat signed URL juga harus memanggil RPC yang benar.

## Pengujian yang disiapkan

Skrip `supabase/consultation/tests/test-konsultasi.mjs` diperbarui untuk memuat migrasi 006, menguji idempotensi 006, menolak bypass status, menolak review jawaban lama/duplikat, menyembunyikan jawaban lama setelah jawaban baru, mewajibkan persetujuan pemohon untuk draft, dan menguji reset persetujuan setelah perubahan konten.

Pemeriksaan yang berhasil pada paket ini: `node --check` untuk sintaks JavaScript test runner dan pemeriksaan struktur statis file SQL (pasangan dollar-quote, blok transaksi, signature RPC terhadap migrasi sebelumnya).

PGlite belum dapat dijalankan di lingkungan ini karena dependensi `@electric-sql/pglite` tidak tersedia dalam cache offline. Tidak ada migrasi database yang dieksekusi.

## Wajib sebelum dianggap siap

1. Audit diff SQL 006 terhadap 001–005.
2. Terapkan seluruh migrasi pada database pengujian kosong secara berurutan.
3. Uji upgrade dari database yang telah memiliki data, termasuk publikasi draft/terbit yang sudah ada.
4. Jalankan tes positif dan negatif untuk jawaban terbaru, review, lampiran pemohon/staf, perubahan konten publikasi, persetujuan baru, pencabutan, dan penerbitan.
5. Jalankan tes konkurensi dua konsultan/reviewer/admin pada tiket dan publikasi yang sama.
6. Pastikan seluruh Edge Function tetap memanggil RPC dengan signature yang sama.
7. Jangan jalankan pada produksi sebelum hasil pengujian dan audit disetujui.
