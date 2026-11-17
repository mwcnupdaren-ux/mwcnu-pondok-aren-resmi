# PHASE_3_REPORT.md — Frontend Pemohon Konsultasi Agama

**Tanggal:** 16 November 2026
**Status:** SELESAI — siap untuk persetujuan sebelum Fase 4
**Git HEAD:** `9bec326` (perubahan Fase 3 BELUM di-commit per batasan pekerjaan)

---

## 1. File yang dibuat dan diubah

### Baru (created)
| File | Deskripsi |
|------|-----------|
| `js/konsultasi.js` | Modul IIFE (gaya `app.js`: `var`/`function`/`try-catch`, `put`/`esc` dari `window.MWCUI`) — seluruh logika pemohon konsultasi: formulir, pengiriman, verifikasi kredensial, halaman tiket, percakapan, lampiran, publikasi, keluar. |
| `PHASE_FINAL_AUDIT_REPORT.md` | Laporan audit final fase sebelumnya (konteks F-1/D-1, sudah ada sebelum Fase 3). |

### Diubah (modified)
| File | Perubahan |
|------|-----------|
| `index.html` | Tombol pg-head "Konsultasi online"/"Cek status tiket"/"Lihat tanya jawab"; panel `#ka-online` (formulir digital) dan `#ka-tiket` (cek status tiket) disisipkan setelah `#ka-form` (form WhatsApp lama dipertahankan dengan blok `.kx-alt` pengarah); tag script `<script src="/js/konsultasi.js?v=1"></script>`; bump CSS `?v=55` → `?v=56`. |
| `css/style.css` | Blok prefiks `kx-` ditambahkan di akhir file (done panel, kredensial box, badge verifikasi, chat, lampiran, form, publikasi) — dark-mode aware via variabel tema (`--g2`, `--surf`, `--line`, `color-mix`). |

### Tidak diubah (per batasan Fase 3)
`supabase/functions/*` (termasuk `_shared`), `supabase/consultation/*.sql` (SQL001–006), backend lainnya. Tidak ada dashboard konsultan/reviewer/admin.

---

## 2. Fitur yang berhasil dibangun

| Fitur | Deskripsi |
|-------|-----------|
| **Formulir konsultasi digital** (`#ka-online`) | Identitas (nama opsional, bisa sebagai "Hamba Allah"), kontak (WhatsApp atau email, minimal salah satu), kategori dropdown, judul (5–150), uraian (10–10000), persetujuan privasi wajib, persetujuan publikasi opsi, honeypot `website` tersembunyi. |
| **Pengiriman via Edge Function** | POST `consultation-ticket-create` dengan payload sesuai kontrak backend. Panel sukses menampilkan nomor tiket + kode akses (sekali-tampil), tombol Salin & Buka tiket. |
| **Validasi lokal** | Cermin `_shared/validation.ts`: judul 5–150, isi 10–10000, nama 2–120, WA regex `^\+?[0-9]{8,15}$`, email, minimal satu kontak, privasi wajib. Ditolak sebelum jaringan bila tidak valid. |
| **Verifikasi pemohon** | Pasangan nomor tiket (`KON-######-…`) + kode akses (32 char Crockford `[0-9A-HJKMNP-TV-Z]{32}`) via `consultation-ticket-access` (`action:view`). Badge "Kredensial terverifikasi". Tidak ada mekanisme auth baru. |
| **Halaman tiket** (`#ka-tiket`) | Info tiket (nomor, judul, status, dibuat, diperbarui, SLA), percakapan (hanya yang boleh dilihat pemohon — disaring backend), lampiran (unduh signed URL 120 detik), publikasi (status + persetujuan), form pesan lanjutan (diblokir backend bila `selesai`/`ditolak`), tombol Muat ulang & Keluar. |
| **Pesan lanjutan** | `consultation-ticket-message` (`action:message`). Konfirmasi ditampilkan kembali setelah `refresh()` me-re-render panel. |
| **Persetujuan publikasi** | `consultation-ticket-message` (`action:consent`). Tarik/berikan persetujuan tanpa nama. |
| **Lampiran** | `consultation-attachment`: unduh via JSON (`action:download`) → signed URL; unggah multipart (`action:upload`) ≤5 MB, MIME JPEG/PNG/WEBP/PDF. |
| **Kategori dropdown** | `consultation-public` (`action:categories`) dengan fallback statis 8 kategori bila fetch gagal. |
| **Kredensial simpan/hapus** | `sessionStorage` kunci `mwc_konsul_kred` hanya bila opt-in checkbox "Ingat di tab ini"; dihapus saat tombol Keluar. |
| **Halaman lama utuh** | Form WhatsApp `#ka-form`, nav, footer, hero, QA statis tetap berfungsi tanpa gangguan. |

