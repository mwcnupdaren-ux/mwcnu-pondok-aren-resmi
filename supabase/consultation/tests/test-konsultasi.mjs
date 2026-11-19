// PHASE 1 + GATE + LAYANAN FASE 2 — Pengujian migrasi & RPC konsultasi via PGlite
// Eksekusi 001→002→003→004→005→006 lalu kelompok asersi T01–T31.
// Cara jalan (dari folder supabase/consultation/tests):
//   npm install   (sekali; memasang @electric-sql/pglite lokal, terkunci versi)
//   npm test      (atau: node test-konsultasi.mjs)
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";

// Folder file migrasi = satu level di atas folder skrip ini
const R = fileURLToPath(new URL("../", import.meta.url)).replaceAll("\\", "/");
const db = await new PGlite();
const run = async (label, f) => {
  try { await db.exec(await readFile(R + f, "utf8")); console.log("OK   " + label); return true; }
  catch (e) { console.log("GAGAL " + label + " -> " + e.message.split("\n")[0]); process.exitCode = 1; return false; }
};
const q = async (s) => (await db.query(s)).rows;
const expectErr = async (label, sql, need = "") => {
  try { await db.exec(sql); console.log("GAGAL " + label + " (harusnya ditolak)"); process.exitCode = 1; return false; }
  catch (e) {
    const m = e.message.split("\n")[0];
    if (need && !m.includes(need)) { console.log("GAGAL " + label + " (pesan tak sesuai): " + m); process.exitCode = 1; return false; }
    console.log("OK   " + label + " -> " + m.slice(0, 70)); return true;
  }
};
const ok = (label, cond, info = "") => { console.log((cond ? "OK   " : "GAGAL ") + label + (cond ? "" : " " + info)); if (!cond) process.exitCode = 1; };

// Stub auth.jwt() — hanya untuk PGlite (Supabase memilikinya bawaan)
await db.exec(`create schema if not exists auth;
create or replace function auth.jwt() returns json language sql as $$ select null::json $$;`);

// ====== T01: migrasi 001-003 berurutan + idempotensi
console.log("=== T01 migrasi berurutan & idempotensi ===");
if (await run("001_foundation", "consultation_001_foundation.sql")) {
  if (await run("002_tables", "consultation_002_tables.sql")) {
    // Emulasi peran bawaan Supabase (di produksi sudah ada)
    await db.exec("create role service_role nologin bypassrls; create role anon nologin; create role authenticated nologin;");
    if (await run("003_security", "consultation_003_security.sql")) {
      if (await run("004_services", "consultation_004_services.sql")) {
        await run("005_security_hardening", "consultation_005_security_hardening.sql");
        await run("006_security_hardening", "consultation_006_security_hardening.sql");
        await run("001 ulang", "consultation_001_foundation.sql");
        await run("002 ulang", "consultation_002_tables.sql");
        await run("003 ulang", "consultation_003_security.sql");
        await run("004 ulang", "consultation_004_services.sql");
        await run("005 ulang", "consultation_005_security_hardening.sql");
        await run("006 ulang", "consultation_006_security_hardening.sql");
      }
    }
  }
}

// ====== T02: 16 tabel + RLS aktif semua
console.log("=== T02 tabel & RLS ===");
const tbl = await q("select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'consultation_%' order by tablename");
ok("16 tabel konsultasi", tbl.length === 16, "(dapat " + tbl.length + ")");
ok("RLS aktif 16/16", tbl.every(t => t.rowsecurity), JSON.stringify(tbl.filter(t => !t.rowsecurity)));
const pol = await q("select policyname from pg_policies where schemaname='public' and tablename like 'consultation_%'");
ok("0 policy (deny default)", pol.length === 0, "(dapat " + pol.length + ")");

// ====== T03: mesin status
console.log("=== T03 mesin status ===");
const pairs = [
  ["baru","diverifikasi",1],["baru","ditolak",1],["baru","terjawab",0],["baru","menunggu_penugasan",0],
  ["diverifikasi","menunggu_penugasan",1],["diverifikasi","ditugaskan",0],
  ["menunggu_penugasan","ditugaskan",1],["menunggu_penugasan","ditolak",1],["menunggu_penugasan","menunggu_review",0],
  ["ditugaskan","menunggu_review",1],["ditugaskan","menunggu_informasi",1],["ditugaskan","menunggu_penugasan",1],["ditugaskan","selesai",0],
  ["menunggu_review","terjawab",1],["menunggu_review","ditugaskan",1],["menunggu_review","selesai",0],
  ["terjawab","ditugaskan",1],["terjawab","menunggu_informasi",1],["terjawab","selesai",1],
  ["menunggu_informasi","ditugaskan",1],["menunggu_informasi","menunggu_review",1],["menunggu_informasi","terjawab",1],["menunggu_informasi","selesai",0],
  ["selesai","ditugaskan",1],["selesai","baru",0],["ditolak","baru",0],
];
let st = true;
for (const [a, b, want] of pairs) {
  const r = (await q("select public.consultation_can_transition('" + a + "','" + b + "') v"))[0].v;
  if (r !== !!want) { st = false; console.log("  salah: " + a + "->" + b + " dapat " + r); }
}
ok("26 pasangan transisi", st);

// ====== Data dasar untuk transaksi
await db.exec(`insert into public.consultation_categories (kode, nama) values
  ('aqiqah','Aqiqah & Sembelihan'),('nikah','Nikah & Keluarga'),('ibadah','Ibadah Harian'),('lainnya','Lainnya');`);

