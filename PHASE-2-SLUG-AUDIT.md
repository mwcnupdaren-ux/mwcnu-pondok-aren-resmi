# PHASE 2 — SLUG AUDIT & BACKFILL PREPARATION

**Status:** READ-ONLY AUDIT ONLY — belum ada implementasi/backfill  
**Tanggal:** 2026-11-23  
**Repository kerja:** `C:\Users\99kho\Documents\WEB DEVELOP\mwcnu-meta-worktree`  
**Branch / baseline:** `feat/crawlable-article-metadata` / `c2eb26aebcfa461ced83e19ecb6e7ea730a6d24d`

## Ringkasan

Query database hanya memakai HTTP GET dengan publishable key. Dari role publik terlihat 121 baris `content_items`; di antaranya 13 `type=berita`, semuanya `published=true`. Dua belas tidak memiliki `data.slug`, satu memiliki slug yang valid. Tidak ada duplikat atau benturan normalisasi yang teramati pada data berita yang terlihat. RLS membatasi pembacaan draft/unpublished; jumlah semua status tidak dapat ditentukan dan 0 hasil `published=false` bukan bukti bahwa draft tidak ada. `change_log` tidak dapat dibaca role publik. Kandidat slug adalah hasil normalisasi lokal, bukan persetujuan owner atau perubahan DB.

## A. Struktur data aktual

Repository `supabase/schema.sql` mendefinisikan `public.content_items`: `id uuid primary key`, `type text`, `data jsonb`, `sort integer`, `published boolean not null default true`, `created_at`, `updated_at`, `created_by`, `updated_by`. Index schema yang tercatat: `(type, sort, created_at)`. Tidak terlihat kolom slug khusus, constraint format slug, atau unique index slug dalam schema repository. Struktur database produksi tidak dapat dipastikan sepenuhnya hanya dari file schema.

Artikel adalah baris `type='berita'`; judul, slug, foto, metadata dan field editorial tersimpan dalam JSONB `data`. `admin/admin.js` menulis slug ke `data.slug` ketika editor menyimpan artikel. `js/content.js` mengambil artikel published, urutan `sort, created_at, id` menaik, dan menyimpan hasil ke cache `localStorage` (`mwc_data`).

**Baris terlihat oleh role publik per type:** agenda 1; banom 6; berita 13; galeri 8; halaman 6; kegiatan 4; layanan 6; majelis 3; pengurus 50; program 5; ranting 11; tanya_jawab 2; video 6. **Total 121 terlihat**, bukan jaminan total tabel.

## B. Total artikel menurut status

- Published: **13 terlihat dan terverifikasi**.
- Draft/unpublished: **tidak dapat ditentukan**. Query publik dengan filter `published=false` mengembalikan 0 baris akibat visibilitas RLS.
- Status lain: schema yang diperiksa memakai boolean `published`, bukan status teks. Baris yang tidak terlihat tetap tidak terhitung.
- RLS schema (`items_read`) memberi baca untuk published atau kondisi hak `can_edit`/`can_review`; anonymous tidak memperoleh inventaris draf. Perlu query/export read-only terotorisasi untuk cakupan penuh.

## C. Slug kosong, duplikat, tidak valid

Pada 13 artikel yang dapat dibaca: tanpa key `slug` 12; slug tersimpan 1; slug kosong di antara yang tersimpan 0; duplikat exact-case 0; slug tersimpan tidak sesuai `^[a-z0-9]+(-[a-z0-9]+)*$` 0; benturan hasil normalisasi judul 0; foto utama kosong 0. Hasil ini **tidak** mencakup draf/hidden rows, yang dapat memiliki slug duplikat atau menimbulkan benturan.

Slug tersimpan yang ditemukan: `merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga` — valid dan direkomendasikan untuk dipertahankan persis.

## D. Pemetaan seluruh artikel yang terlihat

Status pada semua baris di bawah: `published`. Foto berisi URL/path foto utama. Usulan dibuat dengan algoritme `slugify` admin yang ada; tidak ada usulan untuk mengganti slug tersimpan. Urutan `legacy #berita/N` mengikuti urutan frontend saat ini; indeks bukan ID permanen.

