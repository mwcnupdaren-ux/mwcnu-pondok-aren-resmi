# PHASE 10B — LAPORAN QA: PERBAIKAN KETAHANAN RENDER ARTIKEL + SIDEBAR BERITA TERKAIT

**1. Status**

- Selesai (implementasi sudah ada di working tree; fase ini memverifikasi dan menguji).
- Verifikasi: LULUS dengan keterbatasan (staging/commit/push/deployment produksi belum dilakukan).

**2. Kondisi Repository**

- Branch: `main`
- HEAD: `87d8ad4 chore(git): consolidate worktree documents, skills, adapters, and verification test`
- Working tree: 2 file termodifikasi, belum di-commit
  - `api/article-meta.js`
  - `js/app.js`
- File untracked: artefak QA lokal (`.tmp-*`, `test-fetch.cjs`) — tidak ikut di-commit.
- Remote: `origin` → `https://github.com/mwcnupdaren-ux/mwcnu-pondok-aren-resmi.git` (fetch sudah sinkron: `main...origin/main`).

**3. Perubahan (sudah ada di working tree)**

- `api/article-meta.js`
  - Cangkang artikel SSR (`#arBody`) tetap berisi isi artikel untuk pembaca tanpa JavaScript, diberi penanda `data-server-rendered="true"`.
  - Bagian artikel SSR kini memuat sidebar `<aside class="ar-side nside" id="arSide">` sehingga tata letak dua kolom tidak kosong sebelum `app.js` berjalan.
  - Metadata OG/Twitter sudah dibuat spesifik artikel (`og:title`, `og:description`, `og:url`, `og:type=article`, `og:image`, `twitter:*`).
- `js/app.js`
  - `route()`: jika artikel tersedia di data klien → `renderArticle()` penuh; jika tidak → pertahankan cangkang SSR; `renderArticleMissing()` hanya dipakai bila tidak ada cangkang.
  - Penjagaan null pada elemen opsional (`#jam`, `#masehi`, `#hijri`, `#yr`, `#nv`, `#mb`, `#dlg`, `#dlgX`, `#dlgBody`, `#nq`) agar kegagalan satu elemen tidak menghentikan seluruh `app.js` (berita, sidebar, rute).
  - Sidebar "Berita Terkait" dirender ke `#arSide` (maks. 5 item) dan disembunyikan + `no-side` bila tidak ada artikel terkait.

**4. Pengujian (bukti aktual)**
| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| Syntax check `node --check js/app.js` | Lulus | exit 0 |
| Syntax check `node --check api/article-meta.js` | Lulus | exit 0 |
| `git diff --check` | Lulus | tidak ada output |
| Server lokal `api/article-meta.js` (port 4174) akses langsung artikel | Lulus | HTTP 200, 84 KB |
| Slug tidak dikenal | Lulus | HTTP 404 |
| Browser desktop (1280px) halaman artikel | Lulus | grid `800px 340px`, sidebar 5 item, `no-side` tidak aktif, tanpa overflow horizontal |
| Browser mobile (390px) halaman artikel | Lulus | grid `354px` satu kolom, sidebar `order:2` di bawah artikel, 5 item, `overflowX = 0` |
| Alur SPA: klik kartu berita → artikel | Lulus | URL `/berita/<slug>`, H1 artikel benar, sidebar 5 item, 4 tombol berbagi |
| Refresh halaman artikel | Lulus | artikel & sidebar tetap tampil |
| Tombol kembali browser → daftar berita | Lulus | URL `/#berita`, `#baca` tersembunyi |
| Metadata halaman artikel (SSR) | Lulus | `<title>` spesifik, `canonical` `/berita/<slug>` |
| Screenshot visual desktop & mobile | Lulus | header/topbar tampil, artikel + sidebar rapi; foto ke-1, ke-3, ke-4 blok "Foto kegiatan" 404 di lingkungan lokal |

**5. Risiko dan Catatan**

- Error console yang teramati **bukan** akibat perubahan ini (berasal dari lingkungan lokal):
  - `consultation-public` CORS/`ERR_FAILED` karena origin `localhost:4174` tidak diizinkan (config produksi).
  - `qris` diblokir ORB — perilaku adblocker/CORS pada `localhost`.
- **Diperbaiki pada fase 10C:** referensi `assets/img/img-1a2f09f7.webp` (dihapus di commit `fb6dbb9`) tidak lagi dirender. `js/app.js` kini memiliki daftar `REMOVED_ASSETS` + `phSafe()` sehingga path aset terhapus dilewati, dan `img` yang gagal dimuat diganti foto cadangan valid lewat delegasi `error` di fase capture (tanpa handler inline, aman terhadap CSP). `supabase/seed.sql` juga tidak lagi merujuk aset tersebut.
- **Keterbatasan verifikasi:** pengujian HTTP/SSR memakai server lokal (port 4174); perilaku CDN/cache produksi belum diuji. Pengujian interaksi browser **tidak** dapat dijalankan pada sesi ini karena browser otomasi di mesin ini tidak mengeksekusi JavaScript halaman (semua skrip, termasuk init script, tidak berjalan); sebagai gantinya `js/app.js` dieksekusi penuh di Node dengan DOM tiruan (lulus tanpa error) dan logika render gambar/sidebar diuji dengan data CMS Supabase sungguhan.

**5b. Pengujian Fase 10C (bukti aktual)**

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| `node --check js/app.js` + `git diff --check` | Lulus | exit 0 |
| Eksekusi utuh `js/app.js` di Node (DOM tiruan) | Lulus | `{ ok: true, errors: [] }` |
| Scan referensi gambar data bawaan `buildNews()` | Lulus | 4 artikel, tanpa aset terhapus/file hilang |
| Render foto artikel dari data CMS Supabase (13 artikel) | Lulus | `img-1a2f09f7` dibuang; tidak ada src ke file hilang |
| Sidebar berita terkait | Lulus | tepat 5 item, tidak tersembunyi saat artikel lain tersedia |
| `api/article-meta.js` (3 slug + 1 slug tak dikenal) | Lulus | HTTP 200; title/canonical/og:type/twitter:card spesifik; `data-server-rendered` + `aside#arSide` ada; slug tak dikenal → 404 |

**6. Git**

- Staging: selektif — `api/article-meta.js`, `js/app.js`, dan laporan ini. Artefak `.tmp-*` dan `test-fetch.cjs` tetap untracked.
- Commit: diotorisasi pengguna untuk pekerjaan yang sudah benar.
- Push: diotorisasi pengguna ke `origin/main`.
- Deployment: tidak dilakukan (push bukan izin deployment).

**Tindakan lanjutan**

1. Verifikasi produksi setelah deployment: `og:*`/`twitter:*` artikel, sidebar SSR, dan layout mobile.
2. Hapus/rapikan referensi `img-1a2f09f7.webp` di data CMS (`foto_tambahan` artikel Halal Bi Halal) melalui dashboard admin agar data sumber ikut bersih (perubahan data produksi memerlukan otorisasi terpisah).
