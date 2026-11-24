# PHASE 2B — FULL SLUG INVENTORY & FINAL MAPPING

**Status:** READ-ONLY INVESTIGATION — inventaris penuh belum dapat diselesaikan karena akses yang tersedia dibatasi RLS  
**Tanggal pemeriksaan:** 2026-11-23  
**Worktree:** `C:\Users\99kho\Documents\WEB DEVELOP\mwcnu-meta-worktree`  
**Branch:** `feat/crawlable-article-metadata`  
**Baseline:** `c2eb26aebcfa461ced83e19ecb6e7ea730a6d24d`

## Kesimpulan

Tidak ditemukan mekanisme/kredensial admin yang tersedia dan berwenang untuk membaca draft/unpublished secara read-only. Akses yang berhasil pada Phase 2A menggunakan public/publishable role, yang terkena RLS. Sesuai instruksi, investigasi data dihentikan pada batas itu. Tidak dicoba melewati RLS, mengekstrak sesi login/token, atau menggunakan kredensial yang tidak tersedia.

Karena cakupan penuh tidak dapat dibaca, laporan ini **tidak menyatakan jumlah berita draft yang sebenarnya, tidak menyatakan global uniqueness, dan tidak menerbitkan final mapping lengkap seolah-olah datanya aktual**. Daftar pada bagian C/E adalah hanya snapshot 13 berita published yang dapat dibaca pada Phase 2A dan kandidat awal yang perlu divalidasi; bukan final mapping semua artikel.

## A. Metode dan sumber akses

Pemeriksaan read-only dilakukan pada worktree yang ditentukan dan baseline yang diminta. Ketersediaan mekanisme diperiksa secara metadata saja:

- Tidak ada file `.env`, `.env.local`, atau `.env.development.local` pada root worktree.
- Tidak ada variabel lingkungan bernama terkait Supabase/database/service-role/PG yang tersedia; hanya nama variabel diperiksa, bukan nilainya.
- Supabase CLI dan `psql` tidak ditemukan pada PATH.
- Tidak ditemukan path sesi/token Supabase CLI pada lokasi standar yang diperiksa. Tidak ada inspeksi credential store, browser profile, atau isi file rahasia.
- Publishable/public API yang dipakai di Phase 2A hanya dapat membaca baris yang diizinkan RLS. Uji eksplisit `published=false` memberi nol baris terlihat; itu **tidak membuktikan** jumlah draft sebenarnya nol.
- Akses `change_log` dengan public role ditolak HTTP 401/permission denied.

Tidak ada SQL write, query mutasi, perubahan schema, backfill, atau upaya mengatasi policy. Data Phase 2A dipakai hanya sebagai konteks yang sudah tersedia; tidak dianggap sebagai inventaris aktual baru untuk Phase 2B.

## B. Jumlah berita berdasarkan `published`

| Cakupan                                            |              Jumlah | Arti                                                                                        |
| -------------------------------------------------- | ------------------: | ------------------------------------------------------------------------------------------- |
| Berita published terlihat di snapshot Phase 2A     |                  13 | Dapat diverifikasi untuk query publik saat snapshot diambil; belum di-refresh pada Phase 2B |
| Berita `published=false` terlihat oleh public role |                   0 | Hasil RLS-filtered query, bukan jumlah row draft aktual                                     |
| Berita `published=false` aktual di database        | **Tidak diketahui** | Memerlukan akses read-only yang sah dengan hak melihat draft                                |
| Total seluruh berita aktual                        | **Tidak diketahui** | Tidak dapat dihitung dari hasil publik saja                                                 |

Schema repository memakai boolean `published`; tidak tampak kolom status teks pada definisi `content_items`. Tidak disimpulkan apakah ada status/variasi data lain di database produksi yang tidak dapat dibaca.

## C. Inventaris berbasis UUID yang tersedia (snapshot terbatas)

Berikut 13 berita yang terlihat pada Phase 2A, bukan inventaris seluruh database terkini. UUID adalah identitas row. `published` dan foto berasal dari snapshot Phase 2A. `Slug sekarang` kosong berarti tidak ada key `data.slug` pada snapshot tersebut. Mapping final untuk seluruh status belum tersedia.

