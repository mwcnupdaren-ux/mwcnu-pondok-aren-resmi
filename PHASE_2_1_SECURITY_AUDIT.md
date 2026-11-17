# PHASE 2.1 SECURITY AUDIT REPORT

**Proyek:** Konsultasi Agama MWCNU Pondok Aren
**Tanggal audit:** 15 November 2026
**Mode:** READ-ONLY (tidak ada file sumber, migrasi, konfigurasi, atau data yang diubah)
**Commit HEAD:** `86ff26d` (Fase 2 konsultasi) — belum di-push
**Cakupan:** `supabase/consultation/`, `supabase/functions/`, migrasi SQL terkait, pengujian, dokumentasi teknis

### Catatan metodologi dan batas pembuktian

1. Audit dilakukan terhadap **working tree saat ini**, yang memuat perubahan **belum ter-commit**:
   `consultation_005_security_hardening.sql` (untracked), `README_AUDIT_FIX.md` (untracked), serta modifikasi
   `_shared/{db,guard,http}.ts`, `consultation-attachment/index.ts`, `verify-nia/index.ts`, dan dua berkas uji.
2. Karena itu laporan ini **secara tegas membedakan dua keadaan**:
   - **(a) Baseline ter-commit `001→004`** — keadaan yang terjadi bila operator mengikuti `MIGRATION_GUIDE.md`
     apa adanya. Di sini temuan C-1 dan C-2 **aktif**.
   - **(b) Working tree dengan `005`** — temuan C-1/C-2 tertutup **di source**, tetapi `005` belum di-commit,
     belum didokumentasikan pada panduan migrasi, dan belum pernah dijalankan ke database mana pun.
3. **Tidak dijalankan:** suite `test-konsultasi.mjs`, `test-shared.mjs`, migrasi ke Postgres/Supabase, `deno check`,
   deploy, uji HTTP E2E, GoTrue, Storage, dan uji konkurensi multi-koneksi. Tidak ada klaim "lulus" di laporan ini
   yang berasal dari eksekusi kecuali dinyatakan eksplisit.
4. Satu **probe terisolasi** dijalankan di PGlite in-memory (bukan migrasi proyek, tidak menyentuh file/DB proyek)
   untuk memverifikasi satu dugaan semantik PL/pgSQL — lihat §E.1. Hasilnya: bukan kerentanan.
5. Lingkungan yang tersedia: Node v24.16.0. Tidak tersedia `deno`, `supabase` CLI, maupun Postgres server.
   Semua perilaku platform (Supabase Kong/`X-Forwarded-For`, Storage, GoTrue) ditandai **BELUM DAPAT DIVERIFIKASI**
   bila tidak dapat disimpulkan dari source.

**Ringkasan jumlah temuan:** 2 Critical, 2 High, 7 Medium, 8 Low (satu di antaranya diperiksa dan **tidak terbukti** — §E.1).

---

## A. Executive Summary

Lapisan database Fase 1 (`001`–`003`) berada pada kualitas keamanan yang baik: RLS aktif pada 16/16 tabel
**tanpa satu pun policy** (deny-by-default), seluruh hak tabel/fungsi/sequence untuk `anon` dan `authenticated`
dicabut, dan tidak ada `SECURITY DEFINER` di seluruh `supabase/consultation/*.sql`. Seluruh akses data melewati
RPC `consultation_svc_*` yang hanya dapat dieksekusi `service_role`, dan `service_role` hanya hidup di runtime
Edge Function. Kontrol integritas (append-only, invarian `published_at`, syarat tiga persetujuan, pencabutan
otomatis saat persetujuan ditarik) juga terbukti ada di source.

Namun **lapisan layanan Fase 2 yang ter-commit (`consultation_004_services.sql`) membocorkan data rahasia ke
pemohon**:

- **C-1** — jawaban konsultan yang **belum disetujui reviewer** langsung ditandai `terlihat_pemohon = true`
  dan dikembalikan oleh `consultation_svc_akses_tiket()`. Pemohon membaca jawaban mentah sebelum review.
- **C-2** — `consultation_svc_akses_tiket()` mengembalikan **seluruh** lampiran tiket (termasuk lampiran internal
  konsultan/staf), dan `consultation_svc_lampiran_pemohon_ambil()` hanya memeriksa kepemilikan tiket — bukan
  visibilitas lampiran. Pemohon dapat memperoleh *signed URL* (120 detik) untuk berkas internal, termasuk
  lampiran yang terhubung ke pesan `terlihat_pemohon = false`.

Keduanya **tertutup oleh `consultation_005_security_hardening.sql`** (visibilitas lampiran eksplisit, jawaban
konsultan `false` + visibilitas lewat baris review `disetujui`, `FOR UPDATE` pada review/jawab, advisory lock
pada rate-limit). Tetapi `005` **untracked**, **tidak tercantum** di `MIGRATION_GUIDE.md` (yang masih menyuruh
`001 → 004`) maupun `PHASE2_BACKEND.md`, dan **belum pernah dieksekusi**. Artinya: **perbaikan ada di source,
tetapi tidak ada di jalur deployment yang terdokumentasi.** Ini adalah risiko operasional tingkat Medium (M-6)
yang justru menjadi penentu utama verdict kesiapan deploy.

Dua temuan High menyangkut integritas, bukan kerahasiaan: (H-1) admin dapat **mengganti teks publikasi setelah
reviewer menyetujui** tanpa mereset persetujuan, sehingga arsip publik bisa berbeda dari yang disetujui;
(H-2) transisi `menunggu_review → terjawab` tersedia bagi admin lewat RPC status generik, sehingga publikasi
dapat diajukan tanpa pernah ada review jawaban (pemisahan tugas reviewer dilewati).

Rate limiting untuk endpoint konsultasi memakai **lapisan persisten** (`consultation_rate_hits` + advisory
transaction lock) dan bersifat **fail-closed** — ini kontrol yang benar. Sebaliknya `verify-nia` **hanya** memakai
limiter in-memory per instance (20/menit/IP, 300/menit agregat per instance) dan **bukan** proteksi global;
komentar kode sudah jujur menyatakannya. Bucket global 300/menit juga dapat dihabiskan satu penyerang sehingga
menjadi *self-DoS* pada instance tersebut (M-2). Identifikasi IP memakai entri **pertama** `X-Forwarded-For`
(M-1) yang, bila platform menambahkan IP nyata di belakang header kiriman klien, membuat bucket rate-limit
dapat dipalsukan.

**Verdict: CONDITIONALLY READY** — lihat §J.

---

## B. Critical Findings

### C-1 — Jawaban konsultan yang belum disetujui reviewer terlihat oleh pemohon

- **Severity:** CRITICAL
- **File:** `supabase/consultation/consultation_004_services.sql`
- **Baris:** 513–516 (penulisan), 158 (pembacaan)
- **Objek SQL:** `public.consultation_svc_jawab()`, `public.consultation_svc_akses_tiket()`
- **Status:** AKTIF pada baseline ter-commit `004`. **Tertutup** oleh `005` baris 135–139 dan 48–52.

**Bukti kode (baseline `004`):**

```sql
-- 004_services.sql:513-516  (consultation_svc_jawab)
  insert into public.consultation_messages
    (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
  values (p_ticket, 'konsultan', lower(btrim(p_aktor)), 'jawaban_konsultan',
          btrim(p_isi), true)
```

```sql
-- 004_services.sql:153-158  (consultation_svc_akses_tiket)
    'pesan', coalesce((select json_agg(json_build_object(...))
      from public.consultation_messages m
      where m.ticket_id = v_ticket.id and m.terlihat_pemohon), '[]'::json),
```

**Skenario eksploitasi:**
1. Pemohon membuat tiket dan menerima `nomor_tiket` + `secret` (kredensial ini memang miliknya).
2. Konsultan memanggil `consultation_svc_jawab()`; pesan tersimpan dengan `terlihat_pemohon = true`,
   status tiket menjadi `menunggu_review`.
