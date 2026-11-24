# PHASE 2D — EDITORIAL SLUG MAPPING & COLLISION VALIDATION

**Status:** WAITING FOR OWNER APPROVAL  
**Worktree:** `mwcnu-meta-worktree`  
**Source:** `PHASE-2C-SOURCE-EXPORT-NORMALIZED.json`

## Fakta Teknis (tervalidasi)

- 13 record artikel, 13 UUID valid dan unik.
- Semua field wajib (id, type, judul, published, slug, foto, created_at, updated_at) lengkap.
- 12 record memiliki slug null; 1 record (d13af14b-...) memiliki slug existing.
- Slug existing dipertahankan persis tanpa perubahan.
- Semua kandidat slug lolos regex `^[a-z0-9]+(-[a-z0-9]+)*$`, lowercase ASCII, panjang <=100.
- Tidak ada collision antar-13 kandidat (case-insensitive).
- Tidak ada collision terhadap slug existing (hanya satu non-null).
- Konfirmasi: database_role postgres, total_berita 13, published 13, unpublished 0, status_null 0.

## Tabel Mapping UUID ke Slug

| UUID | Judul | Slug Existing | Kandidat Slug | Panjang | Catatan Editorial |
|---|---|---|---|---|---|
| 0acaecff-ff03-42f8-be7d-85ed63a5b983 | MWCNU Pondok Aren Gelar Lailatul Ijtima' dan Tawaqufan di Pondok Kacang Barat | (null) | mwcnu-pondok-aren-gelar-lailatul-ijtima-dan-tawaqufan-di-pondok-kacang-barat | 76 | Apostrof dihilangkan; istilah Lailatul Ijtima' dan Tawaqufan dipertahankan. |
| 92fd61e6-1364-4058-bf4e-f058c720fd84 | Halal Bi Halal Keluarga Besar NU Pondok Aren Angkat Tema Membumikan Dakwah dan Menguatkan Ranting | (null) | halal-bi-halal-keluarga-besar-nu-pondok-aren-membumikan-dakwah-menguatkan-ranting | 81 | Judul panjang; kata tema dihilangkan sebagai pengisi; makna inti dipertahankan. |
| ae6d9241-216e-40ab-b466-3f19399d53db | Launching QRIS, MWCNU Pondok Aren Melangkah Maju dari Koin NU | (null) | launching-qris-mwcnu-pondok-aren-melangkah-maju-dari-koin-nu | 60 | Singkatan/istilah QRIS dan NU dipertahankan. |
| e9a4b515-a16d-41bc-81bb-d310b936170d | Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur | (null) | turba-mwcnu-pondok-aren-di-prnu-jurangmangu-timur | 49 | Singkatan Turba dan PRNU dipertahankan. |
| b18c0158-672a-4ad9-b38e-7d222632c3a4 | KH Fathur Rahman: Tradisi dan Warisan Ulama Harus Terus Dilestarikan | (null) | kh-fathur-rahman-tradisi-dan-warisan-ulama-harus-terus-dilestarikan | 67 | Nama tokoh dan gelar KH dipertahankan. |
| eb978bd1-b4af-4817-b27e-7cc557ac5a71 | Sikapi Dinamika Nasional, PBNU dan PWNU Se-Indonesia Rilis 6 Pernyataan Sikap | (null) | pbnu-dan-pwnu-rilis-6-pernyataan-sikap-dinamika-nasional | 56 | Urutan disusun agar entitas PBNU/PWNU di depan; se-indonesia dihilangkan. |
| 91880c5c-623b-4aa0-812d-0912850027cd | MWCNU Pondok Aren Gelar Tarling di Musholla Al-Ikhwan, Kenalkan Prinsip Dasar NU | (null) | mwcnu-pondok-aren-gelar-tarling-di-musholla-al-ikhwan-kenalkan-prinsip-dasar-nu | 79 | Nama musholla dan istilah Tarling dipertahankan. |
| 599ca2da-df16-4f12-a91e-09ca498e471f | Pentingnya Menjaga Tradisi Aswaja di Era Modern: Pesan KH. M. Thoha | (null) | pentingnya-menjaga-tradisi-aswaja-di-era-modern-pesan-kh-m-thoha | 64 | Singkatan KH dan nama tokoh dipertahankan. |
| 99c61340-3f25-4fae-a471-a1f93f53cb34 | Menyiapkan Bekal Akhirat: Pesan KH. Ahmad Misbah di Pondok Aren | (null) | menyiapkan-bekal-akhirat-pesan-kh-ahmad-misbah-di-pondok-aren | 61 | Nama tokoh dan lokasi dipertahankan. |
| 20537a67-d5eb-42de-9c18-ab131d8be214 | Aksi Sosial GP Ansor-Banser Pondok Aren dan Griya Al Fath di Idul Adha | (null) | aksi-sosial-gp-ansor-banser-pondok-aren-dan-griya-al-fath-di-idul-adha | 70 | Ampersand menjadi dan; singkatan GP Ansor dan Banser dipertahankan. |
| c533df16-e18b-4afb-b59a-749ccac13959 | Menjaga Istiqomah: Pesan KH. Mohammad Jamil di Pondok Jaya Aren | (null) | menjaga-istiqomah-pesan-kh-mohammad-jamil-di-pondok-jaya-aren | 61 | Nama tokoh dan lokasi dipertahankan. |
| f13d845b-cfd0-47a1-b4b8-a2cf60670dd8 | PBNU Bantah Tegas Isu Aliran Dana Rp70 Miliar untuk Muktamar | (null) | pbnu-bantah-tegas-isu-aliran-dana-rp70-miliar-untuk-muktamar | 60 | Singkatan PBNU dan nominal Rp70 dipertahankan. |
| d13af14b-52e7-44fd-a503-514adb1b5ca6 | Merindukan Reuni di Surga 'Adn: Empat Bekal untuk Berkumpul Kembali Bersama Keluarga | (existing) | merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga | 82 | Slug existing dipertahankan persis; apostrof dihilangkan. |

## Rekomendasi Editorial

- Kandidat untuk judul Halal Bi Halal (81 karakter) mendekati batas namun masih <=100; dapat dipersingkat jika owner menginginkan slug lebih ringkas.
- Slug untuk Lailatul Ijtima' mempertahankan istilah kunci; apostrof dihilangkan sesuai regex.
- Semua kandidat bebas collision.

## Keputusan yang Membutuhkan Persetujuan Owner

- Persetujuan atas 12 kandidat slug (atau revisi editorial).
- Konfirmasi slug existing UUID d13af14b tetap dipertahankan.
- Keputusan apakah slug Halal Bi Halal perlu dipersingkat.

**Status akhir:** WAITING FOR OWNER APPROVAL
EOF
echo done