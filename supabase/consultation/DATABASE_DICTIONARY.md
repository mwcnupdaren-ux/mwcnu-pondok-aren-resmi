# Data Dictionary — Modul Konsultasi Agama (Phase 1)

16 tabel, seluruhnya berprefix `consultation_`, RLS aktif, **tanpa policy** untuk
`anon`/`authenticated` (deny by default). Konvensi umum:
- `uuid` PK memakai `gen_random_uuid()`.
- `created_at`/`updated_at`/`at`/… bertipe `timestamptz`, zona waktu operasional WIB.
- Teks yang masuk kolom email dinormalisasi huruf kecil oleh trigger/fungsi.
- `t`` = trigger menegakkan aturan (lihat kolom "Penegakan").

---

## A. REFERENSI

### 1. `consultation_categories` — kategori pertanyaan
| Kolom | Tipe | Null | Default | Ketentuan |
|---|---|---|---|---|
| id | uuid | ✗ | gen_random_uuid() | PK |
| kode | text | ✗ | — | unik, `^[a-z0-9_]{2,40}$` |
| nama | text | ✗ | — | panjang trim 3–120 |
| deskripsi | text | ✓ | — | |
| sort | integer | ✗ | 0 | urutan tampil |
| aktif | boolean | ✗ | true | kategori non-aktif ditolak saat pengajuan tiket (t) |
| created_at | timestamptz | ✗ | now() | |

Dikelola admin konsultasi. Seed data = keputusan manusia (bukan bagian migrasi).

### 2. `consultation_holidays` — kalender libur (SLA)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| tanggal | date | ✗ | PK; tanggal libur nasional/kegiatan |
| keterangan | text | ✗ | default `''` |

Dipakai `consultation_add_workdays()` untuk menghitung tenggat hari kerja
(Senin–Jumat, WIB, minus tabel ini).

### 3. `consultation_staff_roles` — role konsultasi (TERPISAH dari role CMS)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| email | text | ✗ | PK; lowercase + pola email valid |
| role_konsultasi | text | ✗ | `admin_konsultasi` \| `konsultan` \| `reviewer` |
| aktif | boolean | ✗ | default true |
| catatan | text | ✓ | |
| dibuat_oleh | text | ✓ | email admin yang mendaftarkan |
| created_at / updated_at | timestamptz | ✗ | updated_at distempel trigger `consultation_touch()` |

Indeks unik tambahan `(email, role_konsultasi)` — dipakai FK komposit di tabel
penugasan/review agar hanya email ber-role tepat yang boleh ditunjuk.
Email di sini harus cocok dengan identitas Google staf di `auth.users`
(validasi dilakukan Edge Function, Phase 2).

### 4. `consultation_consultant_categories` — bidang yang boleh dikerjakan konsultan
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| konsultan_email | text | ✗ | PK (komposit) |
| role_tetap | text | ✗ | wajib `'konsultan'` (check) |
| kategori_id | uuid | ✗ | FK → categories, ON DELETE CASCADE |

FK komposit `(konsultan_email, role_tetap) → staff_roles(email, role_konsultasi)`
menjamin email benar-benar terdaftar ber-role konsultan; menghapus baris
staff_roles ikut menghapus pemetaannya. **Catatan**: penegakan kesesuaian
kategori saat penugasan tiket dilakukan Edge Function (Phase 2).

---

## B. TRANSAKSI

### 5. `consultation_tickets` — tiket konsultasi
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| nomor_tiket | text | ✗ | unik; otomatis `KON-YYMMDD-XXXXXX` (t), tidak boleh diubah (t) |
| kategori_id | uuid | ✗ | FK → categories, ON DELETE RESTRICT; kategori harus aktif saat insert (t) |
| judul | text | ✗ | trim 5–150 |
| isi_pertanyaan | text | ✗ | trim 10–10000 |
| status | text | ✗ | default `'baru'`; enum 9 status; transisi divalidasi (t) |
| status_sebelum_pause | text | ✓ | diisi/dikosongkan sistem saat pause (t) |
| sla_deadline | timestamptz | ✓ | dihitung sistem; perubahan manual ditolak (t) |
| sla_paused_at | timestamptz | ✓ | berisi saat status `menunggu_informasi` (t) |
| alasan_penolakan | text | ✓ | wajib diisi function saat `ditolak` (validasi Phase 2) |
| created_at | timestamptz | ✗ | tidak boleh diubah (t) |
| updated_at | timestamptz | ✗ | distempel trigger |

**Tidak memuat identitas pemohon** (ada di tabel kontak). Indeks:
`(status, sla_deadline)` parsial untuk status aktif, `(kategori_id)`, `(created_at desc)`.

### 6. `consultation_requester_contacts` — kontak pemohon (data pribadi)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | unik, FK → tickets, ON DELETE CASCADE |
| nama | text | ✓ | 2–120 bila diisi |
| whatsapp | text | ✓ | `^\+?[0-9]{8,15}$` |
| email | text | ✓ | pola email |
| persetujuan_privasi | boolean | ✗ | default false; wajib true saat submit (validasi function Phase 2) |
| persetujuan_publikasi | boolean | ✗ | default false; diisi pemohon, opsional |
| persetujuan_publikasi_at | timestamptz | ✓ | |
| created_at / updated_at | timestamptz | ✗ | |

Check `ccr_min_satu_kontak`: minimal WhatsApp **atau** email terisi.

### 7. `consultation_access_credentials` — kredensial akses tiket
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | unik, FK → tickets, ON DELETE CASCADE |
| secret_hash | text | ✗ | `^[0-9a-f]{64}$` — HMAC-SHA256, **tidak pernah plaintext** |
| dibuat_at | timestamptz | ✗ | |
| terakhir_akses_at | timestamptz | ✓ | |
| dicabut_at | timestamptz | ✓ | pencabutan akses |
| dicabut_alasan | text | ✓ | |

Secret 32 byte dibuat CSPRNG di Edge Function; pepper ada di secrets functions.

### 8. `consultation_messages` — percakapan tiket (append-only)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | FK → tickets, ON DELETE CASCADE |
| pengirim_jenis | text | ✗ | `pemohon` \| `konsultan` \| `reviewer` \| `admin_konsultasi` \| `sistem` |
| pengirim_email | text | ✓ | wajib untuk staf & harus terdaftar aktif (t); dilarang untuk pemohon/sistem (t) |
| jenis_pesan | text | ✗ | `balasan_pemohon` \| `jawaban_konsultan` \| `jawaban_final` \| `catatan_internal` \| `sistem` |
| isi | text | ✗ | trim 1–10000 |
| terlihat_pemohon | boolean | ✗ | default true; `catatan_internal` wajib false (check `ccm_internal_tersembunyi` + t) |
| created_at | timestamptz | ✗ | |

Kombinasi jenis_pesan ↔ pengirim_jenis divalidasi trigger (t).
Append-only: update/delete manual ditolak (t, `pg_trigger_depth() = 1`).

### 9. `consultation_assignments` — penugasan konsultan
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | FK → tickets, ON DELETE CASCADE |
| konsultan_email | text | ✗ | |
| role_tetap | text | ✗ | wajib `'konsultan'` |
| ditugaskan_oleh | text | ✗ | email admin penugasan |
| ditugaskan_at | timestamptz | ✗ | default now() |
| dilepas_at | timestamptz | ✓ | |
| alasan_pelepasan | text | ✓ | wajib bila dilepas (check `cca_pelepasan_beralasan`) |

FK komposit → staff_roles (ON DELETE RESTRICT). Indeks unik parsial
`(ticket_id) WHERE dilepas_at IS NULL`: **satu penugasan aktif per tiket**.

### 10. `consultation_reviews` — riwayat review jawaban (append-only)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | FK → tickets, ON DELETE CASCADE |
| message_id | uuid | ✗ | FK → messages, ON DELETE CASCADE; harus `jawaban_konsultan` & tiket cocok (t) |
| reviewer_email | text | ✗ | tidak boleh sama dengan penulis jawaban (t) |
| role_tetap | text | ✗ | wajib `'reviewer'` |
| keputusan | text | ✗ | `disetujui` \| `minta_revisi` |
| catatan | text | ✓ | wajib relevan saat `minta_revisi` (validasi function Phase 2) |
| reviewed_at | timestamptz | ✗ | default now() |

FK komposit → staff_roles (ON DELETE RESTRICT).

### 11. `consultation_attachments` — metadata lampiran (append-metadata)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | FK → tickets, ON DELETE CASCADE |
| message_id | uuid | ✓ | FK → messages, ON DELETE SET NULL |
| storage_path | text | ✗ | unik; prefix wajib `tickets/` (check) |
| nama_file | text | ✗ | 1–200 |
| mime | text | ✗ | `image/jpeg` \| `image/png` \| `image/webp` \| `application/pdf` |
| size_bytes | integer | ✗ | 1–5242880 (≤ 5 MB) |
| diunggah_oleh | text | ✗ | `'pemohon'` atau email staf aktif (t) |
| created_at | timestamptz | ✗ | |

File fisik di bucket **privat** `consultation-attachments` (limit 5 MB,
whitelist mime sama). Pengaksesan hanya via Edge Function + signed URL pendek.

---

## C. OPERASIONAL

### 12. `consultation_publications` — arsip tanya-jawab publik (snapshot samar)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | uuid | ✗ | PK |
| ticket_id | uuid | ✗ | unik, FK → tickets, ON DELETE CASCADE |
| slug | text | ✓ | unik, `^[a-z0-9-]{6,120}$`; wajib saat terbit (check) |
| judul_publik | text | ✗ | trim 5–200 |
| pertanyaan_samar | text | ✗ | redaksi yang sudah disamarkan |
| jawaban_final | text | ✗ | jawaban yang disetujui |
| disamarkan_oleh | text | ✗ | email penyamar |
| persetujuan_pemohon (+_at) | boolean/timestamptz | ✗/✓ | default false |
| disetujui_reviewer (+_oleh/_at) | boolean/text/timestamptz | ✗/✓/✓ | |
| disetujui_admin (+_oleh/_at) | boolean/text/timestamptz | ✗/✓/✓ | |
| published | boolean | ✗ | default false |
| published_at | timestamptz | ✓ | diisi sistem sekali saat pertama terbit (t) |
| created_at / updated_at | timestamptz | ✗ | |

Check `ccp_terbit_butuh_persetujuan`: terbit **hanya** bila ketiga persetujuan
true; `ccp_terbit_butuh_slug`: terbit wajib punya slug. Tidak pernah ber-JOIN
ke data identitas — snapshot berdiri sendiri. Pembacaan publik tetap via
Edge Function (RLS tetap deny ke anon).

### 13. `consultation_status_logs` — riwayat status (append-only)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | bigserial | ✗ | PK |
| ticket_id | uuid | ✓ | FK → tickets, ON DELETE **SET NULL** (riwayat selamat) |
| status_lama / status_baru | text | ✗ | |
| oleh | text | ✗ | default `'sistem'`; email dari JWT bila ada (t otomatis) |
| alasan | text | ✓ | bisa diisi via `SET LOCAL app.alasan_status` |
| at | timestamptz | ✗ | default now() |

Diisi otomatis trigger setiap status tiket berubah.

### 14. `consultation_audit_logs` — audit log (append-only)
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | bigserial | ✗ | PK |
| at | timestamptz | ✗ | default now() |
| aktor | text | ✗ | email / `'sistem'` / `'pemohon'` |
| aktor_jenis | text | ✗ | `pemohon` \| `staf` \| `sistem` |
| aksi | text | ✗ | kode aksi |
| ticket_id | uuid | ✓ | FK → tickets, ON DELETE SET NULL |
| detail | jsonb | ✗ | default `{}`; detail minimal, tanpa konten pribadi |

### 15. `consultation_notifications` — antrian email
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | bigserial | ✗ | PK |
| ticket_id | uuid | ✓ | FK → tickets, ON DELETE SET NULL |
| saluran | text | ✗ | `email` |
| penerima | text | ✗ | |
| perihal / isi | text | ✗ | |
| status | text | ✗ | `menunggu` \| `terkirim` \| `gagal` \| `dibatalkan` |
| percobaan | integer | ✗ | default 0 |
| error | text | ✓ | |
| created_at / terkirim_at | timestamptz | ✗/✓ | |

Indeks parsial antre: `(status, created_at) WHERE status='menunggu'`.
Pengirim aktual = Edge Function via Resend (keputusan C4, Phase 2).

### 16. `consultation_rate_hits` — hit rate-limit
| Kolom | Tipe | Null | Ketentuan |
|---|---|---|---|
| id | bigserial | ✗ | PK |
| bucket | text | ✗ | identitas **di-hash** (bukan IP mentah) |
| endpoint | text | ✗ | |
| at | timestamptz | ✗ | default now() |

Tidak ber-FK. Dipakai Edge Function untuk penghitungan window (keputusan C2);
pembersihan berkala (purge) juga tanggung jawab function — **belum ada**
mekanisme otomatis di Phase 1 (dicatat sebagai risiko/dependency).

---

## Ringkasan Penegakan (trigger & fungsi)

| Fungsi trigger | Tabel | Menegakkan |
|---|---|---|
| `consultation_ticket_before` | tickets | nomor otomatis, kategori aktif, transisi status, SLA pause/resume, keabadian nomor/created_at |
| `consultation_ticket_status_log` | tickets (after) | log status otomatis |
| `consultation_message_check` | messages | pengirim staf valid, pasangan jenis↔pengirim |
| `consultation_review_check` | reviews | hanya jawaban konsultan, tiket cocok, anti self-approval |
| `consultation_attachment_check` | attachments | pengunggah staf aktif / pemohon |
| `consultation_append_only` | messages, status_logs, audit_logs | larang update/delete manual (CASCADE masih diizinkan) |
| `consultation_publication_before` | publications | published_at sekali |
| `consultation_touch` | staff_roles, contacts, publications | updated_at |
| `consultation_can_transition` (fungsi biasa) | — | daftar transisi valid (25 pasangan) |
| `consultation_add_workdays` (fungsi biasa) | — | tenggat hari kerja WIB minus libur |
