# Audit Daftar Akun → Daftar KTA — MWCNU Pondok Aren

Tanggal audit: 2026-11-11 · Lingkup: alur **Buat akun** (Supabase Auth) → **profil** (`public.profiles`) →
**Daftar KTA** (canvas + PDF + QR) → **verifikasi** (`verify_nia` + `/v/:nia`) · Berkas yang dibaca:
`index.html` (bagian `#daftar`), `js/app.js` (modul Kartu Anggota, baris 540‑694), `verifikasi.html`,
`supabase-profiles.sql`, `supabase/schema.sql`, `admin/admin.js` (`viewMembers`, `viewHome`), `js/config.js`, `vercel.json`.

Audit ini **statis** (tanpa akses ke proyek Supabase `wvfcifqolohfipvepxss`), jadi isi tabel dan status policy riil
tidak diperiksa. Semua nomor baris merujuk versi berkas saat audit.

---

## 1. Ringkasan eksekutif

| Area                                          | Nilai                | Catatan singkat                                                                      |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| Alur UI: masuk → data diri → kartu → unduh    | ⚠️ Berfungsi         | Form lengkap, PDF/PNG dibuat sendiri, QR ada                                         |
| Akun & profil tersimpan di server             | ✅ Ada               | `profSave()` upsert ke `profiles` bila sesi punya `access_token`                     |
| Nomor induk (NIA) unik & berurutan            | ❌ **Kritis**        | 6 digit **acak di browser**, tidak pernah dicek unik                                 |
| NIA berubah setelah profil tersimpan          | ❌ **Kritis**        | NIA diturunkan dari **form**, bukan dari profil server                               |
| Email akun **bisa tidak pernah diverifikasi** | ❌ **Kritis**        | Ada jalur cadangan `local-<email>` yang masuk tanpa bukti kepemilikan email          |
| Siapa boleh membuat KTA                       | ❌ Belum ada syarat  | Siapa pun yang punya email bebas membuat kartu + klaim NIA                           |
| Keterangan "belum terdaftar"                  | ⚠️ Tidak akurat      | Teks menyatakan nomor/QR belum tercatat, padahal NIA & nama sudah tersimpan          |
| Verifikasi QR publik                          | ⚠️ Rapuh             | `verifikasi.html` bergantung pada `verify_nia` yang bisa hilang                      |
| Nomor format 5 digit                          | ⚠️ Cacat             | Regex mengizinkan 5 digit, generator selalu 6 digit                                  |
| Persetujuan data                              | ⚠️ Kadaluarsa        | Teks persetujuan menyebut "tidak disimpan oleh situs ini"                            |
| Dasbor admin anggota                          | ⚠️ Hanya Super Admin | Pengurus tak bisa memverifikasi (bertentangan dengan konsep peran ranting di README) |
| Penanda tangan kartu                          | ⚠️ Tidak terkunci    | Bisa diubah CMS setelah kartu cetak beredar                                          |

Kesimpulan: **alur teknis berjalan, tetapi kontrak data akun → KTA belum layak.** Tiga hal harus dibereskan sebelum
kartu dianggap sah: (a) NIA harus dibuat **server** dan **imutable**, (b) akun harus **terverifikasi email** dan belum
mengklaim NIA, (c) pernyataan publik tentang status kartu harus diselaraskan.

---

## 2. Alur yang diaudit (apa yang benar-benar terjadi)

```
1. index.html #daftar  → kAuth  (Masuk / Buat akun & profil)          app.js:310, 573‑589
2. signup/token         → sesSet({access_token, user})                 app.js:578‑582
3. profSave(first)      → upsert profiles {id,email,nama,hp}           app.js:557, 568
4. kGate tampil         → isi data diri + foto + centang persetujuan   app.js:564, 660‑665
5. nia() saat render    → MWC-<rt>-<YY>-<acak6>-<cek>  (di browser)   app.js:596‑598
6. tombol PDF/A4/PNG    → job() → profSave({...,nia,...}) lagi          app.js:687‑691
7. tombol WA            → profSave(...) + buka wa.me (tanpa data terkirim otomatis) app.js:692
8. QR depan/belakang    → https://mwcnupondokaren.or.id/v/<nia>        app.js:640
9. /v/<nia>             → verifikasi.html → rpc verify_nia(p_nia)      verifikasi.html:27‑38
10. admin #/members     → select/update profiles.status                 admin.js:338‑361
```

---

## 3. Temuan (berurut tingkat bahaya)

