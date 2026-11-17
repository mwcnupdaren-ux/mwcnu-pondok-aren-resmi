/* Dasbor staf konsultasi MWCNU Pondok Aren (konsultan / reviewer / admin konsultasi).
   Keamanan sebenarnya ditegakkan Edge Function + database: peran diambil dari
   JWT (GoTrue) lalu consultation_svc_peran(email) di sisi server — TIDAK dari
   browser. Antarmuka ini hanya menampilkan hasilnya dan menolak bila backend
   menolak (401 sesi kedaluwarsa / 403 akses ditolak / 429 batas laju). */
(function () {
'use strict';
var C = window.MWC_CFG || {};
var sb = (window.supabase && C.supabaseUrl && C.supabaseKey) ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null;
var FN = (C.supabaseUrl || '').replace(/\/$/, '') + '/functions/v1/';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var root = $('#app');

var S = { sesi: null, email: '', peran: '', area: '', detail: null, filter: '', sla: null };
var BL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
var STT = {
  baru: 'Baru', diverifikasi: 'Diverifikasi', ditolak: 'Ditolak',
  menunggu_penugasan: 'Menunggu penugasan', ditugaskan: 'Ditugaskan',
  menunggu_informasi: 'Menunggu informasi pemohon', menunggu_review: 'Menunggu review',
  terjawab: 'Terjawab', selesai: 'Selesai'
};
var STATUS = ['baru','diverifikasi','ditolak','menunggu_penugasan','ditugaskan','menunggu_informasi','menunggu_review','terjawab','selesai'];
var SLUG_RE = /^[a-z0-9-]{6,120}$/;
var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* ---------- util ---------- */
function esc(s) { return window.mwcEsc(s); }
function toast(m, bad) {
  var t = $('#toast'), e = document.createElement('div');
  e.className = 't' + (bad ? ' bad' : ''); e.textContent = m;
  t.appendChild(e); setTimeout(function () { e.remove(); }, bad ? 6000 : 3200);
}
function fd(iso) { var p = String(iso || '').split('-'); return p.length == 3 && +p[0] ? (+p[2]) + ' ' + BL[+p[1] - 1] + ' ' + p[0] : (iso || ''); }
function fdt(iso) {
  if (!iso) return '';
  var d = new Date(iso); if (isNaN(d)) return fd(iso);
  return d.getDate() + ' ' + BL[d.getMonth()] + ' ' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0');
}
function lbl(s) { return STT[s] || s; }
function chip(s) { return '<span class="chip' + (s === 'ditolak' ? ' x' : '') + '">' + esc(lbl(s)) + '</span>'; }
function slaChip(t) {
  if (!t.sla_deadline) return '<span class="chip">Tanpa SLA</span>';
  var late = t.status !== 'selesai' && t.status !== 'ditolak' && new Date(t.sla_deadline) < new Date();
  return '<span class="chip' + (late ? ' x' : '') + '">' + (late ? 'SLA terlambat · ' : 'SLA ') + esc(fdt(t.sla_deadline)) + '</span>';
}
function val(el) { return (el && el.value || '').replace(/\r\n/g, '\n'); }
function setErr(id, m) { var e = $(id); if (e) e.textContent = m || ''; var f = $(id.replace(/^#e-/, '#f-')); if (f) f.className = m ? 'fld err' : 'fld'; }

/* ---------- layar awal ---------- */
function screen(h) { root.innerHTML = '<div class="center"><div class="card">' + h + '</div></div>'; }
function setup() {
  screen('<h1>Belum terhubung</h1><p>Halaman staf butuh konfigurasi Supabase. Isi <code>supabaseUrl</code> dan <code>supabaseKey</code> pada <code>js/config.js</code>.</p>');
}
function login(pesan) {
  screen('<h1>Staf Konsultasi</h1>' + (pesan ? '<p class="note">' + esc(pesan) + '</p>' : '') +
    '<p>Masuk dengan akun Google yang terdaftar sebagai staf konsultasi (konsultan, reviewer, atau admin konsultasi).</p>' +
    '<p><button class="btn g" id="gbtn">Masuk dengan Google</button></p>');
  $('#gbtn').onclick = function () {
    sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
  };
}
function denied(email) {
  screen('<h1>Akses ditolak</h1><p><b>' + esc(email || 'Akun ini') + '</b> bukan staf konsultasi aktif. ' +
    'Peran konsultan/reviewer/admin konsultasi ditetapkan backend; minta admin menambahkan email ini pada tabel <code>consultation_staff_roles</code>.</p>' +
    '<p><button class="btn o" id="out">Keluar</button></p>');
  $('#out').onclick = signOut;
}
function fatal(m) { screen('<h1>Terjadi kesalahan</h1><p>' + esc(m) + '</p><p><button class="btn o" onclick="location.reload()">Muat ulang</button></p>'); }
function expired() {
  S.sesi = null; S.email = ''; S.peran = '';
  login('Sesi Anda kedaluwarsa. Silakan masuk kembali.');
}
function signOut() {
  sb.auth.signOut().then(function () { S.sesi = null; S.email = ''; S.peran = ''; login(); })
    .catch(function () { toast('Gagal keluar sesi. Periksa koneksi lalu coba lagi.', 1); });
}

/* ---------- API staf ---------- */
function api(fn, body) {
  if (!S.sesi) return Promise.resolve({ status: 401, ok: false, body: {} });
  var h = { 'Content-Type': 'application/json', 'apikey': C.supabaseKey, 'Authorization': 'Bearer ' + S.sesi };
  return fetch(FN + fn, { method: 'POST', cache: 'no-store', headers: h, body: JSON.stringify(body || {}) })
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok && j && j.ok === true, body: j || {} }; }); })
    .catch(function () { return { status: 0, ok: false, body: {} }; });
}
function baca(res) {
  if (res.status === 401) { expired(); return Promise.reject({ stop: true }); }
  if (res.status === 403) return Promise.reject({ msg: (res.body && res.body.message) || 'Akses ditolak — peran Anda tidak berwenang untuk aksi ini.' });
  if (res.status === 429) {
    var ra = res.body && res.body.details && res.body.details.retry_after;
    return Promise.reject({ msg: 'Terlalu banyak permintaan. Coba lagi' + (ra ? ' dalam ' + ra + ' detik.' : ' sebentar lagi.') });
  }
  if (res.status === 0) return Promise.reject({ msg: 'Koneksi ke layanan gagal. Periksa jaringan lalu coba lagi.' });
  if (!res.ok) return Promise.reject({ msg: (res.body && (res.body.message || res.body.error)) || 'Permintaan gagal (' + res.status + ').' });
  return res.body.data;
}

