# 01 — MWCNU PROJECT BASELINE

## 1. Identitas Proyek

Nama proyek: Website Resmi MWCNU Pondok Aren

Domain produksi:
https://www.mwcnupondokaren.or.id/

Nama repository:
`mwcnu-pondok-aren-resmi`

Tujuan:
Menyediakan portal informasi dan layanan digital resmi MWCNU Pondok Aren, termasuk berita, agenda, informasi organisasi, laporan, dan layanan konsultasi agama.

Identitas visual:
- Menggunakan identitas Nahdlatul Ulama.
- Dominan hijau dengan penerapan yang profesional.
- Bersih, elegan, mudah dibaca, dan responsif.
- Mengutamakan konsistensi ant halaman dan perangkat.

## 2. Prinsip Baseline

Baseline adalah kondisi proyek yang benar-benar ada di repository, bukan asumsi berdasarkan dokumentasi atau percakapan lama.

Agent wajib memeriksa kondisi aktual sebelum melakukan perubahan.

Informasi historis dalam dokumen ini tidak boleh dianggap sebagai bukti bahwa konfigurasi tersebut masih aktif.

Jika kondisi repository berbeda, catat perbedaannya dan gunakan kondisi aktual sebagai acuan teknis.

## 3. Informasi Git yang Tercatat

Baseline historis terakhir yang dilaporkan setelah FASE 17E:

- Branch: `main`
- Commit lokal: `c2eb26aebcfa461ced83e19ecb6e7ea730a6d24d`
- Pesan commit: `fix(news): synchronize cached and remote article rendering`
- Baseline sebelumnya: `2416efb461aa317d8807463ffcada70187090b80`
- Working tree setelah commit: bersih.
- `origin/main` pada laporan FASE 17E masih berada di commit sebelumnya.

**Peringatan:** Informasi ini merupakan catatan historis. Sebelum pekerjaan Git, Agent wajib memeriksa HEAD, branch, remote, status working tree, dan hubungan commit aktual.

Jangan melakukan reset, rebase, force push, atau operasi destruktif hanya untuk menyamakan repository dengan catatan ini.

## 4. Arsitektur Umum

Website menggunakan pendekatan frontend berbasis HTML, CSS, dan JavaScript dengan integrasi layanan Supabase.

Komponen utama yang perlu dikenali:

- `index.html`: entry point website.
- `css/`: stylesheet dan sistem tampilan.
- `js/`: logika frontend, pemuatan data, routing, dan interaksi.
- `assets/`: gambar, ikon, dan aset visual.
- `supabase/`: konfigurasi, fungsi, dan dokumentasi backend apabila tersedia.

Daftar tersebut merupakan gambaran tingkat atas. Agent harus memeriksa struktur direktori aktual sebelum mengasumsikan nama, fungsi, atau keberadaan file tertentu.

Jangan membuat ulang arsitektur hanya karena menemukan struktur yang berbeda dari gambaran ini.

## 5. Teknologi dan Layanan

Teknologi yang tercatat dalam riwayat proyek:

- HTML.
- CSS.
- JavaScript.
- Supabase sebagai layanan backend dan penyimpanan data.
- Vercel sebagai platform hosting yang pernah digunakan.

Informasi konfigurasi historis:
- Supabase project reference: `wvfcifqolohfipvepxss`.
- Domain utama: `www.mwcnupondokaren.or.id`.

Agent wajib memverifikasi konfigurasi aktual melalui file proyek yang relevan.

Jangan menampilkan API secret, access token, password, service role key, atau kredensial lainnya dalam laporan.

Jangan menganggap seluruh layanan dan konfigurasi historis masih aktif tanpa pemeriksaan.

## 6. Modul dan Area Fungsional

Area fungsional yang tercatat dalam proyek:

1. Beranda.
2. Berita.
3. Detail artikel.
4. Agenda kegiatan.
5. Informasi organisasi.
6. Laporan keuangan atau kas.
7. Konsultasi Agama.
8. Dashboard dan fungsi administrasi yang tersedia.

Tidak semua area harus memiliki halaman atau implementasi terpisah.