### K‑1 ❌ NIA acak di browser, tanpa cek unik — risiko tabrakan dan pemakaian ganda

`js/app.js:596‑598`:

```js
S.rand = String(Math.floor(Math.random() * 999999) + 1).padStart(6, "0");
return "MWC-" + rr + "-" + yy + "-" + S.rand + "-" + cd(rr + yy + S.rand);
```

- Ruang nilai hanya **1–999 999** (≈10⁶) per (ranting, tahun). Dengan 2 000 anggota di satu kelurahan,
  peluang minimal satu tabrakan ≈ **86 %** (birthday bound: 1 − e^(−n²/2N)).
- Tidak ada pembacaan server sebelum menetapkan nomor. `profiles.nia` memang `unique`
  (`supabase-profiles.sql:16`), tetapi upsert memakai `Prefer: resolution=merge-duplicates`
  (`app.js:557`) sehingga **bentrok NIA tidak error — malah menimpa baris milik anggota lain** (lihat K‑2).
- README sendiri masih menjanjikan: _"setelah basis data terhubung, nomor urut diberikan database"_
  (`README.md:157`) — janji ini belum ditepati.

**Wajib:** terbitkan NIA di server (`nextval` per wilayah, atau `gen_random_uuid()` dipendekkan + `unique` + retry),
lalu kunci kolom itu dari perubahan klien.

### K‑2 ❌ NIA diambil dari form, bukan dari profil — kartu vs. database bisa berbeda

- `nia()` membaca `localStorage['mwc_rand_<user>']` (`app.js:596‑597`). Kalau kunci ini hilang (mode privat,
  ganti perangkat, `localStorage` dibersihkan), **NIA baru dibuat** dan `profSave` menimpanya ke baris profil yang sama.
- `profSave` selalu HTTP **POST dengan `merge-duplicates`** (`app.js:557`) → operasi di atas baris yang sama
  dianggap _upsert_, jadi NIA lama hilang tanpa jejak. Kartu yang sudah dicetak menjadi **tidak terdaftar**.
- `profFetch()` hanya memulihkan `nama`, `hp`, `email` (`app.js:560`) — **`nia`/`wadah`/`tingkat`/`ranting`/`alamat`/
  `tempat_lahir`/`tanggal_lahir` tidak pernah dimuat kembali ke form**. Di perangkat lain pengguna mengisi ulang
  data (boleh berbeda dari yang tersimpan) dan tetap mendapat NIA baru.
- RLS `own update` (`supabase-profiles.sql:50‑55`) mengizinkan klien mengubah **semua kolom** baris miliknya,
  termasuk `nia` dan `status`. Lihat K‑3.

**Wajib:** setelah profil punya NIA, form & tombol unduh hanya menampilkan NIA **read‑only dari server**;
ubah ke `PATCH /profiles?id=eq.<uid>` (bukan upsert) dan batasi kolom yang boleh ditulis klien.

### K‑3 ❌ `status` bisa diubah sendiri oleh pemilik akun (verifikasi KTA bisa dipalsukan)

`profSave` meneruskan `b.status = p.status` bila ada (`app.js:557`). Meski UI tidak mengirimnya, tombol itu
tersedia: siapa pun yang login dapat menjalankan satu `PATCH /rest/v1/profiles?id=eq.<uid>` dengan
`{"status":"verified"}` dan lolos policy `own update`. Artinya **status "Terverifikasi" tidak bisa dipercaya**
sebagai bukti pengurus.

**Wajib:** policy `own update` dengan `with check (status = (select status from profiles where id = auth.uid()))`
— atau lebih rapi: buat `status` hanya bisa ditulis lewat fungsi `security definer`/trigger yang memeriksa
`public.is_admin()`. Juga jangan izinkan klien menulis `nia`.

### K‑4 ❌ Jalur "cadangan lokal" memberi akun palsu — celah pengambilalihan NIA

`js/app.js:583‑589`:

```js
}).catch(function(err){ … finishLogin({id:'local-'+em,email:em},'',{nama:nm,hp:hp}); authMsg('Masuk (perangkat ini).') })
```

- Pemanggilan ini terjadi pada **setiap error**, termasuk "Kata sandi salah" dan "Email sudah terdaftar".
  Pengguna yang salah sandi tetap "masuk" sebagai `local-<email>` dan bisa membuat kartu.
- Karena `finishLogin` menulis `mwc_auth` + `mwc_profile_<email>`, **tidak ada bedanya di mata pengguna**
  antara akun asli dan akun lokal.