| ID                                     | Judul                                                                                             | Status    | Slug saat ini                                                                        | Slug usulan                                                                                         | Foto                                                                                                                                               | Konflik                                                                                      | Rekomendasi |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| `92fd61e6-1364-4058-bf4e-f058c720fd84` | Halal Bi Halal Keluarga Besar NU Pondok Aren Angkat Tema Membumikan Dakwah dan Menguatkan Ranting | Published | _(tidak ada)_                                                                        | `halal-bi-halal-keluarga-besar-nu-pondok-aren-angkat-tema-membumikan-dakwah-dan-menguatkan-ranting` | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo65sw4s3ts.webp`; tidak ada benturan teramati (97 karakter) | Tinjau panjang/editorial; jika disetujui simpan permanen dan pertahankan mapping `#berita/0` |
| `0acaecff-ff03-42f8-be7d-85ed63a5b983` | MWCNU Pondok Aren Gelar Lailatul Ijtima' dan Tawaqufan di Pondok Kacang Barat                     | Published | _(tidak ada)_                                                                        | `mwcnu-pondok-aren-gelar-lailatul-ijtima-dan-tawaqufan-di-pondok-kacang-barat`                      | `/assets/img-897feccb.webp`; tidak ada benturan                                                                                            | Tinjau kandidat; mapping lama `#berita/1`                                                    |
| `ae6d9241-216e-40ab-b466-3f19399d53db` | Launching QRIS, MWCNU Pondok Aren Melangkah Maju dari Koin NU                                     | Published | _(tidak ada)_                                                                        | `launching-qris-mwcnu-pondok-aren-melangkah-maju-dari-koin-nu`                                      | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo6gi8ok9b9.webp`; tidak ada benturan                        | Tinjau kandidat; mapping lama `#berita/2`                                                    |
| `e9a4b515-a16d-41bc-81bb-d310b936170d` | Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur                                                 | Published | _(tidak ada)_                                                                        | `turba-mwcnu-pondok-aren-di-prnu-jurangmangu-timur`                                                 | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo6xawbzzdl.webp`; tidak ada benturan                        | Tinjau kandidat; mapping lama `#berita/3`                                                    |
| `b18c0158-672a-4ad9-b38e-7d222632c3a4` | KH Fathur Rahman: Tradisi dan Warisan Ulama Harus Terus Dilestarikan                              | Published | _(tidak ada)_                                                                        | `kh-fathur-rahman-tradisi-dan-warisan-ulama-harus-terus-dilestarikan`                               | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwb77b899eck.webp`; tidak ada benturan                        | Tinjau; mapping `#berita/4`; meta title dan description sudah ada                            |
| `eb978bd1-b4af-4817-b27e-7cc557ac5a71` | Sikapi Dinamika Nasional, PBNU dan PWNU Se-Indonesia Rilis 6 Pernyataan Sikap                     | Published | _(tidak ada)_                                                                        | `sikapi-dinamika-nasional-pbnu-dan-pwnu-se-indonesia-rilis-6-pernyataan-sikap`                      | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwi8jd8vraps.webp`; tidak ada benturan                        | Tinjau; mapping `#berita/5`; meta title ada, description kosong                              |
| `91880c5c-623b-4aa0-812d-0912850027cd` | MWCNU Pondok Aren Gelar Tarling di Musholla Al-Ikhwan, Kenalkan Prinsip Dasar NU                  | Published | _(tidak ada)_                                                                        | `mwcnu-pondok-aren-gelar-tarling-di-musholla-al-ikhwan-kenalkan-prinsip-dasar-nu`                   | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwia2wzxktl3.webp`; tidak ada benturan                        | Tinjau kandidat; mapping `#berita/6`                                                         |
| `599ca2da-df16-4f12-a91e-09ca498e471f` | Pentingnya Menjaga Tradisi Aswaja di Era Modern: Pesan KH. M. Thoha                               | Published | _(tidak ada)_                                                                        | `pentingnya-menjaga-tradisi-aswaja-di-era-modern-pesan-kh-m-thoha`                                  | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo5xei4lf9x.webp`; tidak ada benturan                        | Tinjau kandidat; mapping `#berita/7`                                                         |
| `99c61340-3f25-4fae-a471-a1f93f53cb34` | Menyiapkan Bekal Akhirat: Pesan KH. Ahmad Misbah di Pondok Aren                                   | Published | _(tidak ada)_                                                                        | `menyiapkan-bekal-akhirat-pesan-kh-ahmad-misbah-di-pondok-aren`                                     | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo7hzbdr68m.webp`; tidak ada benturan                        | Tinjau kandidat; mapping `#berita/8`                                                         |
| `20537a67-d5eb-42de-9c18-ab131d8be214` | Aksi Sosial GP Ansor-Banser Pondok Aren & Griya Al Fath di Idul Adha                              | Published | _(tidak ada)_                                                                        | `aksi-sosial-gp-ansor-banser-pondok-aren-griya-al-fath-di-idul-adha`                                | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo81v1dqqjb.webp`; tidak ada benturan                        | Tinjau kandidat; mapping `#berita/9`                                                         |
| `c533df16-e18b-4afb-b59a-749ccac13959` | Menjaga Istiqomah: Pesan KH. Mohammad Jamil di Pondok Jaya Aren                                   | Published | _(tidak ada)_                                                                        | `menjaga-istiqomah-pesan-kh-mohammad-jamil-di-pondok-jaya-aren`                                     | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwo8wb0tz682.webp`; tidak ada benturan                        | Tinjau kandidat; mapping `#berita/10`                                                        |
| `f13d845b-cfd0-47a1-b4b8-a2cf60670dd8` | PBNU Bantah Tegas Isu Aliran Dana Rp70 Miliar untuk Muktamar                                      | Published | _(tidak ada)_                                                                        | `pbnu-bantah-tegas-isu-aliran-dana-rp70-miliar-untuk-muktamar`                                      | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwob3hssc3gv.webp`; tidak ada benturan                        | Tinjau kandidat; mapping `#berita/11`                                                        |
| `d13af14b-52e7-44fd-a503-514adb1b5ca6` | Merindukan Reuni di Surga 'Adn: Empat Bekal untuk Berkumpul Kembali Bersama Keluarga              | Published | `merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga` | Sama dengan slug saat ini                                                                           | `https://wvfcifqolohfipvepxss.supabase.co/storage/v1/object/public/media/berita/2026/mwqvgcatl2gm.webp`; tidak ada benturan                        | Pertahankan slug; mapping lama `#berita/12`                                                  |