/* ---------- deteksi peran (dari backend, bukan browser) ---------- */
function deteksiPeran() {
  return api('consultation-consultant', { action: 'list', limit: 1 }).then(function (r1) {
    if (r1.ok) return r1.body.data.peran || 'konsultan';
    if (r1.status === 403) return api('consultation-review', { action: 'list', limit: 1 }).then(function (r2) {
      if (r2.ok) return r2.body.data.peran || 'reviewer';
      if (r2.status === 403) return api('consultation-admin', { action: 'list', limit: 1 }).then(function (r3) {
        if (r3.ok) return r3.body.data.peran || 'admin_konsultasi';
        return null;
      });
      return null;
    });
    return null;
  });
}

/* ---------- kerangka halaman ---------- */
var NAV = {
  konsultan: [['#konsultan', 'Tiket saya']],
  reviewer: [['#reviewer', 'Antrean review']],
  admin_konsultasi: [['#admin', 'Tiket'], ['#admin-sla', 'Pemantauan SLA'], ['#publikasi', 'Publikasi']],
  reviewer_pub: [['#reviewer', 'Antrean review'], ['#publikasi', 'Persetujuan publikasi']]
};
function shell() {
  var nav = (NAV[S.peran === 'reviewer' ? 'reviewer_pub' : S.peran] || []).map(function (n) {
    return '<a href="' + n[0] + '" class="' + (location.hash === n[0] ? 'on' : '') + '">' + esc(n[1]) + '</a>';
  }).join('');
  root.innerHTML =
    '<div class="shell"><aside class="side"><div class="brand"><img src="/assets/img/logo.png" alt="">' +
    '<span><b>Staf Konsultasi</b><small>MWCNU Pondok Aren</small></span></div>' + nav +
    '<a href="#keluar" id="nav-out">Keluar</a></aside>' +
    '<main class="main"><div class="top"><div><h1 style="margin:0;font-size:1.15rem">' + esc(NAMA[S.peran] || S.peran) + '</h1>' +
    '<div class="who">' + esc(S.email) + ' · peran dari backend</div></div>' +
    '<div class="foot"><button class="btn o s" id="b-refresh">Muat ulang</button><button class="btn o s" id="b-out">Keluar</button></div></div>' +
    '<div id="staf-main"><p class="boot">Memuat…</p></div></main></div>';
  $('#b-refresh').onclick = function () { route(); };
  $('#b-out').onclick = signOut;
  $('#nav-out').onclick = function (e) { e.preventDefault(); signOut(); };
}
var NAMA = { konsultan: 'Dasbor Konsultan', reviewer: 'Dasbor Reviewer', admin_konsultasi: 'Dasbor Admin Konsultasi' };
function main(h) { var m = $('#staf-main'); if (m) m.innerHTML = h; return m; }
function galat(m) { return '<p class="note">' + esc(m) + '</p>'; }

/* ---------- router ---------- */
function route() {
  if (!S.peran) return;
  var h = location.hash || '';
  S.detail = null;
  if (S.peran === 'konsultan' && (h === '' || h === '#' || h === '#konsultan')) return kList();
  if (S.peran === 'reviewer' && (h === '' || h === '#' || h === '#reviewer')) return rList();
  if (S.peran === 'reviewer' && h === '#publikasi') return pubReview();
  if (S.peran === 'admin_konsultasi' && (h === '' || h === '#' || h === '#admin')) return aList();
  if (S.peran === 'admin_konsultasi' && h === '#admin-sla') return aSla();
  if (S.peran === 'admin_konsultasi' && h === '#publikasi') return pubAdmin();
  // area pertama sesuai peran bila hash tak dikenal
  if (S.peran === 'konsultan') { location.hash = '#konsultan'; return; }
  if (S.peran === 'reviewer') { location.hash = '#reviewer'; return; }
  location.hash = '#admin';
}
window.addEventListener('hashchange', function () { shell(); route(); });

/* ==========================================================================
   KONSULTAN
   ========================================================================== */