- Bahaya sesungguhnya: bila **suatu saat** pengguna pemilik email asli mendaftar di perangkat yang sama
  (sering di warnet/HP bersama), profil lokal `local-<email>` yang berisi NIA & nama orang lain dapat terbaca
  lewat `profGet()` karena kuncinya hanya `user.id || user.email`.

**Wajib:** hapus jalur masuk otomatis, atau paling tidak batasi hanya saat `!authCfg().url` dan beri label
tegas (mis. "Mode luring — kartu ini tidak terdaftar"). Tambahkan `signIn` ulang bila error berarti kredensial salah.

### K‑5 ❌ Email belum tentu terverifikasi, tapi sudah bisa mengklaim NIA

- Signup memakai `sbAuth('signup', {email, password, options:{data:{name}}})` (`app.js:578`) tanpa `emailRedirectTo`.
- Bila Supabase Auth memakai **"Confirm email = ON"**, `j.session` kosong → pengguna mendapat pesan
  "Akun perlu konfirmasi" (`app.js:580`) — alur benar, **tetapi** kemudian tombol _Masuk_ untuk akun yang belum
  dikonfirmasi akan gagal lalu **jatuh ke jalur cadangan lokal K‑4**. Celah tertutupnya kembali.
- RLS hanya mensyaratkan `auth.uid() = id`, tidak mensyaratkan `auth.jwt()->>'email_verified' = 'true'`
  atau `auth.users.email_confirmed_at is not null`.

**Wajib:** di policy insert/update profil tambahkan syarat email terverifikasi, atau gate tombol "Daftar KTA"
pada `session.user.email_confirmed_at`.

### K‑6 ❌ Belum ada syarat kelayakan anggota — satu email = satu KTA, tapi tidak lebih dari itu

- Siapa pun yang punya email bebas membuat akun, mengisi ranting mana pun, dan langsung mendapat kartu
  berlabel "KARTU ANGGOTA" dengan penanda tangan pejabat. Tidak ada:
  - pengesahan dari PRNU/ranting asal,
  - satu NIA per orang (hanya satu per akun; orang yang sama bisa membuat akun kedua dengan email lain),
  - kaitan NIK/KK (memang sengaja tanpa NIK — README:159),
  - batas umur/domisili.
- `profiles.tingkat`/`ranting` berasal dari pilihan bebas `select` (`index.html:322‑323`) tanpa verifikasi ranting.

**Rekomendasi:** minimal, `status` awal `pending` dan **kartu yang boleh diunduh sebelum verifikasi diberi
tanda air "BELUM TERVERIFIKASI"** (atau blokir unduh sampai admin memverifikasi). Idealnya ada kolom
`didaftarkan_oleh`/`prnu` yang diisi pengurus ranting.

### K‑7 ⚠️ Teks publik menyesatkan — "nomor ini belum tercatat"

`index.html:309` & `:334`: _"Nomor dan QR dibuat di perangkat Anda; nomor ini belum tercatat atau diverifikasi
oleh MWCNU…"_ dan _"Data tidak disimpan oleh situs ini"_ (`index.html:328`), padahal `job()` dan tombol WA
memanggil `profSave()` yang mengirim nama, HP, tanggal lahir, alamat, pekerjaan ke Supabase (`app.js:687`, `:692`).

- Pengguna menyetujui pernyataan yang salah → masalah **persetujuan (UU PDP)**.
- Setelah tombol PDF diklik, status sebenarnya adalah "terdaftar, **menunggu verifikasi**" — bukan "belum tercatat".

**Wajib:** perbarui tiga teks itu (lead, checkbox, catatan bawah) agar sesuai perilaku nyata, dan tambahkan
tautan kebijakan privasi + hak hapus data.

### K‑8 ⚠️ `verifikasi.html` bergantung pada fungsi yang bisa hilang

- `verifikasi.html:33` memanggil `POST /rest/v1/rpc/verify_nia` **tanpa** menangani status HTTP; jika fungsi
  atau grant hilang, respons `404/401` dianggap "Nomor tidak ditemukan" (galat JSON dianggap objek kosong →
  tetap `bad`). Masyarakat bisa salah menyimpulkan kartu asli = palsu.
- `supabase-profiles.sql:98‑101` menjalankan `drop policy if exists "anon verify"` — **tidak ada** `create policy`
  untuk nama itu, hanya `grant execute`. Aman, tetapi jelek (policy tidak pernah ada).
