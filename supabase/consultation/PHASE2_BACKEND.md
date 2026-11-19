# Phase 2 — Backend Services (Supabase Edge Functions)

**Status:** diimplementasikan **lokal** dan sudah di-commit serta di-push ke
branch `main`. **BELUM di-deploy**, dan **tidak ada migrasi produksi** yang
dijalankan. Perbaikan test runner dan script `test:shared` sudah di-commit
(`0437ac5`); perubahan lain masih berada di working tree lokal dan belum
di-commit. Dokumen ini adalah kontrak teknis untuk audit sebelum deploy.

- Database: `supabase/consultation/consultation_004_services.sql` (RPC layanan)
- HTTP: `supabase/functions/consultation-*/index.ts` (9 Edge Function)
- Shared: `supabase/functions/_shared/*.ts`
- Uji: `supabase/consultation/tests/test-shared.mjs` (unit) dan
  `tests/test-konsultasi.mjs` (integrasi PGlite) — lihat `PHASE2_TEST_RESULTS.md`

---

## 1. Prinsip Arsitektur

1. **Aturan bisnis di database, HTTP hanya pembungkus tipis.**
   Edge Function memverifikasi identitas, memvalidasi input, menegakkan
   rate-limit, lalu memanggil satu RPC `consultation_svc_*`. Operasi
   multi-tabel (tiket + kontak + kredensial + audit) berjalan dalam SATU
   transaksi di dalam RPC, sehingga tidak ada state setengah jadi.
2. **Tidak ada akses tabel langsung.** Semua RPC adalah `SECURITY INVOKER`
   dan hanya di-`grant` ke `service_role`. `anon`/`authenticated` tidak punya
   hak tabel maupun hak eksekusi RPC.
3. **Identitas tidak pernah dari body.** Email staf berasal dari JWT yang
   diverifikasi GoTrue (`auth.getUser`); role berasal dari tabel
   `consultation_staff_roles`; aktor audit ditetapkan ulang oleh
   `consultation_set_aktor()` di dalam transaksi mutasi.
4. **Rahasia tidak pernah dicatat.** Secret tiket hanya ada sebagai plaintext
   sekali di respons pembuatan tiket; database menyimpan HMAC-SHA256(secret,
   pepper). Log/audit menyamarkan email, nomor HP, dan token.

---

## 2. Struktur Direktori

```
supabase/
├─ functions/
│  ├─ package.json                     # penanda ESM untuk uji Node (bukan runtime)
│  ├─ verify-nia/index.ts              # fungsi existing (tidak diubah)
│  ├─ _shared/
│  │  ├─ config.ts                     # env + allowlist origin
│  │  ├─ bootstrap.ts                  # muat config / balas 500 aman
│  │  ├─ errors.ts                     # AppError, pemetaan error DB -> HTTP aman
│  │  ├─ validation.ts                 # validator input (batas = constraint DB)
│  │  ├─ secret.ts                     # secret tiket + HMAC + hash klien
│  │  ├─ ratelimit.ts                  # kebijakan + limiter memori (cadangan)
│  │  ├─ guard.ts                      # rate-limit persisten (RPC) + fallback
│  │  ├─ http.ts                       # CORS, JSON, batas body, serve()
│  │  ├─ db.ts                         # klien RPC PostgREST + Storage + GoTrue
│  │  ├─ auth.ts                       # verifikasi JWT + role dari DB
│  │  ├─ audit.ts                      # redaksi + audit peristiwa keamanan
│  │  └─ types.ts                      # tipe bersama
│  ├─ consultation-public/index.ts
│  ├─ consultation-ticket-create/index.ts
│  ├─ consultation-ticket-access/index.ts
│  ├─ consultation-ticket-message/index.ts
│  ├─ consultation-admin/index.ts
│  ├─ consultation-consultant/index.ts
│  ├─ consultation-review/index.ts
│  ├─ consultation-publication/index.ts
│  └─ consultation-attachment/index.ts
└─ consultation/
   ├─ consultation_001_foundation.sql
   ├─ consultation_002_tables.sql
   ├─ consultation_003_security.sql
   ├─ consultation_004_services.sql    # FASE 2
   ├─ consultation_rollback.sql
   └─ tests/
      ├─ test-konsultasi.mjs            # integrasi DB (PGlite)
      └─ test-shared.mjs                # unit modul _shared (Node)
```

