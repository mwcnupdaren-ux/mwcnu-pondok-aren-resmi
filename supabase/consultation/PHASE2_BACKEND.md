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
│  ├─ verify-nia/index.ts              # fungsi existing di luar modul konsultasi
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
   ├─ consultation_001_foundation.sql         # FASE 1 — mesin status
   ├─ consultation_002_tables.sql             # FASE 1 — 16 tabel
   ├─ consultation_003_security.sql           # FASE 1 — RLS & ACL
   ├─ consultation_004_services.sql           # FASE 2 — RPC consultation_svc_*
   ├─ consultation_005_security_hardening.sql # FASE 2.1 — hardening lanjutan
   ├─ consultation_006_security_hardening.sql # FASE 2.2 — guard revisi & lampiran
   ├─ consultation_006_rollback.sql           # rollback parsial SQL006 → SQL005
   ├─ consultation_rollback.sql               # rollback modul penuh (Phase 1 + 2)
   ├─ MIGRATION_GUIDE.md                      # urutan SQL, verifikasi, rollback
   ├─ CONSULTATION_ERD.md
   ├─ DATABASE_DICTIONARY.md
   ├─ DECISIONS_C1_C7.md
   ├─ PHASE1_REVIEW_PACKAGE.md
   ├─ PHASE2_BACKEND.md                       # dokumen ini
   ├─ PHASE2_TEST_RESULTS.md
   ├─ PGlite_TEST_RESULTS.md
   └─ tests/
      ├─ test-konsultasi.mjs                  # integrasi DB (PGlite)
      ├─ test-shared.mjs                      # unit modul _shared (Node)
      ├─ package.json                         # script `test` & `test:shared`
      └─ package-lock.json
```

Daftar di atas mengikuti nama file yang benar-benar ada di repository pada
saat audit GIT-5H/5I. Urutan eksekusi migrasi tetap **001 → 002 → 003 → 004 →
005 → 006** sebagaimana `MIGRATION_GUIDE.md` §1; `consultation_006_rollback.sql`
hanya dipakai untuk kembali ke keadaan setelah SQL005.

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
| `CONSULTATION_ALLOWED_ORIGINS` | daftar origin tambahan, dipisah koma — **hanya menambah**, tidak mempersempit |

> **Catatan `supabase/config.toml`:** blok `[auth]` di berkas itu adalah
> konfigurasi **lingkungan lokal** (`supabase start` / `functions serve`).
> Nilainya **tidak** otomatis mengubah OAuth redirect URL project Supabase
> produksi. Redirect URL Google/OAuth produksi tetap diatur di
> **Supabase Dashboard → Authentication → URL Configuration** (dan Google
> Cloud Console), lalu diverifikasi lewat uji login staf.

**Deploy (oleh user, bukan agen):** jalankan `deploy-functions.ps1` di akar
repo. Skrip itu men-deploy **sembilan Edge Function konsultasi** secara
**per fungsi** dengan sakelar `verify_jwt` yang tepat, memakai Supabase CLI
yang dipatok ke **`supabase@3.2.0`**, dan berhenti pada kegagalan pertama.
`verify-nia` **tidak** termasuk dalam skrip tersebut (lihat §9.0.1).

> **Jangan** memakai perintah generik `supabase functions deploy
> consultation-*` tanpa sakelar. Perintah itu men-deploy semua fungsi
> dengan `verify_jwt = true` (default platform), sehingga lima endpoint
> pemohon akan menolak permintaan anonim dengan **401**.

Tabel ini dan blok [functions.*] dalam supabase/config.toml harus konsisten. Flag CLI yang digunakan saat deployment menentukan konfigurasi yang diterapkan oleh perintah tersebut. Ketidaksesuaian di antara keduanya harus diselesaikan sebelum deployment.

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
npx supabase@3.2.0 functions deploy consultation-attachment --no-verify-jwt
```

#### 9.0.1 `verify-nia` — di luar modul konsultasi

`verify-nia` adalah Edge Function **terpisah** (melayani `/v/<nia>`), bukan
bagian dari modul konsultasi dan **tidak** termasuk dalam
`deploy-functions.ps1`. Deployment-nya harus dilakukan **terpisah** dengan
keputusan eksplisit dan pengujian NIA tersendiri (NIA valid, NIA tidak
valid, dan CORS `/v/<nia>`). Bila suatu saat perlu dideploy, perintahnya
memakai `--no-verify-jwt` karena pemanggilnya anonim, tetapi itu tidak
boleh dianggap bagian otomatis dari rilis konsultasi.

