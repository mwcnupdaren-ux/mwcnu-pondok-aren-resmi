---
name: mwcnu-pondok-aren
description: Standar pengembangan resmi website MWCNU Pondok Aren. Gunakan saat melakukan analisis, audit, pengembangan frontend, pengelolaan CMS, pekerjaan backend, pengujian, pemeliharaan, dan perubahan repository proyek MWCNU Pondok Aren.
---

# MWCNU Pondok Aren Development Skill

## 1. Identitas dan tujuan

Skill ini merupakan standar pengembangan resmi proyek website MWCNU Pondok Aren.

Tujuannya:
- Menjaga kestabilan dan kesinambungan proyek.
- Menyeragamkan cara kerja seluruh AI Agent.
- Melindungi fitur, data, keamanan, dan identitas visual.
- Mencegah perubahan di luar ruang lingkup pekerjaan.
- Memastikan setiap perubahan memiliki bukti pengujian.
- Menjaga dokumentasi tetap sesuai kondisi repository aktual.

Skill ini berlaku untuk Claude Code, Cline, OpenCode, Gemini, dan Agent lain yang telah diintegrasikan.

## 2. Prinsip sumber aturan

Dokumen ini merupakan pintu masuk menuju satu standar utama MWCNU.

Seluruh aturan teknis terperinci disimpan dalam direktori `references/`.

Jangan membuat sumber aturan utama kedua atau menyalin seluruh isi Master Skill ke konfigurasi setiap Agent.

Instruksi khusus Agent hanya berfungsi sebagai adapter menuju standar utama.

## 3. Kewajiban membaca referensi

Sebelum bekerja, Agent wajib:

1. Membaca instruksi proyek yang berlaku.
2. Memahami permintaan dan batas ruang lingkup.
3. Memeriksa kondisi repository aktual.
4. Membaca referensi yang berkaitan dengan pekerjaan.
5. Mengidentifikasi komponen yang berpotensi terdampak.
6. Menyampaikan konflik atau informasi yang belum dapat diverifikasi.

Gunakan referensi sesuai kebutuhan:

| Jenis pekerjaan | Referensi |
|---|---|
| Memahami proyek | `01-project-baseline.md` |
| Mengubah fitur atau modul | `02-protected-components.md` |
| Mengubah tampilan | `03-design-system.md` |
| Mengubah HTML, CSS, JavaScript | `04-frontend-engineering.md` |
| Mengubah berita atau CMS | `05-cms-data-integrity.md` |
| Mengubah Supabase/backend | `06-backend-security.md` |
| Melakukan pengujian | `07-testing-and-qa.md` |
| Melakukan pekerjaan Git | `08-git-and-deployment.md` |
| Menangani regresi | `09-recovery-procedures.md` |
| Menjalankan workflow | `10-agent-workflow.md` |

Jika referensi yang diperlukan belum tersedia, jangan mengarang aturannya.

## 4. Hierarki kewenangan

Urutan prioritas:

1. Keamanan, perlindungan data, dan batas tindakan yang telah diotorisasi.
2. Master Skill MWCNU dan aturan proyek yang berlaku.
3. Dokumen referensi teknis (`references/`).
4. Instruksi adapter khusus Agent (penghubung ke Master Skill, tanpa aturan tandingan).
5. Instruksi khusus pekerjaan atau penugasan dari pengguna.

Instruksi pekerjaan boleh mempersempit ruang lingkup, tetapi tidak boleh menjadi alasan untuk mengabaikan keamanan atau standar utama proyek.

Jika terdapat konflik, Agent wajib berhenti pada bagian yang terdampak dan melaporkan konflik tersebut.

## 5. Aturan dasar sebelum perubahan

Sebelum mengubah kode:

- Periksa branch aktif.
- Periksa SHA HEAD.
- Periksa remote dan status sinkronisasi.
- Periksa working tree.
- Identifikasi perubahan staged, unstaged, dan untracked.
- Baca implementasi yang sudah ada.
- Pastikan file yang akan diubah termasuk ruang lingkup.

Jangan menganggap laporan pekerjaan terdahulu sebagai bukti kondisi repository saat ini.

Jangan menghapus, menimpa, atau mengabaikan perubahan pengguna yang belum teridentifikasi.

## 6. Kebijakan ruang lingkup

Agent hanya boleh mengubah bagian yang diperlukan untuk menyelesaikan pekerjaan.

Dilarang melakukan:
- Refactor besar tanpa kebutuhan yang jelas.
- Perubahan file di luar ruang lingkup tanpa izin.
- Penggantian arsitektur yang sudah berjalan tanpa analisis dampak.
- Penghapusan fitur atau aset yang masih digunakan.
- Perubahan kontrak API tanpa pemeriksaan kompatibilitas.
- Perubahan database atau konfigurasi produksi tanpa otorisasi.

Jika ditemukan masalah tambahan di luar ruang lingkup, dokumentasikan sebagai temuan terpisah.

Jangan langsung memperbaikinya.

## 7. Kebijakan otomatisasi: Balanced

### Boleh dilanjutkan otomatis