| UUID                                   | Judul                                                                                             | Published | Slug saat ini                                                                        | Foto utama (ringkas)                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | --------: | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `92fd61e6-1364-4058-bf4e-f058c720fd84` | Halal Bi Halal Keluarga Besar NU Pondok Aren Angkat Tema Membumikan Dakwah dan Menguatkan Ranting |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo65sw4s3ts.webp` |
| `0acaecff-ff03-42f8-be7d-85ed63a5b983` | MWCNU Pondok Aren Gelar Lailatul Ijtima' dan Tawaqufan di Pondok Kacang Barat                     |      true | _(tidak ada)_                                                                        | `/assets/img-897feccb.webp`                             |
| `ae6d9241-216e-40ab-b466-3f19399d53db` | Launching QRIS, MWCNU Pondok Aren Melangkah Maju dari Koin NU                                     |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo6gi8ok9b9.webp` |
| `e9a4b515-a16d-41bc-81bb-d310b936170d` | Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur                                                 |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo6xawbzzdl.webp` |
| `b18c0158-672a-4ad9-b38e-7d222632c3a4` | KH Fathur Rahman: Tradisi dan Warisan Ulama Harus Terus Dilestarikan                              |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwb77b899eck.webp` |
| `eb978bd1-b4af-4817-b27e-7cc557ac5a71` | Sikapi Dinamika Nasional, PBNU dan PWNU Se-Indonesia Rilis 6 Pernyataan Sikap                     |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwi8jd8vraps.webp` |
| `91880c5c-623b-4aa0-812d-0912850027cd` | MWCNU Pondok Aren Gelar Tarling di Musholla Al-Ikhwan, Kenalkan Prinsip Dasar NU                  |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwia2wzxktl3.webp` |
| `599ca2da-df16-4f12-a91e-09ca498e471f` | Pentingnya Menjaga Tradisi Aswaja di Era Modern: Pesan KH. M. Thoha                               |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo5xei4lf9x.webp` |
| `99c61340-3f25-4fae-a471-a1f93f53cb34` | Menyiapkan Bekal Akhirat: Pesan KH. Ahmad Misbah di Pondok Aren                                   |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo7hzbdr68m.webp` |
| `20537a67-d5eb-42de-9c18-ab131d8be214` | Aksi Sosial GP Ansor-Banser Pondok Aren & Griya Al Fath di Idul Adha                              |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo81v1dqqjb.webp` |
| `c533df16-e18b-4afb-b59a-749ccac13959` | Menjaga Istiqomah: Pesan KH. Mohammad Jamil di Pondok Jaya Aren                                   |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwo8wb0tz682.webp` |
| `f13d845b-cfd0-47a1-b4b8-a2cf60670dd8` | PBNU Bantah Tegas Isu Aliran Dana Rp70 Miliar untuk Muktamar                                      |      true | _(tidak ada)_                                                                        | Storage Supabase `/media/berita/2026/mwob3hssc3gv.webp` |
| `d13af14b-52e7-44fd-a503-514adb1b5ca6` | Merindukan Reuni di Surga 'Adn: Empat Bekal untuk Berkumpul Kembali Bersama Keluarga              |      true | `merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga` | Storage Supabase `/media/berita/2026/mwqvgcatl2gm.webp` |

`created_at` dan `updated_at` yang diminta untuk inventaris lengkap tidak disalin ke laporan ini karena tidak ada snapshot publik mentah yang masih tersedia setelah scratch audit dibersihkan; Phase 2A melaporkan bahwa field tersebut dibaca, tetapi melaporkan timestamp per artikel dalam tabel final akan memerlukan query baru. Query baru untuk published dapat dilakukan dengan akses publik, namun itu tidak akan menyelesaikan kebutuhan semua status, jadi tidak dilakukan agar tidak memberi kesan audit penuh. Timestamp untuk draft juga memerlukan akses yang sama dengan inventaris draft.

## D. Pemeriksaan uniqueness

### Terlihat pada snapshot 13 published Phase 2A

