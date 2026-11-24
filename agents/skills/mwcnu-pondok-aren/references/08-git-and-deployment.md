# 08. GIT AND DEPLOYMENT
**Proyek:** Website Resmi MWCNU Pondok Aren  
**File:** `references/08-git-and-deployment.md`  
**Status:** Standar pengelolaan repository dan deployment

## 1. Tujuan

Dokumen ini mengatur seluruh aktivitas Git dan deployment dalam pengembangan website MWCNU Pondok Aren.

Cakupan:
- Pemeriksaan repository.
- Branch dan commit.
- Staging.
- Push dan pull.
- Sinkronisasi remote.
- Tag dan release.
- Deployment.
- Pemulihan perubahan.
- Perlindungan perubahan lokal pengguna.

Tujuan utamanya adalah menjaga riwayat perubahan tetap jelas, mencegah kehilangan pekerjaan, dan memastikan setiap perubahan dikirim ke lingkungan yang benar.

## 2. Prinsip Utama

Seluruh Agent wajib mengikuti prinsip:

1. **Inspect before Git operations:** periksa kondisi repository sebelum bertindak.
2. **Protect user changes:** jangan menghapus atau menimpa perubahan pengguna.
3. **Selective staging:** hanya stage file yang termasuk ruang lingkup.
4. **Traceable commits:** setiap commit harus memiliki tujuan yang jelas.
5. **Explicit push permission:** push memerlukan instruksi eksplisit.
6. **Separate deployment permission:** izin push bukan izin deployment.
7. **No destructive shortcuts:** hindari perintah Git destruktif.
8. **Accurate reporting:** laporkan SHA dan status aktual.

## 3. Pemeriksaan Awal Repository

Sebelum melakukan perubahan atau operasi Git, periksa:

```bash
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
git remote -v
git log -5 --oneline --decorate
```

Jika diperlukan, periksa juga:

```bash
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git ls-files --others --exclude-standard
```

Ketentuan:
- Pastikan repository yang aktif adalah repository proyek yang benar.
- Pastikan branch sesuai dengan ruang lingkup pekerjaan.
- Pastikan remote yang digunakan benar.
- Periksa perubahan staged, unstaged, dan untracked secara terpisah.
- Jangan mencetak isi file rahasia.
- Jangan menganggap working tree bersih tanpa pemeriksaan.

## 4. Catatan Baseline Historis

Catatan Git setelah FASE 17E:

- Branch: `main`
- Commit lokal: `c2eb26aebcfa461ced83e19ecb6e7ea730a6d24d`
- Baseline `origin/main` saat laporan FASE 17E: `2416efb461aa317d8807463ffcada70187090b80`
- Working tree saat laporan: bersih.
- Commit FASE 17E belum di-push.

**Penting:** Informasi ini merupakan catatan historis, bukan kondisi repository saat ini. Agent wajib memeriksa branch, HEAD, remote, dan working tree aktual sebelum melakukan tindakan apa pun.

Jangan menganggap commit tersebut masih menjadi HEAD atau masih berada di branch yang sama.

## 5. Perlindungan Perubahan Pengguna

Agent wajib melindungi:
- Perubahan yang belum di-commit.
- File untracked.
- File yang sudah di-stage pengguna.
- Pekerjaan dari Agent lain.
- Perubahan yang belum selesai diperiksa.

Dilarang:
- Menghapus perubahan pengguna tanpa izin.
- Menimpa file yang belum diperiksa.
- Menghapus file untracked hanya karena tidak dikenal.
- Mengubah staging pengguna secara sembarangan.
- Menganggap semua perubahan yang ada dibuat oleh Agent saat ini.

Jika ditemukan perubahan yang tidak berkaitan dengan pekerjaan, pertahankan dan laporkan.

## 6. Branch Management

- Gunakan branch yang sesuai dengan instruksi pekerjaan.
- Jangan berpindah branch tanpa alasan.
- Jangan membuat branch baru tanpa kebutuhan yang jelas.
- Jangan menghapus branch.
- Jangan melakukan merge tanpa memeriksa konflik dan dampaknya.
- Jangan mengubah riwayat branch bersama tanpa persetujuan.

Jika terdapat perbedaan antara branch lokal dan remote, identifikasi terlebih dahulu sebelum melanjutkan.