Tidak ada helper duplikat: CORS, error, validasi, secret, rate-limit, akses DB,
autentikasi, dan audit masing-masing punya satu modul di `_shared/`.

---

## 3. Daftar Fungsi & Aksi

| # | Edge Function | Auth | Aksi |
|---|---|---|---|
| 1 | `consultation-public` | anonim | `list`, `detail`, `categories` |
| 2 | `consultation-ticket-create` | anonim | — (buat tiket) |
| 3 | `consultation-ticket-access` | kredensial tiket | `view`, `lampiran` |
| 4 | `consultation-ticket-message` | kredensial tiket | `message`, `consent` |
| 5 | `consultation-admin` | JWT + `admin_konsultasi` | `list`, `detail`, `history`, `sla`, `verify`, `reject`, `assign`, `release`, `status`, `message` |
| 6 | `consultation-consultant` | JWT + `konsultan` | `list`, `detail`, `answer`, `message` |
| 7 | `consultation-review` | JWT + `reviewer` | `list`, `detail`, `decide` |
| 8 | `consultation-publication` | JWT + staf | `propose`, `approve`, `publish`, `withdraw`, `status` |
| 9 | `consultation-attachment` | kredensial tiket / JWT | unggah (multipart), unduh (JSON) |

Semua endpoint menerima **POST** (dan `OPTIONS` untuk preflight). GET ditolak
405 agar tidak ada pembacaan via URL/cache/CDN.

---

## 4. Kontrak API

**Konvensi**

- Base: `https://<project>.supabase.co/functions/v1/<nama-fungsi>`
- Sukses: `{ "ok": true, "data": ... }`
- Gagal: `{ "error": "<kode>", "message": "<pesan aman>" }`
- Header respons: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`; `Access-Control-Allow-Origin` hanya untuk
  origin allowlist (tidak pernah `*`).
- Body maksimum 32 KB (JSON); lampiran maksimum 5 MB (multipart).
- Kode: `400` validasi, `401` kredensial/sesi, `403` role, `404` tidak ada,
  `405` metode, `409` konflik status/aturan, `413` body besar, `429`
  rate-limit (+`Retry-After`), `500`/`502` kegagalan server (pesan generik).

### 4.1 `consultation-public`

```jsonc
// list
{ "action": "list", "limit": 12, "offset": 0 }
// -> data: { items: [{ slug, judul, pertanyaan, jawaban, published_at }], limit, offset }

// detail
{ "action": "detail", "slug": "niat-puasa-dhuha" }
// -> data: { slug, judul, pertanyaan, jawaban, published_at }

// categories
{ "action": "categories" }
// -> data: [{ kode, nama, deskripsi }]
```

Hanya publikasi `published = true`. `slug` divalidasi `^[a-z0-9-]{6,120}$`.

### 4.2 `consultation-ticket-create`

```jsonc
{
  "kategori": "ibadah",              // kode kategori aktif
  "judul": "Niat puasa dhuha",        // 5..150
  "isi": "Assalamualaikum, ...",      // 10..10000
  "nama": "Budi",                     // opsional 2..120
  "whatsapp": "0812...",              // opsional, min salah satu WA/email
  "email": "budi@contoh.id",          // opsional
  "persetujuan_privasi": true,        // WAJIB true
  "persetujuan_publikasi": false,     // opsional
  "website": ""                       // honeypot (harus kosong)
}
// 201 -> data: { id, nomor_tiket, status, created_at, secret }
```

`secret` (32 karakter) hanya muncul **sekali**; server hanya menyimpan
HMAC-SHA256(secret, `CONSULTATION_SECRET_PEPPER`).

### 4.3 `consultation-ticket-access`

```jsonc
{ "action": "view", "nomor": "KON-261115-AB2", "secret": "<32 karakter>" }
// -> data: { ticket, kontak, pesan[], lampiran[], publikasi }