- `verify_nia` (`security definer`, `stable`) mengembalikan `nama` penuh ke anon → **enumerasi nama** oleh siapa pun
  yang menebak NIA. Dengan 10⁶ ruang nilai, seluruh nama anggota bisa diambil lewat serangan brute force ringan.
- `verifikasi.html:28` hanya boleh 5–6 digit, sementara generator selalu 6; nomor 5 digit **tidak mungkin** lolos
  angka cek berbasis string yang sama, jadi format tidak konsisten antar berkas.

**Wajib:** bedakan kegagalan transport (HTTP ≠ 2xx → "layanan tidak dapat dijangkau") dari hasil kosong;
rate-limit publik; pertimbangkan mengembalikan inisial nama, bukan nama penuh.

### K‑9 ⚠️ Angka cek hanya untuk 3 segmen — tidak melindungi tahun/0 kode wilayah

`verifikasi.html:27` dan `app.js:594` menghitung `cd(rr + yy + rand)` — persis sama di kedua sisi, jadi konsisten.
Namun yang diperiksa hanya `rr|yy|rand`; digit ke‑5 (angkanya sendiri) wajar. Kekuatannya 1/10 → hanya mendeteksi
**salah ketik**, bukan pemalsuan (pemalsu cukup menghitung ulang).

**Rekomendasi:** jangan klaim sebagai pengaman; sudah dicakup K‑1 (validasi sebenarnya dari server).

### K‑10 ⚠️ Dasbor anggota hanya untuk Super Admin

`admin.js:339` → `if (!isAdmin()) return noAccess();`; menu `Anggota & Verifikasi` juga hanya dirender untuk
`isAdmin()` (`admin.js:112‑114`). Padahal konsep README menyebut "layar verifikasi pengurus (peran PRNU per
kelurahan)" (`README.md:164`). Saat ini **Pengurus tak bisa memverifikasi**; semua beban ada di Super Admin.
Ditambah `viewMembers` memuat **seluruh** profil tanpa paginasi (`select('*')`, `admin.js:341`) — akan lambat/
berat setelah ribuan baris.

### K‑11 ⚠️ `profiles` hanya bisa diakses saat login + offline tanpa jejak

- `profSave` di-skip untuk user `local-*` (`app.js:557`) dan tidak ada antrean sinkronisasi. Pengguna yang
  membuat kartu saat offline akan **kehilangan data & NIA** saat membuka perangkat lain (K‑2).
- Setelah login ulang, `profFetch` tidak mengisi `k-rt`, `k-wadah`, `k-tingkat`, `k-alamat`, `k-tmp`, `k-tgl`, `k-jk`,
  `k-kerja` (`app.js:560, 562`) → data kartu harus diisi ulang, dan bisa ditulis berbeda dari server.

### K‑12 ⚠️ Penanda tangan kartu tidak terkunci terhadap waktu terbit

`CFG.pejabat` diambil dari CMS `kartu` saat halaman dimuat (`app.js:543`). Kartu lama tidak menyimpan pejabat
yang menandatangani; bila pengurus berganti, **re-print kartu lama menghasilkan TTD berbeda** dengan aslinya.

### K‑13 ⚠️ `rpc` tidak memeriksa `verified` secara final

`verifikasi.html:36‑37` menampilkan "VALID" hanya untuk `row.verified`, "menunggu" untuk `pending`, tetapi
`rejected` juga jatuh ke status "menunggu verifikasi" — **kartu yang sudah ditolak tetap tampak "terdaftar,
menunggu"**. Pengguna hanya melihat status, bukan `rejected` (fungsi mengembalikan `status`, tapi UI tidak memakainya).

### K‑14 ⚠️ Kelemahan kecil lain

- `localStorage` menyimpan `access_token` mentah di kunci `mwc_auth` (`app.js:553`) — tanpa `expires_at`;
  token kedaluwarsa → `profSave` 401 (diabaikan diam-diam karena `.catch(function(){})`, `app.js:557`)
  sehingga **pengguna mengira kartu terdaftar padahal tidak**.
- Tombol WA (`app.js:692`) membuka `wa.me` tetapi **tidak melampirkan PDF/foto** otomatis; teks chat menyebut
  "saya lampirkan" — user harus unggah manual. Ini bukan bug, tapi sumber salah paham yang sering dilaporkan.
- NIA tidak menyimpan **tahun terbit sebenarnya** (`yy` = tahun _saat ini_), sehingga kartu yang diunduh ulang
  tahun depan mendapat prefix tahun berbeda untuk orang yang sama jika `S.rand` hilang.

---