function kList() {
  S.area = 'list';
  main('<div class="bar"><select id="k-st"><option value="">Semua status (tiket aktif saya)</option>' +
    ['ditugaskan','menunggu_informasi','menunggu_review','terjawab'].map(function (s) {
      return '<option value="' + s + '"' + (S.filter === s ? ' selected' : '') + '>' + esc(lbl(s)) + '</option>';
    }).join('') + '</select></div><div id="k-daftar"><p class="boot">Memuat…</p></div>');
  $('#k-st').onchange = function () { S.filter = this.value; muatK(); };
  muatK();
}
function muatK() {
  api('consultation-consultant', { action: 'list', status: S.filter || null, limit: 50, offset: 0 }).then(baca).then(function (d) {
    var t = (d && d.tiket) || [];
    $('#k-daftar').innerHTML = t.length ? t.map(rowTiket).join('') : '<p class="empty">Belum ada tiket yang ditugaskan kepada Anda' + (S.filter ? ' dengan status ' + esc(lbl(S.filter)) : '') + '.</p>';
    $$('#k-daftar [data-tiket]').forEach(function (b) { b.onclick = function () { kDetail(b.getAttribute('data-tiket')); }; });
  }).catch(function (e) { if (!e.stop) $('#k-daftar').innerHTML = galat(e.msg || 'Gagal memuat daftar.'); });
}
function rowTiket(t) {
  return '<div class="rrow"><div class="rh"><span>' + esc(t.nomor_tiket) + ' · ' + esc(fd(t.created_at)) + '</span><span>' + slaChip(t) + '</span></div>' +
    '<div><b>' + esc(t.judul) + '</b> ' + chip(t.status) + '</div>' +
    '<div class="foot"><button class="btn s" data-tiket="' + esc(t.id) + '">Buka detail</button></div></div>';
}
function kDetail(id) {
  main('<p class="boot">Memuat detail…</p>');
  api('consultation-consultant', { action: 'detail', ticket: id }).then(baca).then(function (d) {
    var t = d.ticket || {};
    var bolehJawab = t.status === 'ditugaskan' || t.status === 'menunggu_informasi';
    main(
      '<p><button class="btn o s" id="d-back">← Kembali ke daftar</button></p>' +
      '<div class="panel"><div class="rh" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
      '<span><b>' + esc(t.nomor_tiket) + '</b> · dibuat ' + esc(fd(t.created_at)) + '</span><span>' + chip(t.status) + ' ' + slaChip(t) + '</span></div>' +
      '<h2 style="margin:.6rem 0">' + esc(t.judul) + '</h2>' +
      (t.alasan_penolakan ? '<p class="note">Ditolak: ' + esc(t.alasan_penolakan) + '</p>' : '') +
      '<p style="white-space:pre-wrap">' + esc(t.isi_pertanyaan || '') + '</p>' +
      '<h4>Riwayat penanganan</h4>' + penugasanRingkas(d.penugasan) + reviewRingkas(d.review) +
      lampiranStaf(t.id) + '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Percakapan</h3>' + pesanList(d.pesan) + '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Susun jawaban</h3>' +
      (bolehJawab
        ? '<div class="form">' +
          '<div class="fld" id="f-jwb"><label for="k-jwb">Jawaban untuk pemohon <small class="h">(10–10000 karakter; masuk antrean review, status selalu menjadi “menunggu review”)</small></label>' +
          '<textarea id="k-jwb" rows="8" maxlength="10000"></textarea><span class="em" id="e-jwb"></span></div>' +
          '<div class="foot"><button class="btn" id="k-kirim">Kirim ke review</button></div></div>'
        : '<p class="note">Jawaban hanya dapat dikirim saat tiket berstatus “Ditugaskan” atau “Menunggu informasi pemohon”' +
          (t.status === 'menunggu_review' ? ' — jawaban Anda sedang menunggu review.' : '.') + '</p>') +
      '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Catatan internal</h3>' +
      '<div class="form"><div class="fld" id="f-int"><label for="k-int">Catatan internal <small class="h">(tidak terlihat pemohon, maksimal 10000 karakter)</small></label>' +
      '<textarea id="k-int" rows="3" maxlength="10000"></textarea><span class="em" id="e-int"></span></div>' +
      '<div class="foot"><button class="btn g" id="k-int-kirim">Simpan catatan</button></div></div></div>')
      ;
    $('#d-back').onclick = kList;
    if ($('#k-kirim')) $('#k-kirim').onclick = function () { kJawab(t.id); };
    $('#k-int-kirim').onclick = function () { kInternal(t.id); };
    pasangLampiran();
  }).catch(function (e) { if (!e.stop) main(galat(e.msg || 'Gagal memuat detail.') + '<p><button class="btn o s" id="d-back2">← Kembali</button></p>'), ($('#d-back2') && ($('#d-back2').onclick = kList)); });
}
function kJawab(id) {
  var isi = val($('#k-jwb'));
  setErr('#e-jwb', '');
  if (isi.length < 10) { setErr('#e-jwb', 'Jawaban minimal 10 karakter.'); return; }
  if (isi.length > 10000) { setErr('#e-jwb', 'Jawaban maksimal 10000 karakter.'); return; }
  var b = $('#k-kirim'); b.disabled = true; b.textContent = 'Mengirim…';
  api('consultation-consultant', { action: 'answer', ticket: id, isi: isi }).then(baca).then(function () {
    toast('Jawaban terkirim — menunggu review.');
    kDetail(id);
  }).catch(function (e) { b.disabled = false; b.textContent = 'Kirim ke review'; if (!e.stop) setErr('#e-jwb', e.msg || 'Gagal mengirim jawaban.'); });
}
function kInternal(id) {
  var isi = val($('#k-int'));
  setErr('#e-int', '');
  if (!isi.trim()) { setErr('#e-int', 'Catatan tidak boleh kosong.'); return; }
  if (isi.length > 10000) { setErr('#e-int', 'Catatan maksimal 10000 karakter.'); return; }
  var b = $('#k-int-kirim'); b.disabled = true;
  api('consultation-consultant', { action: 'message', ticket: id, isi: isi }).then(baca).then(function () {
    toast('Catatan internal tersimpan.'); kDetail(id);
  }).catch(function (e) { b.disabled = false; if (!e.stop) setErr('#e-int', e.msg || 'Gagal menyimpan catatan.'); });
}

/* ---------- komponen render bersama ---------- */
function pesanList(pesan) {
  if (!pesan || !pesan.length) return '<p class="empty">Belum ada pesan.</p>';
  return pesan.map(function (m) {
    var pengirim = m.pengirim_jenis === 'pemohon' ? 'Pemohon' : (m.pengirim_jenis === 'konsultan' ? 'Konsultan' : 'Staf');
    var jenis = { pertanyaan: 'pertanyaan', pesan_pemohon: 'pesan pemohon', jawaban_konsultan: 'jawaban konsultan', catatan_internal: 'catatan internal', jawaban_final: 'jawaban final' }[m.jenis_pesan] || m.jenis_pesan;
    var internal = m.terlihat_pemohon === false;
    return '<div class="rrow"><div class="rh"><span>' + esc(pengirim) + ' · ' + esc(fdt(m.created_at)) + '</span><span>' +
      (internal ? '<span class="chip x">internal — tidak terlihat pemohon</span> ' : '') + esc(jenis) + '</span></div>' +
      '<div style="white-space:pre-wrap">' + esc(m.isi || '') + '</div></div>';
  }).join('');
}
function reviewRingkas(review) {
  if (!review || !review.length) return '';
  return '<h4>Review</h4>' + review.map(function (r) {
    return '<p>' + esc(fdt(r.reviewed_at)) + ' — <b>' + (r.keputusan === 'disetujui' ? 'Disetujui' : 'Minta revisi') + '</b>' +
      (r.catatan ? ' · catatan: ' + esc(r.catatan) : '') + '</p>';
  }).join('');
}
function penugasanRingkas(asg) {
  if (!asg || !asg.length) return '';
  return '<h4>Penugasan</h4>' + asg.map(function (a) {
    return '<p>' + esc(a.konsultan_email) + ' · ditugaskan oleh ' + esc(a.ditugaskan_oleh || '—') + ' pada ' + esc(fdt(a.ditugaskan_at)) +
      (a.dilepas_at ? ' · dilepas ' + esc(fdt(a.dilepas_at)) + (a.alasan_pelepasan ? ' (' + esc(a.alasan_pelepasan) + ')' : '') : '') + '</p>';
  }).join('');
}
/* Backend staf belum menyediakan daftar lampiran per tiket (hanya unduh per-ID
   dengan pemeriksaan kewenangan di database). Antarmuka memakai endpoint resmi
   itu; daftar lengkap dicatat sebagai hambatan pada laporan Fase 4. */
