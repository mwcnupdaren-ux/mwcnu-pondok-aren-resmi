# Audit Dasbor Admin & CMS — MWCNU Pondok Aren

Tanggal audit: 2026-11-09 · Berkas: `admin/index.html`, `admin/admin.js`, `admin/admin.css`,
`supabase/schema.sql`, `js/content.js`, `js/app.js` · Screenshot: login admin terverifikasi.

## 1. Ringkasan eksekutif

| Area | Nilai |
|---|---|
| Auth & peran | ✅ Baik — Google OAuth + tabel `staff`, RLS idempotent |
| CMS konten (13 tipe) | ✅ Semua terpakai situs publik |
| CMS pengaturan (8 kunci) | ✅ Semua terpakai situs publik |
| Palet warna admin vs situs | ⚠️ Tidak selaras (oranye vs champagne; fonts beda) |
| Kartu admin | ⚠️ Radius & hierarki tidak konsisten dengan kartu situs |
| Fungsi CRUD, media, validasi | ✅ Kuat |
| **Bug peran Jurnalis** | ❌ Jalan buntu (lihat §6) |
| **Menu Anggota / verifikasi NIA** | ❌ Belum ada di admin |
| **Inbox permintaan (WA)** | ❌ Belum ada (semua form masih WhatsApp) |

## 2. Struktur dasbor

- `admin/index.html` — cangkang 9 baris: Supabase JS client (`/js/vendor/supabase.js`), `config.js`, `admin.css`, lalu `admin.js`.
- `admin/admin.js` (~40 KB) — satu modul IIFE: helper, definisi form `COLS` (13) + `SETS` (8), render sidebar per peran, CRUD, media, staff, log, router `#/…`, `boot()`.

Router: `#/` Ringkasan, `#/{tipe}` daftar, `#/{tipe}/{id}` ubah, `#/set/{kunci}` pengaturan, `#/staff`, `#/log`.
Keluar: `signOut()` → `/admin`. Dirty-guard: `beforeunload` + konfirmasi nav bila formulir kotor.

## 3. Auth & peran

- Login: `signInWithOAuth({provider:'google'})` (admin.js:85). Boot membaca `staff` by email (admin.js:296‑297).
- Peran: `super_admin`, `admin` (legacy), `pengurus`/`editor`, `jurnalis`, `ustadz` (admin.js:68,78). 
- Enforcement ganda: UI `can()` (admin.js:69‑76) + RLS `can_edit()`/`can_review()` (schema.sql:34‑46).
- Kunci keamanan database: trigger `keep_last_admin()` (schema:121) mencegah hapus/turunkan Super Admin terakhir; UI juga mengecek (admin.js:267‑268).

## 4. CMS — semua tipe terpakai?

| Tipe admin | Dipakai situs publik di | Status |
|---|---|---|
| berita | `app.js:180` (`N`) | ✅ |
| agenda | `app.js:64` (`AG`) | ✅ |
| video | `app.js:99` (`V`) | ✅ |
| galeri | `app.js:227` (`G`) | ✅ |
| kegiatan | `app.js:114` (`KC`) | ✅ |
| layanan | `app.js:137` (`LSV`) | ✅ |
| program | `app.js:82` (`P`) | ✅ |
| banom | `app.js:151` (`BANOM`) | ✅ |
| ranting | `app.js:249` (`K`) | ✅ |
| pengurus | `MW.grp` default (`app.js:44`) | ✅ |
| majelis | `window.MWC_MT` (`app.js:471`, dari `content.js` prep) | ✅ |
| tanya_jawab | `window.MWC_QA` (`app.js:448`) | ✅ |
| halaman | `M.raw('halaman')` (`content.js:97`) | ✅ |

Pengaturan situs (semua terpakai): `kontak` (ganti nomor WA di `content.js:50`), `medsos`, `sambutan`, `hero` (slides harus tepat 4 — divalidasi admin.js:139), `kartu` (penandatangan + TTD PNG), `pay` (rekening + QRIS), `identitas` (slogan/sk), `zakat` (harga emas).

Catatan Ringkasan: bila tipe belum dikelola CMS (`managed`), situs memakai data bawaan; admin menampilkan peringatan + tombol **Aktifkan pengelolaan** (admin.js:196,216).

## 5. Palet warna & kartu

### Palet

| Token | Situs publik | Admin |
|---|---|---|
| Hijau aksen | `#0FA968` emerald | `#2F6B4F` hijau hutan + `#2BD9A0` neo |
| Emas | `#C0A15E` champagne | `#E4761B` **oranye** |
| Tombol utama | gradient emerald | `.btn` gradient **oranye** |
| Gelap sidebar | `#062019` | `#0F3B2C→#08201A` (serupa) |
| Latar | putih / `#F3F8F5` | `#F4F6F3` |