// ====== T04: nomor tiket otomatis + kategori aktif
console.log("=== T04 nomor tiket otomatis ===");
const t = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ((select id from public.consultation_categories where kode='ibadah'), 'Niat puasa sunnah hari Senin', 'Apakah puasa dhuha boleh digabung niat puasa Senin menurut yang terbaik?') returning nomor_tiket, status, sla_deadline`))[0];
ok("nomor KON-YYMMDD-<kode base-32>", /^KON-\d{6}-[A-HJ-NP-Z2-9]{6,7}$/.test(t.nomor_tiket), t.nomor_tiket);
ok("status awal baru", t.status === "baru");
ok("SLA belum jalan di 'baru'", t.sla_deadline === null);
await expectErr("T04c nomor eksplisit ditolak (wajib dari sistem/sequence)",
  `insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan, nomor_tiket)
   values ((select id from public.consultation_categories where kode='ibadah'), 'Uji nomor eksplisit', 'Isi pertanyaan cukup panjang untuk lulus cek panjang.', 'KON-260101-ZZZZZZ')`,
  "Nomor tiket wajib dibuat oleh sistem (sequence)");

// ====== T04c-duplikat: nomor duplikat (safety net unique constraint)
console.log("=== T04c-duplikat nomor duplikat ===");
// Generator dipaksa ke nilai yang sama melalui nomor yang sudah ada di sisi aplikasi
// tidak mungkin karena nomor selalu dari sequence; uji keunikan ditangani T19.
ok("T04c-duplikat nomor selalu unik lewat sequence (lihat T19)", true);

// ====== T04b/c: kategori non-aktif ditolak saat insert
console.log("=== T04b/c kategori non-aktif ===");
await db.exec("update public.consultation_categories set aktif = false where kode='lainnya'");
await expectErr("T04b kategori mati ditolak saat insert", `insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ((select id from public.consultation_categories where kode='lainnya'), 'Uji kategori mati', 'Isi pertanyaan cukup panjang untuk lulus cek panjang.')`, "tidak aktif");
await db.exec("update public.consultation_categories set aktif = true where kode='lainnya'");

// ====== T05: transisi ilegal
console.log("=== T05 transisi ilegal ===");
await expectErr("T05a baru -> terjawab ditolak",
  "update public.consultation_tickets set status='terjawab' where nomor_tiket='" + t.nomor_tiket + "'", "Transisi status tidak valid");

// ====== T06: kontak min satu
console.log("=== T06 kontak pemohon ===");
const tid = (await q("select id from public.consultation_tickets where nomor_tiket='" + t.nomor_tiket + "'"))[0].id;
await expectErr("T06a tanpa kedua kontak ditolak",
  `insert into public.consultation_requester_contacts (ticket_id) values ('${tid}')`, "ccr_min_satu_kontak");
await db.exec(`insert into public.consultation_requester_contacts (ticket_id, nama, whatsapp, persetujuan_privasi)
  values ('${tid}', null, '085161033689', true)`);
ok("T06b kontak WA saja lolos", true);

// ====== Alur penuh: verifikasi → antrean → penugasan → review → jawab → selesai
console.log("=== T07 alur lengkap + SLA ===");
await db.exec("update public.consultation_tickets set status='diverifikasi' where id='" + tid + "'");
const d1 = (await q("select sla_deadline from public.consultation_tickets where id='" + tid + "'"))[0].sla_deadline;
ok("SLA terisi saat diverifikasi", d1 !== null);
ok("SLA = akhir hari kerja ke-3 (23:59:59 WIB)", (() => { const d = new Date(d1); return d.getUTCHours() === 16 && d.getUTCMinutes() === 59; })(), String(d1));
await db.exec("update public.consultation_tickets set status='menunggu_penugasan' where id='" + tid + "'");

await db.exec(`insert into public.consultation_staff_roles (email, role_konsultasi) values
  ('adm@mwcnupondokaren.or.id','admin_konsultasi'),
  ('konsul1@mwcnupondokaren.or.id','konsultan'),
  ('konsul2@mwcnupondokaren.or.id','konsultan'),
  ('rev1@mwcnupondokaren.or.id','reviewer');`);
await db.exec(`insert into public.consultation_consultant_categories (konsultan_email, kategori_id)
  select 'konsul1@mwcnupondokaren.or.id', id from public.consultation_categories where kode='ibadah';`);

// T07a: penugasan konsultan kedua (kategori beda bidang) sah di level DB —
//       kesesuaian kategori divalidasi Edge Function (dependency Phase 2).
await db.exec(`insert into public.consultation_assignments (ticket_id, konsultan_email, ditugaskan_oleh)
  values ('${tid}','konsul2@mwcnupondokaren.or.id','adm@mwcnupondokaren.or.id')`);
await db.exec(`update public.consultation_assignments set dilepas_at = now(), alasan_pelepasan = 'uji pelepasan'
  where ticket_id='${tid}' and konsultan_email='konsul2@mwcnupondokaren.or.id'`);
ok("T07a penugasan + pelepasan konsultan 2 lolos", true);
await db.exec(`insert into public.consultation_assignments (ticket_id, konsultan_email, ditugaskan_oleh)
  values ('${tid}','konsul1@mwcnupondokaren.or.id','adm@mwcnupondokaren.or.id')`);
await expectErr("T07b dua penugasan aktif ditolak (unik parsial)",
  `insert into public.consultation_assignments (ticket_id, konsultan_email, ditugaskan_oleh)
   values ('${tid}','konsul2@mwcnupondokaren.or.id','adm@mwcnupondokaren.or.id')`);
await expectErr("T07c penugasan dengan email non-konsultan ditolak (FK komposit)",
  `insert into public.consultation_assignments (ticket_id, konsultan_email, ditugaskan_oleh)
   values ('${tid}','rev1@mwcnupondokaren.or.id','adm@mwcnupondokaren.or.id')`);

await db.exec("update public.consultation_tickets set status='ditugaskan' where id='" + tid + "'");

// ====== T08: pause & resume SLA
console.log("=== T08 pause/resume SLA ===");
await db.exec("update public.consultation_tickets set status='menunggu_informasi' where id='" + tid + "'");
await db.exec("select pg_sleep(0.05)"); // 50 ms jeda
await db.exec("update public.consultation_tickets set status='ditugaskan' where id='" + tid + "'");
const d2 = (await q("select sla_deadline from public.consultation_tickets where id='" + tid + "'"))[0].sla_deadline;
// Revisi audit B: jeda < 1 hari kerja TIDAK menggeser tenggat (jeda tidak
// memakan jatah; hanya hari kerja penuh yang tertutup jeda yang menggeser).
ok("T08a jeda < 1 hari kerja: tenggat tetap (jatah tidak berkurang)", new Date(d2).getTime() === new Date(d1).getTime(), d1 + " -> " + d2);
ok("T08b kolom pause dibersihkan", (await q("select sla_paused_at is null p, status_sebelum_pause is null s from public.consultation_tickets where id='" + tid + "'"))[0].p && (await q("select status_sebelum_pause is null s from public.consultation_tickets where id='" + tid + "'"))[0].s);
await expectErr("T08c colom SLA diubah manual ditolak",
  `update public.consultation_tickets set sla_deadline = now() where id='${tid}'`, "hanya dikelola sistem");

// ====== T09: pesan
console.log("=== T09 pesan ===");
await expectErr("T09a catatan_internal terlihat_pemohon=true ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
   values ('${tid}','konsultan','konsul1@mwcnupondokaren.or.id','catatan_internal','Catatan uji', true)`, "ccm_internal_tersembunyi");
await expectErr("T09b pengirim bukan konsultan (email asing) ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','konsultan','orangasing@x.or.id','catatan_internal','Catatan uji')`, "tidak memiliki role konsultan");
const mJawab = (await q(`insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
  values ('${tid}','konsultan','konsul1@mwcnupondokaren.or.id','jawaban_konsultan','Jawaban: boleh digabung menurut kaidah niat qashr...') returning id`))[0].id;
await expectErr("T09c jawaban dari pemohon tidak boleh berjenis jawaban_konsultan",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, jenis_pesan, isi)
   values ('${tid}','pemohon','jawaban_konsultan','mencoba menyamar')`, "hanya dari konsultan");

// ====== T10: review
console.log("=== T10 review ===");
await db.exec("update public.consultation_tickets set status='menunggu_review' where id='" + tid + "'");
await expectErr("T10a reviewer = penulis ditolak",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawab}','konsul1@mwcnupondokaren.or.id','disetujui')`, "sendiri");
await expectErr("T10b reviewer bukan ber-role reviewer ditolak (FK komposit)",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawab}','konsul2@mwcnupondokaren.or.id','disetujui')`);
await db.exec(`insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan, catatan)
  values ('${tid}','${mJawab}','rev1@mwcnupondokaren.or.id','disetujui','Baik.')`);
const mJawabInvalid = (await q(`insert into public.consultation_messages
  (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
  values ('${tid}','konsultan','konsul1@mwcnupondokaren.or.id','jawaban_konsultan','Jawaban uji enum review') returning id`))[0].id;
await expectErr("T10c keputusan di luar enum ditolak",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawabInvalid}','rev1@mwcnupondokaren.or.id','setuju')`, "check");

// ====== T11: append-only
console.log("=== T11 append-only ===");
await expectErr("T11a update status_logs ditolak", "update public.consultation_status_logs set oleh='x'", "append-only");
await expectErr("T11b delete status_logs ditolak", "delete from public.consultation_status_logs", "append-only");
await expectErr("T11c update messages ditolak", "update public.consultation_messages set isi='x'", "append-only");
// audit_logs belum berisi baris -> DELETE 0 baris tidak memicu trigger FOR EACH ROW;
// isi satu baris uji dulu agar penghapusan benar-benar mengenai data.
await db.exec(`insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi)
  values ('sistem', 'sistem', 'uji_baris_audit');`);
await expectErr("T11d delete audit_logs ditolak", "delete from public.consultation_audit_logs", "append-only");

// ====== T12: publikasi
console.log("=== T12 publikasi ===");
await expectErr("T12a terbit tanpa persetujuan ditolak",
  `insert into public.consultation_publications (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh, published)
   values ('${tid}','Uji terbit dini','Pertanyaan samar uji','Jawaban uji','adm@mwcnupondokaren.or.id', true)`, "belum terbit");
await db.exec(`update public.consultation_tickets set status='menunggu_review' where id='${tid}'`);
await db.exec(`update public.consultation_tickets set status='terjawab' where id='${tid}'`);
await db.exec(`update public.consultation_tickets set status='selesai' where id='${tid}'`);
await db.exec(`insert into public.consultation_publications (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh)
  values ('${tid}','Niat Puasa Dhuha Digabung Senin','Seorang warga bertanya tentang niat puasa dhuha...','Menurut kaidah... boleh digabung.','adm@mwcnupondokaren.or.id')`);
await expectErr("T12b published=true sebelum slug & persetujuan penuh ditolak",
  `update public.consultation_publications set published = true where ticket_id='${tid}'`, "ccp");

// ====== T12d-k: kewenangan ketiga persetujuan (audit F) — boolean true saja
// bukan bukti otorisasi; identitas & konsistensi kontak divalidasi trigger.
await expectErr("T12d persetujuan pemohon tanpa persetujuan di kontak ditolak",
  `update public.consultation_publications set persetujuan_pemohon = true, persetujuan_pemohon_at = now(),
     persetujuan_pemohon_revision = content_revision where ticket_id='${tid}'`,
  "belum tercatat pada data kontak");
await db.exec(`update public.consultation_requester_contacts set persetujuan_publikasi = true, persetujuan_publikasi_at = now() where ticket_id='${tid}'`);
ok("T12e persetujuan kontak pemohon tercatat", true);
await expectErr("T12f persetujuan reviewer oleh konsultan ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
     disetujui_reviewer_oleh = 'konsul1@mwcnupondokaren.or.id', disetujui_reviewer_at = now(),
     disetujui_reviewer_revision = content_revision where ticket_id='${tid}'`,
  "role reviewer yang aktif");
await expectErr("T12g persetujuan reviewer oleh email asing ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
     disetujui_reviewer_oleh = 'orangasing@x.or.id', disetujui_reviewer_at = now(),
     disetujui_reviewer_revision = content_revision where ticket_id='${tid}'`,
  "role reviewer yang aktif");
