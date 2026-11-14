# CURRENT ARCHITECTURE — MWCNU Pondok Aren

Tanggal: 2026-11-14 · Phase 0 (dokumentasi keadaan saat ini, tanpa perubahan)

## 1. Diagram arsitektur (teks)

```
                    ┌──────────────────────────────────────────────┐
  Pengunjung ───────►│  Vercel (statis)                             │
  Anggota/KTA        │  ├─ index.html  (SPA hash, app.js/content.js)│
  Staf admin         │  ├─ verifikasi.html (/v/:nia, noindex)       │
                    │  └─ /admin/ (admin.js + direktori.js, noindex)│
                    └───────────────┬──────────────────────────────┘
                                    │ HTTPS (CSP: hanya supabase.co)
                                    ▼
                    ┌──────────────────────────────────────────────┐
                    │  Supabase                                    │
                    │  ├─ Auth: Google OAuth (staf)                │
                    │  │        Email+password + konfirmasi (KTA)  │
                    │  ├─ Postgres + RLS                           │
                    │  │   staff · profiles · content_items        │
                    │  │   site_settings · change_log · nia_seq    │
                    │  ├─ Storage: bucket "media" (PUBLIK)         │
                    │  └─ RPC: verify_nia, staff_role, dst.        │
                    │  (TIDAK ADA Edge Functions)                  │
                    └──────────────────────────────────────────────┘
```

## 2. Lapisan & tanggung jawab

| Lapisan | Isi | Catatan |
|---|---|---|
| Presentasi publik | `index.html`, `css/style.css`, `js/app.js`, `js/content.js`, `js/direktori.js` | Rendering klien dari REST; cache `localStorage['mwc_data']` (fallback mati: `MWC_CFG_FALLBACK=false`) |
| Dashboard admin | `admin/index.html`, `admin/admin.css`, `admin/admin.js`, `admin/direktori.js` | supabase-js; semua aksi langsung ke tabel via RLS |
| Keamanan deklaratif | RLS + trigger + fungsi definer di `schema.sql` / `supabase-profiles.sql` | Ditegakkan di DB, bukan UI |
| Backend proses bisnis | **— kosong —** | Logika bisnis saat ini: di RLS/trigger + kode klien |
| Infrastruktur | `vercel.json` (rewrites + header), Vercel | Deploy otomatis dari `main` |

## 3. Alur data penting saat ini

**Konten publik**: `content_items`/`site_settings` → REST anon → render SPA.
**KTA**: signup email → konfirmasi (SMTP Resend) → login → PATCH/POST `profiles` (baris sendiri) → pengurus memverifikasi → `issue_nia_verified` menerbitkan NIA → publik cek `/v/:nia` → `verify_nia()` (inisial saja).
**CMS**: staf login Google → `staff_role()` dari email JWT → CRUD sesuai RLS → trigger `touch_row` + `log_change` + `guard_publish`/`guard_item_type` → `change_log`.
**Direktori**: tabel/seed direktori pengurus & ranting (FASE 2–3) dirender publik.

## 4. Kontrak yang HARUS dipertahankan modul baru

1. Routing hash di index; nav 5 grup; `#daftar` & `#profil` tidak boleh berubah perilaku.
2. Admin: nav bergrup + `MWCADM`/`MWCDIRADM`; desain `admin.css`.
3. RLS "deny by default" — setiap ekspos baru harus eksplisit & minimal.
4. `service_role` hanya di server (functions) — tidak pernah ke klien.
5. CSP `connect-src` sudah mencakup domain functions; jangan melonggarkan.
6. Riwayat perubahan via `change_log` (pola trigger) untuk tabel konsultasi yang penting diaudit.
7. Idempotensi & non-destruktif pada semua migrasi (pola `if not exists`, `drop policy if exists`).
8. Penamaan komentar kode: bahasa Indonesia, gaya var/ES5.

## 5. Batas-batas yang diketahui

- Tidak ada backend proses bisnis: transaksi multi-langkah, rate limiting, HMAC/pepper, signed URL — **semuanya harus dibangun baru**.
- Tidak ada penjadwalan (cron) — SLA/ reminders butuh `pg_cron` atau pemanggilan manual/Edge scheduled functions (keputusan Phase 1/2).
- Notifikasi: hanya email (Resend SMTP sudah terbukti). WhatsApp gateway tidak ada.
