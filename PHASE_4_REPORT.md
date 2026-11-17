# PHASE_4_REPORT.md — Frontend Petugas Konsultasi (Konsultan, Reviewer, Admin)

**Tanggal:** 17 November 2026
**Status:** SELESAI — berhenti menunggu persetujuan
**Git HEAD:** `9bec326` (perubahan Fase 4 BELUM di-commit, sesuai batasan pekerjaan)

---

## 1. Pemeriksaan awal (kontrak backend dipetakan dari source, bukan karangan)

Sebelum implementasi, dibaca penuh: SQL001–006 (versi final tiap RPC ditetapkan dari
SQL004/005 untuk layanan daftar-detail-riwayat, dan SQL006 untuk `jawab`, `pesan_staf`,
`review`, `status`, serta seluruh RPC publikasi), seluruh Edge Functions petugas
(`consultation-consultant`, `consultation-review`, `consultation-admin`,
`consultation-publication`, `consultation-attachment`), modul `_shared`
(`auth.ts`, `validation.ts`, `guard.ts`), `PHASE_3_REPORT.md`, dan pola UI yang ada
(`admin/admin.js` + `admin.css` untuk pola login OAuth & shell, `js/konsultasi.js`
untuk gaya modul pemohon).

Kesimpulan kontrak yang menentukan implementasi:

- **Autentikasi staf** (`_shared/auth.ts`): `Authorization: Bearer <JWT GoTrue>` di atas
  `apikey`; verifikasi ke GoTrue; peran diambil dari DB `consultation_svc_peran(email)`
  → `consultation_staff_roles.role_konsultasi` (`admin_konsultasi` / `konsultan` /
  `reviewer`). Role dari browser TIDAK PERNAH dipakai.
- **Batas isi** (`_shared/validation.ts`): jawaban/isi 10–10000, judul publik 5–200,
  pertanyaan samar 10–5000, jawaban final 10–20000, catatan review 3–2000,
  alasan 3–1000, slug `^[a-z0-9-]{6,120}$`.
- **Alur status** (9 status): baru → diverifikasi → menunggu_penugasan → ditugaskan →
  (menunggu_informasi ⇄) → menunggu_review → terjawab → selesai; ditolak kapan pun via
  admin. Jawaban konsultan SELALU masuk `menunggu_review`; dari `menunggu_review`
  transisi hanya lewat keputusan reviewer (SQL006 `consultation_svc_status`).
- **Publikasi** (SQL006): propose (admin) → approve (reviewer & admin, terpisah) →
  publish (admin, slug) — terbit hanya bila 3 persetujuan (pemohon, reviewer, admin)
  berlaku untuk `content_revision` saat ini + persetujuan eksplisit kontak pemohon;
  revisi konten menimpa revision dan mengosongkan semua stamp; `withdraw` menghapus
  SEMUA stamp + menandai `dicabut`.

---

## 2. File yang dibuat dan diubah

### Baru (created)
| File | Deskripsi |
|------|-----------|
| `konsultasi-staf.html` | Halaman staf terpisah (tidak menimpa CMS `/admin`): `noindex`, memuat `js/config.js`, `js/vendor/supabase.js`, `admin/admin.css?v=4` (reuse penuh, tanpa mengubahnya), `js/konsultasi-staf.js?v=1`. |
| `js/konsultasi-staf.js` | Modul IIFE (gaya `admin.js`/`app.js`: `var`/`function`, `window.mwcEsc`): login Google OAuth, deteksi peran dari backend, shell + hash routing, tiga dasbor per peran, penanganan 401/403/429. |
| `PHASE_4_REPORT.md` | Laporan ini. |

### Diubah (modified)
Tidak ada. SQL001–006, Edge Functions, `_shared`, CMS admin, dan frontend pemohon
Fase 3 tidak disentuh (satu perbaikan bug nyata di fase pengujian disebut di §6).

### Harness QA (di luar repo)
`C:\Users\99kho\AppData\Local\Temp\opencode\fase4\qa-staf.mjs` — mock via `page.route`
backend nyata tidak disentuh; sesi staf di-mock lewat `localStorage`
`sb-<ref>-auth-token` (bentuk sesi supabase-js asli), jalur `auth/v1` diblok.