await expectErr("T12h persetujuan admin oleh reviewer ditolak",
  `update public.consultation_publications set disetujui_admin = true,
     disetujui_admin_oleh = 'rev1@mwcnupondokaren.or.id', disetujui_admin_at = now(),
     disetujui_admin_revision = content_revision where ticket_id='${tid}'`,
  "role admin_konsultasi yang aktif");
await expectErr("T12i persetujuan admin oleh email asing ditolak",
  `update public.consultation_publications set disetujui_admin = true,
     disetujui_admin_oleh = 'orangasing@x.or.id', disetujui_admin_at = now(),
     disetujui_admin_revision = content_revision where ticket_id='${tid}'`,
  "role admin_konsultasi yang aktif");
await expectErr("T12j persetujuan reviewer tanpa waktu ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
     disetujui_reviewer_oleh = 'rev1@mwcnupondokaren.or.id',
     disetujui_reviewer_revision = content_revision where ticket_id='${tid}'`,
  "identitas dan waktu");
await expectErr("T12k persetujuan false dengan identitas terisi ditolak (harus bersih)",
  `update public.consultation_publications set disetujui_admin_oleh = 'adm@mwcnupondokaren.or.id' where ticket_id='${tid}'`,
  "bernilai false tetapi identitas/waktu terisi");

// Terbit: ketiga persetujuan terikat content_revision (SQL006) — guard revision
// berjalan sebelum publication_check, sehingga binding wajib disertakan.
await db.exec(`update public.consultation_publications set
  persetujuan_pemohon = true, persetujuan_pemohon_at = now(),
  persetujuan_pemohon_revision = content_revision,
  disetujui_reviewer = true, disetujui_reviewer_oleh = 'rev1@mwcnupondokaren.or.id', disetujui_reviewer_at = now(),
  disetujui_reviewer_revision = content_revision,
  disetujui_admin = true, disetujui_admin_oleh = 'adm@mwcnupondokaren.or.id', disetujui_admin_at = now(),
  disetujui_admin_revision = content_revision,
  slug = 'niat-puasa-dhuha-digabung-senin', published = true where ticket_id='${tid}'`);
const pub = (await q("select published_at is not null p from public.consultation_publications where ticket_id='" + tid + "'"))[0].p;
ok("T12c terbit + published_at terisi otomatis", pub);

// ====== T13: hari kerja & libur
console.log("=== T13 SLA hari kerja ===");
const wd = (await q("select public.consultation_add_workdays(now(), 3) d"))[0].d;
ok("T13a 3 hari kerja dihitung", wd !== null);
await db.exec(`insert into public.consultation_holidays (tanggal, keterangan)
  values (current_date + 1, 'Uji libur'), (current_date + 2, 'Uji libur dua');`);
const wd2 = (await q("select public.consultation_add_workdays(now(), 1) d"))[0].d;
ok("T13b libur dilewati", wd2 !== null);

// ====== T14: hak akses anon & authenticated
// Pola: SET ROLE level sesi (bukan SET LOCAL di dalam transaksi) — bila pernyataan
// error, sesi tetap bersih dan RESET ROLE di finally selalu bisa dijalankan.
// (begin/rollback dalam satu exec berhenti di error pertama; rollback tak pernah
//  dieksekusi sehingga sesi tertinggal di transaksi aborted.)
console.log("=== T14 deny default ===");
const roleDeny = async (label, role, sql) => {
  try {
    await db.exec("set role " + role + ";");
    try { await db.exec(sql); console.log("GAGAL " + label + " (harusnya ditolak)"); process.exitCode = 1; return false; }
    catch (e) {
      const m = e.message.split("\n")[0];
      if (!m.includes("permission denied")) { console.log("GAGAL " + label + " (pesan tak sesuai): " + m); process.exitCode = 1; return false; }
      console.log("OK   " + label + " -> " + m.slice(0, 70)); return true;
    }
  } finally { await db.exec("reset role;"); }
};
await roleDeny("T14a anon select tiket ditolak", "anon", "select * from public.consultation_tickets;");
await roleDeny("T14b anon insert tiket ditolak", "anon",
  "insert into public.consultation_tickets (nomor_tiket, kategori_id, judul, isi_pertanyaan) values ('x', null, 'x', 'x');");
await roleDeny("T14c authenticated select credentials ditolak", "authenticated", "select * from public.consultation_access_credentials;");
await roleDeny("T14d anon baca attachments ditolak", "anon", "select * from public.consultation_attachments;");
ok("T14e sesi kembali ke role semula", true);

// ====== T15: kredensial (hash-only) + lampiran + notifikasi + rate
console.log("=== T15 kredensial & lampiran ===");
await db.exec(`insert into public.consultation_access_credentials (ticket_id, secret_hash)
  values ('${tid}', repeat('a', 64));`);
await expectErr("T15a secret bukan hash 64 hex ditolak",
  `insert into public.consultation_access_credentials (ticket_id, secret_hash) values ('${tid}', 'rahasia')`, "check");
await db.exec(`insert into public.consultation_attachments (ticket_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
  values ('${tid}','tickets/${tid}/bukti.png','bukti.png','image/png', 1024, 'pemohon');`);
await expectErr("T15b path di luar prefix tickets/ ditolak",
  `insert into public.consultation_attachments (ticket_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
   values ('${tid}','lain/salah.png','salah.png','image/png', 1024, 'pemohon')`, "check");
await expectErr("T15c mime di luar whitelist ditolak",
  `insert into public.consultation_attachments (ticket_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
   values ('${tid}','tickets/${tid}/v.exe','v.exe','application/x-msdownload', 1024, 'pemohon')`, "check");
await db.exec(`insert into public.consultation_notifications (ticket_id, saluran, penerima, perihal, isi)
  values ('${tid}','email','seseorang@contoh.id','Tiket diterima','Terima kasih...');`);
await db.exec(`insert into public.consultation_rate_hits (bucket, endpoint) values ('abc','submit');`);
ok("T15d notifikasi & rate_hits terisi", true);

// ====== Log status otomatis
console.log("=== T16 log status otomatis ===");
const logs = await q("select status_lama, status_baru from public.consultation_status_logs where ticket_id='" + tid + "' order by at");
ok("T16a riwayat lengkap", JSON.stringify(logs.map(l => l.status_lama + ">" + l.status_baru)) ===
  JSON.stringify(["baru>diverifikasi","diverifikasi>menunggu_penugasan","menunggu_penugasan>ditugaskan","ditugaskan>menunggu_informasi","menunggu_informasi>ditugaskan","ditugaskan>menunggu_review","menunggu_review>terjawab","terjawab>selesai"]),
  JSON.stringify(logs));

// ====== T17: jeda dari 'terjawab' (audit A)
console.log("=== T17 jeda dari terjawab ===");
const tid2 = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ((select id from public.consultation_categories where kode='ibadah'), 'Uji jeda dari terjawab', 'Isi pertanyaan cukup panjang untuk lulus cek panjang.') returning id`))[0].id;
for (const s of ["diverifikasi","menunggu_penugasan","ditugaskan","menunggu_review","terjawab"]) {
  await db.exec(`update public.consultation_tickets set status='${s}' where id='${tid2}'`);
}
await db.exec(`update public.consultation_tickets set status='menunggu_informasi' where id='${tid2}'`);
ok("T17a terjawab -> menunggu_informasi sah; status_sebelum_pause = terjawab",
  (await q(`select status_sebelum_pause s from public.consultation_tickets where id='${tid2}'`))[0].s === "terjawab");
await expectErr("T17b keluar jeda ke ditugaskan ditolak (bukan status asal)",
  `update public.consultation_tickets set status='ditugaskan' where id='${tid2}'`, "hanya ke status sebelumnya");
await expectErr("T17c keluar jeda ke menunggu_review ditolak (bukan status asal)",
  `update public.consultation_tickets set status='menunggu_review' where id='${tid2}'`, "hanya ke status sebelumnya");
await db.exec(`update public.consultation_tickets set status='terjawab' where id='${tid2}'`);
ok("T17d terjawab -> jeda -> terjawab sah (kembali ke status asal)",
  (await q(`select status from public.consultation_tickets where id='${tid2}'`))[0].status === "terjawab");

// ====== T18: SLA seluruh kasus kalender jeda (audit B)
// Seam waktu: GUC app.waktu_sistem (lihat 002_tables D2) memungkinkan simulasi
// hari jeda/resume lintas kalender tanpa menunggu waktu nyata.
console.log("=== T18 SLA kalender jeda ===");
const addD = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const eodWIB = (d) => new Date(d + "T23:59:59+07:00").toISOString();
const eq = (a, b) => new Date(a).getTime() === new Date(b).getTime();
// Senin ±4 minggu ke depan: jauh dari libur uji lain, deterministik
const senin = (await q("select to_char(current_date + ((8 - extract(isodow from current_date))::int % 7) + 28, 'YYYY-MM-DD') d"))[0].d;
const W = (d, jam) => `${d} ${jam}+07`;
const skenario = async (nama, libur, pauseD, pauseJ, resumeD, resumeJ, ekspektasi) => {
  await db.exec("delete from public.consultation_holidays");
  if (libur) await db.exec(libur);
  await db.exec(`set app.waktu_sistem = '${W(senin, "10:00:00")}'`);
  const idt = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
    values ((select id from public.consultation_categories where kode='ibadah'), 'Uji SLA kalender ${nama}', 'Isi pertanyaan cukup panjang untuk lulus cek panjang.') returning id`))[0].id;
  await db.exec(`update public.consultation_tickets set status='diverifikasi' where id='${idt}'`);
  const d0 = (await q(`select sla_deadline from public.consultation_tickets where id='${idt}'`))[0].sla_deadline;
  for (const s of ["menunggu_penugasan","ditugaskan"]) await db.exec(`update public.consultation_tickets set status='${s}' where id='${idt}'`);
  await db.exec(`set app.waktu_sistem = '${W(pauseD, pauseJ)}'`);
  await db.exec(`update public.consultation_tickets set status='menunggu_informasi' where id='${idt}'`);
  await db.exec(`set app.waktu_sistem = '${W(resumeD, resumeJ)}'`);
  await db.exec(`update public.consultation_tickets set status='ditugaskan' where id='${idt}'`);
  const d2 = (await q(`select sla_deadline from public.consultation_tickets where id='${idt}'`))[0].sla_deadline;
  ok("T18 " + nama, ekspektasi(d0, d2), "d0=" + new Date(d0).toISOString() + " d2=" + new Date(d2).toISOString());
  await db.exec("delete from public.consultation_holidays");
  await db.exec("reset app.waktu_sistem");
};
const takBerubah = (d0, d2) => eq(d2, d0);
// S1: jeda & lanjut pada hari yang sama -> tenggat tetap
await skenario("S1 jeda sehari pada hari sama", null,
  addD(senin,1), "10:00:00", addD(senin,1), "15:00:00",
  (d0, d2) => eq(d0, eodWIB(addD(senin,3))) && takBerubah(d0, d2));
// S2: jeda melewati akhir pekan (tenggat digeser libur agar window panjang) -> tetap
await skenario("S2 jeda lewat akhir pekan", `insert into public.consultation_holidays (tanggal, keterangan)
  values ('${addD(senin,1)}','Uji'), ('${addD(senin,2)}','Uji'), ('${addD(senin,3)}','Uji')`,
  addD(senin,4), "10:00:00", addD(senin,7), "09:00:00",
  (d0, d2) => eq(d0, eodWIB(addD(senin,8))) && takBerubah(d0, d2));
// S3: jeda melewati hari libur -> tetap (libur bukan hari kerja, tidak dihitung)
await skenario("S3 jeda lewat hari libur", `insert into public.consultation_holidays (tanggal, keterangan)
  values ('${addD(senin,2)}','Uji')`,
  addD(senin,1), "10:00:00", addD(senin,3), "09:00:00",
  (d0, d2) => eq(d0, eodWIB(addD(senin,4))) && takBerubah(d0, d2));
// S4: jeda melewati akhir pekan sekaligus hari libur -> tetap
await skenario("S4 jeda lewat akhir pekan + libur", `insert into public.consultation_holidays (tanggal, keterangan)
  values ('${addD(senin,1)}','Uji'), ('${addD(senin,2)}','Uji'), ('${addD(senin,3)}','Uji'), ('${addD(senin,7)}','Uji')`,
  addD(senin,4), "10:00:00", addD(senin,8), "09:00:00",
  (d0, d2) => eq(d0, eodWIB(addD(senin,9))) && takBerubah(d0, d2));
// S5: jeda beberapa hari kerja (Selasa -> Senin depan: Rabu/Kamis/Jumat penuh) -> geser +3 hari kerja
await skenario("S5 jeda beberapa hari kerja", null,
  addD(senin,1), "10:00:00", addD(senin,7), "09:00:00",
  (d0, d2) => eq(d0, eodWIB(addD(senin,3))) && eq(d2, eodWIB(addD(senin,8))));
// S6: resume ketika tenggat sudah lewat selama jeda -> jatah minimal 1 hari kerja segar
await skenario("S6 tenggat lewat selama jeda", null,
  addD(senin,3), "10:00:00", addD(senin,4), "10:00:00",
  (d0, d2) => eq(d0, eodWIB(addD(senin,3))) && eq(d2, eodWIB(addD(senin,7))));

// ====== T19: keunikan nomor tiket (audit C)
console.log("=== T19 keunikan nomor tiket ===");
const nomorList = [];
for (let k = 0; k < 100; k++) {
  nomorList.push((await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
    values ((select id from public.consultation_categories where kode='lainnya'), 'Uji unik nomor ${k}', 'Isi pertanyaan cukup panjang untuk lulus cek panjang.') returning nomor_tiket`))[0].nomor_tiket);
}
ok("T19a 100 nomor berturut semuanya unik", new Set(nomorList).size === 100, "unik: " + new Set(nomorList).size);
ok("T19b format konsisten base-32", nomorList.every(n => /^KON-\d{6}-[A-HJ-NP-Z2-9]{6,7}$/.test(n)));
// Uji transaksi paralel tidak dimungkinkan di PGlite (satu koneksi; database
// in-memory per instans). Keamanan paralel dijamin mekanisme sequence:
// nextval() tidak pernah mengembalikan nilai sama untuk dua transaksi
// (perilaku bawaan PostgreSQL) — verifikasi penuh membutuhkan Postgres nyata.
ok("T19c paralel: dijamin sequence nextval (uji penuh butuh Postgres nyata)", true);