### 9.1 Rollback Edge Functions (manual, bukan otomatis)

Supabase **tidak menyediakan rollback otomatis** untuk Edge Functions. CLI
v3.2.0 hanya memiliki `functions list`, `download`, `deploy`, `delete`, `new`,
dan `serve` — tidak ada perintah `rollback` maupun daftar versi. Management API
juga menyediakan list/get/body/deploy/update/delete. Management API menyediakan informasi versi fungsi yang sedang aktif melalui field version, tetapi tidak menyediakan endpoint riwayat versi lama atau rollback langsung. Setiap `functions deploy` **menggantikan** kode yang
sedang live, sehingga rollback = **deploy ulang source dari revisi Git yang
diketahui baik**, bukan memutar balik deployment di platform.

`DENO_DEPLOYMENT_ID` — format `{project_ref}_{function_id}_{version}` yang
terlihat pada log hanyalah **pola observasi**, bukan kontrak resmi terdokumentasi.
Identifier ini mencakup keseluruhan configuration set dan berubah bila
komponennya berubah (misalnya build, environment variable, koneksi, atau
database); tidak dijamin berubah pada deploy identik. Ia berguna sebagai
petunjuk versi di log, tetapi **bukan** mekanisme rollback, tidak dapat dipakai
untuk memilih versi lama, dan **bukan satu-satunya bukti** keberhasilan
deployment.

**Prasyarat — catat baseline sebelum setiap deploy produksi**

| Yang dicatat | Contoh |
|---|---|
| Commit/tag source | `0c1a1ab` — baseline commit historis; tag `consultation-backend-v1` belum tersedia |
| Waktu deploy | 2026-11-18 10:00 WIB |
| Fungsi yang di-deploy | 9 `consultation-*` (skrip konsultasi); `verify-nia` dicatat terpisah bila diputuskan di-deploy |
| `verify_jwt` per fungsi | sesuai tabel §9 |
| Nama secret yang berubah | `CONSULTATION_SECRET_PEPPER` (nilai tidak dicatat) |

Baseline deployment ditentukan setelah seluruh source backend dan konfigurasi
terkait selesai di-commit serta diaudit, lalu SHA finalnya dicatat di sini —
bukan dengan menebak SHA. `0c1a1ab` hanya baseline commit historis dan belum
mewakili versi backend terkini; tag `consultation-backend-v1` juga belum
tersedia. Tanpa tag/SHA yang tercatat, versi baik terakhir tidak dapat
ditentukan secara pasti dan rollback tidak boleh ditebak.

**Langkah rollback**

1. **Tentukan versi baik terakhir.** Lihat riwayat yang menyentuh fungsi dan
   tag yang tersedia:

   ```
   git log --oneline --decorate -- supabase/functions
   git tag --list 'consultation-backend-*'
   ```

   Pilih tag/SHA dari deploy terakhir yang lulus smoke test (bukan sekadar
   commit terakhir). Bila tidak ada tag, gunakan SHA yang dicatat saat deploy
   pada tabel baseline. Jangan memilih berdasarkan dugaan.

2. **Siapkan source dari revisi tersebut tanpa mengganggu working tree.**
   Jangan `reset`, `rebase`, atau `checkout` branch kerja yang sedang dipakai:

   ```
   git worktree add ..\rollback-<sha> <sha>
   git -C ..\rollback-<sha> rev-parse HEAD   # harus sama dengan <sha>
   git -C ..\rollback-<sha> status --short   # harus kosong
   ```

   Deploy dijalankan dari worktree tersebut agar source yang dikirim persis
   sama dengan revisi yang dipilih.

3. **Ambil kode yang sedang live (opsional, untuk forensik).**
   `npx supabase@3.2.0 functions download <nama> --remote=<ref>` menyimpan source
   yang **sedang live** (versi bermasalah) agar bisa di-diff. Perintah ini
   menulis ke checkout lokal — jalankan di worktree/klon sementara, bukan di
   working tree utama. Perintah ini **tidak** mengambil versi sebelumnya.

4. **Deploy hanya fungsi yang terdampak**, dengan flag `verify_jwt` yang sama
   seperti tabel §9:

   ```
   # fungsi staf — verify_jwt AKTIF (default)
   npx supabase@3.2.0 functions deploy consultation-review --remote=<ref>

   # fungsi pemohon — verify_jwt NONAKTIF
   npx supabase@3.2.0 functions deploy consultation-attachment --no-verify-jwt --remote=<ref>
   ```

   - Jangan `functions deploy` tanpa nama: perintah itu men-deploy **semua**
     fungsi dari working tree, termasuk perubahan lain yang belum tentu baik.
   - Jangan memakai `--prune`.
   - Bila Docker tidak tersedia, `--use-api` dapat dipakai (bundling
     server-side); perilakunya harus diuji di staging lebih dulu.