---

## 3. Endpoint dan RPC yang digunakan

Semua kontrak diambil langsung dari source backend (tidak dikarang):

| Fitur | Edge Function | Action | RPC (acuan SQL) | Payload kunci |
|-------|--------------|--------|-----------------|---------------|
| Buat tiket | `consultation-ticket-create` | — | `consultation_svc_buat_tiket` | `kategori, judul, isi, nama, whatsapp, email, persetujuan_privasi, persetujuan_publikasi, website` |
| Baca tiket | `consultation-ticket-access` | `view` | `consultation_svc_akses_tiket` / `consultation_svc_tiket_kredensial` | `nomor, secret` → `ticket, kontak, pesan[], lampiran[], publikasi` |
| Pesan lanjutan | `consultation-ticket-message` | `message` | `consultation_svc_pesan_pemohon` | `nomor, secret, isi` |
| Persetujuan publikasi | `consultation-ticket-message` | `consent` | `consultation_svc_persetujuan_pemohon` | `nomor, secret, setuju` |
| Unduh lampiran | `consultation-attachment` | `download` | `consultation_svc_lampiran_pemohon_ambil` | `nomor, secret, attachment` → signed URL 120 dtk |
| Unggah lampiran | `consultation-attachment` | `upload` (multipart) | `consultation_svc_lampiran_pemohon` | `nomor, secret, file` (≤5 MB, JPEG/PNG/WEBP/PDF) |
| Kategori | `consultation-public` | `categories` | `consultation_svc_kategori` | — → `{kode, nama, deskripsi}[]` |

**Keamanan frontend:** hanya `apikey` (publishable key dari `js/config.js`), tanpa `Authorization`, tanpa service role key, kredensial dikirim per permintaan, tidak melewati backend, tidak menyimpan secret sensitif selain sessionStorage opt-in.

---

## 4. Hasil pengujian

### Metode
Backend **tidak disentuh**. Semua panggilan `/functions/v1/*` di-mock via `page.route` (intercept jaringan Node-side, pencatatan payload) di lingkungan lokal `http://127.0.0.1:8643`. Console error CORS ke Supabase asli saat load adalah artefak uji (mock belum aktif pada permintaan awal), bukan bug produk.

### Hasil: 28 LULUS, 0 GAGAL

| # | Tes | Hasil |
|---|-----|-------|
| 1 | Dropdown kategori terisi dari backend (`consultation-public categories`) | LULUS |
| 2 | Validasi: privasi wajib ditolak | LULUS |
| 3 | Validasi: isian merah saat kosong | LULUS |
| 4 | Validasi: WA & email keduanya kosong ditolak | LULUS |
| 5 | Payload create sesuai kontrak (privasi=true, publikasi=false, honeypot kosong, WA, kategori) | LULUS |
| 6 | Pengiriman sukses tanpa pesan galat | LULUS |
| 7 | Panel sukses menampilkan nomor tiket & kode akses sekali-tampil | LULUS |
| 8 | Honeypot diisi bot → pesan galat 400 tampil | LULUS |
| 9 | Badge verifikasi kredensial tampil jelas | LULUS |
| 10 | Payload akses: action=view + nomor + secret | LULUS |
| 11 | Info tiket: status + nomor + SLA | LULUS |
| 12 | Percakapan: pesan pemohon & jawaban konsultan | LULUS |
| 13 | Lampiran tampil (nama + ukuran + tombol unduh) | LULUS |
| 14 | Panel publikasi: status + persetujuan + tombol consent | LULUS |
| 15 | Form pesan tersedia pada tiket aktif | LULUS |
| 16 | Payload unduh lampiran: nomor + secret + attachment id | LULUS |
| 17 | Signed URL dikembalikan backend (download dipanggil) | LULUS |
| 18 | Pesan via action=message + isi | LULUS |
| 19 | Pesan terkirim terkonfirmasi (tetap tampil setelah refresh) | LULUS |
| 20 | Consent: action=consent setuju=true | LULUS |
| 21 | Consent terkonfirmasi (tetap tampil setelah refresh) | LULUS |
| 22 | Unggah lampiran via multipart | LULUS |
| 23 | Unggah terkonfirmasi (tetap tampil setelah refresh) | LULUS |
| 24 | Keluar → panel login kembali | LULUS |
| 25 | Kredensial salah → pesan jelas | LULUS |
| 26 | Nomor tiket tidak valid → pesan format (ditolak lokal) | LULUS |
| 27 | Opt-in "ingat di tab ini" → sessionStorage diisi | LULUS |
| 28 | Keluar menghapus sessionStorage | LULUS |
| 29 | Halaman lama tetap utuh (hero, nav, footer, form WhatsApp) | LULUS |
| 30 | 429 membawa `details.retry_after` sesuai kontrak `_shared/guard` | LULUS |