Nilai foto pada tabel adalah URL/path yang dibaca dari snapshot GET. Pertahankan nilainya persis ketika menyiapkan migrasi; verifikasi ulang pada snapshot pra-migrasi. (12 foto memakai domain storage Supabase yang sama.)

Ringkasan foto: 12 URL Storage Supabase dan 1 path lokal (`/assets/img-897feccb.webp`); semua 13 foto utama non-empty. Metadata `meta_judul` terisi 2/13, `meta_desc` terisi 2/13.

## E. Mekanisme slug dan rekomendasi

`admin/admin.js` mempunyai `slugify`: Unicode NFKD/diakritik dihapus, lowercase, apostrof dibuang, karakter selain ASCII alfanumerik diubah menjadi hyphen, trim, maksimum 100 karakter; slug numerik saja diberi prefix `artikel-`, hasil kosong menjadi `artikel`. Editor menyatakan slug tersimpan tidak berubah saat judul diedit. Saat save, slug tersimpan diprioritaskan, kemudian diperiksa unik oleh query aplikasi terhadap berita lain dan diberi suffix `-2`, dst jika dipakai.

Namun `app.js` juga punya `ensureSlug()` yang menghitung slug browser-side untuk artikel tanpa slug (dari judul dan urutan daftar); nilai itu tidak ditulis ke database. `newsHref()` memakai slug jika tersedia, jika tidak memakai indeks array. Maka slug persistensi saat ini hanya ada bila `data.slug` sudah disimpan; fallback yang dibuat browser tidak permanen dan dapat berubah mengikuti urutan data. Rekomendasi: pertahankan slug tersimpan; tinjau kandidat satu per satu; tetapkan sekali dan permanen; jangan ubah slug otomatis ketika judul diedit. Terapkan uniqueness untuk seluruh status dan hindari menjadikan urutan array sebagai identitas.

## F. Risiko kompatibilitas URL lama

- URL berita SPA saat ini `#berita/<ref>`; `app.js` menerima indeks angka dan slug. Hash tidak dikirim dalam HTTP request ke server.
- URL `#berita/0`…`#berita/12` bergantung pada urutan artikel saat ini, bukan UUID. Urutan/jumlah/cache dapat berubah, berpotensi membuat URL lama membuka artikel berbeda. Mapping ini hanya snapshot saat audit.
- `sitemap.xml` hanya mencantumkan canonical root, menyebut situs satu halaman dengan hash navigation. JS mengubah `document.title` dan meta tag setelah render; hal itu tidak membuktikan social crawler menerima metadata server-side.
- Clean path memerlukan pemisahan namespace, canonical, 404, sitemap, server-side metadata, serta resolusi hash lama. Tidak ada bukti audit mengenai seluruh tautan eksternal/inbound lama.
- Pertahankan handler hash dan siapkan mapping legacy stabil berbasis snapshot ID (bukan menghitung ulang indeks); jangan mengganti slug permanen tanpa alias/redirect yang disetujui.