5. **Secret tidak ikut ter-rollback.** Secret Edge Function bersifat
   project-wide dan tidak memiliki riwayat versi. Rollback kode tidak
   mengubahnya. Jangan mengganti `CONSULTATION_SECRET_PEPPER` saat rollback
   (hash secret tiket lama akan tidak cocok). Bila secret memang berubah dan
   harus dipulihkan, lakukan terpisah dengan `supabase secrets set` dan
   persetujuan eksplisit.

**Verifikasi setelah rollback**

1. `npx supabase@3.2.0 functions list --remote=<ref>` — fungsi terdampak ada dan
   waktu pembaruannya sesuai deploy rollback.
2. Smoke test per fungsi:
   - staf tanpa Bearer → `401`; akun non-staf → `403`; staf valid → `200`
     `{ "ok": true }`;
   - `consultation-public` anonim (mis. `{ "action": "categories" }`) → `200`;
   - `OPTIONS` dengan origin allowlist → `204` + `Access-Control-Allow-Origin`
     yang tepat; `GET` → `405`.
3. Log fungsi: tidak ada `500`/`502` baru; `DENO_DEPLOYMENT_ID` dapat berubah
   bila configuration set berubah — bukan satu-satunya bukti keberhasilan,
   jadi periksa juga `functions list` dan smoke test di atas.
4. Kontrak: aksi/field yang dipakai frontend masih ada; RPC yang dipanggil
   benar-benar ada di database (mis.
   `select to_regprocedure('public.consultation_svc_staf_daftar(text,text,integer,integer)')`).
5. Alur kritis: buat tiket → akses dengan nomor+secret → kirim pesan; staf
   `list`/`detail`.

**Risiko kompatibilitas (frontend ↔ Edge Function ↔ database)**

| Skenario | Gejala | Tindakan |
|---|---|---|
| Frontend lebih baru daripada function | aksi/field tidak dikenal, `400`/`500` | Rollback frontend lebih dulu, atau deploy function yang cocok; jangan biarkan UI baru memanggil API lama |
| Function lebih baru daripada database | `500`/`502`, RPC/kolom belum ada | Deploy function lama tidak menolong; terapkan migrasi yang kurang atau deploy function yang cocok dengan DB |
| Function lama dijalankan di database yang sudah di-hardening (mis. setelah SQL006) | guard review/publikasi dilewati — regresi keamanan | Jangan melewati batas hardening DB; re-apply SQL006 atau pertahankan function yang kompatibel |
| `verify_jwt` salah | staf `401` massal, atau jalur anonim tertutup/terbuka | Deploy ulang dengan flag persis tabel §9 |
| Pepper berubah | semua secret tiket lama invalid (`401`) | Pulihkan pepper lama; jangan rotasi saat rollback |
| Allowlist CORS ikut source (`_shared/config.ts`) | origin baru hilang setelah rollback | Pastikan origin produksi ada di revisi yang di-deploy |
| Rollback frontend | UI dan API tidak sepasang | Vercel: Instant Rollback ke deployment sebelumnya (project ini memakai Vercel); hosting lain: deploy artefak/commit sebelumnya. Frontend dan function harus dari pasangan commit yang kompatibel |

**Rollback Edge Function ≠ rollback database**

- Prosedur ini tidak menjalankan SQL, tidak mengubah tabel/kolom/RPC, dan
  tidak menyentuh Storage.
- Rollback function **tidak membatalkan SQL006**: kolom `*_revision`, trigger,
  dan guard tetap ada. Function lama harus tetap kompatibel dengannya.
- Rollback database hanya melalui `MIGRATION_GUIDE.md` §3a/§3b, dengan
  persetujuan eksplisit, dan **tidak** mengembalikan kode function.
- Urutan yang disarankan saat insiden: (1) rollback/hentikan frontend,
  (2) rollback function terdampak, (3) rollback database hanya bila langkah
  1–2 tidak cukup dan ada rencana re-apply. Verifikasi tiap langkah sebelum
  lanjut.
- Tidak ada rollback otomatis yang diasumsikan pada seluruh langkah di atas.

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
