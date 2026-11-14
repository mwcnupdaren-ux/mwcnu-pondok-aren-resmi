# SECURITY FINDINGS — Phase 0 Audit

Tanggal: 2026-11-14 · Temuan keamanan sistem existing, relevan bagi modul Konsultasi Agama.
Severity: KRITIS / TINGGI / SEDANG / RENDAH / INFO. Tidak ada perbaikan dilakukan pada fase ini.

## A. Temuan terhadap sistem existing

### S1 — SEDANG: Tidak ada rate limiting di mana pun
- REST publik, `/auth/v1/*`, dan form KTA tanpa pembatasan percobaan.
- Dampak bagi konsultasi: brute-force secret tiket, spam pengajuan.
- Rekomendasi: rate limit di Edge Functions (tabel hit DB atau layanan eksternal) — lihat C2 di Integration Plan.

### S2 — SEDANG: Kredensial & kunci di sisi klien statis
- `js/config.js` berisi anon/publishable key — **sesuai desain** (RLS menutup) dan bukan bocor.
- Namun pola ini berarti keamanan bergantung 100% pada RLS; modul konsultasi wajib tetap deny-default + semua operasi sensitif via functions (service_role di secrets Supabase, bukan Vercel).

### S3 — RENDAH: Akun uji belum dibersihkan
- 5 akun uji tidak terkonfirmasi di Supabase Auth (`uji-mwcnu.*@fldubai.com` ×3, `uji.mwcnu.*@guerrillamailblock.com` ×2).
- Dampak: minim; tetap disarankan dihapus oleh sekretariat.

### S4 — RENDAH: Bucket `media` publik
- Sesuai kebutuhan CMS (foto berita), tetapi **tidak boleh** menjadi tempat lampiran konsultasi (identitas pemohon).
- Rekomendasi: bucket privat terpisah + signed URL.

### S5 — INFO: CSP `script-src 'unsafe-inline'`
- Diperlukan pola IIFE/inline saat ini; risiko XSS mitigasi via `mwcEsc` disiplin.
- Modul konsultasi wajib memakai `mwcEsc` untuk SEMUA konten dinamis (pesan tiket, jawaban, lampiran nama file).

### S6 — INFO: localStorage menyimpan sesi anggota
- `mwc_auth` (token) + profil cache. Standar untuk situs ini; untuk modul konsultasi: **secret tiket tidak boleh disimpan permanen di localStorage** (sessionStorage/in-memory saja, sesuai spesifikasi).

### S7 — INFO: Header keamanan lengkap & ketat (positif)
- HSTS preload, X-Frame-Options DENY, nosniff, Permissions-Policy, CSP — fondasi baik yang otomatis berlaku juga untuk halaman konsultasi.

### S8 — INFO: Defensif yang sudah baik (positif)
- RLS 6/6 tabel aktif; 9 fungsi definer + search_path terkunci; `keep_last_admin`; `guard_publish`/`guard_item_type`; verifikasi tulis admin via primary-key; `verify_nia` hanya inisial; kolom `status`/`nia` tidak di-grant ke user.

## B. Prasyarat keamanan yang WAJIB dipenuhi modul konsultasi (checklist Phase 1–2)

1. Semua `consultation_*` tabel: RLS aktif, **tanpa policy untuk anon & authenticated** (deny default); akses hanya service_role di functions.
2. Secret akses: 32 byte CSPRNG → tampilkan plaintext **satu kali**; simpan `hmac_sha256(secret, pepper)`; pepper di secrets functions; kolom hash, bukan plaintext; tidak ada secret di log (jangan `console.log` body).
3. Kontak pemohon di tabel terpisah (`consultation_requester_contacts`) dari konten publik (`consultation_publications` — snapshot tersamar tanpa identitas).
4. Nomor tiket tidak dianggap autentikasi: setiap read/message/upload wajib (ticket_no + secret-hash match) ATAU JWT staf ber-role.
5. `consultation_staff_roles` terpisah dari `public.staff.role` — jurnalis/ustadz/pengurus CMS **tidak** otomatis punya akses; konsultan hanya tiket yang ditugaskan; reviewer tidak bisa menyetujui jawaban sendiri (constraint: reviewer ≠ konsultan pesan jawaban).
6. Transisi status divalidasi di function (state machine) + `consultation_status_logs` append-only (tanpa update/delete grant).
7. Lampiran: privat bucket, mime+size whitelist, nama file disanitasi, signed URL ≤ 15 menit.
8. Audit: `consultation_audit_logs` (aktor, aksi, tiket, waktu) tanpa update/delete.
9. Tidak ada `service_role`, pepper, atau SMTP creds di repo/Vercel/frontend/log.
10. Respons error seragam & tidak membocorkan keberadaan tiket (pesan sama untuk tiket tak ada vs secret salah).

## C. Status

Tidak ditemukan temuan KRITIS/TINGGI pada sistem existing. Fondasi (RLS, definer scope, header, CSP) terbukti sehat — modul konsultasi tinggal mengikuti disiplin yang sama dan menutup celah S1–S6 pada komponen baru.
