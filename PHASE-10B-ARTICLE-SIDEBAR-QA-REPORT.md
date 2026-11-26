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

**5c. Fase 10D — Dua kasus yang dilaporkan pengguna**

| Kasus | Kondisi sebelum | Status | Perbaikan / bukti |
|---|---|---|---|
| Hero section terlihat dobel pada halaman artikel | **Belum diperbaiki.** HTML SSR artikel masih memuat 9 elemen `.ho` (hero beranda + blok beranda), hanya 1 yang `hidden`. `js/app.js` menyembunyikannya lewat `route()`, jadi tanpa JS/crawler/SSR-hero terlihat dobel. | **Diperbaiki** | `api/article-meta.js`: semua elemen `.ho` di luar bagian artikel diberi `hidden` di HTML server. Verifikasi: `ho tampil = 0` pada artikel; beranda tetap normal (9 `.ho`, 1 `hidden` dari markup). |
| Share link menampilkan thumbnail hero beranda | **Sudah benar.** `og:image`, `og:image:secure_url`, `twitter:image` sudah memakai foto artikel (`/media/berita/...`), bukan `/media/hero/...`. | **Tidak perlu diubah** | Diuji pada 3 artikel: jenis gambar = `FOTO ARTIKEL`, `twitter:image` identik dengan `og:image`. Catatan: crawler (WhatsApp/Facebook) menyimpan cache preview lama — perlu di-refresh di sisi platform agar thumbnail lama hilang. |

Detail diagnosis kasus 1: `index.html` menaruh 8 blok beranda (`.ho`) di depan `#baca`; `index.html` dirender utuh oleh `api/article-meta.js`, sehingga crawler dan pembaca tanpa JS melihat hero beranda + hero artikel sekaligus. Perbaikan dilakukan di server (bukan hanya CSS) agar tidak bergantung pada JS.

**5d. Fase 10E — Kartu berita homepage tidak bisa diklik**

| Kasus | Akar masalah (terbukti) | Perbaikan | Bukti |
|---|---|---|---|
| Kartu berita di homepage tidak merespons klik | `put()`/`cleanHTML()` menyaring `href`: hanya `#`, `http(s)://`, `mailto:`, `tel:` yang lolos. Semua kartu memakai `href="/berita/<slug>"`, sehingga atribut `href` **dibuang** dan kartu menjadi tak bertautan. | `js/app.js`: aturan `href` kini menerima path internal absolut `/(?!/)` (plus tolak `\\` dan karakter kontrol). `javascript:`, `data:`, `//evil.test` tetap ditolak. | Sebelum: klik kartu → `TimeoutError`, URL tetap `/`. Sesudah: klik kartu utama & kartu samping → `/berita/<slug>` dengan H1 benar. |
| (Ditemukan saat uji) halaman artikel tampak kosong setelah klik | `rev()` memberi kelas `.rv` ke `.ar-grid` (opacity 0, translateY) tetapi observer tidak pernah melaporkan irisan setelah rute aktif, sehingga isi artikel tertinggal transparan. | `rev()` melewati elemen `.closest('#baca')`; ditambah aturan CSS pengaman `html.js-rv #baca .rv` → `opacity:1; transform:none`. | Sesudah: `.ar-grid` `opacity: 1`, artikel + sidebar terlihat pada screenshot; 4 jalur klik lulus tanpa `pageerror`. |

Jalur klik yang diuji dengan browser nyata (klik sungguhan, bukan simulasi): kartu utama homepage, kartu samping homepage, kartu `#berita`, dan sidebar `#arSide` → semuanya berpindah ke `/berita/<slug>` dengan `ho tampil = 0` dan 5 item sidebar.

**5e. Fase 10F — Notifikasi "Perubahan belum disimpan" muncul setelah simpan berhasil**