3. Sebelum reviewer menyentuh apa pun, pemohon memanggil `consultation_svc_akses_tiket(nomor, hash)`.
   Blok `pesan` **memuat** `jenis_pesan = 'jawaban_konsultan'` beserta isi lengkap.
4. Bila reviewer kemudian memutuskan `minta_revisi`, pemohon **sudah** membaca versi yang ditolak.

**Dampak:**
- Kebocoran confidentiality: fatwa/analisis hukum agama yang belum melalui kontrol mutu reviewer terbaca pihak luar.
- Kontrol "review sebelum jawaban dikirim" (alur `menunggu_review → terjawab`) menjadi **tidak bermakna** bagi pemohon.
- Kewenangan reviewer untuk menahan jawaban yang salah/tidak sensitif-hukum hilang sepenuhnya.

**Rekomendasi:**
- Tulis jawaban konsultan dengan `terlihat_pemohon = false` (seperti `005:135-139`).
- Turunkan visibilitas dari **baris review `disetujui`**, bukan dari kolom boolean yang dapat diubah:
  `exists (select 1 from consultation_reviews r where r.message_id = m.id and r.ticket_id = m.ticket_id and r.keputusan = 'disetujui')`
  (seperti `005:48-52`), sehingga tabel pesan tetap append-only.
- Tambahkan uji regresi negatif: "jawaban tidak muncul sebelum review disetujui" (sudah ada di working tree
  sebagai `T30l-1`, `T30n-1`, `T30o-1` — lihat §G).

---

### C-2 — Lampiran internal tiket dapat diunduh pemohon (metadata + signed URL)

- **Severity:** CRITICAL
- **File:** `supabase/consultation/consultation_004_services.sql`
- **Baris:** 159–164 (daftar lampiran), 887–912 (RPC pengambilan metadata untuk signed URL)
- **Objek SQL:** `public.consultation_svc_akses_tiket()`, `public.consultation_svc_lampiran_pemohon_ambil()`
- **Status:** AKTIF pada baseline ter-commit `004`. **Tertutup** oleh `005` baris 53–67 dan 101–112.

**Bukti kode (baseline `004`):**

```sql
-- 004_services.sql:159-164  (consultation_svc_akses_tiket) — TANPA filter visibilitas
    'lampiran', coalesce((select json_agg(json_build_object(
        'id', a.id, 'message_id', a.message_id, 'nama_file', a.nama_file,
        'mime', a.mime, 'size_bytes', a.size_bytes, 'created_at', a.created_at)
        order by a.created_at)
      from public.consultation_attachments a
      where a.ticket_id = v_ticket.id), '[]'::json),
```

```sql
-- 004_services.sql:905-911  (consultation_svc_lampiran_pemohon_ambil)
  select * into v_a from public.consultation_attachments
   where id = p_attachment and ticket_id = v_ticket.id;   -- HANYA kepemilikan tiket
  if v_a.id is null then
    raise exception 'Lampiran tidak ditemukan';
  end if;
  return json_build_object('id', v_a.id, 'storage_path', v_a.storage_path,
                           'nama_file', v_a.nama_file, 'mime', v_a.mime);
```

Tabel lampiran **tidak memiliki kolom visibilitas sendiri**; satu-satunya penanda adalah
`diunggah_oleh` dan relasi opsional `message_id`:

```sql
-- 002_tables.sql:183-193
create table if not exists public.consultation_attachments (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      uuid not null references public.consultation_tickets (id) on delete cascade,
  message_id     uuid references public.consultation_messages (id) on delete set null,
  storage_path   text not null unique check (storage_path like 'tickets/%'),
  ...
  diunggah_oleh  text not null,                    -- email staf atau 'pemohon'
```

**Skenario eksploitasi (rantai penuh, tanpa menebak UUID):**
1. Staf mengunggah dokumen internal (mis. rujukan kitab, catatan pemeriksaan identitas) lewat
   `consultation_svc_lampiran_staf()`, dengan `p_message_id = NULL` atau terhubung ke pesan
   `terlihat_pemohon = false`. Path objek: `tickets/<ticket_id>/<acak>.<ext>` (`004:865`).
2. Pemohon memanggil `consultation_svc_akses_tiket()` → blok `lampiran` mengembalikan **id, nama_file, mime,
   size_bytes, message_id** milik lampiran internal tersebut.
3. Pemohon memanggil Edge Function `consultation-attachment` dengan `action=download`, `nomor`, `secret`,
   dan `attachment=<id dari langkah 2>`. Edge Function memanggil `consultation_svc_lampiran_pemohon_ambil()`
   (`consultation-attachment/index.ts:163-167`), yang **lolos** karena tiket memang milik pemohon.
4. Edge Function memanggil `db.storageSign(BUCKET, meta.storage_path, 120)`
   (`consultation-attachment/index.ts:168`) dengan `service_role`, lalu mengembalikan `url` yang berlaku 120 detik.
5. Pemohon mengunduh berkas internal. Tidak ada policy storage yang menghalangi, karena bucket privat dan
   satu-satunya jalur adalah `service_role` (`004:21-33`, `003:12`).

**Dampak:**
- Kebocoran **isi berkas**, bukan sekadar metadata: dokumen internal konsultan, hasil pemeriksaan, dan lampiran
  catatan internal yang sengaja disembunyikan (`terlihat_pemohon = false`).
- Melanggar prinsip yang diminta audit: "pemeriksaan kepemilikan tiket saja tidak cukup untuk mengizinkan akses lampiran".
- Karena `message_id` dapat `NULL`, lampiran tanpa relasi pesan **tidak punya penanda visibilitas apa pun** —
  kegagalan desain skema, bukan sekadar bug RPC.

**Rekomendasi:**
- Filter daftar lampiran dan RPC pengambilan metadata dengan aturan eksplisit:
  `a.diunggah_oleh = 'pemohon' OR (pesan terkait terlihat ATAU pesan terkait punya review 'disetujui')`
  — persis `005:53-67` dan `005:101-112`.
- Perlakukan `message_id IS NULL` untuk unggahan staf sebagai **internal** (default deny), bukan default allow.
- Pertimbangkan kolom `visibilitas` eksplisit (`'pemohon' | 'internal'`) dengan `NOT NULL DEFAULT 'internal'`
  agar aturan tidak bergantung pada join tiga tabel.
- Uji regresi: `T30o-2` dan `T30o-3` (working tree) sudah menutup kasus `message_id IS NULL`; tambahkan kasus
  "lampiran pada pesan `terlihat_pemohon=false`" dan "lampiran pada pesan yang review-nya `minta_revisi`".

---

## C. High Findings

### H-1 — Teks publikasi dapat diganti setelah disetujui reviewer (approval tidak terikat konten)

- **Severity:** HIGH (integritas)
- **File:** `supabase/consultation/consultation_004_services.sql`
- **Baris:** 590–630 (khususnya `on conflict` 615–623); pembanding 632–649
- **Objek SQL:** `public.consultation_svc_ajukan_publikasi()`, `public.consultation_svc_setujui_publikasi()`

**Bukti kode:**

```sql
-- 004_services.sql:615-623
  on conflict (ticket_id) do update
    set judul_publik = excluded.judul_publik,
        pertanyaan_samar = excluded.pertanyaan_samar,
        jawaban_final = excluded.jawaban_final,
        disamarkan_oleh = excluded.disamarkan_oleh,
        persetujuan_pemohon = excluded.persetujuan_pemohon,
        persetujuan_pemohon_at = excluded.persetujuan_pemohon_at,
        updated_at = now()
```

Tidak ada reset `disetujui_reviewer`, `disetujui_admin`, `disetujui_reviewer_oleh/at`, atau
`disetujui_admin_oleh/at`. Tidak ada hash konten yang disetujui. Pemeriksaan `published` hanya mencegah
pengubahan **setelah terbit** (`004:602-605`), bukan setelah **disetujui**.