## 7. Staging

Staging harus dilakukan secara selektif.

Contoh:

```bash
git add index.html js/app.js js/content.js
```

Ketentuan:
- Stage hanya file yang memang termasuk ruang lingkup.
- Periksa kembali daftar file staged.
- Periksa staged diff sebelum commit.
- Jangan memasukkan file rahasia, build sementara, atau file tidak terkait.

Hindari:

```bash
git add .
git add -A
```

Perintah tersebut hanya boleh digunakan jika seluruh perubahan memang telah diperiksa dan pengguna secara eksplisit meminta staging menyeluruh.

## 8. Pemeriksaan Sebelum Commit

Sebelum commit, lakukan:

```bash
git status --short
git diff --cached --name-status
git diff --cached --stat
git diff --cached
git diff --cached --check
```

Pastikan:
- File yang di-stage benar.
- Tidak ada perubahan yang tidak dimaksudkan.
- Tidak ada secret.
- Tidak ada file sementara.
- Pengujian relevan telah dilakukan.
- Diff dapat dipahami dan sesuai ruang lingkup.

Jika terdapat perubahan yang tidak sesuai, jangan lanjutkan commit sebelum masalah diselesaikan.

## 9. Commit

Commit digunakan untuk menyimpan satu kelompok perubahan yang memiliki tujuan jelas.

Contoh format pesan:

```text
feat(news): improve article rendering
fix(ui): correct mobile layout
fix(cms): handle missing article images
docs(skill): add frontend engineering standards
```

Ketentuan:
- Gunakan pesan commit yang deskriptif.
- Hindari pesan seperti `update`, `fix`, atau `done` tanpa konteks.
- Jangan menggabungkan pekerjaan yang tidak berkaitan dalam satu commit.
- Jangan mengubah commit lama secara sembarangan.

**Otorisasi commit:**

- Jika pengguna secara eksplisit meminta commit untuk pekerjaan yang sedang dilakukan, Agent boleh melanjutkan setelah pemeriksaan lulus.
- Jika pengguna hanya meminta audit, analisis, atau perubahan kode tanpa meminta commit, jangan melakukan commit.
- Preferensi otomatisasi Balanced tidak dianggap sebagai izin umum untuk melakukan commit.

## 10. Push ke Remote

Push mengirim commit lokal ke repository remote.

Sebelum push:
1. Pastikan pengguna memberikan instruksi eksplisit.
2. Periksa branch aktif.
3. Verifikasi remote dan URL tujuan.
4. Jalankan fetch untuk mengetahui kondisi remote.
5. Periksa commit yang akan dikirim.
6. Pastikan tidak ada commit asing atau perubahan yang tidak dimaksudkan.
7. Pastikan branch tujuan benar.

Contoh pemeriksaan:

```bash
git fetch origin
git status --short --branch
git log --oneline origin/main..HEAD
```

Ketentuan:
- Jangan melakukan force push.
- Jangan push ke branch lain berdasarkan asumsi.
- Jangan mengganti remote secara sepihak.
- Jangan mengirim perubahan yang belum diperiksa.
- Jangan menganggap keberhasilan commit berarti push telah berhasil.

Jika terjadi penolakan push atau konflik remote, hentikan dan analisis penyebabnya. Jangan menggunakan force push sebagai jalan pintas.

## 11. Tag dan Release

Tag digunakan untuk menandai titik penting dalam riwayat proyek.

Ketentuan:
- Buat tag hanya jika diminta atau termasuk ruang lingkup yang disetujui.
- Pastikan tag menunjuk commit yang benar.
- Jangan menimpa atau menghapus tag tanpa izin.
- Gunakan nama tag yang konsisten dan deskriptif.
- Catat commit SHA yang ditandai.

## 12. Deployment

Deployment adalah tindakan terpisah dari commit dan push.

Sebelum deployment, pastikan:
- Pengguna memberikan izin eksplisit.
- Target environment diketahui.
- Project dan domain tujuan telah diverifikasi.
- Commit yang akan di-deploy telah diperiksa.
- Pengujian relevan telah lulus.
- Tidak ada perubahan lokal yang tertinggal dan tidak dimaksudkan.
- Tersedia prosedur pemulihan yang sesuai.