**Temuan:** oranye `#E4761B` tidak dipakai di situs; tombol admin oranye bertabrakan dengan identitas hijau–emas situs. Font admin masih `Space Grotesk` + `Plus Jakarta Sans` (admin.css:1, index.html:5), padahal situs resmi kini **Primer Plus Jakarta Sans + Sekunder Inter**. Radius kartu admin: `.card 22px`, `.stat 16px`, `.panel 18px`, `.rrow 14px` — tidak ada skala bersama vs kartu situs (20–26px).

### Kartu & komponen admin

- `.stat` (Ringkasan): kartu angka-link dengan hover batas neon, teks `Jumlah · x draf` — baik, tetapi batas hover `#2BD9A0` tidak ada di situs.
- `.panel` (daftar + formulir), `.rrow` (baris repeater kartu/rekening), `.thumb/.imgs` (media dashed placeholder), `.chip` (Terbit abu-emerald / Draf krem), `.act` (aksi tabel), `.note` (kuning peringatan / hijau ok), `#toast` (gelap).

## 6. Fungsi — yang sudah kuat

- **CRUD penuh**: tambah, ubah, hapus (hanya Super Admin), salin sebagai draf, terbitkan/sembunyikan, urut naik/turun (hanya bukan-by-tanggal, admin.js:205).
- **Pencarian + filter** daftar (debounce 250 ms, `admin.js:214`), validasi YouTube/WA/slides (admin.js:136‑139), dirty-guard.
- **Media**: shrink ke WebP (JPEG bila gagal), upload ke bucket `media/{folder}/{yyyy}/…`, tolak >12 MB (admin.js:158‑163), bucket limit 5 MB (schema.sql:181) — **tidak sinkron**, berkas 5–12 MB akan gagal.
- **Staff**: tambah/ubah/hapus + proteksi Super Admin terakhir (UI + trigger database).
- **Riwayat**: `change_log` via trigger `log_change()` (schema:94‑109), tampil 150 terakhir (admin.js:272).
- **Storage & RLS**: bucket `media` publik, upload hanya staff, ubah/hapus hanya Super Admin (schema:190‑198); `content_items`/`site_settings` anon khusus publik+render (schema:154‑155,150).

## 7. Bug & risiko ditemukan

1. **Jurnalis jalan buntu di Berita** — sidebar menampilkan **Berita** namun `viewList` menolak jurnalis (admin.js:200: `S.me.role==='jurnalis' && key==='berita' → noAccess`) dan `viewHome` menyembunyikan kartu Berita untuk jurnalis (admin.js:195). Jurnalis tidak bisa membuka daftar untuk membuat Literasi/Opini.
2. **Tanpa menu Anggota** — tidak ada daftar `profiles`, tombol Verifikasi NIA, atau antrean `pending` di admin. Verifikasi KTA hanya bisa lewat Table Editor.
3. **Tanpa inbox permintaan** — formulir Layanan/Ambulans/Konsultasi/Majelis/Tanya Jawab masih WhatsApp; tidak bisa direkap/dijawab dari admin.
4. **Batas upload vs bucket** — 12 MB (JS) vs 5 MB (bucket). Unggah 6–12 MB gagal dengan pesan generik.
5. **Dropdown peran staff** kehilangan `data-role` email bila email mengandung karakter khusus? Aman (atribut mengutip), tetapi tidak ada konfirmasi saat mengubah peran selain toast — risiko salah pilih.
6. **`sort` duplikat saat pindah posisi** ditangani (`sa===sbv` → offset, admin.js:223) — baik, namun tidak atomik (dua update tanpa transaksi).

## 8. Rekomendasi berurutan

1. **Perbaiki akses Jurnalis** (izin daftar Berita khusus Literasi/Opini) — sekitar 10 menit, langsung membuka peran jurnalis.
2. **Tambahkan menu `Anggota`** di admin: daftar `profiles` + filter status + tombol Verified/Reject (update `status`, bukan hapus).
3. **Selaraskan tema admin dengan situs**: font Plus Jakarta + Inter, tombol utama emerald (bukan oranye), token emas champagne, skala radius 20/16 — satu lapisan CSS `admin.css` saja.
4. **Sinkronkan limit upload** (samakan 5 MB atau naikkan bucket bila Sobat ingin besar).
5. **Inbox `requests`** (Prioritas 2): simpan formulir ke database + notifikasi WhatsApp otomatis (ganti klik manual).
6. **Metrik Ringkasan**: tampilkan NIA pending, permintaan baru, dan konten draf tertinggi — data sudah ada di tabel.

## 9. Cakupan yang TIDAK diaudit (butuh akses)

- Isi data riil di Supabase (jumlah baris, draf, salah ketik) — tidak terlihat dari repo.
- Bucket `media` benar-benar public dan policy aktif — terlihat hanya dari perintah schema.sql yang sudah di-run.
- Tautan OAuth Google redirect `/admin` terdaftar di Supabase — terverifikasi lewat login admin yang berhasil memuat layar masuk.
