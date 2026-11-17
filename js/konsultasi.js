/* ============================================================
   Fase 3 — Konsultasi Agama: jalur PEMOHON (frontend).
   Mengonsumsi Edge Functions Phase 2 yang sudah diaudit:
     consultation-ticket-create   (buat tiket, secret sekali-tampil)
     consultation-ticket-access   (baca tiket + tautan unduh lampiran)
     consultation-ticket-message  (pesan lanjutan / persetujuan publikasi)
     consultation-attachment      (unggah & unduh lampiran, bucket privat)
     consultation-public          (kategori aktif untuk dropdown)
   Kontrak payload/limit mengikuti supabase/functions/_shared/validation.ts
   dan RPC consultation_svc_* di supabase/consultation/*.sql. Nama field,
   batas, dan bentuk respons TIDAK dikarang di sini.
   Keamanan: hanya publishable key dari js/config.js (apikey header);
   kredensial tiket (nomor + kode akses) dikirim per permintaan;
   penyimpanan sessionStorage hanya bila pemohon memilih "ingat di tab ini"
   dan selalu bisa dihapus lewat tombol Keluar.
   Semua render lewat put()/esc() (window.MWCUI) — sanitasi sama dengan
   modul situs lain. Gaya kode mengikuti app.js (var/function/IIFE).
   ============================================================ */