**Skenario kegagalan (tanpa perlu kolusi jahat, cukup kelalaian prosedur):**
1. Admin memanggil `ajukan_publikasi()` dengan teks A.
2. Reviewer memanggil `setujui_publikasi(ticket, true)` → `disetujui_reviewer = true` (menyetujui **teks A**).
3. Admin memanggil `setujui_publikasi(ticket, true)` → `disetujui_admin = true`.
4. Sebelum `terbitkan`, admin memanggil `ajukan_publikasi()` **lagi** dengan teks B (mis. hasil penyuntingan
   ulang yang menghapus penyamaran identitas atau mengubah substansi fatwa). Upsert menimpa
   `judul_publik/pertanyaan_samar/jawaban_final`, sementara kedua boolean persetujuan **tetap `true`**.
5. `consultation_svc_terbitkan()` menerbitkan teks B ke arsip publik.

**Dampak:**
- Arsip publik memuat teks yang **tidak pernah disetujui** reviewer; kontrol tiga persetujuan
  (`002:225-226`) menjadi formalitas.
- Risiko privasi konkret: `pertanyaan_samar`/`judul_publik` yang disetujui dapat diganti dengan teks yang
  memuat identitas pemohon, lalu terbit permanen.
- Jejak audit tidak membantu: `004:624-625` hanya mencatat `'publikasi_diajukan'` tanpa hash/versi konten.

**Rekomendasi:**
- Pada `on conflict ... do update`, **reset** `disetujui_reviewer = false`, `disetujui_admin = false`,
  `disetujui_reviewer_oleh/at = null`, `disetujui_admin_oleh/at = null` bila salah satu kolom konten berubah.
- Alternatif yang lebih kuat: simpan `konten_hash` (mis. `encode(digest(judul||pertanyaan||jawaban,'sha256'),'hex')`)
  saat persetujuan diberikan, dan tolak `terbitkan` bila hash saat ini ≠ hash yang disetujui.
- Catat di audit log: `aksi='publikasi_konten_diubah'` dengan hash lama dan baru.
- Uji: "setelah reviewer menyetujui, perubahan teks menggugurkan persetujuan" (belum ada — §G).

---

### H-2 — Review jawaban dapat dilewati lewat transisi status generik, lalu publikasi tetap berjalan

- **Severity:** HIGH (bypass pemisahan tugas)
- **File:** `supabase/consultation/consultation_001_foundation.sql`, `consultation_004_services.sql`
- **Baris:** `001:35` (transisi), `004:425-437` (RPC status), `004:599-601` (syarat publikasi), `004:632-649`
- **Objek SQL:** `public.consultation_can_transition()`, `public.consultation_svc_status()`,
  `public.consultation_svc_ajukan_publikasi()`, `public.consultation_svc_setujui_publikasi()`

**Bukti kode:**

```sql
-- 001_foundation.sql:35 — transisi tersedia untuk siapa pun yang boleh mengubah status
    when from_status = 'menunggu_review'    and to_status in ('terjawab','ditugaskan') then true
```

```sql
-- 004_services.sql:430-432 — admin bebas memilih status tujuan
  if v_role <> 'admin_konsultasi' then raise exception 'Hanya admin konsultasi'; end if;
  select * into v_t from public.consultation_ubah_status(p_ticket, p_status, p_alasan, p_aktor);
```

```sql
-- 004_services.sql:599-601 — publikasi hanya butuh status, BUKAN baris review
  if v_t.status not in ('terjawab','selesai') then
    raise exception 'Tiket belum memiliki jawaban final';
  end if;
```

```sql
-- 004_services.sql:638-643 — reviewer menyetujui publikasi tanpa memeriksa review jawaban
  if v_role = 'reviewer' then
    update public.consultation_publications
       set disetujui_reviewer = v_setuju, ...
```

**Skenario:**
1. Konsultan mengirim jawaban → status `menunggu_review`, tetapi **tidak ada** baris `consultation_reviews`.
2. Admin memanggil `consultation_svc_status(ticket, 'terjawab', ...)`. Transisi sah menurut `001:35`;
   tidak ada pemeriksaan keberadaan review.
3. Admin memanggil `ajukan_publikasi()` — lolos karena status `terjawab`.
4. Reviewer memanggil `setujui_publikasi(true)` — lolos karena tidak ada syarat "review jawaban harus ada".
5. Admin menyetujui dan menerbitkan. Jawaban masuk arsip publik **tanpa pernah direview**.

**Dampak:**
- Pemisahan tugas (konsultan menulis, reviewer memverifikasi) dapat dilangkahi oleh satu admin + satu reviewer
  yang menyetujui "blanko".
- Pada baseline `004`, kombinasi H-2 + C-1 berarti jawaban juga sudah terbaca pemohon sejak awal.
- Tidak ada jejak bahwa review dilewati: `consultation_reviews` kosong, tetapi tidak ada yang memeriksanya.

**Rekomendasi:**
- `consultation_svc_ajukan_publikasi()` dan `consultation_svc_setujui_publikasi()` **wajib** mensyaratkan
  `exists (select 1 from consultation_reviews r where r.ticket_id = p_ticket and r.keputusan = 'disetujui')`.
- Larang `menunggu_review → terjawab` di luar `consultation_svc_review()` (hapus dari matriks transisi atau
  tambahkan guard "hanya lewat RPC review"), atau beri jalur override eksplisit dengan audit `override_review`.
- Tambahkan uji negatif: publikasi ditolak bila tidak ada review `disetujui`.

---

## D. Medium Findings

### M-1 — Identitas klien diambil dari entri pertama `X-Forwarded-For` (bucket rate-limit dapat dipalsukan)

- **Severity:** MEDIUM
- **File:** `supabase/functions/_shared/http.ts` (53–60), `supabase/functions/verify-nia/index.ts` (125)
- **Objek:** `clientIp()`, `fetch()` verify-nia
- **Status platform:** BELUM DAPAT DIVERIFIKASI (perilaku Supabase edge proxy tidak ada di repo)

```ts
// http.ts:53-60
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  const first = xff.split(',')[0]?.trim() ?? '';
  if (first) return first;
```

```ts
// verify-nia/index.ts:125
const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
```

**Skenario:** Bila proxy platform **menambahkan** IP nyata ke nilai header yang dikirim klien
(`X-Forwarded-For: <palsu>, <ip-nyata>`), maka entri pertama = nilai yang dikendalikan klien. Penyerang
mengirim header acak per request → setiap request mendapat bucket hash berbeda → limit per-IP
(`tiket-buat` 5/600s, `tiket-lampiran` 10/600s, `tiket-akses` 30/60s, `verify-nia` 20/60s) **tidak pernah tercapai**.
**Dampak:** rate limit per-IP menjadi tidak efektif; brute force `secret` tiket dan enumerasi NIA menjadi tak terbatas
(selama bucket agregat belum habis). **Rekomendasi:** gunakan entri **terakhir** XFF (yang ditambahkan proxy),
atau header platform yang tidak dapat dipalsukan (mis. `cf-connecting-ip`/`x-real-ip` bila dijamin proxy),
lalu verifikasi dengan uji integrasi terhadap deployment nyata. Jangan mengandalkan nilai pertama tanpa bukti.

---

### M-2 — `verify-nia`: rate limit hanya per instance; bucket agregat 300/menit dapat dihabiskan (self-DoS) dan tidak ada proteksi lintas instance

- **Severity:** MEDIUM
- **File:** `supabase/functions/verify-nia/index.ts`
- **Baris:** 30–35 (konstanta), 40–48 (state), 80–90 (`tooFast`), 126–131 (penegakan)
- **Objek:** limiter in-memory modul `verify-nia`

```ts
// verify-nia/index.ts:33-35
const PER_IP_LIMIT = 20;
const GLOBAL_LIMIT = 300;
const WINDOW_MS = 60_000;
```

