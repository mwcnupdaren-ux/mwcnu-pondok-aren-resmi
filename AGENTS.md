# AGENTS.md - MWCNU Pondok Aren

Dokumen ini merupakan adapter utama untuk OpenCode, Cline, dan AI Agent lain yang membaca `AGENTS.md`.

## Instruksi Wajib

1. **Baca Master Skill:**
   Agent wajib membaca Master Skill proyek sebelum melakukan analisis atau pekerjaan di repository ini:
   - `agents/skills/mwcnu-pondok-aren/SKILL.md`

2. **Baca Referensi yang Relevan:**
   Pelajari dokumen teknis yang berkaitan dengan tugas di:
   - `agents/skills/mwcnu-pondok-aren/references/`

3. **Patuhi Seluruh Batasan & Kebijakan Proyek:**
   - Ikuti hierarki kewenangan: Keamanan & otorisasi > Master Skill (`SKILL.md`) > Dokumen referensi teknis (`references/`) > Adapter Agent > Instruksi penugasan pengguna.
   - Patuhi kebijakan ruang lingkup minimal, perlindungan komponen terproteksi, dan pencegahan regresi.
   - Patuhi kebijakan otomatisasi Balanced: dilarang melakukan commit, push ke remote, pembuatan tag, atau deployment tanpa izin eksplisit pengguna.

4. **Integritas Aturan:**
   - Dokumen ini murni adapter penghubung. Dilarang membuat aturan tandingan atau menduplikasi isi Master Skill.
   - Master Skill dan referensi teknisnya tetap menjadi satu-satunya sumber kebenaran utama.