(function(){try{
var $=function(i){return document.getElementById(i)};
if(!$('konsultasi'))return;
var put=(window.MWCUI&&window.MWCUI.put)||function(el,html){if(el)el.innerHTML=html};
var esc=window.mwcEsc;
var C=window.MWC_CFG||{};
var FN=C.supabaseUrl?String(C.supabaseUrl).replace(/\/+$/,'')+'/functions/v1/':'';

/* ---- Batas & pola: cermin _shared/validation.ts ---- */
var LIM={judulMin:5,judulMax:150,isiMin:10,isiMax:10000,namaMin:2,namaMax:120,pesanMax:10000,fileMax:5*1024*1024};
var MIME_OK=['image/jpeg','image/png','image/webp','application/pdf'];
var NOMOR_RE=/^KON-[0-9]{6}-[0-9A-HJKMNP-TV-Z]{1,12}$/;
var WA_RE=/^\+?[0-9]{8,15}$/;
var EMAIL_RE=/^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var STATUS_LABEL={baru:'Baru',diverifikasi:'Terverifikasi',ditolak:'Ditolak',menunggu_penugasan:'Menunggu penugasan',ditugaskan:'Sedang ditangani konsultan',menunggu_informasi:'Menunggu informasi dari Anda',menunggu_review:'Menunggu review',terjawab:'Terjawab',selesai:'Selesai'};
var PENGIRIM_LABEL={pemohon:'Anda',konsultan:'Konsultan',reviewer:'Reviewer',admin_konsultasi:'Admin'};
var SELESAI={selesai:1,ditolak:1};

function fmtTgl(iso){var d=new Date(iso);if(isNaN(d))return '';try{return d.toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return iso}}
function fmtUkuran(n){n=Number(n)||0;if(n>=1048576)return (Math.round(n/1048576*10)/10)+' MB';if(n>=1024)return Math.ceil(n/1024)+' KB';return n+' B'}
function pesanUmum(st){return st>=500?'Layanan sedang bermasalah. Coba beberapa saat lagi.':'Permintaan tidak dapat diproses. Periksa isian Anda, lalu coba lagi.'}

/* ---- Panggilan Edge Function ---- */
function hdrs(){var h={'Content-Type':'application/json'};if(C.supabaseKey)h.apikey=C.supabaseKey;return h}
function api(fn,body){return fetch(FN+fn,{method:'POST',cache:'no-store',headers:hdrs(),body:JSON.stringify(body)})}
async function baca(r){
  var j=null;try{j=await r.json()}catch(e){}
  if(r.status===429){var d=(j&&j.details)||{};var t=Number(d.retry_after)||60;
    return {err:'Terlalu banyak permintaan dari perangkat ini. Tunggu sekitar '+t+' detik, lalu coba lagi.'}}
  if(!r.ok)return {err:(j&&j.message)||pesanUmum(r.status)};
  return {ok:j&&Object.prototype.hasOwnProperty.call(j,'data')?j.data:j};
}

/* ---- Kredensial tiket: sessionStorage hanya bila opt-in ---- */
var KRED_KEY='mwc_konsul_kred';
function simpanKred(k){try{sessionStorage.setItem(KRED_KEY,JSON.stringify(k))}catch(e){}}
function bacaKred(){try{var s=sessionStorage.getItem(KRED_KEY);if(!s)return null;var k=JSON.parse(s);return k&&k.nomor&&k.secret?k:null}catch(e){return null}}
function hapusKred(){try{sessionStorage.removeItem(KRED_KEY)}catch(e){}}
function normNomor(v){return String(v||'').trim().toUpperCase()}
function normSecret(v){return String(v||'').trim().toUpperCase().replace(/[\s-]/g,'')}

/* ---- Helper UI ---- */
function busy(btn,on,teks){if(!btn)return;btn.disabled=!!on;if(on){btn.dataset.t=btn.textContent;btn.textContent=teks||'Memproses…'}else if(btn.dataset.t){btn.textContent=btn.dataset.t}}
function tampil(el,on){if(el)el.hidden=!on}
function validasiFld(el,bad,isi){if(el)el.classList.toggle('err',!!bad);if(bad&&!isi.f)isi.f=el;if(bad)isi.n++}

/* ============================================================
   1. FORMULIR KONSULTASI DIGITAL (#ka-online)
   ============================================================ */
var form=$('ka-online');
var KAT_ST=[['ibadah','Ibadah'],['akidah','Akidah'],['akhlak_tasawuf','Akhlak & tasawuf'],['muamalah','Muamalah'],['keluarga','Keluarga'],['waris_wasiat','Waris & wasiat'],['amaliyah_nu','Amaliyah NU'],['lainnya','Lainnya']];
(function isiKategori(){
  var sel=$('kx-kat');if(!sel)return;
  function isi(list){sel.textContent='';var o=document.createElement('option');o.value='';o.textContent='Pilih topik';sel.appendChild(o);list.forEach(function(k){var op=document.createElement('option');op.value=k.kode;op.textContent=k.nama;sel.appendChild(op)})}
  isi(KAT_ST.map(function(x){return {kode:x[0],nama:x[1]}}));
  if(!FN)return;
  api('consultation-public',{action:'categories'}).then(function(r){return r.ok?r.json():null}).then(function(j){
    var d=j&&j.data;if(!d||!d.length)return;
    /* Kategori dari database menggantikan daftar cadangan (kode sama-sama
       regex [a-z0-9_]{2,40}; nilai dikirim utuh ke backend untuk divalidasi). */
    isi(d);
  }).catch(function(){/* fallback statis tetap terisi */});
})();

if(form){
  var cnt=$('kx-cnt'),isiEl=$('kx-isi');
  if(isiEl&&cnt)isiEl.addEventListener('input',function(){cnt.textContent=isiEl.value.length+' / '+LIM.isiMax});
  var chkAnon=$('kx-anon'),nmEl=$('kx-nama');
  if(chkAnon&&nmEl)chkAnon.addEventListener('change',function(){nmEl.disabled=this.checked;if(this.checked)nmEl.value='';nmEl.placeholder=this.checked?'Hamba Allah':''});
  ['kx-kat','kx-judul','kx-isi','kx-nama','kx-wa','kx-em'].forEach(function(i){var e=$(i);if(!e)return;
    e.addEventListener('input',function(){this.classList.remove('err')});e.addEventListener('change',function(){this.classList.remove('err')})});
  $('kx-send').addEventListener('click',function(){
    var m=$('kx-msg'),isi={f:null,n:0},f;
    var kat=$('kx-kat'),judul=$('kx-judul'),isinya=$('kx-isi'),nm=$('kx-nama'),wa=$('kx-wa'),em=$('kx-em');
    var waV=String(wa.value||'').replace(/[\s().-]/g,'').trim(),emV=em.value.trim();
    var nmV=chkAnon&&chkAnon.checked?'':nm.value.trim();
    validasiFld(kat,!kat.value.trim(),isi);
    f=judul.value.trim();validasiFld(judul,f.length<LIM.judulMin||f.length>LIM.judulMax,isi);
    f=isinya.value.trim();validasiFld(isinya,f.length<LIM.isiMin||f.length>LIM.isiMax,isi);
    if(nmV!=='')validasiFld(nm,nmV.length<LIM.namaMin||nmV.length>LIM.namaMax,isi);
    var waBad=waV===''?false:!WA_RE.test(waV);
    var emBad=emV===''?false:(emV.length>254||!EMAIL_RE.test(emV));
    validasiFld(wa,waBad,isi);validasiFld(em,emBad,isi);
    if(waV===''&&emV===''){validasiFld(wa,true,isi);validasiFld(em,true,isi)}
    var priv=$('kx-priv');if(priv&&!priv.checked){m.textContent='Persetujuan pemrosesan data wajib diberikan.';priv.focus();return}
    if(isi.f){m.textContent='Mohon periksa kembali isian bertanda merah (topik, judul, pertanyaan, kontak).';isi.f.focus();return}
    /* Honeypot: kirim nilai input apa adanya — manusia membiarkan kosong,
       bot yang mengisinya akan ditolak server (consultation-ticket-create). */
    var hp=form.querySelector('[name=website]');
    var btn=$('kx-send');busy(btn,true);
    api('consultation-ticket-create',{
      kategori:kat.value.trim().toLowerCase(),
      judul:judul.value.trim(),
      isi:isinya.value.replace(/\r\n/g,'\n').trim(),
      nama:nmV,
      whatsapp:waV,
      email:emV,
      persetujuan_privasi:true,
      persetujuan_publikasi:!!$('kx-pub').checked,
      website:hp?hp.value:''
    }).then(function(r){return baca(r)}).then(function(res){
      busy(btn,false);
      if(res.err){m.textContent=res.err;return}
      tampilkanSukses(res.ok);
      m.textContent='';
    }).catch(function(){busy(btn,false);m.textContent=pesanUmum(0)});
  });
}
function tampilkanSukses(d){
  var panel=$('kx-done');if(!panel)return;
  put(panel,
    '<div class="kx-done-k"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5"/></svg> Konsultasi terkirim</div>'+
    '<p class="kx-done-p">Tiket Anda telah dibuat. Simpan dua data berikut — <b>kode akses hanya ditampilkan sekali</b> dan tidak dapat dipulihkan.</p>'+
    '<div class="kx-kred"><div><small>NOMOR TIKET</small><b class="kx-code" id="kx-knomor">'+esc(d.nomor_tiket||'')+'</b></div>'+
    '<div><small>KODE AKSES</small><b class="kx-code" id="kx-ksecret">'+esc(d.secret||'')+'</b></div></div>'+
    '<div class="kx-actions"><button type="button" class="btn" id="kx-buka">Buka tiket saya</button>'+
    '<button type="button" class="btn o" id="kx-salin">Salin nomor &amp; kode</button></div>'+
    '<p class="kx-note">Cara membuka tiket kembali: masukkan nomor tiket dan kode akses pada bagian "Cek status tiket". Moch. simpan keduanya di catatan Anda.</p>');
  tampil(panel,true);
  var salin=$('kx-salin');
  if(salin)salin.addEventListener('click',function(){
    var t='Nomor tiket: '+(d.nomor_tiket||'')+'\nKode akses: '+(d.secret||'');
    function selesai(){salin.textContent='Tersalin';setTimeout(function(){salin.textContent='Salin nomor & kode'},2000)}
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(selesai,function(){})}else{try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();selesai()}catch(e){}}
  });
  var buka=$('kx-buka');
  if(buka)buka.addEventListener('click',function(){
    var nn=$('kx-nomor'),ns=$('kx-secret');
    if(nn)nn.value=d.nomor_tiket||'';
    if(ns)ns.value=d.secret||'';
    var tk=$('ka-tiket');if(tk)tk.scrollIntoView({behavior:'smooth',block:'start'});
    bukaTiket();
  });
  form.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ============================================================
   2. HALAMAN TIKET (#ka-tiket): verifikasi kredensial, status,
      percakapan, lampiran, publikasi.
   ============================================================ */
var tiketPanel=$('ka-tiket');
var tiketData=null,kredAktif=null;
function isiKredForm(){
  var k=bacaKred();if(!k)return;
  var nn=$('kx-nomor'),ns=$('kx-secret'),cb=$('kx-ingat');
  if(nn&&!nn.value)nn.value=k.nomor;
  if(ns&&!ns.value)ns.value=k.secret;
  if(cb)cb.checked=true;
}
function bukaTiket(){
  var m=$('kx-open-msg'),nn=normNomor($('kx-nomor').value),ss=normSecret($('kx-secret').value);
  if(!$('kx-nomor'))return;
  m.textContent='';
  if(!NOMOR_RE.test(nn)){$('kx-nomor').classList.add('err');m.textContent='Nomor tiket tidak valid. Format: KON-000000-KODE.';$('kx-nomor').focus();return}
  if(!/^[0-9A-HJKMNP-TV-Z]{32}$/.test(ss)){$('kx-secret').classList.add('err');m.textContent='Kode akses tidak valid (32 karakter, tanpa spasi).';$('kx-secret').focus();return}
  var btn=$('kx-open');busy(btn,true,'Memverifikasi…');
  api('consultation-ticket-access',{action:'view',nomor:nn,secret:ss})
    .then(function(r){return baca(r)}).then(function(res){
      busy(btn,false);
      if(res.err){m.textContent=res.err==='Kredensial tiket tidak valid'?'Nomor tiket atau kode akses salah.':'Verifikasi gagal: '+res.err;render();return}
      kredAktif={nomor:nn,secret:ss};
      if($('kx-ingat').checked)simpanKred(kredAktif);else hapusKred();
      tiketData=res.ok;render();
    }).catch(function(){busy(btn,false);m.textContent=pesanUmum(0)});
}
function refresh(){if(!kredAktif)return Promise.resolve();
  return api('consultation-ticket-access',{action:'view',nomor:kredAktif.nomor,secret:kredAktif.secret})
    .then(function(r){return baca(r)}).then(function(res){
      if(res.err){$('kx-open-msg').textContent='Gagal memuat ulang: '+res.err;return}
      tiketData=res.ok;render();
    })}
function muatLampiran(lampiran,btn){
  busy(btn,true,'Menyiapkan…');
  api('consultation-attachment',{action:'download',nomor:kredAktif.nomor,secret:kredAktif.secret,attachment:lampiran.id})
    .then(function(r){return baca(r)}).then(function(res){
      busy(btn,false);
      if(res.err){$('kx-tiket-msg').textContent=res.err;return}
      if(res.ok&&res.ok.url)window.open(res.ok.url,'_blank','noopener');
    }).catch(function(){busy(btn,false);$('kx-tiket-msg').textContent=pesanUmum(0)});
}
function unggahLampiran(){
  var f=$('kx-file'),m=$('kx-tiket-msg'),btn=$('kx-up');
  m.textContent='';
  var file=f.files&&f.files[0];
  if(!file){m.textContent='Pilih berkas terlebih dahulu.';return}
  if(file.size<1||file.size>LIM.fileMax){m.textContent='Ukuran berkas maksimal 5 MB.';return}
  if(MIME_OK.indexOf(file.type)<0){m.textContent='Jenis berkas tidak diizinkan (JPEG, PNG, WEBP, atau PDF).';return}
  busy(btn,true,'Mengunggah…');
  var fd=new FormData();
  fd.append('nomor',kredAktif.nomor);
  fd.append('secret',kredAktif.secret);
  fd.append('file',file,file.name);
  var h={};if(C.supabaseKey)h.apikey=C.supabaseKey;
  fetch(FN+'consultation-attachment',{method:'POST',cache:'no-store',headers:h,body:fd})
    .then(function(r){return baca(r)}).then(function(res){
      busy(btn,false);f.value='';
      if(res.err){m.textContent=res.err;return}
      refresh().then(function(){
        var mm=$('kx-tiket-msg');
        if(mm)mm.textContent='Lampiran terkirim.';
      });
    }).catch(function(){busy(btn,false);m.textContent=pesanUmum(0)});
}
function kirimPesan(){
  var t=$('kx-pesan'),m=$('kx-tiket-msg'),btn=$('kx-psn');
  m.textContent='';
  var isi=t.value.replace(/\r\n/g,'\n').trim();
  if(isi===''){m.textContent='Pesan tidak boleh kosong.';t.focus();return}
  if(isi.length>LIM.pesanMax){m.textContent='Pesan maksimal '+LIM.pesanMax+' karakter.';return}
  busy(btn,true,'Mengirim…');
  api('consultation-ticket-message',{action:'message',nomor:kredAktif.nomor,secret:kredAktif.secret,isi:isi})
    .then(function(r){return baca(r)}).then(function(res){
      busy(btn,false);
      if(res.err){m.textContent=res.err;return}
      t.value='';
      refresh().then(function(){
        var mm=$('kx-tiket-msg');
        if(mm)mm.textContent='Pesan terkirim.';
      });
    }).catch(function(){busy(btn,false);m.textContent=pesanUmum(0)});
}
function ubahPersetujuan(setuju){
  var m=$('kx-tiket-msg'),btn=$('kx-consent');
  m.textContent='';busy(btn,true,'Memproses…');
  api('consultation-ticket-message',{action:'consent',nomor:kredAktif.nomor,secret:kredAktif.secret,setuju:!!setuju})
    .then(function(r){return baca(r)}).then(function(res){
      busy(btn,false);
      if(res.err){m.textContent=res.err;return}
      refresh().then(function(){
        var mm=$('kx-tiket-msg');
        if(mm)mm.textContent=setuju?'Persetujuan publikasi diberikan.':'Persetujuan publikasi ditarik.';
      });
    }).catch(function(){busy(btn,false);m.textContent=pesanUmum(0)});
}
function keluar(){
  hapusKred();kredAktif=null;tiketData=null;render(true);
  var tk=$('ka-tiket');if(tk)tk.scrollIntoView({behavior:'smooth',block:'start'});
}

function render(keluarMode){
  var login=$('kx-login'),isi=$('kx-isi-tiket'),badge=$('kx-vbadge');
  if(keluarMode||!kredAktif||!tiketData){
    tampil(login,true);tampil(isi,false);
    if(badge){badge.hidden=true;badge.className='kx-badge'}
    return;
  }
  tampil(login,false);tampil(isi,true);
  /* Status verifikasi kredensial ditampilkan jelas — mekanisme verifikasi
     pemohon adalah pasangan nomor tiket + kode akses (bukan JWT). */
  if(badge){badge.hidden=false;badge.className='kx-badge ok';badge.textContent='Kredensial terverifikasi — Anda masuk sebagai pemilik tiket '+kredAktif.nomor}
  var t=tiketData.ticket||{},k=tiketData.kontak||{},pub=tiketData.publikasi;
  var status=STATUS_LABEL[t.status]||t.status;
  var stCls=t.status==='ditolak'?'bad':(t.status==='baru'?'':'ok');
  var tutup=!!SELESAI[t.status];
  var h='<div class="kx-tinfo">'+
    '<div class="kx-tr"><span>Nomor tiket</span><b>'+esc(t.nomor_tiket||kredAktif.nomor)+'</b></div>'+
    '<div class="kx-tr"><span>Judul</span><b>'+esc(t.judul||'')+'</b></div>'+
    '<div class="kx-tr"><span>Status</span><span class="kx-st '+stCls+'">'+esc(status)+'</span></div>'+
    '<div class="kx-tr"><span>Dibuat</span><b>'+esc(fmtTgl(t.created_at))+'</b></div>'+
    '<div class="kx-tr"><span>Terakhir diperbarui</span><b>'+esc(fmtTgl(t.updated_at))+'</b></div>'+
    (t.sla_deadline?'<div class="kx-tr"><span>Batas layanan (SLA)</span><b>'+esc(fmtTgl(t.sla_deadline))+'</b></div>':'')+
    '</div>';
  /* Percakapan: hanya pesan yang BOLEH dilihat pemohon — backend
     (consultation_svc_akses_tiket) yang menyaring; frontend hanya menampilkan. */
  var pesan=tiketData.pesan||[];
  h+='<h4 class="kx-h">Percakapan</h4><div class="kx-chat">';
  if(!pesan.length)h+='<p class="kx-kosong">Belum ada balasan. Pertanyaan Anda akan diproses sekretariat.</p>';
  pesan.forEach(function(p){
    var me=p.pengirim_jenis==='pemohon';
    h+='<div class="kx-b'+(me?' kx-b-me':' kx-b-staf')+'"><span class="kx-b-h">'+esc(PENGIRIM_LABEL[p.pengirim_jenis]||'Staf')+' &middot; '+esc(fmtTgl(p.created_at))+'</span><p>'+esc(p.isi||'')+'</p></div>';
  });
  h+='</div>';
  /* Kirim pesan: ditolak backend bila tiket sudah ditutup (selesai/ditolak). */
  if(tutup){h+='<p class="kx-note">Tiket sudah ditutup ('+esc(status)+'). Pesan lanjutan tidak dapat dikirim.</p>'}
  else{h+='<div class="kx-form"><label class="fld"><span>Kirim pesan lanjutan</span><textarea id="kx-pesan" rows="3" maxlength="'+LIM.pesanMax+'" placeholder="Tulis pesan tambahan untuk sekretariat / konsultan"></textarea></label><div class="kx-actions"><button type="button" class="btn" id="kx-psn">Kirim pesan</button></div></div>'}
  /* Lampiran: metadata dari respons akses; unduhan lewat signed URL 120 dtk. */
  var lamp=tiketData.lampiran||[];
  h+='<h4 class="kx-h">Lampiran</h4>';
  if(lamp.length){h+='<ul class="kx-lamp">'+lamp.map(function(a){
    return '<li><span class="kx-lf"><b>'+esc(a.nama_file||'lampiran')+'</b><small>'+esc(a.mime||'')+' &middot; '+esc(fmtUkuran(a.size_bytes))+' &middot; '+esc(fmtTgl(a.created_at))+'</small></span>'+
           '<button type="button" class="btn o" data-lamp="'+esc(a.id)+'">Unduh</button></li>'}).join('')+'</ul>'}
  else{h+='<p class="kx-kosong">Belum ada lampiran.</p>'}
  if(!tutup){
    h+='<div class="kx-form"><label class="fld"><span>Unggah lampiran (JPEG, PNG, WEBP, atau PDF — maksimal 5 MB)</span><input type="file" id="kx-file" accept=".jpg,.jpeg,.png,.webp,.pdf"></label><div class="kx-actions"><button type="button" class="btn o" id="kx-up">Unggah lampiran</button></div></div>';
  }
  /* Publikasi: status jawaban & persetujuan pemohon (tanpa nama). */
  h+='<h4 class="kx-h">Tanya jawab publik</h4>';
  if(!pub){h+='<p class="kx-kosong">Jawaban Anda belum diajukan untuk publikasi.</p>'}
  else{
    var stPub=pub.published?'Terbit di Tanya Jawab':(pub.dicabut?'Publikasi dicabut':(pub.disetujui_admin?'Menunggu waktu terbit':'Dalam proses persetujuan'));
    var stCls2=pub.published?'ok':(pub.dicabut?'bad':'');
    h+='<div class="kx-tinfo"><div class="kx-tr"><span>Status jawaban</span><span class="kx-st '+stCls2+'">'+esc(stPub)+'</span></div>'+
       '<div class="kx-tr"><span>Persetujuan Anda (tanpa nama)</span><b>'+(pub.persetujuan_pemohon?'Diberikan':'Belum diberikan')+'</b></div></div>'+
       '<div class="kx-actions"><button type="button" class="btn o" id="kx-consent">'+(pub.persetujuan_pemohon?'Tarik persetujuan publikasi':'Setujui ditampilkan di Tanya Jawab')+'</button></div>'+
       '<p class="kx-note">Pertanyaan dan jawaban hanya ditampilkan tanpa nama, jika Anda menyetujuinya. Menarik persetujuan akan menarik jawaban dari halaman publik.</p>';
  }
  h+='<div class="kx-actions kx-foot"><button type="button" class="btn o" id="kx-refresh">Muat ulang</button><button type="button" class="btn o" id="kx-keluar">Keluar dari tiket</button></div>'+
     '<p class="fm-msg" id="kx-tiket-msg" role="status"></p>';
  put(isi,h);
  bindTiket();
}
function bindTiket(){
  var b;
  if(b=$('kx-psn'))b.addEventListener('click',kirimPesan);
  if(b=$('kx-up'))b.addEventListener('click',unggahLampiran);
  if(b=$('kx-consent'))b.addEventListener('click',function(){var pub=tiketData&&tiketData.publikasi;ubahPersetujuan(!(pub&&pub.persetujuan_pemohon))});
  if(b=$('kx-refresh'))b.addEventListener('click',function(){b.textContent='Memuat…';refresh().then(function(){b.textContent='Muat ulang'})});
  if(b=$('kx-keluar'))b.addEventListener('click',keluar);
  [].forEach.call($('kx-isi-tiket').querySelectorAll('[data-lamp]'),function(btn){
    var id=btn.getAttribute('data-lamp'),lamp=null;
    (tiketData.lampiran||[]).forEach(function(a){if(a.id===id)lamp=a});
    btn.addEventListener('click',function(){muatLampiran(lamp,btn)});
  });
}

if(tiketPanel){
  $('kx-open').addEventListener('click',bukaTiket);
  ['kx-nomor','kx-secret'].forEach(function(i){var e=$(i);if(!e)return;
    e.addEventListener('input',function(){this.classList.remove('err');$('kx-open-msg').textContent=''});
    e.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();bukaTiket()}})});
  isiKredForm();
  if(bacaKred())bukaTiket();
}
}catch(e){}})();