```ts
// verify-nia/index.ts:80-90
function tooFast(ip: string, now: number): boolean {
  const gl = prune(rl.global, now);
  if (gl.length >= GLOBAL_LIMIT) return true;
  const a = prune(rl.ip.get(ip) ?? [], now);
  if (a.length >= PER_IP_LIMIT) return true;
  gl.push(now);
  a.push(now);
```

**Bukti pembeda yang diminta audit:**
- **Rate limit lokal per instance:** YA — `g.__rl` hidup di `globalThis` satu isolate; hilang saat instance didaur ulang.
- **Rate limit persisten lintas instance:** **TIDAK ADA** untuk `verify-nia`. Berbeda dari endpoint konsultasi yang
  memakai `guardRateLimit()` → RPC `consultation_svc_rate_hit` (persisten).
- Dengan N instance aktif, batas efektif per IP menjadi `N × 20/menit`; penyerang dapat memaksa request tersebar
  (mis. membuka koneksi paralel) sehingga batas per IP praktis longgar.

**Skenario self-DoS:** `tooFast()` mencatat hit **sebelum** body divalidasi (`126` sebelum `136`). Penyerang mengirim
300 request/menit dengan body kosong/rusak → bucket `global` instance penuh → **semua** pengguna sah di instance itu
menerima `429` selama sisa window. Dengan XFF palsu (M-1), batas per-IP tidak menahan apa pun.

**Dampak:** (a) enumerasi NIA (`/^MWC-\d{2}-\d{2}-\d{6}-\d$/` → ruang terbatas) menjadi lebih murah;
(b) gangguan layanan bagi pengguna sah; (c) tidak ada jaminan proteksi setelah scale-out.
**Rekomendasi:** pindahkan `verify-nia` ke `guardRateLimit()` + RPC persisten (kebijakan mis. 10/60s per IP),
pertahankan bucket agregat sebagai proteksi *per instance* dengan dokumentasi eksplisit, catat hit **hanya**
setelah validasi bentuk body, dan pertimbangkan CAPTCHA/token untuk endpoint publik ini.

---

### M-3 — Multipart diparse sebelum rate-limit dan autentikasi; seluruh body dibuffer di memori

- **Severity:** MEDIUM (DoS/amplifikasi resource)
- **File:** `supabase/functions/consultation-attachment/index.ts` (73–77 vs 92, 119–120), `_shared/http.ts` (101–137)
- **Objek:** handler unggah `consultation-attachment`, `limitedRequest()`

```ts
// consultation-attachment/index.ts:73-77
if (contentType.startsWith('multipart/form-data')) {
  const boundedReq = await limitedRequest(req, LIMITS.lampiranMaxBytes + 128 * 1024);
  const form = await boundedReq.formData();      // parse SEBELUM limit/auth
  const file = form.get('file');
```

Rate limit baru dipanggil di `92` (jalur pemohon) dan `119` (jalur staf); autentikasi staf di `120`.

```ts
// http.ts:105-136 — body dikumpulkan penuh ke array, lalu disalin ke Blob
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  ...
  const bodyBytes = new Uint8Array(total);
  ...
  body: new Blob([bodyBytes.buffer]),
```

**Skenario:** Klien **tanpa kredensial dan tanpa JWT** mengirim `multipart/form-data` 5 MiB + 128 KiB berulang kali.
Setiap request memaksa: (1) buffering ~5,1 MiB di `chunks`, (2) salinan ~5,1 MiB ke `bodyBytes`, (3) salinan ke `Blob`,
(4) alokasi `formData()` internal, (5) `file.arrayBuffer()` (`index.ts:86`), (6) `new Uint8Array` untuk storage
(`db.ts:112-116`). Semua ini terjadi **sebelum** satu pun pemeriksaan kewenangan.

**Dampak:** amplifikasi memori/CPU per request tak terautentikasi; berpotensi memicu OOM/instance recycle
(menghapus state limiter `verify-nia`, lihat M-2). Batas 5 MiB membatasi kerusakan, tetapi biayanya tetap
ditanggung sebelum otorisasi.
**Catatan akurasi:** komentar `index.ts:74-75` menyatakan batas "sebelum parser `formData()` mengalokasikan
seluruh payload" — implementasi `limitedRequest` **tetap** memuat seluruh body ke memori (tidak streaming ke parser).
Komentar itu menyesatkan.
**Rekomendasi:** lakukan `guardRateLimit()` dan `authenticateStaff()` lebih dulu (kecuali `nomor`/`secret` pemohon
yang memang ada di body multipart — gunakan header `x-ticket-nomor` + field terpisah, atau endpoint unggah
khusus dengan token sekali pakai), turunkan batas menjadi 5 MiB + overhead kecil, dan gunakan parser streaming.

---

### M-4 — MIME ditentukan klien; tidak ada validasi magic bytes

- **Severity:** MEDIUM
- **File:** `supabase/functions/consultation-attachment/index.ts` (83), `consultation_004_services.sql` (24–29)
- **Objek:** `mime(file.type)`, bucket `consultation-private`

```ts
// index.ts:83
const mimeType = mime(file.type);       // dari Content-Type part multipart (dikendalikan klien)
```

```sql
-- 004:24-29
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('consultation-private','consultation-private', false, 5242880,
            array['image/jpeg','image/png','image/webp','application/pdf'])
```