function lampiranStaf(ticketId) {
  return '<h4>Lampiran</h4>' +
    '<p class="note">Daftar lampiran belum disediakan backend untuk staf. Bila Anda memiliki ID lampiran (mis. dari unggahan sendiri), masukkan untuk mengunduh dengan pemeriksaan kewenangan tetap dijalankan backend.</p>' +
    '<div class="bar"><input id="lamp-id" placeholder="ID lampiran (uuid)" style="min-width:240px">' +
    '<button class="btn o s" id="lamp-ambil" data-ticket="' + esc(ticketId) + '">Unduh</button><span class="em" id="lamp-err"></span></div>';
}
function pasangLampiran() {
  var b = $('#lamp-ambil');
  if (!b) return;
  b.onclick = function () {
    var id = val($('#lamp-id')).trim(), err = $('#lamp-err');
    err.textContent = '';
    if (!id) { err.textContent = 'ID lampiran wajib diisi.'; return; }
    b.disabled = true; b.textContent = 'Memproses…';
    api('consultation-attachment', { action: 'download', attachment: id }).then(baca).then(function (d) {
      b.disabled = false; b.textContent = 'Unduh';
      if (d && d.signed_url) { window.open(d.signed_url, '_blank'); toast('Tautan unduhan dibuka (berlaku 120 detik).'); }
      else err.textContent = 'Respons unduhan tidak dikenali.';
    }).catch(function (e) { b.disabled = false; b.textContent = 'Unduh'; err.textContent = e.msg || 'Gagal mengunduh lampiran.'; });
  };
}

/* ==========================================================================
   REVIEWER
   ========================================================================== */
function rList() {
  main('<p class="note">Antrean berisi tiket yang jawaban konsultannya menunggu pemeriksaan Anda.</p>' +
    '<div id="r-daftar"><p class="boot">Memuat…</p></div>');
  muatR();
}
function muatR() {
  api('consultation-review', { action: 'list', limit: 50, offset: 0 }).then(baca).then(function (d) {
    var t = (d && d.tiket) || [];
    $('#r-daftar').innerHTML = t.length ? t.map(rowTiket).join('') : '<p class="empty">Tidak ada jawaban yang menunggu review.</p>';
    $$('#r-daftar [data-tiket]').forEach(function (b) { b.onclick = function () { rDetail(b.getAttribute('data-tiket')); }; });
  }).catch(function (e) { if (!e.stop) $('#r-daftar').innerHTML = galat(e.msg || 'Gagal memuat antrean.'); });
}
function rDetail(id) {
  main('<p class="boot">Memuat detail…</p>');
  api('consultation-review', { action: 'detail', ticket: id }).then(baca).then(function (d) {
    var t = d.ticket || {};
    var terbaru = jawabanKonsultanTerakhir(d.pesan);
    var review = d.review || [];
    var sudah = terbaru && review.length && review[0].message_id === terbaru.id;
    main(
      '<p><button class="btn o s" id="d-back">← Kembali ke antrean</button></p>' +
      '<div class="panel"><div class="rh" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
      '<span><b>' + esc(t.nomor_tiket) + '</b> · dibuat ' + esc(fd(t.created_at)) + '</span><span>' + chip(t.status) + '</span></div>' +
      '<h2 style="margin:.6rem 0">' + esc(t.judul) + '</h2>' +
      '<p style="white-space:pre-wrap">' + esc(t.isi_pertanyaan || '') + '</p></div>' +
      '<div class="panel"><h3 style="margin-top:0">Percakapan</h3>' + pesanList(d.pesan) + '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Keputusan review</h3>' +
      (sudah ? '<p class="note ok">Jawaban terbaru sudah diputus: ' + (review[0].keputusan === 'disetujui' ? 'disetujui' : 'minta revisi') + '.</p>' : '') +
      (terbaru
        ? '<div class="form">' +
          '<div class="fld"><label>Catatan (wajib saat minta revisi, 3–2000 karakter)</label>' +
          '<textarea id="r-cat" rows="4" maxlength="2000"></textarea><span class="em" id="e-cat"></span></div>' +
          '<div class="foot"><button class="btn" id="r-setuju">Setujui jawaban</button>' +
          '<button class="btn d" id="r-revisi">Minta revisi</button></div>' +
          '<p class="note">Keputusan bersifat permanen (append-only) dan berlaku untuk jawaban terbaru dari konsultan.</p></div>'
        : '<p class="empty">Belum ada jawaban konsultan pada tiket ini.</p>') +
      reviewRingkas(review) + '</div>');
    $('#d-back').onclick = rList;
    if ($('#r-setuju')) {
      $('#r-setuju').onclick = function () { rPutuskan(id, terbaru.id, 'disetujui'); };
      $('#r-revisi').onclick = function () { rPutuskan(id, terbaru.id, 'minta_revisi'); };
    }
  }).catch(function (e) { if (!e.stop) main(galat(e.msg || 'Gagal memuat detail.') + '<p><button class="btn o s" id="d-back2">← Kembali</button></p>'), ($('#d-back2') && ($('#d-back2').onclick = rList)); });
}
function jawabanKonsultanTerakhir(pesan) {
  var l = (pesan || []).filter(function (m) { return m.jenis_pesan === 'jawaban_konsultan'; });
  return l.length ? l[l.length - 1] : null;
}
function rPutuskan(id, messageId, keputusan) {
  var cat = val($('#r-cat'));
  setErr('#e-cat', '');
  if (keputusan === 'minta_revisi') {
    if (cat.trim().length < 3) { setErr('#e-cat', 'Catatan revisi wajib diisi (minimal 3 karakter).'); return; }
    if (cat.length > 2000) { setErr('#e-cat', 'Catatan maksimal 2000 karakter.'); return; }
  }
  var btns = $$('#r-setuju,#r-revisi'); btns.forEach(function (b) { b.disabled = true; });
  var body = { ticket: id, message: messageId, keputusan: keputusan };
  if (cat.trim()) body.catatan = cat.trim();
  api('consultation-review', Object.assign({ action: 'decide' }, body)).then(baca).then(function (d) {
    toast(keputusan === 'disetujui' ? 'Jawaban disetujui — tiket menjadi terjawab.' : 'Revisi diminta — tiket kembali ke konsultan.');
    rDetail(id);
  }).catch(function (e) { btns.forEach(function (b) { b.disabled = false; }); if (!e.stop) setErr('#e-cat', e.msg || 'Gagal menyimpan keputusan.'); });
}

