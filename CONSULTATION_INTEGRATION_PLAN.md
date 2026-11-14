# CONSULTATION INTEGRATION PLAN — Konsultasi Agama MWCNU Pondok Aren

Tanggal: 2026-11-14 · Phase 0 · Rencana integrasi berdasarkan fakta audit (bukan asumsi)

## 1. Pemetaan kebutuhan → arsitektur

| Kebutuhan modul | Jawaban arsitektur |
|---|---|
| Pemohon anonim + nomor tiket + secret | Entitas baru; akses PENUH lewat **Edge Functions** (service_role internal); secret disimpan sebagai **HMAC-SHA256 (pepper di env functions)**, secret plaintext hanya dikirim sekali ke pemohon |
| RLS semua tabel & anon tidak boleh akses tabel | RLS aktif di semua `consultation_*` **tanpa policy untuk anon/authenticated** (deny by default); service_role menembus RLS hanya di dalam functions |
| Admin/konsultan/reviewer di dashboard | Klien tetap membawa JWT Google staf; functions memvalidasi identitas + role lewat tabel `consultation_staff_roles` (dipetakan dari email JWT) |
| Lampiran privat | Bucket baru **privat** `consultation-attachments`; upload via function (bukan langsung storage); distribusi via signed URL berumur pendek |
| Alur verifikasi→review→jawab | State machine status di DB + validasi transisi di function + log status append-only |
| SLA 3 hari kerja | `consultation_holidays` (kalender libur) + kolom deadline; perhitungan hari kerja di DB/function; **jam operasional tidak dibuat** (belum ditetapkan) |
| Publikasi tanya jawab | `consultation_publications` — snapshot jawaban tersamar + persetujuan pemohon (timestamp persetujuan) + approval reviewer & admin |
| Notifikasi | Email via Resend (kredensial SMTP sudah ada di proyek); WhatsApp **tidak tersedia** — hanya tautan/notifikasi manual |

## 2. Komponen yang DAPAT dipakai ulang

1. `js/config.js` (sumber tunggal kredensial klien), `mwcEsc`, `MWC_RT`.
2. Admin shell: `shell()`, nav bergrup, `toast`, `errMsg`, `formHTML/readForm/validate/bindForm`, `MWCADM` bridge.
3. Design system `admin.css` & pola form/kartu/tabel di `style.css` (portal publik konsultasi memakai bahasa visual sama).
4. Pola migrasi idempotent (`create table if not exists`, `drop policy if exists`) & komentar bahasa Indonesia.
5. Pola pesan status & loading/empty state yang sudah ada di alur KTA.

## 3. Komponen yang HARUS DIBUAT BARU

| Komponen | Alasan |
|---|---|
| `supabase/functions/*` (14–15 functions) + `config.toml` + proses deploy | Edge Functions belum ada sama sekali |
| Secrets Supabase: `CONSULTATION_PEPPER`, `CONSULTATION_RATE_*` | Belum ada secrets functions |
| Bucket privat `consultation-attachments` + policy storage ketat | Bucket `media` publik tak layak |
| 15 tabel `consultation_*` + indeks + constraint + RLS deny-default | Belum ada |
| Tabel rate-limit (mis. `consultation_rate_hits`) atau penyedia eksternal | Tidak ada rate limiting di proyek |
| Portal publik `#konsultasi` (+ sub-halaman hash) | Baru |
| Modul dashboard admin/konsultan/reviewer (tab baru di /admin) | Baru |
| Dokumentasi ERD, dictionary, panduan migrasi, laporan uji | Baru |

## 4. Potensi konflik & keputusan yang diperlukan (HENTI-untuk-setuju)

| # | Konflik | Keputusan yang diminta |
|---|---|---|
| C1 | **Deploy Edge Functions** butuh Supabase CLI/terminal atau Dashboard — seperti SQL, saya tidak punya akses; pengguna harus menjalankan deploy functions | Persetujuan cara deploy (CLI lokal atau dashboard) |
| C2 | **Rate limiting**: Edge Functions tidak punya rate limit bawaan yang memadai untuk brute-force secret | Pilihan: (a) tabel hit di DB lewat function, (b) layanan eksternal (mis. Upstash) — butuh akun. Rekomendasi: (a) agar tanpa dependensi baru |
| C3 | **Email pemohon tanpa verifikasi**: kontak (WA/email) bisa asal — verifikasi kontak OVO? Spesifikasi bilang "minimal satu kontak" tanpa verifikasi | Konfirmasi: cukup validasi format, tanpa verifikasi OTP (rekomendasi sesuai spesifikasi) |
| C4 | **Notifikasi otomatis ke pemohon** (email) — pengiriman email dari function butuh kredensial SMTP di secrets (bukan SMTP Supabase bawaan) | Persetujuan menempatkan kredensial Resend di secrets functions |
| C5 | Penyamaran publikasi: siapa yang menyamarkan (konsultan saat menjawab, atau admin saat mempublikasi) | Usulan: admin konsultasi yang menyamarkan; reviewer memeriksa bentuk samaran |
| C6 | Ukuran/jenis lampiran (maks, mime) | Usulan: ≤ 5 MB, image/* + pdf — setara bucket media |
| C7 | Cron SLA (pengingat tiket terlambat) | Pilihan: pg_cron (perlu diaktifkan di Supabase) atau scheduled function — keputusan Phase 2 |

Tidak ada konflik yang **memblocker** Phase 1 (skema); C1–C7 baru menghentikan di Phase 2.

## 5. Risiko utama integrasi

| Risiko | Mitigasi |
|---|---|
| Menyentuh tabel CMS saat migrasi | Semua DDL baru berprefix `consultation_`; tidak ada ALTER tabel existing (kecuali revoke/grant yang tidak menyentuh hak berjalan) |
| Kebocoran identitas pemohon di arsip publik | Publikasi hanya dari tabel snapshot tersamar; pemohon di tabel transaksional tak pernah di-join ke publik |
| Brute-force secret tiket | Secret ≥ 32 byte acak (CSPRNG) + HMAC + rate limit per-IP/tiket + respons seragam |
| service_role bocor | Hanya di secrets functions; tidak pernah di repo/Vercel/frontend |
| Role CMS bocor ke konsultasi | `consultation_staff_roles` terpisah; jurnalis/ustadz TIDAK otomatis punya akses |
| Regresi situs lama | Portal baru murni tambahan (hash section baru + file JS baru); tidak menyentuh router/file existing kecuali 1 baris menu + include |

## 6. Rekomendasi integrasi (urutan kerja)

1. **Phase 1**: migrasi `consultation_001_foundation` → `002_tables` → `003_security` (RLS deny-default, fungsi hak akses scoped, indeks, constraint) + ERD/dictionary/guide + uji via PGlite lokal.
2. **Phase 2**: functions + secrets + rate limit + transaksi + uji otorisasi.
3. **Phase 3**: dashboard (tab baru di /admin, memakai shell & MWCADM; semua aksi via functions).
4. **Phase 4**: portal publik `#konsultasi` (+ akses tiket & arsip publik).
5. **Phase 5**: uji keamanan/regresi + laporan + keputusan deploy.

Setiap fase berhenti untuk persetujuan; migrasi produksi selalu dijalankan pengguna di SQL Editor.
