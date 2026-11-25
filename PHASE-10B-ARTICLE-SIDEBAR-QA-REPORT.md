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
- **Temuan terpisah (di luar ruang lingkup, belum diperbaiki):**
  - `js/app.js` masih mereferensikan `assets/img/img-1a2f09f7.webp` yang sudah dihapus di commit `fb6dbb9`. Di server lokal menghasilkan 404 di blok "Foto kegiatan" artikel Halal Bi Halal; perlu keputusan pengguna apakah mengembalikan aset (dilarang tanpa izin) atau menghapus referensinya.
- **Keterbatasan verifikasi:** seluruh pengujian dilakukan di server lokal (port 4174), bukan produksi Vercel. Perilaku CDN/cache produksi belum diuji pada fase ini.

**6. Git**

- Staging: selektif — `api/article-meta.js`, `js/app.js`, dan laporan ini. Artefak `.tmp-*` dan `test-fetch.cjs` tetap untracked.
- Commit: diotorisasi pengguna untuk pekerjaan yang sudah benar.
- Push: diotorisasi pengguna ke `origin/main`.
- Deployment: tidak dilakukan (push bukan izin deployment).

**Tindakan lanjutan**

1. Putuskan penanganan `img-1a2f09f7.webp` (kembalikan aset atau hapus referensi di `js/app.js`) — belum dilakukan.
2. Verifikasi produksi setelah deployment: `og:*`/`twitter:*` artikel, sidebar SSR, dan layout mobile.