/* ==========================================================================
   ADMIN KONSULTASI — tiket
   ========================================================================== */
function aList() {
  main('<div class="bar"><select id="a-st"><option value="">Semua status</option>' +
    STATUS.map(function (s) { return '<option value="' + s + '"' + (S.filter === s ? ' selected' : '') + '>' + esc(lbl(s)) + '</option>'; }).join('') +
    '</select></div><div id="a-daftar"><p class="boot">Memuat…</p></div>');
  $('#a-st').onchange = function () { S.filter = this.value; muatA(); };
  muatA();
}
function muatA() {
  api('consultation-admin', { action: 'list', status: S.filter || null, limit: 50, offset: 0 }).then(baca).then(function (d) {
    var t = (d && d.tiket) || [];
    $('#a-daftar').innerHTML = t.length ? t.map(rowTiket).join('') : '<p class="empty">Tidak ada tiket' + (S.filter ? ' dengan status ' + esc(lbl(S.filter)) : '') + '.</p>';
    $$('#a-daftar [data-tiket]').forEach(function (b) { b.onclick = function () { aDetail(b.getAttribute('data-tiket')); }; });
  }).catch(function (e) { if (!e.stop) $('#a-daftar').innerHTML = galat(e.msg || 'Gagal memuat daftar.'); });
}
function aSla() {
  main('<div id="sla-daftar"><p class="boot">Memuat…</p></div>');
  api('consultation-admin', { action: 'sla' }).then(baca).then(function (d) {
    var t = (d && d.tiket) || [];
    $('#sla-daftar').innerHTML = t.length ? t.map(function (x) {
      return '<div class="rrow"><div class="rh"><span>' + esc(x.nomor_tiket) + ' · ' + esc(fd(x.created_at)) + '</span>' +
        (x.terlambat ? '<span class="chip x">TERLAMBAT</span>' : '<span class="chip">Dalam batas</span>') + '</div>' +
        '<div><b>' + esc(x.judul) + '</b> ' + chip(x.status) + '</div>' +
        '<div>Deadline: ' + esc(fdt(x.sla_deadline)) + '</div>' +
        '<div class="foot"><button class="btn s" data-tiket="' + esc(x.id) + '">Buka detail</button></div></div>';
    }).join('') : '<p class="empty">Tidak ada tiket aktif (semua selesai/ditolak).</p>';
    $$('#sla-daftar [data-tiket]').forEach(function (b) { b.onclick = function () { aDetail(b.getAttribute('data-tiket')); }; });
  }).catch(function (e) { if (!e.stop) $('#sla-daftar').innerHTML = galat(e.msg || 'Gagal memuat SLA.'); });
}
function aDetail(id) {
  main('<p class="boot">Memuat detail…</p>');
  api('consultation-admin', { action: 'detail', ticket: id }).then(baca).then(function (d) {
    var t = d.ticket || {}, k = d.kontak;
    main(
      '<p><button class="btn o s" id="d-back">← Kembali ke daftar</button></p>' +
      '<div class="panel"><div class="rh" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
      '<span><b>' + esc(t.nomor_tiket) + '</b> · dibuat ' + esc(fd(t.created_at)) + '</span><span>' + chip(t.status) + ' ' + slaChip(t) + '</span></div>' +
      '<h2 style="margin:.6rem 0">' + esc(t.judul) + '</h2>' +
      (t.alasan_penolakan ? '<p class="note">Ditolak: ' + esc(t.alasan_penolakan) + '</p>' : '') +
      '<p style="white-space:pre-wrap">' + esc(t.isi_pertanyaan || '') + '</p>' +
      '<h4>Kontak pemohon</h4>' + (k
        ? '<p>Nama: ' + esc(k.nama || '—') + ' · WhatsApp: ' + esc(k.whatsapp || '—') + ' · Email: ' + esc(k.email || '—') +
          '<br>Persetujuan publikasi: <b>' + (k.persetujuan_publikasi ? 'diberikan' : 'belum') + '</b></p>'
        : '<p class="empty">—</p>') + '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Percakapan</h3>' + pesanList(d.pesan) + '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Riwayat</h3>' + penugasanRingkas(d.penugasan) + reviewRingkas(d.review) + '</div>' +
      aRiwayat(id) + aAksi(t.id, t.status) + aPesan(t.id) + lampiranStaf(t.id));
    $('#d-back').onclick = aList;
    pasangAksi(id, t.status);
    pasangPesanAdmin(id);
    pasangLampiran();
  }).catch(function (e) { if (!e.stop) main(galat(e.msg || 'Gagal memuat detail.') + '<p><button class="btn o s" id="d-back2">← Kembali</button></p>'), ($('#d-back2') && ($('#d-back2').onclick = aList)); });
}
function aRiwayat(id) {
  return '<div class="panel"><h3 style="margin-top:0">Riwayat perubahan</h3><div id="a-hist"><p class="boot">Memuat riwayat…</p></div></div>';
}
function muatRiwayat(id) {
  api('consultation-admin', { action: 'history', ticket: id }).then(baca).then(function (d) {
    var s = (d && d.status) || [], a = (d && d.audit) || [];
    $('#a-hist').innerHTML =
      '<h4>Status</h4>' + (s.length ? s.map(function (x) {
        return '<p>' + esc(fdt(x.at)) + ' — ' + esc(lbl(x.status_lama)) + ' → <b>' + esc(lbl(x.status_baru)) + '</b>' +
          (x.oleh ? ' · oleh ' + esc(x.oleh) : '') + (x.alasan ? ' · ' + esc(x.alasan) : '') + '</p>';
      }).join('') : '<p class="empty">—</p>') +
      '<h4>Audit</h4>' + (a.length ? a.map(function (x) {
        return '<p>' + esc(fdt(x.at)) + ' — ' + esc(x.aksi) + ' · ' + esc(x.aktor_jenis) + (x.aktor ? ' (' + esc(x.aktor) + ')' : '') +
          (x.detail ? ' · ' + esc(typeof x.detail === 'string' ? x.detail : JSON.stringify(x.detail)) : '') + '</p>';
      }).join('') : '<p class="empty">—</p>');
  }).catch(function (e) { if (!e.stop) $('#a-hist').innerHTML = galat(e.msg || 'Gagal memuat riwayat.'); });
}
function aAksi(id, status) {
  return '<div class="panel"><h3 style="margin-top:0">Aksi admin</h3><div class="form">' +
    '<div class="foot"><button class="btn s" id="a-verify">Verifikasi tiket</button></div>' +
    '<div class="fld" id="f-tolak"><label>Tolak tiket <small class="h">(alasan wajib, 3–1000 karakter)</small></label>' +
    '<textarea id="a-tolak" rows="2" maxlength="1000"></textarea><span class="em" id="e-tolak"></span>' +
    '<div class="foot"><button class="btn d s" id="a-tolak-kirim">Tolak</button></div></div>' +
    '<div class="fld" id="f-tugas"><label>Tugaskan konsultan <small class="h">(email staf berperan konsultan)</small></label>' +
    '<input type="text" id="a-tugas" placeholder="nama@domain.tld"><span class="em" id="e-tugas"></span>' +
    '<div class="foot"><button class="btn s" id="a-tugas-kirim">Tugaskan</button></div></div>' +
    '<div class="fld" id="f-lepas"><label>Lepas penugasan <small class="h">(alasan wajib, 3–1000 karakter)</small></label>' +
    '<textarea id="a-lepas" rows="2" maxlength="1000"></textarea><span class="em" id="e-lepas"></span>' +
    '<div class="foot"><button class="btn d s" id="a-lepas-kirim">Lepas</button></div></div>' +
    '<div class="fld" id="f-status"><label>Ubah status</label><select id="a-status">' +
    STATUS.map(function (s) { return '<option value="' + s + '">' + esc(lbl(s)) + '</option>'; }).join('') + '</select>' +
    '<small class="h">Alasan (opsional, 3–1000 karakter; dari “menunggu review” transisi hanya boleh lewat keputusan reviewer)</small>' +
    '<textarea id="a-status-alasan" rows="2" maxlength="1000"></textarea><span class="em" id="e-status"></span>' +
    '<div class="foot"><button class="btn s" id="a-status-kirim">Simpan status</button></div></div>' +
    '</div></div>';
}
function pasangAksi(id, status) {
  muatRiwayat(id);
  var v = $('#a-verify'); if (v) v.onclick = function () { v.disabled = true; api('consultation-admin', { action: 'verify', ticket: id }).then(baca).then(function () { toast('Tiket diverifikasi.'); aDetail(id); }).catch(function (e) { v.disabled = false; if (!e.stop) toast(e.msg || 'Gagal memverifikasi.', 1); }); };
  $('#a-tolak-kirim').onclick = function () {
    var a = val($('#a-tolak')); setErr('#e-tolak', '');
    if (a.trim().length < 3) { setErr('#e-tolak', 'Alasan wajib diisi (minimal 3 karakter).'); return; }
    if (a.length > 1000) { setErr('#e-tolak', 'Alasan maksimal 1000 karakter.'); return; }
    this.disabled = true;
    api('consultation-admin', { action: 'reject', ticket: id, alasan: a.trim() }).then(baca).then(function () { toast('Tiket ditolak.'); aDetail(id); })
      .catch(function (e) { $('#a-tolak-kirim').disabled = false; if (!e.stop) setErr('#e-tolak', e.msg || 'Gagal menolak tiket.'); });
  };
  $('#a-tugas-kirim').onclick = function () {
    var k = val($('#a-tugas')).trim(); setErr('#e-tugas', '');
    if (!EMAIL_RE.test(k)) { setErr('#e-tugas', 'Email konsultan tidak valid.'); return; }
    this.disabled = true;
    api('consultation-admin', { action: 'assign', ticket: id, konsultan: k }).then(baca).then(function () { toast('Tiket ditugaskan.'); aDetail(id); })
      .catch(function (e) { $('#a-tugas-kirim').disabled = false; if (!e.stop) setErr('#e-tugas', e.msg || 'Gagal menugaskan.'); });
  };
  $('#a-lepas-kirim').onclick = function () {
    var a = val($('#a-lepas')); setErr('#e-lepas', '');
    if (a.trim().length < 3) { setErr('#e-lepas', 'Alasan wajib diisi (minimal 3 karakter).'); return; }
    if (a.length > 1000) { setErr('#e-lepas', 'Alasan maksimal 1000 karakter.'); return; }
    this.disabled = true;
    api('consultation-admin', { action: 'release', ticket: id, alasan: a.trim() }).then(baca).then(function () { toast('Penugasan dilepas.'); aDetail(id); })
      .catch(function (e) { $('#a-lepas-kirim').disabled = false; if (!e.stop) setErr('#e-lepas', e.msg || 'Gagal melepas penugasan.'); });
  };
  $('#a-status-kirim').onclick = function () {
    var s = $('#a-status').value, a = val($('#a-status-alasan')); setErr('#e-status', '');
    if (a.trim() && a.length > 1000) { setErr('#e-status', 'Alasan maksimal 1000 karakter.'); return; }
    var body = { action: 'status', ticket: id, status: s };
    if (a.trim()) body.alasan = a.trim();
    this.disabled = true;
    api('consultation-admin', body).then(baca).then(function () { toast('Status diperbarui.'); aDetail(id); })
      .catch(function (e) { $('#a-status-kirim').disabled = false; if (!e.stop) setErr('#e-status', e.msg || 'Gagal mengubah status.'); });
  };
}
function aPesan(id) {
  return '<div class="panel"><h3 style="margin-top:0">Kirim pesan</h3><div class="form">' +
    '<div class="chk"><input type="checkbox" id="a-vis"><label for="a-vis">Terlihat pemohon <small class="h">(tanpa tanda ini pesan menjadi catatan internal; “jawaban final” hanya boleh saat tiket terjawab/selesai dan jawaban terbaru telah disetujui reviewer)</small></label></div>' +
    '<div class="fld" id="f-pesan"><label for="a-pesan">Isi pesan <small class="h">(1–10000 karakter)</small></label>' +
    '<textarea id="a-pesan" rows="5" maxlength="10000"></textarea><span class="em" id="e-pesan"></span></div>' +
    '<div class="foot"><button class="btn" id="a-pesan-kirim">Kirim pesan</button></div></div></div>';
}
function pasangPesanAdmin(id) {
  $('#a-pesan-kirim').onclick = function () {
    var isi = val($('#a-pesan')); setErr('#e-pesan', '');
    if (!isi.trim()) { setErr('#e-pesan', 'Pesan tidak boleh kosong.'); return; }
    if (isi.length > 10000) { setErr('#e-pesan', 'Pesan maksimal 10000 karakter.'); return; }
    var internal = !$('#a-vis').checked;
    this.disabled = true;
    api('consultation-admin', { action: 'message', ticket: id, isi: isi, internal: internal }).then(baca).then(function () {
      toast(internal ? 'Catatan internal tersimpan.' : 'Jawaban final diterbitkan.');
      aDetail(id);
    }).catch(function (e) { $('#a-pesan-kirim').disabled = false; if (!e.stop) setErr('#e-pesan', e.msg || 'Gagal mengirim pesan.'); });
  };
}