Ketentuan:
- Jangan deploy hanya karena push berhasil.
- Jangan menganggap preview deployment sama dengan production deployment.
- Jangan mengubah konfigurasi hosting tanpa izin.
- Jangan mengubah environment variable produksi tanpa izin.
- Jangan menganggap deployment selesai sebelum hasilnya diverifikasi.

Setelah deployment, periksa hasil sesuai kemampuan yang tersedia dan laporkan keterbatasannya.

## 13. Pemisahan Otorisasi

Otorisasi tindakan Git dan deployment harus dipisahkan.

| Tindakan | Ketentuan |
|---|---|
| Membaca status Git | Boleh dalam ruang lingkup pekerjaan |
| Memeriksa diff | Boleh dalam ruang lingkup pekerjaan |
| Mengubah file lokal | Mengikuti ruang lingkup tugas |
| Staging | Harus sesuai instruksi pekerjaan |
| Commit | Memerlukan instruksi commit |
| Push | Memerlukan izin eksplisit |
| Membuat atau menghapus tag | Memerlukan izin yang sesuai |
| Deployment preview | Memerlukan izin sesuai target |
| Deployment production | Memerlukan izin eksplisit |
| Mengubah konfigurasi production | Memerlukan izin eksplisit |

Persetujuan untuk satu tindakan tidak otomatis mengizinkan tindakan lainnya.

## 14. Perintah Git Berisiko

Jangan menjalankan perintah berikut tanpa persetujuan eksplisit dan analisis dampak:

```bash
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
git rebase
git branch -D
git tag -d
git checkout -- .
git restore .
```

Perintah tersebut dapat menghapus perubahan, mengubah riwayat, atau menghilangkan pekerjaan yang belum tersimpan.

Jika dibutuhkan prosedur pemulihan, utamakan cara yang mempertahankan perubahan pengguna.

## 15. Penanganan Konflik

Jika terjadi konflik:
1. Hentikan proses yang berpotensi menimpa perubahan.
2. Identifikasi file yang konflik.
3. Periksa perubahan dari kedua sisi.
4. Tentukan bagian yang harus dipertahankan.
5. Jangan menyelesaikan konflik berdasarkan asumsi.
6. Jalankan pengujian setelah resolusi.
7. Laporkan hasilnya.

Jangan menggunakan strategi merge yang otomatis mengabaikan salah satu sisi tanpa analisis.

## 16. Prosedur Pemulihan

Jika perubahan menyebabkan masalah:

- Identifikasi perubahan yang menjadi penyebab.
- Periksa commit dan diff terkait.
- Lindungi perubahan lokal yang belum tersimpan.
- Tentukan opsi pemulihan yang paling aman.
- Jangan langsung menggunakan `reset --hard`.
- Gunakan revert jika sesuai dan telah diizinkan.
- Verifikasi kondisi setelah pemulihan.

Pemulihan produksi harus mengikuti otorisasi deployment dan prosedur operasional yang berlaku.

## 17. Pelaporan Git dan Deployment

Setiap laporan harus mencakup:

### A. Repository
- Lokasi repository:
- Branch:
- HEAD awal:
- HEAD akhir:
- Remote:
- Status working tree:

### B. Perubahan
- File berubah:
- File staged:
- File untracked:
- Ringkasan diff:

### C. Commit
- Status commit:
- SHA lengkap:
- Pesan commit:

### D. Remote
- Status fetch:
- Status push:
- Branch tujuan:
- Commit yang terkirim:

### E. Deployment
- Status deployment:
- Environment:
- Commit yang di-deploy:
- Hasil verifikasi:
- Risiko atau keterbatasan:

Gunakan status yang akurat: belum dilakukan, berhasil, gagal, atau belum dapat diverifikasi.

Jangan menyatakan push atau deployment berhasil jika belum ada konfirmasi aktual.

## 18. Prinsip Akhir

Riwayat Git harus dapat ditelusuri, perubahan harus dapat dipertanggungjawabkan, dan deployment harus dilakukan secara terkendali.

**Commit menyimpan perubahan. Push membagikan perubahan. Deployment menerbitkan perubahan. Ketiganya adalah tindakan berbeda dengan otorisasi berbeda.**