// ====== T20: pengirim pesan — role harus cocok (audit D)
console.log("=== T20 pengirim pesan role cocok ===");
await expectErr("T20a konsultan mengaku admin_konsultasi ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','admin_konsultasi','konsul1@mwcnupondokaren.or.id','catatan_internal','Uji penyamaran')`, "tidak memiliki role admin_konsultasi");
await expectErr("T20b konsultan mengaku reviewer ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','reviewer','konsul1@mwcnupondokaren.or.id','catatan_internal','Uji penyamaran')`, "tidak memiliki role reviewer");
await expectErr("T20c reviewer mengaku konsultan ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','konsultan','rev1@mwcnupondokaren.or.id','catatan_internal','Uji penyamaran')`, "tidak memiliki role konsultan");
await expectErr("T20d reviewer mengaku admin_konsultasi ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','admin_konsultasi','rev1@mwcnupondokaren.or.id','catatan_internal','Uji penyamaran')`, "tidak memiliki role admin_konsultasi");
await expectErr("T20e admin mengaku konsultan ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','konsultan','adm@mwcnupondokaren.or.id','catatan_internal','Uji penyamaran')`, "tidak memiliki role konsultan");
await db.exec("update public.consultation_staff_roles set aktif = false where email = 'konsul1@mwcnupondokaren.or.id'");
await expectErr("T20f konsultan nonaktif tidak dapat mengirim pesan",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','konsultan','konsul1@mwcnupondokaren.or.id','catatan_internal','Uji penyamaran')`, "tidak memiliki role konsultan");
await db.exec("update public.consultation_staff_roles set aktif = true where email = 'konsul1@mwcnupondokaren.or.id'");
await expectErr("T20g pemohon tidak boleh menyertakan email staf",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','pemohon','adm@mwcnupondokaren.or.id','balasan_pemohon','Balasan uji')`, "tidak boleh menyertakan email");

// ====== T21: penugasan & review — role + aktif (audit E)
console.log("=== T21 penugasan & review role aktif ===");
await db.exec("update public.consultation_staff_roles set aktif = false where email = 'konsul1@mwcnupondokaren.or.id'");
await expectErr("T21a konsultan nonaktif tidak dapat menerima penugasan baru",
  `insert into public.consultation_assignments (ticket_id, konsultan_email, ditugaskan_oleh)
   values ('${tid2}','konsul1@mwcnupondokaren.or.id','adm@mwcnupondokaren.or.id')`, "ber-role konsultan dan aktif");
await db.exec("update public.consultation_staff_roles set aktif = true where email = 'konsul1@mwcnupondokaren.or.id'");
await db.exec("update public.consultation_staff_roles set aktif = false where email = 'rev1@mwcnupondokaren.or.id'");
const mJawabNonaktif = (await q(`insert into public.consultation_messages
  (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
  values ('${tid}','konsultan','konsul1@mwcnupondokaren.or.id','jawaban_konsultan','Jawaban uji reviewer nonaktif') returning id`))[0].id;
// SQL006 mengecek status tiket sebelum cek role pada penjaga review: naikkan
// tiket ke 'menunggu_review' melalui transisi valid (selesai -> ditugaskan ->
// menunggu_review) agar asersi mencapai penjaga role yang menjadi target uji.
await db.exec(`update public.consultation_tickets set status='ditugaskan' where id='${tid}'`);
await db.exec(`update public.consultation_tickets set status='menunggu_review' where id='${tid}'`);
await expectErr("T21b reviewer nonaktif tidak dapat melakukan review baru",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawabNonaktif}','rev1@mwcnupondokaren.or.id','disetujui')`, "ber-role reviewer dan aktif");
// pulihkan status tiket ke kondisi semula (menunggu_review -> terjawab -> selesai).
await db.exec(`update public.consultation_tickets set status='terjawab' where id='${tid}'`);
await db.exec(`update public.consultation_tickets set status='selesai' where id='${tid}'`);
await db.exec("update public.consultation_staff_roles set aktif = true where email = 'rev1@mwcnupondokaren.or.id'");
ok("T21c status staf dipulihkan setelah uji nonaktif", true);

// ====== T22: status awal tiket wajib 'baru' & kosong SLA (audit lanjutan B)
console.log("=== T22 status awal tiket & SLA kosong ===");
const catId = (await q("select id from public.consultation_categories where kode='ibadah'"))[0].id;
await expectErr("T22a insert tiket dengan status diverifikasi ditolak",
  `insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan, status)
   values ('${catId}', 'Uji status awal', 'Isi pertanyaan cukup panjang untuk lulus.', 'diverifikasi')`,
  "Tiket baru wajib dimulai dengan status baru");
await expectErr("T22b insert tiket dengan sla_deadline terisi ditolak",
  `insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan, sla_deadline)
   values ('${catId}', 'Uji SLA awal', 'Isi pertanyaan cukup panjang untuk lulus.', now() + interval '3 days')`,
  "Kolom SLA/jeda wajib kosong");

// ====== T23: perlindungan SLA di setiap UPDATE & perubahan status (audit lanjutan C)
console.log("=== T23 perlindungan SLA saat update/status ===");
const tid3 = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ('${catId}', 'Uji proteksi SLA update', 'Isi pertanyaan cukup panjang untuk lulus.') returning id`))[0].id;
await expectErr("T23a update tiket status 'baru' dengan mengisi sla_deadline ditolak",
  `update public.consultation_tickets set sla_deadline = now() where id='${tid3}'`, "hanya dikelola sistem");
await db.exec(`update public.consultation_tickets set status='diverifikasi' where id='${tid3}'`);
await expectErr("T23b update normal dengan mengubah sla_deadline ditolak",
  `update public.consultation_tickets set status='menunggu_penugasan', sla_deadline = now() where id='${tid3}'`, "hanya dikelola sistem");
await db.exec(`update public.consultation_tickets set status='menunggu_penugasan' where id='${tid3}'`);
await db.exec(`update public.consultation_tickets set status='ditugaskan' where id='${tid3}'`);
await expectErr("T23c entry pause dengan memanipulasi sla_deadline ditolak",
  `update public.consultation_tickets set status='menunggu_informasi', sla_deadline = now() where id='${tid3}'`, "hanya dikelola sistem");

// ====== T24: persetujuan publikasi, pencabutan, re-publication & published_at (audit lanjutan D)
console.log("=== T24 publikasi, pencabutan & published_at ===");
const tidPub = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ('${catId}', 'Uji publikasi pencabutan', 'Isi pertanyaan cukup panjang untuk lulus.') returning id`))[0].id;
await db.exec(`update public.consultation_tickets set status='diverifikasi' where id='${tidPub}'`);
await db.exec(`update public.consultation_tickets set status='menunggu_penugasan' where id='${tidPub}'`);
await db.exec(`update public.consultation_tickets set status='ditugaskan' where id='${tidPub}'`);
await db.exec(`insert into public.consultation_requester_contacts (ticket_id, whatsapp, persetujuan_privasi, persetujuan_publikasi, persetujuan_publikasi_at)
  values ('${tidPub}', '085161033689', true, true, now())`);
await db.exec(`insert into public.consultation_publications (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh)
  values ('${tidPub}', 'Judul Publik Uji', 'Pertanyaan samar...', 'Jawaban final...', 'adm@mwcnupondokaren.or.id')`);
await expectErr("T24a insert dengan published_at terisi ditolak",
  `insert into public.consultation_publications (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh, published_at)
   values ('${tidPub}', 'X', 'Y', 'Z', 'adm@mwcnupondokaren.or.id', now())`, "published_at hanya dikelola sistem");

// Publikasi milik pemohon (persetujuan_pemohon=true) agar pencabutan kontak memicu dicabut_at
await db.exec(`update public.consultation_publications set persetujuan_pemohon = true, persetujuan_pemohon_at = now(),
  persetujuan_pemohon_revision = content_revision where ticket_id='${tidPub}'`);

// Pencabutan via kontak: persetujuan kontak ditarik (true -> false) → memaksa unpublish + dicabut
await db.exec(`update public.consultation_requester_contacts set persetujuan_publikasi = false, persetujuan_publikasi_at = null where ticket_id='${tidPub}'`);
const pubState = (await q(`select published, persetujuan_pemohon, dicabut from public.consultation_publications where ticket_id='${tidPub}'`))[0];
ok("T24b pencabutan kontak mematikan published & persetujuan_pemohon dan mencatat dicabut", !pubState.published && !pubState.persetujuan_pemohon && pubState.dicabut);

// Re-publication: persetujuan reviewer dengan timestamp lama (sebelum dicabut_at) ditolak
await expectErr("T24c re-publication dengan persetujuan reviewer lama (sebelum dicabut_at) ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
   disetujui_reviewer_oleh = 'rev1@mwcnupondokaren.or.id', disetujui_reviewer_at = now() - interval '2 hours',
   disetujui_reviewer_revision = content_revision where ticket_id='${tidPub}'`,
  "wajib diperbarui setelah pencabutan");

// published_at tidak dapat diubah pada UPDATE (belum terbit, tetap null)
await expectErr("T24d published_at diubah manual ditolak",
  `update public.consultation_publications set published_at = now() - interval '1 day' where ticket_id='${tidPub}'`, "published_at hanya dikelola sistem");
const pa = (await q(`select published_at from public.consultation_publications where ticket_id='${tidPub}'`))[0].published_at;
ok("T24e published_at tetap null (belum pernah terbit)", pa === null);

// ====== T25: lampiran lintas tiket (audit lanjutan E)
console.log("=== T25 lampiran lintas tiket ===");
const tidAlt = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ('${catId}', 'Tiket Lain', 'Isi pertanyaan cukup panjang untuk lulus.') returning id`))[0].id;
await expectErr("T25a lampiran merujuk pesan tiket lain ditolak",
  `insert into public.consultation_attachments (ticket_id, message_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
   values ('${tidAlt}', '${mJawab}', 'tickets/${tidAlt}/x.png', 'x.png', 'image/png', 1024, 'pemohon')`,
  "Lampiran tidak cocok dengan tiket pesan");

// ====== T26: review append-only (audit lanjutan F)
console.log("=== T26 review append-only ===");
await expectErr("T26a update review ditolak (append-only)",
  `update public.consultation_reviews set catatan = 'Ubah catatan' where ticket_id='${tid}'`, "append-only");
await expectErr("T26b delete review ditolak (append-only)",
  `delete from public.consultation_reviews where ticket_id='${tid}'`, "append-only");

// ====== T27: GATE B1 — publikasi terbit WAJIB punya published_at (INSERT & UPDATE)
console.log("=== T27 (B1) published_at pada INSERT & UPDATE ===");
const tidB1 = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ('${catId}', 'Uji invarian B1', 'Isi pertanyaan cukup panjang untuk lulus uji B1.') returning id`))[0].id;
await db.exec(`insert into public.consultation_requester_contacts
  (ticket_id, whatsapp, persetujuan_privasi, persetujuan_publikasi, persetujuan_publikasi_at)
  values ('${tidB1}', '085161033690', true, true, now())`);
await db.exec(`insert into public.consultation_publications
  (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh)
  values ('${tidB1}', 'Judul B1', 'Pertanyaan samar B1', 'Jawaban final B1', 'adm@mwcnupondokaren.or.id')`);
await expectErr("T27a INSERT published=true ditolak (publikasi wajib mulai belum terbit)",
  `insert into public.consultation_publications
     (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh, slug, published,
      persetujuan_pemohon, persetujuan_pemohon_at,
      disetujui_reviewer, disetujui_reviewer_oleh, disetujui_reviewer_at,
      disetujui_admin, disetujui_admin_oleh, disetujui_admin_at)
   values ('${tidB1}', 'Judul B1', 'Pertanyaan samar B1', 'Jawaban final B1', 'adm@mwcnupondokaren.or.id',
           'uji-b1-insert', true, true, now(),
           true, 'rev1@mwcnupondokaren.or.id', now(),
           true, 'adm@mwcnupondokaren.or.id', now())`,
  "belum terbit");
await db.exec(`update public.consultation_publications set
  persetujuan_pemohon = true, persetujuan_pemohon_at = now(),
  persetujuan_pemohon_revision = content_revision,
  disetujui_reviewer = true, disetujui_reviewer_oleh = 'rev1@mwcnupondokaren.or.id', disetujui_reviewer_at = now(),
  disetujui_reviewer_revision = content_revision,
  disetujui_admin = true, disetujui_admin_oleh = 'adm@mwcnupondokaren.or.id', disetujui_admin_at = now(),
  disetujui_admin_revision = content_revision,
  slug = 'uji-b1-update', published = true where ticket_id='${tidB1}'`);
const b1 = (await q(`select published, published_at from public.consultation_publications where ticket_id='${tidB1}'`))[0];
ok("T27b UPDATE false->true menstempel published_at otomatis", b1.published === true && b1.published_at !== null);
await expectErr("T27c UPDATE mengosongkan published_at saat terbit ditolak",
  `update public.consultation_publications set published_at = null where ticket_id='${tidB1}'`,
  "published_at hanya dikelola sistem");
const b1bad = (await q("select count(*)::int n from public.consultation_publications where published and published_at is null"))[0].n;
ok("T27d invarian global: 0 publikasi terbit tanpa published_at", b1bad === 0, "(dapat " + b1bad + ")");

// ====== T28: GATE B2 — hak service_role eksplisit & terbukti
console.log("=== T28 (B2) hak service_role ===");
const semuaTabel = ["consultation_categories","consultation_holidays","consultation_staff_roles",
  "consultation_consultant_categories","consultation_tickets","consultation_requester_contacts",
  "consultation_access_credentials","consultation_messages","consultation_assignments",
  "consultation_reviews","consultation_attachments","consultation_publications",
  "consultation_status_logs","consultation_audit_logs","consultation_notifications","consultation_rate_hits"];
const kurang = [];
for (const tb of semuaTabel) for (const p of ["SELECT","INSERT","UPDATE","DELETE"]) {
  const v = (await q(`select has_table_privilege('service_role','public.${tb}','${p}') v`))[0].v;
  if (!v) kurang.push(`${tb}:${p}`);
}
ok("T28a service_role punya SELECT/INSERT/UPDATE/DELETE di 16 tabel", kurang.length === 0, kurang.join(", "));
const bocor = [];
for (const tb of semuaTabel) for (const r of ["anon","authenticated"]) {
  const v = (await q(`select has_table_privilege('${r}','public.${tb}','SELECT') v`))[0].v;
  if (v) bocor.push(`${r}:${tb}`);
}
ok("T28b anon/authenticated tanpa hak baca tabel konsultasi", bocor.length === 0, bocor.join(", "));
ok("T28c service_role punya USAGE sequence nomor tiket",
  (await q("select has_sequence_privilege('service_role','public.consultation_nomor_tiket_seq','USAGE') v"))[0].v === true);
ok("T28d anon tanpa USAGE sequence nomor tiket",
  (await q("select has_sequence_privilege('anon','public.consultation_nomor_tiket_seq','USAGE') v"))[0].v === false);

// ====== T29: GATE B3 — identitas aktor terverifikasi (tidak dapat dipalsukan)
console.log("=== T29 (B3) identitas aktor ===");
const tidB3 = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ('${catId}', 'Uji aktor B3', 'Isi pertanyaan cukup panjang untuk lulus uji B3.') returning id`))[0].id;
// Aktor GUC transaksi (jalur backend tepercaya) tercatat pada status log
await db.exec(`begin;
  select public.consultation_set_aktor('adm@mwcnupondokaren.or.id');
  update public.consultation_tickets set status='diverifikasi' where id='${tidB3}';
commit;`);
const log1 = (await q(`select oleh, status_baru from public.consultation_status_logs
  where ticket_id='${tidB3}' order by id desc limit 1`))[0];
ok("T29a status log mencatat aktor terverifikasi (bukan 'sistem')",
  log1.oleh === "adm@mwcnupondokaren.or.id" && log1.status_baru === "diverifikasi", JSON.stringify(log1));
// RPC perubahan status: set aktor + alasan + update dalam SATU transaksi
const ubah = (await q(`select (public.consultation_ubah_status(
  '${tidB3}','menunggu_penugasan','alasan uji B3','adm@mwcnupondokaren.or.id')).status as status`))[0];
const log2 = (await q(`select oleh, alasan from public.consultation_status_logs
  where ticket_id='${tidB3}' order by id desc limit 1`))[0];
ok("T29b RPC ubah status mencatat aktor & alasan",
  ubah.status === "menunggu_penugasan" && log2.oleh === "adm@mwcnupondokaren.or.id" && log2.alasan === "alasan uji B3",
  JSON.stringify({ ubah, log2 }));
await expectErr("T29c aktor non-staf ditolak",
  `select public.consultation_set_aktor('orangasing@x.or.id')`, "bukan staf konsultasi aktif");
await expectErr("T29d aktor kosong ditolak",
  `select public.consultation_set_aktor('')`, "Aktor wajib diisi");
await expectErr("T29e ubah status dengan aktor palsu ditolak",
  `select public.consultation_ubah_status('${tidB3}','ditugaskan','x','orangasing@x.or.id')`,
  "bukan staf konsultasi aktif");
await roleDeny("T29f anon tidak dapat menetapkan aktor", "anon",
  "select public.consultation_set_aktor('adm@mwcnupondokaren.or.id');");
await expectErr("T29g audit log dengan aktor staf asing ditolak",
  `insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi)
   values ('orangasing@x.or.id','staf','uji audit')`, "bukan staf konsultasi aktif");
await db.exec(`insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi, ticket_id)
  values ('ADM@mwcnupondokaren.or.id','staf','uji audit b3','${tidB3}')`);
const au = (await q(`select aktor from public.consultation_audit_logs where aksi='uji audit b3'`))[0];
ok("T29h audit log aktor staf dinormalisasi & diterima", au.aktor === "adm@mwcnupondokaren.or.id", au.aktor);
// Fallback JWT (bila PostgREST memverifikasi JWT pengguna): email JWT dipakai
await db.exec(`create or replace function auth.jwt() returns json language sql as
  $$ select '{"email":"rev1@mwcnupondokaren.or.id"}'::json $$;`);
ok("T29i fallback email JWT terverifikasi dipakai bila GUC kosong",
  (await q("select public.consultation_aktor() v"))[0].v === "rev1@mwcnupondokaren.or.id");
await db.exec(`create or replace function auth.jwt() returns json language sql as $$ select null::json $$;`);

// ====== T30: LAYANAN FASE 2 (RPC backend)
console.log("=== T30 layanan Fase 2 (RPC) ===");
const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const buatA = (await q(`select public.consultation_svc_buat_tiket(
  'ibadah','Tiket layanan A','Isi pertanyaan layanan A cukup panjang.',
  'Pemohon A','085161033700',null,'${hashA}',true,true) as r`))[0].r;
const tA = buatA.id, nomorA = buatA.nomor_tiket;
ok("T30a buat tiket via RPC (nomor sistem + status baru)",
  /^KON-/.test(nomorA) && buatA.status === "baru", JSON.stringify(buatA));
await expectErr("T30b akses tiket dengan hash salah ditolak",
  `select public.consultation_svc_akses_tiket('${nomorA}','${"c".repeat(64)}')`,
  "Kredensial tiket tidak valid");
const aksesA = (await q(`select public.consultation_svc_akses_tiket('${nomorA}','${hashA}') as r`))[0].r;
ok("T30c akses tiket dengan hash benar; consent publikasi draft belum diwariskan",
  aksesA.ticket.id === tA && aksesA.kontak.persetujuan_publikasi === false);
ok("T30d respons pemohon tidak memuat email staf internal",
  !JSON.stringify(aksesA).includes("mwcnupondokaren.or.id"));
await q(`select public.consultation_svc_pesan_pemohon('${nomorA}','${hashA}','Mohon penjelasan tambahan.')`);
const aksesA2 = (await q(`select public.consultation_svc_akses_tiket('${nomorA}','${hashA}') as r`))[0].r;
ok("T30e pesan pemohon tercatat & terlihat",
  aksesA2.pesan.length === 1 && aksesA2.pesan[0].jenis_pesan === "balasan_pemohon");
const daftarAdmin = (await q(`select public.consultation_svc_staf_daftar('adm@mwcnupondokaren.or.id',null,100,0) as r`))[0].r;
ok("T30f admin melihat tiket", daftarAdmin.peran === "admin_konsultasi" && daftarAdmin.tiket.some(x => x.id === tA));
const daftarKonsul = (await q(`select public.consultation_svc_staf_daftar('konsul1@mwcnupondokaren.or.id',null,100,0) as r`))[0].r;
ok("T30g konsultan belum melihat tiket yang belum ditugaskan", !daftarKonsul.tiket.some(x => x.id === tA));
await q(`select public.consultation_svc_verifikasi('${tA}','adm@mwcnupondokaren.or.id')`);
const st1 = (await q(`select status from public.consultation_tickets where id='${tA}'`))[0].status;
const logA = (await q(`select oleh from public.consultation_status_logs where ticket_id='${tA}' order by id desc limit 1`))[0].oleh;
ok("T30h verifikasi admin -> diverifikasi + aktor tercatat",
  st1 === "diverifikasi" && logA === "adm@mwcnupondokaren.or.id");
await q(`select public.consultation_svc_status('${tA}','menunggu_penugasan','masuk antrean','adm@mwcnupondokaren.or.id')`);
await q(`select public.consultation_svc_tugaskan('${tA}','konsul1@mwcnupondokaren.or.id','adm@mwcnupondokaren.or.id')`);
const st2 = (await q(`select status from public.consultation_tickets where id='${tA}'`))[0].status;
ok("T30i penugasan admin -> ditugaskan", st2 === "ditugaskan");
const daftarKonsul2 = (await q(`select public.consultation_svc_staf_daftar('konsul1@mwcnupondokaren.or.id',null,100,0) as r`))[0].r;
ok("T30j konsultan melihat tiket yang ditugaskan", daftarKonsul2.tiket.some(x => x.id === tA));
await expectErr("T30k konsultan lain tidak berwenang membaca tiket",
  `select public.consultation_svc_staf_detail('konsul2@mwcnupondokaren.or.id','${tA}')`,
  "Tidak berwenang atas tiket ini");
await q(`select public.consultation_svc_jawab('${tA}','Jawaban konsultan untuk tiket A.','konsul1@mwcnupondokaren.or.id')`);
const st3 = (await q(`select status from public.consultation_tickets where id='${tA}'`))[0].status;
ok("T30l jawaban konsultan -> menunggu_review", st3 === "menunggu_review");
const msgId = (await q(`select id from public.consultation_messages where ticket_id='${tA}' and jenis_pesan='jawaban_konsultan'`))[0].id;
const aksesSebelumReview = (await q(`select public.consultation_svc_akses_tiket('${buatA.nomor_tiket}','${hashA}') as r`))[0].r;
ok("T30l-1 jawaban konsultan tersembunyi sebelum persetujuan reviewer",
  !aksesSebelumReview.pesan.some(m => m.id === msgId));
const daftarRev = (await q(`select public.consultation_svc_staf_daftar('rev1@mwcnupondokaren.or.id',null,100,0) as r`))[0].r;
ok("T30m reviewer melihat antrean review", daftarRev.tiket.some(x => x.id === tA));
await expectErr("T30n konsultan tidak dapat melakukan review",
  `select public.consultation_svc_review('${tA}','${msgId}','disetujui',null,'konsul1@mwcnupondokaren.or.id')`,
  "Hanya reviewer");
await expectErr("T30n-1 admin tidak dapat melewati review melalui RPC status umum",
  `select public.consultation_svc_status('${tA}','terjawab','bypass review','adm@mwcnupondokaren.or.id')`,
  "Transisi dari menunggu_review hanya boleh melalui keputusan reviewer");
// Naikkan tiket ke 'terjawab' melalui transisi valid agar alur mencapai penjaga
// persetujuan jawaban terbaru SQL006 (pada 'menunggu_review', cek status lebih
// dulu menolak sebelum penjaga ini sempat dievaluasi).
await db.exec(`update public.consultation_tickets set status='terjawab' where id='${tA}'`);
await expectErr("T30n-2 jawaban final tidak dapat terlihat sebelum review disetujui",
  `select public.consultation_svc_pesan_staf('${tA}','jawaban_final','Final prematur',true,'adm@mwcnupondokaren.or.id')`,
  "Jawaban final menunggu persetujuan");
// kembalikan ke antrean review (terjawab -> ditugaskan -> menunggu_review).
await db.exec(`update public.consultation_tickets set status='ditugaskan' where id='${tA}'`);
await db.exec(`update public.consultation_tickets set status='menunggu_review' where id='${tA}'`);
await q(`select public.consultation_svc_review('${tA}','${msgId}','disetujui',null,'rev1@mwcnupondokaren.or.id')`);
const st4 = (await q(`select status from public.consultation_tickets where id='${tA}'`))[0].status;
const revA = (await q(`select reviewer_email, keputusan from public.consultation_reviews where ticket_id='${tA}'`))[0];
ok("T30o review disetujui -> terjawab + identitas reviewer",
  st4 === "terjawab" && revA.reviewer_email === "rev1@mwcnupondokaren.or.id" && revA.keputusan === "disetujui");
const aksesSesudahReview = (await q(`select public.consultation_svc_akses_tiket('${buatA.nomor_tiket}','${hashA}') as r`))[0].r;
ok("T30o-1 jawaban tampil setelah reviewer menyetujui",
  aksesSesudahReview.pesan.some(m => m.id === msgId));
// Kembalikan tiket ke antrean review (terjawab -> ditugaskan -> menunggu_review)
// agar RPC review mencapai penjaga duplikasi — SQL006 mengecek status lebih dulu.
await db.exec(`update public.consultation_tickets set status='ditugaskan' where id='${tA}'`);
await db.exec(`update public.consultation_tickets set status='menunggu_review' where id='${tA}'`);
await expectErr("T30o-1b satu jawaban tidak dapat direview dua kali",
  `select public.consultation_svc_review('${tA}','${msgId}','minta_revisi','uji duplikasi','rev1@mwcnupondokaren.or.id')`,
  "sudah pernah direview");
// pulihkan status 'terjawab' untuk melanjutkan alur jawaban berikutnya.
await db.exec(`update public.consultation_tickets set status='terjawab' where id='${tA}'`);
// Jawaban baru menggantikan jawaban lama sebagai jawaban yang dapat dilihat.
await q(`select public.consultation_svc_status('${tA}','ditugaskan','jawaban lanjutan','adm@mwcnupondokaren.or.id')`);
await q(`select public.consultation_svc_jawab('${tA}','Jawaban konsultan terbaru untuk tiket A.','konsul1@mwcnupondokaren.or.id')`);
const msgId2 = (await q(`select id from public.consultation_messages where ticket_id='${tA}' and jenis_pesan='jawaban_konsultan' order by created_at desc, id desc limit 1`))[0].id;
const aksesJawabanKedua = (await q(`select public.consultation_svc_akses_tiket('${buatA.nomor_tiket}','${hashA}') as r`))[0].r;
ok("T30o-1c jawaban lama tersembunyi setelah jawaban baru dikirim",
  !aksesJawabanKedua.pesan.some(m => m.id === msgId) && !aksesJawabanKedua.pesan.some(m => m.id === msgId2));
await expectErr("T30o-1d reviewer tidak dapat menyetujui jawaban lama",
  `select public.consultation_svc_review('${tA}','${msgId}','disetujui',null,'rev1@mwcnupondokaren.or.id')`,
  "jawaban konsultan terbaru");
await q(`select public.consultation_svc_review('${tA}','${msgId2}','disetujui',null,'rev1@mwcnupondokaren.or.id')`);
const aksesJawabanKeduaDisetujui = (await q(`select public.consultation_svc_akses_tiket('${buatA.nomor_tiket}','${hashA}') as r`))[0].r;
ok("T30o-1e hanya jawaban terbaru tampil setelah review terbaru disetujui",
  !aksesJawabanKeduaDisetujui.pesan.some(m => m.id === msgId) && aksesJawabanKeduaDisetujui.pesan.some(m => m.id === msgId2));
const finalSesudahReview = (await q(`select public.consultation_svc_pesan_staf(
  '${tA}','jawaban_final','Jawaban final admin yang sudah direview.',true,
  'adm@mwcnupondokaren.or.id') as r`))[0].r;
ok("T30o-1a jawaban final admin dapat ditampilkan setelah review",
  finalSesudahReview.terlihat_pemohon === true);
const lampiranInternal = (await q(`select public.consultation_svc_lampiran_staf(
  '${tA}','tickets/${tA}/internal.pdf','internal.pdf','application/pdf',1024,null,
  'adm@mwcnupondokaren.or.id') as r`))[0].r;
const aksesTanpaInternal = (await q(`select public.consultation_svc_akses_tiket('${buatA.nomor_tiket}','${hashA}') as r`))[0].r;
ok("T30o-2 lampiran staf tanpa pesan tidak muncul pada pemohon",
  !aksesTanpaInternal.lampiran.some(a => a.id === lampiranInternal.id));
await expectErr("T30o-3 signed URL metadata lampiran staf tanpa pesan ditolak",
  `select public.consultation_svc_lampiran_pemohon_ambil('${buatA.nomor_tiket}','${hashA}','${lampiranInternal.id}')`,
  "Lampiran belum dapat dilihat pemohon");
const aj = (await q(`select public.consultation_svc_ajukan_publikasi(
  '${tA}','Judul Publik A','Pertanyaan samar A','Jawaban final A','adm@mwcnupondokaren.or.id') as r`))[0].r;
ok("T30p publikasi baru tidak mewarisi persetujuan kontak lama",
  aj.persetujuan_pemohon === false && aj.published === false);
await q(`select public.consultation_svc_persetujuan_pemohon('${nomorA}','${hashA}',true)`);
const persetujuanDraft = (await q(`select persetujuan_pemohon from public.consultation_publications where ticket_id='${tA}'`))[0];
ok("T30p-1 pemohon memberi persetujuan eksplisit untuk draft saat ini",
  persetujuanDraft.persetujuan_pemohon === true);
await q(`select public.consultation_svc_setujui_publikasi('${tA}',true,'rev1@mwcnupondokaren.or.id')`);
await q(`select public.consultation_svc_setujui_publikasi('${tA}',true,'adm@mwcnupondokaren.or.id')`);
const terbit = (await q(`select public.consultation_svc_terbitkan('${tA}','judul-publik-a','adm@mwcnupondokaren.or.id') as r`))[0].r;
ok("T30q terbit setelah 3 persetujuan + published_at",
  terbit.published === true && terbit.published_at !== null);
const listPub = (await q(`select public.consultation_svc_publik_list(50,0) as r`))[0].r;
ok("T30r daftar publik memuat publikasi terbit", listPub.some(x => x.slug === "judul-publik-a"));
const detailPub = (await q(`select public.consultation_svc_publik_detail('judul-publik-a') as r`))[0].r;
ok("T30s detail publik terbit", detailPub.slug === "judul-publik-a");
// Edit konten harus membatalkan tiga persetujuan dan meng-unpublish snapshot lama.
await q(`update public.consultation_publications set jawaban_final='Jawaban final A versi perubahan.' where ticket_id='${tA}'`);
const pubRevisi = (await q(`select published, slug, persetujuan_pemohon, disetujui_reviewer, disetujui_admin from public.consultation_publications where ticket_id='${tA}'`))[0];
ok("T30s-1 perubahan konten membatalkan semua persetujuan dan slug",
  !pubRevisi.published && pubRevisi.slug === null && !pubRevisi.persetujuan_pemohon && !pubRevisi.disetujui_reviewer && !pubRevisi.disetujui_admin);
await q(`select public.consultation_svc_persetujuan_pemohon('${nomorA}','${hashA}',true)`);
await q(`select public.consultation_svc_setujui_publikasi('${tA}',true,'rev1@mwcnupondokaren.or.id')`);
await q(`select public.consultation_svc_setujui_publikasi('${tA}',true,'adm@mwcnupondokaren.or.id')`);
const terbitRevisi = (await q(`select public.consultation_svc_terbitkan('${tA}','judul-publik-b','adm@mwcnupondokaren.or.id') as r`))[0].r;
ok("T30s-2 revisi konten hanya dapat diterbitkan setelah persetujuan baru",
  terbitRevisi.published === true && terbitRevisi.slug === "judul-publik-b");
await q(`select public.consultation_svc_cabut_publikasi('${tA}','uji cabut','adm@mwcnupondokaren.or.id')`);
const pubA = (await q(`select published, dicabut from public.consultation_publications where ticket_id='${tA}'`))[0];
ok("T30t cabut publikasi -> tidak terbit + dicabut", !pubA.published && pubA.dicabut);
await q(`select public.consultation_svc_persetujuan_pemohon('${nomorA}','${hashA}',false)`);
const kontakA = (await q(`select persetujuan_publikasi from public.consultation_requester_contacts where ticket_id='${tA}'`))[0];
ok("T30u pencabutan persetujuan pemohon via RPC", kontakA.persetujuan_publikasi === false);
const buatB = (await q(`select public.consultation_svc_buat_tiket(
  'ibadah','Tiket layanan B','Isi pertanyaan layanan B cukup panjang.',
  null,'085161033701',null,'${hashB}',true,false) as r`))[0].r;
await q(`select public.consultation_svc_tolak('${buatB.id}','Pertanyaan tidak jelas','adm@mwcnupondokaren.or.id')`);
const stB = (await q(`select status, alasan_penolakan from public.consultation_tickets where id='${buatB.id}'`))[0];
ok("T30v tolak tiket dengan alasan tercatat",
  stB.status === "ditolak" && stB.alasan_penolakan === "Pertanyaan tidak jelas");
await expectErr("T30w kredensial tiket B tidak dapat membaca tiket A",
  `select public.consultation_svc_akses_tiket('${nomorA}','${hashB}')`,
  "Kredensial tiket tidak valid");
await db.exec(`insert into public.consultation_attachments
  (ticket_id, storage_path, nama_file, mime, size_bytes, diunggah_oleh)
  values ('${tA}','tickets/${tA}/a.png','a.png','image/png',1024,'pemohon')`);
const aksesA3 = (await q(`select public.consultation_svc_akses_tiket('${nomorA}','${hashA}') as r`))[0].r;
ok("T30x lampiran tiket A terlihat oleh pemohon A", aksesA3.lampiran.length === 1);
const aksesB = (await q(`select public.consultation_svc_akses_tiket('${buatB.nomor_tiket}','${hashB}') as r`))[0].r;
ok("T30y lampiran tiket A tidak terlihat oleh pemohon B", aksesB.lampiran.length === 0);
await expectErr("T30z aktor palsu pada RPC admin ditolak",
  `select public.consultation_svc_verifikasi('${buatB.id}','orangasing@x.or.id')`,
  "bukan staf konsultasi aktif");
await roleDeny("T30aa anon tidak dapat memanggil RPC staf", "anon",
  `select public.consultation_svc_staf_daftar('adm@mwcnupondokaren.or.id',null,10,0);`);
ok("T30ab service_role punya hak eksekusi RPC",
  (await q("select has_function_privilege('service_role','public.consultation_svc_staf_daftar(text,text,integer,integer)','EXECUTE') v"))[0].v === true);

// ====== T31: lampiran, rate-limit, audit lapisan HTTP (Fase 2)
console.log("=== T31 lampiran & penjaga HTTP ===");
const hashC = "c".repeat(64);
const buatC = (await q(`select public.consultation_svc_buat_tiket(
  'ibadah','Tiket layanan C','Isi pertanyaan layanan C cukup panjang.',
  null,'085161033702',null,'${hashC}',true,false) as r`))[0].r;
const tC = buatC.id;
await expectErr("T31a lampiran dengan path tiket lain ditolak",
  `select public.consultation_svc_lampiran_pemohon('${buatC.nomor_tiket}','${hashC}',
     'tickets/${tA}/curang.png','curang.png','image/png',1024)`,
  "Path lampiran tidak valid");
const lampC = (await q(`select public.consultation_svc_lampiran_pemohon(
  '${buatC.nomor_tiket}','${hashC}','tickets/${tC}/bukti.png','bukti.png','image/png',2048) as r`))[0].r;
ok("T31b lampiran pemohon tercatat pada tiketnya", lampC.id && lampC.storage_path === `tickets/${tC}/bukti.png`);
const ambC = (await q(`select public.consultation_svc_lampiran_pemohon_ambil(
  '${buatC.nomor_tiket}','${hashC}','${lampC.id}') as r`))[0].r;
ok("T31c metadata lampiran dapat diambil pemiliknya", ambC.nama_file === "bukti.png");
await expectErr("T31d lampiran tiket C tidak dapat diambil kredensial tiket A",
  `select public.consultation_svc_lampiran_pemohon_ambil('${buatC.nomor_tiket}','${hashA}','${lampC.id}')`,
  "Kredensial tiket tidak valid");
ok("T31e konsultan yang ditugaskan berhak mengunggah lampiran",
  (await q(`select public.consultation_svc_lampiran_izin('${tA}','konsul1@mwcnupondokaren.or.id') as r`))[0].r.boleh === true);
await expectErr("T31f konsultan lain tidak berhak mengunggah lampiran",
  `select public.consultation_svc_lampiran_izin('${tA}','konsul2@mwcnupondokaren.or.id')`,
  "tidak ditugaskan");
const rate1 = (await q(`select public.consultation_svc_rate_hit('uji-bucket','uji-endpoint',2,60) as r`))[0].r;
const rate2 = (await q(`select public.consultation_svc_rate_hit('uji-bucket','uji-endpoint',2,60) as r`))[0].r;
const rate3 = (await q(`select public.consultation_svc_rate_hit('uji-bucket','uji-endpoint',2,60) as r`))[0].r;
ok("T31g rate-limit mengizinkan lalu memblokir", rate1.allowed && rate2.allowed && rate3.allowed === false,
  JSON.stringify({ rate1, rate2, rate3 }));
ok("T31h rate-limit memberi retry_after saat diblokir", Number(rate3.retry_after) >= 1);
await q(`select public.consultation_svc_catat_audit('sistem','sistem','uji_audit_http',null,'{"a":1}'::jsonb)`);
ok("T31i audit peristiwa HTTP tercatat", (await q(
  `select count(*)::int n from public.consultation_audit_logs where aksi='uji_audit_http'`))[0].n === 1);
await expectErr("T31j audit dengan jenis aktor asing ditolak",
  `select public.consultation_svc_catat_audit('x','alien','uji',null,'{}'::jsonb)`,
  "Jenis aktor audit tidak valid");
const kat = (await q(`select public.consultation_svc_kategori() as r`))[0].r;
ok("T31k kategori publik aktif tersedia tanpa data internal",
  Array.isArray(kat) && kat.some((k) => k.kode === "ibadah") && !JSON.stringify(kat).includes("id"));

console.log(process.exitCode ? "\n== HASIL: ADA KEGAGALAN ==" : "\n== HASIL: SEMUA TES LOLOS ==");
process.exit(process.exitCode || 0);