{ "action": "lampiran", "nomor": "...", "secret": "...", "attachment": "<uuid>" }
// -> data: { id, storage_path, nama_file, mime, url, expires_in: 120 }
```

`pesan` hanya yang `terlihat_pemohon = true`; catatan internal tidak pernah
keluar. Respons tidak memuat email staf.

### 4.4 `consultation-ticket-message`

```jsonc
{ "action": "message", "nomor": "...", "secret": "...", "isi": "Tambahan..." }
// 201 -> data: { id, created_at }

{ "action": "consent", "nomor": "...", "secret": "...", "setuju": false }
// -> data: { persetujuan_publikasi: false }
```

Pesan ditolak bila tiket `selesai`/`ditolak`. `consent=false` mencabut
persetujuan; trigger database otomatis menarik publikasi terkait.

### 4.5 `consultation-admin`

Header: `Authorization: Bearer <access_token staf>`.

| Aksi | Body tambahan | Efek |
|---|---|---|
| `list` | `status?`, `limit?`, `offset?` | daftar tiket (semua) |
| `detail` | `ticket` | detail + kontak + pesan + penugasan + review + publikasi |
| `history` | `ticket` | riwayat status + audit |
| `sla` | — | tiket aktif + `terlambat` |
| `verify` | `ticket` | `baru → diverifikasi`, SLA 3 hari kerja dimulai |
| `reject` | `ticket`, `alasan` (3..1000) | `→ ditolak` |
| `assign` | `ticket`, `konsultan` (email) | penugasan aktif + `→ ditugaskan` |
| `release` | `ticket`, `alasan` | lepas penugasan + `→ menunggu_penugasan` |
| `status` | `ticket`, `status`, `alasan?` | transisi valid via `consultation_ubah_status` |
| `message` | `ticket`, `isi`, `internal?` | catatan internal (default) / `jawaban_final` |

`internal` default **true** — pesan admin tidak menjadi publik kecuali
dinyatakan `false`.

### 4.6 `consultation-consultant`

| Aksi | Body | Efek |
|---|---|---|
| `list` | `status?`, `limit?`, `offset?` | hanya tiket yang ditugaskan aktif |
| `detail` | `ticket` | detail (ditolak bila bukan tiketnya) |
| `answer` | `ticket`, `isi` (10..10000) | `jawaban_konsultan` + `→ menunggu_review` |
| `message` | `ticket`, `isi` | catatan internal (tidak terlihat pemohon) |

Tidak ada jalur jawaban konsultan yang langsung final.

### 4.7 `consultation-review`

| Aksi | Body | Efek |
|---|---|---|
| `list` | `limit?`, `offset?` | antrean `menunggu_review` |
| `detail` | `ticket` | detail |
| `decide` | `ticket`, `message`, `keputusan`, `catatan?` | `disetujui → terjawab`; `minta_revisi → ditugaskan` |

`catatan` wajib untuk `minta_revisi`. Keputusan review append-only.

### 4.8 `consultation-publication`

| Aksi | Role | Body | Efek |
|---|---|---|---|
| `propose` | admin | `ticket`, `judul`, `pertanyaan_samar`, `jawaban_final` | buat/perbarui draf (selalu `published=false`) |
| `approve` | reviewer/admin | `ticket`, `setuju` | stempel persetujuan sesuai role |
| `publish` | admin | `ticket`, `slug` | terbit bila 3 persetujuan lengkap |
| `withdraw` | admin | `ticket`, `alasan?` | tarik publikasi + `dicabut=true` |
| `status` | staf | `ticket` | status tiket + ringkasan publikasi |

### 4.9 `consultation-attachment`

**Unggah — `multipart/form-data`**

```
pemohon: nomor, secret, file
staf   : ticket, file, message_id?   (+ Authorization: Bearer)
// 201 -> data: { id, storage_path, nama_file, mime, size_bytes }
```

**Unduh — `application/json`**

```jsonc
{ "action": "download", "nomor": "...", "secret": "...", "attachment": "<uuid>" }
// atau (staf): { "action": "download", "attachment": "<uuid>" } + Bearer
// -> data: { id, storage_path, nama_file, mime, url, expires_in: 120 }
```

---

## 5. Auth & Otorisasi

**Alur staf (setiap request):**

1. Ambil `Bearer` dari header `Authorization`.
2. `GET /auth/v1/user` (GoTrue) dengan anon key → email tepercaya.
   Gagal/kedaluwarsa → `401`.
3. `consultation_svc_peran(email)` → role dari `consultation_staff_roles`
   (aktif). Non-staf → `403`.
4. `requireRole()` di Edge Function menolak role yang tidak berhak **sebelum**
   RPC bisnis. RPC juga memeriksa ulang (pertahanan berlapis).

**Mengapa bukan `auth.jwt()` saja:** Edge Function memanggil PostgREST dengan
`service_role`, sehingga database tidak melihat email pengguna. Karena itu
verifikasi JWT harus eksplisit lewat GoTrue; email dari body selalu diabaikan.

**Matriks kewenangan**

| Tindakan | admin | konsultan | reviewer |
|---|---|---|---|
| Lihat semua tiket | ✅ | — | antrean review |
| Verifikasi/tolak | ✅ | — | — |
| Tugaskan/lepas | ✅ | — | — |
| Jawab tiket | — | ✅ (hanya tiketnya) | — |
| Review jawaban | — | — | ✅ |
| Ajukan publikasi | ✅ | — | — |
| Setujui publikasi | ✅ | — | ✅ |
| Terbitkan/cabut | ✅ | — | — |
| Catatan internal | ✅ | ✅ (tiketnya) | ✅ |
| Unggah lampiran | ✅ | ✅ (tiketnya) | ✅ |

**Pemohon** tidak punya akun: akses = `nomor + secret`. Tidak ada endpoint
yang dapat mencari tiket hanya dengan nomor atau email.

---

## 6. Alur Tiket & Chat

```
baru
 └─(admin verify)─> diverifikasi ─> menunggu_penugasan
                                         │
                                   (admin assign)
                                         ▼
                                     ditugaskan
                                         │
                          ┌──────────────┼───────────────┐
                 (konsultan tanya)   (konsultan jawab)  (admin lepas)
                          ▼              ▼                 ▼
                 menunggu_informasi   menunggu_review   menunggu_penugasan
                          │              │
        (pemohon jawab)───┘              │
                          └─(konsultan)──┘
                                         │
                              (reviewer setuju)
                                         ▼
                                     terjawab ─(admin)─> selesai
