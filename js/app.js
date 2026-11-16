
(function(){
var PH=["/assets/img/img-a40aafe9.webp","/assets/img/img-897feccb.webp","/assets/img/img-6e2f9266.webp","/assets/img/img-da3baea3.webp","/assets/img/img-1a2f09f7.webp","/assets/img/img-5d1ae212.webp","/assets/img/img-6d655717.webp","/assets/img/img-ffb9a380.webp"];
var MW=window.MWC||{md:function(t,f,d){return d},set:function(){return null},grp:function(d){return d},tok:function(s){return s},raw:function(){return[]}};
function esc(s){return window.mwcEsc(s)}
function safeURL(s){s=String(s||'').trim();if(s.charAt(0)=='#'||(s.charAt(0)=='/'&&s.charAt(1)!='/'))return s;try{var u=new URL(s,location.href);if(u.protocol=='https:'||u.protocol=='http:'||u.protocol=='mailto:'||u.protocol=='tel:')return u.href}catch(e){}return '#'}
function imgURL(s){s=String(s||'').trim();if(/^\/(?!\/)[^\\"'<>]*$/.test(s))return s;try{var u=new URL(s,location.href);if(u.protocol=='https:'&&u.origin!==location.origin)return u.href}catch(e){}return ''}
function cleanHTML(html){var t=document.createElement('template'),tags='A ARTICLE B BR BUTTON CIRCLE DD DIV DL DT EM FIGCAPTION FIGURE H1 H2 H3 H4 IFRAME IMG LI MARK OL OPTION P PATH POLYGON POLYLINE RECT SMALL SPAN STRONG SVG TABLE TBODY TD TH THEAD TR UL'.split(' '),attrs='class id role aria-label aria-hidden aria-live aria-selected href src alt title target rel allowfullscreen viewbox d points cx cy r x y width height fill stroke-width stroke-linecap stroke-linejoin stroke-dasharray preserveaspectratio loading referrerpolicy style' .split(' ');t.innerHTML=String(html||'');[].forEach.call(t.content.querySelectorAll('*'),function(e){var tag=e.tagName.toUpperCase();if(tags.indexOf(tag)<0){e.replaceWith(document.createTextNode(e.textContent||''));return}if(tag=='IFRAME'&&!/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:[?#].*)?$/.test(e.getAttribute('src')||'')){e.remove();return}if(tag=='SVG'&&e.querySelector('script,foreignObject')){e.remove();return}/* Snapshot statis: e.attributes itu live — menghapus atribut saat iterasi menyusutkan koleksi dan forEach melompati atribut berikutnya (onerror bisa lolos). */[].forEach.call([].slice.call(e.attributes),function(a){var n=a.name.toLowerCase(),v=a.value.trim();if(attrs.indexOf(n)<0&& !/^data-[a-z0-9_-]+$/i.test(n)){e.removeAttribute(a.name);return}if(n.slice(0,2)=='on'||n=='srcdoc'||n=='formaction'){e.removeAttribute(a.name);return}if(n=='href'||n=='src'){var ok=n=='href'?/^(#|https?:\/|mailto:|tel:)/i.test(v):/^(https?:\/|\/[^/])/i.test(v);if(tag=='IFRAME')ok=n=='src'&&/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:[?#].*)?$/.test(v);if(ok&&n=='href')try{var u=new URL(v,location.href);ok=/^(https?:|mailto:|tel:)$/.test(u.protocol)||v.charAt(0)=='#'}catch(ex){ok=false}if(!ok)e.removeAttribute(a.name)}if(n=='style'&&/(?:expression\s*\(|javascript\s*:|vbscript\s*:|data\s*:|@import|[<>])/i.test(v))e.removeAttribute(a.name)});if(tag=='A'&&e.getAttribute('target')=='_blank')e.setAttribute('rel','noopener noreferrer')});return t.innerHTML}
function put(el,html){if(el)el.innerHTML=cleanHTML(html)}
function fill(id,h){put(document.getElementById(id),h)}
/* Helper UI global: modul-modul terpisah (Konsultasi, Majelis, Zakat) memakai
   put/esc/cleanHTML yang sama agar selalu tersanitasi dan tidak ada ReferenceError. */
window.MWCUI={put:put,esc:esc,cleanHTML:cleanHTML};
function ph(u){if(!u)return null;u=imgURL(u);if(!u)return null;var i=PH.indexOf(u);if(i<0){PH.push(u);i=PH.length-1}return i}
var HS=(function(){var h=MW.set('hero');return h&&h.slides&&h.slides.length>=1&&h.slides.every(Boolean)?h.slides.map(ph):[4,0,5,1]})();
/* Cover potret dari CMS (/admin/#/set/hero → "Cover potret"): satu unggahan
   untuk desktop & mobile. Fallback: foto pertama slides, lalu og-cover.png. */
(function(){var h=MW.set('hero')||{};var u=imgURL(h.potret||'')||(HS.length&&PH[HS[0]])||'/assets/img/og-cover.png';if(u)document.documentElement.style.setProperty('--hcover','url("'+u+'")')})();
/* Laporan Kas hanya ditampilkan ke publik setelah toggle CMS diaktifkan. */
(function(){var section=document.getElementById('kas-home'),data=MW.set('kas')||{};if(!section||data.tampil!==true)return;function setText(id,value){var el=document.getElementById(id);if(el)el.textContent=value||''}function money(v){if(v===''||v===null||v===undefined)return '';var n=Number(v);if(!Number.isFinite(n)||n<0)return '';return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)}section.hidden=false;setText('kas-periode',data.periode);[['pemasukan','pemasukan'],['pengeluaran','pengeluaran'],['saldo','saldo']].forEach(function(pair){var amount=money(data[pair[0]]),row=document.getElementById('kas-'+pair[1]+'-row');if(amount&&row){row.hidden=false;setText('kas-'+pair[1],amount)}});var note=document.getElementById('kas-keterangan');if(note&&String(data.keterangan||'').trim()){note.textContent=String(data.keterangan).trim();note.hidden=false}})();
var ICONS={"ambulans": "<path d=\"M10 10H6\"/><path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\"/><path d=\"M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14\"/><path d=\"M8 8v4\"/><path d=\"M9 18h6\"/><circle cx=\"17\" cy=\"18\" r=\"2\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/>", "zakat": "<path d=\"M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16\"/><path d=\"m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9\"/><path d=\"m2 13 6 6\"/>", "majelis": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>", "konsultasi": "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\"/><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"/><path d=\"M12 17h.01\"/>", "beasiswa": "<path d=\"M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z\"/><path d=\"M22 10v6\"/><path d=\"M6 12.5V16a6 3 0 0 0 12 0v-3.5\"/>", "kesehatan": "<path d=\"M11 2v2\"/><path d=\"M5 2v2\"/><path d=\"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1\"/><path d=\"M8 15a6 6 0 0 0 12 0v-3\"/><circle cx=\"20\" cy=\"10\" r=\"2\"/>", "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/>", "kalender": "<path d=\"M8 2v4\"/><path d=\"M16 2v4\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/><path d=\"M3 10h18\"/>", "buku": "<path d=\"M12 7v14\"/><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"/>", "hati": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/>", "telepon": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z\"/>", "lokasi": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>"};

document.documentElement.style.setProperty("--hp","url("+PH[HS[0]]+")");document.documentElement.style.setProperty("--vp","url("+PH[HS[3]]+")");
// Cincin sembilan bintang (motif)
var s=document.getElementById('stars'),h='<circle r="96" fill="none" stroke="#2C5A47" stroke-width=".6"/><circle r="64" fill="none" stroke="#2C5A47" stroke-width=".6" stroke-dasharray="2 4"/>';
function star(cx,cy,R,r){var p=[];for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,d=i%2?r:R;p.push((cx+d*Math.cos(a)).toFixed(1)+','+(cy+d*Math.sin(a)).toFixed(1))}return '<polygon points="'+p.join(' ')+'" fill="#C79A1E"/>'}
for(var i=0;i<9;i++){var a=i*2*Math.PI/9-Math.PI/2;h+=star(80*Math.cos(a),80*Math.sin(a),i==0?11:8,i==0?4.5:3.2)}
if(s)put(s,h);
var I=['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z','M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z','M3 17l6-6 4 4 8-8 M15 7h6v6','M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z','M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8'];
[].forEach.call(document.querySelectorAll('.bento article'),function(a,i){var d=document.createElement('div');d.className='ic';put(d,'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+I[i]+'"/></svg>');a.insertBefore(d,a.firstChild)});
// Jam dan tanggal
function tick(){var n=new Date();
(document.getElementById('jam')||{}).textContent=n.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}).replace('.',':');
document.getElementById('masehi').textContent=n.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
try{document.getElementById('hijri').textContent=n.toLocaleDateString('id-ID-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'})}catch(e){}}
tick();setInterval(tick,30000);
document.getElementById('yr').textContent=new Date().getFullYear();
var mb=document.getElementById('mb'),nv=document.getElementById('nv');
function setMenu(open){nv.classList.toggle('open',!!open);mb.setAttribute('aria-expanded',!!open);mb.setAttribute('aria-label',open?'Tutup menu navigasi':'Buka menu navigasi');mb.querySelector('.mb-label').textContent=open?'Tutup':'Menu';document.body.classList.toggle('nav-open',!!open)}
mb.onclick=function(){setMenu(!nv.classList.contains('open'))};
nv.addEventListener('click',function(e){var b=e.target.closest('.ddb'),a=e.target.closest('a');if(b){var item=b.closest('.dd'),open=!item.classList.contains('open');[].forEach.call(nv.querySelectorAll('.dd.open'),function(x){x.classList.remove('open');x.querySelector('.ddb').setAttribute('aria-expanded','false')});item.classList.toggle('open',open);b.setAttribute('aria-expanded',open);return}if(a){if(a.getAttribute('href')=='#kontak')setMenu(false);else if(a.getAttribute('href')&&a.getAttribute('href').charAt(0)=='#')setMenu(false)}});
document.addEventListener('click',function(e){if(nv.classList.contains('open')&&!e.target.closest('header'))setMenu(false)});
document.addEventListener('keydown',function(e){if(e.key=='Escape'&&nv.classList.contains('open')){setMenu(false);mb.focus()}});
if(window.matchMedia){var menuMQ=window.matchMedia('(min-width:1101px)');if(menuMQ.addEventListener)menuMQ.addEventListener('change',function(e){if(e.matches)setMenu(false)});else if(menuMQ.addListener)menuMQ.addListener(function(e){if(e.matches)setMenu(false)})}
var hd=document.querySelector("header");var bar=document.getElementById("bar");function sc(){hd.classList.toggle("sc",window.scrollY>24);var m=document.documentElement.scrollHeight-innerHeight;bar.style.width=(m>0?scrollY/m*100:0)+"%"}sc();addEventListener("scroll",sc,{passive:true});
// Tema
var r=document.documentElement,tb0=document.getElementById('theme');
function setT(d){r.setAttribute('data-theme',d?'dark':'light');tb0.textContent=d?'☀':'☾';try{localStorage.setItem('theme',d?'dark':'light')}catch(e){}}
var t0=null;try{t0=localStorage.getItem('theme')}catch(e){}
setT(t0==='dark');
tb0.onclick=function(){setT(r.getAttribute('data-theme')!='dark')};
// Pengurus
function L(r,a){return a.map(function(n){return [r,n]})}
var T=MW.grp({'Mustasyar':L('Mustasyar',['Dr. K.H. Syuhada, M.A.','Drs. K.H. Syarief Muawan, M.Pd.','Dr. K.H. M. Sobron Zayyan, S.Q., M.A','Dr. H. Edi Suharsongko, M.Pd.','K.H. Udan Maulana','H. Abdul Azis Noor','Dr. H. Budi Harsono, S.E., M.Si., CSP, CPM, CIISA','K.H. M. Jamil, S.Q., M.Pd.','K.H. M. Soleh Ma\'mun']),
'Syuriyah':[['Rois','K.H. Mohommad Toha, S.Ag']].concat(L('Wakil Rois',['K.H. Irfan Zaini Abbas','K.H. A. Misbah, S.Pd.I., M.Ag.','K. Sholeh Anas RJ']),[['Katib','KH. Abdul Ghofur, M.Pd.']],L('Wakil Katib',['M. Yusuf FHR, S.Sos.','Mustahdi, M.A.','Aprianif, Lc., M.A.','Zakaria Muslim, S.Pd.I.']),L('A\'wan',['Drs. H. Abdul Karim Jafar, MM.','Drs. H. Naidin Fathullah','Dr. H. Usman Shofi','Drs. Ahmad Muhsin','Abdul Rohim Masduqi','Dr. H. Ahmad Rifa\'i','M. Irfansyah','H. Imam Bajuri, S.Pd.I., M.Ag.','Zainudin, SQ.'])),
'Tanfidziyah':[['Ketua','H. Fathur Rahman']].concat(L('Wakil Ketua',['Drs. K.H.M. Junaidi, M.Pd.','Abdul Syukur, S.Q.','K.H. Soewardi Warman, S.H., M.H.','KH. M. Afif, M.Pd.','Ahmad Sairin, S.Pd.I. K.','Nasuha, S.Pd.I.']),[['Sekretaris','Dr. (HC) Ruslani, M.M.']],L('Wakil Sekretaris',['Nurhadi, S.Pd.I., M.Pd.','Suparman','Fahrial Hilal H.','Kholili','K. Tamam Khaulani','Awaludin, S.Sos., M.Pd.']),[['Bendahara','Ahmad Munir']],L('Wakil Bendahara',['M. Rizki, S.Kom.','Handoko','Muhidin','Gunawan, S.Pd.I.'])),
'Badan otonom':[['Pemuda','GP Ansor'],['Perempuan muda','Fatayat NU'],['Pelajar putra','IPNU'],['Pelajar putri','IPPNU']]});
var TOP={'Rois':1,'Katib':1,'Ketua':1,'Sekretaris':1,'Bendahara':1};
function ini(n){var w=n.split(',')[0].split(/\s+/).filter(function(x){return x&&!/^(dr|drs|k|kh|h|ust)\.?$/i.test(x)&&!/^\(hc\)$/i.test(x)&&!/^([a-z]\.)+$/i.test(x)});return ((w[0]||'?')[0]+(w[1]?w[1][0]:'')).toUpperCase()}
function hl(s,q){s=esc(s);if(!q)return s;try{return s.replace(new RegExp('('+String(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>')}catch(e){return s}}
function card(n,role,top,q,meta){return '<button type="button" class="person'+(top?' top':'')+'" data-p="'+esc(n)+'" data-r="'+esc(meta||role||'')+'"><span class="av" aria-hidden="true">'+ini(n)+'</span><span><b>'+hl(n,q)+'</b>'+(role?'<small>'+esc(role)+'</small>':'')+'</span></button>'}
function ft(k,r){var x=T[k].filter(function(p){return p[0]==r})[0];return x?x[1]:''}
function LC(r,n){return '<div class="lc"><span class="av">'+ini(n)+'</span><span><small>'+r+'</small><b>'+n+'</b></span></div>'}
var kph=document.querySelector('.pt img'),kn=ft('Tanfidziyah','Ketua');
put(document.getElementById('core'),'<div class="cl"><h3>Syuriyah</h3>'+LC('Rois',ft('Syuriyah','Rois'))+LC('Katib',ft('Syuriyah','Katib'))+'</div><div class="cl"><h3>Tanfidziyah</h3><div class="cg"><div class="lc k"><div class="ph">'+(kph?'<img alt="'+kn+'" src="'+kph.src+'">':ini(kn))+'</div><span><small>Ketua</small><b>'+kn+'</b></span></div><div class="cs">'+LC('Sekretaris',ft('Tanfidziyah','Sekretaris'))+LC('Bendahara',ft('Tanfidziyah','Bendahara'))+'</div></div></div>');
var tb=document.getElementById('tabs'),pn=document.getElementById('panel'),sq=document.getElementById('sq'),curT='Tanfidziyah';
function marks(k){[].forEach.call(tb.children,function(b){b.setAttribute('aria-selected',b.dataset.k==k)})}
function show(k){curT=k;sq.value='';var g=[],h='';
T[k].forEach(function(p){var l=g[g.length-1];if(l&&l[0]==p[0])l[1].push(p[1]);else g.push([p[0],[p[1]]])});
g.forEach(function(x){h+='<div class="grp"><h3>'+esc(x[0])+'<em>'+x[1].length+'</em></h3><div class="gl">'+x[1].map(function(n){return card(n,'',TOP[x[0]],'',x[0]+', '+k)}).join('')+'</div></div>'});
put(pn,h);marks(k)}
Object.keys(T).forEach(function(k){var b=document.createElement('button');b.dataset.k=k;put(b,esc(k)+'<small>'+T[k].length+'</small>');b.setAttribute('role','tab');b.onclick=function(){show(k)};tb.appendChild(b)});
sq.oninput=function(){var v=sq.value.trim().toLowerCase();if(!v){show(curT);return}
var r=[];Object.keys(T).forEach(function(k){T[k].forEach(function(p){if(p[1].toLowerCase().indexOf(v)>-1)r.push(card(p[1],p[0]+', '+k,TOP[p[0]],v))})});
put(pn,r.length?'<p class="sres" aria-live="polite">'+r.length+' pengurus cocok dengan &ldquo;'+esc(sq.value.trim())+'&rdquo;</p><div class="gl">'+r.join('')+'</div>':'<div class="empty-sk"><b>Tidak ada hasil</b><p>Tidak ada pengurus yang cocok dengan &ldquo;'+esc(sq.value.trim())+'&rdquo;. Periksa ejaan atau cari bagian lain.</p><button type="button" class="btn o2" data-reset>Reset pencarian</button></div>');marks('')};
sq.addEventListener('keydown',function(e){if(e.key=='Escape'&&sq.value){sq.value='';show(curT)}});
pn.addEventListener('click',function(e){
var rs=e.target.closest('[data-reset]');if(rs){sq.value='';show(curT);try{sq.focus()}catch(x){}return}
var b=e.target.closest('.person');if(!b)return;personOpen(b.getAttribute('data-p')||'',b.getAttribute('data-r')||'')});
function personOpen(name,role){
if(!name)return;
var p=String(role).split(', '),jab=p[0]||'',bag=p.slice(1).join(', ');
var h='<div class="pd"><span class="av" aria-hidden="true">'+ini(name)+'</span><div class="pd-id">'+(bag?'<span class="pd-kick">'+esc(bag)+'</span>':'')+'<h3>'+esc(name)+'</h3>'+(jab?'<p class="pd-role">'+esc(jab)+'</p>':'')+'</div></div>';
h+='<div class="pd-act"><button type="button" class="btn o2" data-copy="'+esc(name)+'">Salin nama</button><a class="btn" href="#kontak" data-close>Hubungi sekretariat</a></div>';
h+='<p class="pd-note">Pengurus MWCNU Pondok Aren, masa khidmat 2025 sampai 2030. Data dapat diperbarui melalui sekretariat.</p>';
openD(h)}
function skStats(){
var el=document.getElementById('skStats');if(!el)return;
var tot=0;Object.keys(T).forEach(function(k){tot+=T[k].length});
var rant=(MW.raw('ranting')||[]).length||11;
var rows=[['Pengurus',tot],['Syuriyah',T['Syuriyah'].length],['Tanfidziyah',T['Tanfidziyah'].length],['Ranting NU',rant]];
put(el,rows.map(function(x){return '<div class="sk-stat"><b>'+x[1]+'</b><small>'+x[0]+'</small></div>'}).join(''))}
document.addEventListener('keydown',function(e){
if(e.key!='/'||e.ctrlKey||e.metaKey||e.altKey)return;
var t=e.target||{};if(t.tagName&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;if(t.isContentEditable)return;
var s=document.getElementById('struktur');if(!s||s.hidden)return;
e.preventDefault();try{sq.focus()}catch(x){}});
skStats();
show('Tanfidziyah');
// Agenda
var AG=MW.md('agenda',function(x){return{d:x.tanggal,t:x.judul,k:x.kategori||'',loc:x.lokasi||''}},[{d:"2026-09-15",t:"Lailatul Ijtima' di PRNU Pondok Karya",k:"Lailatul Ijtima'",loc:"Masjid Baiturrahim, Pondok Karya"},
{d:"2026-09-09",t:"Rapat Harian Tanfidziyah",k:"Rapat",loc:"Omah Singgah NU Alfath"},
{d:"2026-09-22",t:"Turba MWCNU Pondok Aren di PRNU Pondok Pucung",k:"Turba",loc:"Yayasan Islam Jam'iyyah Al-Munibin, Kel. Pondok Pucung"}]);
var BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function agDate(x){var p=x.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function agFmt(d){return d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2)}
function agCard(a,past){var d=agDate(a.d),e=new Date(d.getTime()+90000000);
a={d:String(a.d||''),t:String(a.t||''),k:String(a.k||''),loc:String(a.loc||'')};var map='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a.loc+', Pondok Aren, Tangerang Selatan');
var cal='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(a.t)+'&dates='+agFmt(d)+'/'+agFmt(e)+'&location='+encodeURIComponent(a.loc);
return '<article class="ag'+(past?' past':'')+'"><div class="agd"><b>'+d.getDate()+'</b><small>'+BLN[d.getMonth()]+' '+d.getFullYear()+'</small></div><div class="agb"><span class="chip">'+esc(a.k)+'</span><h3>'+esc(a.t)+'</h3><p><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg><span>'+esc(a.loc)+'</span></p><div class="aga"><a href="'+esc(map)+'" target="_blank" rel="noopener">Lihat lokasi</a>'+(past?'':'<a class="pr" href="'+esc(cal)+'" target="_blank" rel="noopener">Tambah ke kalender</a>')+'</div></div></article>'}
function agDraw(){var t0=new Date();t0.setHours(0,0,0,0);
var up=AG.filter(function(a){return agDate(a.d)>=t0}).sort(function(a,b){return agDate(a.d)-agDate(b.d)}),
ps=AG.filter(function(a){return agDate(a.d)<t0}).sort(function(a,b){return agDate(b.d)-agDate(a.d)});
var h='<h3 class="agh">Akan datang</h3>'+(up.length?up.map(function(a){return agCard(a,false)}).join(''):'<div class="ne"><b>Belum ada agenda mendatang</b><span>Agenda berikutnya akan tampil di sini.</span></div>');
if(ps.length)h+='<h3 class="agh">Sudah lewat</h3>'+ps.map(function(a){return agCard(a,true)}).join('');
put(document.getElementById('agBox'),h)}
agDraw();
function homeAgendaDraw(){
  var today=new Date();today.setHours(0,0,0,0);
  var upcoming=AG.filter(function(a){return agDate(a.d)>=today}).sort(function(a,b){return agDate(a.d)-agDate(b.d)});
  var isUpcoming=upcoming.length>0,items=isUpcoming?upcoming.slice(0,3):AG.filter(function(a){return agDate(a.d)<today}).sort(function(a,b){return agDate(b.d)-agDate(a.d)}).slice(0,3);
  var h='<h3 class="agh">'+(isUpcoming?'Agenda mendatang':'Kegiatan terakhir')+'</h3>';
  h+=items.length?items.map(function(a){return agCard(a,!isUpcoming)}).join(''):'<div class="agenda-home-empty"><b>Belum ada agenda</b><span>Agenda berikutnya akan diumumkan di sini.</span></div>';
  put(document.getElementById('homeAgenda'),h);
}
homeAgendaDraw();
// Program unggulan
var P=MW.md('program',function(x){return{t:x.judul||'',s:x.deskripsi||'',k:MW.lines(x.kegiatan),a:[x.tombol||'Tanya tentang program',safeURL(x.tautan||'#berita')]}},[{t:"Dakwah dan pengajian Aswaja",s:"Menguatkan pemahaman dan amaliah Ahlussunnah wal Jama'ah An-Nahdliyah melalui dakwah dan pengajian bersama warga.",k:["Lailatul Ijtima'","Yasin dan tahlil","Pengajian Aswaja","Doa penutup"],a:["Lihat berita kegiatan","#berita"]},
{t:"Penguatan ranting",s:"Mendampingi dan memperkuat koordinasi Pengurus Ranting NU di 11 kelurahan se-Pondok Aren.",k:["Tawaqufan di ranting","Silaturahmi pengurus dan ranting","11 Pengurus Ranting NU"],a:["Cari Pengurus Ranting","#ranting"]},
{t:"Media dan dakwah digital",s:"Menyebarkan informasi dan dakwah Islam yang menyejukkan, ramah, dan mempersatukan melalui kanal digital.",k:["Media Center NU Pondok Aren","TVNU Pondok Aren","NUPA Media"],a:["Tonton TVNU Pondok Aren","#video"]},
{t:"Silaturahmi dan tradisi",s:"Merawat kebersamaan keluarga besar NU serta tradisi keagamaan yang hidup di tengah masyarakat.",k:["Halal Bi Halal keluarga besar NU","Ramah tamah"],a:["Lihat dokumentasi kegiatan","#galeri"]},
{t:"Kaderisasi badan otonom",s:"Menguatkan kaderisasi dan kolaborasi badan otonom NU di tingkat Kecamatan Pondok Aren.",k:["GP Ansor","Fatayat NU","IPNU","IPPNU"],a:["Kenali badan otonom","#banom"]}]);
if(!P.length)P=[{t:'Program khidmat',s:'Informasi program akan diumumkan melalui MWCNU Pondok Aren.',k:[],a:['Lihat kabar kegiatan','#berita']}];
var PI=[I[0],I[4],'M2 4h20v13H2z M8 21h8 M12 17v4',I[3],I[2]];
var pl=document.getElementById('pl'),pd=document.getElementById('program-panel'),pi='';
pd.tabIndex=0;
function sv(d){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>'}
function pshow(i,anim){var p=P[i];if(!p)return;pi=String(i);
[].forEach.call(pl.children,function(b,j){var selected=j==i;b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1;if(selected&&pl.scrollWidth>pl.clientWidth){var bb=b.getBoundingClientRect(),rb=pl.getBoundingClientRect();if(bb.left<rb.left||bb.right>rb.right)pl.scrollTo({left:b.offsetLeft-(pl.clientWidth-b.offsetWidth)/2,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}});
pd.setAttribute('aria-labelledby','program-tab-'+i);
pd.setAttribute('aria-describedby','program-description-'+i);
var url=p.a[1],urlOK=/^#[-\w/]+$/.test(url)||/^https:\/\/(?:[\w-]+\.)+[\w-]+(?:[/?#][^\s]*)?$/i.test(url);if(!urlOK)url='#berita';
put(pd,'<div class="program-panel-top"><span class="program-step">Program '+('0'+(i+1)).slice(-2)+' <i>/ '+('0'+P.length).slice(-2)+'</i></span><span class="pbig">'+sv(PI[i%PI.length])+'</span></div><h3>'+esc(p.t)+'</h3><p>'+esc(p.s)+'</p>'+(p.k.length?'<div class="program-focus"><b>Fokus kegiatan</b><ul class="pk">'+p.k.map(function(k){return '<li>'+esc(k)+'</li>'}).join('')+'</ul></div>':'')+'<div class="program-actions"><a class="btn" id="program-wa" href="https://wa.me/6285161033689?text='+encodeURIComponent("Assalamu'alaikum, saya ingin bertanya tentang program "+p.t)+'" target="_blank" rel="noopener">Tanya lewat WhatsApp</a><a class="btn o" id="program-detail-link" href="'+esc(safeURL(url))+'">'+esc(p.a[0]||'Lihat detail')+' <span aria-hidden="true">→</span></a></div>');
var programDescription=pd.querySelector('p');if(programDescription)programDescription.id='program-description-'+i;
if(anim){pd.classList.remove('program-switching');void pd.offsetWidth;pd.classList.add('program-switching')}}
P.forEach(function(p,i){var b=document.createElement('button');b.id='program-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','program-panel');b.setAttribute('aria-selected',i===0);b.tabIndex=i===0?0:-1;
put(b,'<span class="program-tab-num">'+('0'+(i+1)).slice(-2)+'</span><span class="pi">'+sv(PI[i%PI.length])+'</span><span class="program-tab-copy"><b>'+esc(p.t)+'</b><small>'+esc(p.s)+'</small></span><span class="program-tab-arrow" aria-hidden="true">→</span>');
b.onclick=function(){pshow(i,1)};b.onkeydown=function(e){var next=e.key==='ArrowDown'||e.key==='ArrowRight'?i+1:e.key==='ArrowUp'||e.key==='ArrowLeft'?i-1:e.key==='Home'?0:e.key==='End'?P.length-1:-1;if(next<0)return;e.preventDefault();next=(next+P.length)%P.length;pshow(next,1);pl.children[next].focus()};pl.appendChild(b)});
pshow(0,0);
// Video TVNU Pondok Aren: tambahkan baris [idVideo, judul, tanggal] di sini
var V=MW.md('video',function(x){return[MW.yt(x.youtube),x.judul,MW.tgl(x.tanggal)]},[["yTL2DYeYviA","Halal Bihalal: Tradisi Khas Indonesia yang Lahir dari Pemikiran Para Ulama NU","1 Mei 2026"],["MIhHbzD3RGk","Nahdlatul Ulama Tetap Relevan: Bagaimana Mereka Seimbangkan Tradisi dan Modernitas?","29 April 2026"],["ZDuEPPinBTA","Target Pembentukan Anak Ranting NU Se-Pondok Aren | Laporan Ketua Panitia HBH 2026","29 April 2026"],["iSc-NZLsOrY","Lahirnya Kebangkitan Ulama - DR. KH. Manarul Hidayat, MA.","8 Juli 2025"],["-Yb3fhDJiIU","Louncing QRIS | MWCNU Pondok Aren Langkah Maju dari Koin NU","7 Juli 2025"],["_GaNDmYqaL8","Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur","5 September 2024"]],MW.byDate);
var homeVideos=V.filter(function(v){return/^[\w-]{11}$/.test(v[0])}).slice(0,3),homeVideoBox=document.getElementById('homeVideo');
if(homeVideos.length&&homeVideoBox){
  var videoHead=document.createElement('div');videoHead.className='home-video-heading';
  videoHead.innerHTML='<div><small>TVNU PONDOK AREN</small><h3>Video dokumentasi</h3></div><a href="#video">Lihat semua video <span aria-hidden="true">→</span></a>';
  var videoGrid=document.createElement('div');videoGrid.className='home-video-list';
  homeVideos.forEach(function(v){
    var videoCard=document.createElement('button');videoCard.type='button';videoCard.className='home-video-card';videoCard.setAttribute('aria-label','Putar video: '+v[1]);
    var videoArt=document.createElement('span');videoArt.className='home-video-art';videoArt.style.backgroundImage='url("https://i.ytimg.com/vi/'+encodeURIComponent(v[0])+'/hqdefault.jpg"),url("'+PH[4]+'")';
    var videoPlay=document.createElement('span');videoPlay.className='home-video-play';videoPlay.setAttribute('aria-hidden','true');var videoPlayIcon=document.createElement('span');videoPlayIcon.className='play';videoPlay.appendChild(videoPlayIcon);videoArt.appendChild(videoPlay);
    var videoInfo=document.createElement('span');videoInfo.className='home-video-info';var videoKicker=document.createElement('small');videoKicker.textContent='Video dokumentasi · TVNU';var videoTitle=document.createElement('b');videoTitle.textContent=v[1];var videoMeta=document.createElement('span');videoMeta.textContent=v[2];videoInfo.appendChild(videoKicker);videoInfo.appendChild(videoTitle);videoInfo.appendChild(videoMeta);videoCard.appendChild(videoArt);videoCard.appendChild(videoInfo);
    videoCard.onclick=function(){openD('<div class="vf"><iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v[0])+'?autoplay=1&rel=0" title="'+esc(v[1])+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><h3 style="font-size:1.2rem;margin:14px 0 6px">'+esc(v[1])+'</h3><p style="margin:0;color:var(--mut)">TVNU Pondok Aren · '+esc(v[2])+'</p>')};
    videoGrid.appendChild(videoCard);
  });
  homeVideoBox.appendChild(videoHead);homeVideoBox.appendChild(videoGrid);
}
var vg=document.getElementById('vgrid');
V.forEach(function(v){if(!/^[\w-]{11}$/.test(v[0]))return;var b=document.createElement('button');b.setAttribute('aria-label','Putar: '+v[1]);
put(b,'<span class="vth"><span class="play"></span></span><span class="vt"><b>'+esc(v[1])+'</b><small>'+esc(v[2])+'</small></span>');
if(!/^[\w-]{11}$/.test(v[0]))return;
var im=new Image();im.alt='';im.loading='lazy';im.referrerPolicy='no-referrer';im.className='vi';
im.onerror=function(){im.remove()};im.src='https://i.ytimg.com/vi/'+v[0]+'/hqdefault.jpg';
b.querySelector('.vth').insertBefore(im,b.querySelector('.play'));
b.onclick=function(){openD('<div class="vf"><iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v[0])+'?autoplay=1&rel=0" title="'+esc(v[1])+'" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><h3 style="font-size:1.25rem;margin:14px 0 6px">'+esc(v[1])+'</h3><p style="margin:0 0 14px;color:var(--mut)">TVNU Pondok Aren, '+esc(v[2])+'</p><p><a class="x" style="float:none;margin:0;text-decoration:none" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v='+encodeURIComponent(v[0])+'">Buka di YouTube</a></p>')};
vg.appendChild(b)});
// Tampilan baru
var GM='Foto';
function setG(m){GM=m;document.getElementById('gfoto').hidden=m!='Foto';document.getElementById('gvid').hidden=m!='Video';[].forEach.call(document.getElementById('gmode').children,function(b){b.setAttribute('aria-selected',b.dataset.k==m)})}
var ICN={pin:'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',cal:'M3 5h18v16H3z M3 10h18 M8 3v4 M16 3v4',mon:'M2 4h20v13H2z M8 21h8 M12 17v4'};
fill('feat',[[I[0],'Aswaja An-Nahdliyah','Dakwah yang menyejukkan'],[I[4],'11 Ranting','Hadir di setiap kelurahan'],[ICN.shield,'4 Badan otonom','Ansor, Fatayat, IPNU, IPPNU'],[ICN.phone,'Layanan sekretariat','Lewat WhatsApp dan email']].map(function(f){return '<div class="fi"><span class="fic">'+sv(f[0])+'</span><span><b>'+f[1]+'</b><small>'+f[2]+'</small></span></div>'}).join(''));
var KC=MW.md('kegiatan',function(x){return[ph(x.foto),x.judul,x.lokasi||'',x.tanggal||'']},[[PH[4],"Halal Bi Halal","Omah Singgah NU Alfath","26 Apr 2026"],[PH[0],"Lailatul Ijtima'","PRNU Pondok Kacang Barat","7 Feb 2026"],[PH[6],"Silaturahmi pengurus","Halal Bi Halal keluarga besar NU","26 Apr 2026"],[PH[3],"Rangkaian acara","Majelis Taklim Annur","7 Feb 2026"]]);
fill('kc',KC.map(function(k){
  var bg = typeof k[0] === 'number' ? (PH[k[0]] || '') : (k[0] || '');
  return '<a class="kcard" href="#galeri">'
    + '<span class="kph" style="background-image:url(\''+esc(bg)+'\')"></span>'
    + '<span class="kbadge"><span class="kdot"></span>Kegiatan</span>'
    + '<div class="kb">'
    + '<span class="kd"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'+esc(k[3])+'</span>'
    + '<b>'+esc(k[1])+'</b>'
    + '<small class="kloc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>'+esc(k[2])+'</small>'
    + '</div></a>';
}).join(''));
/* fill(cats) dihapus — seksi #jelajahi tidak lagi ada di beranda (T7) */
function go(h){if(location.hash==h)route();else location.hash=h}
document.getElementById('sb').onclick=function(){var r=document.getElementById('rq').value.trim(),sv=document.getElementById('rs').value;
if(r){q.value=r;draw();go('#ranting')}else if(sv.indexOf('|')>-1){var pp=sv.split('|');drawG(pp[1]);go(pp[0])}else go(sv)};
document.getElementById('rq').onkeydown=function(e){if(e.key=='Enter')document.getElementById('sb').click()};
document.getElementById('nb').onclick=function(){var t=document.getElementById('nm').value.trim();window.open('https://wa.me/6285161033689'+(t?'?text='+encodeURIComponent(t):''),'_blank','noopener')};
var VW=['program','banom-page','banom-profile','struktur','struktur-organisasi','pengurus','ranting','ranting-detail','agenda','berita','baca','galeri','sejarah','visi','layanan','majelis','konsultasi','kontak','ambulans','zis','daftar','profil','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];

[].forEach.call(document.querySelectorAll('.sl'),function(e,i){e.style.backgroundImage='url('+PH[HS[i%HS.length]]+')'});
var LSV=MW.md('layanan',function(x){return x.tampil===false?null:{title:x.judul,desc:x.deskripsi||'',note:x.keterangan||'',icon:ICONS[x.ikon]||ICONS.info,link:x.tautan||'#layanan'}},[
{title:'Ambulans 24/7',desc:'Layanan ambulans gratis untuk warga NU Pondok Aren',icon:'<path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><path d="M9 18h6"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',link:'#ambulans'},
{title:'UPZ & Infaq',desc:'Zakat melalui UPZ, infaq dan sedekah melalui MWCNU',icon:'<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 13 6 6"/>',link:'#zis'},
{title:'Majelis Taklim',desc:'Pengajian rutin dan edukasi keagamaan',icon:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',link:'#majelis'},
{title:'Konsultasi Agama',desc:'Tanya jawab dan konsultasi keagamaan',icon:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',link:'#konsultasi'}
]);
/* Disembunyikan sementara. Untuk menampilkan kembali, pindahkan item ke dalam LSV di atas. */
var LSV_HIDDEN=[
{title:'Beasiswa & Pendidikan',desc:'Program beasiswa dan pendidikan anak',icon:'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',link:'#layanan'},
{title:'Layanan Kesehatan',desc:'Pemeriksaan kesehatan dan layanan medis',icon:'<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',link:'#layanan'}
];
function layananCard(l){return '<a class="lycard" href="'+esc(safeURL(l.link))+'"><span class="lyic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+l.icon+'</svg></span><span><b>'+esc(l.title)+'</b><small>'+esc(l.desc)+'</small>'+(l.note?'<small class="ly-ket"><i>Keterangan</i>'+esc(l.note)+'</small>':'')+'</span></a>'}

// Badan Otonom NU
var BANOM=MW.md('banom',function(x){return{
  name:x.nama||'Badan Otonom',full:x.nama_lengkap||'',desc:x.deskripsi||'',
  bidang:x.bidang||'',logo:imgURL(x.logo)||'',initial:String(x.monogram||'').trim(),
  color:x.warna||'#17352A',ketua:x.ketua||'',kontak:x.kontak||'',
  kegiatan:MW.lines(x.kegiatan).map(function(l){return l.replace(/^(?:[•·*–—-]|\d+[.)])\s*/,'')}).filter(Boolean),link:safeURL(x.tautan||'')
}},[
{name:'GP Ansor',full:'Gerakan Pemuda Ansor',bidang:'Kepemudaan',desc:'Organisasi kepemudaan untuk pemberdayaan, keamanan, dan pengabdian masyarakat',initial:'GA',color:'#1B7A4A',ketua:'',kontak:'',kegiatan:['Pengajian dan kaderisasi pemuda','Pengamanan kegiatan jam\'iyyah','Pengabdian sosial masyarakat'],link:''},
{name:'Fatayat NU',full:'Fatayat Nahdlatul Ulama',bidang:'Perempuan',desc:'Organisasi perempuan muda untuk dakwah dan pemberdayaan keluarga',initial:'FN',color:'#C2185B',ketua:'',kontak:'',kegiatan:['Dakwah dan pengajian keluarga','Pemberdayaan ekonomi perempuan','Pendidikan dan kesehatan ibu'],link:''},
{name:'IPNU',full:'Ikatan Pelajar Nahdlatul Ulama',bidang:'Pelajar',desc:'Organisasi pelajar putra untuk pembinaan karakter dan kepemimpinan',initial:'IP',color:'#1565C0',ketua:'',kontak:'',kegiatan:['Kaderisasi pelajar NU','Kajian keislaman dan kebangsaan','Bakti sosial pelajar'],link:''},
{name:'IPPNU',full:'Ikatan Pelajar Putri Nahdlatul Ulama',bidang:'Pelajar',desc:'Organisasi pelajar putri untuk dakwah, pendidikan, dan pengembangan diri',initial:'PP',color:'#7B1FA2',ketua:'',kontak:'',kegiatan:['Kaderisasi pelajar putri','Kajian dan literasi','Pengembangan minat dan bakat'],link:''},
{name:'Pagar Nusa',full:'Pencak Silat Nahdlatul Ulama Pagar Nusa',bidang:'Seni Bela Diri',desc:'Badan otonom NU yang mewadahi pencak silat serta pembinaan karakter dan pengabdian kader.',initial:'PN',color:'#D8A62B',ketua:'',kontak:'',kegiatan:['Latihan pencak silat','Pembinaan karakter kader','Penampilan pada kegiatan NU'],link:''}
]);
if(!MW.managed('banom')&&!BANOM.some(function(b){return b.name.toLowerCase()==='pagar nusa'}))BANOM.push({name:'Pagar Nusa',full:'Pencak Silat Nahdlatul Ulama Pagar Nusa',bidang:'Seni Bela Diri',desc:'Badan otonom NU yang mewadahi pencak silat serta pembinaan karakter dan pengabdian kader.',initial:'PN',color:'#D8A62B',ketua:'',kontak:'',kegiatan:['Latihan pencak silat','Pembinaan karakter kader','Penampilan pada kegiatan NU'],link:''});
BANOM.forEach(function(b){if(!b.bidang)b.bidang='Lainnya';if(!b.kegiatan)b.kegiatan=[]});

/* ---------- Badan Otonom: halaman interaktif (route #banom) ---------- */
var BP={q:'',bidang:'Semua'};
function bpColor(b){return /^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#17352A'}
function bpInitial(b){if(b.initial)return b.initial;var w=String(b.name||'').replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);return((w[0]||'?')[0]+(w[1]?w[1][0]:'')).toUpperCase()}
function bpSlug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function bpLogo(b,cls){var c=bpColor(b);return '<span class="'+cls+'" style="--bc:'+c+'">'+(b.logo?'<img src="'+esc(b.logo)+'" alt="Logo '+esc(b.name)+'" loading="lazy">':'<b aria-hidden="true">'+esc(bpInitial(b))+'</b>')+'</span>'}
function bpMatch(b,q){if(!q)return true;return [b.name,b.full,b.desc,b.bidang,b.ketua,b.kontak].concat(b.kegiatan||[]).join(' ').toLowerCase().indexOf(q)>-1}
function bpList(){var q=BP.q.trim().toLowerCase();return BANOM.filter(function(b){return (BP.bidang==='Semua'||b.bidang===BP.bidang)&&bpMatch(b,q)})}
function bpStats(){var box=document.getElementById('bpStats');if(!box)return;var seen={};BANOM.forEach(function(b){seen[b.bidang]=1});var keg=BANOM.reduce(function(n,b){return n+(b.kegiatan?b.kegiatan.length:0)},0);put(box,[[String(BANOM.length),'Badan otonom'],[String(Object.keys(seen).length),'Bidang gerak'],[String(keg),'Kegiatan tercatat'],['2025–2030','Masa khidmat']].map(function(d){return '<div class="bp-stat"><b>'+esc(d[0])+'</b><small>'+esc(d[1])+'</small></div>'}).join(''))}
function bpChips(){var box=document.getElementById('bpChips');if(!box)return;var seen={},list=['Semua'];BANOM.forEach(function(b){if(!seen[b.bidang]){seen[b.bidang]=1;list.push(b.bidang)}});put(box,list.map(function(k){var on=BP.bidang===k;return '<button type="button" class="bp-chip'+(on?' on':'')+'" role="tab" aria-selected="'+on+'" data-bidang="'+esc(k)+'">'+esc(k)+'</button>'}).join(''))}
function bpCard(b){var i=BANOM.indexOf(b),keg=b.kegiatan||[];return '<button type="button" class="bp-card" data-i="'+i+'" style="--bc:'+bpColor(b)+'" aria-label="Buka profil '+esc(b.name)+'"><span class="bp-card-top">'+bpLogo(b,'bp-logo')+'<span class="bp-bidang">'+esc(b.bidang)+'</span></span><b class="bp-name">'+esc(b.name)+'</b>'+(b.full?'<small class="bp-full">'+esc(b.full)+'</small>':'')+'<span class="bp-desc">'+esc(b.desc)+'</span><span class="bp-foot"><span class="bp-count">'+(keg.length?keg.length+' kegiatan':'Profil singkat')+'</span><span class="bp-go">Lihat profil <span aria-hidden="true">→</span></span></span></button>'}
function bpDraw(){var grid=document.getElementById('bpGrid');if(!grid)return;var list=bpList();put(grid,list.map(bpCard).join(''));var empty=document.getElementById('bpEmpty');if(empty)empty.hidden=!!list.length;var n=document.getElementById('bpCount');if(n)n.textContent=list.length+' dari '+BANOM.length+' badan otonom'}
function bpContactWA(b){
  var d=String(b.kontak||'').replace(/\D/g,'');
  if(d.length<9)return '';
  if(d.indexOf('62')!==0)d='62'+d.replace(/^0+/,'');
  return 'https://wa.me/'+d+'?text='+encodeURIComponent("Assalamu'alaikum, saya ingin bertanya tentang "+b.name+" MWCNU Pondok Aren.");
}
function bpRender(i){
  var b=BANOM[i],box=document.getElementById('bpProfile');if(!b||!box)return;
  var keg=b.kegiatan||[],facts='';
  if(b.ketua)facts+='<div><dt>Ketua</dt><dd>'+esc(b.ketua)+'</dd></div>';
  if(b.kontak)facts+='<div><dt>Kontak</dt><dd>'+esc(b.kontak)+'</dd></div>';
  facts+='<div><dt>Bidang</dt><dd>'+esc(b.bidang)+'</dd></div>';
  var wa='https://wa.me/6285161033689?text='+encodeURIComponent("Assalamu'alaikum, saya ingin bertanya tentang "+b.name+" MWCNU Pondok Aren.");
  var kontak=bpContactWA(b);
  var link=b.link&&b.link!='#'?'<a class="btn o2" href="'+esc(b.link)+'"'+(b.link.charAt(0)=='#'?'':' target="_blank" rel="noopener"')+'>Tautan resmi</a>':'';
  var others=BANOM.map(function(x,k){return{k:k,b:x}}).filter(function(o){return o.k!==i}).slice(0,4);
  put(box,'<article class="bp-prof" style="--bc:'+bpColor(b)+'">'
    +'<div class="bp-prof-head">'+bpLogo(b,'bp-logo bp-logo-lg')+'<div class="bp-prof-id"><span class="bp-bidang">'+esc(b.bidang)+'</span><h1 class="bp-prof-name">'+esc(b.name)+'</h1>'+(b.full?'<p class="bp-prof-full">'+esc(b.full)+'</p>':'')+'</div></div>'
    +'<p class="bp-prof-desc">'+esc(b.desc)+'</p>'
    +'<dl class="bp-facts">'+facts+'</dl>'
    +'<div class="bp-prof-actions"><a class="btn" href="'+esc(wa)+'" target="_blank" rel="noopener">Tanya lewat WhatsApp</a>'+(kontak?'<a class="btn o2" href="'+esc(kontak)+'" target="_blank" rel="noopener">Chat pengurus</a>':'')+link+'<a class="btn o2" href="#kontak">Sekretariat</a></div>'
    +(keg.length?'<div class="bp-keg"><h2>Fokus kegiatan</h2><ol class="bp-keg-list">'+keg.map(function(k,n){return '<li><span class="bp-keg-n" aria-hidden="true">'+('0'+(n+1)).slice(-2)+'</span><p>'+esc(k)+'</p></li>'}).join('')+'</ol></div>':'')
    +'</article>'
    +(others.length?'<div class="bp-others"><h2>Badan otonom lainnya</h2><div class="bp-others-grid">'+others.map(function(o){return '<a class="bp-other" href="#banom/'+bpSlug(o.b.name)+'" style="--bc:'+bpColor(o.b)+'">'+bpLogo(o.b,'bp-logo')+'<span><b>'+esc(o.b.name)+'</b><small>'+esc(o.b.bidang)+'</small></span></a>'}).join('')+'</div></div>':''));
  try{document.title=b.name+' | Badan Otonom MWCNU Pondok Aren'}catch(e){}
  window.scrollTo(0,0);
}
(function(){var page=document.getElementById('banom-page');if(!page)return;var q=document.getElementById('bpq'),grid=document.getElementById('bpGrid'),chips=document.getElementById('bpChips');
if(q)q.addEventListener('input',function(){BP.q=q.value;bpDraw()});
if(chips)chips.addEventListener('click',function(e){var b=e.target.closest('[data-bidang]');if(!b)return;BP.bidang=b.getAttribute('data-bidang');bpChips();bpDraw()});
if(grid)grid.addEventListener('click',function(e){var b=e.target.closest('.bp-card');if(!b)return;var i=+b.getAttribute('data-i'),slug=bpSlug(BANOM[i]&&BANOM[i].name);location.hash=slug?'#banom/'+slug:'#banom'});
var rs=document.getElementById('bpReset');if(rs)rs.onclick=function(){BP.q='';BP.bidang='Semua';if(q)q.value='';bpChips();bpDraw()};
document.addEventListener('keydown',function(e){if(e.key!='/'||e.ctrlKey||e.metaKey||e.altKey)return;var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;if(!q||page.hidden)return;e.preventDefault();q.focus()});
bpStats();bpChips();bpDraw()})();

var bnmg=document.getElementById('banomgrid');if(bnmg){var h='';BANOM.forEach(function(b){h+='<a class="bncard" href="#banom/'+bpSlug(b.name)+'" aria-label="Lihat profil '+esc(b.name)+'" style="--bc:'+bpColor(b)+'"><span class="bnic" aria-hidden="true">'+(b.logo?'<img src="'+esc(b.logo)+'" alt="" loading="lazy">':esc(bpInitial(b)))+'</span><span class="bn-copy" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"><b>'+esc(b.name)+'</b></span><span class="bn-name">'+esc(b.name)+'</span></a>'});put(bnmg,h);if('IntersectionObserver' in window){var _bio=new IntersectionObserver(function(en,ob){if(en.some(function(e){return e.isIntersecting})){[].forEach.call(bnmg.querySelectorAll('.bncard'),function(c,i){c.classList.add('bn-anim');c.style.animationDelay=(i*90)+'ms'});_bio.disconnect()}},{threshold:.18});_bio.observe(bnmg)}}
var lys=document.getElementById('lyscroll');if(lys)put(lys,LSV.map(layananCard).join(''));
var KG=['program','berita','agenda','galeri'],programDD=document.querySelector('#nav-program')&&document.querySelector('#nav-program').closest('.dd');
function closeDD(){[].forEach.call(document.querySelectorAll('#nv .dd.open'),function(x){x.classList.remove('open');x.querySelector('.ddb').setAttribute('aria-expanded','false')})}
function mark(c){[].forEach.call(document.querySelectorAll('#nv a'),function(a){a.classList.toggle('on',a.getAttribute('href')=='#'+c)});if(programDD)programDD.classList.toggle('on',KG.indexOf(c)>=0)}
/* ── Halaman profil: Sejarah & Visi (interaktif) ───────────────── */
function pgInline(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}
function pgParse(txt){
var secs=[],cur=null,ul=null;
String(txt||'').split(/\r?\n/).forEach(function(raw){
var l=raw.trim();if(!l)return;
if(/^#{1,3}\s+/.test(l)){cur={t:l.replace(/^#{1,3}\s+/,''),b:[]};secs.push(cur);ul=null;return}
if(!cur){cur={t:'',b:[]};secs.push(cur)}
if(/^[-*]\s+/.test(l)){var it=l.replace(/^[-*]\s+/,'');if(!ul){ul={u:[]};cur.b.push(ul)}ul.u.push(it);return}
ul=null;cur.b.push({p:l})});
return secs.filter(function(s){return s.t||s.b.length})}
function pgBlocks(b){return (b||[]).map(function(x){if(x.u)return '<ul>'+x.u.map(function(i){return '<li>'+pgInline(i)+'</li>'}).join('')+'</ul>';return '<p>'+pgInline(x.p)+'</p>'}).join('')}
var PG_DEF={sejarah:[
{t:'Sejarah Singkat',b:[{p:'MWCNU Pondok Aren adalah Majelis Wakil Cabang Nahdlatul Ulama di Kecamatan Pondok Aren, Kota Tangerang Selatan.'},{p:'Sebagai kepanjangan tangan PCNU Kota Tangerang Selatan, MWCNU menghimpun pengurus ranting, badan otonom, dan lembaga di tingkat kecamatan.'}]},
{t:'Khidmat',b:[{p:'MWCNU bertugas membina ranting di 11 kelurahan dan badan otonom NU di tingkat kecamatan.'},{p:'Khidmat dijalankan melalui dakwah dan pengajian Aswaja, pendidikan, layanan jam\'iyyah, serta pemberdayaan ekonomi umat.'}]}
],visi:[
{t:'Visi',b:[{p:'Terwujudnya masyarakat muslim Pondok Aren yang beriman, berilmu, dan berakhlak Aswaja An-Nahdliyah.'}]},
{t:'Misi',b:[{u:['Membina ranting dan badan otonom','Menguatkan dakwah dan pendidikan','Memberdayakan ekonomi umat']}]}
]};
function pgDoc(slug){
var row=null;(MW.raw('halaman')||[]).forEach(function(h){if(h&&h.slug==slug)row=h});
var secs=row?pgParse(row.isi):[];
if(!secs.length)secs=PG_DEF[slug]||[];
return {judul:(row&&row.judul)||'',foto:(row&&MW.safeImage?MW.safeImage(row.foto):'')||'',secs:secs}}
function pgToc(toc,items,page){
if(!toc)return;
put(toc,'<b class="pgtoc-h">Isi halaman</b>'+items.map(function(it,i){return '<a class="pgtoc-i" href="#'+page+'" data-toc="'+it.id+'"><em>'+('0'+(i+1)).slice(-2)+'</em><span>'+esc(it.t)+'</span></a>'}).join(''))}
var PGW=[],PGWon=0;
function pgWatch(root,toc,prog){
if(!root)return;
var e={root:root,toc:toc,prog:prog},i,rep=0;
for(i=0;i<PGW.length;i++)if(PGW[i].root===root){PGW[i]=e;rep=1;break}
if(!rep)PGW.push(e);
if(!PGWon){PGWon=1;addEventListener('scroll',pgScroll,{passive:true});addEventListener('resize',pgScroll)}
pgScroll()}
function pgScroll(){
if(!PGW.length)return;
var hd=document.querySelector('header'),off=(hd?hd.offsetHeight:0)+24;
PGW.forEach(function(w){
var sec=w.root.closest('.vw');if(sec&&sec.hidden)return;
var r=w.root.getBoundingClientRect();if(!r.height)return;
if(w.prog){var p=(off-r.top)/r.height;w.prog.style.width=(Math.max(0,Math.min(1,p))*100).toFixed(1)+'%'}
var act='';[].forEach.call(w.root.querySelectorAll('[data-sec]'),function(n){if(n.getBoundingClientRect().top-off<=14)act=n.id});
if(w.toc)[].forEach.call(w.toc.querySelectorAll('[data-toc]'),function(a){var on=a.getAttribute('data-toc')==act;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})})}
function pgAcc(e){
var b=e.target.closest('[data-acc]');if(!b)return;
var open=b.getAttribute('aria-expanded')=='true',p=b.nextElementSibling;
b.setAttribute('aria-expanded',open?'false':'true');
if(p)p.hidden=open}
function pgMilestones(){
var it=[
['28 Mei 2025','Kepengurusan masa khidmat 2025&ndash;2030 ditetapkan','SK PCNU Kota Tangerang Selatan No. 12/PC.01/A.II.01.03/1208/06/2025 menetapkan susunan pengurus MWCNU Pondok Aren untuk masa khidmat 2025 sampai 2030.'],
['7 Juli 2025','QRIS, langkah maju dari Koin NU','MWCNU Pondok Aren meluncurkan QRIS sebagai lanjutan program Koin NU agar infak jamaah lebih mudah dan tercatat rapi.'],
['26 April 2026','Halal Bi Halal keluarga besar NU','Silaturahmi pengurus, ranting, dan badan otonom di Omah Singgah NU Alfath dengan tema membumikan dakwah, menguatkan ranting, dan menjaga tradisi.']
];
return '<div class="tms" id="sj-jejak" data-sec><h2>Jejak langkah terbaru</h2><p class="tms-sub">Dirangkum dari arsip kegiatan dan dokumen organisasi MWCNU Pondok Aren.</p><div class="tms-l">'+it.map(function(x){
return '<div class="tms-i"><button type="button" class="tms-b" data-acc aria-expanded="false"><span class="tms-d">'+x[0]+'</span><span class="tms-t">'+x[1]+'</span><i aria-hidden="true"></i></button><div class="tms-p" hidden><p>'+x[2]+'</p></div></div>'}).join('')+'</div></div>'}
function pgRenderSejarah(){
var body=document.getElementById('sjBody');if(!body)return;
var doc=pgDoc('sejarah'),toc=document.getElementById('sjToc'),prog=document.getElementById('sjProg');
var ttl=document.querySelector('#sejarah .pgtitle');if(ttl&&doc.judul)ttl.textContent=doc.judul;
var st=document.getElementById('sjStats');
if(st)put(st,'<div><b>'+((MW.raw('ranting')||[]).length||11)+'</b><small>Ranting NU</small></div><div><b>'+((T['Badan otonom']||[]).length||4)+'</b><small>Badan otonom</small></div><div><b>2025&ndash;2030</b><small>Masa khidmat</small></div>');
var items=doc.secs.map(function(s,i){return {id:'sj-s'+(i+1),t:s.t||('Bagian '+(i+1))}});
var h='';
if(doc.foto)h+='<figure class="pgfig"><img src="'+esc(doc.foto)+'" alt="'+esc(doc.judul||'Dokumentasi MWCNU Pondok Aren')+'" loading="lazy"></figure>';
h+=doc.secs.map(function(s,i){return '<article class="tli" id="'+items[i].id+'" data-sec><span class="tlnum" aria-hidden="true">'+('0'+(i+1)).slice(-2)+'</span><div class="tlx"><h2>'+esc(items[i].t)+'</h2>'+pgBlocks(s.b)+'</div></article>'}).join('');
h+=pgMilestones();
put(body,h);
items.push({id:'sj-jejak',t:'Jejak langkah terbaru'});
pgToc(toc,items,'sejarah');
pgWatch(body,toc,prog);
if(!body.dataset.acc){body.dataset.acc='1';body.addEventListener('click',pgAcc)}}
function pgMisi(b){
var out='',n=0;
(b||[]).forEach(function(x){
if(x.u){out+='<div class="misi">'+x.u.map(function(t){n++;return '<div class="misi-i"><span class="misi-n" aria-hidden="true">'+('0'+n).slice(-2)+'</span><p>'+pgInline(t)+'</p></div>'}).join('')+'</div>'}
else out+='<p class="vlead">'+pgInline(x.p)+'</p>'});
return out}
function pgPrinciples(){
var P=[['Tawassuth','Moderat','Mengambil jalan tengah: tidak berlebihan dan tidak mengurangi, baik dalam beragama maupun bermasyarakat.'],
['I\'tidal','Adil dan lurus','Menempatkan segala sesuatu pada tempatnya serta konsisten pada kebenaran.'],
['Tasamuh','Toleran','Menghargai perbedaan pandangan dan budaya tanpa kehilangan identitas Ahlussunnah wal Jama\'ah.'],
['Tawazun','Seimbang','Menyeimbangkan dalil naqli dan aqli, serta urusan dunia dan akhirat.']];
return '<div class="vblock vprinc" id="vs-prinsip" data-sec><h2>Prinsip Aswaja An-Nahdliyah</h2><p class="vlead">Empat prinsip yang menjadi pegangan warga Nahdliyin dalam bersikap dan berkhidmat.</p><div class="prin">'+P.map(function(p){
return '<div class="prin-i"><button type="button" class="prin-b" data-acc aria-expanded="false"><span class="prin-ic" aria-hidden="true">'+p[0].charAt(0)+'</span><span class="prin-t"><b>'+p[0]+'</b><small>'+p[1]+'</small></span><i aria-hidden="true"></i></button><div class="prin-p" hidden><p>'+p[2]+'</p></div></div>'}).join('')+'</div></div>'}
function pgRenderVisi(){
var body=document.getElementById('vsBody');if(!body)return;
var doc=pgDoc('visi'),toc=document.getElementById('vsToc');
var ttl=document.querySelector('#visi .pgtitle');if(ttl&&doc.judul)ttl.textContent=doc.judul;
var items=[],h='';
if(doc.foto)h+='<figure class="pgfig"><img src="'+esc(doc.foto)+'" alt="'+esc(doc.judul||'MWCNU Pondok Aren')+'" loading="lazy"></figure>';
doc.secs.forEach(function(s,i){
var id='vs-s'+(i+1),t=s.t||('Bagian '+(i+1));
items.push({id:id,t:t});
if(/^visi\b/i.test(t)&&!s.b.some(function(x){return x.u})){
h+='<div class="vquote" id="'+id+'" data-sec><span class="vq-k">Visi</span><p>'+pgInline(s.b.map(function(x){return x.p||''}).join(' '))+'</p></div>'}
else if(/^misi\b/i.test(t)){h+='<div class="vblock" id="'+id+'" data-sec><h2>'+esc(t)+'</h2>'+pgMisi(s.b)+'</div>'}
else{h+='<div class="vblock" id="'+id+'" data-sec><h2>'+esc(t)+'</h2>'+pgBlocks(s.b)+'</div>'}});
h+=pgPrinciples();
put(body,h);
items.push({id:'vs-prinsip',t:'Prinsip Aswaja'});
pgToc(toc,items,'visi');
pgWatch(body,toc,null);
if(!body.dataset.acc){body.dataset.acc='1';body.addEventListener('click',pgAcc)}}
document.addEventListener('click',function(e){
var a=e.target.closest('[data-toc]');if(!a)return;
e.preventDefault();
var t=document.getElementById(a.getAttribute('data-toc'));if(!t)return;
var hd=document.querySelector('header'),off=(hd?hd.offsetHeight:0)+24;
scrollTo({top:t.getBoundingClientRect().top+scrollY-off,behavior:'smooth'})});
var SITE_TITLE=document.title;
var SITE_META={};['description','og:title','og:description','og:image','og:url','twitter:title','twitter:description','twitter:image'].forEach(function(k){var e=document.querySelector(k.indexOf('og:')===0?'meta[property="'+k+'"]':'meta[name="'+k+'"]');if(e)SITE_META[k]=e.getAttribute('content')||''});
function restoreSiteMeta(){document.title=SITE_TITLE;Object.keys(SITE_META).forEach(function(k){var e=document.querySelector(k.indexOf('og:')===0?'meta[property="'+k+'"]':'meta[name="'+k+'"]');if(e)e.setAttribute('content',SITE_META[k])})}
function renderRouteNews(currentIndex){var section=document.getElementById('route-news'),grid=document.getElementById('route-news-grid');if(!section||!grid||!N||!N.length)return;var picks=N.filter(function(n,i){return i!==currentIndex&&n[6]&&n[6].featured});N.forEach(function(n,i){if(i!==currentIndex&&picks.indexOf(n)<0&&picks.length<3)picks.push(n)});picks=picks.slice(0,3);put(grid,picks.map(function(n){var i=N.indexOf(n),thumb=n[4]==null?'<span class="route-news-placeholder" aria-hidden="true"></span>':nImg(PH[n[4]],n[1],'');return '<a class="route-news-card" href="#berita/'+i+'">'+thumb+'<span class="route-news-copy"><small>'+esc(n[0])+' &middot; '+esc(n[2])+'</small><b>'+esc(n[1])+'</b></span></a>'}).join(''))}
function renderPrimaryAd(page){[].forEach.call(document.querySelectorAll('[data-mwc-ad-slot]'),function(e){e.remove()});if(!page)return;var cfg=MW.set('iklan')||{},rows=cfg.slots||[],ad=rows.filter(function(x){return x&&x.page===page&&x.active})[0];if(!ad)return;var routeId=page==='banom'?(document.getElementById('banom-profile')&&!document.getElementById('banom-profile').hidden?'banom-profile':'banom-page'):page==='ranting'?(document.getElementById('ranting-detail')&&!document.getElementById('ranting-detail').hidden?'ranting-detail':'ranting'):page;var host=page==='baca'?document.getElementById('arBody'):document.querySelector('#'+routeId+' .wrap');if(!host)return;var box=document.createElement('aside');box.className='mwc-ad-slot';box.setAttribute('data-mwc-ad-slot','');box.setAttribute('aria-label','Iklan utama');var label=document.createElement('span');label.className='mwc-ad-label';label.textContent='Iklan';box.appendChild(label);
if(ad.mode==='Google AdSense'){var client=String(cfg.client||''),unit=String(ad.ad_slot||'');if(!/^ca-pub-\d{16}$/.test(client)||!/^\d{4,20}$/.test(unit))return;var ins=document.createElement('ins');ins.className='adsbygoogle';ins.style.display='block';ins.setAttribute('data-ad-client',client);ins.setAttribute('data-ad-slot',unit);ins.setAttribute('data-ad-format','auto');ins.setAttribute('data-full-width-responsive','true');box.appendChild(ins);var push=function(){try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}};if(window.__MWC_ADSENSE_READY){push()}else{var loader=document.getElementById('mwc-adsense-loader');if(loader){loader.addEventListener('load',function(){window.__MWC_ADSENSE_READY=true;push()},{once:true})}else{loader=document.createElement('script');loader.id='mwc-adsense-loader';loader.async=true;loader.crossOrigin='anonymous';loader.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);loader.onload=function(){window.__MWC_ADSENSE_READY=true;push()};loader.onerror=function(){box.classList.add('mwc-ad-error')};document.head.appendChild(loader)}}
}else{var src=MW.safeImage(ad.image);if(!src)return;var img=document.createElement('img');img.src=src;img.alt=String(ad.alt||'Iklan');img.loading='lazy';img.decoding='async';var href=String(ad.href||'').trim();if(href){var a=document.createElement('a');a.href=safeURL(href);a.rel='sponsored noopener';a.target='_blank';a.appendChild(img);box.appendChild(a)}else box.appendChild(img)}
host.insertBefore(box,host.firstChild)}
function route(){var h=decodeURIComponent(location.hash.slice(1)),m='',anchorTarget=null,bIndex=-1;
if(!h){var pn=location.pathname.replace(/\/+$/,''),pm=pn.match(/\/banom(?:\/([^\/]+))?$/),paths={'/berita':'berita','/sejarah':'sejarah','/visi-misi':'visi','/struktur':'struktur','/ranting':'ranting','/galeri':'galeri','/layanan':'layanan','/majelis':'majelis','/konsultasi':'konsultasi','/zis':'zis','/kontak':'kontak'};if(pn==='/program')h='program';else if(pm)h='banom'+(pm[1]?'/'+pm[1]:'');else if(paths[pn])h=paths[pn]}
/* FASE T5: alias rute lama halaman banom statis → halaman direktori dinamis.
   Hash di URL diubah langsung agar tautan lama tetap berfungsi. */
var LEGACY_BANOM={'banom-gpansor':'gp-ansor','banom-fatayat':'fatayat-nu','banom-ipnu':'ipnu','banom-ippnu':'ippnu'};
if(LEGACY_BANOM[h]){location.replace('#banom/'+LEGACY_BANOM[h]);return}
var bm=h.match(/^\/?banom(?:\/([^\/]+))?\/?$/);
if(bm){var bslug=bm[1]||'';if(bslug)BANOM.forEach(function(b,i){if(bpSlug(b.name)===bslug)bIndex=i});h=bIndex>=0?'banom-profile':'banom-page'}
var target=h&&document.getElementById(h),parent=target&&target.closest('.vw');if(parent&&target!==parent){if(parent.hidden){anchorTarget=target;h=parent.id}else{target.scrollIntoView({behavior:'smooth',block:'start'});mark(parent.id);closeDD();return}}
if(h=='kontak'){var contact=document.getElementById('kontak');if(contact){var ft=document.getElementById('site-footer'),rn=document.getElementById('route-news');contact.hidden=false;if(rn)rn.hidden=false;renderRouteNews(-1);[].forEach.call(document.querySelectorAll('.ho'),function(e){e.hidden=true});var ids=['program','banom-page','banom-profile','struktur','struktur-organisasi','pengurus','agenda','berita','baca','galeri','ranting','sejarah','visi','layanan','majelis','konsultasi','ambulans','zis','daftar','profil','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];ids.forEach(function(id){var v0=document.getElementById(id);if(v0)v0.hidden=true});document.body.classList.add('inview');mark('kontak');closeDD();renderPrimaryAd('kontak');window.scrollTo(0,0);return}}
if(h=='video'){h='galeri';m='Video'}else if(h=='galeri')m='Foto';
var mm=h.match(/^berita\/(\d+)$/);if(mm)h='baca';else restoreSiteMeta();
var dm=h.match(/^pengurus\/([a-z0-9-]+)$/);if(dm)h='pengurus';
var rm=h.match(/^ranting\/([a-z0-9-]+)$/);if(rm)h='ranting-detail';
var v=VW.indexOf(h)>=0?h:'';
var footer=document.getElementById('site-footer');if(footer)footer.hidden=false;
var routeNews=document.getElementById('route-news');if(routeNews)routeNews.hidden=!v;
VW.forEach(function(id){document.getElementById(id).hidden=id!=v});
[].forEach.call(document.querySelectorAll('.ho'),function(e){e.hidden=!!v});document.body.classList.toggle('inview',!!v);
if(m)setG(m);if(mm)renderArticle(+mm[1]);if(v)renderRouteNews(mm?+mm[1]:-1);var adPage=(v==='banom-page'||v==='banom-profile')?'banom':v==='ranting-detail'?'ranting':v;renderPrimaryAd(adPage);if(anchorTarget){window.scrollTo(0,0);requestAnimationFrame(function(){anchorTarget.scrollIntoView({behavior:'smooth',block:'start'})})}else if(h=='sambutan'){var sb=document.getElementById('sambutan');if(sb)sb.scrollIntoView()}else if(!v&&h&&h!='top'&&document.getElementById(h)){document.getElementById(h).scrollIntoView({behavior:'smooth',block:'start'})}else window.scrollTo(0,0);mark(v=='baca'?'berita':((v=='banom-page'||v=='banom-profile')?'banom':((v=='struktur-organisasi'||v=='pengurus')?'struktur':(v=='ranting-detail'?'ranting':(v||'top')))));closeDD();
if(v=='banom-profile')bpRender(bIndex);
if(v=='sejarah')pgRenderSejarah();
if(v=='visi')pgRenderVisi();
if(v=='struktur')skStats();
if(v=='program'){pshow(0,0);try{document.title='Program Khidmat | MWCNU Pondok Aren'}catch(e){}}
if(window.MWCDIR)window.MWCDIR.route(v,dm?dm[1]:rm?rm[1]:'');
if(v!='baca'&&v!='program'&&v!='banom-profile'&&v!='pengurus'&&v!='ranting-detail'&&document.title!==SITE_TITLE){try{document.title=SITE_TITLE}catch(e){}}}
addEventListener('hashchange',route);route();
// Dialog, berita, galeri
var dlg=document.getElementById('dlg'),db=document.getElementById('dlgBody');
function openD(h){put(db,h);if(!dlg.open)dlg.showModal();dlg.scrollTop=0}
document.getElementById('dlgX').onclick=function(){dlg.close()};
dlg.onclick=function(e){if(e.target==dlg)dlg.close()};
db.addEventListener('click',function(e){
var c=e.target.closest('[data-close]');if(c)dlg.close();
var cp=e.target.closest('[data-copy]');
if(cp){var t=cp.getAttribute('data-copy')||'',done=function(){cp.textContent='Nama tersalin';setTimeout(function(){cp.textContent='Salin nama'},1800)};
if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,done);else done()}});
function act(el,f){el.tabIndex=0;el.setAttribute('role','button');el.onclick=f;el.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();f()}}}
var N=MW.md('berita',function(x){return[x.kategori||'Berita',x.judul,MW.tgl(x.tanggal),x.ringkasan||'',ph(x.foto),'',{lead:x.lead||'',cap:x.caption||'',tag:x.tag||'',author:x.penulis||'',featured:!!x.featured,metaT:x.meta_judul||'',metaD:x.meta_desc||'',fontA:x.font_artikel||'',drop:!!x.dropcap_art,p:MW.paras(x.isi),body:x.isi||'',info:MW.kv(x.info),ph:(x.foto_tambahan||[]).map(ph).filter(function(i){return i!=null}),vid:MW.lines(x.video).map(function(l){var id=MW.yt(l);if(!/^[\w-]{11}$/.test(id))return -1;for(var i=0;i<V.length;i++)if(V[i][0]==id)return i;return -1}).filter(function(i){return i>=0})}]},[["Berita","Halal Bi Halal Keluarga Besar NU Pondok Aren Angkat Tema Membumikan Dakwah dan Menguatkan Ranting","26 April 2026","Silaturahmi keluarga besar NU Kecamatan Pondok Aren di Omah Singgah NU Alfath.",4,"",{lead:"Keluarga Besar Nahdlatul Ulama Kecamatan Pondok Aren menggelar Halal Bi Halal bertema Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi.",cap:"Halal Bi Halal Keluarga Besar NU Kecamatan Pondok Aren di Omah Singgah NU Alfath. (Dokumentasi MWCNU Pondok Aren)",p:["Keluarga Besar Nahdlatul Ulama Kecamatan Pondok Aren menggelar Halal Bi Halal di Omah Singgah NU Alfath pada 8 Dzulqa'dah 1447 H atau bertepatan dengan 26 April 2026 M. Kegiatan ini mengusung tema Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi.","Spanduk kegiatan memuat identitas pengurus ranting NU dari sebelas kelurahan di Pondok Aren.","Rangkaian kegiatan didokumentasikan oleh Media Center NU Pondok Aren dan tayang di kanal TVNU Pondok Aren, termasuk laporan ketua panitia mengenai target pembentukan anak ranting NU se-Pondok Aren."],info:[["Tanggal","8 Dzulqa'dah 1447 H / 26 April 2026 M"],["Tempat","Omah Singgah NU Alfath"],["Tema","Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi"]],ph:[4,5,6,7],vid:[2]}],
["Berita","MWCNU Pondok Aren Gelar Lailatul Ijtima' dan Tawaqufan di Pondok Kacang Barat","7 Februari 2026","Pengajian malam bersama pengurus MWCNU dan ranting di Majelis Taklim Annur.",1,"",{lead:"Pengajian malam bersama pengurus MWCNU Pondok Aren dan ranting digelar di Majelis Taklim Annur, Pondok Kacang Barat.",cap:"Lailatul Ijtima' dan Tawaqufan di Majelis Taklim Annur, Pondok Kacang Barat. (Dokumentasi MWCNU Pondok Aren)",p:["Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren bersama Pengurus Ranting NU (PRNU) Pondok Kacang Barat menggelar Lailatul Ijtima' dan Tawaqufan pada 7 Februari 2026 di Majelis Taklim Annur, Jl. Wisma Tajur RT 02 RW 010 No. 20, Kelurahan Pondok Kacang Barat.","Kegiatan berlangsung pukul 19.45 sampai 23.00 WIB dengan rangkaian acara pembukaan, yasin dan tahlil, pengajian Aswaja, doa penutup, dan ramah tamah.","Dokumentasi kegiatan tersedia di galeri foto laman ini."],info:[["Tanggal","7 Februari 2026"],["Waktu","19.45 sampai 23.00 WIB"],["Tempat","Majelis Taklim Annur, Jl. Wisma Tajur RT 02 RW 010 No. 20, Kel. Pondok Kacang Barat"]],list:["Pembukaan","Yasin dan tahlil","Pengajian Aswaja","Doa penutup","Ramah tamah"],ph:[0,1,2,3]}],
["Laporan","Launching QRIS, MWCNU Pondok Aren Melangkah Maju dari Koin NU","7 Juli 2025","Peluncuran QRIS sebagai langkah lanjutan program Koin NU.",null,"",{lead:"Peluncuran QRIS menjadi langkah maju dari program Koin NU di Pondok Aren.",p:["Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren meluncurkan QRIS sebagai langkah maju dari program Koin NU.","Dokumentasi peluncuran tayang di kanal TVNU Pondok Aren pada 7 Juli 2025."],vid:[4]}],
["Laporan","Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur","5 September 2024","Kunjungan pengurus MWCNU ke ranting dalam kegiatan Turba.",null,"",{lead:"Pengurus MWCNU Pondok Aren mengunjungi ranting dalam kegiatan Turba.",p:["Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren melaksanakan Turba di Pengurus Ranting NU (PRNU) Jurangmangu Timur.","Dokumentasi kegiatan tayang di kanal TVNU Pondok Aren pada 5 September 2024."],vid:[5]}]],MW.byDate);
var nt=document.getElementById('ntabs'),ng=document.getElementById('newsGrid'),cats=['Semua','Berita','Laporan','Literasi','Opini'],curN=[],curCat='Semua';
N.forEach(function(n){if(cats.indexOf(n[0])<0)cats.push(n[0])});
function nImg(src,alt,cls){return '<img'+(cls?' class="'+esc(cls)+'"':'')+' loading="lazy" src="'+esc(safeURL(src))+'" alt="'+esc(alt)+'">'}
function renderArticle(i){if(!N)return;var n=N[i];if(!n){location.hash='#berita';return}
var x=n[6]||{},ps=x.p||[],w=(n[1]+' '+ps.join(' ')).split(/\s+/).length,rt=Math.max(1,Math.round(w/180));
var hero=n[4]==null?'<div class="ah ah0"><span></span></div>':'<figure class="af">'+nImg(PH[n[4]],n[1],'ah')+(x.cap?'<figcaption>'+esc(x.cap)+'</figcaption>':'')+'</figure>';
var h='<div class="article-head"><div class="crumb"><a href="#berita">&larr; Kabar dan Berita</a></div><div class="kick">'+esc(n[0])+'</div><h1 class="at">'+esc(n[1])+'</h1><div class="article-byline"><span>'+(x.author?esc(x.author):'Redaksi MWCNU Pondok Aren')+'</span><i aria-hidden="true">·</i><span>'+esc(n[2])+'</span><i aria-hidden="true">·</i><span>'+rt+' menit baca</span></div></div>'+hero+'<div class="article-content"><div class="abody'+(x.fontA==='Serif'?' art-serif':x.fontA==='Sans'?' art-sans':'')+(x.drop?' art-drop':'')+'">';
if(x.body&&MW.rich){
  h+='<div class="adl"><strong class="dl">Pondok Aren</strong></div>';
  h+=MW.rich(x.body);
}else ps.forEach(function(t,k){
  if(k==0){
    var body=String(t).replace(/^\s*PONDOK AREN\s*[\u2013\u2014-]\s*/i,'');
    h+='<div class="adl"><strong class="dl">Pondok Aren</strong></div><p>'+esc(body)+'</p>';
  } else h+='<p>'+esc(t)+'</p>';
});
if(x.info&&x.info.length)h+='<div class="ai"><h3>Sekilas kegiatan</h3><dl>'+x.info.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>'}).join('')+'</dl></div>';
if(x.list&&x.list.length)h+='<h3>Rangkaian acara</h3><ol class="alist">'+x.list.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ol>';
if(x.ph&&x.ph.filter(function(k){return PH[k]}).length)h+='<h3>Foto kegiatan</h3><div class="aph">'+x.ph.filter(function(k){return PH[k]}).map(function(k){return nImg(PH[k],'Foto kegiatan','')}).join('')+'</div>';
if(x.vid&&x.vid.filter(function(k){return V[k]&&/^[\w-]{11}$/.test(V[k][0])}).length)h+='<h3>Tonton di TVNU Pondok Aren</h3>'+x.vid.filter(function(k){return V[k]&&/^[\w-]{11}$/.test(V[k][0])}).map(function(k){return '<a class="avid" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v='+encodeURIComponent(V[k][0])+'"><span class="play sm"></span><span><b>'+esc(V[k][1])+'</b><small>'+esc(V[k][2])+', TVNU Pondok Aren</small></span></a>'}).join('');
h+='</div><div class="ashare" aria-label="Bagikan artikel"><b>Bagikan</b><a class="share-btn share-wa" target="_blank" rel="noopener" aria-label="Bagikan lewat WhatsApp" href="https://wa.me/?text='+encodeURIComponent(n[1]+' '+location.href)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.6 8.6 0 0 1-12.7 7.5L3 20.5l1.3-4.6a8.6 8.6 0 1 1 16.2-4.1Z"/><path d="M8.2 7.8c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4 0 .6l-.5.7c-.2.2-.2.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .4-.2 1.2-.8 1.7-.5.5-1.2.7-2 .5-1.1-.2-2.4-.9-3.7-2.1-1.5-1.4-2.5-3.1-2.7-4.3-.2-.8 0-1.4.4-1.7Z"/></svg><span>WhatsApp</span></a><a class="share-btn share-fb" target="_blank" rel="noopener" aria-label="Bagikan lewat Facebook" href="https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8.2v3h2.7v8H14Z"/></svg><span>Facebook</span></a><button class="share-btn share-copy" id="cpl" type="button" aria-label="Salin tautan artikel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7"/></svg><span>Salin tautan</span></button></div>';
h+='</div>';
put(document.getElementById('arBody'),h);
var side=document.getElementById('arSide'),related=N.filter(function(item,index){return index!==i&&item[0]===n[0]});
N.forEach(function(item,index){if(index!==i&&related.indexOf(item)<0&&related.length<4)related.push(item)});
related=related.slice(0,4);
if(side)put(side,'<h2 class="ns-h">Baca juga</h2>'+related.map(function(item){var index=N.indexOf(item),thumb=item[4]==null?'<span class="nsph" aria-hidden="true"></span>':'<img class="nsth" loading="lazy" src="'+esc(safeURL(PH[item[4]]))+'" alt="">';return '<a class="nsitem plain" href="#berita/'+index+'">'+thumb+'<span class="nst"><b>'+esc(item[1])+'</b><em>'+esc(item[0])+' &middot; '+esc(item[2])+'</em></span></a>'}).join('')+'<a class="ar-side-more" href="#berita">Jelajahi semua berita <span aria-hidden="true">&rarr;</span></a>');
try{
  var seoTitle=x.metaT||n[1],seoDesc=x.metaD||n[3]||x.lead||'';
  if(!seoDesc&&x.body&&MW.rich){var seoText=document.createElement('div');seoText.innerHTML=MW.rich(x.body);seoDesc=seoText.textContent.replace(/\s+/g,' ').trim().slice(0,160)}
  document.title=seoTitle+' | MWCNU Pondok Aren';
  [['meta[name="description"]',seoDesc],['meta[property="og:title"]',seoTitle],['meta[property="og:description"]',seoDesc],['meta[property="og:url"]',location.href],['meta[name="twitter:title"]',seoTitle],['meta[name="twitter:description"]',seoDesc]].forEach(function(pair){var el=document.querySelector(pair[0]);if(el)el.setAttribute('content',pair[1])});
  if(n[4]!=null&&PH[n[4]]){var img=safeURL(PH[n[4]]);[['meta[property="og:image"]',img],['meta[name="twitter:image"]',img]].forEach(function(pair){var el=document.querySelector(pair[0]);if(el)el.setAttribute('content',pair[1])})}
}catch(e){}
var cp=document.getElementById('cpl');if(cp)cp.onclick=function(){var u=location.href,done=function(){var label=cp.querySelector('span');if(label)label.textContent='Tautan tersalin';cp.setAttribute('aria-label','Tautan berhasil disalin');setTimeout(function(){if(label)label.textContent='Salin tautan';cp.setAttribute('aria-label','Salin tautan artikel')},2200)};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(done,function(){fallbackCopy(u,done)})}else fallbackCopy(u,done)}}
function fallbackCopy(value,done){var field=document.createElement('textarea');field.value=value;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();try{if(document.execCommand('copy'))done()}finally{field.remove()}}
function drawN(c){curCat=c;ng.textContent='';
[].forEach.call(nt.children,function(b){b.setAttribute('aria-selected',b.textContent==c)});
var qv=document.getElementById('nq').value.trim().toLowerCase();
curN=N.filter(function(n){return (c=='Semua'||n[0]==c)&&(!qv||(n[1]+' '+n[3]+' '+((n[6]&&n[6].tag)||'')).toLowerCase().indexOf(qv)>-1)});
if(!qv)curN.sort(function(a,b){var fa=(a[6]&&a[6].featured)?1:0,fb=(b[6]&&b[6].featured)?1:0;return fb-fa});
if(!qv&&curN.length&&N.length){var _fi=N.findIndex(function(n){return n[6]&&n[6].featured});if(_fi>-1&&curN.indexOf(N[_fi])>-1){var _f=N[_fi];curN=curN.filter(function(n){return n!==_f});curN.unshift(_f)}}
ng.className='news narch'+(curN.length<3?' few':'');
if(!curN.length){put(ng,'<div class="ne"><b>'+(qv?'Berita tidak ditemukan':'Belum ada tulisan')+'</b><span>'+(qv?'Coba kata kunci lain.':'Tulisan kategori ini akan tampil di sini.')+'</span></div>');return}
curN.forEach(function(n,i){
var k=N.indexOf(n);
var th=(n[4]==null?'<div class="th ph0"><span class="ph0l"></span></div>':'<div class="th"><img loading="lazy" src="'+PH[n[4]]+'" alt="'+esc(n[1])+'"></div>');
var meta='<div class="meta">'+(i==0?'<span class="chip top">Terbaru</span>':'')+'<span class="chip">'+esc(n[0])+'</span><small>'+esc(n[2])+' &middot; '+rtOf(n)+' menit baca</small></div>';
var body='<div class="b">'+meta+'<h3>'+esc(n[1])+'</h3><span class="more">'+(i==0?'Baca laporan lengkap':'Baca selengkapnya')+'</span></div>';
var a=document.createElement('article');a.className=i==0?'feat':'item';
put(a,th+body);act(a,function(){location.hash='#berita/'+k});
ng.appendChild(a)})}
document.getElementById('nq').oninput=function(){drawN(curCat)};
cats.forEach(function(c){var b=document.createElement('button');b.textContent=c;b.setAttribute('role','tab');b.onclick=function(){drawN(c)};nt.appendChild(b)});
drawN('Semua');route();
function rtOf(n){var x=n[6]||{},ps=x.p||[];var w=(n[1]+' '+(x.lead||'')+' '+ps.join(' ')).split(/\s+/).length;return Math.max(1,Math.round(w/180))}
var _ns=document.getElementById('nside');
if(_ns&&N&&N.length){var _cats=[['Semua','Semua'],['Berita','Berita'],['Laporan','Laporan'],['Literasi','Literasi']];try{_cats=_cats.map(function(c){var n=N.filter(function(x){return c[0]=='Semua'||x[0]==c[0]}).length;return [c[0],c[1],n]})}catch(e){}
put(_ns,'<h3 class="ns-h">Berita Populer</h3>'+N.slice(0,5).map(function(n,i){return '<a class="nsitem" href="#berita/'+N.indexOf(n)+'"><span class="nsnum">'+('0'+(i+1))+'</span>'+(n[4]==null?'<span class="nsph"></span>':'<img class="nsth" loading="lazy" src="'+PH[n[4]]+'" alt="">')+'<span class="nst"><b>'+esc(n[1])+'</b><em>'+esc(n[2])+' &middot; '+rtOf(n)+' menit baca</em></span></a>'}).join('')+'<h3 class="ns-h ns-h2">Kategori</h3><div class="ncat">'+_cats.map(function(c){return '<button type="button" class="ncatb" data-cat="'+c[0]+'"><span>'+c[1]+'</span><small>'+c[2]+'</small></button>'}).join('')+'</div><div class="nsub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><div><b>Berita pilihan, setiap pagi.</b><p>Ringkasan kabar penting langsung ke WhatsApp Anda.</p></div><a href="https://wa.me/6285161033689?text=Assalamu%27alaikum%2C%20saya%20ingin%20berlangganan%20kabar%20MWCNU%20Pondok%20Aren" target="_blank" rel="noopener">Daftar</a></div>');
[].forEach.call(_ns.querySelectorAll('.ncatb'),function(b){b.onclick=function(){drawN(b.dataset.cat);var a=document.getElementById('berita');if(a)a.scrollIntoView({behavior:'smooth',block:'start'})}})}
var _hb=document.getElementById('hbtn');if(_hb)_hb.onclick=function(){openGs()};var GS=null;function openGs(){var el=document.getElementById('gSearch');if(!el)return;el.hidden=false;document.body.style.overflow='hidden';var inp=document.getElementById('gsq');if(inp){inp.value='';inp.focus()}drawGs('')}
var _hn=document.getElementById('homeNews');
if(_hn&&N){N.slice(0,3).forEach(function(n){var a=document.createElement('article');
put(a,(n[4]==null?'<div class="th ph0"><span class="ph0l"></span></div>':'<div class="th"><img loading="lazy" src="'+PH[n[4]]+'" alt=""></div>')+'<div class="b"><h3>'+n[1]+'</h3></div>');
act(a,function(){location.hash='#berita/'+N.indexOf(n)});_hn.appendChild(a)})}
var G=MW.md('galeri',function(x){return[x.judul,ph(x.foto),x.kegiatan||'']},[["Halal Bi Halal di Omah Singgah NU Alfath",4,"Halal Bi Halal"],["Sambutan di Lailatul Ijtima'",1,"Lailatul Ijtima'"],["Sambutan pada Halal Bi Halal",5,"Halal Bi Halal"],["Sambutan di Pondok Kacang Barat",2,"Lailatul Ijtima'"],["Lailatul Ijtima' di Pondok Kacang Barat",0,"Lailatul Ijtima'"],["Pengurus dan tamu undangan",6,"Halal Bi Halal"],["Rangkaian acara Halal Bi Halal",7,"Halal Bi Halal"],["Rangkaian acara Lailatul Ijtima'",3,"Lailatul Ijtima'"]]);
/* Buang item dengan foto tidak valid (ph() -> null) agar tidak muncul url(undefined). */
G=G.filter(function(g){return g&&g[1]!=null});
var gl=document.getElementById('gal'),gt=document.getElementById('gtabs'),GE=['Semua',"Lailatul Ijtima'",'Halal Bi Halal'],gcur=[],lb=document.getElementById('lb'),li=0,lbi=document.getElementById('lbi');
function lbShow(i){li=(i+gcur.length)%gcur.length;var g=gcur[li];lbi.src=PH[g[1]];lbi.alt=g[0];
document.getElementById('lbt').textContent=g[0];document.getElementById('lbe').textContent=g[2];document.getElementById('lbc').textContent=(li+1)+' dari '+gcur.length}
function drawG(e){gl.textContent='';gl.className='gal'+(e=='Semua'?' mos':'');
[].forEach.call(gt.children,function(b){b.setAttribute('aria-selected',b.textContent==e)});
gcur=G.filter(function(g){return e=='Semua'||g[2]==e});
gcur.forEach(function(g,i){var b=document.createElement('button');b.setAttribute('aria-label','Buka foto: '+esc(g[0]));
put(b,'<em>'+esc(g[2])+'</em><span>'+esc(g[0])+'</span>');
b.style.background='linear-gradient(transparent 45%,rgba(4,20,14,.82)),url('+PH[g[1]]+') center/cover';
b.onclick=function(){lbShow(i);lb.showModal()};gl.appendChild(b)})}
GE.forEach(function(e){var b=document.createElement('button');b.textContent=e;b.setAttribute('role','tab');b.onclick=function(){drawG(e)};gt.appendChild(b)});
drawG('Semua');
var gmd=document.getElementById('gmode');[['Foto',G.length],['Video',V.length]].forEach(function(x){var b=document.createElement('button');b.dataset.k=x[0];b.setAttribute('role','tab');put(b,esc(x[0])+'<small>'+x[1]+'</small>');b.onclick=function(){setG(x[0])};gmd.appendChild(b)});setG(GM);
document.getElementById('lbp').onclick=function(){lbShow(li-1)};
document.getElementById('lbn').onclick=function(){lbShow(li+1)};
document.getElementById('lbx').onclick=function(){lb.close()};
lb.onclick=function(e){if(e.target==lb)lb.close()};
lb.onkeydown=function(e){if(e.key=='ArrowLeft')lbShow(li-1);else if(e.key=='ArrowRight')lbShow(li+1)};
var tx=0;lbi.ontouchstart=function(e){tx=e.touches[0].clientX};
lbi.ontouchend=function(e){var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>40)lbShow(li+(d<0?1:-1))};
// Ranting
var K=MW.md('ranting',function(x){return[x.kelurahan,x.ketua||'']},[["Pondok Aren","Ust. Zakariaa"],["Jurangmangu Barat","Ust. Muhammad Ikhwan, S.Pd.I"],["Jurangmangu Timur","Ust. Chairul Anam"],["Pondok Betung","Ust. Abdullah Yunus"],["Pondok Karya","Ust. Ma'mun Murod"],["Pondok Jaya","Ust. Ali Ikhwan"],["Pondok Pucung","Ust. Nasuha, S.Pd.I"],["Pondok Kacang Barat","Ust. Aprianif, Lc."],["Pondok Kacang Timur","Ust. Suwardi"],["Parigi Baru","Ust. Adih"],["Parigi Lama","Ust. Muhammad Ismi"]]);
var ch=document.getElementById('chips'),q=document.getElementById('q');
function draw(){var v=q.value.trim().toLowerCase(),f=K.filter(function(k){return (k[0]+' '+k[1]).toLowerCase().indexOf(v)>-1});
put(ch,f.length?f.map(function(k){return '<div class="rc"><b>PRNU '+k[0]+'</b><p class="kn">'+k[1]+'</p><small>Ketua ranting</small><a href="https://wa.me/6285161033689?text='+encodeURIComponent("Assalamu'alaikum, saya ingin menghubungi PRNU "+k[0])+'" target="_blank" rel="noopener">Tanya lewat WhatsApp</a></div>'}).join(''):'<p class="empty">Kelurahan tidak ditemukan. Periksa ejaan atau hapus kata kunci.</p>')}
q.oninput=draw;draw();

/* ===== PENCARIAN GLOBAL ===== */
var _gs=document.getElementById('gSearch'),_gb=document.getElementById('gsBody'),_gq=document.getElementById('gsq'),_gback=document.getElementById('gsBack');
function _idx(){var a=[];
try{N.forEach(function(n,i){a.push({g:'Berita',t:n[1],s:n[0]+' · '+n[2],h:'#berita/'+i})})}catch(e){}
try{Object.keys(T).forEach(function(k){T[k].forEach(function(p){a.push({g:'Pengurus',t:p[1],s:p[0]+' · '+k,h:'#struktur'})})})}catch(e){}
try{K.forEach(function(k){a.push({g:'Ranting',t:'PRNU '+k[0],s:k[1]+' · Ketua ranting',h:'#ranting'})})}catch(e){}
try{(LSV||[]).forEach(function(l){a.push({g:'Layanan',t:l.title,s:l.desc||'',h:l.link||'#layanan'})})}catch(e){}
try{G.forEach(function(g){a.push({g:'Galeri',t:g[0],s:g[2]||'',h:'#galeri'})})}catch(e){}
[['Program & Layanan','#program'],['Susunan Pengurus','#struktur'],['Agenda','#agenda'],['Kabar Terbaru','#berita'],['Galeri','#galeri'],['Ranting','#ranting'],['Layanan Jam\'iyyah','#layanan'],['Majelis Taklim','#majelis'],['Konsultasi Agama','#konsultasi'],['Ambulans','#ambulans'],['Zakat & Infaq','#zis'],['Daftar KTA','#daftar']].forEach(function(x){a.push({g:'Halaman',t:x[0],s:'Buka halaman',h:x[1]})});
return a}
var _flat=[];
function drawGs(v){v=(v||'').trim().toLowerCase();_flat=[];if(!_gb)return;
if(!v){var quick=[['Susunan Pengurus','#struktur'],['Ranting','#ranting'],['Berita','#berita'],['Layanan','#layanan'],['Galeri','#galeri'],['Agenda','#agenda']];put(_gb,'<p class="gs-hint">Ketik kata kunci untuk mencari di seluruh situs, atau pilih tujuan:</p><div class="gs-quick">'+quick.map(function(x){return '<a href="'+x[1]+'" class="gs-q">'+x[0]+'</a>'}).join('')+'</div>');_flat=[];return}
var ix=_idx().filter(function(x){return (x.t+' '+x.s+' '+x.g).toLowerCase().indexOf(v)>-1});
if(!ix.length){put(_gb,'<div class="gs-empty"><b>Tidak ada hasil untuk “'+esc(v)+'”</b><span>Coba kata kunci lain, misalnya nama pengurus, kelurahan, atau judul berita.</span></div>');return}
var groups={};ix.forEach(function(x){(groups[x.g]=groups[x.g]||[]).push(x)});
put(_gb,Object.keys(groups).map(function(g){var list=groups[g];var h='<h4 class="gs-g">'+g+'<span>'+list.length+'</span></h4>';list.slice(0,6).forEach(function(x){_flat.push(x);h+='<a class="gs-r" href="'+x.h+'" data-h="'+x.h+'"><b>'+esc(x.t)+'</b><small>'+esc(x.s)+'</small></a>'});return h}).join(''));
[].forEach.call(_gb.querySelectorAll('.gs-r'),function(a){a.addEventListener('click',function(){closeGs()})})}
var _sel=-1;
function _paint(){[].forEach.call(_gb.querySelectorAll('.gs-r'),function(a,i){a.classList.toggle('sel',i===_sel)});var el=_gb.querySelector('.gs-r.sel');if(el)el.scrollIntoView({block:'nearest'})}
function closeGs(){if(!_gs)return;_gs.hidden=true;document.body.style.overflow='';_sel=-1;if(_hb)_hb.focus()}
function goHash(h){closeGs();go(h)}
if(_gb){_gq.addEventListener('input',function(){_sel=-1;drawGs(_gq.value)});
_gq.addEventListener('keydown',function(e){var rows=[].slice.call(_gb.querySelectorAll('.gs-r'));
if(e.key==='ArrowDown'){e.preventDefault();if(rows.length){_sel=(_sel+1)%rows.length;_paint()}}
else if(e.key==='ArrowUp'){e.preventDefault();if(rows.length){_sel=(_sel-1+rows.length)%rows.length;_paint()}}
else if(e.key==='Enter'){e.preventDefault();var a=_sel>-1?rows[_sel]:rows[0];if(a){var h=a.getAttribute('data-h');closeGs();go(h)}}
else if(e.key==='Escape'){closeGs()}});
_gb.addEventListener('click',function(e){var a=e.target.closest('.gs-q');if(a){e.preventDefault();closeGs();go(a.getAttribute('href'))}});
if(_gback)_gback.addEventListener('click',closeGs);
document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openGs()}else if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/i.test(document.activeElement.tagName)){e.preventDefault();openGs()}});
}})();

/* ===== KARTU ANGGOTA ===== */
(function(){try{
var $=function(i){return document.getElementById(i)};
if(!$('kartu-app'))return;
var W=1011,H=638;
var MWK=window.MWC||{set:function(){return null},tok:function(s){return s}};var CFG={domain:'https://mwcnupondokaren.or.id',pejabat:(MWK.set('kartu')&&MWK.set('kartu').pejabat)||[{j:'Rois Syuriyah',n:'K.H. Mohommad Toha, S.Ag',ttd:''},{j:'Ketua Tanfidziyah',n:'H. Fathur Rahman',ttd:''}],wa:'6285161033689',
alamat:(MWK.set('kontak')&&MWK.set('kontak').alamat)||'Jl. Garuda Raya No. 107A, Jurangmangu Timur, Kec. Pondok Aren, Kota Tangerang Selatan',kontak:MWK.tok('WA 0851-6103-3689  |  mwcnu.pdaren@gmail.com'),web:'mwcnupondokaren.or.id'};
var LW='/assets/img/img-592fc43a.png';
var RT=window.MWC_RT;
var BL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var HF='"Plus Jakarta Sans",system-ui,sans-serif',BF='"Inter",system-ui,sans-serif';
var S={photo:null,rand:null,imgs:null};

function authCfg(){try{var C=window.MWC_CFG||{};return{url:C.supabaseUrl||'',key:C.supabaseKey||''}}catch(e){return{url:'',key:''}}}
function sesGet(){try{var s=JSON.parse(localStorage.getItem('mwc_auth')||'null');if(s&&s.user&&/^local-/.test(String(s.user.id||''))){localStorage.removeItem('mwc_auth');return null}return s}catch(e){return null}}
function sesSet(s){try{if(s)localStorage.setItem('mwc_auth',JSON.stringify(s));else localStorage.removeItem('mwc_auth')}catch(e){}}
function profKey(){var s=sesGet();return s&&s.user&&(s.user.id||s.user.email)}
function profGet(){var k=profKey();if(!k)return null;try{return JSON.parse(localStorage.getItem('mwc_profile_'+k)||'null')}catch(e){return null}}
/* Simpan profil. NIA & status TIDAK pernah dikirim klien — keduanya diatur server
   (issue_nia / guard_profile di supabase-profiles.sql). Mengembalikan Promise. */
function profSave(p){var k=profKey();if(!k)return Promise.resolve(null);try{localStorage.setItem('mwc_profile_'+k,JSON.stringify(p||{}))}catch(e){}
try{var C=authCfg(),s=sesGet();if(!C.url||!C.key||!s||!s.access_token||!s.user||/^local-/.test(String(s.user.id)))return Promise.resolve(null);
var b={};['nama','hp','wadah','tingkat','ranting','alamat','tempat_lahir','jk','pekerjaan'].forEach(function(f){if(p[f]!==undefined)b[f]=p[f]});if(p.tanggal_lahir)b.tanggal_lahir=p.tanggal_lahir;
var H={apikey:C.key,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'return=representation'};
function keep(row){if(row){var m=profGet()||{};['nia','status','issued_at','signers'].forEach(function(f){if(row[f]!==undefined)m[f]=row[f]});try{localStorage.setItem('mwc_profile_'+k,JSON.stringify(m))}catch(e){}}return row||null}
return fetch(C.url+'/rest/v1/profiles?id=eq.'+encodeURIComponent(s.user.id),{method:'PATCH',headers:H,body:JSON.stringify(b)}).then(function(r){
  if(r.status===401){sesSet(null);throw new Error('sesi berakhir — silakan masuk ulang')}
  if(r.status===403)throw new Error('server menolak perubahan data (403) — hubungi sekretariat')
  if(!r.ok)throw new Error('gagal menyimpan profil ('+r.status+')');
  return r.json().then(function(a){if(a&&a.length)return keep(a[0]);
    /* Belum ada baris profil (akun lama): buat sekali, tanpa nia/status. */
    return fetch(C.url+'/rest/v1/profiles',{method:'POST',headers:H,body:JSON.stringify(Object.assign({id:s.user.id,email:s.user.email||''},b))}).then(function(r2){if(!r2.ok)throw new Error('gagal membuat profil ('+r2.status+')');return r2.json()}).then(function(a2){return keep(a2&&a2[0])})})
})}catch(e){return Promise.reject(e)}}
function sbErr(r){return r&&r.msg?(r.code+' '+r.msg):(r&&r.message)}
function sbAuth(path,body){var C=authCfg();if(!C.url||!C.key)return Promise.reject('server');return fetch(C.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw sbErr(j);return j})})}
function profFetch(){var C=authCfg(),s=sesGet();if(!C.url||!C.key||!s||!s.user||/^local-/.test(String(s.user.id)))return Promise.resolve(profGet());
/* Tanpa access token jangan pernah fallback ke anon key — data profil hanya diambil
   dengan sesi milik pengguna (RLS membatasi ke barisnya sendiri). */
if(!s.access_token)return Promise.resolve(profGet());
return fetch(C.url+'/rest/v1/profiles?id=eq.'+encodeURIComponent(s.user.id)+'&select=*',{headers:{apikey:C.key,Authorization:'Bearer '+s.access_token}}).then(function(r){return r.ok?r.json():[]}).then(function(a){var p=a&&a[0];if(p){var l=profGet()||{};var m={nama:p.nama||l.nama||'',hp:p.hp||l.hp||'',email:p.email||s.user.email||'',nia:p.nia||'',status:p.status||'pending',issued_at:p.issued_at||null,signers:p.signers||null,wadah:p.wadah||'',tingkat:p.tingkat||'',ranting:p.ranting||'',alamat:p.alamat||'',tempat_lahir:p.tempat_lahir||'',tanggal_lahir:p.tanggal_lahir||'',jk:p.jk||'',pekerjaan:p.pekerjaan||''};try{localStorage.setItem('mwc_profile_'+profKey(),JSON.stringify(m))}catch(e){}return m}return profGet()}).catch(function(){return profGet()})}
function authMsg(t,bad,ok){var m=$('kAuthMsg');if(m){m.textContent=t;m.style.color=bad?'#D9534F':(ok?'#1F7A4D':'')}}
function applyProf(){var p=profGet();if(!p)return;function set(id,v){var e=$(id);if(e&&v&&!e.value)e.value=v}set('k-nama',p.nama);set('k-hp',p.hp);set('k-wadah',p.wadah);set('k-tingkat',p.tingkat);set('k-alamat',p.alamat);set('k-tmp',p.tempat_lahir);set('k-tgl',p.tanggal_lahir);set('k-jk',p.jk);set('k-kerja',p.pekerjaan);try{if(p.tingkat)$('k-tingkat').dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}set('k-rt',p.ranting)}
function toggleAuth(){var s=sesGet(),ok=!!(s&&s.user),p=profGet();
/* Tautan menu Profil hanya untuk sesi server; sesi lokal/offline diarahkan ke laman Daftar. */
var nl=$('nav-pr');if(nl)nl.hidden=!(ok&&s&&!/^local-/.test(String(s.user.id||'')));
$('kAuth').hidden=ok;$('kBar').hidden=!ok;$('kGate').hidden=!ok;
if(ok){$('kWho').textContent=p&&p.nama?p.nama:(s.user.email||'Pengguna');$('kProfState').textContent=p&&p.nia?('Nomor induk '+p.nia+' · '+(p.status==='verified'?'terverifikasi':p.status==='rejected'?'ditolak':'menunggu verifikasi')):(p&&p.nama?'Profil sudah dibuat — nomor induk diterbitkan setelah pengurus memverifikasi.':'Profil belum dibuat — akan dibuatkan saat Anda menyimpan kartu.');applyProf();draw()}}
function finishLogin(user,token,extra,rt){sesSet({access_token:token||'',refresh_token:rt||'',user:{id:user.id,email:user.email||'',email_confirmed_at:user.email_confirmed_at||''}});
if(extra&&(extra.nama||extra.hp)){var p=profGet()||{};profSave({nama:extra.nama||p.nama||'',hp:extra.hp||p.hp||'',email:user.email||p.email||''}).catch(function(){})}
if(!profGet())profSave({nama:(extra&&extra.nama)||'',hp:(extra&&extra.hp)||'',email:user.email||''}).catch(function(){});
authMsg('');toggleAuth()}
$('kTabIn').addEventListener('click',function(){$('kTabIn').classList.add('on');$('kTabUp').classList.remove('on');document.querySelectorAll('#kAuthF [data-reg]').forEach(function(e){e.hidden=true});$('kAuthBtn').textContent='Masuk';$('a-pass').autocomplete='current-password'});
$('kTabUp').addEventListener('click',function(){$('kTabUp').classList.add('on');$('kTabIn').classList.remove('on');document.querySelectorAll('#kAuthF [data-reg]').forEach(function(e){e.hidden=false});$('kAuthBtn').textContent='Buat akun & profil';$('a-pass').autocomplete='new-password'});
document.querySelectorAll('#kAuthF [data-reg]').forEach(function(e){e.hidden=true});
$('kAuthF').addEventListener('submit',function(e){e.preventDefault();var em=$('a-email').value.trim().toLowerCase(),pw=$('a-pass').value,nm=$('a-nama').value.trim(),hp=$('a-hp').value.trim(),isUp=$('kTabUp').classList.contains('on');
if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return authMsg('Mohon isi email yang valid.',1);
if(pw.length<6)return authMsg('Kata sandi minimal 6 karakter.',1);
if(isUp){if(!nm)return authMsg('Mohon isi nama lengkap untuk membuat profil.',1);if(hp.replace(/\D/g,'').length<9)return authMsg('Mohon isi nomor HP yang valid.',1)}
authMsg('Memproses…');$('kAuthBtn').disabled=true;
sbAuth(isUp?'signup':'token?grant_type=password',isUp?{email:em,password:pw,options:{data:{name:nm},email_redirect_to:location.origin+'/'}}:{email:em,password:pw}).then(function(j){
  $('kAuthBtn').disabled=false;
  if(j&&!j.user&&!j.access_token&&!j.session){authMsg('Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke email Anda — cek juga folder Spam/Promotions. Setelah email dikonfirmasi, masuk kembali di tab Masuk.',0,1);return}
  var u=(j&&j.user)||(j&&j.session&&j.session.user);if(!u){authMsg('Server tidak mengembalikan sesi. Coba lagi.',1);return}
  if(!u.email_confirmed_at){authMsg('Email Anda belum dikonfirmasi. Buka tautan konfirmasi di email (cek juga folder Spam/Promotions), lalu masuk kembali.');return}
  finishLogin(u,(j.access_token||(j.session&&j.session.access_token)),{nama:nm,hp:hp},(j.refresh_token||(j.session&&j.session.refresh_token)||''));authMsg('Berhasil masuk.')
}).catch(function(err){$('kAuthBtn').disabled=false;
  var m=String(err||'');
  if(isUp&&(m.indexOf('already')>-1||m.indexOf('registered')>-1)){authMsg('Email sudah terdaftar. Silakan masuk.',1);return}
  if(!authCfg().url){authMsg('Layanan akun belum tersedia. Kartu Anggota memerlukan akun terdaftar — hubungi sekretariat.',1);return}
  /* Tidak ada lagi masuk otomatis: akun palsu lokal membuat NIA bisa diklaim orang lain. */
  authMsg('Gagal masuk: '+(m||'periksa email dan kata sandi Anda')+'.',1)
})});
$('kOut').addEventListener('click',function(){var k=profKey();sesSet(null);try{if(k)localStorage.removeItem('mwc_profile_'+k)}catch(e){}toggleAuth();authMsg('')})
/* Lupa kata sandi: kirim tautan reset ke email yang diketik di form masuk. */
$('kForgot').addEventListener('click',function(){var C=authCfg(),em=v('a-email');
  if(!C.url){authMsg('Layanan akun belum tersedia — hubungi sekretariat.',1);return}
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){authMsg('Isi email Anda di kolom Email, lalu klik lagi tombol ini.',1);return}
  authMsg('Mengirim tautan reset…');
  fetch(C.url+'/auth/v1/recover',{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify({email:em,redirect_to:location.origin+'/'})})
  .then(function(r){authMsg('Jika email terdaftar, tautan reset sudah dikirim. Periksa kotak masuk (dan folder spam).')})
  .catch(function(){authMsg('Gagal mengirim. Periksa koneksi lalu coba lagi.',1)})
});
/* Tautan konfirmasi/reset dari email mendarat di beranda dengan
   #access_token=... (Supabase tidak mengizinkan fragment di Redirect URL).
   Sesi dibuat langsung agar warga tidak perlu mengetik ulang kata sandi,
   lalu diarahkan ke halaman Kartu Anggota. */
(function confirmFragment(){
  var h=(location.hash||'').replace(/^#/,'');
  if(!h||h.indexOf('access_token=')<0)return;
  var C=authCfg();if(!C.url||!C.key)return;
  var q={};h.split('&').forEach(function(kv){var i=kv.indexOf('=');if(i>0)q[kv.slice(0,i)]=kv.slice(i+1)});
  var tok=q.access_token,rt=q.refresh_token||'';
  if(!tok)return;
  history.replaceState(null,'',location.pathname+location.search);
  fetch(C.url+'/auth/v1/user',{headers:{apikey:C.key,Authorization:'Bearer '+tok}})
  .then(function(r){return r.json().then(function(j){if(!r.ok)throw sbErr(j);return j})})
  .then(function(u){
    finishLogin(u,tok,{nama:(u.user_metadata&&u.user_metadata.name)||''},rt);
    location.hash='#daftar';
    authMsg('Berhasil masuk. Email Anda telah dikonfirmasi — silakan lanjut mengisi Kartu Anggota.',0,1)
  })
  .catch(function(){
    location.hash='#daftar';
    authMsg('Tautan konfirmasi kedaluwarsa atau tidak valid. Silakan masuk dengan email dan kata sandi Anda.')
  })
})();
function v(id){return($(id).value||'').trim()}
function fmt(d){return d.getDate()+' '+BL[d.getMonth()]+' '+d.getFullYear()}
function fmtIso(s){var a=String(s).split('-');return a.length==3&&a[0]?parseInt(a[2],10)+' '+BL[parseInt(a[1],10)-1]+' '+a[0]:''}
function cd(s){return window.MWC_NIA_CD(s)}
function lvl(){return v('k-tingkat')}
/* NIA diterbitkan server (issue_nia di supabase-profiles.sql) setelah pengurus
   memverifikasi. Klien hanya membaca — tidak pernah membuat atau mengubahnya. */
function nia(){var p=profGet();return(p&&p.nia)||''}

function info(){var t=new Date(),L=lvl(),rt=v('k-rt'),p=profGet()||{};return{nia:nia(),nama:v('k-nama'),jk:v('k-jk'),tmp:v('k-tmp'),tgl:fmtIso(v('k-tgl')),alamat:v('k-alamat'),rt:rt,wilayah:L=='MWCNU'?'MWCNU Kec. Pondok Aren':L=='PRNU'?('PRNU'+(rt?' '+rt:'')):'',kerja:v('k-kerja'),wadah:v('k-wadah'),hp:v('k-hp'),terbit:fmt(t),status:p.status||'pending'}}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function txt(c,t,x,y,font,col,ls,al){c.font=font;c.fillStyle=col;c.textAlign=al||'left';if('letterSpacing' in c)c.letterSpacing=(ls||0)+'px';c.fillText(t,x,y);if('letterSpacing' in c)c.letterSpacing='0px'}
function fitF(c,t,maxW,fam,wt,max,min){var s=max;while(s>min){c.font=wt+' '+s+'px '+fam;if(c.measureText(t).width<=maxW)break;s--}return wt+' '+s+'px '+fam}
function wrap(c,t,maxW,maxL,font){c.font=font;var w=String(t).split(/\s+/).filter(Boolean),L=[],cur='';w.forEach(function(x){var tr=cur?cur+' '+x:x;if(c.measureText(tr).width>maxW&&cur){L.push(cur);cur=x}else cur=tr});if(cur)L.push(cur);if(L.length>maxL){L=L.slice(0,maxL);var l=L[maxL-1];while(l.length&&c.measureText(l+'\u2026').width>maxW)l=l.slice(0,-1);L[maxL-1]=l+'\u2026'}return L}
function glow(c,x,y,r,col){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function dots(c,col,gap){c.fillStyle=col;for(var y=18;y<H;y+=gap)for(var x=18;x<W;x+=gap){c.beginPath();c.arc(x,y,1.5,0,6.2832);c.fill()}}
function bar(c,y,h){var g=c.createLinearGradient(0,0,W,0);g.addColorStop(0,'#FFC94A');g.addColorStop(.55,'#E4761B');g.addColorStop(1,'#2BD9A0');c.fillStyle=g;c.fillRect(0,y,W,h)}
function logo(c,img,x,y,h){if(!img)return 0;var w=h*img.width/img.height;c.drawImage(img,x,y,w,h);return w}
function lbl(c,t,x,y,col){txt(c,t,x,y,'700 13px '+BF,col||'#8FE9C6',2)}
function photo(c,d,x,y,w,h){c.save();rr(c,x,y,w,h,20);c.clip();var p=S.photo;if(p){var z=+$('k-zoom').value,px=+$('k-px').value,py=+$('k-py').value,sc=Math.max(w/p.width,h/p.height)*z,dw=p.width*sc,dh=p.height*sc;c.drawImage(p,x-(dw-w)*px,y-(dh-h)*py,dw,dh)}else{c.fillStyle='#1C4A38';c.fillRect(x,y,w,h);c.fillStyle='#2E6B52';c.beginPath();c.arc(x+w/2,y+h*.38,w*.2,0,6.2832);c.fill();c.beginPath();c.ellipse(x+w/2,y+h*.95,w*.42,h*.3,0,0,6.2832);c.fill();txt(c,'FOTO 3\u00d74',x+w/2,y+h-18,'700 14px '+BF,'rgba(255,255,255,.55)',2,'center')}c.restore()}
function front(c,d){
var g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0F3B2C');g.addColorStop(1,'#08201A');c.fillStyle=g;c.fillRect(0,0,W,H);
glow(c,140,40,460,'rgba(43,217,160,.30)');glow(c,W-70,H-20,420,'rgba(228,118,27,.30)');dots(c,'rgba(255,255,255,.07)',26);
c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=2;[170,250,330].forEach(function(r){c.beginPath();c.arc(W-30,160,r,0,6.2832);c.stroke()});
bar(c,0,10);
var lw=logo(c,S.imgs.lw,40,26,76),tx=40+lw+22;
txt(c,'KARTU ANGGOTA',tx,52,'700 22px '+HF,'#FFC94A',3);
txt(c,'MWCNU PONDOK AREN',tx,92,'700 38px '+HF,'#FFFFFF',.5);
txt(c,'Majelis Wakil Cabang Nahdlatul Ulama \u00b7 Kec. Pondok Aren',tx,118,'500 15px '+BF,'rgba(255,255,255,.72)');
var hl=c.createLinearGradient(40,0,W-40,0);hl.addColorStop(0,'rgba(255,201,74,.9)');hl.addColorStop(1,'rgba(255,201,74,0)');c.fillStyle=hl;c.fillRect(40,138,W-80,2);
var px=44,py=166,pw=230,ph=307;c.save();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=24;c.shadowOffsetY=10;var bg=c.createLinearGradient(px,py,px+pw,py+ph);bg.addColorStop(0,'#FFC94A');bg.addColorStop(1,'#2BD9A0');c.fillStyle=bg;rr(c,px-6,py-6,pw+12,ph+12,26);c.fill();c.restore();photo(c,d,px,py,pw,ph);
c.fillStyle='#FFC94A';rr(c,px,492,pw,42,21);c.fill();txt(c,(d.wadah||'WADAH KHIDMAH').toUpperCase(),px+pw/2,520,'700 17px '+BF,'#06241A',1.5,'center');
var x0=318,mw=W-44-x0;
lbl(c,'NOMOR INDUK ANGGOTA',x0,176);var niaTxt=d.nia||'BELUM DITERBITKAN';txt(c,niaTxt,x0,214,fitF(c,niaTxt,mw,HF,'700',34,20),d.nia?'#FFFFFF':'rgba(255,255,255,.45)',1);
lbl(c,'NAMA LENGKAP',x0,254);txt(c,d.nama||'Nama lengkap',x0,296,fitF(c,d.nama||'Nama lengkap',mw,HF,'700',36,20),d.nama?'#FFFFFF':'rgba(255,255,255,.4)');
lbl(c,'TEMPAT, TANGGAL LAHIR',x0,334);var ttl=(d.tmp||d.tgl)?[d.tmp,d.tgl].filter(Boolean).join(', '):'Tempat, tanggal lahir';txt(c,ttl,x0,364,fitF(c,ttl,mw,BF,'600',22,15),d.tmp&&d.tgl?'#FFFFFF':'rgba(255,255,255,.4)');
lbl(c,'ALAMAT',x0,398);var al=wrap(c,d.alamat||'Alamat lengkap',mw,2,'500 20px '+BF);al.forEach(function(l,i){txt(c,l,x0,426+i*26,'500 20px '+BF,d.alamat?'#FFFFFF':'rgba(255,255,255,.4)')});
lbl(c,'WILAYAH',x0,486);txt(c,d.wilayah||'-',x0,514,fitF(c,d.wilayah||'-',290,BF,'600',21,14),'#FFFFFF');
lbl(c,'PEKERJAAN',x0+310,486);txt(c,d.kerja||'-',x0+310,514,fitF(c,d.kerja||'-',mw-310,BF,'600',21,14),'#FFFFFF');
CFG.pejabat.forEach(function(p,i){var xc=i?800:470;txt(c,p.j,xc,544,'500 14px '+BF,'rgba(255,255,255,.75)',0,'center');var sg=S.imgs.ttd[i];if(sg){var k=Math.min(170/sg.width,48/sg.height),sw=sg.width*k,sh=sg.height*k;c.drawImage(sg,xc-sw/2,594-sh,sw,sh)}c.fillStyle='rgba(255,255,255,.45)';c.fillRect(xc-130,596,260,1.5);txt(c,p.n,xc,618,fitF(c,p.n,290,HF,'700',17,11),'#FFFFFF',0,'center')});
if(d.status!=='verified'){c.save();c.translate(W/2,H/2);c.rotate(-Math.PI/9);c.textAlign='center';c.font='800 64px '+HF;c.fillStyle='rgba(255,201,74,.20)';c.fillText('BELUM TERVERIFIKASI',0,0);c.font='700 22px '+BF;c.fillStyle='rgba(255,201,74,.30)';c.fillText('Kartu belum sah sebagai bukti keanggotaan',0,40);c.restore()}
txt(c,'Tradisi, Harmoni, Masa Depan',44,580,'italic 600 15px '+HF,'#FFC94A');
txt(c,'Terbit '+d.terbit+'  \u00b7  Berlaku selamanya',44,606,'500 12px '+BF,'rgba(255,255,255,.72)');
bar(c,H-8,8)}
function qr(c,text,x,y,size){var q=qrcode(0,'M');q.addData(text);q.make();var n=q.getModuleCount(),k=Math.floor(size/n),ox=x+Math.floor((size-k*n)/2),oy=y+Math.floor((size-k*n)/2);c.fillStyle='#0A2118';for(var r=0;r<n;r++)for(var s=0;s<n;s++)if(q.isDark(r,s))c.fillRect(ox+s*k,oy+r*k,k,k)}
function back(c,d){
c.fillStyle='#FAF9F5';c.fillRect(0,0,W,H);dots(c,'rgba(30,77,58,.08)',26);
var g=c.createLinearGradient(0,0,W,0);g.addColorStop(0,'#0F3B2C');g.addColorStop(1,'#1E4D3A');c.fillStyle=g;c.fillRect(0,0,W,104);glow(c,W-60,20,300,'rgba(43,217,160,.25)');bar(c,100,5);
var lw=logo(c,S.imgs.lw,40,14,74),tx=40+lw+22;
txt(c,'KARTU ANGGOTA',tx,44,'700 20px '+HF,'#FFC94A',3);txt(c,'MWCNU PONDOK AREN',tx,84,'700 34px '+HF,'#FFFFFF',.5);
c.save();c.shadowColor='rgba(8,32,26,.28)';c.shadowBlur=22;c.shadowOffsetY=8;c.fillStyle='#FFFFFF';rr(c,44,134,316,316,26);c.fill();c.restore();c.strokeStyle='#E3E7E1';c.lineWidth=2;rr(c,44,134,316,316,26);c.stroke();
if(d.status!=='verified'){c.save();c.translate(W/2,H/2);c.rotate(-Math.PI/9);c.textAlign='center';c.font='800 58px '+HF;c.fillStyle='rgba(15,59,44,.16)';c.fillText('BELUM TERVERIFIKASI',0,0);c.restore()}
if(d.nia){qr(c,CFG.domain+'/v/'+d.nia,66,156,272);txt(c,'PINDAI UNTUK VERIFIKASI & ABSENSI',202,484,'700 14px '+BF,'#1E4D3A',1,'center');txt(c,d.nia,202,512,fitF(c,d.nia,316,HF,'700',22,14),'#17352A',.5,'center')}
else{txt(c,'QR DITERBITKAN',202,300,'700 20px '+HF,'#8A6400',1,'center');txt(c,'SETELAH VERIFIKASI',202,330,'700 20px '+HF,'#8A6400',1,'center');txt(c,'Nomor induk belum diterbitkan pengurus.',202,484,'600 14px '+BF,'#8A6400',0,'center')}
txt(c,CFG.web,202,538,'500 14px '+BF,'#5B6F65',0,'center');
var x0=410,mw=W-44-x0,ink='#17352A',mut='#4A5F55';
lbl(c,'FUNGSI KARTU',x0,152,'#1E4D3A');
['Verifikasi keanggotaan','Absensi kegiatan dan pengajian','Akses layanan jam\u2019iyyah'].forEach(function(t,i){var y=190+i*38;c.fillStyle='#E4761B';c.beginPath();c.arc(x0+11,y-7,11,0,6.2832);c.fill();c.strokeStyle='#FFFFFF';c.lineWidth=3;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x0+5.5,y-7);c.lineTo(x0+9.5,y-3);c.lineTo(x0+17,y-12);c.stroke();txt(c,t,x0+34,y,'700 20px '+BF,ink)});
c.fillStyle='rgba(30,77,58,.18)';c.fillRect(x0,312,mw,1.5);
lbl(c,'KETENTUAN',x0,344,'#1E4D3A');var y=372;
['Kartu ini milik MWCNU Pondok Aren dan hanya berlaku bagi pemegang yang tercantum.','Berlaku setelah diverifikasi pengurus.','Jika menemukan kartu ini, mohon hubungi sekretariat.'].forEach(function(t){var L=wrap(c,t,mw-20,3,'500 16px '+BF);c.fillStyle='#E4761B';c.beginPath();c.arc(x0+5,y-5,3.5,0,6.2832);c.fill();L.forEach(function(l){txt(c,l,x0+20,y,'500 16px '+BF,mut);y+=22});y+=6});
c.fillStyle='rgba(30,77,58,.18)';c.fillRect(x0,484,mw,1.5);
lbl(c,'SEKRETARIAT',x0,514,'#1E4D3A');wrap(c,CFG.alamat,mw,2,'500 15px '+BF).forEach(function(l,i){txt(c,l,x0,540+i*21,'500 15px '+BF,mut)});
txt(c,CFG.kontak,x0,596,'600 15px '+BF,ink);bar(c,H-8,8)}
function ink(im){if(!im)return null;var cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;var x=cv.getContext('2d');x.drawImage(im,0,0);try{var d=x.getImageData(0,0,cv.width,cv.height),p=d.data;for(var i=0;i<p.length;i+=4){var l=(0.299*p[i]+0.587*p[i+1]+0.114*p[i+2])/255;p[i+3]=Math.round(p[i+3]*(1-l));p[i]=p[i+1]=p[i+2]=255}x.putImageData(d,0,0)}catch(e){}return cv}
function li(src){return new Promise(function(r){if(!src)return r(null);var i=new Image();if(/^https?:/i.test(src))i.crossOrigin='anonymous';i.onload=function(){r(i)};i.onerror=function(){r(null)};i.src=src})}
async function ensure(){if(S.imgs)return;try{if(document.fonts&&document.fonts.load)await Promise.all([document.fonts.load('700 30px "Plus Jakarta Sans"'),document.fonts.load('500 20px "Inter"'),document.fonts.load('700 20px "Inter"'),document.fonts.load('italic 600 17px "Plus Jakarta Sans"')])}catch(e){}
/* Guard: CMS kartu.pejabat bisa berisi kurang dari 2 pejabat — jangan sampai
   CFG.pejabat[1] melempar TypeError dan kartu tampil kosong. */
var p0=CFG.pejabat[0]||{},p1=CFG.pejabat[1]||p0;S.imgs={lw:await li(LW),ttd:[ink(await li(p0.ttd)),ink(await li(p1.ttd))]}}
var tm=null;
async function draw(){await ensure();var d=info();front($('k-front').getContext('2d'),d);back($('k-back').getContext('2d'),d);var st=$('kProfState');if(st&&d.nia)st.textContent='Nomor induk '+d.nia+' · '+(d.status==='verified'?'terverifikasi':d.status==='rejected'?'ditolak':'menunggu verifikasi');$('k-nia-p').textContent=d.nia?('Nomor induk Anda: '+d.nia+(d.status==='verified'?' (terverifikasi)':' (menunggu verifikasi)')):'Nomor induk belum diterbitkan. Simpan data, lalu tunggu verifikasi pengurus ranting/sekretariat.';var lk=$('k-lock');if(lk)lk.hidden=d.status==='verified';}
function sched(){clearTimeout(tm);tm=setTimeout(draw,140)}
function msg(t,bad){var m=$('k-msg');m.textContent=t;m.style.color=bad?'#D9534F':''}
$('kartu-app').addEventListener('input',sched);$('kartu-app').addEventListener('change',sched);function tg(){var p=lvl();$('k-rt-w').hidden=p!=='PRNU';$('k-wil').hidden=p!=='MWCNU'}$('kartu-app').addEventListener('change',tg);tg();
$('k-foto').addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var m=1400,sc=Math.min(1,m/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*sc);cv.height=Math.round(im.height*sc);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);S.photo=cv;$('k-zoom').value=1;$('k-px').value=.5;$('k-py').value=.35;$('k-crop').hidden=false;$('k-foto-t').textContent='Foto dipilih: '+f.name;document.querySelector('.kt-drop').classList.remove('err');draw()};im.onerror=function(){msg('Foto tidak dapat dibaca. Coba foto lain.',1)};im.src=fr.result};fr.readAsDataURL(f)});
function valid(){var need=[['k-nama','nama lengkap'],['k-jk','jenis kelamin'],['k-wadah','wadah khidmat'],['k-tmp','tempat lahir'],['k-tgl','tanggal lahir'],['k-alamat','alamat'],['k-tingkat','asal pengurus / anggota']],bad=null;if(v('k-tingkat')=='PRNU')need.push(['k-rt','kelurahan / ranting']);need.push(['k-hp','nomor HP']);
[].forEach.call(document.querySelectorAll('.kt-f .err'),function(e){e.classList.remove('err')});
need.forEach(function(n){var e=$(n[0]);if(!e.value.trim()){e.classList.add('err');if(!bad)bad=[e,n[1]]}});
if(!S.photo){document.querySelector('.kt-drop').classList.add('err');if(!bad)bad=[$('k-foto'),'foto']}
if(!bad&&!$('k-ok').checked){bad=[$('k-ok'),'persetujuan data']}
if(bad){msg('Mohon lengkapi: '+bad[1]+'.',1);try{(bad[0].closest('.fld')||bad[0]).scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}return false}msg('');return true}
function blob(cv,type,q){return new Promise(function(r){cv.toBlob(r,type,q)})}
async function bytes(cv){var b=await blob(cv,'image/jpeg',.95);return new Uint8Array(await b.arrayBuffer())}
function pdf(pages,pw,ph){var enc=new TextEncoder(),parts=[],off=0,xr=[],K=72/25.4;
function put(x){var b=typeof x==='string'?enc.encode(x):x;parts.push(b);off+=b.length}
function obj(n,body){xr[n]=off;put(n+' 0 obj\n'+body+'\nendobj\n')}
function so(n,dict,b){xr[n]=off;put(n+' 0 obj\n<< '+dict+' /Length '+b.length+' >>\nstream\n');put(b);put('\nendstream\nendobj\n')}
var n=4,pg=pages.map(function(p){var o={p:n++,c:n++,im:p.imgs.map(function(){return n++})};return o}),f=function(x){return x.toFixed(3)};
put('%PDF-1.4\n');put(new Uint8Array([37,226,227,207,211,10]));
obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids ['+pg.map(function(o){return o.p+' 0 R'}).join(' ')+'] /Count '+pg.length+' >>');obj(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
pages.forEach(function(p,i){var o=pg[i],cs='';
p.imgs.forEach(function(m,j){cs+='q '+f(m.mw*K)+' 0 0 '+f(m.mh*K)+' '+f(m.x*K)+' '+f((ph-m.y-m.mh)*K)+' cm /Im'+j+' Do Q\n'});
(p.lines||[]).forEach(function(l){cs+='0.25 w 0.2 G '+f(l[0]*K)+' '+f((ph-l[1])*K)+' m '+f(l[2]*K)+' '+f((ph-l[3])*K)+' l S\n'});
(p.texts||[]).forEach(function(t){cs+='BT /F1 '+t.s+' Tf '+(t.g||0.25)+' g '+f(t.x*K)+' '+f((ph-t.y)*K)+' Td ('+String(t.t).replace(/[\\()]/g,'\\$&')+') Tj ET\n'});
obj(o.p,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+f(pw*K)+' '+f(ph*K)+'] /Resources << /Font << /F1 3 0 R >> /XObject << '+o.im.map(function(x,j){return'/Im'+j+' '+x+' 0 R'}).join(' ')+' >> >> /Contents '+o.c+' 0 R >>');
so(o.c,'',enc.encode(cs));
p.imgs.forEach(function(m,j){so(o.im[j],'/Type /XObject /Subtype /Image /Width '+m.w+' /Height '+m.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode',m.b)})});
var xo=off;put('xref\n0 '+n+'\n0000000000 65535 f \n');for(var i=1;i<n;i++)put(('0000000000'+xr[i]).slice(-10)+' 00000 n \n');put('trailer\n<< /Size '+n+' /Root 1 0 R >>\nstartxref\n'+xo+'\n%%EOF\n');
return new Blob(parts,{type:'application/pdf'})}
function slug(){return(v('k-nama').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'anggota')}
function save(name,b){return new Promise(function(res,rej){var fb=function(){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(a.href)},2500);res('saved')};
if(window.claude&&claude.use){claude.use('downloads').then(function(d){if(!d)return fb();d.save({filename:name,data:b}).then(function(){res('saved')},function(e){if(e&&e.code==='declined')res('declined');else fb()})},fb)}else fb()})}
/* Data kartu yang boleh dikirim klien. NIA/status sengaja TIDAK ada di sini. */
function kartuData(){var d=info();return{nama:d.nama,hp:d.hp,wadah:d.wadah,tingkat:lvl(),ranting:d.rt||'',alamat:d.alamat,tempat_lahir:d.tmp,tanggal_lahir:v('k-tgl'),jk:d.jk,pekerjaan:d.kerja||''}}
async function simpanKartu(){try{var row=await profSave(kartuData());if(!row)throw new Error('profil belum tersimpan di server');var p=profGet()||{};p.nia=row.nia||p.nia||'';p.status=row.status||p.status||'pending';try{localStorage.setItem('mwc_profile_'+profKey(),JSON.stringify(p))}catch(e){}await draw();return true}catch(e){var m=String(e&&e.message||e);msg('Data belum tersimpan: '+m+(/sesi|koneksi|jaringan|fetch/i.test(m)?'. Periksa koneksi lalu coba lagi.':'.'),1);return false}}
async function job(label,fn){if(!sesGet()||!sesGet().user){authMsg('Masuk dulu untuk membuat kartu.',1);toggleAuth();return}var st=(profGet()||{}).status;if(st!=='verified'){msg('Kartu anggota baru dapat diunduh setelah data Anda diverifikasi pengurus ranting atau sekretariat. Gunakan tombol WhatsApp untuk mengajukan verifikasi.',1);return}if(!valid())return;msg('Menyimpan data\u2026');if(!await simpanKartu())return;msg('Menyiapkan '+label+'\u2026');try{await draw();var r=await fn();msg(r==='declined'?'Penyimpanan dibatalkan.':label+' siap. Periksa folder unduhan Anda.')}catch(e){msg('Gagal menyiapkan '+label+'. Coba lagi.',1)}}
$('k-pdf').addEventListener('click',function(){job('PDF kartu',async function(){var a=await bytes($('k-front')),b=await bytes($('k-back')),mk=function(x){return{imgs:[{b:x,w:W,h:H,x:0,y:0,mw:85.6,mh:54}]}};return save('kartu-anggota-'+slug()+'.pdf',pdf([mk(a),mk(b)],85.6,54))})});
$('k-a4').addEventListener('click',function(){job('PDF A4',async function(){var a=await bytes($('k-front')),b=await bytes($('k-back')),cw=85.6,ch=54,x1=13.4,x2=x1+cw+12,y=48,L=[];[x1,x2].forEach(function(x){[[x,x+cw],[x,x+cw]].forEach(function(_,k){});var xs=[x,x+cw],ys=[y,y+ch];xs.forEach(function(px,i){ys.forEach(function(py,j){var sx=i?1:-1,sy=j?1:-1;L.push([px+sx*2,py,px+sx*6,py]);L.push([px,py+sy*2,px,py+sy*6])})})});
var pgs=[{imgs:[{b:a,w:W,h:H,x:x1,y:y,mw:cw,mh:ch},{b:b,w:W,h:H,x:x2,y:y,mw:cw,mh:ch}],lines:L,texts:[{t:'Kartu Anggota MWCNU Pondok Aren',x:13.4,y:22,s:14,g:0.1},{t:'Cetak pada ukuran 100% (jangan pilih Fit to Page), lalu potong mengikuti tanda sudut.',x:13.4,y:30,s:8},{t:'DEPAN',x:x1+4,y:y-7,s:7},{t:'BELAKANG',x:x2+4,y:y-7,s:7},{t:CFG.web,x:13.4,y:285,s:7}]}];return save('kartu-anggota-'+slug()+'-A4.pdf',pdf(pgs,210,297))})});
$('k-png').addEventListener('click',function(){job('gambar kartu',async function(){var cv=document.createElement('canvas');cv.width=W;cv.height=H*2+40;var c=cv.getContext('2d');c.fillStyle='#FFFFFF';c.fillRect(0,0,cv.width,cv.height);c.drawImage($('k-front'),0,0);c.drawImage($('k-back'),0,H+40);return save('kartu-anggota-'+slug()+'.png',await blob(cv,'image/png'))})});
$('k-wa').addEventListener('click',async function(){if(!sesGet()||!sesGet().user){authMsg('Masuk dulu untuk membuat kartu.',1);toggleAuth();return}if(!valid())return;msg('Menyimpan data\u2026');if(!await simpanKartu())return;var d=info(),t='Assalamualaikum, saya mendaftar sebagai anggota MWCNU Pondok Aren.\n\nNama: '+d.nama+'\nJenis kelamin: '+d.jk+'\nTempat, tgl lahir: '+d.tmp+', '+d.tgl+'\nAlamat: '+d.alamat+'\nTingkat/wilayah: '+d.wilayah+'\nPekerjaan: '+(d.kerja||'-')+'\nWadah khidmah: '+d.wadah+'\nNo. HP: '+d.hp+'\nNomor induk: '+(d.nia||'(belum diterbitkan)')+'\n\nMohon verifikasi keanggotaan saya. Saya akan melampirkan foto pada chat ini bila diperlukan. Terima kasih.';msg('Membuka WhatsApp\u2026');window.open('https://wa.me/'+CFG.wa+'?text='+encodeURIComponent(t),'_blank','noopener')});
window.addEventListener('load',function(){toggleAuth();profFetch().then(function(){toggleAuth()});draw()});if(document.readyState==='complete'){toggleAuth();profFetch().then(function(){toggleAuth()});draw()}

/* ===== HALAMAN PROFIL (pemilik akun: Jama'ah & Pengurus) =====
   Data ditampilkan dari server (profFetch) dengan cache localStorage.
   Edit data diri hanya saat belum terbit NIA & belum diverifikasi —
   kebijakan yang sama ditegakkan RLS di supabase-profiles.sql. */
(function(){
var PR=document.getElementById('profil');if(!PR)return;
var PRT=window.MWC_RT;
var PROLES={super_admin:'Admin MWC',pengurus:'Pengurus ranting',jurnalis:'Jurnalis',ustadz:'Ustadz'};
var PBL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
/* esc lokal: modul ini berada di IIFE modul KTA — esc milik IIFE utama tidak terlihat dari sini. */
var esc=window.mwcEsc;
function pmsg(t,bad){var m=$('pr-msg');if(m){m.textContent=t;m.style.color=bad?'#D9534F':''}}
function pwmsg(t,bad){var m=$('pr-pw-msg');if(m){m.textContent=t;m.style.color=bad?'#D9534F':''}}
function ptgl(iso){if(!iso)return '—';var a=String(iso).slice(0,10).split('-');return a.length==3&&a[0]?(+a[2])+' '+PBL[(+a[1])-1]+' '+a[0]:String(iso)}
/* Sesi server saja: sesi lokal/offline tidak bisa memanggil API. */
function login(){var s=sesGet();return s&&s.user&&!/^local-/.test(String(s.user.id||''))?s:null}
/* Perbarui access token lewat refresh_token saat 401, lalu ulang sekali. */
function prefresh(){var s=sesGet();if(!s||!s.refresh_token)return Promise.reject(new Error('Sesi berakhir. Masuk kembali.'))
return sbAuth('token?grant_type=refresh_token',{refresh_token:s.refresh_token}).then(function(j){
  if(!j||!j.access_token)throw new Error('Sesi berakhir. Masuk kembali.')
  var u=s.user;sesSet({access_token:j.access_token,refresh_token:j.refresh_token||s.refresh_token,user:{id:(j.user&&j.user.id)||u.id,email:(j.user&&j.user.email)||u.email}});return j})}
function rfetch(url,opt,retry){var s=sesGet(),C=authCfg();opt=opt||{}
opt.headers=Object.assign({'apikey':C.key,'Content-Type':'application/json',Authorization:'Bearer '+((s&&s.access_token)||'')},opt.headers||{})
return fetch(url,opt).then(function(r){if(r.status===401&&!retry)return prefresh().then(function(){return rfetch(url,opt,1)});return r})}
function stRow(){var p=profGet()||{},st=p.status||'pending';return{p:p,hasNia:!!p.nia,st:st,ver:st==='verified',rej:st==='rejected'}}
function editable(){var x=stRow();return !x.hasNia&&x.st==='pending'}
function drawQR(){var cv=$('pr-qr-cv'),x=stRow();if(!cv||!x.hasNia||!x.ver){$('pr-qr').hidden=true;return}
try{var url=location.origin+'/v/'+encodeURIComponent(x.p.nia),q=qrcode(0,'M');q.addData(url);q.make();
var n=q.getModuleCount(),size=cv.width,k=Math.max(1,Math.floor(size/n)),ox=Math.floor((size-k*n)/2),oy=Math.floor((size-k*n)/2),c=cv.getContext('2d');
c.fillStyle='#FFFFFF';c.fillRect(0,0,size,size);c.fillStyle='#0A2118';
for(var r=0;r<n;r++)for(var s2=0;s2<n;s2++)if(q.isDark(r,s2))c.fillRect(ox+s2*k,oy+r*k,k,k);$('pr-qr').hidden=false}catch(e){$('pr-qr').hidden=true}}
function fillForm(p){function set(id,v){var e=$(id);if(e)e.value=v||''}
set('pr-nama',p.nama);set('pr-hp',p.hp);set('pr-jk',p.jk);set('pr-tmp',p.tempat_lahir);set('pr-tgl',p.tanggal_lahir||'');set('pr-alamat',p.alamat);set('pr-wadah',p.wadah);set('pr-kerja',p.pekerjaan)
var t=$('pr-tingkat');if(t){t.value=p.tingkat||'';t.dispatchEvent(new Event('change',{bubbles:true}))}
if(p.ranting){var rt=$('pr-rt');if(rt&&!rt.options.length)fillRT();if(rt)rt.value=p.ranting}}
function fillRT(){var rt=$('pr-rt');if(!rt||rt.options.length)return;var o=document.createElement('option');o.value='';o.textContent='Pilih kelurahan';rt.appendChild(o);PRT.forEach(function(n){var q=document.createElement('option');q.value=n;q.textContent=n;rt.appendChild(q)})}
function renderRO(p){var rows=[['Nama',p.nama],['Email',p.email],['Nomor HP',p.hp],['Jenis kelamin',p.jk],['Tempat, tanggal lahir',p.tempat_lahir?p.tempat_lahir+', '+ptgl(p.tanggal_lahir):''],['Alamat',p.alamat],['Asal wilayah',(p.tingkat||'')==='PRNU'?('PRNU '+(p.ranting||'')):((p.tingkat||'')==='MWCNU'?'MWCNU Kec. Pondok Aren':'')],['Wadah khidmah',p.wadah],['Pekerjaan',p.pekerjaan]]
$('pr-ro-dl').innerHTML=rows.filter(function(r){return r[1]}).map(function(r){return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('')}
function render(){var s=login();var wasHidden=$('pr-main').hidden;$('pr-anon').hidden=!!s;$('pr-main').hidden=!s
var nl=$('nav-pr');if(nl)nl.hidden=!s;if(!s)return
/* Tab kembali ke Ringkasan hanya saat halaman baru dibuka (form di tab lain tidak ter-reset saat render ulang). */
if(wasHidden)prTab('pr-ring')
var x=stRow(),p=x.p,email=s.user.email||p.email||''
$('pr-name').textContent=p.nama||email.split('@')[0];$('pr-email').textContent=email
$('pr-ava').textContent=((p.nama||email||'?').trim()[0]||'?').toUpperCase()
$('pr-since').textContent=p.created_at?('Anggota sejak '+ptgl(p.created_at)):''
$('pr-nia').textContent=x.hasNia?p.nia:'Belum diterbitkan'
var ch=$('pr-status');ch.textContent=x.hasNia?(x.ver?'Terverifikasi':x.rej?'Ditolak':'Menunggu verifikasi'):'Menunggu penerbitan'
ch.className='pr-chip '+(x.hasNia&&x.ver?'ok':x.hasNia&&x.rej?'bad':'wait')
$('pr-terbit').textContent=p.issued_at?ptgl(p.issued_at):'—'
$('pr-nia-note').textContent=x.hasNia?(x.ver?'Kartu Anda sah sebagai bukti keanggotaan aktif.':x.rej?'Pendaftaran ditolak. Hubungi sekretariat untuk informasi lebih lanjut.':'Kartu menunggu verifikasi pengurus ranting/sekretariat.'):'Nomor induk diterbitkan otomatis setelah pengurus memverifikasi data Anda.'
$('pr-copy-qr').hidden=!(x.hasNia&&x.ver);$('pr-copy-qr2').hidden=!(x.hasNia&&x.ver);drawQR()
var ed=editable();$('pr-form').hidden=!ed;$('pr-ro').hidden=ed;if(ed)fillForm(p);else renderRO(p)
loadStaff();loadConf()}
/* Status konfirmasi email: HANYA dari data autentikasi server (email_confirmed_at).
   Sesi lama yang belum menyimpan field ini diambil sekali lewat /auth/v1/user. */
function drawConf(){var s=login();if(!s)return;var ok=!!s.user.email_confirmed_at
var el=$('pr-confirm');if(el)el.hidden=!ok
$('pr-em-mail').textContent=s.user.email||'—'
$('pr-emstat').textContent=ok?'Terkonfirmasi':'Belum terkonfirmasi'}
function loadConf(){var s=login();if(!s||s.user.email_confirmed_at){drawConf();return}
var C=authCfg();if(!C.url)return
rfetch(C.url+'/auth/v1/user').then(function(r){return r.ok?r.json():null}).then(function(u){
if(u&&u.email_confirmed_at){s.user.email_confirmed_at=u.email_confirmed_at;sesSet(s);drawConf()}}).catch(function(){})}
/* Navigasi tab: tanpa reload; state form di tiap pane dipertahankan. */
function prTab(id){var ts=$('pr-tabs');if(!ts)return;[].forEach.call(ts.querySelectorAll('button'),function(b){var on=b.getAttribute('data-tab')===id;b.classList[on?'add':'remove']('on');b.setAttribute('aria-selected',on?'true':'false')});
[].forEach.call(document.querySelectorAll('.pr-pane'),function(pn){pn.classList.toggle('on',pn.id===id)})}
var tsEl=$('pr-tabs');if(tsEl)tsEl.addEventListener('click',function(e){var b=e.target.closest('button[data-tab]');if(!b)return;prTab(b.getAttribute('data-tab'))})
function loadStaff(){var s=login(),el=$('pr-staff');if(!el)return;if(!s){el.hidden=true;return}
var C=authCfg();if(!C.url){el.hidden=true;return}
rfetch(C.url+'/rest/v1/staff?email=eq.'+encodeURIComponent(s.user.email||'')+'&select=email,role,nama,prnu')
.then(function(r){return r.ok?r.json():[]}).then(function(a){var row=a&&a[0]
if(!row){el.hidden=true;$('pr-role').textContent="Jama'ah";return}
el.hidden=false;$('pr-staff-role').textContent=PROLES[row.role]||row.role
$('pr-staff-prnu').textContent=row.role==='pengurus'?(PRT[(parseInt(row.prnu,10)||1)-1]||row.prnu||'-'):row.role==='super_admin'?'MWCNU Kecamatan Pondok Aren':'—'
$('pr-role').textContent=PROLES[row.role]||'Pengurus'}).catch(function(){el.hidden=true})}
/* Simpan data diri (hanya saat profil masih pending — server menegakkan juga). */
$('pr-form').addEventListener('submit',function(e){e.preventDefault()
if(!login()){authMsg('Masuk dulu untuk menyimpan perubahan.',1);location.hash='#daftar';return}
if(!editable()){pmsg('Data terkunci karena kartu sudah diterbitkan. Gunakan tombol "Minta perbaikan data".',1);return}
var g=function(id){return($(id).value||'').trim()},p=profGet()||{}
var b={nama:g('pr-nama'),hp:g('pr-hp'),jk:$('pr-jk').value||'',tempat_lahir:g('pr-tmp'),tanggal_lahir:$('pr-tgl').value||'',alamat:g('pr-alamat'),tingkat:$('pr-tingkat').value||'',ranting:$('pr-rt').value||'',wadah:g('pr-wadah'),pekerjaan:g('pr-kerja')}
if(!b.nama){pmsg('Nama lengkap wajib diisi.',1);return}
var hp=b.hp.replace(/\D/g,'')
if(!/^08\d{8,11}$/.test(hp)){pmsg('Nomor HP/WhatsApp tampak tidak valid (contoh: 0812xxxxxxx).',1);return}
if(b.tingkat==='PRNU'&&!b.ranting){pmsg('Pilih kelurahan / ranting Anda.',1);return}
if(!b.tanggal_lahir){pmsg('Tanggal lahir wajib diisi.',1);return}
pmsg('Menyimpan…')
profSave(b).then(function(){pmsg('Perubahan data tersimpan.');render()}).catch(function(err){
var m=String(err&&err.message||err||'')
if(/sesi berakhir/i.test(m)){pmsg('Sesi berakhir. Masuk kembali untuk menyimpan.',1);return}
pmsg('Data belum tersimpan: '+m+'.',1)})})
/* Ganti kata sandi (akun email+sandi). */
$('pr-pw').addEventListener('submit',function(e){e.preventDefault()
var pw=$('pr-pw1').value||'',pw2=$('pr-pw2').value||''
if(pw.length<6){pwmsg('Kata sandi minimal 6 karakter.',1);return}
if(pw!==pw2){pwmsg('Kedua kata sandi belum sama.',1);return}
pwmsg('Memperbarui…')
rfetch(authCfg().url+'/auth/v1/user',{method:'PUT',body:JSON.stringify({password:pw})})
.then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
.then(function(x){if(!x.ok)throw new Error((x.j&&(x.j.msg||x.j.message))||('gagal ('+(x.j&&x.j.code||'')+')'))
pwmsg('Kata sandi berhasil diperbarui.');$('pr-pw1').value='';$('pr-pw2').value=''})
.catch(function(err){pwmsg('Gagal memperbarui: '+(String(err&&err.message||err)||'periksa koneksi')+'.',1)})})
/* Kirim tautan reset (berlaku juga bila lupa sandi lama). */
$('pr-reset').addEventListener('click',function(){var s=login(),C=authCfg();if(!C.url){pwmsg('Layanan akun belum tersedia.',1);return}
pwmsg('Mengirim tautan reset…')
fetch(C.url+'/auth/v1/recover',{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify({email:(s&&s.user.email)||''})})
.then(function(){pwmsg('Jika email terdaftar, tautan reset sudah dikirim ke email Anda.')})
.catch(function(){pwmsg('Gagal mengirim. Periksa koneksi lalu coba lagi.',1)})})
$('pr-out').addEventListener('click',function(){var k=profKey();sesSet(null);try{if(k)localStorage.removeItem('mwc_profile_'+k)}catch(e){}toggleAuth();render();location.hash='#top'})
function copyQR(btn){var x=stRow();if(!x.hasNia)return
var url=location.origin+'/v/'+encodeURIComponent(x.p.nia)
function done(){if(!btn)return;var t=btn.textContent;btn.textContent='Tautan disalin ✓';setTimeout(function(){btn.textContent=t},2200)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,function(){window.prompt('Salin tautan ini:',url)})}else window.prompt('Salin tautan ini:',url)}
$('pr-copy-qr').addEventListener('click',function(){copyQR(this)})
var cqr2=$('pr-copy-qr2');if(cqr2)cqr2.addEventListener('click',function(){copyQR(this)})
function waText(aks){var x=stRow(),p=x.p,s=login()||{}
return 'Assalamualaikum, saya ingin '+aks+' data akun saya di MWCNU Pondok Aren.\n\nNama: '+(p.nama||'-')+'\nEmail: '+(s.user&&s.user.email||'-')+'\nNomor induk: '+(x.hasNia?p.nia:'(belum terbit)')+'\n\nMohon petunjuk langkah selanjutnya. Terima kasih.'}
$('pr-wa-fix').addEventListener('click',function(){window.open('https://wa.me/'+CFG.wa+'?text='+encodeURIComponent(waText('meminta perbaikan')),'_blank','noopener')})
$('pr-wa-del').addEventListener('click',function(){if(!confirm('Permintaan penghapusan akun diproses oleh sekretariat dengan verifikasi identitas. Lanjutkan ke WhatsApp?'))return
window.open('https://wa.me/'+CFG.wa+'?text='+encodeURIComponent(waText('meminta penghapusan')),'_blank','noopener')})
$('pr-tingkat').addEventListener('change',function(){var w=$('pr-rt-w');if(!w)return
if(this.value==='PRNU'){fillRT();w.hidden=false}else{w.hidden=true;$('pr-rt').value=''}})
$('pr-rt-w').addEventListener('change',function(){})
addEventListener('hashchange',function(){if((location.hash||'#top')=='#profil')render()})
if(document.readyState==='complete')profFetch().then(render);else window.addEventListener('load',function(){profFetch().then(render)})
})();
}catch(e){}})();
/* ===== KONSULTASI AGAMA ===== */
(function(){try{
var $=function(i){return document.getElementById(i)};if(!$('konsultasi'))return;
/* put/cleanHTML dari modul utama (window.MWCUI) — sebelumnya modul ini memakai
   put yang tidak ada di scope-nya, sehingga seluruh modul mati diam-diam. */
var put=(window.MWCUI&&window.MWCUI.put)||function(el,html){if(el)el.innerHTML=html};
var QA=window.MWC_QA||[];
/* Isi QA dengan data nyata, contoh: {k:'Ibadah',q:'Pertanyaan ...',a:'Jawaban ...'} */
var C=[['Ibadah','Shalat, puasa, zakat, haji'],['Akidah','Keyakinan dan keimanan'],['Akhlak & tasawuf','Adab dan pembinaan diri'],['Muamalah','Jual beli dan ekonomi syariah'],['Keluarga','Pernikahan dan rumah tangga'],['Waris & wasiat','Pembagian harta peninggalan'],['Amaliyah NU','Tahlil, maulid, ziarah, qunut'],['Lainnya','Pertanyaan di luar topik lain']];
var esc=window.mwcEsc;
put($('ka-cats'),C.map(function(c,i){return '<button type="button" class="mt-f" data-i="'+i+'"><b>'+esc(c[0])+'</b><small>'+esc(c[1])+'</small></button>'}).join(''));
[].forEach.call($('ka-cats').querySelectorAll('button'),function(b,i){b.setAttribute('data-i',i);b.setAttribute('aria-controls','ka-kat');b.setAttribute('aria-label','Pilih topik '+C[i][0])});
$('ka-kat').textContent='';$('ka-fk').textContent='';[['ka-kat','Pilih topik'],['ka-fk','Semua topik']].forEach(function(x){var o=document.createElement('option');o.value='';o.textContent=x[1];$(x[0]).appendChild(o);C.forEach(function(c){var q=document.createElement('option');q.textContent=c[0];$(x[0]).appendChild(q)})});
$('ka-cats').dataset.topicBound='1';$('ka-cats').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var cat=C[b.getAttribute('data-i')];if(!cat)return;var sel=$('ka-kat');sel.value=cat[0];sel.classList.remove('err');sel.dispatchEvent(new Event('change',{bubbles:true}));var form=$('ka-form'),qh=document.querySelector('header');if(qh)qh.classList.add('sc');form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});setTimeout(function(){form.scrollIntoView({behavior:'auto',block:'start'});$('ka-q').focus({preventScroll:true})},650)});
function draw(){var k=$('ka-fk').value,q=$('ka-q2').value.trim().toLowerCase(),L=QA.filter(function(x){return(!k||x.k==k)&&(!q||(x.q+' '+x.a).toLowerCase().indexOf(q)>-1)});
put($('ka-list'),L.length?L.map(function(x){return '<details class="qa"><summary>'+esc(x.q)+'</summary><div class="qa-b">'+esc(x.a)+'</div>'+(x.k?'<div class="qa-m"><span>'+esc(x.k)+'</span></div>':'')+'</details>'}).join(''):'<div class="mt-e"><span>'+(QA.length?'Tidak ada tanya jawab yang cocok dengan pencarian Anda.':'Tanya jawab pilihan akan ditampilkan di sini. Ajukan pertanyaan Anda melalui formulir di bawah.')+'</span><button type="button" class="loc-btn" id="ka-go">Ajukan pertanyaan</button></div>');
$('ka-n').textContent=QA.length?L.length+' tanya jawab':'';var g=$('ka-go');if(g)g.addEventListener('click',function(){$('ka-form').scrollIntoView({behavior:'smooth',block:'start'})})}
$('ka-fk').addEventListener('change',draw);$('ka-q2').addEventListener('input',draw);draw();
$('ka-q').addEventListener('input',function(){$('ka-cnt').textContent=this.value.length+' / 1200'});
$('ka-anon').addEventListener('change',function(){var n=$('ka-nama');n.disabled=this.checked;if(this.checked)n.value='';n.placeholder=this.checked?'Hamba Allah':''});
['ka-kat','ka-q','ka-hp'].forEach(function(i){$(i).addEventListener('input',function(){this.classList.remove('err')});$(i).addEventListener('change',function(){this.classList.remove('err')})});
$('ka-send').addEventListener('click',function(){var m=$('ka-msg'),bad=null;['ka-kat','ka-q','ka-hp'].forEach(function(i){var e=$(i),b=!e.value.trim();e.classList.toggle('err',b);if(b&&!bad)bad=e});
if(bad){m.textContent='Mohon lengkapi topik, pertanyaan, dan nomor HP.';bad.focus();return}
var an=$('ka-anon').checked,nm=an?'Hamba Allah':($('ka-nama').value.trim()||'-'),rt=$('ka-rt').value||'-';
var t='Assalamualaikum, saya ingin berkonsultasi / bertanya kepada MWCNU Pondok Aren.\n\nNama: '+nm+'\nRanting: '+rt+'\nTopik: '+$('ka-kat').value+'\nNo. HP: '+$('ka-hp').value.trim()+'\n\nPertanyaan:\n'+$('ka-q').value.trim()+'\n\nBoleh ditampilkan di Tanya Jawab (tanpa nama): '+($('ka-pub').checked?'Ya':'Tidak');
m.textContent='Membuka WhatsApp…';window.open('https://wa.me/6285161033689?text='+encodeURIComponent(t),'_blank','noopener')});
}catch(e){}})();
/* ===== MAJELIS TAKLIM ===== */
(function(){try{
var $=function(i){return document.getElementById(i)};if(!$('majelis'))return;
/* put/cleanHTML dari modul utama (window.MWCUI) — sama seperti modul Konsultasi. */
var put=(window.MWCUI&&window.MWCUI.put)||function(el,html){if(el)el.innerHTML=html};
var MT=window.MWC_MT||[];
/* Isi MT dengan data nyata, contoh: {nama:'Majelis Taklim ...',asuh:'Ust. ...',hari:'Kamis',jam:'19.30',tempat:'...',ranting:'Pondok Karya',hp:'628...'} */
var RT=window.MWC_RT;
var fr=$('mt-ranting');fr.textContent='';var all=document.createElement('option');all.value='';all.textContent='Semua ranting';fr.appendChild(all);RT.forEach(function(r){var o=document.createElement('option');o.textContent=r;fr.appendChild(o)});
var esc=window.mwcEsc;
function card(m){var jd=[m.hari,m.jam].filter(Boolean).join(' · '),hp=String(m.hp||'').replace(/\D/g,'');if(hp.charAt(0)=='0')hp='62'+hp.slice(1);if(!/^62\d{8,13}$/.test(hp))hp='';return '<div class="mt-c"><b>'+esc(m.nama)+'</b>'+(m.asuh?'<p>Pengasuh: '+esc(m.asuh)+'</p>':'')+(jd?'<p>'+esc(jd)+'</p>':'')+(m.tempat?'<p>'+esc(m.tempat)+'</p>':'')+(m.ranting?'<p>Ranting '+esc(m.ranting)+'</p>':'')+(hp?'<a class="loc-btn" href="https://wa.me/'+hp+'" target="_blank" rel="noopener">Hubungi</a>':'')+'</div>'}
function draw(){var r=fr.value,q=$('mt-q').value.trim().toLowerCase(),L=MT.filter(function(m){return(!r||m.ranting==r)&&(!q||(m.nama+' '+(m.asuh||'')+' '+(m.tempat||'')).toLowerCase().indexOf(q)>-1)});
put($('mt-list'),L.length?L.map(card).join(''):'<div class="mt-e"><span>'+(MT.length?'Tidak ada majelis yang cocok dengan pencarian Anda.':'Data majelis taklim sedang dihimpun. Pengasuh dan pengurus ranting dapat mendaftarkan majelisnya melalui formulir di bawah.')+'</span><button type="button" class="loc-btn" data-go="mt-daftar" aria-controls="mt-daftar" aria-expanded="false">Daftarkan majelis</button></div>');$('mt-n').textContent=MT.length?L.length+' majelis':''}
fr.addEventListener('change',draw);$('mt-q').addEventListener('input',draw);draw();
$('majelis').addEventListener('click',function(e){var b=e.target.closest('[data-go],[data-form-toggle],a[href="#mt-undang"],a[href="#mt-daftar"]');if(!b)return;var id=b.getAttribute('data-form-toggle')||b.getAttribute('data-go')||(b.getAttribute('href')||'').slice(1),t=$(id);if(!t)return;if(id==='mt-undang'||id==='mt-daftar'){e.preventDefault();var show=t.hidden;t.hidden=!show;[].forEach.call($('majelis').querySelectorAll('[data-go="'+id+'"],[data-form-toggle="'+id+'"],a[href="#'+id+'"]'),function(x){x.setAttribute('aria-expanded',show?'true':'false')});if(show)t.scrollIntoView({behavior:'smooth',block:'start'});return}t.scrollIntoView({behavior:'smooth',block:'start'})});
var BL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function tgl(v){var a=String(v).split('-');return a.length==3?parseInt(a[2],10)+' '+BL[parseInt(a[1],10)-1]+' '+a[0]:v}
function bind(id,build){var f=$(id),b=f.querySelector('.wa'),m=f.querySelector('.fm-msg');
f.addEventListener('input',function(e){e.target.classList.remove('err')});
b.addEventListener('click',function(){var bad=null;[].forEach.call(f.querySelectorAll('[required]'),function(el){var v=!el.value.trim();el.classList.toggle('err',v);if(v&&!bad)bad=el});if(bad){m.textContent='Mohon lengkapi kolom yang bertanda *.';bad.focus();return}
var g=function(n){var e=f.querySelector('[name='+n+']');return e&&e.value.trim()?e.value.trim():'-'};m.textContent='Membuka WhatsApp…';window.open('https://wa.me/6285161033689?text='+encodeURIComponent(build(g)),'_blank','noopener')})}
bind('mt-undang',function(g){return 'Assalamualaikum, saya ingin mengundang penceramah / ustadz melalui MWCNU Pondok Aren.\n\nNama pengundang: '+g('nama')+'\nNo. HP: '+g('hp')+'\nRanting: '+g('ranting')+'\nJenis acara: '+g('acara')+'\nTanggal rencana: '+tgl(g('tgl'))+'\nTempat: '+g('tempat')+'\nTema: '+g('tema')+'\nCatatan: '+g('cat')});
bind('mt-daftar',function(g){return 'Assalamualaikum, saya ingin mendaftarkan majelis taklim ke MWCNU Pondok Aren.\n\nNama majelis: '+g('nama')+'\nPengasuh / ustadz: '+g('asuh')+'\nRanting: '+g('ranting')+'\nAlamat / tempat: '+g('tempat')+'\nJadwal: '+g('hari')+(g('jam')!='-'?', pukul '+g('jam'):'')+'\nPerkiraan jamaah: '+g('jml')+'\nKontak: '+g('hp')+'\nCatatan: '+g('cat')});
}catch(e){}})();
/* ===== ZAKAT ===== */
(function(){try{
var $=function(i){return document.getElementById(i)};
if(!$('zk-calc'))return;
/* Selalu lewat cleanHTML dari modul utama agar konten tersanitasi,
   sama seperti put() di bagian lain situs. */
function put(el,html){if(el)el.innerHTML=(window.MWCUI&&window.MWCUI.cleanHTML?window.MWCUI.cleanHTML(html):html)}
function imgURL(s){s=String(s||'').trim();if(/^\/(?!\/)[^\\"'<>]*$/.test(s))return s;try{var u=new URL(s,location.href);if(u.protocol==='https:'&&u.origin!==location.origin)return u.href}catch(e){}return ''}
var PAY=window.MWC_PAY||{banks:[],qris:''};
var esc=window.mwcEsc;
function dig(v){return parseInt(String(v).replace(/\D/g,''),10)||0}
function dot(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function rp(n){return 'Rp '+dot(n)}
function dec(v){return parseFloat(String(v).replace(',','.'))||0}
function go(id){var e=$(id);if(e)e.scrollIntoView({behavior:'smooth',block:'start'})}
[].forEach.call(document.querySelectorAll('#zis input.money'),function(e){e.addEventListener('input',function(){var d=dig(e.value);e.value=d?dot(d):''})});
[].forEach.call(document.querySelectorAll('#zis [data-go]'),function(b){b.addEventListener('click',function(){go(b.getAttribute('data-go'))})});
function seg(id,cb){var s=$(id);s.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;[].forEach.call(s.children,function(x){x.classList.toggle('on',x===b)});cb(b)})}
var cur='pg',Z=0,ZK='Zakat Penghasilan',V=function(i){return $(i).value};
function calc(){var h=dig(V('zk-emas')),nis=85*h,R=[],tot=0,nb=nis,wj=false,st='',zk=0,suf='';
var P=function(l,v,c){R.push('<tr class="'+(c||'')+'"><td>'+esc(l)+'</td><td>'+esc(v)+'</td></tr>')};
function body(rows,minus,haulId){rows.forEach(function(r){P(r[0],r[2]?'− '+rp(r[1]):rp(r[1]))});}
if(cur=='pg'){var g=dig(V('pg-gaji')),t=dig(V('pg-tambah')),c=dig(V('pg-cicil'));tot=g+t-c;nb=nis/12;P('Penghasilan per bulan',rp(g));P('Penghasilan tambahan per bulan',rp(t));P('Pengurang: cicilan utang',c?'− '+rp(c):rp(0));P('Penghasilan bersih per bulan',rp(Math.max(tot,0)),'b');P('Nisab per bulan (85 g emas ÷ 12)',rp(nb));wj=tot>0&&tot>=nb;st=tot<=0?'Isi penghasilan Anda':wj?'Wajib zakat':'Belum mencapai nisab';zk=wj?tot*.025:0;ZK='Zakat Penghasilan';suf=' / bulan'}
else if(cur=='mal'||cur=='dg'){var hl=$(cur=='mal'?'mal-haul':'dg-haul').checked;
if(cur=='mal'){var a=dig(V('mal-tab')),gr=dec(V('mal-emas')),e=gr*h,i=dig(V('mal-inv')),p=dig(V('mal-piut')),u=dig(V('mal-utang'));tot=a+e+i+p-u;P('Tabungan / deposito',rp(a));P('Emas simpanan ('+gr+' g)',rp(e));P('Investasi & surat berharga',rp(i));P('Piutang lancar',rp(p));P('Pengurang: utang jatuh tempo',u?'− '+rp(u):rp(0));P('Total harta bersih',rp(Math.max(tot,0)),'b');ZK='Zakat Maal'}
else{var m=dig(V('dg-modal')),k=dig(V('dg-untung')),q=dig(V('dg-piut')),w=dig(V('dg-utang'));tot=m+k+q-w;P('Modal usaha yang berputar',rp(m));P('Keuntungan usaha',rp(k));P('Piutang lancar',rp(q));P('Pengurang: utang jatuh tempo',w?'− '+rp(w):rp(0));P('Total harta dagang bersih',rp(Math.max(tot,0)),'b');ZK='Zakat Perdagangan'}
P('Nisab (85 g emas)',rp(nis));P('Haul 1 tahun',hl?'Sudah':'Belum');wj=tot>0&&tot>=nis&&hl;st=tot<=0?'Isi data Anda':tot<nis?'Belum mencapai nisab':!hl?'Mencapai nisab, menunggu haul':'Wajib zakat';zk=wj?tot*.025:0;suf=''}
else{var j=Math.max(parseInt(V('ft-jiwa'))||0,0),kg=j*2.5,hb=dig(V('ft-harga'));zk=kg*hb;P('Jumlah jiwa',j);P('Beras per jiwa','2,5 kg');P('Total beras',String(kg).replace('.',',')+' kg','b');P('Harga beras per kg',rp(hb));st=!j?'Isi jumlah jiwa':hb?'Siap ditunaikan':'Isi harga beras per kg';ZK='Zakat Fitrah'}
P('Status',st,'st');P('Zakat yang harus dibayar',rp(zk)+suf,'res');if(cur=='pg'&&wj)P('Setara per tahun',rp(zk*12));
put($('zk-tbl'),R.join(''));Z=Math.round(zk);$('zk-pay-btn').disabled=Z<=0}
seg('zk-seg',function(b){cur=b.getAttribute('data-k');[].forEach.call(document.querySelectorAll('.zk-pn'),function(p){p.hidden=p.getAttribute('data-k')!==cur});calc()});
$('zk-calc').addEventListener('input',calc);$('zk-calc').addEventListener('change',calc);calc();
var J='Zakat';
seg('dn-seg',function(b){J=b.getAttribute('data-j');$('dn-zj').hidden=J!='Zakat';$('dn-pr').hidden=J=='Zakat'||J=='Kas'});
[].forEach.call(document.querySelectorAll('[data-payment-mode]'),function(a){a.addEventListener('click',function(e){var mode=a.getAttribute('data-payment-mode');if(a.classList.contains('h-btn-kas')){e.preventDefault();var dialog=$('kas-dialog'),body=$('kas-dialog-body'),html='',banks=PAY.banks||[],qris=imgURL(PAY.qris);banks.forEach(function(b){var bank=esc(b.bank),norek=esc(b.norek);if(!bank&&!norek)return;html+='<div class="kas-account"><span>'+bank+'</span><b>'+norek+'</b></div>'});if(qris)html+='<div class="kas-qris"><img src="'+esc(qris)+'" alt="QRIS MWCNU Pondok Aren"></div>';put(body,html||'<p class="kas-empty">Rekening dan QRIS belum tersedia.</p>');if(dialog&&!dialog.open)dialog.showModal();return}var target=[].filter.call($('dn-seg').children,function(b){return b.getAttribute('data-j')===mode})[0];if(target)target.click()})});
var kasDialog=$('kas-dialog');if(kasDialog){$('kas-dialog-close').onclick=function(){kasDialog.close()};kasDialog.addEventListener('click',function(e){if(e.target===kasDialog)kasDialog.close()})}
$('dn-chips').addEventListener('click',function(e){var b=e.target.closest('button');if(b)$('dn-nom').value=dot(b.getAttribute('data-v'))});
$('dn-anon').addEventListener('change',function(){var n=$('dn-nama');n.disabled=this.checked;if(this.checked)n.value='';n.placeholder=this.checked?'Hamba Allah':''});
$('zk-pay-btn').addEventListener('click',function(){if(Z<=0)return;$('dn-seg').children[0].click();$('dn-zjenis').value=ZK;$('dn-nom').value=dot(Z);go('zk-pay')});
var box=$('pay-box'),hb='';
(PAY.banks||[]).forEach(function(b){var bank=esc(b.bank),norek=esc(b.norek),an=esc(b.an);hb+='<div class="bank"><div><b>'+bank+'</b><span>'+norek+'</span><small>a.n. '+an+'</small></div><button type="button" class="loc-btn" data-copy="'+norek+'">Salin</button></div>'});
var qris=imgURL(PAY.qris);if(qris)hb+='<div class="qr"><img src="'+esc(qris)+'" alt="QRIS MWCNU Pondok Aren"></div>';
if(!hb)hb='<div class="pay-empty"><div>Rekening dan QRIS resmi MWCNU Pondok Aren akan ditampilkan di sini. Untuk saat ini, mintalah nomor rekening atau QRIS resmi lewat WhatsApp sekretariat.</div><a class="btn wa" href="https://wa.me/6285161033689?text=Assalamualaikum%2C%20saya%20ingin%20meminta%20nomor%20rekening%20%2F%20QRIS%20resmi%20MWCNU%20Pondok%20Aren%20untuk%20zakat%2Finfaq%2Fsedekah%2Fkas." target="_blank" rel="noopener">Minta rekening / QRIS</a></div>';
put(box,hb);
box.addEventListener('click',function(e){var b=e.target.closest('[data-copy]');if(!b)return;var t=b.getAttribute('data-copy'),ok=function(){b.textContent='Tersalin';setTimeout(function(){b.textContent='Salin'},1600)};try{navigator.clipboard.writeText(t).then(ok,function(){throw 0})}catch(x){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(y){}a.remove()}});
$('dn-send').addEventListener('click',function(){var m=$('dn-msg'),n=dig(V('dn-nom')),an=$('dn-anon').checked,nm=an?'Hamba Allah':V('dn-nama').trim(),hp=V('dn-hp').trim(),bad=null;
[['dn-nom',n>0],['dn-nama',an||nm],['dn-hp',hp]].forEach(function(x){var el=$(x[0]),bd=!x[1];(el.closest('.rp')||el).classList.toggle('err',bd);el.classList.toggle('err',bd);if(bd&&!bad)bad=el});
if(bad){m.textContent='Mohon lengkapi nominal, nama, dan nomor HP.';bad.focus();return}
var jl=J=='Zakat'?V('dn-zjenis'):J,per=V('dn-per'),doa=V('dn-doa').trim();
var t='Assalamualaikum, saya ingin menunaikan '+jl+' melalui MWCNU Pondok Aren.\n\nJenis: '+jl+'\nNominal: '+rp(n)+'\nNama: '+nm+'\nNo. HP: '+hp+(J!='Zakat'&&per!='Umum'?'\nPeruntukan: '+per:'')+(doa?'\nNiat/doa: '+doa:'')+'\n\nBukti transfer saya lampirkan pada chat ini. Jazakumullahu khairan.';
m.textContent='Membuka WhatsApp…';window.open('https://wa.me/6285161033689?text='+encodeURIComponent(t),'_blank','noopener')});
[].forEach.call(['dn-nom','dn-nama','dn-hp'],function(i){$(i).addEventListener('input',function(){this.classList.remove('err')})});
}catch(e){}})();
/* ===== FORM & KARTU LAYANAN ===== */
(function(){try{
var WA='6285161033689',RT=window.MWC_RT;
[].forEach.call(document.querySelectorAll('select[data-rt]'),function(x){x.textContent='';var o=document.createElement('option');o.value='';o.textContent='Pilih ranting / kelurahan';x.appendChild(o);RT.forEach(function(r){var q=document.createElement('option');q.textContent=r;x.appendChild(q)})});
var grid=document.getElementById('svgrid'),sel=document.getElementById('sv-layanan'),src=document.querySelectorAll('#lyscroll .lycard');
if(grid&&sel&&src.length){[].forEach.call(src,function(c){var n=c.cloneNode(true),h=c.getAttribute('href'),tt=c.querySelector('b,h3,strong'),t=tt?tt.textContent:'Layanan';n.className='lycard';n.removeAttribute('style');var g=document.createElement('span');g.className='sv-go';g.textContent=h=='#layanan'?'Ajukan layanan →':'Buka layanan →';n.appendChild(g);n.setAttribute('data-t',t);grid.appendChild(n)});sel.textContent='';var choices=['Pilih jenis permintaan'].concat([].slice.call(grid.querySelectorAll('.lycard[data-t]')).filter(function(a){return a.getAttribute('href')=='#layanan'}).map(function(a){return a.getAttribute('data-t')}).concat(['Permintaan informasi','Saran dan masukan','Layanan lainnya']));choices.forEach(function(c,i){var opt=document.createElement('option');opt.value=i?'': '';opt.textContent=c;if(i>0)opt.value=c;sel.appendChild(opt)});
grid.addEventListener('click',function(e){var a=e.target.closest('.lycard');if(!a)return;var h=a.getAttribute('href');if(h!='#layanan')return;e.preventDefault();sel.value=a.getAttribute('data-t');var f=document.getElementById('sv-form');f.scrollIntoView({behavior:'smooth',block:'center'})})}
function bind(id,build){var f=document.getElementById(id);if(!f)return;var b=f.querySelector('.wa'),m=f.querySelector('.fm-msg');
f.addEventListener('input',function(e){e.target.classList.remove('err')});
b.addEventListener('click',function(){var bad=null;[].forEach.call(f.querySelectorAll('[required]'),function(el){var v=!el.value.trim();el.classList.toggle('err',v);if(v&&!bad)bad=el});if(bad){m.textContent='Mohon lengkapi kolom yang bertanda *.';bad.focus();return}
var g=function(n){var e=f.querySelector('[name='+n+']');return e&&e.value.trim()?e.value.trim():'-'};m.textContent='Membuka WhatsApp…';window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(build(g)),'_blank','noopener')})}
var AMBX={lat:null,lng:null,p:function(){var t=document.querySelector('#amb-form [name=lokasi]').value.trim();return this.lat!=null?'\nTitik GPS jemput: https://www.google.com/maps?q='+this.lat+','+this.lng:(t&&!/^https?:/i.test(t)?'\nPeta jemput: https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t):'')},t:function(v){return v&&v!='-'&&!/^https?:/i.test(v)?'\nPeta tujuan: https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(v):''}};
var lb=document.getElementById('loc-btn'),ls=document.getElementById('loc-st');
if(lb)lb.addEventListener('click',function(){var inp=document.querySelector('#amb-form [name=lokasi]');if(!navigator.geolocation){ls.textContent='Perangkat tidak mendukung deteksi lokasi. Isi alamat secara manual.';return}ls.textContent='Mencari lokasi…';navigator.geolocation.getCurrentPosition(function(p){AMBX.lat=p.coords.latitude.toFixed(6);AMBX.lng=p.coords.longitude.toFixed(6);if(!inp.value.trim())inp.value='Titik lokasi GPS saya';inp.classList.remove('err');ls.textContent='Lokasi terdeteksi (±'+Math.round(p.coords.accuracy)+' m) · ';var mapLink=document.createElement('a');mapLink.href='https://www.google.com/maps?q='+AMBX.lat+','+AMBX.lng;mapLink.target='_blank';mapLink.rel='noopener';mapLink.textContent='lihat di peta';ls.appendChild(mapLink)},function(){AMBX.lat=null;ls.textContent='Lokasi tidak dapat diambil. Izinkan akses lokasi di browser, atau isi alamat secara manual.'},{enableHighAccuracy:true,timeout:12000,maximumAge:0})});
var tm=document.getElementById('tj-map');if(tm)tm.addEventListener('click',function(){var v=document.querySelector('#amb-form [name=tujuan]').value.trim();tm.href=v&&!/^https?:/i.test(v)?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(v):v&&/^https:\/\/(?:www\.)?google\.com\/maps\//i.test(v)?v:'https://www.google.com/maps'});
bind('sv-form',function(g){return 'Assalamualaikum, saya ingin mengajukan layanan MWCNU Pondok Aren.\n\nNama: '+g('nama')+'\nRanting: '+g('ranting')+'\nLayanan: '+g('layanan')+'\nNo. HP: '+g('hp')+'\nKeperluan: '+g('perlu')});
bind('amb-form',function(g){return 'PERMINTAAN AMBULANS - MWCNU Pondok Aren\n\nNama pelapor: '+g('nama')+'\nNo. HP: '+g('hp')+'\nLokasi jemput: '+g('lokasi')+AMBX.p()+'\nTujuan: '+g('tujuan')+AMBX.t(g('tujuan'))+'\nKondisi pasien: '+g('kondisi')});
}catch(e){}})();
/* ===== BILAH NAVIGASI BAWAH (MOBILE) ===== */
(function(){try{
var hl=document.querySelector('header nav a'),home=hl?hl.getAttribute('href'):'#';
var I=[[home,'Beranda',`<path d='M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'/><path d='M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/>`],['#berita','Berita',`<path d='M15 18h-5'/><path d='M18 14h-8'/><path d='M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2'/><rect width='8' height='4' x='10' y='6' rx='1'/>`],['#agenda','Agenda',`<path d='M8 2v4'/><path d='M16 2v4'/><rect width='18' height='18' x='3' y='4' rx='2'/><path d='M3 10h18'/>`],['#galeri','Galeri',`<rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/>`],['#kontak','Kontak',`<path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'/>`]];
var tb=document.createElement('div');tb.id='tabbar';tb.setAttribute('role','navigation');tb.setAttribute('aria-label','Navigasi cepat');
I.forEach(function(x){var a=document.createElement('a'),href=x[0];a.setAttribute('href',href.charAt(0)=='#'?href:'#top');var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.innerHTML=x[2];var span=document.createElement('span');span.textContent=x[1];a.appendChild(svg);a.appendChild(span);tb.appendChild(a)});
document.body.appendChild(tb);
function act(){var h=location.hash.slice(1).split('/')[0],k=(h==''||h=='beranda'||h=='top')?0:(h=='berita'||h=='baca')?1:h=='agenda'?2:h=='galeri'?3:h=='kontak'?4:-1;[].forEach.call(tb.children,function(a,i){var on=i==k;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});tb.classList.remove('banom-active');tb.classList.toggle('nav-covered',document.body.classList.contains('nav-open'))}
addEventListener('hashchange',act);
/* Hash statis berubah tanpa mutasi DOM: paksa bilah kembali terlihat, tanpa menunggu scroll. */
addEventListener('hashchange',function(){tb.classList.remove('hide','nav-covered')});
act();
var ly=0,scrollQueued=false;addEventListener('scroll',function(){if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(function(){var y=scrollY;if(document.body.classList.contains('nav-open'))tb.classList.remove('hide');else if(y>ly+8&&y>240)tb.classList.add('hide');else if(y<ly-8||y<120)tb.classList.remove('hide');ly=y;scrollQueued=false})},{passive:true});
addEventListener('hashchange',function(){tb.classList.remove('hide')});
var navButton=document.getElementById('mb'),navEl=document.getElementById('nv');if('IntersectionObserver' in window){var bo=new IntersectionObserver(function(entries){if(location.hash=='#top'||!location.hash){var active=entries.some(function(x){return x.isIntersecting});tb.classList.toggle('banom-active',active);[].forEach.call(tb.children,function(a,i){var on=active?i==2:(location.hash==''||location.hash=='#top')?i==0:false;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current',active?'location':'page');else a.removeAttribute('aria-current')})}else tb.classList.remove('banom-active')},{threshold:[.2,.6]});var bs=document.getElementById('banom');if(bs)bo.observe(bs)}
addEventListener('hashchange',function(){if(location.hash=='#kontak'){[].forEach.call(tb.children,function(a,i){var on=i==4;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}});
var navButton=document.getElementById('mb'),navEl=document.getElementById('nv');if(navButton&&navEl){navButton.addEventListener('click',function(){if(navEl.classList.contains('open'))tb.classList.add('nav-covered');else tb.classList.remove('nav-covered')});navEl.addEventListener('click',function(e){if(e.target.closest('a'))tb.classList.remove('nav-covered')})}
}catch(e){}})();
/* ===== INTERAKSI FUTURISTIK ===== */
(function(){try{
var bar=document.createElement('div');bar.id='pgbar';document.body.appendChild(bar);
function pg(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;bar.style.transform='scaleX('+(m>0?Math.min(1,h.scrollTop/m):0)+')'}
addEventListener('scroll',pg,{passive:true});pg();
var CARD='.pk,.stc,.ne,.agh,.gl,.cl,.av,.bi,.bdet,.binfo,.play,.chip';
function mark(root){[].forEach.call((root||document).querySelectorAll(CARD),function(e){e.classList.add('fx')})}
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
var io=('IntersectionObserver' in window&&!rm)?new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.08,rootMargin:'0px 0px -6% 0px'}):null;
if(io)document.documentElement.classList.add('js-rv');
/* Setiap elemen di-observe TEPAT SEKALI. Sebelumnya boot() dipanggil ulang oleh
   MutationObserver sehingga observe() menumpuk: elemen yang sudah ter-observe
   sering menggantung tanpa pernah melaporkan irisan, .in tak pernah dipasang,
   dan konten tertinggal tak terlihat. */
function rev(){
  [].forEach.call(document.querySelectorAll('.ho .wrap > *, .ho .stc, .ho .bncard, .ho .lycard, .ho .kcard, .ho .cats a, .ho .strow .stc, .vw .wrap > *, .fx'),function(e){
    if(e.classList.contains('rv')||e.closest('.dd'))return;
    if(!io)return;
    e.classList.add('rv');
    var p=e.parentNode,i=p?[].indexOf.call(p.children,e):0;
    e.style.transitionDelay=(i?Math.min(i,6)*70:0)+'ms';
    io.observe(e);
  });
}
/* Hitung angka statistik saat tampil */
function countNums(){
  [].forEach.call(document.querySelectorAll('#org-intro .stc b, #banom .bncard b, .stat b'),function(el){
    if(el.dataset.cnt)return;var t=(el.textContent||'').trim();if(!/^\d+$/.test(t))return;el.dataset.cnt='1';
    var target=+t;
    function run(){
      var t0=performance.now(),dur=700;
      function step(now){var k=Math.min(1,(now-t0)/dur);el.textContent=String(Math.round(target*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(step)}
      requestAnimationFrame(step);
    }
    if(io){var c=new IntersectionObserver(function(en){if(en[0].isIntersecting){run();c.disconnect()}},{threshold:.4});c.observe(el)}else run();
  });
}
/* Jaring aman: hanya untuk kasus observer/jaringan benar-benar gagal.
   Elemen di bawah fold memang menunggu scroll (perilaku desain), jadi jaring
   ini sengaja berjalan lama dan sekali saja agar animasi tetap mulus. */
function revealAll(){[].forEach.call(document.querySelectorAll('.rv:not(.in)'),function(e){e.classList.add('in')})}
setTimeout(revealAll,8000);
function boot(){mark();rev();countNums()}
boot();
new MutationObserver(function(){clearTimeout(boot.t);boot.t=setTimeout(boot,60)}).observe(document.getElementById('top')||document.body,{childList:true,subtree:true});
document.addEventListener('pointermove',function(ev){var c=ev.target.closest&&ev.target.closest('.fx');if(!c)return;var r=c.getBoundingClientRect();c.style.setProperty('--mx',(ev.clientX-r.left)+'px');c.style.setProperty('--my',(ev.clientY-r.top)+'px')},{passive:true});
}catch(e){}})();

/* Re-run these interactions when content.js loads app.js after DOMContentLoaded. */


/* Fallback-safe bootstrap for the question-topic flow. Also handles a slow CMS startup. */
(function(){var kc=document.getElementById('ka-cats'),form=document.getElementById('ka-form'),cats=[['Ibadah','Shalat, puasa, zakat, haji'],['Akidah','Keyakinan dan keimanan'],['Akhlak & tasawuf','Adab dan pembinaan diri'],['Muamalah','Jual beli dan ekonomi syariah'],['Keluarga','Pernikahan dan rumah tangga'],['Waris & wasiat','Pembagian harta peninggalan'],['Amaliyah NU','Tahlil, maulid, ziarah, qunut'],['Lainnya','Pertanyaan di luar topik lain']];if(!kc||!form)return;if(!kc.querySelector('.mt-f'))kc.innerHTML=cats.map(function(c,i){return '<button type="button" class="mt-f" data-i="'+i+'" aria-controls="ka-kat" aria-label="Pilih topik '+c[0]+'"><b>'+c[0]+'</b><small>'+c[1]+'</small></button>'}).join('');function fillSelect(id,label,values){var s=document.getElementById(id);if(!s||s.options.length>1)return;var o=document.createElement('option');o.value='';o.textContent=label;s.appendChild(o);values.forEach(function(v){var q=document.createElement('option');q.value=v;q.textContent=v;s.appendChild(q)})}var names=cats.map(function(c){return c[0]});fillSelect('ka-kat','Pilih topik',names);fillSelect('ka-fk','Semua topik',names);fillSelect('ka-rt','Pilih ranting / kelurahan',window.MWC_RT);if(kc.dataset.topicBound)return;kc.dataset.topicBound='1';kc.addEventListener('click',function(e){var b=e.target.closest('.mt-f');if(!b)return;var i=+b.dataset.i;if(!cats[i])return;var select=document.getElementById('ka-kat');if(select){select.value=cats[i][0];select.classList.remove('err');select.dispatchEvent(new Event('change',{bubbles:true}))}var header=document.querySelector('header');if(header)header.classList.add('sc');form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});setTimeout(function(){form.scrollIntoView({behavior:'auto',block:'start'});var q=document.getElementById('ka-q');if(q)q.focus({preventScroll:true})},650)})})();

/* Direktori organisasi (FASE 2): ambil alih tampilan bila DB sudah berisi.
   Dipanggil paling akhir agar render bawaan app.js selesai lebih dulu. */
if(window.MWCDIR)window.MWCDIR.init();