| Aspek | Temuan | Perbaikan | Bukti (A/B browser nyata) |
|---|---|---|---|
| Akar masalah | `viewEdit()` menyimpan baris ke Supabase lalu langsung `location.hash = '#/' + key` dengan `S.dirty` masih `true`, sehingga guard `route()`/`hashchange` menampilkan konfirmasi "Perubahan belum disimpan" padahal data sudah tertulis. | `S.dirty = false` dan `routeGuardSkip = true` di-set **sebelum** pindah halaman (pola sama dengan `admin/direktori.js`). Jika hash tujuan sama dengan hash sekarang, daftar dirender ulang di tempat. | Sebelum: dialog muncul saat simpan (langkah 3). Sesudah: simpan → pindah ke `#/berita` tanpa dialog. |
| Guard tetap berfungsi | — | Tidak dilonggarkan. | Sesudah perbaikan, edit yang **belum** disimpan lalu pindah halaman tetap memunculkan dialog. |
| Metode uji | — | Uji end-to-end di halaman `admin/` nyata dengan `window.__SB__` di-mock (tanpa menyentuh Supabase produksi). | Urutan terukur: `1-load dirty=false` → `2-typed dirty=true` → `3-saved hash=#/berita, tanpa dialog` → `4-typed-again dirty=true` → `5-nav-away dialog muncul`. |

**5f. Fase 10G — Alur editorial, alat format artikel, dan profil penulis**

| Fitur | Yang ditambahkan | Bukti uji |
|---|---|---|
| Alur draf & tinjauan | Status artikel kini empat tahap: **Draf** → **Menunggu tinjauan** → **Terbit** / **Ditolak** (`data.tinjauan`, `data.catatan_editor`, `data.ditinjau_oleh`, `data.ditinjau_pada`). Penulis memakai tombol **Simpan & ajukan tinjauan**; editor melihat tombol **Tinjau** untuk menyetujui (terbit) atau mengembalikan dengan catatan. Filter daftar bertambah “Menunggu tinjauan” dan “Ditolak”. | E2E browser (Supabase di-mock): penulis → `tinjauan='diajukan'`, `published=false`; editor setujui → `published=true`, `tinjauan='disetujui'`, `ditinjau_oleh` terisi; tolak → `tinjauan='ditolak'` + catatan tersimpan. |
| Alat format isi artikel | Toolbar editor: sub-subjudul, garis bawah, coret, hapus format, **ukuran teks** (Normal/Kecil/Sedang/Besar/Judul kutipan), dan perataan kiri/tengah/kanan. Disimpan sebagai penanda terbatas `<size=NN>` / `<align=…>` di markdown, sehingga tetap kompatibel dengan data lama. | 9 kasus parser admin + publik lulus; round-trip markdown→HTML→markdown mempertahankan semua format; sanitizer publik hanya menerima `data-fs` 12–72 dan `data-al` left/center/right (nilai aneh/CSS bebas ditolak, 9 kasus lulus). |
| Profil penulis | Koleksi CMS baru **Profil Penulis** (Nama, Foto, Bidang, Pendidikan, Pengalaman mengajar/bekerja, Profil singkat, Kontak opsional). Artikel memilih penulis dari profil; publik menampilkan kartu penulis (nama, bio, Bidang, Pendidikan, Pengalaman) di akhir artikel. | Integrasi `content.js`+`app.js` asli di Node: 10/10 pemeriksaan lulus (blok `.ar-author`, nama, bidang, pendidikan, 2 butir pengalaman, bio, `aria-label`). Screenshot preview: kartu tampil rapi di desktop. |
| Bug yang ditemukan & diperbaiki | (1) `articleInlineHTML`/`M.rich` melakukan escape **sebelum** mengenali penanda format → format tidak pernah tampil; (2) pemilik artikel (`created_by`) ditolak membuka editornya sendiri; (3) tombol **Tinjau** tidak muncul untuk editor karena artikelnya dianggap “writable”. | Ketiganya diperbaiki dan diuji ulang: format tampil, penulis bisa membuka editor, tombol Tinjau muncul untuk editor/pengurus. |

Catatan: skema `content_items` dipakai ulang untuk `type='penulis'` (bukan tabel baru), sehingga RLS, riwayat perubahan, dan alur draf otomatis berlaku. Publik hanya menerima baris `published=true` karena query publik memfilter `published=eq.true`. **Perubahan skema (`supabase/schema.sql`) belum dijalankan ke database produksi** — perlu dijalankan manual oleh admin (izin terpisah).

**5g. Fase 10H — Profil penulis diisi sendiri (Opsi B: tabel `author_profiles`)**

Desain 10G (profil sebagai konten `type=penulis`) diganti karena RLS-nya tidak memungkinkan penulis mengisi profilnya sendiri: `can_edit('penulis')` hanya `true` untuk pengurus/super_admin, dan `with check` pada `items_update` menutup pemilik.