Agent wajib menelusuri routing, entry point, data CMS, dan implementasi aktual sebelum mengubah suatu modul.

## 7. Standar Pengelolaan Data

Data yang berasal dari CMS atau Supabase harus diperlakukan sebagai sumber informasi utama.

Aturan:
- Jangan membuat data berita atau agenda fiktif.
- Jangan mengarang nilai laporan keuangan.
- Jangan mengganti gambar artikel dengan gambar Hero.
- Data kosong harus ditangani secara eksplisit.
- Data cache dan data remote harus memiliki mekanisme sinkronisasi yang benar.
- Jangan menghapus cache valid hanya karena permintaan remote gagal.
- Perubahan struktur data harus mempertimbangkan kompatibilitas frontend dan backend.

Untuk aturan terperinci, baca `05-cms-data-integrity.md`.

## 8. Standar Frontend

Frontend harus mempertahankan:
- Responsivitas desktop dan mobile.
- Navigasi dan routing yang sudah digunakan.
- Konsistensi tampilan.
- Kinerja pemuatan halaman.
- Mekanisme cache dan pembaruan data.
- Penanganan kegagalan jaringan.
- Kompatibilitas antarmodul.

Sebelum membuat fungsi baru, periksa apakah fungsi yang dibutuhkan sudah tersedia.

Hindari:
- Duplikasi event listener.
- Duplikasi loader.
- CSS yang saling menimpa.
- Reload halaman sebagai solusi sementara tanpa analisis.
- Manipulasi DOM yang merusak komponen lain.

Lihat `04-frontend-engineering.md`.

## 9. Batas Backend

Backend menggunakan Supabase dalam arsitektur proyek.

Area yang memerlukan perhatian khusus:
- Database dan skema.
- Row Level Security.
- Edge Functions.
- Autentikasi.
- Penyimpanan file.
- Pengelolaan secret.
- Validasi akses publik dan staf.

Jangan mengubah backend hanya untuk menyelesaikan masalah frontend apabila tidak diperlukan.

Perubahan database, SQL, RLS, autentikasi, dan Edge Functions mengikuti izin eksplisit pengguna.

Lihat `06-backend-security.md`.

## 10. Lingkungan Pengembangan

Pengembangan dilakukan menggunakan repository Git dan editor VS Code dengan bantuan AI Agent.

Agent yang menjadi target integrasi:
- Claude Code.
- Cline.
- OpenCode.
- Gemini.
- VS Code Agent lainnya yang kompatibel.

Semua Agent wajib mengikuti Master Skill yang sama.

Perbedaan mekanisme integrasi tidak boleh menghasilkan perbedaan standar proyek.

## 11. Aturan Verifikasi Baseline

Sebelum pekerjaan dimulai, Agent harus memeriksa:

1. Lokasi repository.
2. Branch aktif.
3. SHA HEAD.
4. Remote yang digunakan.
5. Status sinkronisasi lokal dan remote.
6. Working tree.
7. File instruksi Agent.
8. Struktur direktori aktual.
9. File yang berkaitan dengan pekerjaan.
10. Ketergantungan antarmodul yang mungkin terdampak.

Hasil pemeriksaan harus menjadi dasar rencana kerja.

## 12. Pemeliharaan Dokumen

Dokumen ini diperbarui hanya ketika terdapat perubahan nyata pada:
- Arsitektur proyek.
- Teknologi utama.
- Struktur direktori.
- Domain atau layanan utama.
- Baseline pengembangan.
- Modul fungsional utama.

Jangan memperbarui baseline hanya karena perubahan kecil pada satu fitur.

Catatan historis harus diberi label historis dan tidak boleh disamakan dengan kondisi aktual.

## 13. Prinsip Penutup

Agent harus memahami proyek yang benar-benar ada sebelum melakukan perubahan.

Jangan membangun berdasarkan dugaan.
Jangan mengubah arsitektur tanpa alasan.
Jangan menganggap kondisi lama masih berlaku.
Jangan mengorbankan stabilitas demi perubahan yang tidak diperlukan.

**Baseline aktual adalah acuan teknis. Master Skill adalah acuan cara bekerja.**