---

## 3. Fitur per peran

### 3.1 Dasbor Konsultan (`consultation-consultant`)
- **Daftar tiket kewenangan**: `action:list` (respons `{peran, tiket[]}`), filter status
  (`ditugaskan`, `menunggu_informasi`, `menunggu_review`, `terjawab`) + pagination
  limit/offset; tiap baris menampilkan nomor, judul, chip status, chip SLA
  (merah bila deadline terlewati).
- **Detail + riwayat percakapan**: `action:detail` → info tiket (judul, uraian
  pertanyaan, status, SLA, alasan penolakan bila ada), riwayat penugasan &
  review, percakapan lengkap — catatan internal ditandai
  **"internal — tidak terlihat pemohon"** (`terlihat_pemohon:false`).
- **Lampiran yang diizinkan**: unduh via `consultation-attachment`
  `{action:'download', attachment:<uuid>}` (tanpa `nomor` → jalur staf,
  kewenangan ditegakkan `consultation_svc_lampiran_staf_ambil`; signed URL 120 dtk).
- **Susun jawaban final**: form hanya aktif saat status `ditugaskan` atau
  `menunggu_informasi` (cermin aturan SQL006; resume dari jeda ditangani backend);
  validasi lokal 10–10000; hasil `{message_id, status:'menunggu_review'}` — UI
  selalu menyatakan jawaban masuk antrean review.
- **Catatan internal**: `action:message` → `svc_pesan_staf` dengan
  `catatan_internal` + `p_terlihat:false` (konsultan hanya boleh internal).
- **Status & riwayat**: chip status, SLA, penugasan, dan review tampak pada detail.

### 3.2 Dasbor Reviewer (`consultation-review`)
- **Antrean**: `action:list` — backend selalu membatasi pada tiket
  `menunggu_review`.
- **Baca pertanyaan + jawaban**: `action:detail` → pertanyaan pemohon, seluruh
  pesan, dan jawaban konsultan terbaru (penanda "jawaban konsultan").
- **Keputusan**: `action:decide` — **Setujui** (`disetujui`) atau **Minta revisi**
  (`minta_revisi` + catatan wajib 3–2000, divalidasi lokal sebelum jaringan);
  `p_message` = ID jawaban konsultan terbaru; keputusan append-only, hasil
  `{review_id, keputusan, status}` → tiket jadi `terjawab` atau kembali
  `ditugaskan`.
- **Status hasil review**: riwayat keputusan dirender dari `review[]` pada detail.

### 3.3 Dasbor Admin Konsultasi (`consultation-admin` + `consultation-publication`)
- **Daftar + filter status** (9 status), **Pemantauan SLA** (`action:sla` → semua
  tiket aktif + tanda `terlambat`).
- **Detail**: kontak pemohon (nama/WA/email/`persetujuan_publikasi` — hanya admin
  yang menerima `kontak` dari backend), pertanyaan, percakapan (termasuk internal,
  ditandai), penugasan, review, riwayat (`action:history` → log status + audit).
- **Aksi**: Verifikasi; Tolak (alasan 3–1000 wajib); Tugaskan (email konsultan,
  validasi email lokal); Lepas penugasan (alasan wajib); Ubah status
  (dropdown 9 status + alasan opsional); Kirim pesan — checkbox
  "Terlihat pemohon" (tanpa tanda = `catatan_internal` default `internal:true`;
  dengan tanda = `jawaban_final`, dibatasi backend pada status
  `terjawab`/`selesai` + jawaban terbaru disetujui reviewer).
- **Publikasi** (endpoint `consultation-publication`, area khusus admin):
  daftar kandidat (tiket `terjawab`/`selesai` via `consultation-admin list`);
  panel status publikasi (slug, TERBIT/DICABUT/BELUM TERBIT, 3 stamp persetujuan,
  alasan pencabutan); **Ajukan/perbarui konten** (`propose`: judul 5–200,
  pertanyaan samar 10–5000, jawaban final 10–20000 — diberi peringatan bahwa
  pembaruan mengosongkan stamp persetujuan); **Setujui/tarik (admin)**
  (`approve {setuju}`); **Terbitkan** (`publish`, slug tervalidasi lokal
  `^[a-z0-9-]{6,120}$`); **Cabut** (`withdraw`, alasan wajib — peringatan bahwa
  semua stamp dikosongkan dan perlu pengajuan + persetujuan ulang).