## 4. Matriks konsistensi NIA (pembuat vs. pemakai)

| Berkas               | Aturan                                          | Konsisten?                                                                                   |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `js/app.js:598`      | `MWC-RR-YY-` + 6 digit + cek                    | acuan                                                                                        |
| `README.md:156`      | `MWC-<kode wilayah>-<YY>-<6 angka>-<angka cek>` | ✅                                                                                           |
| `verifikasi.html:28` | `^MWC-(\d{2})-(\d{2})-(\d{5,6})-(\d)$`          | ⚠️ mengizinkan 5 digit                                                                       |
| `js/app.js:597`      | `Random*999999+1` lalu `padStart(6)`            | ⚠️ **1–999999**, tidak pernah `000000` (bias minor)                                          |
| `verify_nia` SQL     | `where pr.nia = p_nia` (case-sensitive)         | ⚠️ UI meng‑uppercase; NIA yang tersimpan dalam huruf kecil dari sumber lain tidak akan cocok |
| `verifikasi.html:36` | `verified` → VALID                              | ❌ `rejected` tampil "menunggu"                                                              |

---

## 5. Rencana perbaikan berurutan (estimasi untuk 1 orang)

| #   | Prioritas   | Perubahan                                                                                                                           | Berkas                               |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | **Blocker** | Terbitkan NIA di server: kolom `ia_seq`/fungsi `issue_nia()` `security definer`, `unique`, retry saat tabrakan; klien hanya membaca | `supabase-profiles.sql`, `js/app.js` |
| 2   | **Blocker** | Kunci `nia` & `status` dari klien (`policy own update` + trigger), ganti upsert → PATCH                                             | `supabase-profiles.sql`, `js/app.js` |
| 3   | **Blocker** | Hapus masuk otomatis `local-<email>`; hanya mode luring dengan label jelas                                                          | `js/app.js:583‑589`                  |
| 4   | **Blocker** | Syarat `email_confirmed_at` sebelum membuat KTA                                                                                     | policy + `js/app.js`                 |
| 5   | Tinggi      | Isi ulang semua field kartu dari server di `profFetch`; NIA read‑only                                                               | `js/app.js:560‑562`                  |
| 6   | Tinggi      | Perbaiki teks persetujuan & lead `#daftar` (data disimpan, belum terverifikasi) + kebijakan privasi                                 | `index.html:309,328,334`             |
| 7   | Tinggi      | Watermark "BELUM TERVERIFIKASI" pada unduhan selama `status ≠ verified`                                                             | `js/app.js:610‑650`                  |
| 8   | Sedang      | `verifikasi.html`: bedakan error transport, tampilkan `rejected`, ubah regex ke `\d{6}`                                             | `verifikasi.html`                    |
| 9   | Sedang      | Rate-limit `verify_nia`, kembalikan inisial nama saja                                                                               | `supabase-profiles.sql`              |
| 10  | Sedang      | Beri Pengurus akses `#/members` (minimal lihat; aksi verifikasi untuk Super Admin + Pengurus) dan paginasi                          | `admin.js:112‑114, 339‑341`          |
| 11  | Sedang      | Simpan `pejabat`/`issued_at` per NIA agar re-print identik                                                                          | `profiles`, `js/app.js:543,599`      |
| 12  | Rendah      | Tangani 401 saat `profSave` → minta login ulang, jangan diam                                                                        | `js/app.js:557`                      |
| 13  | Rendah      | Perjelas tombol WA ("lampirkan PDF setelah chat terbuka")                                                                           | `js/app.js:692`, `index.html:332`    |

Urutan 1–4 wajib selesai **sebelum** kartu fisik dicetak untuk publik, karena setelah tercetak NIA tidak
boleh berubah (README:158).

---

## 6. Yang tidak bisa diverifikasi dari repo

- Konfigurasi **Supabase Auth**: apakah "Confirm email" aktif, kebijakan sandi, dan daftar provider (email saja
  atau ada Google). Ini menentukan apakah K‑5 & K‑4 benar-benar tereksploitasi.
- Isi `public.staff` (siapa Super Admin) dan jumlah baris `profiles` (untuk menghitung risiko tabrakan riil).
- Apakah `supabase-profiles.sql` **sudah dijalankan** di proyek `wvfcifqolohfipvepxss`; jika belum,
  `verify_nia` tidak ada dan seluruh verifikasi QR jatuh ke pesan "tidak ditemukan" (K‑8).