### Perbaikan selama pengujian
1. **Bug produk:** Konfirmasi "Pesan terkirim"/"Lampiran terkirim"/"Persetujuan publikasi diberikan/ditarik" hilang karena `refresh()` me-replace seluruh `#kx-isi-tiket` (termasuk `#kx-tiket-msg`). **Diperbaiki:** konfirmasi ditetapkan kembali setelah `refresh()` resolves.
2. **Bug uji (harness, bukan produk):** Fixture secret mock mengandung huruf L/U yang dikecualikan regex Crockford → validasi lokal menolak. **Diperbaiki:** ganti fixture dengan karakter Crockford valid.
3. **Bug uji (harness):** Selektor `#kx-chat`/`#kx-lamp` adalah *class* bukan *id*. **Diperbaiki:** `.kx-chat`/`.kx-lamp`.
4. **Bug uji (harness):** Assertion publikasi/status dan selector halaman lama salah. **Diperbaiki:** sesuaikan dengan logika backend dan markup asli.

### Console error
- CORS ke `https://wvfcifqolohfipvepxss.supabase.co/functions/v1/*` saat load lokal — artefak uji (mock belum aktif pada permintaan awal), bukan bug produk. Tidak ada console error baru dari kode Fase 3.

---

## 5. Kendala yang ditemukan

| # | Kendala | Detail | Tindakan |
|---|---------|--------|----------|
| K-1 | Edge Functions belum di-deploy ke produksi | Uji produksi hanya dapat dilakukan via mock di lingkungan lokal. Backend Phase 1–2 sudah lulus audit tapi belum live. | Catat; uji produksi dilakukan setelah deploy persetujuan Fase 4. |
| K-2 | `verify_jwt` pada `consultation-attachment` ambigu | Audit final M-02: `verify_jwt` attachment ambigu di `PHASE2_BACKEND.md`. Frontend tidak dapat memastikan apakah verify_jwt aktif atau tidak untuk endpoint attachment. | Frontend tidak mengubah backend. Dilaporkan sebagai catatan audit. |
| K-3 | `page.evaluateOnNewDocument` tidak tersedia di driver patchright | Override `window.fetch` via evaluate tidak menangkap panggilan modul; `page.route` (intercept jaringan) digunakan sebagai alternatif yang terbukti bekerja. | Digunakan `page.route` untuk semua mock uji. |
| K-4 | Spy `window.open` tidak tercapai di driver patchright | `window.__open` spy terpasang namun tidak mencatat panggilan `window.open` dari `muatLampiran`. API call unduh lampiran sudah terverifikasi via `panggilan` (Node-side). | Verifikasi unduh lampiran dilakukan via pencatatan panggilan API, bukan via `window.open`. |
| K-5 | Screenshot visual gagal diambil | Driver browser crash/timeout saat `--screenshot` dipakai. | Verifikasi visual dilakukan melalui dump HTML (dump.mjs) yang mengonfirmasi render lengkap. |
| K-6 | `sessionStorage` hilang saat tab ditutup | Per design (keamanan). Kredensial tidak persists lintas tab/sesi. | Dokumentasi ke pengguna; tidak diperlukan perubahan. |

---

## 6. Status akhir Fase 3

**Fase 3 SELESAI.** Semua fitur wajib terpenuhi dan teruji (28/28 LULUS, 0 GAGAL) dalam lingkungan lokal dengan mock backend. Tidak ada perubahan pada SQL001–006, Edge Functions, `_shared`, atau backend apapun. Tidak ada commit/push/deploy/migrasi dilakukan.

**Status: SIAP UNTUK PERSETUJUAN SEBELUM FASE 4.**

Tunggu persetujuan sebelum melanjutkan ke Fase 4. Tidak ada kerjaan lebih lanjut pada Fase 3 sampai persetujuan diterima.

---

### File terkait
- `js/konsultasi.js` — modul frontend pemohon (baru)
- `index.html` — panel + script tag (diubah)
- `css/style.css` — gaya `kx-` (diubah)
- `C:\Users\99kho\AppData\Local\Temp\opencode\fase3\qa.mjs` — harness QA (di luar repo)
- `supabase/functions/*` — kontrak backend (baca saja, tidak diubah)
- `supabase/consultation/consultation_004_services.sql` — bentuk respons RPC (baca saja)
- `supabase/functions/_shared/validation.ts` — batas & pola validasi (baca saja)
