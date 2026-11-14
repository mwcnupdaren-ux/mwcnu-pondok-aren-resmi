# Keputusan Final C1–C7 — Dasar Perencanaan Phase 2

> Status: **DISETUJUI** oleh pengguna (arahan terbaru, setelah Phase 1
> `2c35fe6`). Dicatat sebagai keputusan final untuk *perencanaan* Phase 2.
> Tidak ada implementasi Phase 2 yang dimulai sebelum persetujuan berikutnya.

| Kode | Keputusan Final | Konsekuensi bagi Phase 2 |
|---|---|---|
| **C1** | Deploy Edge Functions **dijalankan oleh pengguna sendiri** (pola sama dengan migrasi SQL: kerjakan → serahkan perintah → user mengeksekusi). Agent tidak pernah menjalankan `supabase functions deploy` ke produksi. | Semua deliverable Phase 2 berupa kode + panduan perintah deploy; log hasil deploy dikirim user untuk verifikasi. |
| **C2** | Rate-limit memakai **tabel hit di DB** (`consultation_rate_hits`, bucket identitas di-hash) yang sudah disiapkan Phase 1; pemeriksaan window dilakukan di Edge Function sebelum aksi tulis. | Butuh fungsi pembersihan (purge) berkala — terkait C7. Tidak ada penyimpanan IP mentah. |
| **C3** | Validasi kontak **tanpa OTP**: form wajib minimal satu kontak (WA/email) + persetujuan privasi; sekali-kirim verifikasi ringan di function (format + deteksi duplikasi). | Pemohon tidak memerlukan akun; kredensial akses tiket tetap secret HMAC (B3). |
| **C4** | Pengiriman email memakai **Resend SMTP**, kredensial disimpan di **function secrets** — tidak pernah di repo/frontend/database. | Antrian `consultation_notifications` dikonsumsi function; status `terkirim/gagal` dicatat kembali. |
| **C5** | Penyamarkan arsip publikasi dilakukan oleh role **`admin_konsultasi`** (sesuai usulan Phase 1). | Kolom `disamarkan_oleh` diisi email admin_konsultasi; reviewer & admin menyetujui via kolom persetujuan yang ada. |
| **C6** | Batas lampiran **≤ 5 MB**, mime `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. | Sudah dikunci ganda di Phase 1 (check DB + bucket). Phase 2 hanya menegakkan di sisi unggah function. |
| **C7** | Reminder SLA otomatis **wajib ada**. Mekanisme: **pg_cron** (sederhana, berjalan di DB, tanpa infra tambahan) — scheduled Edge Function hanya cadangan bila pg_cron tidak tersedia di paket. | Di awal Phase 2: cek ketersediaan pg_cron di project; purge `consultation_rate_hits` (C2) digabung ke jadwal yang sama. |

## Catatan penerapan

1. Keputusan ini **mengikat perencanaan Phase 2**, tetapi implementasi belum
   dimulai dan menunggu persetujuan pengguna (batas instruksi terkini).
2. Tidak ada satu pun file SQL Phase 1 yang perlu diubah karena keputusan ini
   — seluruh kebutuhan C1–C7 sudah terakomodasi struktur Phase 1 atau murni
   berada di lapisan Edge Functions.
3. Bila pengguna mengubah salah satu keputusan sebelum Phase 2 dimulai,
   cukup sunting tabel di atas; struktur Phase 1 tidak terdampak.