- Isi `js/config.js` yang ter-deploy di produksi (di repo, kunci `sb_publishable_…` publik — wajar).
- Riwayat `change_log` untuk membuktikan tidak ada `profiles` yang NIA‑nya sudah berubah (K‑2).

---

## 7. Rekomendasi (keputusan yang saya ambil, bukan sekadar daftar)

### 7.0 Dua dokumen yang saling bertentangan — putuskan dulu
`docs/KEPUTUSAN.md:25,26,27` menyebut **login Google saja**, peran **pengurus PRNU memverifikasi kelurahannya**,
dan **tampilan publik QR hanya nama, wilayah, status**. Kode hari ini justru: login **email+sandi** dengan jalur
lokal `local-<email>` (`app.js:573‑589`), verifikasi hanya Super Admin (`admin.js:339`), dan QR publik
mengembalikan **nama lengkap** (`supabase-profiles.sql:93`).

Rekomendasi saya: **pegang `KEPUTUSAN.md`** — dokumen itu sudah sesuai dengan cara kerja sebuah jam'iyyah
(anggota diverifikasi rantingnya, bukan oleh admin kecamatan yang tak mengenal 2.000 orang) dan memenuhi
prinsip data-minimal UU PDP. Artinya: **hapus login email/sandi + fallback lokal, pakai Google OAuth saja.**
Ini sekaligus menutup K‑4, K‑5, dan sebagian K‑3 tanpa menulis satu baris RLS tambahan.
Jika Sobat ingin login email tetap ada (mis. demi anggota tanpa Gmail), lihat jalur alternatif di 7.7.

### 7.1 Kontrak data yang saya usulkan (target akhir)

```
profiles
  id            uuid  = auth.users.id                (PK, tak diubah)
  email         text  = auth.jwt()->>'email'         (diisi trigger, bukan klien)
  nama, hp, …
  ranting_code  text  '00'..'11'  (diturunkan dari tingkat+ranting, bukan input bebas)
  nia           text  unique      ← HANYA server yang mengisi (trigger/issue_nia)
  issued_at     timestamptz       ← tanggal terbit (untuk prefix YY yang benar)
  signers       jsonb             ← snapshot pejabat+TTD saat terbit (K‑12)
  status        'pending'|'verified'|'rejected'      ← HANYA is_admin()/pengurus wilayah yang boleh ubah
  verified_by / verified_at      ← jejak audit (change_log belum mencakup profiles!)
  prnu_key      text  ← pengurus ranting mana yang berhak memverifikasi (dipakai RLS)
```

