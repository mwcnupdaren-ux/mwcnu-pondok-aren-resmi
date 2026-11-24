# 10. Agent Workflow

## 1. Tujuan

Dokumen ini menetapkan standar alur kerja bagi seluruh AI Agent yang digunakan untuk mengembangkan dan memelihara website MWCNU Pondok Aren.

Tujuannya:
- Menyatukan pola kerja antar-Agent.
- Mencegah perbedaan interpretasi aturan proyek.
- Menjaga konsistensi kualitas kode.
- Menghindari perubahan di luar ruang lingkup.
- Mempermudah perpindahan pekerjaan antar-Agent.
- Mengurangi pengulangan audit yang tidak diperlukan.

## 2. Agent yang Didukung

Standar ini berlaku untuk:

1. Claude Code.
2. Cline.
3. OpenCode.
4. Gemini.
5. Agent lain yang berjalan di VS Code dan mampu mengikuti instruksi berbasis Markdown atau mekanisme Skill yang kompatibel.

Dukungan terhadap masing-masing Agent harus diverifikasi berdasarkan dokumentasi resmi dan kemampuan aktual versi yang digunakan.

Jangan menganggap seluruh Agent memiliki mekanisme pemanggilan Skill, lokasi konfigurasi, atau format instruksi yang sama.

## 3. Sumber Aturan Utama

Seluruh Agent wajib mengikuti hierarki berikut:

1. Keamanan, perlindungan data, dan batas tindakan yang telah diotorisasi.
2. `SKILL.md` sebagai Master Skill dan aturan proyek yang berlaku.
3. Dokumen dalam folder `references/` sebagai referensi teknis.
4. Instruksi adapter khusus Agent (hanya penghubung ke Master Skill, tanpa aturan tandingan).
5. Instruksi khusus pekerjaan atau prompt pelaksanaan dari pengguna.

Ketentuan:

- Master Skill merupakan satu-satunya sumber utama aturan proyek.
- Dokumen references menjadi penjelasan teknis dan operasional.
- Adapter Agent hanya menghubungkan Agent dengan Master Skill.
- Adapter tidak boleh membuat aturan tandingan.
- Instruksi pengguna boleh mempersempit ruang lingkup, tetapi tidak boleh menjadi alasan untuk mengabaikan keamanan atau standar utama.
- Jika terdapat konflik, Agent harus berhenti dan melaporkan konflik tersebut.

Instruksi adapter tidak boleh mengurangi perlindungan yang ditetapkan Master Skill.

## 4. Persiapan Sebelum Bekerja

Setiap Agent wajib:

1. Memastikan repository yang sedang dibuka adalah repository MWCNU Pondok Aren.
2. Membaca Master Skill.
3. Membaca references yang relevan dengan pekerjaan.
4. Memeriksa branch aktif.
5. Memeriksa HEAD dan status working tree.
6. Memeriksa perubahan lokal yang sudah ada.
7. Memahami ruang lingkup dan batasan tugas.

Jangan menggunakan informasi dari sesi Agent sebelumnya sebagai pengganti pemeriksaan repository aktual.

Jika Agent tidak dapat membaca Master Skill atau references, Agent harus menyampaikan keterbatasan tersebut. Jangan berpura-pura telah membaca aturan yang tidak tersedia.

## 5. Alur Kerja Standar

Semua Agent mengikuti urutan kerja berikut.

### Tahap A: Memahami Tugas

- Identifikasi tujuan pekerjaan.
- Identifikasi halaman, modul, atau fungsi yang terpengaruh.
- Tentukan hasil akhir yang diharapkan.
- Identifikasi batasan yang diberikan pengguna.

### Tahap B: Pemeriksaan Repository

- Periksa struktur file aktual.
- Periksa kode yang berkaitan dengan tugas.
- Periksa dependensi antarfile.
- Periksa kondisi Git.
- Identifikasi risiko regresi.

### Tahap C: Menentukan Ruang Lingkup

Kelompokkan pekerjaan menjadi:

- Diizinkan: perubahan yang secara jelas termasuk tugas.
- Dibatasi: perubahan yang membutuhkan konfirmasi atau keputusan tambahan.
- Dilarang: perubahan di luar kewenangan tugas.

Jangan memperluas ruang lingkup hanya karena menemukan peluang refactor.

### Tahap D: Perencanaan

Sebelum mengubah kode:

- Tentukan file yang perlu diubah.
- Jelaskan alasan perubahan.
- Pilih solusi paling minimal.
- Tentukan pengujian yang relevan.
- Identifikasi risiko terhadap modul lain.

Untuk pekerjaan sederhana dan berisiko rendah, perencanaan dapat dilakukan secara ringkas tanpa laporan panjang.

### Tahap E: Implementasi