## G. Rencana backfill (belum dijalankan)

1. Owner menyetujui cakupan semua berita (termasuk draft/unpublished), nilai kandidat, panjang slug, dan aturan empty/null/slug tak valid.
2. Sebelum backfill, ambil ulang inventaris read-only penuh yang diotorisasi: semua status, `id`, `data.slug`, judul, foto, `published`, sort/timestamps. Periksa duplikat case-sensitive/case-insensitive, format, blank, dan benturan normalisasi pada keseluruhan data.
3. Review mapping `id → slug lama → slug baru → legacy URL` dan setujui oleh owner/editor; slug existing valid dipertahankan.
4. Desain update terarah per UUID hanya untuk item yang disetujui tanpa slug. Pertahankan `id`, semua kunci JSONB lain, judul, status, foto dan relasi; jangan update berdasarkan judul saja.
5. Uji di staging terpisah: jumlah affected, unique/format, kesamaan field non-slug, akses RLS, alias URL lama, metadata server-side. Siapkan backup terverifikasi.
6. Minta persetujuan terpisah untuk migrasi/database, perubahan aplikasi, dan deployment. Jika disetujui kelak, jalankan batch idempotent dan verifikasi pascaoperasi. Tidak ada tahap backfill dalam audit ini.

Constraint/index untuk evaluasi (tidak diterapkan): unique index parsial pada slug JSONB berita non-null/non-empty, dengan kebijakan case sensitivity eksplisit; check format/panjang terbatas untuk berita; aturan untuk empty string, null, record lama tidak valid. Validasi aplikasi saja tidak mencegah race concurrent.

## H. Rencana rollback

1. Backup/snapshot sebelum migrasi dan manifest per ID berisi slug sebelum/sesudah (termasuk absent/null) serta checksum.
2. Uji rollback di staging. Kembalikan hanya `data.slug` untuk UUID yang diubah oleh batch; jangan overwrite JSONB utuh agar perubahan editorial setelah backfill tidak hilang.
3. Catat batch, row count dan ID sukses. Akses audit log memerlukan operator berotorisasi karena `change_log` tidak publik.
4. Rollback constraint/index merupakan prosedur schema terpisah dengan izin eksplisit; jangan drop otomatis.
5. Jika clean URL sudah diterbitkan, pertahankan alias/redirect yang telah digunakan; utamakan pemulihan mapping.
6. Verifikasi ID, slug, JSONB non-slug, status, foto, RLS, route lama, canonical dan metadata. Hentikan bila ada edit konkuren pada row yang sama.

## I. Keputusan owner yang diperlukan

1. Cara memperoleh inventaris penuh semua status secara read-only/terotorisasi.
2. Apakah slug dibuat untuk semua status (rekomendasi: semua berita sebelum publikasi).
3. Persetujuan slug usulan, pemendekan, judul kosong, slug tidak valid, dan permanensi ketika judul berubah.
4. URL final dan namespace clean URL, canonical, 404, sitemap, server-side metadata, serta hash alias/redirect lama.
5. Cara mapping URL indeks lama yang stabil dan sumber snapshot historisnya.
6. Schema permanensi (`data.slug` vs kolom khusus), keunikan/case, batas karakter dan constraint.
7. Otorisasi terpisah untuk perubahan aplikasi, migrasi/backfill database, dan deployment.

## Metode, keamanan, dan batasan

Dibaca: `supabase/schema.sql`, `js/content.js`, `js/app.js`, `admin/admin.js`, `sitemap.xml`, serta referensi baseline/CMS. Query database hanya GET dengan publishable key; tidak memakai atau menampilkan service-role key, password, token, maupun nilai `created_by`. Total visible 121; 13 artikel visible/published; filter unpublished 0 karena RLS; `change_log` ditolak HTTP 401. Tidak ada contoh data yang direka. Tidak ada operasi SQL write, slug backfill, perubahan file aplikasi, konfigurasi deployment, database, commit, push, atau deploy.
