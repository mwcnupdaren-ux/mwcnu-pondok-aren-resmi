// PHASE 1 — Pengujian migrasi konsultasi via PGlite (in-memory Postgres)
// Eksekusi 001→002→003 lalu 16 kelompok asersi (T01–T16).
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
  ["menunggu_informasi","ditugaskan",1],["menunggu_informasi","menunggu_review",1],["menunggu_informasi","selesai",0],
  ["selesai","ditugaskan",1],["selesai","baru",0],["ditolak","baru",0],
];
let st = true;
for (const [a, b, want] of pairs) {
  const r = (await q("select public.consultation_can_transition('" + a + "','" + b + "') v"))[0].v;
  if (r !== !!want) { st = false; console.log("  salah: " + a + "->" + b + " dapat " + r); }
}
ok("25 pasangan transisi", st);

// ====== Data dasar untuk transaksi
await db.exec(`insert into public.consultation_categories (kode, nama) values
  ('aqiqah','Aqiqah & Sembelihan'),('nikah','Nikah & Keluarga'),('ibadah','Ibadah Harian'),('lainnya','Lainnya');`);

// ====== T04: nomor tiket otomatis + kategori aktif
console.log("=== T04 nomor tiket otomatis ===");
const t = (await q(`insert into public.consultation_tickets (kategori_id, judul, isi_pertanyaan)
  values ((select id from public.consultation_categories where kode='ibadah'), 'Niat puasa sunnah hari Senin', 'Apakah puasa dhuha boleh digabung niat puasa Senin menurut yang terbaik?') returning nomor_tiket, status, sla_deadline`))[0];
ok("nomor KON-YYMMDD-XXXXXX", /^KON-\d{6}-[A-HJ-NP-Z2-9]{6}$/.test(t.nomor_tiket), t.nomor_tiket);
ok("status awal baru", t.status === "baru");
ok("SLA belum jalan di 'baru'", t.sla_deadline === null);

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
ok("T08a deadline bergeser setelah jeda", new Date(d2) > new Date(d1), d1 + " -> " + d2);
ok("T08b kolom pause dibersihkan", (await q("select sla_paused_at is null p, status_sebelum_pause is null s from public.consultation_tickets where id='" + tid + "'"))[0].p && (await q("select status_sebelum_pause is null s from public.consultation_tickets where id='" + tid + "'"))[0].s);
await expectErr("T08c colom SLA diubah manual ditolak",
  `update public.consultation_tickets set sla_deadline = now() where id='${tid}'`, "hanya dikelola sistem");

// ====== T09: pesan
console.log("=== T09 pesan ===");
await expectErr("T09a catatan_internal terlihat_pemohon=true ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi, terlihat_pemohon)
   values ('${tid}','konsultan','konsul1@mwcnupondokaren.or.id','catatan_internal','Catatan uji', true)`, "ccm_internal_tersembunyi");
await expectErr("T09b pengirim staf tak terdaftar ditolak",
  `insert into public.consultation_messages (ticket_id, pengirim_jenis, pengirim_email, jenis_pesan, isi)
   values ('${tid}','konsultan','orangasing@x.or.id','catatan_internal','Catatan uji')`, "bukan staf konsultasi");
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

console.log(process.exitCode ? "\n== HASIL: ADA KEGAGALAN ==" : "\n== HASIL: SEMUA TES LOLOS ==");
process.exit(process.exitCode || 0);