- Ubah hanya file yang diperlukan.
- Pertahankan pola arsitektur yang sudah berjalan.
- Hindari duplikasi fungsi.
- Hindari refactor besar tanpa kebutuhan.
- Jangan mengubah kontrak antarmodul secara diam-diam.
- Jangan menghapus perubahan pengguna.

### Tahap F: Pengujian

Jalankan pemeriksaan sesuai risiko dan jenis perubahan.

Contohnya:
- Syntax check.
- Pemeriksaan format dan diff.
- Pengujian fungsi.
- Browser testing.
- Responsive testing.
- Regression testing.
- Security testing jika berkaitan dengan keamanan.

Pengujian yang tidak dapat dijalankan harus dilaporkan secara terbuka.

### Tahap G: Pemeriksaan Akhir

Periksa:

- File yang berubah.
- Kesesuaian perubahan dengan ruang lingkup.
- Hasil pengujian.
- Potensi regresi.
- Perubahan Git.
- Apakah ada pekerjaan yang belum selesai.

### Tahap H: Pelaporan

Agent harus menyampaikan hasil secara ringkas, jelas, dan berdasarkan bukti aktual.

## 6. Kebijakan Otomatisasi Balanced

Seluruh Agent menggunakan pendekatan otomatisasi Balanced.

### Boleh dilanjutkan tanpa persetujuan berulang

Untuk pekerjaan rutin yang sudah jelas ruang lingkupnya:

- Membaca dan menganalisis kode.
- Audit dalam batas tugas.
- Perbaikan kode yang telah disetujui.
- Pengujian lokal.
- Perbaikan kesalahan yang ditemukan selama pengujian.
- Pemeriksaan ulang hasil implementasi.
- Penyusunan laporan.

Agent tidak perlu meminta persetujuan berulang untuk setiap langkah rutin tersebut.

### Harus meminta persetujuan eksplisit

- Perubahan database atau SQL.
- Perubahan RLS, autentikasi, atau otorisasi.
- Perubahan Edge Functions produksi.
- Pengelolaan secret dan kredensial.
- Operasi yang berpotensi menghapus data.
- Perubahan di luar ruang lingkup yang disepakati.
- Commit, push, tag, dan deployment jika belum diizinkan secara eksplisit oleh pengguna.
- Operasi Git destruktif.
- Tindakan yang dapat memengaruhi layanan produksi.

Jika pengguna telah memberikan izin eksplisit untuk suatu tindakan, Agent boleh menjalankannya dalam batas izin tersebut. Preferensi otomatisasi Balanced tidak dianggap sebagai izin umum untuk melakukan commit.

Persetujuan untuk satu tindakan tidak otomatis menjadi persetujuan untuk tindakan lain.

## 7. Penggunaan Tools

Agent boleh menggunakan tools yang tersedia dan sesuai kebutuhan, seperti:

- Terminal.
- Editor kode.
- Browser.
- Browser automation.
- Test runner.
- Git.
- Pemeriksaan jaringan.
- Integrasi Supabase.

Ketentuan:

1. Gunakan tools yang benar-benar tersedia.
2. Jangan mengarang nama perintah atau kemampuan tools.
3. Jangan mengklaim pengujian berhasil jika tidak dijalankan.
4. Jangan mencetak secret, token, atau kredensial.
5. Jangan menjalankan perintah destruktif tanpa izin.
6. Jangan mengakses sistem produksi di luar kebutuhan dan kewenangan.

Jika kemampuan suatu Agent berbeda, gunakan alternatif yang tersedia tanpa mengurangi standar keselamatan.

## 8. Koordinasi Antar-Agent

Ketika pekerjaan berpindah dari satu Agent ke Agent lain, Agent sebelumnya harus memberikan informasi berikut:

- Tujuan pekerjaan.
- Branch aktif.
- SHA HEAD terakhir yang diperiksa.
- Status working tree.
- File yang telah diubah.
- Perubahan yang sudah selesai.
- Pengujian yang telah dijalankan.
- Hasil pengujian.
- Masalah yang belum diselesaikan.
- Batasan pekerjaan berikutnya.

Agent penerima wajib memeriksa ulang kondisi repository sebelum melanjutkan.

### Pencegahan konflik

- Hindari dua Agent mengedit file yang sama secara bersamaan.
- Jangan menimpa perubahan Agent lain tanpa pemeriksaan.
- Jangan menganggap hasil Agent sebelumnya selalu benar.
- Gunakan hasil pemeriksaan aktual sebagai dasar keputusan.

Jika terjadi konflik, hentikan perubahan pada bagian terkait dan selesaikan konflik terlebih dahulu.

## 9. Pengelolaan Konteks

Setiap Agent harus menjaga kesinambungan pekerjaan tanpa bergantung sepenuhnya pada riwayat percakapan.

Ketentuan:

- Baca file proyek yang relevan.
- Periksa kondisi repository terkini.
- Gunakan laporan fase sebelumnya sebagai referensi, bukan bukti kondisi aktual.
- Jangan menghidupkan kembali keputusan lama yang sudah diganti.
- Jangan mengasumsikan file masih ada hanya karena pernah disebut dalam percakapan.
- Jangan mengembalikan aset yang sengaja dihapus pengguna.

Jika konteks tidak cukup, lakukan pemeriksaan atau ajukan satu pertanyaan yang benar-benar diperlukan.

## 10. Format Instruksi Pekerjaan

Prompt pekerjaan sebaiknya mencantumkan:

1. Nama fase atau tugas.
2. Tujuan.
3. Ruang lingkup.
4. File yang boleh diubah, jika sudah diketahui.
5. File atau area yang dilarang diubah.
6. Tindakan yang diizinkan.
7. Tindakan yang membutuhkan persetujuan.
8. Pengujian yang wajib dilakukan.
9. Kriteria keberhasilan.
10. Format laporan hasil.

Agent tetap wajib memeriksa repository aktual. Daftar file dalam prompt bukan alasan untuk mengabaikan dependensi atau perubahan lokal.

Jika ditemukan kebutuhan perubahan di luar ruang lingkup, Agent harus melaporkannya terlebih dahulu.

## 11. Adapter Khusus Agent

Adapter diperlukan jika Agent memiliki mekanisme instruksi atau pemanggilan Skill yang berbeda.

Contoh mekanisme yang dapat diperiksa:

- `AGENTS.md` atau instruksi tingkat repository.
- `CLAUDE.md` atau konfigurasi Claude Code.
- `.clinerules` atau konfigurasi Cline.
- Konfigurasi proyek OpenCode.
- `GEMINI.md` atau mekanisme instruksi Gemini.

Daftar tersebut hanya contoh lokasi atau format yang perlu diperiksa, bukan jaminan dukungan resmi.

Ketentuan integrasi:

1. Periksa dokumentasi resmi Agent.
2. Periksa versi Agent yang digunakan.
3. Pastikan mekanisme discovery benar-benar didukung.
4. Hubungkan adapter ke Master Skill.
5. Hindari menyalin seluruh isi Master Skill ke adapter.
6. Uji apakah Agent benar-benar membaca instruksi.
7. Dokumentasikan hasil verifikasi.

Jika Agent tidak mendukung pemanggilan Skill secara otomatis, Master Skill dapat dipanggil secara eksplisit melalui instruksi pengguna atau mekanisme yang memang didukung.

## 12. Pemeliharaan Skill

Ketika standar proyek berubah:

- Perbarui Master Skill jika prinsip utama berubah.
- Perbarui references yang terdampak.
- Periksa konflik antar dokumen.
- Perbarui adapter hanya jika diperlukan.
- Pastikan tidak ada aturan lama yang bertentangan.
- Catat perubahan penting.

Jangan membuat salinan aturan yang sama di banyak tempat.

Master Skill dan references harus tetap menjadi sumber kebenaran utama.

## 13. Kriteria Keberhasilan Agent

Pekerjaan dianggap selesai apabila:

- Tujuan tugas tercapai.
- Ruang lingkup dipatuhi.
- Perubahan tidak merusak fungsi yang dilindungi.
- Pengujian relevan telah dijalankan.
- Hasil pemeriksaan dilaporkan secara jujur.
- Tidak ada perubahan tersembunyi di luar tugas.
- Kondisi Git dijelaskan dengan benar.
- Tindakan yang membutuhkan persetujuan tidak dilakukan tanpa izin.

Jika sebagian pekerjaan belum selesai, Agent harus menyebutkan bagian tersebut secara jelas.

## 14. Format Laporan Standar

Setiap Agent menggunakan format laporan berikut:

### LAPORAN [NAMA FASE]

**1. Status**
- Selesai / Sebagian / Gagal.

**2. Kondisi Repository**
- Branch.
- HEAD.
- Status working tree.

**3. Perubahan**
- File yang diubah.
- Ringkasan perubahan.

**4. Pengujian**
- Pemeriksaan yang dijalankan.
- Hasil aktual.
- Pengujian yang belum dilakukan.

**5. Risiko dan Catatan**
- Regresi atau masalah yang ditemukan.
- Batasan yang masih berlaku.

**6. Git**
- Staging.
- Commit.
- Push.
- Deployment.

Sebutkan setiap tindakan sesuai kondisi aktual. Jangan menyatakan commit, push, atau deployment berhasil jika belum dilakukan.

## 15. Prinsip Akhir

Semua Agent boleh berbeda dalam cara bekerja, tetapi tidak boleh berbeda dalam standar proyek.

**Satu Master Skill. Satu standar kerja. Banyak Agent.**

Prioritas utama adalah menjaga stabilitas website MWCNU Pondok Aren, melindungi data dan fungsi yang sudah berjalan, serta menghasilkan perubahan yang terukur dan dapat diverifikasi.