- Existing non-empty slug: 1.
- Exact duplicate existing slug: tidak ditemukan.
- Case-insensitive duplicate existing slug: tidak ditemukan di antara slug yang terlihat (hanya ada satu).
- Empty/null slug key: 12 artikel tidak mempunyai `data.slug`; tidak ada slug whitespace-only tersimpan yang ditemukan.
- Format slug tersimpan: satu nilai yang terlihat sesuai `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Benturan kandidat normalisasi judul di antara 13 artikel terlihat: tidak ditemukan.

### Seluruh berita, termasuk draft/unpublished

**Belum dapat diuji.** Tidak boleh menyimpulkan unique global, tidak ada collision, atau mapping kandidat global bebas konflik sampai seluruh baris dapat dibaca. Kandidat dari satu artikel published dapat berbenturan dengan slug yang sudah dipakai draft tersembunyi.

## E. Kandidat slug — sementara, bukan final mapping

Kandidat berikut berasal dari normalisasi judul Phase 2A dengan algoritme `slugify` yang ada di `admin/admin.js`. Perlu validasi terhadap seluruh artikel (published dan draft) dan persetujuan editorial. Kandidat yang panjang atau perlu keputusan manual ditandai. Slug yang telah ada wajib dipertahankan persis sesuai instruksi owner.

| UUID                                   | Kandidat dari Phase 2A                                                                              | Panjang | Catatan                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- | ------: | ----------------------------------------------------------------------------------------------------- |
| `92fd61e6-1364-4058-bf4e-f058c720fd84` | `halal-bi-halal-keluarga-besar-nu-pondok-aren-angkat-tema-membumikan-dakwah-dan-menguatkan-ranting` |      97 | Perlu review manual: kandidat panjang (dekat batas 100 karakter); tentukan apakah diringkas editorial |
| `0acaecff-ff03-42f8-be7d-85ed63a5b983` | `mwcnu-pondok-aren-gelar-lailatul-ijtima-dan-tawaqufan-di-pondok-kacang-barat`                      |      76 | Ada apostrof pada judul yang dibuang dalam normalisasi; perlu review ejaan/istilah “Ijtima'”          |
| `ae6d9241-216e-40ab-b466-3f19399d53db` | `launching-qris-mwcnu-pondok-aren-melangkah-maju-dari-koin-nu`                                      |      60 | Kandidat awal; validasi global belum dilakukan                                                        |
| `e9a4b515-a16d-41bc-81bb-d310b936170d` | `turba-mwcnu-pondok-aren-di-prnu-jurangmangu-timur`                                                 |      49 | Kandidat awal; validasi global belum dilakukan                                                        |
| `b18c0158-672a-4ad9-b38e-7d222632c3a4` | `kh-fathur-rahman-tradisi-dan-warisan-ulama-harus-terus-dilestarikan`                               |      67 | Kandidat awal; validasi global belum dilakukan                                                        |
| `eb978bd1-b4af-4817-b27e-7cc557ac5a71` | `sikapi-dinamika-nasional-pbnu-dan-pwnu-se-indonesia-rilis-6-pernyataan-sikap`                      |      76 | Kandidat awal; validasi global belum dilakukan                                                        |
| `91880c5c-623b-4aa0-812d-0912850027cd` | `mwcnu-pondok-aren-gelar-tarling-di-musholla-al-ikhwan-kenalkan-prinsip-dasar-nu`                   |      79 | Kandidat awal; validasi global belum dilakukan                                                        |
| `599ca2da-df16-4f12-a91e-09ca498e471f` | `pentingnya-menjaga-tradisi-aswaja-di-era-modern-pesan-kh-m-thoha`                                  |      64 | Kandidat awal; validasi global belum dilakukan                                                        |
| `99c61340-3f25-4fae-a471-a1f93f53cb34` | `menyiapkan-bekal-akhirat-pesan-kh-ahmad-misbah-di-pondok-aren`                                     |      61 | Kandidat awal; validasi global belum dilakukan                                                        |
| `20537a67-d5eb-42de-9c18-ab131d8be214` | `aksi-sosial-gp-ansor-banser-pondok-aren-griya-al-fath-di-idul-adha`                                |      66 | `&` dinormalisasi menjadi pemisah hyphen; review editorial bila diperlukan                            |
| `c533df16-e18b-4afb-b59a-749ccac13959` | `menjaga-istiqomah-pesan-kh-mohammad-jamil-di-pondok-jaya-aren`                                     |      61 | Kandidat awal; validasi global belum dilakukan                                                        |
| `f13d845b-cfd0-47a1-b4b8-a2cf60670dd8` | `pbnu-bantah-tegas-isu-aliran-dana-rp70-miliar-untuk-muktamar`                                      |      60 | Kandidat awal; validasi global belum dilakukan                                                        |
| `d13af14b-52e7-44fd-a503-514adb1b5ca6` | `merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga`                |      82 | **Pertahankan persis; jangan regenerate atau rename**                                                 |

Kolom kandidat hanya memuat kandidat untuk 12 item tanpa slug; artikel UUID `d13...` tercantum sebagai pengecualian/slug existing yang harus dipertahankan. Semua kandidat di atas masih dapat berbenturan dengan data yang tidak terlihat.

## F. Risiko dan pengecualian

1. **RLS:** draft tidak terlihat oleh public role. Mencoba role/cara lain tanpa otorisasi atau mencari token lokal akan melewati batas akses; itu tidak dilakukan.
2. **Global uniqueness belum diketahui:** draft dapat memakai salah satu kandidat di atas, atau kandidat lain dari normalisasi judul draft dapat bertabrakan dengannya.
3. **Snapshot lama:** Phase 2A dilakukan pada waktu sebelumnya; judul, published, foto, slug, atau artikel dapat berubah sejak itu. Tidak ada klaim bahwa inventaris ini adalah snapshot terbaru.
4. **Timestamp tidak disalin:** `created_at`/`updated_at` artikel per baris tidak tersedia dari artefak analisis tersimpan saat Phase 2B. Jangan menebaknya.
5. **Legacy URL:** frontend lama mendukung `#berita/<index>` dan slug. UUID adalah basis mapping yang benar; index tidak stabil. Backfill/clean URL harus mempertahankan alias yang disepakati.
6. **Slug satu yang ada:** pertahankan slug `merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga`.
7. Tidak ada backfill, perubahan schema/index, aplikasi, database, deployment, commit, push, atau deploy pada tahap ini.

