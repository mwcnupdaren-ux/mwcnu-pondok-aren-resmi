/* Admin CMS MWCNU Pondok Aren. Keamanan sebenarnya ada di aturan akses database (supabase/schema.sql),
   tampilan ini hanya antarmuka. */
(function () {
'use strict';
var C = window.MWC_CFG || {};
var sb = window.__SB__ || ((window.supabase && C.supabaseUrl && C.supabaseKey) ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null);
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
var BL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function fd(iso) { var p = String(iso || '').split('-'); return p.length == 3 && +p[0] ? (+p[2]) + ' ' + BL[+p[1] - 1] + ' ' + p[0] : (iso || ''); }
var RT = ['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung','Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat','Pondok Kacang Timur','Parigi Baru','Parigi Lama'];
var TOPIK = ['Ibadah','Akidah','Akhlak & tasawuf','Muamalah','Keluarga','Waris & wasiat','Amaliyah NU','Lainnya'];
var HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad','Beberapa hari dalam sepekan'];
var LINKS = ['#layanan','#ambulans','#zis','#majelis','#konsultasi','#daftar','#berita','#agenda','#galeri','#ranting','#banom','#struktur','#video','#program'];
var IKON = ['ambulans','zakat','majelis','konsultasi','beasiswa','kesehatan','info','kalender','buku','hati','telepon','lokasi'];
var HALAMAN = ['sejarah','visi','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];
var T = function (k, l, o) { o = o || {}; o.k = k; o.l = l; o.t = o.t || 'text'; return o; };

var COLS = {
 berita: { l: 'Berita & Jurnal', g: 'Konten', e: 'jurnalis', ord: 'date', ti: function (d) { return d.judul; }, su: function (d) { return fd(d.tanggal) + ' · ' + (d.kategori || ''); }, F: [
  T('kategori','Kategori',{t:'select',o:['Berita','Laporan','Literasi','Opini'],req:1}), T('judul','Judul',{req:1}), T('penulis','Penulis',{h:'Contoh: Redaksi MWCNU / Nama jurnalis.'}),
  T('tanggal','Tanggal',{t:'date',req:1}), T('tag','Tag / kata kunci',{h:'Pisah dengan koma. Contoh: Halal Bi Halal, Pondok Aren'}),
  T('featured','Sorotan beranda',{t:'bool'}),
  T('ringkasan','Ringkasan (tampil di daftar berita)',{t:'area'}), T('foto','Foto utama',{t:'image',f:'berita'}), T('lead','Paragraf pembuka',{t:'area'}),
  T('caption','Keterangan foto'), T('meta_judul','Judul SEO',{h:'Kosongkan bila mengikuti judul.'}), T('meta_desc','Deskripsi SEO',{t:'area',h:'1–2 kalimat untuk mesin pencari & berbagi. Kosongkan bila mengikuti ringkasan.'}),
  T('isi','Isi berita',{t:'rich',h:'Pisahkan paragraf dengan satu baris kosong.'}),
  T('info','Info kegiatan',{t:'area',h:'Satu baris satu info dengan format "Label: nilai". Contoh: Tempat: Aula MWC'}),
  T('foto_tambahan','Foto tambahan',{t:'images',f:'berita'}), T('video','Video terkait',{t:'area',h:'Tempel tautan atau ID YouTube video yang sudah ada di daftar Video TVNU, satu per baris.'})] },
 agenda: { l: 'Agenda', g: 'Konten', e: 'pengurus', ord: 'date', ti: function (d) { return d.judul; }, su: function (d) { return fd(d.tanggal) + ' · ' + (d.lokasi || ''); }, F: [
  T('tanggal','Tanggal',{t:'date',req:1}), T('judul','Nama kegiatan',{req:1}), T('kategori','Kategori',{h:'Contoh: Lailatul Ijtima\', Rapat, Turba'}), T('lokasi','Lokasi')] },
 video: { l: 'Video TVNU', g: 'Konten', e: 'pengurus', ord: 'date', ti: function (d) { return d.judul; }, su: function (d) { return fd(d.tanggal) + ' · ' + (d.youtube || ''); }, F: [
  T('youtube','Tautan atau ID YouTube',{req:1,h:'Contoh: https://youtu.be/ZDuEPPinBTA atau cukup ZDuEPPinBTA'}), T('judul','Judul video',{req:1}), T('tanggal','Tanggal tayang',{t:'date'})] },
 galeri: { l: 'Galeri Foto', g: 'Konten', e: 'pengurus', ti: function (d) { return d.judul; }, su: function (d) { return d.kegiatan || ''; }, F: [
  T('foto','Foto',{t:'image',f:'galeri',req:1}), T('judul','Keterangan foto',{req:1}), T('kegiatan','Kegiatan',{h:'Dipakai sebagai kategori saat foto difilter. Contoh: Halal Bi Halal'})] },
 kegiatan: { l: 'Kegiatan Pilihan', g: 'Konten', e: 'pengurus', ti: function (d) { return d.judul; }, su: function (d) { return (d.lokasi || '') + ' · ' + (d.tanggal || ''); }, F: [
  T('foto','Foto',{t:'image',f:'kegiatan',req:1}), T('judul','Judul',{req:1}), T('lokasi','Keterangan / lokasi'), T('tanggal','Tanggal (teks)',{h:'Contoh: 26 Apr 2026'})] },
 majelis: { l: 'Majelis Taklim', g: 'Konten', e: 'pengurus', ti: function (d) { return d.nama; }, su: function (d) { return [d.hari, d.jam, d.ranting].filter(Boolean).join(' · '); }, F: [
  T('nama','Nama majelis',{req:1}), T('asuh','Pengasuh / ustadz'), T('hari','Hari',{t:'select',o:HARI}), T('jam','Jam',{h:'Contoh: 19.30'}), T('tempat','Tempat'), T('ranting','Ranting / kelurahan',{t:'select',o:RT}), T('hp','Nomor HP kontak',{h:'Contoh: 0812xxxxxxx'})] },
 tanya_jawab: { l: 'Tanya Jawab Agama', g: 'Konten', e: 'ustadz', ti: function (d) { return d.q; }, su: function (d) { return d.k || ''; }, F: [
  T('k','Topik',{t:'select',o:TOPIK,req:1}), T('q','Pertanyaan',{t:'area',req:1}), T('a','Jawaban',{t:'rich',req:1,h:'Jawaban sebaiknya sudah ditinjau pengurus yang berwenang.'})] },
 layanan: { l: 'Program & Layanan', g: 'Beranda', e: 'admin', filter: null, ti: function (d) { return d.judul; }, su: function (d) { return (d.tampil === false ? 'Disembunyikan · ' : '') + (d.tautan || ''); }, F: [
  T('judul','Judul',{req:1}), T('deskripsi','Deskripsi singkat',{t:'area'}), T('ikon','Ikon',{t:'select',o:IKON,req:1}), T('tautan','Tautan tujuan',{dl:LINKS,h:'Halaman internal (contoh #ambulans) atau alamat lengkap https://…'}), T('tampil','Tampilkan di beranda',{t:'bool'})] },
 program: { l: 'Program Khidmat', g: 'Beranda', e: 'admin', ti: function (d) { return d.judul; }, su: function (d) { return d.tombol || ''; }, F: [
  T('judul','Judul',{req:1}), T('deskripsi','Deskripsi',{t:'area'}), T('kegiatan','Daftar kegiatan',{t:'area',h:'Satu baris satu kegiatan.'}), T('tombol','Teks tombol'), T('tautan','Tautan tombol',{dl:LINKS})] },
 pengurus: { l: 'Struktur Pengurus', g: 'Organisasi', e: 'admin', filter: 'bagian', ti: function (d) { return d.nama; }, su: function (d) { return (d.jabatan || '') + ' · ' + (d.bagian || ''); }, F: [
  T('bagian','Bagian',{t:'select',o:['Mustasyar','Syuriyah','Tanfidziyah','Badan otonom'],req:1}), T('jabatan','Jabatan',{req:1,h:'Contoh: Rois, Wakil Rois, Ketua, Sekretaris'}), T('nama','Nama dan gelar',{req:1})] },
 ranting: { l: 'Ranting (PRNU)', g: 'Organisasi', e: 'admin', ti: function (d) { return d.kelurahan; }, su: function (d) { return d.ketua || ''; }, F: [
  T('kelurahan','Kelurahan',{t:'select',o:RT,req:1}), T('ketua','Ketua PRNU',{req:1})] },
 banom: { l: 'Badan Otonom', g: 'Organisasi', e: 'admin', ti: function (d) { return d.nama; }, su: function (d) { return d.nama_lengkap || ''; }, F: [
  T('nama','Nama singkat',{req:1}), T('nama_lengkap','Nama lengkap'), T('deskripsi','Deskripsi',{t:'area'}), T('monogram','Monogram',{h:'2 atau 3 huruf, contoh: GA'}), T('warna','Warna',{t:'color'})] },
 halaman: { l: 'Halaman Statis', g: 'Organisasi', e: 'admin', ti: function (d) { return d.judul || d.slug; }, su: function (d) { return 'Halaman: ' + (d.slug || ''); }, F: [
  T('slug','Halaman',{t:'select',o:HALAMAN,req:1,h:'Memilih halaman yang isinya diganti. Satu halaman satu entri.'}), T('judul','Judul halaman'), T('foto','Foto sampul (opsional)',{t:'image',f:'halaman'}),
  T('isi','Isi halaman',{t:'rich',req:1,h:'Format: "## Judul bagian", "- butir daftar", **tebal**, paragraf dipisah baris kosong.'})] }
};
var SETS = {
 kontak: { l: 'Kontak & Alamat', F: [T('alamat','Alamat sekretariat',{t:'area'}), T('wa','Nomor WhatsApp (format 62…)',{h:'Contoh: 6285161033689. Dipakai pada semua tautan WhatsApp situs.'}), T('wa_tampil','Nomor WhatsApp (tampilan)',{h:'Contoh: 0851-6103-3689'}), T('email','Email')] },
 medsos: { l: 'Media Sosial', F: [T('facebook','Facebook',{t:'url'}), T('instagram','Instagram',{t:'url'}), T('tiktok','TikTok',{t:'url'}), T('youtube','YouTube',{t:'url'})] },
 sambutan: { l: 'Sambutan Ketua', F: [T('salam1','Salam pembuka 1'), T('salam2','Salam pembuka 2'), T('kutipan','Kutipan utama',{t:'area'}), T('isi','Isi sambutan',{t:'rich',h:'Kata/kalimat yang diapit **dua bintang** akan ditandai (stabilo).'}), T('penutup','Salam penutup',{t:'area'}), T('nama','Nama pada foto'), T('jabatan','Jabatan pada foto'), T('foto','Foto ketua',{t:'image',f:'sambutan'})] },
 hero: { l: 'Hero Beranda', F: [T('baris1','Judul baris 1'), T('baris2','Judul baris 2'), T('keterangan','Teks pengantar (di bawah judul)',{t:'area'}), T('slides','Cover / slideshow (1–4 foto)',{t:'images',f:'hero',max:4,h:'1 foto = cover tetap. 2–4 foto = slideshow berputar. Urutan foto = urutan tampil.'})] },
 kartu: { l: 'Kartu Anggota', F: [T('pejabat','Penandatangan kartu',{t:'repeat',fixed:2,sub:[T('j','Jabatan'),T('n','Nama dan gelar'),T('ttd','Tanda tangan',{t:'image',f:'ttd',png:1,max:700})],h:'Dua penandatangan: Rois Syuriyah dan Ketua Tanfidziyah. Unggah tanda tangan PNG berlatar transparan (JPG latar putih juga bisa).'})] },
 pay: { l: 'Rekening & QRIS', F: [T('banks','Rekening',{t:'repeat',sub:[T('bank','Bank'),T('norek','Nomor rekening'),T('an','Atas nama')]}), T('qris','Gambar QRIS',{t:'image',f:'qris',png:1,max:1000})] },
 identitas: { l: 'Identitas Organisasi', F: [T('sk1','Keterangan SK (baris 1)',{h:'Tampil pada halaman Struktur Pengurus.'}), T('sk2','Keterangan SK (baris 2)'), T('sk3','Keterangan SK (baris 3)'), T('slogan','Slogan (footer)')] },
 zakat: { l: 'Zakat (Harga Emas)', F: [T('harga_emas','Harga emas per gram (Rp)',{t:'num',h:'Dipakai sebagai nilai awal kalkulator zakat. Nisab = 85 gram.'}), T('acuan','Keterangan acuan',{h:'Contoh: Antam (Logam Mulia) per 13 Okt 2026'})] }
};
var GROUPS = [['Konten', ['berita','agenda','video','galeri','kegiatan','majelis','tanya_jawab']], ['Beranda & layanan', ['layanan','program']], ['Organisasi', ['pengurus','ranting','banom','halaman']]];
var S = { dirty: false, set: {}, items: {}, staff: [], me: null };
var root = $('#app');

function toast(m, bad) { var t = $('#toast'), e = document.createElement('div'); e.className = 't' + (bad ? ' bad' : ''); e.textContent = m; t.appendChild(e); setTimeout(function () { e.remove(); }, bad ? 6000 : 3200); }
function isAdmin() { return S.me && (S.me.role === 'super_admin' || S.me.role === 'admin'); }
function can(c, data) {
  if (!S.me || !c) return false;
  var role = S.me.role;
  if (role === 'super_admin' || role === 'admin') return true;
  if (role === 'pengurus' || role === 'editor') return c.e === 'pengurus' || c.e === 'jurnalis' || (c.k === 'berita' && (!data || ['Berita','Laporan','Literasi','Opini'].indexOf(data.kategori) >= 0));
  if (role === 'jurnalis') return c.e === 'jurnalis' && (!data || ['Literasi','Opini'].indexOf(data.kategori) >= 0);
  if (role === 'ustadz') return c.e === 'ustadz';
  return false;
}
function roleName(role) { return ({super_admin:'Super Admin',admin:'Super Admin (legacy)',pengurus:'Pengurus / Editor',editor:'Pengurus / Editor (legacy)',jurnalis:'Jurnalis (Literasi & Opini)',ustadz:'Ustadz (Tanya Jawab)'})[role] || role; }
function errMsg(e) { return (e && (e.message || e.error_description)) || String(e); }

/* ---------- layar awal ---------- */
function screen(h) { root.innerHTML = '<div class="center"><div class="card">' + h + '</div></div>'; }
function setup() { screen('<h1>Hubungkan Supabase</h1><p>Admin belum terhubung ke database. Isi <code>supabaseUrl</code> dan <code>supabaseKey</code> pada berkas <code>js/config.js</code>, lalu muat ulang halaman ini. Langkah lengkap ada di README bagian "CMS /admin".</p>'); }
function login() { screen('<h1>Admin MWCNU Pondok Aren</h1><p>Masuk dengan akun Google yang sudah didaftarkan sebagai pengelola.</p><p><button class="btn g" id="gbtn">Masuk dengan Google</button></p>');
  $('#gbtn').onclick = function () { sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/admin' } }); }; }
function denied(email) { screen('<h1>Akun belum terdaftar</h1><p><b>' + esc(email) + '</b> belum terdaftar sebagai pengelola. Minta admin menambahkan email ini di menu Pengelola.</p><p><button class="btn o" id="out">Keluar</button></p>'); $('#out').onclick = signOut; }
function fatal(m) { screen('<h1>Terjadi kesalahan</h1><p>' + esc(m) + '</p><p><button class="btn o" onclick="location.reload()">Muat ulang</button></p>'); }
function signOut() { sb.auth.signOut().then(function () { location.href = '/admin'; }); }

/* ---------- kerangka ---------- */
function shell(title, active, body, actions) {
  var nav = '<a href="#/" data-nav class="' + (active === '' ? 'on' : '') + '">Ringkasan</a>';
  GROUPS.forEach(function (g) { var ks = g[1].filter(function (k) { return can(COLS[k]); }); if (!ks.length) return; nav += '<h4>' + g[0] + '</h4>'; ks.forEach(function (k) { nav += '<a data-nav href="#/' + k + '" class="' + (active === k ? 'on' : '') + '">' + COLS[k].l + '</a>'; }); });
  if (isAdmin()) { nav += '<h4>Pengaturan situs</h4>'; Object.keys(SETS).forEach(function (k) { nav += '<a data-nav href="#/set/' + k + '" class="' + (active === 'set/' + k ? 'on' : '') + '">' + SETS[k].l + '</a>'; }); nav += '<h4>Sistem</h4><a data-nav href="#/members" class="' + (active === 'members' ? 'on' : '') + '">Anggota &amp; Verifikasi</a><a data-nav href="#/staff" class="' + (active === 'staff' ? 'on' : '') + '">Pengelola</a><a data-nav href="#/log" class="' + (active === 'log' ? 'on' : '') + '">Riwayat perubahan</a>'; }
  root.innerHTML = '<div class="shell"><aside class="side" id="side"><div class="brand"><img src="/assets/img/favicon.png" alt=""><div><b>Admin MWCNU</b><small>Pondok Aren</small></div></div>' + nav + '<h4>Situs</h4><a href="/" target="_blank" rel="noopener">Lihat situs &nearr;</a></aside><main class="main"><div class="top"><div style="display:flex;gap:12px;align-items:center"><button class="btn o s burger" id="burger">Menu</button><h2>' + esc(title) + '</h2></div><div class="who"><span>' + esc(S.me.nama || S.user.email) + ' · ' + esc(roleName(S.me.role)) + '</span>' + (actions || '') + '<button class="btn o s" id="out">Keluar</button></div></div>' + body + '</main></div>';
  $('#out').onclick = signOut; $('#burger').onclick = function () { $('#side').classList.toggle('open'); };
  S.dirty = false;
}
function noAccess() { shell('Tidak ada akses', '', '<div class="panel empty">Peran Anda tidak memiliki akses ke bagian ini.</div>'); }

/* ---------- pembuat formulir ---------- */
function fieldHTML(f, v) {
  var id = 'f' + Math.random().toString(36).slice(2, 8), h = '<div class="fld" data-k="' + f.k + '" data-t="' + f.t + '">', lab = '<label for="' + id + '">' + esc(f.l) + (f.req ? ' *' : '') + '</label>', hint = f.h ? '<small class="h">' + esc(f.h) + '</small>' : '';
  if (f.t === 'bool') return h + '<label class="chk"><input class="in" type="checkbox" ' + (v === false ? '' : 'checked') + '> ' + esc(f.l) + '</label></div>';
  if (f.t === 'select') return h + lab + '<select class="in" id="' + id + '"><option value="">Pilih…</option>' + f.o.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' + hint + '<span class="em"></span></div>';
  if (f.t === 'area' || f.t === 'rich') return h + lab + '<textarea class="in ' + (f.t === 'rich' ? 'rich' : '') + '" id="' + id + '">' + esc(v) + '</textarea>' + hint + '<span class="em"></span></div>';
  if (f.t === 'image') v = safeMediaURL(v);
  if (f.t === 'image') return h + '<span class="lab">' + esc(f.l) + (f.req ? ' *' : '') + '</span><div class="img" data-f="' + (f.f || 'umum') + '" data-png="' + (f.png ? 1 : '') + '" data-max="' + (f.max || 1600) + '"><div class="thumb" style="' + (v ? 'background-image:url(\'' + esc(v) + '\')' : '') + '">' + (v ? '' : 'Belum ada') + '</div><div><label class="btn s g">Pilih gambar<input type="file" accept="image/*" hidden></label> <button type="button" class="btn s o" data-act="imgdel">Hapus</button><input class="in" type="hidden" value="' + esc(v) + '"></div></div>' + hint + '<span class="em"></span></div>';
  if (f.t === 'images') { v = Array.isArray(v) ? v : []; return h + '<span class="lab">' + esc(f.l) + '</span><div class="imgs" data-f="' + (f.f || 'umum') + '" data-max="' + (f.max || 0) + '" data-size="1600">' + v.map(imgItem).join('') + '<label class="btn s g">Tambah gambar<input type="file" accept="image/*" multiple hidden></label></div>' + hint + '<span class="em"></span></div>'; }
  if (f.t === 'repeat') { v = Array.isArray(v) ? v : []; while (f.fixed && v.length < f.fixed) v.push({}); return h + '<span class="lab">' + esc(f.l) + '</span>' + hint + '<div class="rep" data-fixed="' + (f.fixed || '') + '">' + v.map(function (r, i) { return rowHTML(f, r, i); }).join('') + '</div>' + (f.fixed ? '' : '<button type="button" class="btn s o" data-act="radd" data-k="' + f.k + '">+ Tambah</button>') + '</div>'; }
  if (f.t === 'color') return h + lab + '<input class="in" id="' + id + '" type="color" value="' + esc(v || '#17352A') + '">' + hint + '</div>';
  var type = f.t === 'date' ? 'date' : f.t === 'num' ? 'number' : f.t === 'url' ? 'url' : 'text';
  return h + lab + '<input class="in" id="' + id + '" type="' + type + '" value="' + esc(v) + '"' + (f.dl ? ' list="dl_' + f.k + '"' : '') + '>' + (f.dl ? '<datalist id="dl_' + f.k + '">' + f.dl.map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist>' : '') + hint + '<span class="em"></span></div>';
}
function safeMediaURL(s) { s = String(s || '').trim(); if (/^\/(?!\/)[^\\"'<>]*$/.test(s)) return s; try { var u = new URL(s, location.href); if (u.protocol === 'https:' && u.origin !== location.origin) return u.href; } catch (e) {} return ''; }
function imgItem(u) { u = safeMediaURL(u); return '<div class="it" data-u="' + esc(u) + '" style="' + (u ? 'background-image:url(\'' + esc(u) + '\')' : '') + '"><button type="button" data-act="imgrm" title="Hapus">&times;</button></div>'; }
function rowHTML(f, r, i) { return '<div class="rrow" data-f="' + f.k + '"><div class="rh"><span>' + esc(f.l) + ' ' + (i + 1) + '</span>' + (f.fixed ? '' : '<button type="button" class="act d" data-act="rdel">Hapus</button>') + '</div>' + f.sub.map(function (s) { return fieldHTML(s, r[s.k]); }).join('') + '</div>'; }
function formHTML(F, data) { return F.map(function (f) { return fieldHTML(f, data[f.k]); }).join(''); }
function ytId(s) { s = String(s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : s; }
function readField(w, f) {
  var el = $('.in', w);
  if (f.t === 'bool') return el.checked;
  if (f.t === 'images') return $$('.it', w).map(function (e) { return e.getAttribute('data-u'); });
  if (f.t === 'repeat') return $$('.rrow', w).map(function (row) { return readForm(row, f.sub); });
  if (f.t === 'num') return el.value === '' ? '' : Number(el.value);
  var v = el.value.trim(); if (f.k === 'youtube') v = ytId(v); return v;
}
function readForm(rootEl, F) { var o = {}; F.forEach(function (f) { var w = [].filter.call(rootEl.children, function (c) { return c.getAttribute && c.getAttribute('data-k') === f.k; })[0]; if (w) o[f.k] = readField(w, f); }); return o; }
function validate(rootEl, F, data) {
  var ok = true;
  F.forEach(function (f) {
    var w = [].filter.call(rootEl.children, function (c) { return c.getAttribute && c.getAttribute('data-k') === f.k; })[0]; if (!w) return;
    var v = data[f.k], m = '';
    var empty = v == null || v === '' || (Array.isArray(v) && !v.length);
    if (f.req && empty) m = 'Wajib diisi.';
    else if (f.k === 'youtube' && v && !/^[\w-]{11}$/.test(v)) m = 'Tautan/ID YouTube tidak dikenali.';
    else if (f.t === 'url' && v && !/^https?:\/\//.test(v)) m = 'Harus diawali http:// atau https://';
    else if (f.k === 'wa' && v && !/^62\d{8,13}$/.test(v)) m = 'Format 62 diikuti angka, tanpa spasi atau tanda hubung.';
    else if (f.k === 'slides' && v && (v.length < 1 || v.length > 4)) m = 'Isi 1 sampai 4 foto.';
    else if (f.t === 'repeat') { $$('.rrow', w).forEach(function (row, i) { if (!validate(row, f.sub, v[i])) m = m || 'Lengkapi isian yang ditandai.'; }); }
    w.classList.toggle('err', !!m); var em = $('.em', w); if (em) em.textContent = m; if (m) ok = false;
  });
  return ok;
}

/* ---------- gambar ---------- */
function shrink(file, max, png) {
  return new Promise(function (res, rej) {
    var fr = new FileReader(); fr.onerror = function () { rej(new Error('Berkas tidak terbaca')); };
    fr.onload = function () { var im = new Image(); im.onerror = function () { rej(new Error('Berkas bukan gambar yang valid')); }; im.onload = function () {
      var k = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      var keepPng = png || /png/.test(file.type) && false; var tp = keepPng ? 'image/png' : 'image/webp';
      cv.toBlob(function (b) { if (b && b.type === tp) return res(b); cv.toBlob(function (b2) { b2 ? res(b2) : rej(new Error('Gagal memproses gambar')); }, keepPng ? 'image/png' : 'image/jpeg', .86); }, tp, .86); };
      im.src = fr.result; };
    fr.readAsDataURL(file);
  });
}
function upload(file, folder, max, png) {
  if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('Ukuran berkas maksimal 5 MB (sesuai batas bucket media).'));
  return shrink(file, max, png).then(function (b) {
    var ext = b.type === 'image/png' ? 'png' : b.type === 'image/webp' ? 'webp' : 'jpg', path = folder + '/' + new Date().getFullYear() + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + '.' + ext;
    return sb.storage.from('media').upload(path, b, { contentType: b.type, cacheControl: '31536000' }).then(function (r) { if (r.error) throw r.error; return sb.storage.from('media').getPublicUrl(path).data.publicUrl; });
  });
}
function bindForm(el) {
  el.addEventListener('input', function () { S.dirty = true; });
  el.addEventListener('change', function (e) {
    var t = e.target; S.dirty = true;
    if (t.type !== 'file' || !t.files.length) return;
    var box = t.closest('.img') || t.closest('.imgs'); if (!box) return;
    var files = [].slice.call(t.files), folder = box.getAttribute('data-f'), png = box.getAttribute('data-png') === '1';
    var max = +(box.getAttribute('data-size') || box.getAttribute('data-max') || 1600);
    if (box.classList.contains('imgs')) { var lim = +box.getAttribute('data-max'); var have = $$('.it', box).length; if (lim && have + files.length > lim) { toast('Maksimal ' + lim + ' gambar.', 1); t.value = ''; return; } }
    toast('Mengunggah…');
    Promise.all(files.map(function (f) { return upload(f, folder, max, png); })).then(function (urls) {
      if (box.classList.contains('img')) { $('.in', box).value = urls[0]; var th = $('.thumb', box); th.style.backgroundImage = 'url(\'' + safeMediaURL(urls[0]) + '\')'; th.textContent = ''; }
      else urls.forEach(function (u) { var lab = $('label', box); lab.insertAdjacentHTML('beforebegin', imgItem(u)); });
      toast('Gambar terunggah.'); t.value = '';
    }).catch(function (e) { toast('Gagal mengunggah: ' + errMsg(e), 1); t.value = ''; });
  });
  el.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return; var a = b.getAttribute('data-act');
    if (a === 'imgdel') { var bx = b.closest('.img'); $('.in', bx).value = ''; var th = $('.thumb', bx); th.style.backgroundImage = ''; th.textContent = 'Belum ada'; S.dirty = true; }
    if (a === 'imgrm') { b.closest('.it').remove(); S.dirty = true; }
    if (a === 'rdel') { b.closest('.rrow').remove(); S.dirty = true; }
    if (a === 'radd') { var f = el.__F.filter(function (x) { return x.k === b.getAttribute('data-k'); })[0], rep = $('.rep', b.parentNode); rep.insertAdjacentHTML('beforeend', rowHTML(f, {}, $$('.rrow', rep).length)); S.dirty = true; }
  });
}

/* ---------- tampilan ---------- */
async function viewHome() {
  var r = await sb.from('content_items').select('type,published'); if (r.error) return toast(errMsg(r.error), 1);
  var n = {}, d = {}; (r.data || []).forEach(function (x) { n[x.type] = (n[x.type] || 0) + 1; if (!x.published) d[x.type] = (d[x.type] || 0) + 1; });
  var un = Object.keys(COLS).filter(function (k) { return !(S.set.managed && S.set.managed[k]); });
  var cards = Object.keys(COLS).filter(function (k) { return can(COLS[k]); }).map(function (k) { return '<a class="stat" data-nav href="#/' + k + '"><b>' + (n[k] || 0) + '</b><span>' + COLS[k].l + (d[k] ? ' · ' + d[k] + ' draf' : '') + '</span></a>'; }).join('');
  var mem = '';
  if (isAdmin()) { mem = '<div class="panel" style="margin-bottom:16px"><div class="bar" style="justify-content:space-between;align-items:center"><b style="margin:0">Keanggotaan KTA</b><span id="memStat">…</span></div><div class="foot"><a class="btn g s" data-nav href="#/members">Buka verifikasi anggota</a><button class="btn o s" id="memRef">Muat ulang</button></div></div>'; }
  shell('Ringkasan', '', mem + (isAdmin() && un.length ? '<div class="note">Jenis konten berikut belum dikelola CMS, jadi situs masih memakai data bawaan: <b>' + un.map(function (k) { return COLS[k].l; }).join(', ') + '</b>. Jalankan <code>supabase/seed.sql</code> atau aktifkan dari halaman masing-masing.</div>' : '') + '<p style="color:var(--mut)">Perubahan langsung tampil di situs setelah halaman dimuat ulang.</p><div class="grid">' + cards + '</div>');
  if (isAdmin() && $('#memStat')) { sb.from('profiles').select('status').then(function (mr) { var el = $('#memStat'); if (!el) return; if (mr.error || !mr.data) { el.textContent = ''; return; } var p = mr.data.filter(function (x) { return x.status === 'pending'; }).length; el.innerHTML = p ? '<span class="chip x">' + p + ' menunggu verifikasi</span>' : '<span class="chip">Semua terverifikasi</span>'; }); }
  if ($('#memRef')) $('#memRef').onclick = function () { viewHome(); };
}
async function loadItems(key) { var r = await sb.from('content_items').select('*').eq('type', key).order('sort', { ascending: true }).order('created_at', { ascending: true }); if (r.error) throw r.error; S.items[key] = r.data || []; return S.items[key]; }
async function viewList(key, q, flt) {
  var c = COLS[key]; if (!c) return viewHome(); if (!can(c)) return noAccess();
  try { await loadItems(key); } catch (e) { return toast(errMsg(e), 1); }
  var list = S.items[key].slice(); if (c.ord === 'date') list.sort(function (a, b) { return String(b.data.tanggal || '').localeCompare(String(a.data.tanggal || '')); });
  var ff = c.filter && c.F.filter(function (f) { return f.k === c.filter; })[0];
  var shown = list.filter(function (x) { return (can(c, x.data) || isAdmin() || S.me.role === 'pengurus' && key === 'berita') && (isAdmin() || S.me.role === 'pengurus' && key === 'berita' || S.me.role === 'pengurus' || S.me.role === 'editor' || x.created_by === (S.user.email || '').toLowerCase()) && (!q || JSON.stringify(x.data).toLowerCase().indexOf(q.toLowerCase()) > -1) && (!flt || x.data[c.filter] === flt); });
  var movable = !c.ord && !q;
  var rows = shown.map(function (x, i) { var writable = isAdmin() || S.me.role === 'pengurus' || S.me.role === 'editor' || x.created_by === (S.user.email || '').toLowerCase(); return '<tr><td class="t"><b>' + esc(c.ti(x.data) || '(tanpa judul)') + '</b><small>' + esc(c.su(x.data)) + '</small></td><td class="hm"><span class="chip ' + (x.published ? '' : 'x') + '">' + (x.published ? 'Terbit' : 'Draf') + '</span></td><td class="a">' +
    (movable && writable ? '<button class="act" data-mv="-1" data-id="' + x.id + '" title="Naik">&uarr;</button><button class="act" data-mv="1" data-id="' + x.id + '" title="Turun">&darr;</button>' : '') +
    (writable ? '<button class="act" data-pub="' + x.id + '">' + (x.published ? 'Sembunyikan' : 'Terbitkan') + '</button><a class="act" data-nav href="#/' + key + '/' + x.id + '">Ubah</a><button class="act" data-dup="' + x.id + '">Salin</button><button class="act d" data-del="' + x.id + '">Hapus</button>' : '<span class="chip">Hanya baca</span>') + '</td></tr>'; }).join('');
  var managed = S.set.managed && S.set.managed[key];
  shell(c.l, key, (!managed ? '<div class="note">Jenis ini belum dikelola CMS, jadi situs masih memakai data bawaan. ' + (isAdmin() ? '<button class="btn s" id="mng">Aktifkan pengelolaan</button> (situs akan memakai data di sini, termasuk bila kosong)' : 'Minta admin mengaktifkannya.') + '</div>' : '') +
    '<div class="panel"><div class="bar"><input type="search" id="q" placeholder="Cari…" value="' + esc(q || '') + '">' + (ff ? '<select id="flt"><option value="">Semua ' + esc(ff.l.toLowerCase()) + '</option>' + ff.o.map(function (o) { return '<option' + (o === flt ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' : '') + '</div>' +
    (shown.length ? '<table><thead><tr><th>Judul</th><th class="hm">Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">' + (list.length ? 'Tidak ada yang cocok.' : 'Belum ada data.') + '</div>') + '</div>',
    '<a class="btn" data-nav href="#/' + key + '/new">+ Tambah</a>');
  var qi = $('#q'); qi.addEventListener('input', function () { clearTimeout(qi.__t); qi.__t = setTimeout(function () { viewList(key, qi.value, $('#flt') && $('#flt').value); var n = $('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
  if ($('#flt')) $('#flt').onchange = function () { viewList(key, $('#q').value, this.value); };
  if ($('#mng')) $('#mng').onclick = function () { var m = Object.assign({}, S.set.managed || {}); m[key] = true; saveSet('managed', m).then(function () { toast('Pengelolaan diaktifkan.'); viewList(key); }); };
  $('.main').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-del],[data-dup],[data-pub],[data-mv]'); if (!b) return;
    try {
      if (b.hasAttribute('data-del')) { if (!isAdmin()) throw new Error('Hanya Super Admin yang dapat menghapus konten.'); if (!confirm('Hapus data ini? Tindakan ini tidak dapat dibatalkan.')) return; var r = await sb.from('content_items').delete().eq('id', b.getAttribute('data-del')); if (r.error) throw r.error; toast('Dihapus.'); }
      else if (b.hasAttribute('data-dup')) { var s = S.items[key].filter(function (x) { return x.id === b.getAttribute('data-dup'); })[0]; var d = JSON.parse(JSON.stringify(s.data)); if (d.judul) d.judul += ' (salinan)'; var mx = S.items[key].reduce(function (m, x) { return Math.max(m, x.sort); }, 0); var r2 = await sb.from('content_items').insert({ type: key, data: d, sort: mx + 10, published: false }); if (r2.error) throw r2.error; toast('Disalin sebagai draf.'); }
      else if (b.hasAttribute('data-pub')) { var s2 = S.items[key].filter(function (x) { return x.id === b.getAttribute('data-pub'); })[0]; if (!isAdmin() && S.me.role !== 'pengurus' && S.me.role !== 'editor' && s2.created_by !== (S.user.email || '').toLowerCase()) throw new Error('Anda hanya dapat menerbitkan konten yang Anda buat.'); var r3 = await sb.from('content_items').update({ published: !s2.published }).eq('id', s2.id).select().single(); if (r3.error) throw r3.error; toast(s2.published ? 'Disembunyikan.' : 'Diterbitkan.'); }
      else { if (!isAdmin()) throw new Error('Hanya Super Admin yang dapat mengubah urutan konten.'); var id = b.getAttribute('data-id'), dir = +b.getAttribute('data-mv'), vis = shown, i = vis.findIndex(function (x) { return x.id === id; }), j = i + dir; if (j < 0 || j >= vis.length) return; var A = vis[i], B = vis[j], sa = A.sort, sbv = B.sort; if (sa === sbv) { sbv = sa + dir; } var u1 = await sb.from('content_items').update({ sort: sbv }).eq('id', A.id), u2 = await sb.from('content_items').update({ sort: sa }).eq('id', B.id); if (u1.error || u2.error) throw (u1.error || u2.error); }
      viewList(key, $('#q') && $('#q').value, $('#flt') && $('#flt').value);
    } catch (er) { toast(errMsg(er), 1); }
  });
}
async function viewEdit(key, id) {
  var c = COLS[key]; if (!c) return viewHome(); if (!can(c)) return noAccess();
  var item = null; if (id !== 'new') { var r = await sb.from('content_items').select('*').eq('id', id).single(); if (r.error || !r.data || !(can(c, r.data) || isAdmin() || S.me.role === 'pengurus' && key === 'berita')) { toast('Data tidak ditemukan atau Anda tidak berhak mengubahnya.', 1); return location.hash = '#/' + key; } item = r.data; }

  var data = item ? item.data : (key === 'layanan' ? { tampil: true } : (key === 'berita' ? { kategori: S.me.role === 'jurnalis' ? 'Literasi' : 'Berita', penulis: (S.me && S.me.nama) || '' } : {}));
  if (item && !can(c, item.data)) return noAccess();
  var pubDefault = item ? !!item.published : S.me.role !== 'jurnalis';
  var hint = (!item && S.me.role === 'jurnalis') ? '<div class="note">Penyerahan ke tinjauan: tulisan Jurnalis disimpan sebagai <b>draf</b> dan perlu ditinjau Pengurus sebelum terbit.</div>' : '';
  var fields = c.F.map(function (f) { if (key === 'berita' && f.k === 'kategori') { var ff = Object.assign({}, f); ff.o = S.me.role === 'jurnalis' ? ['Literasi','Opini'] : ['Berita','Laporan','Literasi','Opini']; return ff; } return f; });
  shell((item ? 'Ubah ' : 'Tambah ') + c.l, key, hint + '<form class="form panel" id="form" novalidate>' + formHTML(fields, data) + '<label class="chk"><input type="checkbox" id="pub" ' + (pubDefault ? 'checked' : '') + '> Terbitkan (tampil di situs)</label><div class="foot"><button class="btn g" id="save" type="submit">Simpan</button><a class="btn o" data-nav href="#/' + key + '">Batal</a></div></form>');
  var form = $('#form'); form.__F = fields; bindForm(form);
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); var d = readForm(form, fields); if (!can(c, d) || (key === 'berita' && !fields.filter(function (f) { return f.k === 'kategori'; })[0].o.includes(d.kategori))) { toast('Peran Anda tidak berhak mengelola kategori ini.', 1); return; } if (!validate(form, fields, d)) { toast('Periksa isian yang ditandai merah.', 1); var f = $('.fld.err', form); if (f) f.scrollIntoView({ block: 'center' }); return; }
    var btn = $('#save'); btn.disabled = true; var pub = $('#pub').checked, r2;
    try {
      if (item) r2 = await sb.from('content_items').update({ data: d, published: pub }).eq('id', item.id).select().single();
      else { var all = await sb.from('content_items').select('sort').eq('type', key); if (all.error) throw all.error; var mx = (all.data || []).reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0); r2 = await sb.from('content_items').insert({ type: key, data: d, sort: mx + 10, published: pub }).select().single(); }
      if (r2.error) throw r2.error; S.dirty = false; toast('Tersimpan.'); location.hash = '#/' + key;
    } catch (er) { toast('Gagal menyimpan: ' + errMsg(er), 1); btn.disabled = false; }
  });
}
function saveSet(key, value) { return sb.from('site_settings').upsert({ key: key, value: value }, { onConflict: 'key' }).select().single().then(function (r) { if (r.error) throw r.error; S.set[key] = value; return r; }); }
function viewSet(key) {
  var c = SETS[key]; if (!c) return viewHome(); if (!isAdmin()) return noAccess();
  var data = S.set[key] || {};
  shell(c.l, 'set/' + key, '<form class="form panel" id="form" novalidate>' + formHTML(c.F, data) + '<div class="foot"><button class="btn g" id="save" type="submit">Simpan</button></div></form>');
  var form = $('#form'); form.__F = c.F; bindForm(form);
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); var d = readForm(form, c.F); if (!isAdmin()) { toast('Hanya Super Admin dapat mengubah pengaturan situs.', 1); return; } if (!validate(form, c.F, d)) { toast('Periksa isian yang ditandai merah.', 1); return; }
    var btn = $('#save'); btn.disabled = true;
    try { await saveSet(key, Object.assign({}, data, d)); S.dirty = false; toast('Tersimpan. Muat ulang situs untuk melihat hasilnya.'); } catch (er) { toast('Gagal menyimpan: ' + errMsg(er), 1); }
    btn.disabled = false;
  });
}
async function viewStaff() {
  if (!isAdmin()) return noAccess();
  var r = await sb.from('staff').select('email,role,nama').order('created_at', { ascending: true }); if (r.error) return toast(errMsg(r.error), 1); S.staff = r.data || [];
  shell('Pengelola', 'staff', '<div class="note ok">Peran: <b>Super Admin</b> mengelola seluruh situs dan pengelola; <b>Pengurus / Editor</b> mengelola berita umum, agenda, video, galeri, kegiatan pilihan, dan majelis; <b>Jurnalis</b> membuat usulan Jurnal Literasi dan Opini, yang perlu ditinjau Pengurus sebelum terbit; <b>Ustadz</b> mengelola Tanya Jawab Agama.</div><div class="panel"><table><thead><tr><th>Email</th><th>Nama</th><th>Peran</th><th></th></tr></thead><tbody>' +
    S.staff.map(function (s) { return '<tr><td>' + esc(s.email) + '</td><td>' + esc(s.nama || '') + '</td><td><select data-role="' + esc(s.email) + '">' + ['super_admin','pengurus','jurnalis','ustadz'].map(function (role) { return '<option value="' + role + '"' + (s.role === role ? ' selected' : '') + '>' + esc(roleName(role)) + '</option>'; }).join('') + '</select></td><td class="a"><button class="act d" data-rm="' + esc(s.email) + '">Hapus</button></td></tr>'; }).join('') +
    '</tbody></table></div><form class="panel form" id="sf" style="margin-top:16px"><h3>Tambah pengelola</h3><div class="fld"><label for="se">Email Google</label><input type="text" id="se" placeholder="nama@gmail.com"></div><div class="fld"><label for="sn">Nama</label><input type="text" id="sn"></div><div class="fld"><label for="sr">Peran</label><select id="sr"><option value="pengurus">Pengurus / Editor</option><option value="jurnalis">Jurnalis (Literasi &amp; Opini)</option><option value="ustadz">Ustadz (Tanya Jawab)</option><option value="super_admin">Super Admin</option></select></div><div class="foot"><button class="btn g" type="submit">Tambah</button></div></form>');
  $('#sf').onsubmit = async function (e) { e.preventDefault(); var em = $('#se').value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return toast('Email tidak valid.', 1); var r2 = await sb.from('staff').insert({ email: em, nama: $('#sn').value.trim(), role: $('#sr').value }); if (r2.error) return toast(errMsg(r2.error), 1); toast('Pengelola ditambahkan.'); viewStaff(); };
  $$('[data-role]').forEach(function (s) { s.onchange = async function () { var email = s.getAttribute('data-role'), person = S.staff.filter(function (x) { return x.email === email; })[0]; if (person && person.role === 'super_admin' && s.value !== 'super_admin') { toast('Promosikan Super Admin lain sebelum menurunkan peran ini.', 1); return viewStaff(); } var r2 = await sb.from('staff').update({ role: s.value }).eq('email', email); if (r2.error) toast(errMsg(r2.error), 1); else toast('Peran diubah.'); viewStaff(); }; });
  $$('[data-rm]').forEach(function (b) { b.onclick = async function () { if (!confirm('Hapus pengelola ' + b.getAttribute('data-rm') + '?')) return; var email = b.getAttribute('data-rm'), person = S.staff.filter(function (x) { return x.email === email; })[0]; if (person && person.role === 'super_admin' && S.staff.filter(function (x) { return x.role === 'super_admin'; }).length < 2) { toast('Super Admin terakhir tidak dapat dihapus.', 1); return; } var r2 = await sb.from('staff').delete().eq('email', email); if (r2.error) toast(errMsg(r2.error), 1); else toast('Dihapus.'); viewStaff(); }; });
}
async function viewMembers() {
  if (!isAdmin()) return noAccess();
  var r = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  if (r.error) return toast(errMsg(r.error), 1);
  var list = r.data || [];
  var chip = function (s) { return '<span class="chip' + (s === 'verified' ? '' : s === 'rejected' ? ' x' : '') + '">' + ({verified:'Terverifikasi',pending:'Menunggu',rejected:'Ditolak'}[s] || s) + '</span>'; };
  shell('Anggota & Verifikasi NIA', 'members', '<div class="panel"><div class="bar"><input type="search" id="mq" placeholder="Cari nama, email, NIA, HP…" value="' + '"><select id="mf"><option value="">Semua status</option><option value="pending">Menunggu</option><option value="verified">Terverifikasi</option><option value="rejected">Ditolak</option></select></div>' +
    (list.length ? '<table><thead><tr><th>Anggota</th><th class="hm">Kontak</th><th>NIA</th><th>Status</th><th></th></tr></thead><tbody>' +
    list.map(function (p) { return '<tr><td class="t"><b>' + esc(p.nama || '(tanpa nama)') + '</b><small>' + esc(p.email || '') + (p.ranting ? ' · PRNU ' + esc(p.ranting) : (p.tingkat ? ' · ' + esc(p.tingkat) : '')) + '</small></td><td class="hm">' + esc(p.hp || '—') + '</td><td>' + esc(p.nia || '—') + '</td><td>' + chip(p.status) + '</td><td class="a">' +
      (p.status !== 'verified' ? '<button class="act" data-vfy="' + p.id + '">Verifikasi</button>' : '') +
      (p.status !== 'rejected' ? '<button class="act" data-rej="' + p.id + '">Tolak</button>' : '') +
      (p.status !== 'pending' ? '<button class="act" data-pnd="' + p.id + '">Tunggu</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table>'
    : '<div class="empty">Belum ada profil anggota. Akan terisi otomatis saat pengguna mendaftar KTA.</div>') + '</div>');
  var q = $('#mq'), f = $('#mf');
  function filt() { var t = q.value.toLowerCase(), s = f.value; $$('tbody tr').forEach(function (tr) { var ok = (!t || tr.textContent.toLowerCase().indexOf(t) > -1) && (!s || tr.textContent.toLowerCase().indexOf(s === 'pending' ? 'menunggu' : s === 'verified' ? 'terverifikasi' : 'ditolak') > -1); tr.style.display = ok ? '' : 'none'; }); }
  q.addEventListener('input', filt); f.onchange = filt;
  $('.main').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-vfy],[data-rej],[data-pnd]'); if (!b) return;
    var st = b.hasAttribute('data-vfy') ? 'verified' : b.hasAttribute('data-rej') ? 'rejected' : 'pending';
    var id = b.getAttribute('data-vfy') || b.getAttribute('data-rej') || b.getAttribute('data-pnd');
    try { var r2 = await sb.from('profiles').update({ status: st }).eq('id', id).select().single(); if (r2.error) throw r2.error; toast('Status disimpan: ' + st + '.'); viewMembers(); }
    catch (er) { toast(errMsg(er), 1); }
  });
}
async function viewLog() {
  if (!isAdmin()) return noAccess();
  var r = await sb.from('change_log').select('*').order('at', { ascending: false }).limit(150); if (r.error) return toast(errMsg(r.error), 1);
  shell('Riwayat perubahan', 'log', '<div class="panel">' + ((r.data || []).length ? '<table><thead><tr><th>Waktu</th><th>Oleh</th><th>Aksi</th><th>Objek</th></tr></thead><tbody>' + r.data.map(function (x) { return '<tr><td>' + esc(new Date(x.at).toLocaleString('id-ID')) + '</td><td>' + esc(x.who || '') + '</td><td>' + esc({ INSERT: 'Tambah', UPDATE: 'Ubah', DELETE: 'Hapus' }[x.aksi] || x.aksi) + '</td><td class="t"><b>' + esc(x.ringkas || x.ref || '') + '</b><small>' + esc((x.jenis || x.tabel)) + '</small></td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">Belum ada riwayat.</div>') + '</div>');
}
function route() {
  if (!S.me) return;
  var p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
  if (!p[0]) return viewHome();
  if (p[0] === 'set') return viewSet(p[1]);
  if (p[0] === 'staff') return viewStaff();
  if (p[0] === 'members') return viewMembers();
  if (p[0] === 'log') return viewLog();
  if (p[1]) return viewEdit(p[0], p[1]);
  return viewList(p[0]);
}
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-nav]'); if (a && S.dirty && !confirm('Perubahan belum disimpan. Tinggalkan halaman ini?')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (a && $('#side')) $('#side').classList.remove('open');
}, true);
window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
window.addEventListener('hashchange', route);

async function boot() {
  if (!sb) return setup();
  try {
    var s = await sb.auth.getSession(); S.session = s.data && s.data.session; if (!S.session) return login();
    S.user = S.session.user; var email = (S.user.email || '').toLowerCase();
    var q = await sb.from('staff').select('email,role,nama'); if (q.error) return fatal('Gagal membaca daftar pengelola: ' + errMsg(q.error) + '. Pastikan supabase/schema.sql sudah dijalankan.');
    S.staff = q.data || []; S.me = S.staff.filter(function (x) { return x.email === email; })[0]; if (!S.me) return denied(email);
    var st = await sb.from('site_settings').select('key,value'); (st.data || []).forEach(function (x) { S.set[x.key] = x.value; });
    sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') location.href = '/admin'; });
    route();
  } catch (e) { fatal(errMsg(e)); }
}
boot();
})();