| Aspek | Implementasi | Bukti uji |
|---|---|---|
| Skema | Tabel baru `author_profiles` — satu baris per akun (`email unique`), kolom nama/foto/bidang/pendidikan/pengalaman/bio/kontak, `published` default **false**. | Idempoten (`create table if not exists` + `drop policy if exists`). |
| RLS | Publik membaca `published=true`; staf membaca barisnya sendiri; insert/update hanya pemilik (atau admin); delete hanya admin. | Anon delete tetap ditolak; payload update penulis tidak menyertakan `published`. |
| Anti terbit sendiri | Trigger `guard_author_publish`: penulis tidak bisa menaikkan `published` (nilai lama dipertahankan), kecuali `can_review('berita')`. | Diuji lewat payload: update penulis hanya berisi kolom profil. |
| Halaman admin | **Profil Saya** (semua staf, termasuk jurnalis/ustadz) + **Daftar Penulis** (pengurus: setujui/sembunyikan). Menu grup “Profil penulis” terbuka default. | E2E: jurnalis membuat profil → insert `author_profiles`; edit → update; pengurus menyetujui → `published=true`. |
| Artikel | Dropdown penulis kini berisi profil (`penulis_id`), bukan nama bebas. Menyimpan artikel mengisi `data.penulis_id` + `data.penulis` dari profil. | Uji: pilih “Nyai Siti Aminah” → payload `penulis_id: ap2`, `penulis: Nyai Siti Aminah`. |
| Publik | `content.js` mengambil `author_profiles?published=eq.true`; `app.js` membentuk `PENULIS` dari `MW.authors()` dan merender kartu penulis. | Integrasi `content.js`+`app.js` asli: **11/11** pemeriksaan lulus (nama, bidang, pendidikan, 2 butir pengalaman, bio, kontak, byline). |
| Koleksi `type=penulis` di CMS | Dihapus dari `COLS` admin dan `can_edit` agar tidak ada dua sumber kebenaran. | `can_edit` kembali ke daftar semula (skema perlu dijalankan ulang untuk mencabut izin `penulis`). |
| Privasi kolom (diperbaiki setelah skema dijalankan) | `grant select` ke `anon` berlaku untuk **semua kolom**, sedangkan RLS hanya membatasi baris. Akibatnya kunci anon bisa meminta `email` penulis. Kini anon hanya mendapat select kolom tampilan (`id, nama, foto, bidang, pendidikan, pengalaman, bio, kontak`); `email` dan kolom internal hanya untuk `authenticated`. | Uji produksi: `GET /author_profiles?select=email` dengan anon key → **401 permission denied**. Query yang dipakai situs (hanya kolom tampilan) tetap 200. |

**Verifikasi langsung ke database produksi (read-only, setelah skema dijalankan):**

| Pemeriksaan | Hasil |
|---|---|
| `select` anon ke `author_profiles` | HTTP 200, 0 baris (belum ada profil) |
| `insert` anon ke `author_profiles` | Ditolak — `42501 permission denied for table` |
| `is_staff()` anon | `false` |
| Query persis `content.js` | HTTP 200 |
| Filter `published=eq.true` (anon) | HTTP 200 (setelah kolom `published` ikut di-grant) |
| Anon meminta kolom `email` | **401** — `42501`, email tidak dapat dibaca publik |

**Langkah kecil yang masih tersisa:** jalankan ulang `supabase/schema.sql` (hanya blok grant `anon` pada bagian **7** yang berubah). Tanpa itu, publik **tidak bisa membaca profil penulis** (HTTP 401 `permission denied`) sehingga kartu penulis tidak akan muncul.

**Koreksi 10H-1 (penting, ditemukan lewat verifikasi produksi):** versi pertama menaruh `grant select on public.author_profiles to anon` lalu `revoke select ... from anon`. Di PostgreSQL, `GRANT SELECT (kolom)` **tidak** menghapus hak tabel penuh, dan `REVOKE select` mencabut **semua** hak `select` — termasuk yang per-kolom. Hasilnya anon tidak bisa membaca apa pun (401). Urutan benar: **cabut dulu hak tabel penuh, lalu beri grant per-kolom.** Blok final:

```sql
revoke select on public.author_profiles from anon;
grant select (id, nama, foto, bidang, pendidikan, pengalaman, bio, kontak)
  on public.author_profiles to anon;
```

