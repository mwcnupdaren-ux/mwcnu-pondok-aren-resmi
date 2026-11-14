# AUDIT EXISTING SYSTEM — Situs MWCNU Pondok Aren

Tanggal audit: 2026-11-14 · Fase: Phase 0 (audit saja, tanpa perubahan kode/DB)
Metode: pemeriksaan langsung struktur repo, source code, `vercel.json`, dan probe live (REST anon).

## 1. Ringkasan

| Aspek | Fakta terverifikasi |
|---|---|
| Frontend | Statis murni: HTML + CSS + JavaScript vanilla (ES5-style, IIFE), tanpa framework, tanpa bundler |
| Hosting | Vercel (`cleanUrls`, rewrites, header keamanan lengkap di `vercel.json`) |
| Domain | `https://www.mwcnupondokaren.or.id/` (juga apex & `*.vercel.app`) |
| Database | Supabase Postgres — `wvfcifqolohfipvepxss.supabase.co` |
| Kunci klien | `sb_publishable_…` (anon/publishable) di `js/config.js` — **service_role tidak pernah ada di frontend** (dikonfirmasi) |
| Backend server | **Belum ada.** Tidak ada folder `supabase/functions` — Edge Functions 0 buah |
| Storage | Bucket `media` (PUBLIK, max 5 MB, image/*) untuk foto CMS |
| Riwayat | Tabel `change_log` ditulis lewat trigger `log_change()`, dibaca admin |

## 2. Frontend & routing

- **Beranda SPA satu dokumen** (`index.html`) dengan routing **hash**: `#profil`, `#struktur`, `#ranting/:kode`, `#pengurus/:slug`, `#program`, `#berita`, `#agenda`, `#galeri`, `#zis`, `#daftar`, `#kontak`, dst. Router ada di `js/app.js` + `js/content.js`.
- **Halaman terpisah**: `verifikasi.html` (rewritten `/v/:nia`, `noindex`) untuk verifikasi Kartu Anggota.
- **Dashboard admin**: `/admin/index.html` + `admin/admin.js` (CMS) + `admin/direktori.js` (direktori organisasi & pengelola), SPA hash internal (`#/`, `#/set/pay`, dst.), header `no-store` + `noindex`.
- **Konten CMS** dirender dari tabel `content_items` (semua jenis: berita, agenda, video, galeri, kegiatan, majelis, tanya_jawab) dan `site_settings` (kontak, medsos, hero, kartu, zakat, pay/rekening, dst.).

## 3. Integrasi Supabase

- Satu sumber konfigurasi: `js/config.js` (`MWC_CFG.supabaseUrl`, `supabaseKey`), dipakai index, admin, dan verifikasi.
- Admin menggunakan **supabase-js** (`sb.auth`, `sb.from(...)`); halaman publik/KTA memakai **fetch REST** langsung ke `/rest/v1` dan `/auth/v1` dengan apikey + bearer.
- Konten publik: anon membaca `content_items` & `site_settings` (RLS membatasi `published`); `staff` & `change_log` **401 ditolak** untuk anon (terverifikasi live).

## 4. Autentikasi

| Aktor | Mekanisme | Letak kode |
|---|---|---|
| Staf/admin | `signInWithOAuth({provider:'google'})`, redirect `/admin` | `admin/admin.js` |
| Anggota (KTA) | Email+kata sandi (`/auth/v1/signup`, `token?grant_type=password`), konfirmasi email wajib, SMTP Resend custom | `js/app.js` |
| Pemohon anonim | **Tidak ada** — pola ini baru untuk modul konsultasi | — |

- Identitas staf dipetakan ke role lewat `public.staff_role()` (security definer) berdasarkan email JWT.
- Sesi admin: supabase-js (`getSession`, `onAuthStateChange`) — role disegarkan saat `USER_UPDATED`/`TOKEN_REFRESHED`; keluar paksa jika staff terhapus.
- Sesi anggota: `localStorage['mwc_auth']` (access/refresh token + user) — access_token dipakai memanggil `profiles` (RLS baris-sendiri).

## 5. Struktur dashboard admin

- Kerangka: `shell(title, active, body, actions)` — nav bergrup (Konten / Beranda & Layanan / Organisasi / Pengaturan situs) via `GROUPS`, `COLS`, `SETS`.
- Form generik: `formHTML/readForm/validate/bindForm` — dapat dipakai ulang.
- Jembatan antar modul: `window.MWCADM` (sb, state, shell, toast, esc, isAdmin, errMsg, roleName, form utils) dan `window.MWCDIRADM`.
- CRUD: list + pagination in-memory, duplikat, publish/unpublish, hapus (super_admin saja), urutan.
- Tulisan diverifikasi ulang via select primary-key (commit `7f0053d`).

## 6. Integrasi `public.staff`

- Definisi & role: `supabase/schema.sql` — `super_admin | pengurus | jurnalis | ustadz` (constraint `staff_role_allowed`).
- Pengelolaan UI: `admin/direktori.js` (tambah/hapus pengelola, ubah role & prnu) — hanya super_admin.
- Proteksi: `keep_last_admin()` menolak menghapus/menurunkan super_admin terakhir.
- RLS: `staff_read`/`staff_write` (admin), `staff_self_select` (baris sendiri).

## 7. Integrasi `public.profiles`

- Definisi: `supabase-profiles.sql` — KTA anggota (nama, hp, wadah/tingkat/ranting, alamat, lahir, jk, pekerjaan + `nia`, `status`, `issued_at`, `signers`, `verified_by/at`).
- Klien hanya boleh PATCH kolom non-sensitif; `status`, `nia`, `issued_at` diatur server (`issue_nia_verified`, guard).
- RLS: `own read/insert/update`; `staff read/update members` untuk is_profile_manager.
- Verifikasi publik NIA: RPC `verify_nia(text)` — hanya mengembalikan inisial + wilayah (tanpa nama penuh).

## 8. RLS & RPC (pemanggilan)

- RLS aktif di 6 tabel (terverifikasi SQL: `staff`, `site_settings`, `content_items`, `change_log`, `profiles`, `nia_seq` — semua `rowsecurity = true`).
- 9 fungsi keamanan `security definer` + `search_path=public` terkunci (terverifikasi SQL).
- Pola RPC yang dipakai klien: `verify_nia` (anon+auth). Pola "grant ketat per kolom" dipakai di `profiles` — acuan bagus untuk konsultasi.

## 9. Edge Functions

- **Tidak ada** (tidak ada `supabase/functions`, tidak ada `config.toml`, tidak ada deployment functions).
- Implikasi untuk modul konsultasi: infrastruktur functions harus **dibangun dari nol** — folder, konfigurasi CLI, dan proses deploy (dashboard/CLI) — plus secrets di Supabase, bukan di repo/Vercel.

## 10. Supabase Storage

- Bucket tunggal `media` — **publik**, akses langsung URL, upload dari admin.js.
- Untuk konsultasi diperlukan bucket **privat** baru (mis. `consultation-attachments`) + distribusi lewat **signed URL** dari Edge Function — pola publik tidak boleh ditiru.

## 11. Environment variables

- Vercel: **tidak memakai** environment variables (semua konfigurasi klien statis di `js/config.js`).
- Supabase: SMTP/Resend diatur di Dashboard; **belum ada secrets functions** (pepper, dsb.) — harus dibuat pada Phase 2 dan hanya di Supabase.

## 12. Deployment & domain

- Alur: commit → push (dengan persetujuan) → Vercel build otomatis → cek `READY` via `npx vercel ls`.
- CSP (`vercel.json`): `connect-src 'self' https://wvfcifqolohfipvepxss.supabase.co wss://…` — **Edge Functions pada domain proyek yang sama otomatis diizinkan**, tidak perlu ubah CSP.
- `X-Frame-Options: DENY`, HSTS preload, `nosniff`, Permissions-Policy — semua sudah ketat.

## 13. Komponen UI yang dapat digunakan kembali

- `mwcEsc` (escape HTML tunggal), `MWC_RT` (11 kelurahan), `MWC_NIA_CD`.
- Admin: `shell`, `toast`, `errMsg`, `roleName`, `formHTML/readForm/validate/bindForm`, pola list/pagination.
- CSS: `admin.css` + `style.css` (design system hijau-emas, komponen form/kartu/tabel responsif).
- Pola pesan status (hijau/merah netral), loading/empty state sudah ada di beberapa modul.

## 14. Perbandingan repo vs dua skema SQL acuan

| Item | Skema acuan | Realitas produksi | Selaras? |
|---|---|---|---|
| `touch_row()` | schema.sql: versi guarded `to_jsonb` (diperbarui 2026-11-14) | Produksi memakai versi to_jsonb (patch dijalankan) | ✓ |
| Kolom `created_by` | ada | ada (patch #1 dijalankan) | ✓ |
| RLS 6 tabel | aktif | aktif | ✓ |
| Fungsi definer | 9 + search_path terkunci | 9 + terkunci | ✓ |
| Role staff | 4 peran | 4 peran (tanpa role legacy tersisa di produksi? — perlu cek data, lihat risiko R2) | ~ |
| Bucket storage | `media` publik | `media` publik | ✓ (tapi tak layak untuk lampiran konsultasi) |

## 15. Fakta penting lain

- Tidak ada rate limiting di mana pun (REST publik & auth terbuka).
- Tidak ada pembersihan akun uji di Supabase Auth (5 akun `uji.*` — tidak berbahaya, bisa dihapus).
- `mailer_autoconfirm: false`; konfirmasi email ON.