/* ==========================================================================
   PUBLIKASI
   ========================================================================== */
function pubPanelHTML(t) {
  var p = t.publikasi || {};
  var st = p.published ? 'TERBIT' : (p.dicabut ? 'DICABUT' : 'BELUM TERBIT');
  return '<div class="rrow"><div class="rh"><span>' + esc(p.slug ? '/' + p.slug : '(tanpa slug)') + '</span><span>' +
    (p.published ? '<span class="chip">TERBIT · ' + esc(fdt(p.published_at)) + '</span>' : (p.dicabut ? '<span class="chip x">DICABUT ' + esc(fdt(p.dicabut_at)) + '</span>' : '<span class="chip x">BELUM TERBIT</span>')) + '</span></div>' +
    '<div><b>' + esc(p.judul_publik || '—') + '</b></div>' +
    '<div>Persetujuan: pemohon ' + (p.persetujuan_pemohon ? '✓' : '✗') + ' · reviewer ' + (p.disetujui_reviewer ? '✓' : '✗') + ' · admin ' + (p.disetujui_admin ? '✓' : '✗') + '</div>' +
    (p.dicabut && p.dicabut_alasan ? '<div>Alasan pencabutan: ' + esc(p.dicabut_alasan) + '</div>' : '') + '</div>';
}
function pubAdmin() {
  main('<div class="bar"><select id="p-st"><option value="terjawab">Terjawab</option><option value="selesai">Selesai</option></select></div>' +
    '<p class="note">Alur: ajukan (admin) → setujui reviewer & admin → terbitkan (slug). Pencabutan menghapus semua stamp persetujuan sehingga perlu pengajuan + persetujuan ulang.</p>' +
    '<div id="p-daftar"><p class="boot">Memuat…</p></div>');
  $('#p-st').onchange = function () { muatPub(this.value); };
  muatPub('terjawab');
}
function muatPub(status) {
  api('consultation-admin', { action: 'list', status: status, limit: 50, offset: 0 }).then(baca).then(function (d) {
    var t = (d && d.tiket) || [];
    $('#p-daftar').innerHTML = t.length ? t.map(rowTiket).join('') : '<p class="empty">Tidak ada tiket ' + esc(lbl(status)) + '.</p>';
    $$('#p-daftar [data-tiket]').forEach(function (b) { b.onclick = function () { pubDetail(b.getAttribute('data-tiket')); }; });
  }).catch(function (e) { if (!e.stop) $('#p-daftar').innerHTML = galat(e.msg || 'Gagal memuat daftar.'); });
}
function pubDetail(id) {
  main('<p class="boot">Memuat detail…</p>');
  api('consultation-admin', { action: 'detail', ticket: id }).then(baca).then(function (d) {
    var t = d.ticket || {}, p = d.publikasi;
    var jf = (d.pesan || []).filter(function (m) { return m.jenis_pesan === 'jawaban_final'; });
    var jfIsi = jf.length ? jf[jf.length - 1].isi : '';
    main(
      '<p><button class="btn o s" id="d-back">← Kembali</button></p>' +
      '<div class="panel"><div class="rh" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
      '<span><b>' + esc(t.nomor_tiket) + '</b></span><span>' + chip(t.status) + '</span></div>' +
      '<h2 style="margin:.6rem 0">' + esc(t.judul) + '</h2>' +
      (p ? pubPanelHTML({ publikasi: p }) : '<p class="empty">Belum ada pengajuan publikasi.</p>') + '</div>' +
      '<div class="panel"><h3 style="margin-top:0">Ajukan / perbarui konten publikasi</h3>' +
      '<div class="form">' +
      '<div class="fld" id="f-judul"><label for="p-judul">Judul publik <small class="h">(5–200 karakter)</small></label><input type="text" id="p-judul" maxlength="200" value="' + esc(p ? (p.judul_publik || '') : '') + '"><span class="em" id="e-judul"></span></div>' +
      '<div class="fld" id="f-samar"><label for="p-samar">Pertanyaan samar <small class="h">(10–5000 karakter, tanpa identitas pemohon)</small></label><textarea id="p-samar" rows="3" maxlength="5000"></textarea><span class="em" id="e-samar"></span></div>' +
      '<div class="fld" id="f-jf"><label for="p-jf">Jawaban final <small class="h">(10–20000 karakter)</small></label><textarea id="p-jf" rows="8" maxlength="20000"></textarea><span class="em" id="e-jf"></span></div>' +
      '<div class="foot"><button class="btn" id="p-ajukan">Ajukan publikasi</button></div></div>' +
      '<p class="note">Memperbarui konten mengganti versi konten (revision) dan mengosongkan semua stamp persetujuan.</p></div>' +
      '<div class="panel"><h3 style="margin-top:0">Persetujuan & penerbitan</h3><div class="form">' +
      '<div class="foot"><button class="btn s" id="p-approve">Setujui (admin)</button><button class="btn o s" id="p-unapprove">Tarik persetujuan (admin)</button></div>' +
      '<div class="fld" id="f-slug"><label for="p-slug">Slug <small class="h">(6–120 karakter, huruf kecil/angka/tanda hubung)</small></label><input type="text" id="p-slug" placeholder="hukum-jual-beli-online"><span class="em" id="e-slug"></span>' +
      '<div class="foot"><button class="btn" id="p-terbit">Terbitkan</button></div></div>' +
      '<div class="fld" id="f-cabut"><label>Cabut publikasi <small class="h">(alasan wajib, 3–1000 karakter; menghapus semua persetujuan)</small></label>' +
      '<textarea id="p-cabut" rows="2" maxlength="1000"></textarea><span class="em" id="e-cabut"></span>' +
      '<div class="foot"><button class="btn d s" id="p-cabut-kirim">Cabut</button></div></div></div></div>' +
      '<div class="panel"><h3 style="margin-top:0">Konten percakapan</h3>' + pesanList(d.pesan) + '</div>');
    $('#d-back').onclick = pubAdmin;
    if (jfIsi) $('#p-jf').value = jfIsi;
    $('#p-ajukan').onclick = function () {
      var j = val($('#p-judul')).trim(), q = val($('#p-samar')).trim(), a = val($('#p-jf')).trim();
      setErr('#e-judul', ''); setErr('#e-samar', ''); setErr('#e-jf', '');
      if (j.length < 5 || j.length > 200) { setErr('#e-judul', 'Judul wajib 5–200 karakter.'); return; }
      if (q.length < 10 || q.length > 5000) { setErr('#e-samar', 'Pertanyaan samar wajib 10–5000 karakter.'); return; }
      if (a.length < 10 || a.length > 20000) { setErr('#e-jf', 'Jawaban final wajib 10–20000 karakter.'); return; }
      this.disabled = true;
      api('consultation-publication', { action: 'propose', ticket: id, judul: j, pertanyaan_samar: q, jawaban_final: a }).then(baca).then(function () {
        toast('Publikasi diajukan.'); pubDetail(id);
      }).catch(function (e) { $('#p-ajukan').disabled = false; if (!e.stop) setErr('#e-jf', e.msg || 'Gagal mengajukan publikasi.'); });
    };
    $('#p-approve').onclick = function () { pubSetuju(id, true); };
    $('#p-unapprove').onclick = function () { pubSetuju(id, false); };
    $('#p-terbit').onclick = function () {
      var s = val($('#p-slug')).trim(); setErr('#e-slug', '');
      if (!SLUG_RE.test(s)) { setErr('#e-slug', 'Slug 6–120 karakter: huruf kecil, angka, tanda hubung.'); return; }
      this.disabled = true;
      api('consultation-publication', { action: 'publish', ticket: id, slug: s }).then(baca).then(function (r) {
        toast('Terbit di /' + ((r && r.slug) || s)); pubDetail(id);
      }).catch(function (e) { $('#p-terbit').disabled = false; if (!e.stop) setErr('#e-slug', e.msg || 'Gagal menerbitkan.'); });
    };
    $('#p-cabut-kirim').onclick = function () {
      var a = val($('#p-cabut')); setErr('#e-cabut', '');
      if (a.trim().length < 3) { setErr('#e-cabut', 'Alasan wajib diisi (minimal 3 karakter).'); return; }
      if (a.length > 1000) { setErr('#e-cabut', 'Alasan maksimal 1000 karakter.'); return; }
      this.disabled = true;
      api('consultation-publication', { action: 'withdraw', ticket: id, alasan: a.trim() }).then(baca).then(function () {
        toast('Publikasi dicabut.'); pubDetail(id);
      }).catch(function (e) { $('#p-cabut-kirim').disabled = false; if (!e.stop) setErr('#e-cabut', e.msg || 'Gagal mencabut.'); });
    };
  }).catch(function (e) { if (!e.stop) main(galat(e.msg || 'Gagal memuat detail.') + '<p><button class="btn o s" id="d-back2">← Kembali</button></p>'), ($('#d-back2') && ($('#d-back2').onclick = pubAdmin)); });
}
function pubSetuju(id, setuju) {
  api('consultation-publication', { action: 'approve', ticket: id, setuju: setuju }).then(baca).then(function () {
    toast(setuju ? 'Persetujuan admin dicatat.' : 'Persetujuan admin ditarik.'); pubDetail(id);
  }).catch(function (e) { if (!e.stop) toast(e.msg || 'Gagal mencatat persetujuan.', 1); });
}
/* Reviewer: persetujuan publikasi per tiket (daftar kandidat hanya diberikan
   kepada admin oleh backend — dicatat sebagai hambatan). */