- Membaca dan menganalisis kode.
- Audit read-only.
- Perbaikan rutin yang sudah termasuk ruang lingkup.
- Pemeriksaan sintaks.
- Pengujian lokal.
- Pemeriksaan regresi.
- Perbaikan kesalahan yang muncul akibat perubahan dalam ruang lingkup.
- Melanjutkan tahapan rutin yang telah disepakati.

### Memerlukan izin eksplisit

- Mengubah file di luar ruang lingkup.
- Mengubah SQL atau struktur database.
- Mengubah RLS, autentikasi, atau kebijakan keamanan.
- Mengubah Edge Functions yang tidak termasuk ruang lingkup.
- Menghapus data atau aset penting.
- Mengubah konfigurasi produksi.
- Commit, push ke remote, pembuatan tag, dan deployment (memerlukan izin eksplisit dari pengguna; mode Balanced bukan izin umum untuk commit).
- Tindakan lain yang berisiko dan tidak tercakup dalam otorisasi sebelumnya.

Izin untuk satu pekerjaan tidak otomatis berlaku untuk pekerjaan lain.

## 8. Standar kualitas implementasi

Setiap perubahan harus:
- Menggunakan implementasi yang sudah ada jika masih sesuai.
- Menghindari duplikasi fungsi, event listener, loader, dan CSS.
- Mempertahankan kompatibilitas fitur yang tidak sedang dikerjakan.
- Memperhatikan desktop, tablet, dan mobile.
- Menjaga integritas data.
- Memiliki penanganan kondisi kosong dan kegagalan.
- Tidak menghasilkan data atau konten palsu.
- Tidak menampilkan secret, token, atau kredensial.

Jangan mengklaim suatu fitur telah berfungsi hanya karena kode berhasil dikompilasi.

## 9. Standar pengujian

Pengujian harus sesuai dengan risiko dan jenis perubahan.

Contoh:
- JavaScript: pemeriksaan sintaks dan perilaku fungsi.
- CSS: tampilan desktop dan mobile.
- Routing: akses langsung, navigasi, dan refresh.
- CMS: data kosong, data valid, cache, dan pembaruan remote.
- Backend: validasi keamanan sesuai ruang lingkup dan otorisasi.

Bedakan dengan jelas:
- Pemeriksaan statis.
- Simulasi.
- Pengujian lokal.
- Pengujian browser nyata.
- Pengujian produksi.

Jangan mengklaim pengujian yang tidak benar-benar dilakukan.

## 10. Standar Git

- Gunakan staging selektif.
- Periksa diff sebelum commit.
- Pastikan tidak ada file asing yang ikut masuk.
- Jangan menjalankan `git add .` secara sembarangan.
- Jangan menghapus perubahan pengguna.
- Jangan melakukan reset atau operasi destruktif tanpa izin.
- Commit hanya boleh dilakukan jika ada izin atau permintaan eksplisit dari pengguna.
- Commit harus memiliki pesan yang menjelaskan tujuan perubahan.
- Push dan deployment mengikuti otorisasi eksplisit.

Lihat `08-git-and-deployment.md` untuk prosedur lengkap.

## 11. Penanganan kegagalan dan regresi

Jika perubahan menyebabkan regresi:

1. Hentikan penambahan perubahan baru.
2. Identifikasi perubahan yang menyebabkan masalah.
3. Bandingkan dengan kondisi sebelum perubahan.
4. Pulihkan hanya bagian yang terdampak.
5. Pertahankan perubahan pengguna lainnya.
6. Ulangi pengujian.
7. Laporkan penyebab dan hasil pemulihan.

Jangan menutupi kegagalan atau melaporkan keberhasilan sebelum pemulihan diverifikasi.

## 12. Standar laporan Agent

Setiap pekerjaan harus menghasilkan laporan yang mencakup:

1. Tujuan pekerjaan.
2. Baseline Git.
3. File yang diperiksa.
4. File yang diubah.
5. Ringkasan perubahan.
6. Pengujian yang benar-benar dijalankan.
7. Hasil pengujian.
8. Masalah yang ditemukan.
9. Status Git akhir.
10. Tindakan yang belum dilakukan.

Jika pekerjaan dihentikan, jelaskan penyebab dan kondisi repository terakhir.

## 13. Pemeliharaan Master Skill

Master Skill hanya boleh diperbarui melalui pekerjaan dokumentasi yang secara khusus mencakup pembaruan standar proyek.

Setiap perubahan harus:
- Memiliki alasan.
- Mempertahankan konsistensi seluruh referensi.
- Tidak menghapus aturan aktif tanpa keputusan yang jelas.
- Memisahkan aturan aktif dari catatan historis.
- Diperiksa terhadap adapter seluruh Agent.

Agent tidak boleh mengubah standar utama secara sepihak saat mengerjakan fitur aplikasi.

## 14. Prinsip akhir

Stabilitas proyek lebih penting daripada banyaknya perubahan.

Utamakan:
- Perubahan sekecil yang diperlukan.
- Bukti dibanding asumsi.
- Keamanan dibanding kecepatan.
- Konsistensi dibanding preferensi pribadi Agent.
- Pemeliharaan jangka panjang dibanding solusi sementara.

Setiap Agent bekerja sebagai pelaksana standar MWCNU, bukan pembuat standar baru secara sepihak.