```

- **SLA 3 hari kerja** dimulai saat status pertama kali menjadi
  `diverifikasi`/`menunggu_penugasan` (dihitung trigger, Senin–Jumat WIB,
  minus `consultation_holidays`).
- **Jeda** `menunggu_informasi` menggeser tenggat sejumlah hari kerja yang
  tertutup penuh; tenggat tidak pernah maju dan selalu EOD hari kerja.
- **Chat**: pesan pemohon (`balasan_pemohon`), jawaban konsultan
  (`jawaban_konsultan`), jawaban final admin (`jawaban_final`), catatan
  internal (`catatan_internal`, `terlihat_pemohon=false`), pesan sistem.
- Semua perubahan status tercatat otomatis di `consultation_status_logs`
  dengan aktor terverifikasi; pesan/status/review append-only.

---

## 7. Review & Publikasi

1. Konsultan menjawab → tiket `menunggu_review` (jawaban belum final).
2. Reviewer `disetujui` → `terjawab`; `minta_revisi` + catatan → `ditugaskan`
   (konsultan memperbaiki; keputusan lama tetap tersimpan).
3. Admin mengajukan publikasi: `judul_publik`, `pertanyaan_samar`,
   `jawaban_final` (snapshot tersamarkan; tanpa identitas pemohon).
4. Persetujuan: **pemohon** (dari halaman tiket), **reviewer**, **admin**.
   Ketiganya harus `true`.
5. `publish` menetapkan slug + `published=true`; trigger menstempel
   `published_at` sekali dan tidak dapat diubah.
6. Pencabutan persetujuan pemohon atau `withdraw` admin → `published=false`,
   `dicabut=true`, `dicabut_at` dipertahankan; terbit ulang butuh persetujuan
   segar (`published_at` pertama tetap abadi sebagai riwayat).
7. Publikasi baru **wajib** mulai `published=false` (gate B1); `published=true`
   pada INSERT ditolak database.

---

## 8. Lampiran (Unggah & Akses)

- Bucket: **`consultation-private`** (privat, 5 MB, jpeg/png/webp/pdf).
  Bukan bucket publik, bukan bucket media CMS.
- Path selalu `tickets/<ticket_id>/<timestamp>-<acak>.<ext>`. RPC menolak path
  yang tidak berada di bawah tiket yang bersangkutan; trigger database juga
  memverifikasi konsistensi `message_id`.
- **Unggah pemohon**: kredensial divalidasi (`tiket_kredensial`) → unggah →
  catat metadata. Bila pencatatan gagal, objek dihapus kembali.
- **Unggah staf**: izin diperiksa (`lampiran_izin`) **sebelum** byte ditulis.
- **Unduh**: tidak ada URL publik. Function membuat **signed URL 120 detik**
  setelah kewenangan diverifikasi; unduhan dicatat di audit.
- Tidak ada policy `storage.objects` untuk bucket ini: satu-satunya jalur
  adalah `service_role` di dalam Edge Function.

---

## 9. Environment & Secrets (deployment checklist — DIJALANKAN USER)

Disediakan otomatis oleh runtime Supabase:

| Variabel | Kegunaan |
|---|---|
| `SUPABASE_URL` | base URL project |
| `SUPABASE_SERVICE_ROLE_KEY` | RPC + Storage (server-only) |
| `SUPABASE_ANON_KEY` (atau `SUPABASE_PUBLISHABLE_KEY`) | verifikasi JWT GoTrue |

Wajib diset manual sebagai function secret:

| Secret | Aturan |
|---|---|
| `CONSULTATION_SECRET_PEPPER` | minimal 16 karakter, acak, **hanya** di server; tidak boleh di frontend/repo |

Opsional:

| Variabel | Default |
|---|---|
| `CONSULTATION_ALLOWED_ORIGINS` | daftar origin tambahan, dipisah koma |

**Deploy (oleh user, bukan agen):** `supabase functions deploy consultation-*`
dengan sakelar platform `verify_jwt` per fungsi SEBAGAI BERIKUT — ini
satu-satunya instruksi `verify_jwt` yang berlaku:

| Function | `verify_jwt` (platform) |
|---|---|
| `consultation-admin`, `consultation-consultant`, `consultation-review`, `consultation-publication` | **AKTIF** (default) — frontend staf mengirim `Authorization: Bearer <access_token>` sesi Google |
| `consultation-public`, `consultation-ticket-create`, `consultation-ticket-access`, `consultation-ticket-message` | **NONAKTIF** (`--no-verify-jwt`) — pemohon anonim, dilindungi rate-limit + kredensial tiket |
| `consultation-attachment` | **NONAKTIF** (`--no-verify-jwt`) |

Alasan `consultation-attachment` harus NONAKTIF: function ini menangani dua
jalur — pemohon TANPA JWT (hanya header `apikey` publishable key) dan staf
DENGAN JWT. Verifikasi JWT staf dilakukan DI DALAM function
(`authenticateStaff` → `auth.getUser` → `consultation_svc_peran`), sehingga
sakelar platform TIDAK BOLEH aktif agar tidak menolak jalur pemohon lebih
dulu. Perintah deploy:

```
supabase functions deploy consultation-attachment --no-verify-jwt
```

---

## 10. Rate Limit

Dua lapis:

1. **Persisten** — RPC `consultation_svc_rate_hit` mencatat hit pada
   `consultation_rate_hits` dengan `bucket = HMAC(IP, pepper)` (IP mentah tidak
   disimpan), per `endpoint`. Berlaku lintas instance.
2. **Cadangan memori** — `MemoryLimiter` per proses, dipakai hanya bila RPC
   gagal (fail-safe, bukan fail-open).

| Kebijakan | Batas |
|---|---|
| `public-baca` | 60 / menit |
| `tiket-buat` | 5 / 10 menit |
| `tiket-akses` | 30 / menit |
| `tiket-pesan` | 10 / menit |
| `tiket-lampiran` | 10 / 10 menit |
| `tiket-unduh` | 60 / menit |
| `staf-baca` | 180 / menit |
| `staf-tulis` | 60 / menit |
| `staf-lampiran` | 20 / 10 menit |

Respons `429` menyertakan `Retry-After`.

---

## 11. Audit

- RPC bisnis menulis `consultation_audit_logs` (aktor, jenis, aksi, tiket,
  detail) dalam transaksi yang sama.
- Peristiwa lapisan HTTP yang tidak tercakup RPC (kredensial salah,
  rate-limit, unduhan lampiran) dicatat via `consultation_svc_catat_audit`.
- Aktor staf divalidasi trigger (`consultation_audit_check`): hanya email staf
  aktif; aktor sistem wajib literal `sistem`.
- `redact()` menyamarkan email, nomor HP, token/secret sebelum log/audit.
- Kegagalan menulis audit tidak mengubah hasil permintaan dan tidak
  membocorkan detail (hanya warning teredaksi).

---

## 12. Keputusan Desain (dan alasannya)

| Keputusan | Alasan |
|---|---|
| RPC database, bukan query PostgREST dari Edge Function | operasi multi-tabel atomik + aturan bisnis tidak dapat dilewati |
| `SECURITY INVOKER` + grant hanya `service_role` | tidak menambah jalur eskalasi hak; `anon` tidak dapat memanggil RPC |
| Secret tiket di-generate Edge Function, hash HMAC di DB | plaintext tidak pernah menyentuh database; pepper mencegah uji offline bila tabel bocor |
| Rate-limit persisten + fallback memori | konsisten lintas instance; tetap membatasi saat DB bermasalah |
| Signed URL 120 detik | tidak ada URL publik permanen untuk lampiran |
| Bucket Phase 2 terpisah (`consultation-private`) | tidak menyentuh bucket Phase 1/CMS; mudah dicabut terpisah |
| `serve()` + `errorPayload()` bersama | satu jalur CORS/error; tidak ada duplikasi & tidak ada kebocoran stack |

---

## 13. Risiko & Batasan (jujur, sebelum audit)

1. **Belum dijalankan di Deno/Supabase nyata.** Tidak ada `deno`/`supabase` CLI
   di lingkungan ini; entrypoint `index.ts` belum di-`deno check`, belum
   di-deploy, dan belum diuji HTTP end-to-end. Yang terbukti: seluruh modul
   murni (unit) dan seluruh RPC database (integrasi PGlite).
2. **Perbedaan PGlite vs Supabase**: schema `storage` tidak ada di PGlite →
   pembuatan bucket dilewati (notice) dan wajib diverifikasi setelah migrasi
   produksi. Signed URL/unggah nyata belum diuji.
3. **`auth.getUser` adalah panggilan jaringan tambahan per request staf.**
   Latensi + ketergantungan GoTrue; kegagalan GoTrue menghasilkan `502`
   (bukan fail-open).
4. **Kesesuaian kategori konsultan tidak ditegakkan DB** (warisan Phase 1):
   penugasan lintas kategori masih mungkin; validasi bisnis ada di RPC
   (`konsultan` harus role aktif + tiketnya), bukan di pemetaan kategori.
5. **Purge `consultation_rate_hits`** hanya oportunistik (2% request) +
   jendela 2 jam; untuk beban besar sebaiknya pg_cron (keputusan C7).
6. **Notifikasi email (C4) belum diimplementasikan**; antrian
   `consultation_notifications` tersedia tetapi belum ada pengirim Resend.
7. **Frontend Phase 3 belum ada** — kontrak API ini belum dikonsumsi UI.
8. **`published_at` abadi** setelah terbit pertama: penerbitan ulang
   mempertahankan waktu lama (keputusan Phase 1, bukan bug).

---

## 14. Rujukan Uji

Lihat `PHASE2_TEST_RESULTS.md` untuk perintah, jumlah asersi, dan daftar
pengujian yang **belum** dijalankan.