Setelah dijalankan ulang, harapan yang harus terpenuhi: query situs → **200**, permintaan kolom `email` → **401**.

**Koreksi 10H-2 (ditemukan lewat uji produksi setelah skema dijalankan):** setelah grant per-kolom aktif, query situs justru gagal `401 / 42501`. Penyebabnya: query memakai filter `published=eq.true`, dan kolom `published` **tidak** termasuk dalam grant per-kolom — PostgREST menolak kolom yang dipakai di `WHERE`. Terukur di produksi: tanpa filter → **200**, dengan filter → **401**.

Dua perbaikan:
1. `js/content.js` tidak lagi memfilter `published` di klien. Penyaringan baris sudah dilakukan RLS (`author_read`), jadi anon tetap hanya menerima profil yang disetujui. Query situs terverifikasi **200** di produksi.
2. `supabase/schema.sql` menambahkan `published` ke grant kolom anon, sehingga filter itu tetap sah bila kelak dipakai lagi. Kolom ini hanya menandai status tampil, bukan data pribadi.

Pelajaran yang dicatat di skema: **grant per-kolom harus mencakup kolom yang dipakai `WHERE`/`ORDER BY`**, bukan hanya kolom yang ditampilkan.

**Status akhir setelah skema final dijalankan (diverifikasi langsung ke produksi):**

| Uji | Hasil |
|---|---|
| Query situs (`order=nama`, kolom tampilan) | 200 |
| Filter `published=eq.true` oleh anon | 200 |
| Kolom `email` oleh anon | 401 `42501` |
| `insert` oleh anon | 401 `42501` |
| `is_staff()` sebagai anon | `false` |
| `can_review()` sebagai anon | `null` (bukan true) |

Kesimpulan: publik dapat membaca profil yang terbit saja, tanpa akses ke email maupun hak tulis. Fitur profil penulis siap dipakai.

**5h. Fase 10I — Hook berita mengikuti berita terbaru + byline "Admin"**

| Aspek | Temuan | Perbaikan | Bukti |
|---|---|---|---|
| Hook/daftar berita tidak mengikuti terbaru | `drawN()` mengurutkan tanggal **lalu ada blok yang memaksa satu artikel `featured` ke posisi pertama** (`curN.unshift(_f)`), sehingga urutan kembali melenceng. Di data produksi 13 dari 15 artikel bertanda `featured`, jadi hampir semua bisa tampil di depan. | Blok pengangkatan featured dihapus. Urutan murni tanggal terbaru; `featured` hanya memecah seri tanggal. Hook `renderRouteNews` juga diurutkan tanggal desc (kategori aktif tetap diutamakan). | A/B dari sumber: sebelum → `curN.unshift(_f)` ada; sesudah → tidak ada. Data produksi: hook = 3 berita terbaru (26 Nov, 22 Nov, 20 Nov), daftar urut menurun. |
| Byline "Admin" tampil di publik | 4 artikel terbit ber-`penulis: "Admin"`. | `bylineOf()`: pakai nama profil bila artikel tertaut, dan tampilkan "Redaksi MWCNU Pondok Aren" untuk nilai `Admin`/kosong. **Data CMS tidak diubah.** | Uji render 4 artikel tersebut dengan data produksi: byline tidak lagi "Admin". |
| Penautan artikel lama | Belum ada satu pun profil penulis di `author_profiles`, jadi belum ada yang bisa ditautkan. | Disiapkan `supabase/migrasi-profil-penulis.sql` (idempoten, tidak menghapus apa pun) untuk **Anda review dan jalankan sendiri**: membuat profil Redaksi dan menautkan artikel yang belum punya `penulis_id`. | Belum dijalankan — menunggu persetujuan karena mengubah data live. |

**Tindakan manual yang tersisa (izin terpisah, belum dilakukan):** jalankan `supabase/schema.sql` versi baru di SQL Editor agar tabel `author_profiles` + RLS-nya ada, lalu penulis membuka `/admin` → **Profil Saya**.

**Risiko dan Catatan**

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
2. Setelah deploy, minta platform (WhatsApp/Facebook) me-refresh cache preview untuk artikel yang thumbnail-nya masih hero beranda.
2. Hapus/rapikan referensi `img-1a2f09f7.webp` di data CMS (`foto_tambahan` artikel Halal Bi Halal) melalui dashboard admin agar data sumber ikut bersih (perubahan data produksi memerlukan otorisasi terpisah).