### 3.4 Reviewer — persetujuan publikasi
Endpoint `approve` menerima reviewer, jadi area `#publikasi` untuk reviewer
menyediakan pencarian status per ID tiket (`action:status`, dipangkas ke
`{ticket, publikasi}`) serta Setujui/Tarik persetujuan reviewer. **Keterbatasan
backend**: daftar kandidat publikasi hanya tersedia bagi admin (daftar reviewer
selalu `menunggu_review`) — dicatat sebagai hambatan H-2, disediakan input ID
manual memakai endpoint resmi, bukan jalur alternatif.

---

## 4. Endpoint dan RPC yang digunakan

| Fitur UI | Edge Function + `action` | RPC (referensi SQL) |
|----------|--------------------------|---------------------|
| Daftar tiket konsultan | `consultation-consultant:list` | `consultation_svc_staf_daftar` (SQL004) |
| Detail konsultan | `consultation-consultant:detail` | `consultation_svc_staf_detail` (SQL004) |
| Jawaban final konsultan | `consultation-consultant:answer` | `consultation_svc_jawab` (SQL006) |
| Catatan internal konsultan | `consultation-consultant:message` | `consultation_svc_pesan_staf` (SQL006, `catatan_internal`, `p_terlihat:false`) |
| Antrean reviewer | `consultation-review:list` | `consultation_svc_staf_daftar` (SQL004) |
| Detail review | `consultation-review:detail` | `consultation_svc_staf_detail` (SQL004) |
| Keputusan review | `consultation-review:decide` | `consultation_svc_review` (SQL006) |
| Daftar/sla/riwayat admin | `consultation-admin:list` / `sla` / `history` | `consultation_svc_staf_daftar` / `svc_sla` / `svc_staf_riwayat` (SQL004) |
| Detail admin | `consultation-admin:detail` | `consultation_svc_staf_detail` (SQL004; `kontak` hanya admin) |
| Verifikasi / Tolak | `consultation-admin:verify` / `reject` | `consultation_svc_verifikasi` / `svc_tolak` (SQL004) |
| Tugaskan / Lepas | `consultation-admin:assign` / `release` | `consultation_svc_tugaskan` / `svc_lepas` (SQL004) |
| Ubah status | `consultation-admin:status` | `consultation_svc_status` (SQL006) |
| Pesan admin / jawaban final | `consultation-admin:message` | `consultation_svc_pesan_staf` (SQL006; `internal` default `true`) |
| Ajukan publikasi | `consultation-publication:propose` | `consultation_svc_ajukan_publikasi` (SQL006) |
| Setujui publikasi | `consultation-publication:approve` | `consultation_svc_setujui_publikasi` (SQL006; reviewer & admin) |
| Terbitkan | `consultation-publication:publish` | `consultation_svc_terbitkan` (SQL006) |
| Cabut publikasi | `consultation-publication:withdraw` | `consultation_svc_cabut_publikasi` (SQL006) |
| Status publikasi | `consultation-publication:status` | `consultation_svc_staf_detail` (SQL004, dipangkas UI) |
| Unduh lampiran staf | `consultation-attachment` JSON `{action:'download', attachment}` | `consultation_svc_lampiran_staf_ambil` (SQL006) |

Semua panggilan membawa `apikey` **dan** `Authorization: Bearer <access_token>`;
tidak ada RPC dipanggil langsung dari frontend — semua lewat Edge Function resmi.

---

## 5. Hasil pengujian

### 5.1 Uji mock (backend tidak disentuh — server Supabase produksi TIDAK terhubung)
Backend belum di-deploy, sehingga seluruh pengujian berjalan terhadap mock
`page.route` di `http://127.0.0.1:8643` (server statis lokal), mencakup simulasi
per-peran, akses ilegal, dan galat HTTP. **Hasil: 56 LULUS, 0 GAGAL.**