## G. Akses yang dibutuhkan dan persetujuan owner

Untuk melengkapi audit read-only tanpa melewati RLS, mohon owner/admin menyediakan salah satu metode yang disetujui berikut:

- Jalankan sendiri query/export **SELECT-only** di Supabase SQL Editor sebagai operator yang memang berwenang, lalu berikan hasil yang telah dibatasi ke field yang diperlukan; atau
- Sediakan mekanisme sementara, read-only, yang secara eksplisit diotorisasi dan hanya dapat membaca `content_items` berita semua status, dengan RLS/policy tetap menjadi kontrol akses; atau
- Berikan ekspor CSV/JSON berwenang dengan field: `id`, `data->>'judul'`, `published`, `data->>'slug'`, `data->>'foto'`, `created_at`, `updated_at`, untuk seluruh `type='berita'`.

Jangan mengirim password, service-role key, access token, atau secret. Jika memakai export, pastikan isinya hanya kolom yang diperlukan dan semua status memang tercakup. Setelah data diberikan melalui jalur yang disetujui, audit dapat dilanjutkan read-only untuk menghitung status, menjalankan pengecekan duplicate/case-insensitive/format/collision global, dan menghasilkan mapping final berbasis UUID.

Persetujuan owner masih dibutuhkan untuk slug kandidat (terutama kandidat 97 karakter dan apostrof pada judul Ijtima'), kebijakan permanensi slug, serta langkah backfill berikutnya. Laporan ini sendiri tidak mengotorisasi backfill.

---

**Status akhir:** PHASE 2B tidak dapat dinyatakan lengkap untuk inventaris final; menunggu data baca penuh yang sah. Tidak ada tindakan untuk mengatasi RLS yang dilakukan.