**Skenario:** Penyerang mengunggah berkas HTML/SVG/JS atau PDF berisi skrip dengan header part
`Content-Type: image/png`. `mime()` menerima, `storageUpload` menyimpan dengan `Content-Type: image/png`,
dan `storage.buckets.allowed_mime_types` **juga** memeriksa header yang sama → tidak ada pertahanan kedua.
Saat diunduh, `Content-Type` mengikuti metadata objek. Karena bucket privat dan unduhan via signed URL,
dampak XSS terbatas pada origin storage; namun berkas berbahaya tetap dapat disebar ke staf/pemohon.
**Dampak:** penyimpanan konten dengan tipe yang salah; potensi polyglot/XSS pada domain storage; melemahkan
asumsi "hanya 4 tipe aman" yang dinyatakan kode dan dokumentasi.
**Rekomendasi:** verifikasi signature bytes (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`, `RIFF....WEBP`) sebelum unggah;
tetapkan `Content-Type` dari hasil deteksi, bukan dari klien; pertimbangkan `Content-Disposition: attachment`
pada signed URL (mis. `?download=`) dan `X-Content-Type-Options: nosniff` pada respons unduh (sudah ada di
`http.ts:22`, tetapi tidak pada objek storage).

---

### M-5 — Broken access control pada lampiran staf: reviewer/admin tidak dibatasi per tiket

- **Severity:** MEDIUM (IDOR terbatas)
- **File:** `supabase/consultation/consultation_004_services.sql`
- **Baris:** 780–797 (`lampiran_izin`), 840–884 (`lampiran_staf`), 915–936 (`lampiran_staf_ambil`)
- **Objek SQL:** `consultation_svc_lampiran_izin()`, `consultation_svc_lampiran_staf()`, `consultation_svc_lampiran_staf_ambil()`

```sql
-- 004:789-795 (izin unggah) — hanya konsultan yang dibatasi
  if v_role = 'konsultan' and not exists (
    select 1 from public.consultation_assignments a
     where a.ticket_id = p_ticket
       and a.konsultan_email = lower(btrim(p_aktor))
       and a.dilepas_at is null) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
```

```sql
-- 004:924-932 (ambil metadata/signed URL) — hanya konsultan yang dibatasi
  select * into v_a from public.consultation_attachments where id = p_attachment;
  ...
  if v_role = 'konsultan' and not exists ( ... assignment ... ) then
    raise exception 'Tiket tidak ditugaskan kepada Anda';
  end if;
```

**Skenario:** Reviewer (atau admin) yang mengetahui `ticket_id` dapat mengunggah lampiran ke tiket mana pun
(`lampiran_izin` mengembalikan `boleh: true`), dan dapat memperoleh `storage_path` + signed URL untuk
`attachment_id` mana pun. `consultation_svc_staf_daftar()` untuk reviewer hanya menampilkan antrean
`menunggu_review` (`004:276-282`), tetapi `staf_detail` mengizinkan `menunggu_review|terjawab|selesai`
(`004:307-312`) — jadi cakupan baca reviewer lebih luas daripada cakupan antreannya.
**Dampak:** integritas berkas tiket lain dapat diubah (injeksi file), dan kerahasiaan lampiran tiket di luar
kewenangan dapat dibaca **bila** UUID diketahui. UUID tidak diekspos oleh `staf_detail` (tidak ada daftar
lampiran), sehingga eksploitasi praktis memerlukan UUID dari sumber lain — karena itu MEDIUM, bukan HIGH.
**Rekomendasi:** batasi reviewer pada tiket yang benar-benar dalam antrean review (atau yang memiliki
`jawaban_konsultan`), dan admin pada seluruh tiket secara eksplisit; tambahkan `ticket_id` sebagai parameter
wajib pada `lampiran_staf_ambil` dan validasi konsistensi `attachment.ticket_id = p_ticket`.

---

### M-6 — `consultation_005_security_hardening.sql` tidak ter-commit dan tidak terdokumentasi pada jalur migrasi

- **Severity:** MEDIUM (proses deployment)
- **File:** `supabase/consultation/consultation_005_security_hardening.sql`, `MIGRATION_GUIDE.md`,
  `PHASE2_BACKEND.md`
- **Baris:** `MIGRATION_GUIDE.md:15-18` (tabel 4 file), `MIGRATION_GUIDE.md:187` ("001 → 002 → 003 → 004"),
  `PHASE2_BACKEND.md:65-68` (daftar 4 file)
- **Status git:** `?? consultation_005_security_hardening.sql` (untracked); `README_AUDIT_FIX.md` juga untracked

**Bukti:**

```text
MIGRATION_GUIDE.md:15-18
| 1 | consultation_001_foundation.sql | ...
| 2 | consultation_002_tables.sql     | ...
| 3 | consultation_003_security.sql   | ...
| 4 | consultation_004_services.sql   | **Phase 2**: RPC layanan ...
```

**Skenario kegagalan:** Operator produksi mengikuti panduan → menjalankan `001→004`. Hasil: **C-1 dan C-2 aktif
di produksi**, karena `005` tidak pernah disebut. Tidak ada peringatan bahwa `004` saja tidak aman.
**Dampak:** perbaikan keamanan yang sudah ditulis **tidak sampai ke produksi**; audit berikutnya bisa salah
menyimpulkan "sudah diperbaiki" hanya karena file ada di repo.
**Rekomendasi:** commit `005`; tambahkan baris ke-5 pada tabel `MIGRATION_GUIDE.md` dan `PHASE2_BACKEND.md`;
perbarui `consultation_rollback.sql` bila perlu; jalankan `005` di lingkungan uji lalu verifikasi C-1/C-2
tertutup dengan uji integrasi; tandai `004` sebagai "tidak lengkap tanpa 005".

---

### M-7 — `005` tidak memuat blok `GRANT`/`REVOKE`; eksekusi di luar urutan membuat RPC dapat dipanggil `anon`

- **Severity:** MEDIUM (bergantung urutan deploy)
- **File:** `supabase/consultation/consultation_005_security_hardening.sql`
- **Baris:** 1–264 (tidak ada `grant`/`revoke` — verifikasi: pencarian `grant|revoke` = 0 hasil)
- **Objek:** enam fungsi yang di-`create or replace`

**Analisis:** `CREATE OR REPLACE FUNCTION` **mempertahankan ACL** fungsi yang sudah ada, sehingga bila `004`
sudah dijalankan, hak `service_role`-only tetap utuh. Namun bila `005` dijalankan pada database yang belum
pernah menjalankan `004` (mis. setup baru yang hanya menjalankan `001,002,003,005` — mungkin terjadi justru
karena `005` tidak terdokumentasi), keenam fungsi **dibuat baru** dengan default privilege PostgreSQL:
`EXECUTE` untuk `PUBLIC`. Karena `anon` dan `authenticated` adalah anggota `PUBLIC` (setelah `REVOKE` di `003`
hanya menyentuh fungsi yang ada saat itu), RPC seperti `consultation_svc_review`, `consultation_svc_jawab`,
dan `consultation_svc_rate_hit` menjadi dapat dipanggil langsung lewat PostgREST.
**Dampak:** eskalasi hak akses / pemanggilan RPC internal tanpa Edge Function. Tidak tereksploitasi bila urutan
`001→004→005` dipatuhi, tetapi tidak ada pertahanan berlapis.
**Rekomendasi:** tambahkan di akhir `005` blok `revoke all on function ... from public, anon, authenticated;`
dan `grant execute ... to service_role;` untuk keenam fungsi (idempoten, aman diulang). Tambahkan uji:
"setelah `005` dijalankan tanpa `004`, `anon` tetap tidak dapat memanggil RPC".

---

## E. Low Findings

### E.1 — Dugaan bug `old.dicabut_at` pada jalur INSERT trigger publikasi: **TIDAK TERBUKTI**

- **Severity:** LOW (bukan kerentanan; dilaporkan untuk transparansi)
- **File:** `supabase/consultation/consultation_002_tables.sql:814`
- **Objek:** `public.consultation_publication_check()`

```sql
    if old.dicabut_at is not null and kontak.persetujuan_publikasi_at < old.dicabut_at then
```

Referensi `old.*` berada di cabang yang juga dievaluasi saat `tg_op = 'INSERT'` (baris 804–820), sehingga
secara teori dapat memicu `record "old" is not assigned yet`. **Probe terisolasi** dijalankan pada PGlite
in-memory (skema mainan 1 tabel, **bukan** migrasi proyek): referensi `old.d` pada trigger `BEFORE INSERT`
**dievaluasi sebagai `NULL`**, bukan error. Kesimpulan: **bukan temuan**; `T30p` (yang membuat publikasi dengan
`persetujuan_pemohon = true`) juga akan gagal bila ini benar. Tidak ada rekomendasi keamanan; hanya saran
kebersihan kode: pindahkan pemeriksaan `old.dicabut_at` ke cabang `else` (UPDATE) agar niat kode eksplisit.

### E.2 — Default fail-open `coalesce(p_terlihat, true)` pada `pesan_staf`

- **Severity:** LOW
- **File:** `consultation_005_security_hardening.sql:157`; baseline `004:544`
- **Objek:** `public.consultation_svc_pesan_staf()`

```sql
  v_visible boolean := coalesce(p_terlihat, true);
```

Bila pemanggil lupa mengirim `p_terlihat` (atau mengirim `NULL`), pesan staf **langsung terlihat pemohon**.
Pada `005`, jalur konsultan dipaksa `false` (baris 167–170) dan `jawaban_final` dijaga (171–183), tetapi pesan
`catatan_internal` dari admin/reviewer tetap default terlihat. **Rekomendasi:** default `false`
(`coalesce(p_terlihat, false)`) atau wajibkan parameter non-null (`p_terlihat is null → error`).

### E.3 — Dokumentasi `ratelimit.ts` bertentangan dengan implementasi `guard.ts`; `memoryLimiter` tidak terpakai

- **Severity:** LOW
- **File:** `supabase/functions/_shared/ratelimit.ts:4-7, 40-85`; `_shared/guard.ts:48-57`
- **Objek:** `MemoryLimiter`, `memoryLimiter`, `guardRateLimit()`

`ratelimit.ts:6-7` menyatakan limiter memori dipakai "bila RPC gagal agar perlindungan tetap ada";
`guard.ts:54-56` menyatakan sebaliknya (fail-closed, limiter memori "tidak boleh menjadi fallback keamanan").
Pencarian `memoryLimiter` hanya menemukan definisinya — **tidak diimpor siapa pun**. **Dampak:** risiko
seseorang "menghidupkan kembali" fallback yang secara desain ditolak, dan pembaca dokumen salah memahami
model ancaman. **Rekomendasi:** hapus atau tandai eksplisit sebagai test-only, dan selaraskan komentar.

### E.4 — Respons 4xx/429 `verify-nia` tidak memakai `Cache-Control: no-store`

- **Severity:** LOW
- **File:** `supabase/functions/verify-nia/index.ts:118-143` vs `182`
- **Objek:** `fetch()` verify-nia

Hanya respons 200 yang menambahkan `Cache-Control: no-store` (baris 182). Respons `405`, `413`, `400`, dan `429`
tidak. **Dampak:** proxy/CDN dapat menyimpan `429` dan memperpanjang gangguan (mendukung M-2); `400`/`413`
tidak memuat data sensitif. **Rekomendasi:** terapkan header keamanan pada **semua** respons melalui helper
tunggal (seperti `serve()` di `http.ts:21-25`).

### E.5 — Duplikasi `readJsonLimited` di `verify-nia` (bukan memakai `_shared/http.ts`)

- **Severity:** LOW
- **File:** `supabase/functions/verify-nia/index.ts:50-78`; pembanding `_shared/http.ts:66-98, 140-156`
- **Objek:** `readJsonLimited()`

Implementasi kedua dengan semantik berbeda (melempar `Error` mentah, tanpa pesan aman, batas 8 KiB).
**Dampak:** perbaikan pada `_shared/http.ts` tidak otomatis berlaku; risiko divergensi di masa depan.
**Rekomendasi:** gunakan `readTextLimited`/`readJson` dari `_shared`, atau pindahkan `readJsonLimited` ke `_shared`.

### E.6 — Bucket `consultation-attachments` (Fase 1) tidak dipakai dan tidak terdokumentasi sebagai usang

- **Severity:** LOW
- **File:** `supabase/consultation/consultation_002_tables.sql:397-405`; bucket aktif: `004:21-33`
- **Objek:** bucket `consultation-attachments`

Fase 2 memakai `consultation-private`. Dua bucket privat dengan konfigurasi identik menimbulkan kebingungan
operasional (salah bucket saat konfigurasi manual) dan menambah permukaan yang harus diaudit.
**Rekomendasi:** hapus pada migrasi pembersihan berikutnya, atau dokumentasikan eksplisit "tidak dipakai".

### E.7 — Tidak ada penetapan `search_path` eksplisit pada fungsi

- **Severity:** LOW
- **File:** seluruh `supabase/consultation/*.sql`
- **Objek:** semua fungsi `public.consultation_*`
- **Status:** pencarian `security definer` = **TIDAK DITEMUKAN**; pencarian `search_path` = **TIDAK DITEMUKAN**

Karena tidak ada `SECURITY DEFINER`, fungsi berjalan dengan hak pemanggil (`service_role`), sehingga risiko
classic `search_path` hijacking sangat kecil. **Rekomendasi (hardening):** tambahkan
`set search_path = public, pg_temp` pada fungsi baru, khususnya bila kelak ada `SECURITY DEFINER`.

### E.8 — Pembersihan tabel `consultation_rate_hits` bersifat probabilistik dan tidak terikat jadwal

- **Severity:** LOW
- **File:** `consultation_004_services.sql:956-959`; `005:250-252`
- **Objek:** `public.consultation_svc_rate_hit()`

```sql
  if random() < 0.02 then
    delete from public.consultation_rate_hits where at < now() - interval '2 hours';
  end if;
```

**Dampak:** pertumbuhan tabel tidak terbatas pada trafik rendah; `count(*)` pada window menjadi lebih mahal.
Bukan masalah keamanan langsung. **Rekomendasi:** indeks `(bucket, endpoint, at)` sudah ada? — verifikasi;
jadwalkan `pg_cron` untuk pembersihan, atau gunakan `delete ... where at < now() - interval '2 hours'` dengan
probabilitas lebih tinggi/berbasis waktu.

---

## F. Security Controls That Passed

Kontrol berikut **terbukti dari source** (bukan dari eksekusi). Tidak ada klaim "lulus uji" di sini kecuali
dinyatakan.

| # | Kontrol | Bukti |
|---|---------|-------|
| F1 | RLS aktif pada **16/16** tabel konsultasi, **tanpa satu pun policy** (deny-by-default) | `003_security.sql:16-31`; pencarian `create policy` = **TIDAK DITEMUKAN** |
| F2 | Seluruh hak tabel dicabut dari `public, anon, authenticated` | `003:35-53` |
| F3 | `EXECUTE` RPC dicabut dari `public, anon, authenticated`, hanya `service_role` | `004:1005-1038`; grant `004:1040-1073` |
| F4 | Sequence nomor tiket: `usage, select` hanya untuk `service_role` | `003:79-80` |
| F5 | Tidak ada `SECURITY DEFINER` di seluruh migrasi konsultasi | pencarian case-insensitive = **TIDAK DITEMUKAN** |
| F6 | Identitas staf dari GoTrue + role dari database (bukan klaim klien) | `_shared/auth.ts:1-15`; `004:40-52` |
| F7 | Aktor divalidasi ulang di database sebelum setiap mutasi staf | `002:557-574` (`consultation_set_aktor`), `004:40-52` |
| F8 | Secret tiket disimpan sebagai HMAC-SHA256 + pepper, tidak pernah plaintext | `001` catatan desain; `_shared/secret.ts`; `004:757-776` |
| F9 | Nomor tiket dari sequence; nilai pemanggil ditolak | `002` trigger nomor; uji `T30a` |
| F10 | CORS allowlist eksplisit, **tidak pernah `*`** | `http.ts:32-43`; `verify-nia:92-99` |
| F11 | Error mapping aman (tanpa SQL/stack/rahasia) | `errors.ts:40-92`; `http.ts:189-196` |
| F12 | Append-only pada `messages`, `audit_logs`, `status_logs`, `reviews` | `002:702-722`, `002:899-906` |
| F13 | Invarian publikasi: terbit butuh 3 persetujuan; `published_at` dikelola sistem; tidak boleh terbit tanpa waktu | `002:225-226`, `002:727-739`, `002:781-802` |
| F14 | Pencabutan persetujuan pemohon memaksa unpublish + menandai `dicabut` | `002:870-897` |
| F15 | Batas ukuran body streaming (JSON 32 KiB; multipart 5 MiB + 128 KiB) | `http.ts:66-98`, `101-137`; `index.ts:76` |
| F16 | Signed URL berumur 120 detik; bucket privat tanpa policy storage | `db.ts:136-150`; `index.ts:168,189`; `004:21-33` |
| F17 | Rate limit persisten + **fail-closed** (503 bila RPC/pepper gagal) | `guard.ts:18-57`; `004:942-971` |
| F18 | Rate limit persisten atomik: advisory transaction lock per bucket+endpoint | `005:249` |
| F19 | Review & jawab: `SELECT ... FOR UPDATE` + validasi status di dalam transaksi | `005:124`, `005:208-212` |
| F20 | Review hanya untuk pesan `jawaban_konsultan` milik tiket yang sama; reviewer tidak boleh menyetujui jawabannya sendiri; reviewer wajib aktif | `005:213-220`; `002:641-670` |
| F21 | Audit log menyamarkan email/telepon/secret/token | `_shared/audit.ts:15-40` |
| F22 | Jawaban konsultan tersembunyi dan visibilitas diturunkan dari review `disetujui` | `005:48-52`, `135-139` |
| F23 | Lampiran internal (`message_id IS NULL`) tidak lagi bocor ke pemohon | `005:53-67`, `101-112` |
| F24 | `pesan_staf`: konsultan tidak dapat menandai pesannya terlihat; `jawaban_final` butuh status + review | `005:167-183` |

> **Catatan:** F18–F24 hanya berlaku **bila `consultation_005_security_hardening.sql` benar-benar diterapkan**.
> Pada baseline ter-commit `001→004`, kontrol tersebut belum ada (lihat C-1, C-2, M-6).

---

## G. Missing Tests

### G.1 Pengujian yang tersedia (dari source, bukan hasil eksekusi)

- `supabase/consultation/tests/test-konsultasi.mjs` — 790 baris; memuat `001→005` (baris 40–50) dan
  mengulang `005` untuk membuktikan idempotensi. **147 call-site asersi statis** (73 `ok()` + 74
  `expectErr()/roleDeny()`), mencakup T01–T31.
- `supabase/consultation/tests/test-shared.mjs` — 358 baris; **117 call-site asersi statis** (`cek()`/`tolak()`)
  untuk fungsi murni: validasi, HMAC, `MemoryLimiter`, pemetaan error, redaksi audit, `readTextLimited`/`readJson`.
- Asersi baru untuk `005` yang **ada di working tree**: `T30l-1`, `T30n-1`, `T30o-1`, `T30o-1a`, `T30o-2`,
  `T30o-3`, `T30r`, `T30aa`, `T30ab`, `T31g`, `T31h` (lihat `test-konsultasi.mjs:641-790`).

### G.2 Yang **tidak dijalankan** dalam audit ini (tidak ada bukti eksekusi)

- `node test-konsultasi.mjs` dan `node --experimental-strip-types test-shared.mjs` — **tidak dijalankan**.
- `deno check` untuk 10 Edge Function — **tidak dijalankan** (Deno tidak tersedia).
- Migrasi ke Postgres/Supabase nyata, rollback, deploy — **tidak dijalankan**.
- Uji HTTP E2E, GoTrue `auth.getUser`, Storage upload/sign, kedaluwarsa signed URL — **tidak dijalankan**.
- Uji konkurensi multi-koneksi — **tidak dijalankan** dan **tidak mungkin** dengan PGlite.

Klaim pada `README_AUDIT_FIX.md` ("125 shared lolos", "22 file TS lolos", "001→005 lulus") adalah
**BELUM DAPAT DIVERIFIKASI**. Jumlah call-site statis yang saya hitung (117 dan 147) tidak identik dengan
angka klaim, meskipun bisa dijelaskan oleh asersi di dalam loop. README itu sendiri mencantumkan batas
verifikasi yang sama dengan §G.2.

### G.3 Skenario negatif yang **belum** tercakup

1. **Konkurensi review (HIGH):** dua transaksi `consultation_svc_review()` paralel pada tiket yang sama;
   dua `consultation_svc_jawab()` paralel; verifikasi bahwa `FOR UPDATE` benar-benar menserialisasi dan
   pemenang kedua menerima error status. Tidak ada di PGlite (satu koneksi).
2. **Konkurensi rate-limit:** N request paralel pada bucket sama harus menghasilkan tepat `limit` yang lolos.
   Advisory lock hanya diuji secara sekuensial (`T31g`).
3. **H-1:** perubahan teks publikasi setelah persetujuan reviewer → persetujuan harus gugur.
4. **H-2:** `ajukan_publikasi`/`setujui_publikasi` tanpa baris review `disetujui` → harus ditolak.
5. **M-1:** `X-Forwarded-For` berisi beberapa entri (palsu + nyata) → bucket yang dipakai harus IP nyata.
6. **M-2:** 300 request tanpa body menghabiskan bucket agregat → pengguna sah menerima 429.
7. **M-3:** unggahan multipart tanpa kredensial → harus ditolak **sebelum** body diparse (uji waktu/memori).
8. **M-4:** unggah berkas HTML dengan `Content-Type: image/png` → harus ditolak.
9. **M-5:** reviewer mengambil lampiran tiket yang tidak pernah masuk antreannya → harus ditolak.
10. **M-7:** `001,002,003,005` tanpa `004` → `anon` tidak boleh dapat memanggil RPC.
11. **E.2:** `pesan_staf` tanpa `p_terlihat` → pesan tidak boleh terlihat pemohon.
12. **Storage:** tidak ada policy storage (benar), tetapi tidak ada uji bahwa `anon`/`authenticated` gagal
    membuat signed URL langsung ke `/storage/v1/object/sign/...` (butuh Supabase nyata).
13. **Kedaluwarsa signed URL** (120 detik) belum diuji.
14. **Audit trail:** belum ada uji bahwa upaya akses lampiran yang ditolak tercatat di audit.

### G.4 Keterbatasan PGlite vs PostgreSQL/Supabase nyata

- **Satu koneksi** — tidak dapat membuktikan `FOR UPDATE`, advisory lock, atau isolasi transaksi nyata.
- **Tanpa schema `storage`** — bucket dilewati dengan `raise notice` (`004:19-32`, `002:397-405`);
  RLS Storage, signed URL, dan `allowed_mime_types` **tidak teruji**.
- **Tanpa GoTrue/PostgREST/Kong** — JWT, role `anon`/`authenticated`/`service_role` diuji dengan `set role`
  manual, bukan alur HTTP nyata; header `X-Forwarded-For` tidak melalui proxy platform.
- **Tanpa kontrol waktu** — window rate limit diuji dengan `now()` nyata; tidak ada uji batas window presisi.
- **Tanpa `pg_cron`/ekstensi produksi**, tanpa beban paralel, tanpa batas resource nyata (memori isolate).
- Perilaku `CREATE OR REPLACE` terhadap ACL (M-7) tidak teruji karena `003`/`004` selalu dijalankan lebih dulu.

---

## H. File References

### Migrasi SQL

| File | Baris diperiksa | Objek penting |
|------|-----------------|---------------|
| `supabase/consultation/consultation_001_foundation.sql` | 11–57 | `consultation_can_transition()` (matriks 26 transisi; baris 35 = `menunggu_review→terjawab`) |
| `supabase/consultation/consultation_002_tables.sql` | 160–229, 251–300, 397–405, 557–574, 630–722, 727–862, 870–956 | `consultation_attachments` (183–193), `consultation_publications` (202–229), `consultation_set_aktor` (557–574), trigger review (641–670), trigger lampiran (676–697), append-only (702–722), `consultation_publication_check` (777–857), `consultation_consent_check` (870–897), `consultation_ubah_status` (939–956) |
| `supabase/consultation/consultation_003_security.sql` | 16–31, 35–53, 54–79, 82–129 | RLS 16 tabel, revoke tabel/fungsi/sequence, grant `service_role` |
| `supabase/consultation/consultation_004_services.sql` | 16–33, 115–173, 205–241, 248–348, 373–437, 495–551, 556–630, 632–649, 735–748, 757–936, 942–971, 1005–1073 | bucket privat, `akses_tiket`, `staf_daftar`/`staf_detail`, `status`, `jawab`, `pesan_staf`, `review`, `ajukan_publikasi`, `setujui_publikasi`, lampiran (izin/unggah/ambil), `rate_hit`, grant/revoke |
| `supabase/consultation/consultation_005_security_hardening.sql` | 4–264 | `akses_tiket` (4–76), `lampiran_pemohon_ambil` (78–115), `jawab` (117–148), `pesan_staf` (150–193), `review` (195–232), `rate_hit` (234–264); **tidak ada grant/revoke** |
| `supabase/consultation/consultation_rollback.sql` | 1–96 | rollback Fase 1+2 |

### Edge Functions

| File | Baris | Objek |
|------|-------|-------|
| `supabase/functions/_shared/http.ts` | 21–43, 53–60, 66–98, 101–137, 140–156, 164–197 | header keamanan, `clientIp`, `readTextLimited`, `limitedRequest`, `readJson`, `serve` |
| `supabase/functions/_shared/guard.ts` | 18–57 | `guardRateLimit` (fail-closed) |
| `supabase/functions/_shared/ratelimit.ts` | 4–7, 20–30, 40–85 | `POLICIES`, `MemoryLimiter`, `memoryLimiter` (tidak terpakai) |
| `supabase/functions/_shared/errors.ts` | 7–92 | `AppError`, `DB_MAP`, `mapDbError`, `errorPayload` |
| `supabase/functions/_shared/auth.ts` | 1–53 | `bearerToken`, `authenticateStaff` |
| `supabase/functions/_shared/db.ts` | 100–169 | `storageUpload`, `storageSign` (120 s) |
| `supabase/functions/_shared/audit.ts` | 15–75 | `redact`, `logSecurityEvent` |
| `supabase/functions/consultation-attachment/index.ts` | 62–200 | unggah multipart, jalur staf, unduh + signed URL |
| `supabase/functions/verify-nia/index.ts` | 22–191 | limiter in-memory, `readJsonLimited`, XFF, respons |
| 8 fungsi lain (`consultation-admin`, `-consultant`, `-public`, `-publication`, `-review`, `-ticket-access`, `-ticket-create`, `-ticket-message`) | — | diperiksa pola `serve`/`guardRateLimit`/`readJson`/`authenticateStaff`; tidak ditemukan jalur data langsung ke tabel |

### Pengujian & dokumentasi

| File | Catatan |
|------|---------|
| `supabase/consultation/tests/test-konsultasi.mjs` | 001–005 dimuat (40–50); T01–T31; 147 call-site asersi |
| `supabase/consultation/tests/test-shared.mjs` | 117 call-site asersi; murni Node, tanpa HTTP |
| `supabase/consultation/MIGRATION_GUIDE.md` | 15–18 (4 file), 187 ("001→004") — **tidak menyebut 005** |
| `supabase/consultation/PHASE2_BACKEND.md` | 65–68 — **tidak menyebut 005** |
| `supabase/consultation/PGlite_TEST_RESULTS.md`, `PHASE2_TEST_RESULTS.md` | klaim hasil lama; tidak diverifikasi ulang |
| `README_AUDIT_FIX.md` | untracked; klaim 125/22/001–005 — **BELUM DAPAT DIVERIFIKASI** |

---

## I. Recommended Remediation Plan

Urutan berdasarkan risiko × kemudahan verifikasi.

**Fase 1 — Wajib sebelum deploy apa pun (menutup C-1, C-2, M-6, M-7)**
1. Commit `consultation_005_security_hardening.sql` dan `README_AUDIT_FIX.md`.
2. Tambahkan blok `REVOKE`/`GRANT` idempoten di akhir `005` untuk keenam fungsi (M-7).
3. Perbarui `MIGRATION_GUIDE.md` (tabel + langkah 187) dan `PHASE2_BACKEND.md` agar menyebut `005`
   sebagai **wajib** setelah `004`; tandai `004` tanpa `005` sebagai tidak aman (M-6).
4. Jalankan `001→005` di database uji nyata (bukan PGlite), lalu verifikasi manual:
   (a) jawaban konsultan tidak terlihat sebelum review; (b) lampiran `message_id IS NULL` tidak dapat
   diambil pemohon; (c) `anon` tidak dapat memanggil RPC mana pun.

**Fase 2 — High (integritas publikasi)**
5. H-1: reset seluruh flag persetujuan pada perubahan konten publikasi, atau terapkan `konten_hash`
   yang disetujui dan diperiksa saat `terbitkan`; tambah audit `publikasi_konten_diubah`.
6. H-2: wajibkan baris review `disetujui` pada `ajukan_publikasi` dan `setujui_publikasi`; larang
   `menunggu_review → terjawab` di luar `consultation_svc_review`.

**Fase 3 — Medium**
7. M-1: ganti `clientIp()` ke entri XFF yang ditambahkan proxy (atau header platform tepercaya); uji integrasi.
8. M-2: pindahkan `verify-nia` ke `guardRateLimit()` persisten; catat hit setelah validasi body; dokumentasikan
   batas agregat sebagai per-instance.
9. M-3: pindahkan rate-limit/autentikasi sebelum `formData()`; pertimbangkan parser streaming; perbaiki komentar
   yang menyesatkan di `index.ts:74-75`.
10. M-4: validasi magic bytes; tetapkan `Content-Type` dari hasil deteksi; paksa `Content-Disposition: attachment`.
11. M-5: batasi `lampiran_izin`/`lampiran_staf`/`lampiran_staf_ambil` untuk reviewer pada tiket dalam
    kewenangannya; tambahkan `p_ticket` pada RPC ambil metadata.

**Fase 4 — Low / kebersihan**
12. E.2 default `p_terlihat = false`; E.3 hapus/beri label `memoryLimiter`; E.4 header keamanan pada semua
    respons; E.5 satukan `readJsonLimited`; E.6 tandai/hapus bucket usang; E.7 `search_path` eksplisit;
    E.8 jadwalkan pembersihan `consultation_rate_hits` + indeks yang sesuai.

**Fase 5 — Pengujian (lihat §G.3)**
13. Tambah uji konkurensi nyata (Postgres multi-koneksi) untuk review/jawab/rate-limit.
14. Tambah uji regresi untuk H-1, H-2, M-1..M-5, M-7, E.2.
15. Tambah uji integrasi HTTP + Storage + GoTrue di lingkungan staging sebelum produksi.

---

## J. Deployment Readiness

> **CONDITIONALLY READY**

**Alasan (ringkas):**

- Lapisan database Fase 1 (`001`–`003`) dan sebagian besar kontrol Fase 2 **layak**: RLS deny-by-default
  16/16 tanpa policy, nol `SECURITY DEFINER`, hak RPC hanya `service_role`, audit teredaksi, append-only,
  invarian publikasi, rate-limit persisten fail-closed, signed URL 120 detik, dan CORS allowlist.
- **Namun baseline ter-commit `001→004` TIDAK AMAN untuk produksi**: C-1 (jawaban belum direview terbaca
  pemohon) dan C-2 (lampiran internal dapat diunduh pemohon) aktif, dan panduan migrasi yang ada justru
  mengarahkan operator ke keadaan itu (M-6).
- Perbaikan **sudah ada di working tree** (`005`) tetapi **untracked**, **tanpa** `GRANT`/`REVOKE` (M-7), dan
  **belum pernah dieksekusi** — termasuk tidak ada bukti uji konkurensi nyata maupun uji Storage/HTTP.

**Syarat agar status naik menjadi READY FOR FURTHER INTEGRATION TESTING:**

1. `005` di-commit dan **wajib** dicantumkan pada `MIGRATION_GUIDE.md` + `PHASE2_BACKEND.md`.
2. `005` memuat `REVOKE`/`GRANT` eksplisit untuk keenam fungsi yang di-`create or replace`.
3. `001→005` dijalankan di Postgres/Supabase uji nyata, dengan bukti eksekusi untuk:
   jawaban tersembunyi sebelum review, lampiran internal tidak dapat diambil pemohon, `anon` tidak dapat
   memanggil RPC, dan dua review paralel menghasilkan tepat satu pemenang.
4. H-1 dan H-2 diperbaiki atau diterima sebagai risiko tertulis oleh pemilik produk (dengan kontrol prosedural
   yang eksplisit), karena keduanya menyangkut integritas arsip publik.
5. Uji integrasi HTTP minimal untuk `consultation-attachment` (batas ukuran, MIME, otorisasi unduh) dan
   `verify-nia` (rate limit + XFF) dijalankan di staging.

**Yang TIDAK boleh dilakukan:** menerapkan `001→004` ke produksi dan menyatakan Fase 2 "selesai", atau
menyatakan audit ini "lulus" berdasarkan type-check/`deno check` saja — tidak ada pemeriksaan tipe yang
membuktikan kebocoran data pada C-1/C-2.

---

*Laporan ini dihasilkan dalam mode READ-ONLY. Tidak ada file sumber, migrasi, konfigurasi, atau data yang diubah.
Satu-satunya berkas yang ditulis adalah laporan ini sendiri.*