| Kelompok | Cakupan | Hasil |
|----------|---------|-------|
| A. Boot & kontrol akses (9) | Layar login saat tanpa sesi; noindex; deteksi peran dari backend (konsultan → reviewer → admin, via urutan `list` resmi); Bearer+apikey pada tiap panggilan; akun bukan staf (403 semua endpoint) → layar "Akses ditolak" dengan email; 401 → layar "Sesi Anda kedaluwarsa. Silakan masuk kembali." | 9/9 LULUS |
| B. Konsultan (12) | Daftar + chip status/SLA; filter status → `p_status` terkirim; detail (pertanyaan, percakapan, penugasan); form jawaban hanya saat `ditugaskan`; jawaban <10 karakter ditolak lokal tanpa panggilan; payload `answer` `{ticket, isi}` → konfirmasi menunggu review; catatan internal `action:message`; unduh lampiran staf `{action:'download', attachment}` **tanpa nomor/secret** + konfirmasi; **tiket tak berwenang (403 backend) → pesan "Tidak berwenang atas tiket ini"** | 12/12 LULUS |
| C. Reviewer (7) | Antrean `menunggu_review`; detail (pertanyaan + jawaban konsultan); minta revisi tanpa catatan ditolak lokal; payload `decide` `disetujui` `{ticket, message, keputusan}`; konfirmasi; `minta_revisi` membawa `catatan` wajib | 7/7 LULUS |
| D. Admin (16) | Daftar + filter status; SLA tiket `terlambat` bertanda merah; detail dengan kontak pemohon; percakapan menandai internal; riwayat status+audit; verifikasi (`{ticket}`); tolak (alasan wajib); assign (email invalid ditolak lokal, valid → payload email); release (alasan); ubah status (+alasan); pesan internal default `internal:true`; jawaban final `internal:false` | 16/16 LULUS |
| E. Publikasi admin (9) | Daftar kandidat terjawab; panel 3 stamp persetujuan; payload `propose` (judul/pertanyaan_samar/jawaban_final); approve admin `setuju:true`; slug invalid ditolak lokal; `publish` slug valid; konfirmasi TERBIT; `withdraw` dengan alasan; status DICABUT | 9/9 LULUS |
| F. Publikasi reviewer (3) | Area persetujuan publikasi reviewer; `approve` `setuju:true`; status publikasi per tiket | 3/3 LULUS |

Perbaikan yang muncul dari uji (bug nyata, bukan perubahan fitur):
1. **`pasangLampiran()` tidak dipanggil di detail konsultan** — tombol unduh
   lampiran pada dasbor konsultan tanpa handler. Diperbaiki di
   `js/konsultasi-staf.js` (hanya berkas Fase 4).

Perbaikan harness (bukan produk): mock `consultation-admin:detail` tertimpa di
pengujian A9 lalu dipulihkan; `#p-jf` diisi pada uji propose (validasi jawaban
final memang wajib — perilaku produk benar); verifikasi unduh lampiran via
panggilan API + toast karena spy `window.open` di driver berjalan di isolated
world (keterbatasan driver, sama seperti Fase 3).

### 5.2 Regresi frontend pemohon & situs lama
`qa.mjs` Fase 3 dijalankan ulang tanpa perubahan: **31 LULUS, 0 GAGAL** —
formulir digital, verifikasi kredensial, halaman tiket, percakapan, lampiran,
publikasi pemohon, serta halaman lama (hero, nav 20 tautan, footer, form
WhatsApp) tetap berfungsi. `node --check` lulus untuk `js/konsultasi-staf.js`.

### 5.3 Uji dengan backend nyata
**Belum dilakukan** — Edge Functions & SQL001–006 belum di-deploy/migrasi (dilarang
oleh batasan pekerjaan). Rencana saat di-deploy: login Google dengan akun yang
terdaftar di `consultation_staff_roles`, uji alur penuh satu tiket
(verifikasi → tugaskan → jawab → review → terjawab → jawaban final → publikasi →
cabut), lalu uji 403 antar-role dengan akun peran berbeda.

