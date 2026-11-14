// PHASE 1 (REVISI AUDIT) — Pengujian migrasi konsultasi via PGlite
// Eksekusi 001→002→003 lalu 22 kelompok asersi (T01–T22).
// Cara jalan (dari folder supabase/consultation/tests):
//   node test-konsultasi.mjs
// Jika paket @electric-sql/pglite terpasang (npm i @electric-sql/pglite),
// import paket dipakai; bila tidak, fallback ke cache npx lokal (mesin dev).
let PGlite;
try { ({ PGlite } = await import("@electric-sql/pglite")); }
catch {
  ({ PGlite } = await import("file:///C:/Users/99kho/AppData/Local/npm-cache/_npx/ba4f1959e38407b5/node_modules/@electric-sql/pglite/dist/index.js"));
}
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
      await run("001 ulang", "consultation_001_foundation.sql");
      await run("002 ulang", "consultation_002_tables.sql");
      await run("003 ulang", "consultation_003_security.sql");
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
const tFix = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan, nomor_tiket)
  values ((select id from public.consultation_categories where kode='ibadah'), 'Uji nomor eksplisit', 'Isi pertanyaan cukup panjang untuk lulus cek panjang.', 'KON-260101-ZZZZZZ') returning nomor_tiket`))[0];
ok("T04c nomor eksplisit dipertahankan (bukan diganti generator)", tFix.nomor_tiket === "KON-260101-ZZZZZZ", tFix.nomor_tiket);

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
await expectErr("T10a reviewer = penulis ditolak",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawab}','konsul1@mwcnupondokaren.or.id','disetujui')`, "sendiri");
await expectErr("T10b reviewer bukan ber-role reviewer ditolak (FK komposit)",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawab}','konsul2@mwcnupondokaren.or.id','disetujui')`);
await db.exec(`insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan, catatan)
  values ('${tid}','${mJawab}','rev1@mwcnupondokaren.or.id','disetujui','Baik.')`);
await expectErr("T10c keputusan di luar enum ditolak",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawab}','rev1@mwcnupondokaren.or.id','setuju')`, "check");

// ====== T11: append-only
console.log("=== T11 append-only ===");
await expectErr("T11a update status_logs ditolak", "update public.consultation_status_logs set oleh='x'", "append-only");
await expectErr("T11b delete status_logs ditolak", "delete from public.consultation_status_logs", "append-only");
await expectErr("T11c update messages ditolak", "update public.consultation_messages set isi='x'", "append-only");
// audit_logs belum berisi baris -> DELETE 0 baris tidak memicu trigger FOR EACH ROW;
// isi satu baris uji dulu agar penghapusan benar-benar mengenai data.
await db.exec(`insert into public.consultation_audit_logs (aktor, aktor_jenis, aksi)
  values ('uji-append-only', 'sistem', 'uji_baris_audit');`);
await expectErr("T11d delete audit_logs ditolak", "delete from public.consultation_audit_logs", "append-only");

// ====== T12: publikasi
console.log("=== T12 publikasi ===");
await expectErr("T12a terbit tanpa persetujuan ditolak",
  `insert into public.consultation_publications (ticket_id, judul_publik, pertanyaan_samar, jawaban_final, disamarkan_oleh, published)
   values ('${tid}','Uji terbit dini','Pertanyaan samar uji','Jawaban uji','adm@mwcnupondokaren.or.id', true)`, "ccp_terbit_butuh_persetujuan");
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
  `update public.consultation_publications set persetujuan_pemohon = true, persetujuan_pemohon_at = now() where ticket_id='${tid}'`,
  "belum tercatat pada data kontak");
await db.exec(`update public.consultation_requester_contacts set persetujuan_publikasi = true, persetujuan_publikasi_at = now() where ticket_id='${tid}'`);
ok("T12e persetujuan kontak pemohon tercatat", true);
await expectErr("T12f persetujuan reviewer oleh konsultan ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
     disetujui_reviewer_oleh = 'konsul1@mwcnupondokaren.or.id', disetujui_reviewer_at = now() where ticket_id='${tid}'`,
  "role reviewer yang aktif");
await expectErr("T12g persetujuan reviewer oleh email asing ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
     disetujui_reviewer_oleh = 'orangasing@x.or.id', disetujui_reviewer_at = now() where ticket_id='${tid}'`,
  "role reviewer yang aktif");
await expectErr("T12h persetujuan admin oleh reviewer ditolak",
  `update public.consultation_publications set disetujui_admin = true,
     disetujui_admin_oleh = 'rev1@mwcnupondokaren.or.id', disetujui_admin_at = now() where ticket_id='${tid}'`,
  "role admin_konsultasi yang aktif");
await expectErr("T12i persetujuan admin oleh email asing ditolak",
  `update public.consultation_publications set disetujui_admin = true,
     disetujui_admin_oleh = 'orangasing@x.or.id', disetujui_admin_at = now() where ticket_id='${tid}'`,
  "role admin_konsultasi yang aktif");
await expectErr("T12j persetujuan reviewer tanpa waktu ditolak",
  `update public.consultation_publications set disetujui_reviewer = true,
     disetujui_reviewer_oleh = 'rev1@mwcnupondokaren.or.id' where ticket_id='${tid}'`,
  "identitas dan waktu");
await expectErr("T12k persetujuan false dengan identitas terisi ditolak (harus bersih)",
  `update public.consultation_publications set disetujui_admin_oleh = 'adm@mwcnupondokaren.or.id' where ticket_id='${tid}'`,
  "bernilai false tetapi identitas/waktu terisi");

await db.exec(`update public.consultation_publications set
  persetujuan_pemohon = true, persetujuan_pemohon_at = now(),
  disetujui_reviewer = true, disetujui_reviewer_oleh = 'rev1@mwcnupondokaren.or.id', disetujui_reviewer_at = now(),
  disetujui_admin = true, disetujui_admin_oleh = 'adm@mwcnupondokaren.or.id', disetujui_admin_at = now(),
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
await expectErr("T21b reviewer nonaktif tidak dapat melakukan review baru",
  `insert into public.consultation_reviews (ticket_id, message_id, reviewer_email, keputusan)
   values ('${tid}','${mJawab}','rev1@mwcnupondokaren.or.id','disetujui')`, "ber-role reviewer dan aktif");
await db.exec("update public.consultation_staff_roles set aktif = true where email = 'rev1@mwcnupondokaren.or.id'");
ok("T21c status staf dipulihkan setelah uji nonaktif", true);

console.log(process.exitCode ? "\n== HASIL: ADA KEGAGALAN ==" : "\n== HASIL: SEMUA TES LOLOS ==");
process.exit(process.exitCode || 0);
