/* Admin CMS MWCNU Pondok Aren. Keamanan sebenarnya ada di aturan akses database (supabase/schema.sql),
   tampilan ini hanya antarmuka. */
(function () {
'use strict';
var C = window.MWC_CFG || {};
var sb = window.__SB__ || ((window.supabase && C.supabaseUrl && C.supabaseKey) ? window.supabase.createClient(C.supabaseUrl, C.supabaseKey) : null);
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
var esc = window.mwcEsc;
var BL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function fd(iso) { var p = String(iso || '').split('-'); return p.length == 3 && +p[0] ? (+p[2]) + ' ' + BL[+p[1] - 1] + ' ' + p[0] : (iso || ''); }
var RT = window.MWC_RT;
var TOPIK = ['Ibadah','Akidah','Akhlak & tasawuf','Muamalah','Keluarga','Waris & wasiat','Amaliyah NU','Lainnya'];
var HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad','Beberapa hari dalam sepekan'];
var BIDANG = ['Kepemudaan','Perempuan','Pelajar','Seni Bela Diri','Sosial & Dakwah','Lainnya'];
var LINKS = ['#layanan','#ambulans','#zis','#majelis','#konsultasi','#daftar','#berita','#agenda','#galeri','#ranting','#banom','#struktur','#video','#program'];
var IKON = ['ambulans','zakat','majelis','konsultasi','beasiswa','kesehatan','info','kalender','buku','hati','telepon','lokasi'];
var HALAMAN = ['sejarah','visi','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];
var AD_ROUTES = [
  {v:'berita',l:'Berita'}, {v:'baca',l:'Baca berita'}, {v:'sejarah',l:'Sejarah'}, {v:'visi',l:'Visi & misi'},
  {v:'struktur',l:'Struktur'}, {v:'ranting',l:'Ranting'}, {v:'banom',l:'Badan otonom'}, {v:'program',l:'Program'},
  {v:'galeri',l:'Galeri'}, {v:'layanan',l:'Layanan'}, {v:'majelis',l:'Majelis'}, {v:'konsultasi',l:'Konsultasi'},
  {v:'zis',l:'ZIS'}, {v:'kontak',l:'Kontak'}
];
var T = function (k, l, o) { o = o || {}; o.k = k; o.l = l; o.t = o.t || 'text'; return o; };

var COLS = {
 berita: { l: 'Berita & Jurnal', g: 'Konten', e: 'jurnalis', ord: 'date', ti: function (d) { return d.judul; }, su: function (d) { return fd(d.tanggal) + ' · ' + (d.kategori || ''); }, F: [
  T('judul','Judul artikel',{req:1}), T('kategori','Kategori',{t:'category',o:['Berita','Laporan','Literasi','Opini'],req:1,h:'Pilih saran atau ketik kategori baru.'}),
  T('tanggal','Tanggal terbit',{t:'date',req:1}), T('penulis','Penulis',{h:'Contoh: Redaksi MWCNU / Nama jurnalis.'}),
  T('foto','Thumbnail / foto utama',{t:'image',f:'berita'}), T('ringkasan','Ringkasan artikel',{t:'area',h:'Dipakai sebagai cuplikan dan deskripsi SEO bila deskripsi SEO dikosongkan.'}),
  T('isi','Isi artikel',{t:'editor',req:1}),
  T('tag','Tag / kata kunci',{h:'Pisahkan dengan koma. Contoh: Halal Bi Halal, Pondok Aren'}), T('featured','Tampilkan sebagai sorotan',{t:'bool'}),
  T('lead','Paragraf pembuka khusus',{t:'area'}), T('caption','Keterangan foto'),
  T('meta_judul','Judul SEO',{h:'Idealnya 50–60 karakter. Kosongkan untuk memakai judul artikel.'}), T('meta_desc','Deskripsi SEO',{t:'area',h:'Disarankan 120–160 karakter. Kosongkan untuk memakai ringkasan artikel.'}),
  T('font_artikel','Tipografi artikel',{t:'select',o:['Ikuti pengaturan','Sans','Serif']}), T('dropcap_art','Huruf awal besar',{t:'bool'}),
  T('info','Info kegiatan',{t:'area',h:'Opsional. Satu baris satu info, contoh: Tempat: Aula MWC'}),
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
 layanan: { l: 'Program & Layanan', g: 'Beranda', e: 'admin', filter: null, ti: function (d) { return d.judul; }, su: function (d) { return (d.tampil === false ? 'Disembunyikan · ' : '') + [d.keterangan, d.tautan].filter(Boolean).join(' · '); }, F: [
  T('judul','Judul',{req:1}), T('deskripsi','Deskripsi singkat',{t:'area'}), T('keterangan','Keterangan',{h:'Contoh: Pengajian rutin setiap pekan atau Kitab Fathul Qarib. Tampil di kartu layanan publik.'}), T('ikon','Ikon',{t:'select',o:IKON,req:1}), T('tautan','Tautan tujuan',{dl:LINKS,h:'Halaman internal (contoh #ambulans) atau alamat lengkap https://…'}), T('tampil','Tampilkan di beranda',{t:'bool'})] },
 program: { l: 'Program Khidmat', g: 'Beranda', e: 'admin', ti: function (d) { return d.judul; }, su: function (d) { return d.tombol || ''; }, F: [
  T('judul','Judul',{req:1}), T('deskripsi','Deskripsi',{t:'area'}), T('kegiatan','Daftar kegiatan',{t:'area',h:'Satu baris satu kegiatan.'}), T('tombol','Teks tombol'), T('tautan','Tautan tombol',{dl:LINKS})] },
 pengurus: { l: 'Struktur Pengurus', g: 'Organisasi', e: 'admin', filter: 'bagian', ti: function (d) { return d.nama; }, su: function (d) { return (d.jabatan || '') + ' · ' + (d.bagian || ''); }, F: [
  T('bagian','Bagian',{t:'select',o:['Mustasyar','Syuriyah','Tanfidziyah','Badan otonom'],req:1}), T('jabatan','Jabatan',{req:1,h:'Contoh: Rois, Wakil Rois, Ketua, Sekretaris'}), T('nama','Nama dan gelar',{req:1})] },
 ranting: { l: 'Ranting (PRNU)', g: 'Organisasi', e: 'admin', ti: function (d) { return d.kelurahan; }, su: function (d) { return d.ketua || ''; }, F: [
  T('kelurahan','Kelurahan',{t:'select',o:RT,req:1}), T('ketua','Ketua PRNU',{req:1})] },
 banom: { l: 'Badan Otonom', g: 'Organisasi', e: 'admin', ti: function (d) { return d.nama; }, su: function (d) { return [d.bidang, d.nama_lengkap].filter(Boolean).join(' · '); }, F: [
  T('nama','Nama singkat',{req:1}), T('nama_lengkap','Nama lengkap'), T('bidang','Bidang gerak',{t:'select',o:BIDANG}),
  T('deskripsi','Deskripsi',{t:'area',h:'Tampil pada kartu dan halaman profil badan otonom.'}),
  T('logo','Logo',{t:'image',f:'banom',max:900,h:'Unggah logo resmi (PNG transparan disarankan). Bila kosong, situs memakai inisial nama.'}),
  T('warna','Warna aksen',{t:'color'}),
  T('ketua','Ketua',{h:'Opsional. Contoh: Nama Ketua PC GP Ansor Pondok Aren.'}),
  T('kontak','Kontak pengurus',{h:'Opsional. Nomor WhatsApp atau email pengurus.'}),
  T('kegiatan','Kegiatan utama',{t:'area',h:'Satu baris satu kegiatan. Tampil di halaman profil.'}),
  T('tautan','Tautan resmi',{dl:LINKS,h:'Opsional. Halaman internal (contoh #kontak) atau alamat lengkap https://…'})] },
 halaman: { l: 'Halaman Statis', g: 'Organisasi', e: 'admin', ti: function (d) { return d.judul || d.slug; }, su: function (d) { return 'Halaman: ' + (d.slug || ''); }, F: [
  T('slug','Halaman',{t:'select',o:HALAMAN,req:1,h:'Memilih halaman yang isinya diganti. Satu halaman satu entri.'}), T('judul','Judul halaman'), T('foto','Foto sampul (opsional)',{t:'image',f:'halaman'}),
  T('isi','Isi halaman',{t:'rich',req:1,h:'Format: "## Judul bagian", "- butir daftar", **tebal**, paragraf dipisah baris kosong.'})] }
};
var SETS = {
 kas: { l: 'Laporan Kas', F: [T('tampil','Tampilkan laporan Kas di situs publik',{t:'bool',def:false,h:'Aktifkan setelah isi laporan diperiksa dan siap dipublikasikan.'}), T('periode','Periode laporan',{h:'Contoh format: Januari–Maret 2026.'}), T('pemasukan','Total pemasukan (Rp)',{t:'num',h:'Isi angka laporan yang sudah diverifikasi. Kosongkan bila tidak ingin ditampilkan.'}), T('pengeluaran','Total pengeluaran (Rp)',{t:'num',h:'Isi angka laporan yang sudah diverifikasi. Kosongkan bila tidak ingin ditampilkan.'}), T('saldo','Saldo akhir (Rp)',{t:'num',h:'Isi angka laporan yang sudah diverifikasi. Kosongkan bila tidak ingin ditampilkan.'}), T('keterangan','Keterangan laporan',{t:'area',h:'Sumber, catatan singkat, atau penjelasan tambahan untuk warga.'})] },
 kontak: { l: 'Kontak & Alamat', F: [T('alamat','Alamat sekretariat',{t:'area'}), T('wa','Nomor WhatsApp (format 62…)',{h:'Contoh: 6285161033689. Dipakai pada semua tautan WhatsApp situs.'}), T('wa_tampil','Nomor WhatsApp (tampilan)',{h:'Contoh: 0851-6103-3689'}), T('email','Email')] },
 medsos: { l: 'Media Sosial', F: [T('facebook','Facebook',{t:'url'}), T('instagram','Instagram',{t:'url'}), T('tiktok','TikTok',{t:'url'}), T('youtube','YouTube',{t:'url'})] },
 sambutan: { l: 'Sambutan Ketua', F: [T('salam1','Salam pembuka 1'), T('salam2','Salam pembuka 2'), T('kutipan','Kutipan utama',{t:'area'}), T('isi','Isi sambutan',{t:'rich',h:'Kata/kalimat yang diapit **dua bintang** akan ditandai (stabilo).'}), T('penutup','Salam penutup',{t:'area'}), T('nama','Nama pada foto'), T('jabatan','Jabatan pada foto'), T('foto','Foto ketua',{t:'image',f:'sambutan'})] },
 hero: { l: 'Hero Beranda', F: [T('baris1','Judul baris 1'), T('baris2','Judul baris 2'), T('keterangan','Teks pengantar (di bawah judul)',{t:'area'}), T('potret','Cover potret (desktop & mobile)',{t:'image',f:'hero',h:'Unggah 1 foto potret (rasio 3:4, mis. 1200×1600 px). Foto ini dipakai sebagai cover hero: di desktop di-crop lebar, di mobile (≤900px) di-crop potret penuh layar pada posisi 32% 30%. Jika kosong, dipakai foto pertama pada Cover/slideshow di bawah.'}), T('slides','Cover / slideshow (1–4 foto)',{t:'images',f:'hero',max:4,h:'1 foto = cover tetap. 2–4 foto = slideshow berputar. Urutan foto = urutan tampil. Dipakai hanya jika Cover potret di atas kosong.'})] },
 kartu: { l: 'Kartu Anggota', F: [T('pejabat','Penandatangan kartu',{t:'repeat',fixed:2,sub:[T('j','Jabatan'),T('n','Nama dan gelar'),T('ttd','Tanda tangan',{t:'image',f:'ttd',png:1,max:700})],h:'Dua penandatangan: Rois Syuriyah dan Ketua Tanfidziyah. Unggah tanda tangan PNG berlatar transparan (JPG latar putih juga bisa).'})] },
 pay: { l: 'Rekening & QRIS', F: [T('banks','Rekening',{t:'repeat',sub:[T('bank','Bank'),T('norek','Nomor rekening'),T('an','Atas nama')]}), T('qris','Gambar QRIS',{t:'image',f:'qris',png:1,max:1000})] },
 identitas: { l: 'Identitas Organisasi', F: [T('sk1','Keterangan SK (baris 1)',{h:'Tampil pada halaman Struktur Pengurus.'}), T('sk2','Keterangan SK (baris 2)'), T('sk3','Keterangan SK (baris 3)'), T('slogan','Slogan (footer)'), T('org_judul','Judul pengantar beranda'), T('org_deskripsi','Deskripsi pengantar beranda',{t:'area'})] },
 zakat: { l: 'Zakat (Harga Emas)', F: [T('harga_emas','Harga emas per gram (Rp)',{t:'num',h:'Dipakai sebagai nilai awal kalkulator zakat. Nisab = 85 gram.'}), T('acuan','Keterangan acuan',{h:'Contoh: Antam (Logam Mulia) per 13 Okt 2026'})] },
 tipografi: { l: 'Tipografi & Bacaan', F: [T('font_judul','Font judul artikel',{t:'select',o:['Plus Jakarta Sans','Inter','Serif']}), T('font_isi','Font isi artikel',{t:'select',o:['Inter','Plus Jakarta Sans','Serif']}), T('ukuran_isi','Ukuran isi (px)',{t:'num',h:'Standar: 16. Rentang 14–20.'}), T('jarak_baris','Jarak baris',{t:'num',h:'Standar: 1.75. Rentang 1.4–2.2.'}), T('dropcap','Huruf awal besar (drop cap)',{t:'bool'})] },
 iklan: { l: 'Iklan & Slot Utama', F: [
  T('client','Publisher ID AdSense',{h:'Format ca-pub- diikuti 16 digit. Biarkan kosong jika hanya memakai gambar.'}),
  T('slots','Slot utama per halaman',{t:'repeat',fixed:14,sub:[
  T('page','Halaman',{t:'select',o:AD_ROUTES,req:1}), T('active','Tampilkan slot ini',{t:'bool'}),
  T('mode','Jenis iklan',{t:'select',o:['Gambar','Google AdSense'],req:1}), T('image','Gambar iklan',{t:'image',f:'ads',max:1600}),
  T('alt','Teks alternatif gambar'), T('href','Tautan tujuan gambar',{t:'url',h:'Gunakan alamat HTTPS.'}), T('ad_slot','ID unit iklan AdSense',{h:'Diambil dari kode unit iklan AdSense; angka saja.'})
 ]})] }
};
var GROUPS = [['Konten', ['berita','agenda','video','galeri','kegiatan','majelis','tanya_jawab']], ['Beranda & layanan', ['layanan','program']], ['Organisasi', ['pengurus','ranting','banom','halaman']]];
var S = { dirty: false, set: {}, items: {}, staff: [], me: null, memPage: 0 };
var root = $('#app');

function toast(m, bad) { var t = $('#toast'), e = document.createElement('div'); e.className = 't' + (bad ? ' bad' : ''); e.textContent = m; t.appendChild(e); setTimeout(function () { e.remove(); }, bad ? 6000 : 3200); }
function isAdmin() { return S.me && (S.me.role === 'super_admin' || S.me.role === 'admin'); }
/* Pengurus (termasuk pengurus ranting) boleh membuka Anggota & Verifikasi.
   Batas wilayahnya ditegakkan RLS lewat public.verifies() di supabase-profiles.sql. */
function canMembers() { return S.me && ['super_admin','admin','pengurus','editor'].indexOf(S.me.role) >= 0; }
/* Siapa yang benar-benar dapat membuka daftar anggota (selaras viewMembers):
   Jurnalis dan Ustadz tidak dapat, meski mereka punya menu Sistem. */
function canMembersView() { return !!S.me && (isAdmin() || S.me.role === 'pengurus' || S.me.role === 'editor'); }
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
function errMsg(e) {
  if (!e) return 'Kesalahan tidak diketahui.';
  var parts = [];
  var message = e.message || e.error_description || '';
  if (message) parts.push(message);
  if (e.code) parts.push('kode ' + e.code);
  if (e.details) parts.push(String(e.details));
  if (e.hint) parts.push('Petunjuk: ' + e.hint);
  return parts.join(' · ') || String(e);
}

/* ---------- layar awal ---------- */
function screen(h) { root.innerHTML = '<div class="center"><div class="card">' + h + '</div></div>'; }
function setup() { screen('<h1>Hubungkan Supabase</h1><p>Admin belum terhubung ke database. Isi <code>supabaseUrl</code> dan <code>supabaseKey</code> pada berkas <code>js/config.js</code>, lalu muat ulang halaman ini. Langkah lengkap ada di README bagian "CMS /admin".</p>'); }
function login() { screen('<h1>Admin MWCNU Pondok Aren</h1><p>Masuk dengan akun Google yang sudah didaftarkan sebagai pengelola.</p><p><button class="btn g" id="gbtn">Masuk dengan Google</button></p>');
  $('#gbtn').onclick = function () { sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/admin' } }); }; }
function denied(email) { screen('<h1>Akun belum terdaftar</h1><p><b>' + esc(email) + '</b> belum terdaftar sebagai pengelola. Minta admin menambahkan email ini di menu Pengelola.</p><p><button class="btn o" id="out">Keluar</button></p>'); $('#out').onclick = signOut; }
function fatal(m) { screen('<h1>Terjadi kesalahan</h1><p>' + esc(m) + '</p><p><button class="btn o" onclick="location.reload()">Muat ulang</button></p>'); }
function signOut() { sb.auth.signOut().then(function () { location.href = '/admin'; }).catch(function () { toast('Gagal keluar sesi. Periksa koneksi lalu coba lagi.', 1); }); }

/* ---------- kerangka ---------- */
function shell(title, active, body, actions) {
  function navSection(label, links, open) { return '<details class="nav-group"' + (open || label === 'Konten' ? ' open' : '') + '><summary>' + esc(label) + '</summary><div class="nav-links">' + links + '</div></details>'; }
  var nav = '<a href="#/" data-nav class="nav-home' + (active === '' ? ' on' : '') + '"' + (active === '' ? ' aria-current="page"' : '') + '>Ringkasan</a>';
  GROUPS.forEach(function (g) {
    var ks = g[1].filter(function (k) { return can(COLS[k]); }); if (!ks.length) return;
    var links = ks.map(function (k) { return '<a data-nav href="#/' + k + '" class="' + (active === k ? 'on' : '') + '"' + (active === k ? ' aria-current="page"' : '') + '>' + esc(COLS[k].l) + '</a>'; }).join('');
    nav += navSection(g[0], links, ks.indexOf(active) >= 0);
  });
  if (isAdmin()) {
    nav += navSection('Pengaturan situs', Object.keys(SETS).map(function (k) { var a = active === 'set/' + k; return '<a data-nav href="#/set/' + k + '" class="' + (a ? 'on' : '') + '"' + (a ? ' aria-current="page"' : '') + '>' + esc(SETS[k].l) + '</a>'; }).join(''), active.indexOf('set/') === 0);
  }
  if (window.MWCDIRADM && window.MWCDIRADM.visible()) {
    nav += navSection('Direktori', window.MWCDIRADM.nav(active), active.indexOf('dir') === 0);
  }
  if (canMembers()) {
    nav += navSection('Sistem', (canMembersView() ? '<a data-nav href="#/members" class="' + (active === 'members' ? 'on' : '') + '"' + (active === 'members' ? ' aria-current="page"' : '') + '>Anggota &amp; Verifikasi</a>' : '') + (isAdmin() ? '<a data-nav href="#/staff" class="' + (active === 'staff' ? 'on' : '') + '"' + (active === 'staff' ? ' aria-current="page"' : '') + '>Pengelola</a><a data-nav href="#/log" class="' + (active === 'log' ? 'on' : '') + '"' + (active === 'log' ? ' aria-current="page"' : '') + '>Riwayat perubahan</a>' : ''), ['members','staff','log'].indexOf(active) >= 0);
  }
  nav += '<a class="nav-site" href="/" target="_blank" rel="noopener">Lihat situs &nearr;</a>';
  root.innerHTML = '<div class="shell"><aside class="side" id="side"><div class="brand"><img src="/assets/img/favicon.png" alt=""><div><b>Admin MWCNU</b><small>Pondok Aren</small></div></div><label class="nav-search"><span class="sr-only">Cari menu</span><input id="navq" type="search" placeholder="Cari menu…" autocomplete="off"></label><nav class="nav-list" id="navList" aria-label="Menu admin">' + nav + '<p class="nav-empty" id="navEmpty" hidden>Tidak ada menu yang cocok.</p></nav></aside><main class="main"><div class="top"><div style="display:flex;gap:12px;align-items:center"><button class="btn o s burger" id="burger" aria-expanded="false" aria-controls="side">Menu</button><h2>' + esc(title) + '</h2></div><div class="who"><span>' + esc(S.me.nama || S.user.email) + ' · ' + esc(roleName(S.me.role)) + '</span>' + (actions || '') + '<button class="btn o s" id="out">Keluar</button></div></div>' + body + '</main></div>';
  $('#out').onclick = signOut;
  $('#burger').setAttribute('aria-expanded', 'false');
  $('#burger').onclick = function () { var open = $('#side').classList.toggle('open'); this.setAttribute('aria-expanded', String(open)); };
  var navq = $('#navq');
  navq.addEventListener('input', function () {
    var q = navq.value.trim().toLowerCase(), matches = 0;
    $$('.nav-group', $('#navList')).forEach(function (group) {
      var found = 0;
      $$('a', group).forEach(function (a) { var show = !q || a.textContent.toLowerCase().indexOf(q) >= 0; a.hidden = !show; if (show) found++; });
      group.hidden = !!q && !found;
      if (q && found) group.open = true;
      matches += found;
    });
    $$('.nav-home,.nav-site', $('#navList')).forEach(function (a) { var show = !q || a.textContent.toLowerCase().indexOf(q) >= 0; a.hidden = !show; if (show) matches++; });
    $('#navEmpty').hidden = !q || !!matches;
  });
  S.dirty = false;
}
function noAccess() { shell('Tidak ada akses', '', '<div class="panel empty">Peran Anda tidak memiliki akses ke bagian ini.</div>'); }

/* ---------- pembuat formulir ---------- */
function fieldHTML(f, v) {
  var id = 'f' + Math.random().toString(36).slice(2, 8), h = '<div class="fld" data-k="' + f.k + '" data-t="' + f.t + '">', lab = '<label for="' + id + '">' + esc(f.l) + (f.req ? ' *' : '') + '</label>', hint = f.h ? '<small class="h">' + esc(f.h) + '</small>' : '';
  if (f.t === 'bool') return h + '<label class="chk"><input class="in" type="checkbox" ' + (v === false || (v === undefined && f.def === false) ? '' : 'checked') + '> ' + esc(f.l) + '</label>' + hint + '</div>';
  if (f.t === 'category') return h + lab + '<input class="in" id="' + id + '" type="text" list="' + id + '_options" value="' + esc(v) + '" maxlength="48" autocomplete="off"><datalist id="' + id + '_options">' + (f.o || []).map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist>' + hint + '<span class="em"></span></div>';
  if (f.t === 'editor') return h + lab + '<div class="article-editor-wrap"><div class="article-toolbar" role="toolbar" aria-label="Pemformatan isi artikel">' +
    '<button type="button" data-editor-block="p" title="Paragraf">Paragraf</button><button type="button" data-editor-block="h2" title="Subjudul">Subjudul</button><button type="button" data-editor-block="blockquote" title="Kutipan">Kutipan</button><span></span>' +
    '<button type="button" data-editor-cmd="bold" aria-label="Tebal" title="Tebal"><b>B</b></button><button type="button" data-editor-cmd="italic" aria-label="Miring" title="Miring"><i>I</i></button><button type="button" data-editor-cmd="insertUnorderedList" aria-label="Daftar berpoin" title="Daftar berpoin">• Daftar</button><button type="button" data-editor-cmd="insertOrderedList" aria-label="Daftar bernomor" title="Daftar bernomor">1. Daftar</button><button type="button" data-editor-cmd="createLink" aria-label="Sisipkan tautan" title="Sisipkan tautan">Tautan</button></div>' +
    '<div class="article-editor" id="' + id + '" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Isi artikel" data-placeholder="Mulai menulis artikel di sini…"></div><textarea class="in article-source" hidden>' + esc(v) + '</textarea></div>' +
    '<small class="h">Gunakan subjudul untuk membagi bahasan, paragraf pendek, dan daftar bila diperlukan.</small><span class="em"></span></div>';
  if (f.t === 'select') {
    /* Opsi boleh berupa teks atau {v,l} (nilai berbeda dari label), dipakai
       modul direktori untuk relasi ber-UUID. */
    var opt = function (o) { return (o && typeof o === 'object') ? { v: String(o.v), l: String(o.l) } : { v: String(o), l: String(o) }; };
    var opts = f.o.map(opt);
    var selOpts = opts.map(function (o) { return '<option value="' + esc(o.v) + '"' + (String(v) === o.v ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('');
    /* Nilai tersimpan yang tidak ada di daftar: tampilkan sebagai opsi tambahan
       agar tidak hilang/ditimpa kosong saat formulir disimpan. */
    if (v && !opts.some(function (o) { return o.v === String(v); })) selOpts += '<option value="' + esc(v) + '" selected>' + esc(v) + '</option>';
    return h + lab + '<select class="in" id="' + id + '"><option value="">' + esc(f.empty || 'Pilih…') + '</option>' + selOpts + '</select>' + hint + '<span class="em"></span></div>'; }
  if (f.t === 'area' || f.t === 'rich') return h + lab + '<textarea class="in ' + (f.t === 'rich' ? 'rich' : '') + '" id="' + id + '">' + esc(v) + '</textarea>' + (f.k === 'meta_desc' ? '<small class="seo-count" data-count-for="' + id + '"></small>' : '') + hint + '<span class="em"></span></div>';
  if (f.t === 'image') v = safeMediaURL(v);
  if (f.t === 'image') return h + '<span class="lab">' + esc(f.l) + (f.req ? ' *' : '') + '</span><div class="img" data-f="' + (f.f || 'umum') + '" data-png="' + (f.png ? 1 : '') + '" data-max="' + (f.max || 1600) + '"><div class="thumb" style="' + (v ? 'background-image:url(\'' + esc(v) + '\')' : '') + '">' + (v ? '' : 'Belum ada') + '</div><div><label class="btn s g">Pilih gambar<input type="file" accept="image/*" hidden></label> <button type="button" class="btn s o" data-act="imgdel">Hapus</button><input class="in" type="hidden" value="' + esc(v) + '"></div></div>' + hint + '<span class="em"></span></div>';
  if (f.t === 'images') { v = Array.isArray(v) ? v : []; return h + '<span class="lab">' + esc(f.l) + '</span><div class="imgs" data-f="' + (f.f || 'umum') + '" data-max="' + (f.max || 0) + '" data-size="1600">' + v.map(imgItem).join('') + '<label class="btn s g">Tambah gambar<input type="file" accept="image/*" multiple hidden></label></div>' + hint + '<span class="em"></span></div>'; }
  if (f.t === 'repeat') { v = Array.isArray(v) ? v : []; while (f.fixed && v.length < f.fixed) v.push({}); return h + '<span class="lab">' + esc(f.l) + '</span>' + hint + '<div class="rep" data-fixed="' + (f.fixed || '') + '">' + v.map(function (r, i) { return rowHTML(f, r, i); }).join('') + '</div>' + (f.fixed ? '' : '<button type="button" class="btn s o" data-act="radd" data-k="' + f.k + '">+ Tambah</button>') + '</div>'; }
  if (f.t === 'color') return h + lab + '<input class="in" id="' + id + '" type="color" value="' + esc(v || '#17352A') + '">' + hint + '</div>';
  var type = f.t === 'date' ? 'date' : f.t === 'num' ? 'number' : f.t === 'url' ? 'url' : 'text';
  return h + lab + '<input class="in" id="' + id + '" type="' + type + '" value="' + esc(v) + '"' + (f.dl ? ' list="dl_' + f.k + '"' : '') + '>' + (f.dl ? '<datalist id="dl_' + f.k + '">' + f.dl.map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist>' : '') + (f.k === 'meta_judul' ? '<small class="seo-count" data-count-for="' + id + '"></small>' : '') + hint + '<span class="em"></span></div>';
}
function safeMediaURL(s) { s = String(s || '').trim(); if (/^\/(?!\/)[^\\"'<>]*$/.test(s)) return s; try { var u = new URL(s, location.href); if (u.protocol === 'https:' && u.origin !== location.origin) return u.href; } catch (e) {} return ''; }
function imgItem(u) { u = safeMediaURL(u); return '<div class="it" data-u="' + esc(u) + '" style="' + (u ? 'background-image:url(\'' + esc(u) + '\')' : '') + '"><button type="button" data-act="imgrm" title="Hapus">&times;</button></div>'; }
function rowHTML(f, r, i) { return '<div class="rrow" data-f="' + f.k + '"><div class="rh"><span>' + esc(f.l) + ' ' + (i + 1) + '</span>' + (f.fixed ? '' : '<button type="button" class="act d" data-act="rdel">Hapus</button>') + '</div>' + f.sub.map(function (s) { return fieldHTML(s, r[s.k]); }).join('') + '</div>'; }
function formHTML(F, data) { return F.map(function (f) { return fieldHTML(f, data[f.k]); }).join(''); }
function articleFormHTML(F, data) {
  var main = ['judul','kategori','tanggal','penulis','foto','ringkasan','isi'];
  return '<div class="article-core">' + formHTML(F.filter(function (f) { return main.indexOf(f.k) >= 0; }), data) + '</div><details class="article-settings"><summary><span>SEO & pengaturan lanjutan</span><small>Tag, metadata pencarian, dan media tambahan</small></summary><div class="article-settings-grid">' + formHTML(F.filter(function (f) { return main.indexOf(f.k) < 0; }), data) + '</div></details>';
}
function fieldWrap(rootEl, key) {
  var direct = [].filter.call(rootEl.children, function (c) { return c.getAttribute && c.getAttribute('data-k') === key; })[0];
  return direct || $('[data-k="' + key + '"]', rootEl);
}
function articleInlineHTML(s) {
  return esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) { return '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>'; }).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
function articleMarkdownHTML(s) {
  var blocks = String(s || '').replace(/\r/g, '').split(/\n\s*\n/).filter(function (b) { return b.trim(); });
  return blocks.map(function (block) {
    var lines = block.split('\n'), first = lines[0].trim(), m;
    if ((m = first.match(/^#{2,3}\s+(.+)$/))) return '<h2>' + articleInlineHTML(m[1]) + '</h2>';
    if (lines.every(function (line) { return /^\s*[-*]\s+/.test(line); })) return '<ul>' + lines.map(function (line) { return '<li>' + articleInlineHTML(line.replace(/^\s*[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
    if (lines.every(function (line) { return /^\s*\d+[.)]\s+/.test(line); })) return '<ol>' + lines.map(function (line) { return '<li>' + articleInlineHTML(line.replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>';
    if (lines.every(function (line) { return /^\s*&gt;\s?/.test(esc(line)); })) return '<blockquote><p>' + lines.map(function (line) { return articleInlineHTML(line.replace(/^\s*>\s?/, '')); }).join('<br>') + '</p></blockquote>';
    return '<p>' + lines.map(articleInlineHTML).join('<br>') + '</p>';
  }).join('');
}
function articleEditorMarkdown(root) {
  function inline(node) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1) return '';
    var tag = node.tagName.toLowerCase(), body = [].map.call(node.childNodes, inline).join('');
    if (tag === 'br') return '\n';
    if (tag === 'strong' || tag === 'b') return '**' + body + '**';
    if (tag === 'em' || tag === 'i') return '*' + body + '*';
    if (tag === 'a') { var href = node.getAttribute('href') || ''; return /^https?:\/\//i.test(href) ? '[' + body + '](' + href + ')' : body; }
    return body;
  }
  function block(node) {
    if (node.nodeType === 3) return node.nodeValue.trim();
    if (node.nodeType !== 1) return '';
    var tag = node.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') return [].map.call(node.children, function (li, i) { return (tag === 'ul' ? '- ' : (i + 1) + '. ') + inline(li).trim(); }).join('\n');
    if (tag === 'blockquote') return inline(node).split('\n').map(function (line) { return '> ' + line; }).join('\n');
    var value = inline(node).trim();
    if (/^h[1-6]$/.test(tag)) return '## ' + value;
    return value;
  }
  return [].map.call(root.childNodes, block).filter(Boolean).join('\n\n').trim();
}
function initArticleEditor(form) {
  $$('.article-editor', form).forEach(function (editor) {
    var wrap = editor.closest('.fld'), source = $('.article-source', wrap), toolbar = $('.article-toolbar', wrap);
    editor.innerHTML = articleMarkdownHTML(source.value);
    function sync() { source.value = articleEditorMarkdown(editor); source.dispatchEvent(new Event('input', { bubbles: true })); }
    editor.addEventListener('input', sync);
    editor.addEventListener('paste', function (e) { e.preventDefault(); var text = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, text); });
    toolbar.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    toolbar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; editor.focus();
      if (b.hasAttribute('data-editor-block')) document.execCommand('formatBlock', false, b.getAttribute('data-editor-block'));
      else {
        var cmd = b.getAttribute('data-editor-cmd');
        if (cmd === 'createLink') { var selected = window.getSelection().toString(); if (!selected) return toast('Pilih teks yang akan dijadikan tautan.', 1); var url = prompt('Masukkan alamat tautan (https://…)'); if (!url) return; try { var parsed = new URL(url, location.href); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); url = parsed.href; } catch (_) { return toast('Alamat tautan harus menggunakan http:// atau https://.', 1); } document.execCommand(cmd, false, url); }
        else document.execCommand(cmd, false, null);
      }
      sync();
    });
  });
}
function ytId(s) { s = String(s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : s; }
function readField(w, f) {
  var el = f.t === 'editor' ? $('.article-source', w) : $('.in', w);
  if (f.t === 'bool') return el.checked;
  if (f.t === 'images') return $$('.it', w).map(function (e) { return e.getAttribute('data-u'); });
  if (f.t === 'repeat') return $$('.rrow', w).map(function (row) { return readForm(row, f.sub); });
  if (f.t === 'num') return el.value === '' ? '' : Number(el.value);
  var v = el.value.trim(); if (f.k === 'youtube') v = ytId(v); return v;
}
function readForm(rootEl, F) { var o = {}; F.forEach(function (f) { var w = fieldWrap(rootEl, f.k); if (w) o[f.k] = readField(w, f); }); return o; }
function validate(rootEl, F, data) {
  var ok = true;
  F.forEach(function (f) {
    var w = fieldWrap(rootEl, f.k); if (!w) return;
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
      var keepPng = png || /png/.test(file.type); var tp = keepPng ? 'image/png' : 'image/webp';
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
  var results = await Promise.all([
    sb.from('content_items').select('type,published'),
    sb.from('content_items').select('id,type,data,published,updated_at').order('updated_at', { ascending: false }).limit(12)
  ]);
  var r = results[0], recent = results[1];
  if (r.error) return toast(errMsg(r.error), 1);
  if (recent.error) return toast(errMsg(recent.error), 1);
  var n = {}, d = {}; (r.data || []).forEach(function (x) { n[x.type] = (n[x.type] || 0) + 1; if (!x.published) d[x.type] = (d[x.type] || 0) + 1; });
  var un = Object.keys(COLS).filter(function (k) { return !(S.set.managed && S.set.managed[k]); });
  var cards = Object.keys(COLS).filter(function (k) { return can(COLS[k]); }).map(function (k) { return '<a class="stat" data-nav href="#/' + k + '"><b>' + (n[k] || 0) + '</b><span>' + COLS[k].l + (d[k] ? ' · ' + d[k] + ' draf' : '') + '</span></a>'; }).join('');
  var draftCount = d.berita || 0;
  var attention = '<div class="task-grid"><a class="task-card" data-nav href="#/berita?status=draft"><span class="task-label">Draf berita</span><b>' + draftCount + '</b><small>' + (draftCount ? 'Buka daftar draf untuk ditinjau atau dilanjutkan.' : 'Tidak ada draf berita yang menunggu.') + '</small></a>';
  if (canMembersView()) attention += '<a class="task-card" data-nav href="#/members?status=pending"><span class="task-label">Verifikasi KTA</span><b id="memCount">…</b><small id="memHint">Memeriksa pendaftaran anggota.</small></a>';
  attention += '</div>';
  var latest = (recent.data || []).filter(function (x) { return COLS[x.type] && can(COLS[x.type], x.data); }).slice(0, 5);
  var latestHTML = '<section class="recent-panel"><div class="section-head"><div><h3>Terakhir diperbarui</h3><p>Konten yang paling baru disentuh di CMS.</p></div></div>' + (latest.length ? '<ul class="recent-list">' + latest.map(function (x) { var c = COLS[x.type], title = c.ti(x.data) || '(tanpa judul)', date = x.updated_at ? new Date(x.updated_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; return '<li><a data-nav href="#/' + x.type + '/' + encodeURIComponent(x.id) + '"><span><b>' + esc(title) + '</b><small>' + esc(c.l) + (date ? ' · ' + esc(date) : '') + '</small></span><span class="chip ' + (x.published ? '' : 'x') + '">' + (x.published ? 'Terbit' : 'Draf') + '</span></a></li>'; }).join('') + '</ul>' : '<div class="empty">Belum ada konten terbaru yang dapat Anda kelola.</div>') + '</section>';
  shell('Ringkasan', '', (isAdmin() && un.length ? '<div class="note">Jenis konten berikut belum dikelola CMS, jadi situs masih memakai data bawaan: <b>' + un.map(function (k) { return COLS[k].l; }).join(', ') + '</b>. Jalankan <code>supabase/seed.sql</code> atau aktifkan dari halaman masing-masing.</div>' : '') + attention + '<div class="section-head"><div><h3>Kelola konten</h3><p>Ringkasan data yang dapat Anda akses.</p></div></div><div class="grid">' + cards + '</div>' + latestHTML);
  function loadMembers() {
    if (!canMembersView()) return;
    sb.from('profiles').select('status').then(function (mr) {
      var count = $('#memCount'), hint = $('#memHint');
      if (!count || !hint) return;
      if (mr.error || !mr.data) { count.textContent = '—'; hint.textContent = 'Status verifikasi tidak tersedia.'; return; }
      var pending = mr.data.filter(function (x) { return x.status === 'pending'; }).length;
      count.textContent = String(pending);
      hint.textContent = pending ? 'Perlu diperiksa oleh pengelola.' : 'Tidak ada pendaftaran yang menunggu.';
    }).catch(function () {
      var count = $('#memCount'), hint = $('#memHint');
      if (count) count.textContent = '—';
      if (hint) hint.textContent = 'Status verifikasi tidak tersedia.';
    });
  }
  loadMembers();
}
async function loadItems(key) { var r = await sb.from('content_items').select('*').eq('type', key).order('sort', { ascending: true }).order('created_at', { ascending: true }); if (r.error) throw r.error; S.items[key] = r.data || []; return S.items[key]; }
async function viewList(key, q, flt, pub) {
  var c = COLS[key]; if (!c) return viewHome(); if (!can(c)) return noAccess();
  pub = pub || '';
  try { await loadItems(key); } catch (e) { return toast(errMsg(e), 1); }
  var list = S.items[key].slice(); if (c.ord === 'date') list.sort(function (a, b) { return String(b.data.tanggal || '').localeCompare(String(a.data.tanggal || '')); });
  var ff = c.filter && c.F.filter(function (f) { return f.k === c.filter; })[0];
  var shown = list.filter(function (x) { return (can(c, x.data) || isAdmin() || S.me.role === 'pengurus' && key === 'berita') && (isAdmin() || S.me.role === 'pengurus' && key === 'berita' || S.me.role === 'pengurus' || S.me.role === 'editor' || x.created_by === (S.user.email || '').toLowerCase()) && (!q || JSON.stringify(x.data).toLowerCase().indexOf(q.toLowerCase()) > -1) && (!flt || x.data[c.filter] === flt) && (!pub || (pub === 'published' ? x.published : !x.published)); });
  var movable = !c.ord && !q && !pub;
  var rows = shown.map(function (x, i) {
    /* Selaras policy items_update di supabase/schema.sql:
       (can_edit DAN created_by = diri sendiri) ATAU can_review(type).
       can_review = super_admin, atau pengurus pada jenis 'berita'. */
    var me = (S.user.email || '').toLowerCase(), r = S.me.role;
    var writable = isAdmin()
      || (r === 'pengurus' && key === 'berita')
      || ((r === 'pengurus' || r === 'editor') && ['agenda','video','galeri','kegiatan','majelis'].indexOf(key) >= 0 && x.created_by === me)
      || (r === 'jurnalis' && key === 'berita' && ['Literasi','Opini'].indexOf((x.data && x.data.kategori) || '') >= 0 && x.created_by === me)
      || (r === 'ustadz' && key === 'tanya_jawab' && x.created_by === me);
    /* Jurnalis tidak boleh menerbitkan sendiri (ditegakkan guard_publish di schema.sql). */
    var canPub = writable && !(r === 'jurnalis' && !x.published);
    var media = safeMediaURL(x.data.foto || x.data.logo), title = c.ti(x.data) || '(tanpa judul)';
    var thumb = media ? '<img class="row-thumb" src="' + esc(media) + '" alt="" loading="lazy">' : '';
    var more = '<details class="row-menu"><summary class="act" aria-label="Aksi lainnya" title="Aksi lainnya">•••</summary><div class="row-menu-items">' + (movable ? '<button class="act" data-mv="-1" data-id="' + x.id + '" title="Naikkan urutan">Naikkan</button><button class="act" data-mv="1" data-id="' + x.id + '" title="Turunkan urutan">Turunkan</button>' : '') + '<button class="act" data-dup="' + x.id + '">Salin sebagai draf</button><button class="act d" data-del="' + x.id + '">Hapus</button></div></details>';
    return '<tr><td class="t"><span class="row-title">' + thumb + '<span><b>' + esc(title) + '</b><small>' + esc(c.su(x.data)) + '</small></span></span></td><td class="hm"><span class="chip ' + (x.published ? '' : 'x') + '">' + (x.published ? 'Terbit' : 'Draf') + '</span></td><td class="a">' + (writable ? '<a class="act" data-nav href="#/' + key + '/' + x.id + '">Ubah</a>' + (canPub ? '<button class="act" data-pub="' + x.id + '">' + (x.published ? 'Sembunyikan' : 'Terbitkan') + '</button>' : '') + more : '<span class="chip">Hanya baca</span>') + '</td></tr>';
  }).join('');
  var managed = S.set.managed && S.set.managed[key];
  shell(c.l, key, (!managed ? '<div class="note">Jenis ini belum dikelola CMS, jadi situs masih memakai data bawaan. ' + (isAdmin() ? '<button class="btn s" id="mng">Aktifkan pengelolaan</button> (situs akan memakai data di sini, termasuk bila kosong)' : 'Minta admin mengaktifkannya.') + '</div>' : '') +
    '<div class="panel"><div class="bar"><input type="search" id="q" placeholder="Cari…" value="' + esc(q || '') + '">' + (ff ? '<select id="flt" aria-label="Filter ' + esc(ff.l.toLowerCase()) + '"><option value="">Semua ' + esc(ff.l.toLowerCase()) + '</option>' + ff.o.map(function (o) { return '<option' + (o === flt ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' : '') + '<select id="pubFilter" aria-label="Status publikasi"><option value="">Semua status</option><option value="published"' + (pub === 'published' ? ' selected' : '') + '>Terbit</option><option value="draft"' + (pub === 'draft' ? ' selected' : '') + '>Draf</option></select></div>' +
    (shown.length ? '<table><thead><tr><th>Judul</th><th class="hm">Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">' + (list.length ? 'Tidak ada yang cocok.' : 'Belum ada data.') + '</div>') + '</div>',
    '<a class="btn" data-nav href="#/' + key + '/new">+ Tambah</a>');
  var qi = $('#q'); qi.addEventListener('input', function () { clearTimeout(qi.__t); qi.__t = setTimeout(function () { viewList(key, qi.value, $('#flt') && $('#flt').value, $('#pubFilter').value); var n = $('#q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); });
  if ($('#flt')) $('#flt').onchange = function () { viewList(key, $('#q').value, this.value, $('#pubFilter').value); };
  $('#pubFilter').onchange = function () { viewList(key, $('#q').value, $('#flt') && $('#flt').value, this.value); };
  if ($('#mng')) $('#mng').onclick = function () { var m = Object.assign({}, S.set.managed || {}); m[key] = true; saveSet('managed', m).then(function () { toast('Pengelolaan diaktifkan.'); viewList(key); }).catch(function (e) { toast('Gagal mengaktifkan: ' + errMsg(e), 1); }); };
  $('.main').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-del],[data-dup],[data-pub],[data-mv]'); if (!b) return;
    try {
      if (b.hasAttribute('data-del')) { if (!isAdmin()) throw new Error('Hanya Super Admin yang dapat menghapus konten.'); if (!confirm('Hapus data ini? Tindakan ini tidak dapat dibatalkan.')) return; var r = await sb.from('content_items').delete().eq('id', b.getAttribute('data-del')); if (r.error) throw r.error; toast('Dihapus.'); }
      else if (b.hasAttribute('data-dup')) { var s = S.items[key].filter(function (x) { return x.id === b.getAttribute('data-dup'); })[0]; var d = JSON.parse(JSON.stringify(s.data)); if (d.judul) d.judul += ' (salinan)'; var mx = S.items[key].reduce(function (m, x) { return Math.max(m, x.sort); }, 0); var r2 = await sb.from('content_items').insert({ type: key, data: d, sort: mx + 10, published: false }).select('id').single(); if (r2.error) throw r2.error; toast('Disalin sebagai draf.'); }
      else if (b.hasAttribute('data-pub')) { var s2 = S.items[key].filter(function (x) { return x.id === b.getAttribute('data-pub'); })[0]; if (!isAdmin() && S.me.role !== 'pengurus' && S.me.role !== 'editor' && s2.created_by !== (S.user.email || '').toLowerCase()) throw new Error('Anda hanya dapat menerbitkan konten yang Anda buat.'); var r3 = await sb.from('content_items').update({ published: !s2.published }).eq('id', s2.id).select('id').single(); if (r3.error) throw r3.error; toast(s2.published ? 'Disembunyikan.' : 'Diterbitkan.'); }
      else { if (!isAdmin()) throw new Error('Hanya Super Admin yang dapat mengubah urutan konten.'); var id = b.getAttribute('data-id'), dir = +b.getAttribute('data-mv'), vis = shown, i = vis.findIndex(function (x) { return x.id === id; }), j = i + dir; if (j < 0 || j >= vis.length) return; var A = vis[i], B = vis[j], sa = A.sort, sbv = B.sort; if (sa === sbv) { sbv = sa + dir; } var u1 = await sb.from('content_items').update({ sort: sbv }).eq('id', A.id).select('id').single(), u2 = await sb.from('content_items').update({ sort: sa }).eq('id', B.id).select('id').single(); if (u1.error || u2.error) throw (u1.error || u2.error); }
      viewList(key, $('#q') && $('#q').value, $('#flt') && $('#flt').value, $('#pubFilter') && $('#pubFilter').value);
    } catch (er) { toast(errMsg(er), 1); }
  });
}
async function viewEdit(key, id) {
  var c = COLS[key]; if (!c) return viewHome(); if (!can(c)) return noAccess();
  /* Content-form CRUD intentionally uses .select('id')/.select('key')/.select('email').single()
     (README/chatlogs: 226.0.5) — the write is still verified by RLS, but the returned
     payload is only the primary key so large JSON / forbidden columns cannot cause a
     save failure that looks like a permission or missing-row error. */
  var item = null; if (id !== 'new') { var r = await sb.from('content_items').select('*').eq('id', id).single(); if (r.error || !r.data || !(can(c, r.data) || isAdmin() || S.me.role === 'pengurus' && key === 'berita')) { toast('Data tidak ditemukan atau Anda tidak berhak mengubahnya.', 1); return location.hash = '#/' + key; } item = r.data; }

  var data = item ? item.data : (key === 'layanan' ? { tampil: true } : (key === 'berita' ? { kategori: S.me.role === 'jurnalis' ? 'Literasi' : 'Berita', penulis: (S.me && S.me.nama) || '' } : {}));
  if (item && !can(c, item.data)) return noAccess();
  var pubDefault = item ? !!item.published : S.me.role !== 'jurnalis';
  /* Jurnalis tidak dapat menerbitkan sendiri — ditegakkan guard_publish di schema.sql.
     Kotak centang dikunci agar percobaan tidak berujung galat dari server. */
  var pubLocked = S.me.role === 'jurnalis' && !pubDefault;
  var hint = (!item && S.me.role === 'jurnalis') ? '<div class="note">Penyerahan ke tinjauan: tulisan Jurnalis disimpan sebagai <b>draf</b> dan perlu ditinjau Pengurus sebelum terbit.</div>' : '';
  var fields = c.F.map(function (f) { if (key === 'berita' && f.k === 'kategori') { var ff = Object.assign({}, f); ff.o = S.me.role === 'jurnalis' ? ['Literasi','Opini'] : ['Berita','Laporan','Literasi','Opini']; return ff; } return f; });
  var fieldsHTML = key === 'berita' ? articleFormHTML(fields, data) : formHTML(fields, data);
  shell((item ? 'Ubah ' : 'Tambah ') + c.l, key, hint + '<form class="form panel ' + (key === 'berita' ? 'article-form' : '') + '" id="form" novalidate>' + fieldsHTML + '<label class="chk"><input type="checkbox" id="pub" ' + (pubDefault ? 'checked' : '') + (pubLocked ? ' disabled title="Hanya Pengurus yang dapat menerbitkan tulisan Jurnalis."' : '') + '> Terbitkan (tampil di situs)</label><div class="foot"><button class="btn g" id="save" type="submit">Simpan</button><a class="btn o" data-nav href="#/' + key + '">Batal</a></div></form>');
  var form = $('#form'); form.__F = fields; bindForm(form);
  if (key === 'berita') {
    initArticleEditor(form);
    $$('.seo-count', form).forEach(function (counter) {
      var field = $('#' + counter.getAttribute('data-count-for'), form), limit = counter.closest('.fld').getAttribute('data-k') === 'meta_judul' ? 60 : 160;
      if (!field) return;
      function updateCount() { var n = field.value.length; counter.textContent = n + ' karakter' + (n ? (n < limit - 20 ? ' · masih pendek' : n > limit + 10 ? ' · terlalu panjang' : ' · sesuai panjang umum') : ' · diisi otomatis bila kosong'); }
      field.addEventListener('input', updateCount); updateCount();
    });
  }
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); var d = readForm(form, fields), categoryField = key === 'berita' && fields.filter(function (f) { return f.k === 'kategori'; })[0];
    var categoryAllowed = key !== 'berita' || (!!d.kategori && (S.me.role !== 'jurnalis' || categoryField.o.indexOf(d.kategori) >= 0));
    if (!can(c, d) || !categoryAllowed) { toast('Peran Anda tidak berhak mengelola kategori ini.', 1); return; } if (!validate(form, fields, d)) { toast('Periksa isian yang ditandai merah.', 1); var f = $('.fld.err', form); if (f) f.scrollIntoView({ block: 'center' }); return; }
    var btn = $('#save'); btn.disabled = true; var pub = $('#pub').checked, r2;
    try {
      /* Kembalikan hanya kunci utama: hindari payload JSON besar, tetapi
         .single() tetap mendeteksi bila RLS tidak mengizinkan baris tersimpan
         untuk dibaca atau tidak ada baris yang cocok pada UPDATE. */
      if (item) r2 = await sb.from('content_items').update({ data: d, published: pub }).eq('id', item.id).select('id').single();
      else { var all = await sb.from('content_items').select('sort').eq('type', key); if (all.error) throw all.error; var mx = (all.data || []).reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0); r2 = await sb.from('content_items').insert({ type: key, data: d, sort: mx + 10, published: pub }).select('id').single(); }
      if (r2.error) throw r2.error; toast('Tersimpan.'); location.hash = '#/' + key;
    } catch (er) { toast('Gagal menyimpan: ' + errMsg(er), 1); btn.disabled = false; }
  });
}
function saveSet(key, value) { return sb.from('site_settings').upsert({ key: key, value: value }, { onConflict: 'key' }).select('key').single().then(function (r) { if (r.error) throw r.error; S.set[key] = value; return r; }); }
function viewSet(key) {
  var c = SETS[key]; if (!c) return viewHome(); if (!isAdmin()) return noAccess();
  var data = S.set[key] || {};
  if (key === 'iklan') data = Object.assign({}, data, { slots: Array.isArray(data.slots) ? data.slots : AD_ROUTES.map(function (r) { return { page:r.v, active:false, mode:'Gambar' }; }) });
  var intro = key === 'iklan' ? '<div class="note">Setiap halaman memiliki satu slot Utama. Pilih Gambar untuk mengunggah banner, atau Google AdSense lalu masukkan ID unit. Publisher ID dipakai bersama untuk semua slot AdSense.</div>' : '';
  shell(c.l, 'set/' + key, intro + '<form class="form panel" id="form" novalidate>' + formHTML(c.F, data) + '<div class="foot"><button class="btn g" id="save" type="submit">Simpan</button></div></form>');
  var form = $('#form'); form.__F = c.F; bindForm(form);
  if (key === 'iklan') {
    var syncAdFields = function () {
      var hasAdSense = false;
      $$('.rrow', fieldWrap(form, 'slots')).forEach(function (row) {
        var mode = $('.in', fieldWrap(row, 'mode')), imageMode = !mode || mode.value === 'Gambar';
        if (!imageMode) hasAdSense = true;
        ['image','alt','href'].forEach(function (k) { var w = fieldWrap(row, k); if (w) w.hidden = !imageMode; });
        var unit = fieldWrap(row, 'ad_slot'); if (unit) unit.hidden = imageMode;
      });
      var client = fieldWrap(form, 'client'); if (client) client.hidden = !hasAdSense;
    };
    form.addEventListener('change', syncAdFields); syncAdFields();
  }
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); var d = readForm(form, c.F); if (!isAdmin()) { toast('Hanya Super Admin dapat mengubah pengaturan situs.', 1); return; } if (!validate(form, c.F, d)) { toast('Periksa isian yang ditandai merah.', 1); return; }
    if (key === 'iklan') {
      var used = {};
      for (var i = 0; i < (d.slots || []).length; i++) {
        var slot = d.slots[i];
        if (!slot.page || used[slot.page]) return toast('Setiap halaman hanya boleh memiliki satu slot Utama.', 1);
        used[slot.page] = true;
        if (slot.active && slot.mode === 'Gambar' && !slot.image) return toast('Unggah gambar untuk slot aktif di ' + (AD_ROUTES.filter(function (r) { return r.v === slot.page; })[0] || {}).l + '.', 1);
        if (slot.active && slot.mode === 'Google AdSense' && !/^\d{4,20}$/.test(slot.ad_slot || '')) return toast('Isi ID unit AdSense berupa angka untuk setiap slot aktif.', 1);
        if (slot.href && !/^https:\/\//i.test(slot.href)) return toast('Tautan gambar iklan harus menggunakan HTTPS.', 1);
      }
      if (d.client && !/^ca-pub-\d{16}$/.test(d.client)) return toast('Publisher ID AdSense harus berformat ca-pub- diikuti 16 digit.', 1);
      if ((d.slots || []).some(function (slot) { return slot.active && slot.mode === 'Google AdSense'; }) && !/^ca-pub-\d{16}$/.test(d.client || '')) return toast('Isi Publisher ID AdSense sebelum mengaktifkan slot AdSense.', 1);
    }
    var btn = $('#save'); btn.disabled = true;
    try { await saveSet(key, Object.assign({}, data, d)); S.dirty = false; toast('Tersimpan. Muat ulang situs untuk melihat hasilnya.'); }
    catch (er) { toast('Gagal menyimpan: ' + errMsg(er), 1); }
    finally { btn.disabled = false; }
  });
}
async function viewStaff() {
  if (!isAdmin()) return noAccess();
  var r = await sb.from('staff').select('email,role,nama,prnu').order('created_at', { ascending: true }); if (r.error) return toast(errMsg(r.error), 1); S.staff = r.data || [];
  shell('Pengelola', 'staff', '<div class="note ok">Peran: <b>Super Admin</b> mengelola seluruh situs dan pengelola; <b>Pengurus / Editor</b> mengelola berita umum, agenda, video, galeri, kegiatan pilihan, dan majelis; <b>Jurnalis</b> membuat usulan Jurnal Literasi dan Opini, yang perlu ditinjau Pengurus sebelum terbit; <b>Ustadz</b> mengelola Tanya Jawab Agama. Pengurus ranting hanya dapat memverifikasi anggota di ranting yang ditetapkan lewat kolom <code>staff.prnu</code>.</div><div class="panel"><table><thead><tr><th>Email</th><th>Nama</th><th>Peran</th><th>Ranting verifikasi</th><th></th></tr></thead><tbody>' +
    S.staff.map(function (s) { var known = ['super_admin','pengurus','jurnalis','ustadz'].indexOf(s.role) >= 0; return '<tr><td>' + esc(s.email) + '</td><td>' + esc(s.nama || '') + '</td><td><select data-role="' + esc(s.email) + '">' + (known ? '' : '<option value="" selected>' + esc(roleName(s.role)) + ' (peran tidak dikenal)</option>') + ['super_admin','pengurus','jurnalis','ustadz'].map(function (role) { return '<option value="' + role + '"' + (s.role === role ? ' selected' : '') + '>' + esc(roleName(role)) + '</option>'; }).join('') + '</select></td><td>' + (s.role === 'pengurus' ? '<select data-prnu="' + esc(s.email) + '"><option value="">Pilih ranting</option>' + RT.map(function (n, i) { return '<option value="' + String(i + 1).padStart(2, '0') + '"' + (s.prnu === String(i + 1).padStart(2, '0') ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>' : '—') + '</td><td class="a"><button class="act d" data-rm="' + esc(s.email) + '">Hapus</button></td></tr>'; }).join('') +
    '</tbody></table></div><form class="panel form" id="sf" style="margin-top:16px"><h3>Tambah pengelola</h3><div class="fld"><label for="se">Email Google</label><input type="text" id="se" placeholder="nama@gmail.com"></div><div class="fld"><label for="sn">Nama</label><input type="text" id="sn"></div><div class="fld"><label for="sr">Peran</label><select id="sr"><option value="pengurus">Pengurus / Editor</option><option value="jurnalis">Jurnalis (Literasi &amp; Opini)</option><option value="ustadz">Ustadz (Tanya Jawab)</option><option value="super_admin">Super Admin</option></select></div><div class="fld" id="sprnu-w"><label for="sprnu">Ranting untuk verifikasi</label><select id="sprnu"><option value="">Pilih ranting</option>' + RT.map(function (n, i) { return '<option value="' + String(i + 1).padStart(2, '0') + '">' + esc(n) + '</option>'; }).join('') + '</select><small>Wajib untuk peran Pengurus / Editor.</small></div><div class="foot"><button class="btn g" type="submit">Tambah</button></div></form>');
  $('#sr').onchange = function () { $('#sprnu-w').hidden = this.value !== 'pengurus'; };
  $('#sprnu-w').hidden = $('#sr').value !== 'pengurus';
  $$('[data-prnu]').forEach(function (s) { s.onchange = async function () { try { var r2 = await sb.from('staff').update({ prnu: s.value || null }).eq('email', s.getAttribute('data-prnu')).select('email').single(); if (r2.error) throw r2.error; toast('Wilayah verifikasi disimpan.'); } catch (er) { toast(errMsg(er), 1); } }; });
  $$('[data-role]').forEach(function (s) { s.onchange = async function () { try { var email = s.getAttribute('data-role'), person = S.staff.filter(function (x) { return x.email === email; })[0]; if (person && person.role === 'super_admin' && s.value !== 'super_admin') { toast('Promosikan Super Admin lain sebelum menurunkan peran ini.', 1); return viewStaff(); } if (s.value === 'pengurus' && !(person && person.prnu)) { toast('Pilih dan simpan ranting verifikasi sebelum menjadikan akun ini Pengurus.', 1); return viewStaff(); } var r2 = await sb.from('staff').update({ role: s.value }).eq('email', email).select('email').single(); if (r2.error) throw r2.error; toast('Peran diubah.'); viewStaff(); } catch (er) { toast(errMsg(er), 1); } }; });
  $('#sf').onsubmit = async function (e) { e.preventDefault(); var em = $('#se').value.trim().toLowerCase(), role = $('#sr').value, prnu = $('#sprnu').value; if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return toast('Email tidak valid.', 1); if (role === 'pengurus' && !prnu) return toast('Pilih ranting yang menjadi wilayah verifikasi.', 1); try { var r2 = await sb.from('staff').insert({ email: em, nama: $('#sn').value.trim(), role: role, prnu: role === 'pengurus' ? prnu : null }).select('email').single(); if (r2.error) throw r2.error; toast('Pengelola ditambahkan.'); viewStaff(); } catch (er) { toast(errMsg(er), 1); } };
  $$('[data-rm]').forEach(function (b) { b.onclick = async function () { if (!confirm('Hapus pengelola ' + b.getAttribute('data-rm') + '?')) return; var email = b.getAttribute('data-rm'), person = S.staff.filter(function (x) { return x.email === email; })[0]; if (person && person.role === 'super_admin' && S.staff.filter(function (x) { return x.role === 'super_admin'; }).length < 2) { toast('Super Admin terakhir tidak dapat dihapus.', 1); return; } try { var r2 = await sb.from('staff').delete().eq('email', email); if (r2.error) throw r2.error; toast('Dihapus.'); viewStaff(); } catch (er) { toast(errMsg(er), 1); } }; });
}
async function viewMembers(status) {
  if (!canMembers()) return noAccess();
  if (!isAdmin() && S.me.role !== 'pengurus' && S.me.role !== 'editor') return noAccess();
  status = ['pending','verified','rejected'].indexOf(status) >= 0 ? status : '';
  /* Paginasi: 200 baris per halaman. RLS sudah membatasi ke wilayah pengurus. */
  var PAGE = 200, page = Math.max(0, parseInt(S.memPage || 0, 10) || 0);
  var q0 = sb.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (status) q0 = q0.eq('status', status);
  var r = await q0;
  if (r.error) return toast(errMsg(r.error), 1);
  var list = r.data || [], total = r.count == null ? list.length : r.count, pages = Math.max(1, Math.ceil(total / PAGE));
  var chip = function (s) { return '<span class="chip' + (s === 'verified' ? '' : s === 'rejected' ? ' x' : '') + '">' + ({verified:'Terverifikasi',pending:'Menunggu',rejected:'Ditolak'}[s] || s) + '</span>'; };
  shell('Anggota & Verifikasi NIA', 'members', '<div class="note">Alur: <b>Verifikasi</b> → <b>Terbitkan NIA</b>. NIA diterbitkan server dan tidak dapat diubah setelah terbit. Pengurus hanya melihat anggota di wilayahnya (atur kolom <code>prnu</code> di menu Pengelola).</div><div class="panel"><div class="bar"><input type="search" id="mq" placeholder="Cari nama, email, NIA, HP…" value="' + '"><select id="mf"><option value="">Semua status</option><option value="pending"' + (status === 'pending' ? ' selected' : '') + '>Menunggu</option><option value="verified"' + (status === 'verified' ? ' selected' : '') + '>Terverifikasi</option><option value="rejected"' + (status === 'rejected' ? ' selected' : '') + '>Ditolak</option></select><span class="chip">' + total + ' anggota</span></div>' +
    (list.length ? '<table><thead><tr><th>Anggota</th><th class="hm">Kontak</th><th>NIA</th><th>Status</th><th></th></tr></thead><tbody>' +
    list.map(function (p) { return '<tr><td class="t"><b>' + esc(p.nama || '(tanpa nama)') + '</b><small>' + esc(p.email || '') + (p.ranting ? ' · PRNU ' + esc(p.ranting) : (p.tingkat ? ' · ' + esc(p.tingkat) : '')) + '</small></td><td class="hm">' + esc(p.hp || '—') + '</td><td>' + esc(p.nia || '—') + '</td><td>' + chip(p.status) + '</td><td class="a">' +
      (p.status !== 'verified' ? '<button class="act" data-vfy="' + p.id + '">Verifikasi</button>' : '') +
      (p.status === 'verified' && !p.nia ? '<button class="act" data-nia="' + p.id + '">Terbitkan NIA</button>' : '') +
      (p.status !== 'rejected' && (isAdmin() || S.me.role === 'pengurus' || S.me.role === 'editor') ? '<button class="act" data-rej="' + p.id + '">Tolak</button>' : '') +
      (p.status !== 'pending' && (isAdmin() || S.me.role === 'pengurus' || S.me.role === 'editor') ? '<button class="act" data-pnd="' + p.id + '">Tunggu</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table>'
    : '<div class="empty">Belum ada profil anggota. Akan terisi otomatis saat pengguna mendaftar KTA.</div>') +
    (pages > 1 ? '<div class="bar" style="justify-content:space-between"><button class="btn o s" data-pg="' + (page - 1) + '"' + (page ? '' : ' disabled') + '>‹ Sebelumnya</button><span class="chip">Halaman ' + (page + 1) + ' / ' + pages + '</span><button class="btn o s" data-pg="' + (page + 1) + '"' + (page + 1 < pages ? '' : ' disabled') + '>Berikutnya ›</button></div>' : '') + '</div>');
  var q = $('#mq'), f = $('#mf');
  function filt() { var t = q.value.toLowerCase(); $$('tbody tr').forEach(function (tr) { tr.style.display = !t || tr.textContent.toLowerCase().indexOf(t) > -1 ? '' : 'none'; }); }
  q.addEventListener('input', filt); f.onchange = function () { S.memPage = 0; location.hash = '#/members' + (f.value ? '?status=' + encodeURIComponent(f.value) : ''); viewMembers(f.value); };
  $('.main').addEventListener('click', async function (e) {
    var pg = e.target.closest('[data-pg]');
    if (pg) { S.memPage = Math.max(0, +pg.getAttribute('data-pg')); return viewMembers(status); }
    var b = e.target.closest('[data-vfy],[data-rej],[data-pnd],[data-nia]'); if (!b) return;
    var id = b.getAttribute('data-vfy') || b.getAttribute('data-rej') || b.getAttribute('data-pnd') || b.getAttribute('data-nia');
    try {
      if (b.hasAttribute('data-nia')) {
        if (!confirm('Terbitkan nomor induk untuk anggota ini? Nomor tidak dapat diubah setelah terbit.')) return;
        var rn = await sb.rpc('issue_nia_verified', { p_id: id }); if (rn.error) throw rn.error;
        toast('NIA diterbitkan: ' + rn.data + '.'); return viewMembers(status);
      }
      var st = b.hasAttribute('data-vfy') ? 'verified' : b.hasAttribute('data-rej') ? 'rejected' : 'pending';
      var r2 = await sb.from('profiles').update({ status: st }).eq('id', id).select('id').single(); if (r2.error) throw r2.error;
      toast('Status disimpan: ' + st + '.'); viewMembers(status);
    }
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
  /* Guard perubahan yang belum disimpan: berlaku juga untuk tombol back/forward
     browser dan edit hash manual, bukan hanya klik tautan data-nav. */
  if (!routeGuardSkip && S.dirty && location.hash !== routeLastHash &&
      !confirm('Perubahan belum disimpan. Tinggalkan halaman ini?')) {
    history.replaceState(null, '', location.pathname + location.search + routeLastHash);
    return; /* tetap di halaman yang sedang diedit — formulir tidak dirender ulang */
  }
  routeGuardSkip = false;
  routeLastHash = location.hash;
  var hash = (location.hash || '#/').replace(/^#\/?/, ''), qi = hash.indexOf('?');
  var params = new URLSearchParams(qi < 0 ? '' : hash.slice(qi + 1));
  var p = (qi < 0 ? hash : hash.slice(0, qi)).split('/');
  if (!p[0]) return viewHome();
  if (p[0] === 'dir' && window.MWCDIRADM) return window.MWCDIRADM.route(p[1] || '', p[2] || '');
  if (p[0] === 'set') return viewSet(p[1]);
  if (p[0] === 'staff') return viewStaff();
  if (p[0] === 'members') return viewMembers(params.get('status') || '');
  if (p[0] === 'log') return viewLog();
  if (p[1]) return viewEdit(p[0], p[1]);
  return viewList(p[0], '', '', params.get('status') || '');
}
var routeLastHash = location.hash, routeGuardSkip = false;
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-nav]'); if (a && S.dirty && !confirm('Perubahan belum disimpan. Tinggalkan halaman ini?')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (a && S.dirty) routeGuardSkip = true; /* sudah dikonfirmasi di atas; jangan tanya dua kali */
  if (a && $('#side')) { $('#side').classList.remove('open'); if ($('#burger')) $('#burger').setAttribute('aria-expanded', 'false'); }
}, true);
window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
/* Penjaga khusus navigasi hash". Klik ber-[data-nav] ditangani listener capture di atas;
   ini menutup jalur lain: tombol Back/Forward browser, tautan hash biasa, dan
   perubahan hash dari skrip. Tanpa ini, guard hanya berjalan untuk klik. */
window.addEventListener('hashchange', function () {
  var to = location.hash;
  if (S.dirty && !routeGuardSkip && !confirm('Perubahan belum disimpan. Tinggalkan halaman ini?')) {
    routeGuardSkip = false;
    location.hash = routeLastHash;
    return;
  }
  routeGuardSkip = false;
  routeLastHash = to;
  route();
});

/* Jembatan untuk modul admin tambahan (direktori organisasi, FASE 5).
   Hanya meneruskan fungsi yang sudah ada; tidak mengubah perilaku admin.js. */
window.MWCADM = {
  sb: sb, state: S, shell: shell, toast: toast, esc: esc, fd: fd,
  isAdmin: isAdmin, errMsg: errMsg, roleName: roleName,
  formHTML: formHTML, readForm: readForm, validate: validate, bindForm: bindForm
};

async function boot() {
  if (!sb) return setup();
  try {
    var s = await sb.auth.getSession(); S.session = s.data && s.data.session; if (!S.session) return login();
    S.user = S.session.user; var email = (S.user.email || '').toLowerCase();
    var q = await sb.from('staff').select('email,role,nama'); if (q.error) return fatal('Gagal membaca daftar pengelola: ' + errMsg(q.error) + '. Pastikan supabase/schema.sql sudah dijalankan.');
    S.staff = q.data || []; S.me = S.staff.filter(function (x) { return x.email === email; })[0]; if (!S.me) return denied(email);
    var st = await sb.from('site_settings').select('key,value'); (st.data || []).forEach(function (x) { S.set[x.key] = x.value; });
    sb.auth.onAuthStateChange(function (ev) {
      if (ev === 'SIGNED_OUT') location.href = '/admin';
      /* Saat token/sesi diperbarui, segarkan peran dari staff agar perubahan
         role/penghapusan pengelola berlaku tanpa harus memuat ulang halaman. */
      else if (ev === 'USER_UPDATED' || ev === 'TOKEN_REFRESHED') {
        sb.from('staff').select('email,role,nama').then(function (q2) {
          if (q2.error || !S.user) return;
          S.staff = q2.data || [];
          S.me = S.staff.filter(function (x) { return x.email === ((S.user.email || '')).toLowerCase(); })[0] || null;
          if (!S.me) location.href = '/admin';
        }).catch(function () {});
      }
    });
    route();
  } catch (e) { fatal(errMsg(e)); }
}
boot();
})();