function pubReview() {
  main('<p class="note">Sebagai reviewer, Anda menyetujui publikasi per tiket. Daftar kandidat publikasi hanya disediakan backend untuk admin konsultasi — minta admin nomor/ID tiket yang sudah terjawab.</p>' +
    '<div class="panel"><div class="form"><div class="fld"><label for="pr-id">ID tiket (uuid)</label>' +
    '<input type="text" id="pr-id" placeholder="uuid tiket"><span class="em" id="e-pr"></span>' +
    '<div class="foot"><button class="btn" id="pr-lihat">Lihat status</button>' +
    '<button class="btn g" id="pr-setuju">Setujui (reviewer)</button>' +
    '<button class="btn o" id="pr-tarik">Tarik persetujuan (reviewer)</button></div></div></div></div><div id="pr-detail"></div>');
  function cek() {
    var id = val($('#pr-id')).trim(); setErr('#e-pr', '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) { setErr('#e-pr', 'ID tiket harus berupa uuid.'); return null; }
    return id;
  }
  $('#pr-lihat').onclick = function () {
    var id = cek(); if (!id) return;
    this.disabled = true;
    api('consultation-publication', { action: 'status', ticket: id }).then(baca).then(function (d) {
      $('#pr-lihat').disabled = false;
      $('#pr-detail').innerHTML = '<div class="panel"><h3 style="margin-top:0">Status publikasi</h3>' +
        pubPanelHTML({ publikasi: d.publikasi || {} }) +
        '<p>Tiket: <b>' + esc((d.ticket && d.ticket.nomor_tiket) || '—') + '</b> ' + chip((d.ticket && d.ticket.status) || '') + '</p></div>';
    }).catch(function (e) { $('#pr-lihat').disabled = false; if (!e.stop) setErr('#e-pr', e.msg || 'Gagal memuat status.'); });
  };
  function suka(setuju) {
    var id = cek(); if (!id) return;
    api('consultation-publication', { action: 'approve', ticket: id, setuju: setuju }).then(baca).then(function () {
      toast(setuju ? 'Persetujuan reviewer dicatat.' : 'Persetujuan reviewer ditarik.');
    }).catch(function (e) { if (!e.stop) setErr('#e-pr', e.msg || 'Gagal mencatat persetujuan.'); });
  }
  $('#pr-setuju').onclick = function () { suka(true); };
  $('#pr-tarik').onclick = function () { suka(false); };
}

/* ---------- boot ---------- */
function boot() {
  if (!sb || !C.supabaseKey) { setup(); return; }
  sb.auth.getSession().then(function (r) {
    var sesi = r && r.data && r.data.session;
    if (!sesi) { login(); return; }
    S.sesi = sesi.access_token;
    S.email = (sesi.user && sesi.user.email) || '';
    return deteksiPeran().then(function (peran) {
      if (!peran) { denied(S.email); return; }
      S.peran = peran;
      shell();
      route();
    });
  }).catch(function (e) { fatal(e && e.message || 'Gagal memeriksa sesi.'); });
}
boot();
})();