Catatan penting: **`wadah` (MWCNU/Jama'ah/GP Ansor/Fatayat/IPNU/IPPNU) dan `tingkat` (MWCNU/PRNU) bukan hal
yang sama** — saat ini keduanya bercampur di kolom yang berbeda tapi dihitung dengan cara berbeda
(`app.js:598` memakai `lvl()`=`k-tingkat`, bukan `wadah`). Sebelum membuat NIA per wilayah, pastikan
`ranting` benar-benar mengikuti `tingkat`, bukan nilai bebas dari `<select>` (`index.html:322‑323`).

### 7.2 Keamanan NIA — satu sumber kebenaran di server

Fungsi `issue_nia()` harus **hanya bisa dipanggil dengan service key** (bukan `anon`), karena verifikasi
keanggotaan tak boleh terjadi di browser. `public.is_admin()` sudah ada (`supabase/schema.sql:29`), jadi
`anon`/`authenticated` tidak perlu `execute` pada fungsi terbit.

```sql
-- 1) Nomor urut per wilayah per tahun, atomik
create table if not exists public.nia_seq (
  scope text primary key,          -- contoh: '01-26'
  n     integer not null default 0
);
alter table public.nia_seq enable row level security;   -- tanpa policy = tertutup

-- 2) Terbit: security definer, TIDAK di-grant ke anon/authenticated
create or replace function public.issue_nia(p_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  r record; sc text; n integer; body text; ck integer; s text;
begin
  select * into r from public.profiles where id = p_id and nia is null for update;
  if not found then raise exception 'NIA already issued or profile missing'; end if;
  sc := coalesce(nullif(r.ranting_code,''),'00') || '-' || to_char(coalesce(r.issued_at, now()), 'YY');
  insert into public.nia_seq(scope, n) values (sc, 1)
    on conflict (scope) do update set n = public.nia_seq.n + 1
    returning n into n;
  body := sc || '-' || lpad(n::text, 6, '0');
  -- angka cek: Mod-10 bobot 3/1 dari kanan, sama seperti app.js:594 & verifikasi.html:27
  select (10 - (sum(substr(body, i, 1)::int * case when (length(body)-i) % 2 = 0 then 3 else 1 end) % 10)) % 10
    into ck from generate_series(1, length(body)) i;
  return 'MWC-' || body || '-' || ck;
end $$;
revoke all on function public.issue_nia(uuid) from public, anon, authenticated;
```

Catatan teknis: karena `issued_at` ikut dihitung, **klien tidak bisa menebak NIA** sebelum terbit — ini
pengganti langsung K‑1. Uji silang: `MWC-` + `RR-YY-NNNNNN` + cek harus lolos `cd()` di `app.js:594`
dan regex `verifikasi.html:28` yang saya ubah ke `\d{6}` (7.6).

**Endpoint penerbitan** memakai Edge Function yang memverifikasi JWT Google lalu memanggil `issue_nia()` dengan
service key — tanpa itu, `issue_nia` tidak bisa dipanggil sama sekali (sesuai niat). Alternatif tanpa Edge
Function: panggil dari Supabase Dashboard/Table Editor oleh Sekretariat saat verifikasi (langkah manual,
tapi aman dan cocok untuk volume awal). **Rekomendasi: mulai manual dulu**, otomatisasi setelah volume > 100/bulan.

### 7.3 RLS — kunci `nia` dan `status`

```sql
-- Hapus policy lama yang terlalu luas
drop policy if exists "own update" on public.profiles;

-- Klien hanya boleh mengubah DATA DIRI selama belum terverifikasi
create policy "own update pending"
  on public.profiles for update to authenticated
  using (auth.uid() = id and status = 'pending' and nia is null)
  with check (auth.uid() = id and status = 'pending' and nia is null);

-- Super Admin (lama) + Pengurus wilayah (baru)
drop policy if exists "staff manage" on public.profiles;
create policy "staff manage" on public.profiles for all to authenticated
  using      (public.is_admin() or public.verifies(auth.uid()))
  with check (public.is_admin() or public.verifies(auth.uid()));

-- Trigger pengaman: status & nia hanya berubah oleh admin/pengurus, dan nia sekali-set
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.nia is distinct from old.nia and not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'NIA tidak dapat diubah';
  end if;
  if new.status is distinct from old.status and not (public.is_admin() or public.verifies(old.id)) then
    raise exception 'Status verifikasi hanya dapat diubah pengurus';
  end if;
  return new;
end $$;
```

`verifies(uid)` = pengurus PRNU yang email-nya cocok dengan `prnu_key profil` — ini yang membuat rencana
"peran PRNU per kelurahan" (`README.md:164`) berjalan tanpa membebani satu orang admin. Aman untuk
`auth.role() = 'service_role'` karena key itu **tidak pernah** ada di repo (`js/config.js:3`).

Sekaligus **buat `change_log` mencakup `profiles`** — sekarang trigger `log_change()` hanya dipasang di
`content_items` dan `site_settings` (`supabase/schema.sql:115‑118`), jadi tidak ada jejak siapa yang
memverifikasi siapa. Untuk lembaga, ini bukan opsional.

### 7.4 Alur KTA setelah perbaikan (satu gambar)

```
Buat akun (Google)      → profil {id,email,nama} status=pending, nia=NULL     ← klien
Isi data diri           → PATCH kolom data-diri saja, nia TIDAK dikirim      ← klien
Klik "Ajukan KTA"       → status tetap pending; profSave 401/4xx = dialog     ← klien
Pengurus ranting        → setujui → trigger isi nia + nia_seq + issued_at     ← admin/Edge
Unduh kartu             → NIA read-only dari server; watermark jika ≠verified
Scan QR /v/<nia>        → verify_nia: nama (inisial), wilayah, status         ← anon
Re-print                → NIA & signers dari server, TTD tetap sama
```

Kunci perubahan klien yang saya sarankan (beda dari audit §5 baris 2 "ganti upsert → PATCH"): **semantiknya
bukan hanya HTTP method**, tapi **siapa yang menentukan `nia`**. `PATCH` tanpa membatasi kolom tetap bisa
menulis `nia` — karena itu guard trigger di 7.3 yang sebenarnya mengamankan, bukan `PATCH`-nya.

### 7.5 Produk (bukan keamanan) — yang membuat kartu akhirnya bisa dipercaya
1. **Watermark "BELUM TERVERIFIKASI"** pada semua ekspor selama `status ≠ verified` (`app.js:610‑650`).
   Ini menjawab K‑6 tanpa membangun alur birokrasi penuh, dan membuat kartu pemerintahan tak mungkin
   disalahgunakan di lapangan.
2. **QR publik = inisial + wilayah + status** (mengikuti `KEPUTUSAN.md:27`), bukan nama penuh. Kontribusi
   langsung ke privasi dan menutup enumerasi K‑8.
3. **Tautan "Ajukan KTA" → daftar pengurus ranting** (nama & WA) diambil dari profil `prnu_key`, jadi anggota
   tahu harus ke siapa. Tanpa ini, alur verifikasi per ranting hanya di atas kertas.
4. **Halaman privasi ringkas** (bukan halaman hukum panjang): data apa yang disimpan, siapa yang bisa lihat,
   berapa lama, cara minta hapus. Cukup satu section di `index.html` + tautan di checkbox.
5. **Tombol WA** tetap ada, tapi teksnya jangan mengklaim lampiran otomatis (`app.js:692`); setelah chat terbuka
   beri hint "lampirkan PDF dari unduhan".

### 7.6 Perbaikan `verifikasi.html` (cepat, 30 menit)
- Ganti regex `\d{5,6}` → `\d{6}` (sinkron dengan generator).
- `r.ok` diperiksa **sebelum** `r.json()`: `!r.ok` → status `wait`, bukan "tidak ditemukan".
- `row.status === 'rejected'` → pesan "Kartu telah dicabut/ditolak" (bukan "menunggu").
- `fetch(..., {cache:'no-store'})` agar hasil verifikasi tidak di-cache browser publik.
- Jangan tampilkan `raw` NIA untuk input yang formatnya salah (sedikit mengurangi enumerasi).

### 7.7 Jika login email harus dipertahankan (jalur alternatif)
Pakai `js/vendor/supabase.js` (sudah dibundel) alih-alih `fetch` manual `sbAuth()`:
`signUp`/`signInWithPassword`/`onAuthStateChange` menangani penyegaran token, `emailRedirectTo`, dan status
`email_confirmed_at` dengan benar. Minimal yang harus dilakukan tetap:
hapus fallback `local-*` (K‑4), gate `email_confirmed_at` di tombol unduh (K‑5), dan simpan sesi lewat klien
Supabase — bukan `localStorage['mwc_auth']` mentah dengan `access_token` kedaluwarsa (K‑14).

### 7.8 Urutan pengerjaan yang saya sarankan (4 sprint, tiap sprint bisa dirilis sendiri)

| Sprint | Isi | Hasil yang bisa dilihat |
|---|---|---|
| **A — 1 hari** | Teks persetujuan (`index.html:309,328,334`) + `verifikasi.html` (7.6) + hapus klaim "tidak disimpan". Tulis SQL 7.3, jalankan di staging. | Tidak ada lagi janji yang salah; QR tidak lagi "false negative" |
| **B — 1–2 hari** | RLS 7.3 + `change_log` profiles + `verifies()` + `PATCH` berbasis kolom (7.1). Gate pengurus ranting di `#/members`. | `status`/`nia` tidak bisa dipalsukan; audit trail ada |
| **C — 2 hari** | `issue_nia()` (7.2) + halaman admin "Terbitkan NIA" (manual dulu) + `issued_at`/`signers` + NIA read-only di form. | Kartu yang tercetak hari ini **benar** dan tak akan berubah |
| **D — 1–2 hari** | Hapus login lokal (atau migrasi 7.7), watermark (7.5), inisial di QR, halaman privasi. | Kartu layak dipakai publik & lolos prinsip UU PDP |

Audit lama menyebut urutan 1–4 "wajib sebelum dicetak". **Revisi saya:** **Sprint B+C** yang wajib sebelum
cetak massal; Sprint A bisa (dan sebaiknya) dikerjakan hari ini karena murah dan menghapus informasi yang
menyesatkan publik.

### 7.9 Yang tetap **jangan** dikerjakan (supaya tidak mengulang kesalahan audit)
- Jangan menambah pengaman di angka cek untuk "mengamankan" NIA — angka cek hanya untuk salah ketik (K‑9).
  Keamanan datang dari NIA yang tak bisa ditebak + status di server.
- Jangan lancarkan pembatasan akses admin dengan `service_role` di browser; gunakan `is_admin()` SQL.
- Jangan tiru pola halaman `#konsultasi` (`index.html:293`) yang menyatakan "tidak disimpan di situs ini"
  tanpa memastikan benar — klaim privasi harus diverifikasi per form, bukan disalin.