### 5.4 Visual
Screenshot halaman login staf berhasil diambil (kartu "Staf Konsultasi" +
tombol Google, gaya `admin.css`); screenshot dasbor dalam sesi memerlukan state
mock sehingga diverifikasi lewat asersi teks per layan pada §5.1.

---

## 6. Temuan keamanan dan kendala

### Keamanan (dipatuhi, diverifikasi uji)
- Peran HANYA dari backend: deteksi peran memakai respons `data.peran` dari
  `list` Edge Function (hasil `consultation_svc_peran`), bukan klaim browser;
  setiap aksi tetap divalidasi ulang backend (uji B12: 403 tampil apa adanya).
- Tanpa service role key; hanya `apikey` publishable + `Bearer` access_token.
- Tanpa jalur RPC alternatif; tanpa `consultation_svc_*` dipanggil langsung.
- Sesi kedaluwarsa (401) → layar masuk ulang; akses ditolak (403) → pesan jelas
  dari backend; 429 → pesan memuat `details.retry_after`.
- Catatan internal selalu ditandai dan tidak pernah dikirim sebagai pesan publik.

### Kendala / hambatan (backend tidak diubah sepihak)
| # | Kendala | Dampak | Tindakan UI |
|---|---------|--------|-------------|
| H-1 | **Tidak ada RPC staf yang mengembalikan daftar lampiran per tiket.** `consultation_svc_staf_detail` tidak menyertakan lampiran; daftar lampiran hanya ada di jalur pemohon (`consultation_svc_akses_tiket` dengan nomor+secret). Staf hanya bisa mengunduh lampiran bila sudah mengetahui UUID-nya (`consultation_svc_lampiran_staf_ambil`). | Staf tidak dapat menelusuri lampiran unggahan pemohon dari UI. | Panel "Lampiran" menyediakan unduh per-ID memakai endpoint resmi + catatan kendala; kebutuhan daftar lampiran dicatat untuk fase backend berikutnya. |
| H-2 | Daftar kandidat publikasi hanya diberikan kepada admin (`list` reviewer selalu `menunggu_review`; `detail` reviewer terbatas status). | Reviewer tidak melihat daftar tiket siap disetujui publikasi. | Area publikasi reviewer memakai pencarian per-ID tiket (endpoint `status` + `approve` resmi). |
| H-3 | Backend belum di-deploy ke produksi. | Uji backend nyata tertunda. | Dijadwalkan setelah persetujuan deploy (§5.3). |
| H-4 | Driver uji (patchright) berjalan `evaluate` di isolated world: spy `window.open`/global halaman tidak teramati; `page.evaluateOnNewDocument` tidak ada. | Verifikasi pembukaan signed URL dilakukan lewat panggilan API + toast, bukan observasi tab baru. | Dicatat; tidak memengaruhi produk. |

---

## 7. Status akhir Fase 4

**Fase 4 SELESAI.** Ketiga dasbor petugas (konsultan, reviewer, admin konsultasi +
publikasi) dibangun di atas kontrak backend yang ada tanpa perubahan backend;
56/56 uji mock lulus, regresi Fase 3 31/31 lulus, satu bug produk ditemukan dan
diperbaiki (handler unduh lampiran konsultan). Tidak ada commit, push, deploy,
atau migrasi database yang dilakukan.

**Status: BERHENTI — menunggu persetujuan untuk pekerjaan berikutnya** (antara
lain: keputusan atas hambatan H-1/H-2, deploy backend, lalu uji backend nyata).

### File terkait
- `konsultasi-staf.html` — halaman staf (baru)
- `js/konsultasi-staf.js` — modul dasbor petugas (baru)
- `admin/admin.css` — dipakai ulang apa adanya (tidak diubah)
- `supabase/functions/*`, `supabase/consultation/*.sql` — kontrak (baca saja)
- `C:\Users\99kho\AppData\Local\Temp\opencode\fase4\qa-staf.mjs` — harness QA Fase 4 (di luar repo)
