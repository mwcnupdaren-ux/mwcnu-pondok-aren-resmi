
(function(){
var PH=["/assets/img/img-a40aafe9.webp","/assets/img/img-897feccb.webp","/assets/img/img-6e2f9266.webp","/assets/img/img-da3baea3.webp","/assets/img/img-1a2f09f7.webp","/assets/img/img-5d1ae212.webp","/assets/img/img-6d655717.webp","/assets/img/img-ffb9a380.webp"];
var MW=window.MWC||{md:function(t,f,d){return d},set:function(){return null},grp:function(d){return d},tok:function(s){return s}};
function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]})}
function safeURL(s){s=String(s||'').trim();if(s.charAt(0)=='#'||(s.charAt(0)=='/'&&s.charAt(1)!='/'))return s;try{var u=new URL(s,location.href);if(u.protocol=='https:'||u.protocol=='http:'||u.protocol=='mailto:'||u.protocol=='tel:')return u.href}catch(e){}return '#'}
function imgURL(s){s=String(s||'').trim();if(/^\/(?!\/)[^\\"'<>]*$/.test(s))return s;try{var u=new URL(s,location.href);if(u.protocol=='https:'&&u.origin!==location.origin)return u.href}catch(e){}return ''}
function cleanHTML(html){var t=document.createElement('template'),tags='A ARTICLE B BR BUTTON CIRCLE DD DIV DL DT EM FIGCAPTION FIGURE H1 H2 H3 H4 IFRAME IMG LI OL OPTION P PATH POLYGON RECT SMALL SPAN STRONG SVG TABLE TBODY TD TH THEAD TR UL'.split(' '),attrs='class id role aria-label aria-hidden aria-live aria-selected href src alt title target rel allowfullscreen viewbox d points cx cy r x y width height fill stroke-width stroke-linecap stroke-linejoin stroke-dasharray preserveaspectratio loading referrerpolicy style' .split(' ');t.innerHTML=String(html||'');[].forEach.call(t.content.querySelectorAll('*'),function(e){var tag=e.tagName.toUpperCase();if(tags.indexOf(tag)<0){e.replaceWith(document.createTextNode(e.textContent||''));return}if(tag=='IFRAME'&&!/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:[?#].*)?$/.test(e.getAttribute('src')||'')){e.remove();return}if(tag=='SVG'&&e.querySelector('script,foreignObject')){e.remove();return}[].forEach.call(e.attributes,function(a){var n=a.name.toLowerCase(),v=a.value.trim();if(attrs.indexOf(n)<0&& !/^data-[a-z0-9_-]+$/i.test(n)){e.removeAttribute(a.name);return}if(n.slice(0,2)=='on'||n=='srcdoc'||n=='formaction'){e.removeAttribute(a.name);return}if(n=='href'||n=='src'){var ok=n=='href'?/^(#|https?:\/|mailto:|tel:)/i.test(v):/^(https?:\/|\/[^/])/i.test(v);if(tag=='IFRAME')ok=n=='src'&&/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}(?:[?#].*)?$/.test(v);if(ok&&n=='href')try{var u=new URL(v,location.href);ok=/^(https?:|mailto:|tel:)$/.test(u.protocol)||v.charAt(0)=='#'}catch(ex){ok=false}if(!ok)e.removeAttribute(a.name)}if(n=='style'&&/(?:expression\s*\(|javascript\s*:|vbscript\s*:|data\s*:|@import|[<>])/i.test(v))e.removeAttribute(a.name)});if(tag=='A'&&e.getAttribute('target')=='_blank')e.setAttribute('rel','noopener noreferrer')});return t.innerHTML}
function put(el,html){if(el)el.innerHTML=cleanHTML(html)}
function fill(id,h){put(document.getElementById(id),h)}
function ph(u){if(!u)return null;u=imgURL(u);if(!u)return null;var i=PH.indexOf(u);if(i<0){PH.push(u);i=PH.length-1}return i}
var HS=(function(){var h=MW.set('hero');return h&&h.slides&&h.slides.length>=1&&h.slides.every(Boolean)?h.slides.map(ph):[4,0,5,1]})();
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
function setT(d){r.setAttribute('data-theme',d?'dark':'light');tb0.textContent=d?'☀':'☾'}
setT(matchMedia('(prefers-color-scheme:dark)').matches);
tb0.onclick=function(){setT(r.getAttribute('data-theme')!='dark')};
// Pengurus
function L(r,a){return a.map(function(n){return [r,n]})}
var T=MW.grp({'Mustasyar':L('Mustasyar',['Dr. K.H. Syuhada, M.A.','Drs. K.H. Syarief Muawan, M.Pd.','Dr. K.H. M. Sobron Zayyan, S.Q., M.A','Dr. H. Edi Suharsongko, M.Pd.','K.H. Udan Maulana','H. Abdul Azis Noor','Dr. H. Budi Harsono, S.E., M.Si., CSP, CPM, CIISA','K.H. M. Jamil, S.Q., M.Pd.','K.H. M. Soleh Ma\'mun']),
'Syuriyah':[['Rois','K.H. Mohommad Toha, S.Ag']].concat(L('Wakil Rois',['K.H. Irfan Zaini Abbas','K.H. A. Misbah, S.Pd.I., M.Ag.','K. Sholeh Anas RJ']),[['Katib','KH. Abdul Ghofur, M.Pd.']],L('Wakil Katib',['M. Yusuf FHR, S.Sos.','Mustahdi, M.A.','Aprianif, Lc., M.A.','Zakaria Muslim, S.Pd.I.']),L('A\'wan',['Drs. H. Abdul Karim Jafar, MM.','Drs. H. Naidin Fathullah','Dr. H. Usman Shofi','Drs. Ahmad Muhsin','Abdul Rohim Masduqi','Dr. H. Ahmad Rifa\'i','M. Irfansyah','H. Imam Bajuri, S.Pd.I., M.Ag.','Zainudin, SQ.'])),
'Tanfidziyah':[['Ketua','H. Fathur Rahman']].concat(L('Wakil Ketua',['Drs. K.H.M. Junaidi, M.Pd.','Abdul Syukur, S.Q.','K.H. Soewardi Warman, S.H., M.H.','KH. M. Afif, M.Pd.','Ahmad Sairin, S.Pd.I. K.','Nasuha, S.Pd.I.']),[['Sekretaris','Dr. (HC) Ruslani, M.M.']],L('Wakil Sekretaris',['Nurhadi, S.Pd.I., M.Pd.','Suparman','Fahrial Hilal H.','Kholili','K. Tamam Khaulani','Awaludin, S.Sos., M.Pd.']),[['Bendahara','Ahmad Munir']],L('Wakil Bendahara',['M. Rizki, S.Kom.','Handoko','Muhidin','Gunawan, S.Pd.I.'])),
'Badan otonom':[['Pemuda','GP Ansor'],['Perempuan muda','Fatayat NU'],['Pelajar putra','IPNU'],['Pelajar putri','IPPNU']]});
var TOP={'Rois':1,'Katib':1,'Ketua':1,'Sekretaris':1,'Bendahara':1};
function ini(n){var w=n.split(',')[0].split(/\s+/).filter(function(x){return x&&!/^(dr|drs|k|kh|h|ust)\.?$/i.test(x)&&!/^\(hc\)$/i.test(x)&&!/^([a-z]\.)+$/i.test(x)});return ((w[0]||'?')[0]+(w[1]?w[1][0]:'')).toUpperCase()}
function card(n,role,top){return '<div class="person'+(top?' top':'')+'"><span class="av">'+ini(n)+'</span><span><b>'+n+'</b>'+(role?'<small>'+role+'</small>':'')+'</span></div>'}
function ft(k,r){var x=T[k].filter(function(p){return p[0]==r})[0];return x?x[1]:''}
function LC(r,n){return '<div class="lc"><span class="av">'+ini(n)+'</span><span><small>'+r+'</small><b>'+n+'</b></span></div>'}
var kph=document.querySelector('.pt img'),kn=ft('Tanfidziyah','Ketua');
put(document.getElementById('core'),'<div class="cl"><h3>Syuriyah</h3>'+LC('Rois',ft('Syuriyah','Rois'))+LC('Katib',ft('Syuriyah','Katib'))+'</div><div class="cl"><h3>Tanfidziyah</h3><div class="cg"><div class="lc k"><div class="ph">'+(kph?'<img alt="'+kn+'" src="'+kph.src+'">':ini(kn))+'</div><span><small>Ketua</small><b>'+kn+'</b></span></div><div class="cs">'+LC('Sekretaris',ft('Tanfidziyah','Sekretaris'))+LC('Bendahara',ft('Tanfidziyah','Bendahara'))+'</div></div></div>');
var tb=document.getElementById('tabs'),pn=document.getElementById('panel'),sq=document.getElementById('sq'),curT='Tanfidziyah';
function marks(k){[].forEach.call(tb.children,function(b){b.setAttribute('aria-selected',b.dataset.k==k)})}
function show(k){curT=k;sq.value='';var g=[],h='';
T[k].forEach(function(p){var l=g[g.length-1];if(l&&l[0]==p[0])l[1].push(p[1]);else g.push([p[0],[p[1]]])});
g.forEach(function(x){h+='<div class="grp"><h3>'+x[0]+'<em>'+x[1].length+'</em></h3><div class="gl">'+x[1].map(function(n){return card(n,'',TOP[x[0]])}).join('')+'</div></div>'});
put(pn,h);marks(k)}
Object.keys(T).forEach(function(k){var b=document.createElement('button');b.dataset.k=k;put(b,esc(k)+'<small>'+T[k].length+'</small>');b.setAttribute('role','tab');b.onclick=function(){show(k)};tb.appendChild(b)});
sq.oninput=function(){var v=sq.value.trim().toLowerCase();if(!v){show(curT);return}
var r=[];Object.keys(T).forEach(function(k){T[k].forEach(function(p){if(p[1].toLowerCase().indexOf(v)>-1)r.push(card(p[1],p[0]+', '+k,TOP[p[0]]))})});
put(pn,r.length?'<div class="gl">'+r.join('')+'</div>':'<p class="empty">Nama tidak ditemukan.</p>');marks('')};
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
var P=MW.md('program',function(x){return{t:x.judul||'',s:x.deskripsi||'',k:MW.lines(x.kegiatan),a:[x.tombol||'Tanya tentang program',safeURL(x.tautan||'#berita')]}},[{t:"Dakwah dan pengajian Aswaja",s:"Majelis rutin yang menguatkan amaliyah Ahlussunnah wal Jama'ah An-Nahdliyah bersama warga.",k:["Lailatul Ijtima'","Yasin dan tahlil","Pengajian Aswaja","Doa penutup"],a:["Lihat kabar kegiatan","#berita"]},
{t:"Penguatan ranting",s:"Pendampingan dan konsolidasi pengurus ranting di 11 kelurahan se-Pondok Aren.",k:["Tawaqufan di ranting","Silaturahmi pengurus dan ranting","11 PRNU"],a:["Lihat daftar ranting","#ranting"]},
{t:"Media dan dakwah digital",s:"Informasi dan narasi keislaman yang menyejukkan, ramah, dan memersatukan di ruang digital.",k:["Media Center NU Pondok Aren","TVNU Pondok Aren","NUPA Media"],a:["Lihat TVNU Pondok Aren","#video"]},
{t:"Silaturahmi dan tradisi",s:"Pertemuan keluarga besar NU untuk merawat kebersamaan dan menjaga tradisi.",k:["Halal Bi Halal keluarga besar NU","Ramah tamah"],a:["Lihat galeri","#galeri"]},
{t:"Badan otonom",s:"Kaderisasi dan gerakan bersama badan otonom di tingkat kecamatan.",k:["GP Ansor","Fatayat NU","IPNU","IPPNU"],a:["Lihat badan otonom","#struktur"]}]);
if(!P.length)P=[{t:'Program khidmat',s:'Informasi program akan diumumkan melalui MWCNU Pondok Aren.',k:[],a:['Lihat kabar kegiatan','#berita']}];
var PI=[I[0],I[4],'M2 4h20v13H2z M8 21h8 M12 17v4',I[3],I[2]];
var pl=document.getElementById('pl'),pd=document.getElementById('pd'),pi='';
function sv(d){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>'}
function pshow(i,anim){var p=P[i];if(!p)return;pi=String(i);
[].forEach.call(pl.children,function(b,j){var selected=j==i;b.setAttribute('aria-selected',selected);b.tabIndex=selected?0:-1});
pd.setAttribute('aria-labelledby','program-tab-'+i);
var url=p.a[1],urlOK=/^#[-\w/]+$/.test(url)||/^https:\/\/(?:[\w-]+\.)+[\w-]+(?:[/?#][^\s]*)?$/i.test(url);if(!urlOK)url='#berita';
put(pd,'<div class="program-panel-top"><span class="program-step">Program '+('0'+(i+1)).slice(-2)+' <i>/ '+('0'+P.length).slice(-2)+'</i></span><span class="pbig">'+sv(PI[i%PI.length])+'</span></div><h3>'+esc(p.t)+'</h3><p>'+esc(p.s)+'</p>'+(p.k.length?'<div class="program-focus"><b>Fokus kegiatan</b><ul class="pk">'+p.k.map(function(k){return '<li>'+esc(k)+'</li>'}).join('')+'</ul></div>':'')+'<div class="program-actions"><a class="btn" id="program-wa" href="https://wa.me/6285161033689?text='+encodeURIComponent("Assalamu'alaikum, saya ingin bertanya tentang program "+p.t)+'" target="_blank" rel="noopener">Tanya lewat WhatsApp</a><a class="btn o" id="program-detail-link" href="'+esc(safeURL(url))+'">'+esc(p.a[0]||'Lihat detail')+' <span aria-hidden="true">→</span></a></div>');
if(anim){pd.classList.remove('sw');void pd.offsetWidth;pd.classList.add('sw')}}
P.forEach(function(p,i){var b=document.createElement('button');b.id='program-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','pd');b.setAttribute('aria-selected',i===0);b.tabIndex=i===0?0:-1;
put(b,'<span class="program-tab-num">'+('0'+(i+1)).slice(-2)+'</span><span class="pi">'+sv(PI[i%PI.length])+'</span><span class="program-tab-copy"><b>'+esc(p.t)+'</b><small>'+esc(p.k.slice(0,2).join(' · ')||'Program khidmat MWCNU')+'</small></span><span class="program-tab-arrow" aria-hidden="true">→</span>');
b.onclick=function(){pshow(i,1)};b.onkeydown=function(e){var next=e.key==='ArrowDown'||e.key==='ArrowRight'?i+1:e.key==='ArrowUp'||e.key==='ArrowLeft'?i-1:e.key==='Home'?0:e.key==='End'?P.length-1:-1;if(next<0)return;e.preventDefault();next=(next+P.length)%P.length;pshow(next,1);pl.children[next].focus()};pl.appendChild(b)});
pshow(0,0);
// Video TVNU Pondok Aren: tambahkan baris [idVideo, judul, tanggal] di sini
var V=MW.md('video',function(x){return[MW.yt(x.youtube),x.judul,MW.tgl(x.tanggal)]},[["yTL2DYeYviA","Halal Bihalal: Tradisi Khas Indonesia yang Lahir dari Pemikiran Para Ulama NU","1 Mei 2026"],["MIhHbzD3RGk","Nahdlatul Ulama Tetap Relevan: Bagaimana Mereka Seimbangkan Tradisi dan Modernitas?","29 April 2026"],["ZDuEPPinBTA","Target Pembentukan Anak Ranting NU Se-Pondok Aren | Laporan Ketua Panitia HBH 2026","29 April 2026"],["iSc-NZLsOrY","Lahirnya Kebangkitan Ulama - DR. KH. Manarul Hidayat, MA.","8 Juli 2025"],["-Yb3fhDJiIU","Louncing QRIS | MWCNU Pondok Aren Langkah Maju dari Koin NU","7 Juli 2025"],["_GaNDmYqaL8","Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur","5 September 2024"]],MW.byDate);
var homeVideo=V.filter(function(v){return/^[\w-]{11}$/.test(v[0])})[0],homeVideoBox=document.getElementById('homeVideo');
if(homeVideo&&homeVideoBox){
  var videoCard=document.createElement('a');videoCard.className='home-video-card';videoCard.href='#video';videoCard.setAttribute('aria-label','Tonton video dokumentasi: '+homeVideo[1]);
  var videoArt=document.createElement('span');videoArt.className='home-video-art';videoArt.style.backgroundImage='url("https://i.ytimg.com/vi/'+encodeURIComponent(homeVideo[0])+'/hqdefault.jpg"),url("'+PH[4]+'")';
  var videoPlay=document.createElement('span');videoPlay.className='home-video-play';videoPlay.setAttribute('aria-hidden','true');var videoPlayIcon=document.createElement('span');videoPlayIcon.className='play';videoPlay.appendChild(videoPlayIcon);videoArt.appendChild(videoPlay);
  var videoInfo=document.createElement('span');videoInfo.className='home-video-info';var videoKicker=document.createElement('small');videoKicker.textContent='Video dokumentasi · TVNU Pondok Aren';var videoTitle=document.createElement('b');videoTitle.textContent=homeVideo[1];var videoMeta=document.createElement('span');videoMeta.textContent=homeVideo[2]+' · Tonton video';videoInfo.appendChild(videoKicker);videoInfo.appendChild(videoTitle);videoInfo.appendChild(videoMeta);videoCard.appendChild(videoArt);videoCard.appendChild(videoInfo);homeVideoBox.appendChild(videoCard);
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
fill('cats',[['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1','Profil','Sejarah & Struktur','#sejarah'],['M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4zm19-13H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h22c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z','Berita','Kabar & Warta NU','#berita'],['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z M9 12h6 M9 16h6','Program','Lima program khidmat','#program'],[ICN.phone,'Layanan','Ambulans & UPZ','#ambulans'],['M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M19 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M9 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z M19 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z','Banom','Badan Otonom NU','#banom'],['M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z','Galeri','Foto dan Video','#galeri'],[ICN.pin,'Ranting','11 Kelurahan NU','#ranting'],['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6','Kontak','Sekretariat & medsos','#kontak']].map(function(c){return '<a href="'+c[3]+'"><span class="cc">'+sv(c[0])+'</span><span class="ct"><b>'+c[1]+'</b><small>'+c[2]+'</small></span></a>'}).join(''));
var _rtN=(MW.raw&&((MW.raw('ranting')||[]).length))||11,_bnN=(MW.raw&&((MW.raw('banom')||[]).length))||4,_med=MW.set('medsos')||{},_yt=(MW.safeSocial?MW.safeSocial(_med.youtube,'youtube'):'')||'https://www.youtube.com/@TVNUPondokAren';
fill('strow',[[ICN.pin,String(_rtN),'Kelurahan'],[I[4],String(_rtN),'Ranting NU'],[I[2],String(_bnN),'Badan otonom'],[ICN.cal,'2025-2030','Masa khidmat']].map(function(c){return '<div class="stc"><span class="fic">'+sv(c[0])+'</span><span><b>'+c[1]+'</b><small>'+c[2]+'</small></span></div>'}).join('')+'<div class="stc"><small>Tonton kami</small><a class="fic" href="'+_yt+'" target="_blank" rel="noopener" aria-label="YouTube TVNU Pondok Aren">'+sv('M5 3l14 9-14 9z')+'</a></div>');
function go(h){if(location.hash==h)route();else location.hash=h}
document.getElementById('sb').onclick=function(){var r=document.getElementById('rq').value.trim(),sv=document.getElementById('rs').value;
if(r){q.value=r;draw();go('#ranting')}else if(sv.indexOf('|')>-1){var pp=sv.split('|');drawG(pp[1]);go(pp[0])}else go(sv)};
document.getElementById('rq').onkeydown=function(e){if(e.key=='Enter')document.getElementById('sb').click()};
document.getElementById('nb').onclick=function(){var t=document.getElementById('nm').value.trim();window.open('https://wa.me/6285161033689'+(t?'?text='+encodeURIComponent(t):''),'_blank','noopener')};
var VW=['program','struktur','agenda','berita','baca','galeri','ranting','sejarah','visi','layanan','majelis','konsultasi','kontak','ambulans','zis','daftar','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];
var VWnoback=['sejarah','visi','layanan','majelis','konsultasi','kontak','ambulans','zis','daftar','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];VW.forEach(function(id){if(id=='baca'||VWnoback.indexOf(id)>=0)return;document.getElementById(id).insertAdjacentHTML('afterbegin','<div class="wrap vb"><a class="back" href="#top">&larr; Kembali ke beranda</a></div>')});
[].forEach.call(document.querySelectorAll('.sl'),function(e,i){e.style.backgroundImage='url('+PH[HS[i%HS.length]]+')'});
var LSV=MW.md('layanan',function(x){return x.tampil===false?null:{title:x.judul,desc:x.deskripsi||'',icon:ICONS[x.ikon]||ICONS.info,link:x.tautan||'#layanan'}},[
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
function layananCard(l){return '<a class="lycard" href="'+esc(safeURL(l.link))+'"><span class="lyic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+l.icon+'</svg></span><span><b>'+esc(l.title)+'</b><small>'+esc(l.desc)+'</small></span></a>'}

// Badan Otonom NU
var BANOM=MW.md('banom',function(x){return{name:x.nama,full:x.nama_lengkap||'',desc:x.deskripsi||'',logo:x.monogram||'',color:x.warna||'#17352A'}},[
{name:'GP Ansor',full:'Gerakan Pemuda Ansor',desc:'Organisasi kepemudaan untuk pemberdayaan, keamanan, dan pengabdian masyarakat',logo:'GA',color:'#1B7A4A'},
{name:'Fatayat NU',full:'Fatayat Nahdlatul Ulama',desc:'Organisasi perempuan muda untuk dakwah dan pemberdayaan keluarga',logo:'FN',color:'#C2185B'},
{name:'IPNU',full:'Ikatan Pelajar Nahdlatul Ulama',desc:'Organisasi pelajar putra untuk pembinaan karakter dan kepemimpinan',logo:'IP',color:'#1565C0'},
{name:'IPPNU',full:'Ikatan Pelajar Putri Nahdlatul Ulama',desc:'Organisasi pelajar putri untuk dakwah, pendidikan, dan pengembangan diri',logo:'PP',color:'#7B1FA2'},
{name:'Pagar Nusa',full:'Pencak Silat Nahdlatul Ulama Pagar Nusa',desc:'Badan otonom NU yang mewadahi pencak silat serta pembinaan karakter dan pengabdian kader.',logo:'PN',color:'#D8A62B'}
]);
if(!BANOM.some(function(b){return b.name.toLowerCase()==='pagar nusa'}))BANOM.push({name:'Pagar Nusa',full:'Pencak Silat Nahdlatul Ulama Pagar Nusa',desc:'Badan otonom NU yang mewadahi pencak silat serta pembinaan karakter dan pengabdian kader.',logo:'PN',color:'#D8A62B'});
var bnmg=document.getElementById('banomgrid');if(bnmg){var h='';BANOM.forEach(function(b){var color=/^#[0-9a-f]{6}$/i.test(b.color)?b.color:'#17352A';h+='<div class="bncard" role="group" aria-label="'+esc(b.name)+'" style="--bc:'+color+'"><span class="bnic" aria-hidden="true">'+esc(b.logo)+'</span><span class="bn-copy"><b>'+esc(b.name)+'</b><small>'+esc(b.desc)+'</small></span></div>'});put(bnmg,h);if('IntersectionObserver' in window){var _bio=new IntersectionObserver(function(en,ob){if(en.some(function(e){return e.isIntersecting})){[].forEach.call(bnmg.querySelectorAll('.bncard'),function(c,i){c.classList.add('bn-anim');c.style.animationDelay=(i*90)+'ms'});_bio.disconnect()}},{threshold:.18});_bio.observe(bnmg)}}
var lys=document.getElementById('lyscroll');if(lys)put(lys,LSV.map(layananCard).join(''));
var KG=['program','berita','agenda','galeri'],programDD=document.querySelector('#nav-program')&&document.querySelector('#nav-program').closest('.dd');
function closeDD(){[].forEach.call(document.querySelectorAll('#nv .dd.open'),function(x){x.classList.remove('open');x.querySelector('.ddb').setAttribute('aria-expanded','false')})}
function mark(c){[].forEach.call(document.querySelectorAll('#nv a'),function(a){a.classList.toggle('on',a.getAttribute('href')=='#'+c)});if(programDD)programDD.classList.toggle('on',KG.indexOf(c)>=0)}
function route(){var h=decodeURIComponent(location.hash.slice(1)),m='',anchorTarget=null;
var target=h&&document.getElementById(h),parent=target&&target.closest('.vw');if(parent&&target!==parent){if(parent.hidden){anchorTarget=target;h=parent.id}else{target.scrollIntoView({behavior:'smooth',block:'start'});mark(parent.id);closeDD();return}}
if(h=='kontak'){var contact=document.getElementById('kontak');if(contact){var ft=document.getElementById('site-footer');contact.hidden=false;[].forEach.call(document.querySelectorAll('.ho'),function(e){e.hidden=true});var ids=['program','struktur','agenda','berita','baca','galeri','ranting','sejarah','visi','layanan','majelis','konsultasi','ambulans','zis','daftar','banom-gpansor','banom-fatayat','banom-ipnu','banom-ippnu'];ids.forEach(function(id){var v0=document.getElementById(id);if(v0)v0.hidden=true});document.body.classList.add('inview');if(ft)ft.hidden=true;mark('kontak');closeDD();window.scrollTo(0,0);return}}
if(h=='video'){h='galeri';m='Video'}else if(h=='galeri')m='Foto';
var mm=h.match(/^berita\/(\d+)$/);if(mm)h='baca';
var v=VW.indexOf(h)>=0?h:'';
var footer=document.getElementById('site-footer');if(footer)footer.hidden=!!v;
VW.forEach(function(id){document.getElementById(id).hidden=id!=v});
[].forEach.call(document.querySelectorAll('.ho'),function(e){e.hidden=!!v});document.body.classList.toggle('inview',!!v);
if(m)setG(m);if(mm)renderArticle(+mm[1]);if(anchorTarget){window.scrollTo(0,0);requestAnimationFrame(function(){anchorTarget.scrollIntoView({behavior:'smooth',block:'start'})})}else if(h=='sambutan'){var sb=document.getElementById('sambutan');if(sb)sb.scrollIntoView()}else if(!v&&h&&h!='top'&&document.getElementById(h)){document.getElementById(h).scrollIntoView({behavior:'smooth',block:'start'})}else window.scrollTo(0,0);mark(v=='baca'?'berita':(v||'top'));closeDD()}
addEventListener('hashchange',route);route();
// Dialog, berita, galeri
var dlg=document.getElementById('dlg'),db=document.getElementById('dlgBody');
function openD(h){put(db,h);if(!dlg.open)dlg.showModal();dlg.scrollTop=0}
document.getElementById('dlgX').onclick=function(){dlg.close()};
dlg.onclick=function(e){if(e.target==dlg)dlg.close()};
function act(el,f){el.tabIndex=0;el.setAttribute('role','button');el.onclick=f;el.onkeydown=function(e){if(e.key=='Enter'||e.key==' '){e.preventDefault();f()}}}
var N=MW.md('berita',function(x){return[x.kategori||'Berita',x.judul,MW.tgl(x.tanggal),x.ringkasan||'',ph(x.foto),'',{lead:x.lead||'',cap:x.caption||'',tag:x.tag||'',author:x.penulis||'',featured:!!x.featured,metaT:x.meta_judul||'',metaD:x.meta_desc||'',fontA:x.font_artikel||'',drop:!!x.dropcap_art,p:MW.paras(x.isi),info:MW.kv(x.info),ph:(x.foto_tambahan||[]).map(ph).filter(function(i){return i!=null}),vid:MW.lines(x.video).map(function(l){var id=MW.yt(l);if(!/^[\w-]{11}$/.test(id))return -1;for(var i=0;i<V.length;i++)if(V[i][0]==id)return i;return -1}).filter(function(i){return i>=0})}]},[["Berita","Halal Bi Halal Keluarga Besar NU Pondok Aren Angkat Tema Membumikan Dakwah dan Menguatkan Ranting","26 April 2026","Silaturahmi keluarga besar NU Kecamatan Pondok Aren di Omah Singgah NU Alfath.",4,"",{lead:"Keluarga Besar Nahdlatul Ulama Kecamatan Pondok Aren menggelar Halal Bi Halal bertema Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi.",cap:"Halal Bi Halal Keluarga Besar NU Kecamatan Pondok Aren di Omah Singgah NU Alfath. (Dokumentasi MWCNU Pondok Aren)",p:["Keluarga Besar Nahdlatul Ulama Kecamatan Pondok Aren menggelar Halal Bi Halal di Omah Singgah NU Alfath pada 8 Dzulqa'dah 1447 H atau bertepatan dengan 26 April 2026 M. Kegiatan ini mengusung tema Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi.","Spanduk kegiatan memuat identitas pengurus ranting NU dari sebelas kelurahan di Pondok Aren.","Rangkaian kegiatan didokumentasikan oleh Media Center NU Pondok Aren dan tayang di kanal TVNU Pondok Aren, termasuk laporan ketua panitia mengenai target pembentukan anak ranting NU se-Pondok Aren."],info:[["Tanggal","8 Dzulqa'dah 1447 H / 26 April 2026 M"],["Tempat","Omah Singgah NU Alfath"],["Tema","Membumikan Dakwah, Menguatkan Ranting dan Menjaga Tradisi"]],ph:[4,5,6,7],vid:[2]}],
["Berita","MWCNU Pondok Aren Gelar Lailatul Ijtima' dan Tawaqufan di Pondok Kacang Barat","7 Februari 2026","Pengajian malam bersama pengurus MWCNU dan ranting di Majelis Taklim Annur.",1,"",{lead:"Pengajian malam bersama pengurus MWCNU Pondok Aren dan ranting digelar di Majelis Taklim Annur, Pondok Kacang Barat.",cap:"Lailatul Ijtima' dan Tawaqufan di Majelis Taklim Annur, Pondok Kacang Barat. (Dokumentasi MWCNU Pondok Aren)",p:["Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren bersama Pengurus Ranting NU (PRNU) Pondok Kacang Barat menggelar Lailatul Ijtima' dan Tawaqufan pada 7 Februari 2026 di Majelis Taklim Annur, Jl. Wisma Tajur RT 02 RW 010 No. 20, Kelurahan Pondok Kacang Barat.","Kegiatan berlangsung pukul 19.45 sampai 23.00 WIB dengan rangkaian acara pembukaan, yasin dan tahlil, pengajian Aswaja, doa penutup, dan ramah tamah.","Dokumentasi kegiatan tersedia di galeri foto laman ini."],info:[["Tanggal","7 Februari 2026"],["Waktu","19.45 sampai 23.00 WIB"],["Tempat","Majelis Taklim Annur, Jl. Wisma Tajur RT 02 RW 010 No. 20, Kel. Pondok Kacang Barat"]],list:["Pembukaan","Yasin dan tahlil","Pengajian Aswaja","Doa penutup","Ramah tamah"],ph:[0,1,2,3]}],
["Laporan","Launching QRIS, MWCNU Pondok Aren Melangkah Maju dari Koin NU","7 Juli 2025","Peluncuran QRIS sebagai langkah lanjutan program Koin NU.",null,"",{lead:"Peluncuran QRIS menjadi langkah maju dari program Koin NU di Pondok Aren.",p:["Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren meluncurkan QRIS sebagai langkah maju dari program Koin NU.","Dokumentasi peluncuran tayang di kanal TVNU Pondok Aren pada 7 Juli 2025."],vid:[4]}],
["Laporan","Turba MWCNU Pondok Aren di PRNU Jurangmangu Timur","5 September 2024","Kunjungan pengurus MWCNU ke ranting dalam kegiatan Turba.",null,"",{lead:"Pengurus MWCNU Pondok Aren mengunjungi ranting dalam kegiatan Turba.",p:["Majelis Wakil Cabang Nahdlatul Ulama (MWCNU) Pondok Aren melaksanakan Turba di Pengurus Ranting NU (PRNU) Jurangmangu Timur.","Dokumentasi kegiatan tayang di kanal TVNU Pondok Aren pada 5 September 2024."],vid:[5]}]],MW.byDate);
var nt=document.getElementById('ntabs'),ng=document.getElementById('newsGrid'),cats=['Semua','Berita','Laporan','Literasi'],curN=[],curCat='Semua';
function nImg(src,alt,cls){return '<img'+(cls?' class="'+esc(cls)+'"':'')+' loading="lazy" src="'+esc(safeURL(src))+'" alt="'+esc(alt)+'">'}
function renderArticle(i){if(!N)return;var n=N[i];if(!n){location.hash='#berita';return}
var x=n[6]||{},ps=x.p||[],w=(n[1]+' '+(x.lead||'')+' '+ps.join(' ')).split(/\s+/).length,rt=Math.max(1,Math.round(w/180));
var hero=n[4]==null?'<div class="ah ah0"><span></span></div>':'<figure class="af">'+nImg(PH[n[4]],n[1],'ah')+(x.cap?'<figcaption>'+esc(x.cap)+'</figcaption>':'')+'</figure>';
var h='<div class="crumb"><a href="#berita">&larr; Kabar dan Berita</a><span>/</span><span>'+esc(n[0])+'</span></div><div class="kick">'+esc(n[0])+'</div><h1 class="at">'+esc(n[1])+'</h1><p class="al">'+esc(x.lead||n[3])+'</p><div class="by"><span class="byav">M</span><span><b>'+(x.author?esc(x.author):'Redaksi MWCNU Pondok Aren')+'</b><small>'+n[2]+' &nbsp;|&nbsp; '+rt+' menit baca</small></span></div>'+(x.tag?'<div class="ntags ntags-lg">'+x.tag.split(',').map(function(t){return t.trim()}).filter(Boolean).slice(0,6).map(function(t){return '<span class="ntag">'+esc(t)+'</span>'}).join('')+'</div>':'')+hero+'<div class="abody'+(x.fontA==='Serif'?' art-serif':x.fontA==='Sans'?' art-sans':'')+(x.drop?' art-drop':'')+'">';
ps.forEach(function(t,k){h+='<p>'+(k==0?'<strong class="dl">PONDOK AREN</strong> &ndash; ':'')+esc(t)+'</p>'});
if(x.info)h+='<div class="ai"><h3>Sekilas kegiatan</h3><dl>'+x.info.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>'}).join('')+'</dl></div>';
if(x.list)h+='<h3>Rangkaian acara</h3><ol class="alist">'+x.list.map(function(t){return '<li>'+esc(t)+'</li>'}).join('')+'</ol>';
if(x.ph)h+='<h3>Foto kegiatan</h3><div class="aph">'+x.ph.filter(function(k){return PH[k]}).map(function(k){return nImg(PH[k],'Foto kegiatan','')}).join('')+'</div>';
if(x.vid)h+='<h3>Tonton di TVNU Pondok Aren</h3>'+x.vid.filter(function(k){return V[k]&&/^[\w-]{11}$/.test(V[k][0])}).map(function(k){return '<a class="avid" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v='+encodeURIComponent(V[k][0])+'"><span class="play sm"></span><span><b>'+esc(V[k][1])+'</b><small>'+esc(V[k][2])+', TVNU Pondok Aren</small></span></a>'}).join('');
h+='</div><div class="ashare"><b>Bagikan</b><a class="x" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(n[1]+' '+location.href)+'">WhatsApp</a><button class="x" id="cpl">Salin tautan</button></div>';
var rel=N.filter(function(m,k){return k!=i}).slice(0,3);
if(rel.length)h+='<h3 class="rh">Berita lainnya</h3><div class="rel">'+rel.map(function(m){return '<a class="rcard" href="#berita/'+N.indexOf(m)+'"><small>'+esc(m[0])+', '+esc(m[2])+'</small><b>'+esc(m[1])+'</b></a>'}).join('')+'</div>';
put(document.getElementById('arBody'),h);
try{document.title=(x.metaT||n[1])+' | MWCNU Pondok Aren';var md=document.querySelector('meta[name="description"]');if(md)md.setAttribute('content',x.metaD||n[3]||'')}catch(e){}
var cp=document.getElementById('cpl');cp.onclick=function(){var u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){cp.textContent='Tautan tersalin'},function(){cp.textContent='Salin dari bilah alamat'})}}
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
var meta='<div class="meta">'+(i==0?'<span class="chip top">Terbaru</span>':'')+'<span class="chip">'+n[0]+'</span><small>'+n[2]+' &middot; '+rtOf(n)+' menit baca</small></div>';
if(n[6]&&n[6].tag){var _tg=n[6].tag.split(',').map(function(t){return t.trim()}).filter(Boolean).slice(0,4);if(_tg.length)meta+='<div class="ntags">'+_tg.map(function(t){return '<span class="ntag">'+esc(t)+'</span>'}).join('')+'</div>'}
var body='<div class="b">'+meta+'<h3>'+n[1]+'</h3><p>'+n[3]+'</p><span class="more">'+(i==0?'Baca laporan lengkap':'Baca selengkapnya')+'</span></div>';
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
put(a,(n[4]==null?'<div class="th ph0"><span class="ph0l"></span></div>':'<div class="th"><img loading="lazy" src="'+PH[n[4]]+'" alt=""></div>')+'<div class="b"><div class="meta"><span class="chip">'+n[0]+'</span><small>'+n[2]+' &middot; '+rtOf(n)+' menit baca</small></div><h3>'+n[1]+'</h3><p>'+n[3]+'</p><span class="more">Baca selengkapnya</span></div>');
act(a,function(){location.hash='#berita/'+N.indexOf(n)});_hn.appendChild(a)})}
var G=MW.md('galeri',function(x){return[x.judul,ph(x.foto),x.kegiatan||'']},[["Halal Bi Halal di Omah Singgah NU Alfath",4,"Halal Bi Halal"],["Sambutan di Lailatul Ijtima'",1,"Lailatul Ijtima'"],["Sambutan pada Halal Bi Halal",5,"Halal Bi Halal"],["Sambutan di Pondok Kacang Barat",2,"Lailatul Ijtima'"],["Lailatul Ijtima' di Pondok Kacang Barat",0,"Lailatul Ijtima'"],["Pengurus dan tamu undangan",6,"Halal Bi Halal"],["Rangkaian acara Halal Bi Halal",7,"Halal Bi Halal"],["Rangkaian acara Lailatul Ijtima'",3,"Lailatul Ijtima'"]]);
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
var RT=['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung','Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat','Pondok Kacang Timur','Parigi Baru','Parigi Lama'];
var BL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
var HF='"Plus Jakarta Sans",system-ui,sans-serif',BF='"Inter",system-ui,sans-serif';
var S={photo:null,rand:null,imgs:null};

function authCfg(){try{var C=window.MWC_CFG||{};return{url:C.supabaseUrl||'',key:C.supabaseKey||''}}catch(e){return{url:'',key:''}}}
function sesGet(){try{return JSON.parse(localStorage.getItem('mwc_auth')||'null')}catch(e){return null}}
function sesSet(s){try{if(s)localStorage.setItem('mwc_auth',JSON.stringify(s));else localStorage.removeItem('mwc_auth')}catch(e){}}
function profKey(){var s=sesGet();return s&&s.user&&(s.user.id||s.user.email)}
function profGet(){var k=profKey();if(!k)return null;try{return JSON.parse(localStorage.getItem('mwc_profile_'+k)||'null')}catch(e){return null}}
function profSave(p){var k=profKey();if(!k)return;try{localStorage.setItem('mwc_profile_'+k,JSON.stringify(p||{}))}catch(e){}
try{var C=authCfg(),s=sesGet();if(C.url&&C.key&&s&&s.access_token&&s.user&&!/^local-/.test(String(s.user.id))){var b={id:s.user.id,email:s.user.email||''};['nama','hp','nia','wadah','tingkat','ranting','alamat','tempat_lahir','jk','pekerjaan'].forEach(function(f){if(p[f]!==undefined)b[f]=p[f]});if(p.tanggal_lahir)b.tanggal_lahir=p.tanggal_lahir;if(p.status)b.status=p.status;fetch(C.url+'/rest/v1/profiles',{method:'POST',headers:{apikey:C.key,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify(b)}).then(function(r){if(!r.ok)throw r;return r.json()}).catch(function(){})} }catch(e){}}
function sbErr(r){return r&&r.msg?(r.code+' '+r.msg):(r&&r.message)}
function sbAuth(path,body){var C=authCfg();if(!C.url||!C.key)return Promise.reject('server');return fetch(C.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:C.key,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw sbErr(j);return j})})}
function profFetch(){var C=authCfg(),s=sesGet();if(!C.url||!C.key||!s||!s.user||/^local-/.test(String(s.user.id)))return Promise.resolve(profGet());return fetch(C.url+'/rest/v1/profiles?id=eq.'+encodeURIComponent(s.user.id)+'&select=*',{headers:{apikey:C.key,Authorization:'Bearer '+(s.access_token||C.key)}}).then(function(r){return r.ok?r.json():[]}).then(function(a){var p=a&&a[0];if(p){var l=profGet()||{};var m={nama:p.nama||l.nama||'',hp:p.hp||l.hp||'',email:p.email||s.user.email||''};try{localStorage.setItem('mwc_profile_'+profKey(),JSON.stringify(m))}catch(e){}return m}return profGet()}).catch(function(){return profGet()})}
function authMsg(t,bad){var m=$('kAuthMsg');if(m){m.textContent=t;m.style.color=bad?'#D9534F':''}}
function applyProf(){var p=profGet();if(!p)return;function set(id,v){var e=$(id);if(e&&v&&!e.value)e.value=v}set('k-nama',p.nama);set('k-hp',p.hp)}
function toggleAuth(){var s=sesGet(),ok=!!(s&&s.user),p=profGet();
$('kAuth').hidden=ok;$('kBar').hidden=!ok;$('kGate').hidden=!ok;
if(ok){$('kWho').textContent=p&&p.nama?p.nama:(s.user.email||'Pengguna');$('kProfState').textContent=p&&p.nama?'Profil sudah dibuat — tinggal lengkapi data kartu.':'Profil belum dibuat — akan dibuatkan saat Anda menyimpan kartu.';applyProf();draw()}}
function finishLogin(user,token,extra){sesSet({access_token:token||'',user:{id:user.id||('local-'+user.email),email:user.email||''}});
if(extra&&(extra.nama||extra.hp)){var p=profGet()||{};profSave({nama:extra.nama||p.nama||'',hp:extra.hp||p.hp||'',email:user.email||p.email||''})}
if(!profGet())profSave({nama:(extra&&extra.nama)||'',hp:(extra&&extra.hp)||'',email:user.email||''});
authMsg('');toggleAuth()}
$('kTabIn').addEventListener('click',function(){$('kTabIn').classList.add('on');$('kTabUp').classList.remove('on');document.querySelectorAll('#kAuthF [data-reg]').forEach(function(e){e.hidden=true});$('kAuthBtn').textContent='Masuk';$('a-pass').autocomplete='current-password'});
$('kTabUp').addEventListener('click',function(){$('kTabUp').classList.add('on');$('kTabIn').classList.remove('on');document.querySelectorAll('#kAuthF [data-reg]').forEach(function(e){e.hidden=false});$('kAuthBtn').textContent='Buat akun & profil';$('a-pass').autocomplete='new-password'});
document.querySelectorAll('#kAuthF [data-reg]').forEach(function(e){e.hidden=true});
$('kAuthF').addEventListener('submit',function(e){e.preventDefault();var em=$('a-email').value.trim().toLowerCase(),pw=$('a-pass').value,nm=$('a-nama').value.trim(),hp=$('a-hp').value.trim(),isUp=$('kTabUp').classList.contains('on');
if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return authMsg('Mohon isi email yang valid.',1);
if(pw.length<6)return authMsg('Kata sandi minimal 6 karakter.',1);
if(isUp){if(!nm)return authMsg('Mohon isi nama lengkap untuk membuat profil.',1);if(hp.replace(/\D/g,'').length<9)return authMsg('Mohon isi nomor HP yang valid.',1)}
authMsg('Memproses…');$('kAuthBtn').disabled=true;
sbAuth(isUp?'signup':'token?grant_type=password',isUp?{email:em,password:pw,options:{data:{name:nm}}}:{email:em,password:pw}).then(function(j){
  $('kAuthBtn').disabled=false;
  if(j&&!j.user&&!j.access_token&&!j.session){authMsg('Akun perlu konfirmasi. Periksa email Anda, lalu masuk.',1);return}
  var u=(j&&j.user)||(j&&j.session&&j.session.user);if(!u){authMsg('Server tidak mengembalikan sesi. Coba lagi.',1);return}
  finishLogin(u,(j.access_token||(j.session&&j.session.access_token)),{nama:nm,hp:hp});authMsg('Berhasil masuk.')
}).catch(function(err){$('kAuthBtn').disabled=false;
  var m=String(err||'');
  if(isUp&&(m.indexOf('already')>-1||m.indexOf('registered')>-1)){authMsg('Email sudah terdaftar. Silakan masuk.',1);return}
  if(!authCfg().url){authMsg('Server login tidak tersedia. Profil akan disimpan di perangkat ini.',1)}
  /* Cadangan lokal: tetap beri akses agar alur tidak buntu */
  finishLogin({id:'local-'+em,email:em},'',{nama:nm,hp:hp});authMsg('Masuk (perangkat ini).')
})});
$('kOut').addEventListener('click',function(){sesSet(null);toggleAuth();authMsg('')})
function v(id){return($(id).value||'').trim()}
function fmt(d){return d.getDate()+' '+BL[d.getMonth()]+' '+d.getFullYear()}
function fmtIso(s){var a=String(s).split('-');return a.length==3&&a[0]?parseInt(a[2],10)+' '+BL[parseInt(a[1],10)-1]+' '+a[0]:''}
function cd(s){var d=s.replace(/\D/g,''),t=0;for(var i=0;i<d.length;i++)t+=(+d[d.length-1-i])*(i%2?3:1);return(10-t%10)%10}
function lvl(){return v('k-tingkat')}
function nia(){try{var k=profKey();if(k){var r=localStorage.getItem('mwc_rand_'+k);if(r)S.rand=r}}catch(e){}
if(!S.rand){S.rand=String(Math.floor(Math.random()*999999)+1).padStart(6,'0');try{var k2=profKey();if(k2)localStorage.setItem('mwc_rand_'+k2,S.rand)}catch(e){}}
var i=RT.indexOf(v('k-rt')),rr=(lvl()=='PRNU'&&i>=0)?String(i+1).padStart(2,'0'):'00',yy=String(new Date().getFullYear()).slice(2);return'MWC-'+rr+'-'+yy+'-'+S.rand+'-'+cd(rr+yy+S.rand)}
function info(){var t=new Date(),L=lvl(),rt=v('k-rt');return{nia:nia(),nama:v('k-nama'),jk:v('k-jk'),tmp:v('k-tmp'),tgl:fmtIso(v('k-tgl')),alamat:v('k-alamat'),rt:rt,wilayah:L=='MWCNU'?'MWCNU Kec. Pondok Aren':L=='PRNU'?('PRNU'+(rt?' '+rt:'')):'',kerja:v('k-kerja'),wadah:v('k-wadah'),hp:v('k-hp'),terbit:fmt(t)}}
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
lbl(c,'NOMOR INDUK ANGGOTA',x0,176);txt(c,d.nia,x0,214,fitF(c,d.nia,mw,HF,'700',34,20),'#FFFFFF',1);
lbl(c,'NAMA LENGKAP',x0,254);txt(c,d.nama||'Nama lengkap',x0,296,fitF(c,d.nama||'Nama lengkap',mw,HF,'700',36,20),d.nama?'#FFFFFF':'rgba(255,255,255,.4)');
lbl(c,'TEMPAT, TANGGAL LAHIR',x0,334);var ttl=(d.tmp||d.tgl)?[d.tmp,d.tgl].filter(Boolean).join(', '):'Tempat, tanggal lahir';txt(c,ttl,x0,364,fitF(c,ttl,mw,BF,'600',22,15),d.tmp&&d.tgl?'#FFFFFF':'rgba(255,255,255,.4)');
lbl(c,'ALAMAT',x0,398);var al=wrap(c,d.alamat||'Alamat lengkap',mw,2,'500 20px '+BF);al.forEach(function(l,i){txt(c,l,x0,426+i*26,'500 20px '+BF,d.alamat?'#FFFFFF':'rgba(255,255,255,.4)')});
lbl(c,'WILAYAH',x0,486);txt(c,d.wilayah||'-',x0,514,fitF(c,d.wilayah||'-',290,BF,'600',21,14),'#FFFFFF');
lbl(c,'PEKERJAAN',x0+310,486);txt(c,d.kerja||'-',x0+310,514,fitF(c,d.kerja||'-',mw-310,BF,'600',21,14),'#FFFFFF');
CFG.pejabat.forEach(function(p,i){var xc=i?800:470;txt(c,p.j,xc,544,'500 14px '+BF,'rgba(255,255,255,.75)',0,'center');var sg=S.imgs.ttd[i];if(sg){var k=Math.min(170/sg.width,48/sg.height),sw=sg.width*k,sh=sg.height*k;c.drawImage(sg,xc-sw/2,594-sh,sw,sh)}c.fillStyle='rgba(255,255,255,.45)';c.fillRect(xc-130,596,260,1.5);txt(c,p.n,xc,618,fitF(c,p.n,290,HF,'700',17,11),'#FFFFFF',0,'center')});
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
qr(c,CFG.domain+'/v/'+d.nia,66,156,272);
txt(c,'PINDAI UNTUK VERIFIKASI & ABSENSI',202,484,'700 14px '+BF,'#1E4D3A',1,'center');txt(c,d.nia,202,512,fitF(c,d.nia,316,HF,'700',22,14),'#17352A',.5,'center');txt(c,CFG.web,202,538,'500 14px '+BF,'#5B6F65',0,'center');
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
async function ensure(){if(S.imgs)return;try{if(document.fonts&&document.fonts.load)await Promise.all([document.fonts.load('700 30px "Plus Jakarta Sans"'),document.fonts.load('500 20px "Inter"'),document.fonts.load('700 20px "Inter"'),document.fonts.load('italic 600 17px "Plus Jakarta Sans"')])}catch(e){}S.imgs={lw:await li(LW),ttd:[ink(await li(CFG.pejabat[0].ttd)),ink(await li(CFG.pejabat[1].ttd))]}}
var tm=null;
async function draw(){await ensure();var d=info();front($('k-front').getContext('2d'),d);back($('k-back').getContext('2d'),d);$('k-nia-p').textContent='Nomor induk anggota Anda dibuat otomatis: '+d.nia}
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
async function job(label,fn){if(!sesGet()||!sesGet().user){authMsg('Masuk dulu untuk membuat kartu.',1);toggleAuth();return}if(!valid())return;try{var d0=info();profSave({nama:d0.nama,hp:d0.hp,email:(sesGet().user||{}).email||'',nia:d0.nia,wadah:d0.wadah,tingkat:lvl(),ranting:d0.rt||'',alamat:d0.alamat,tempat_lahir:d0.tmp,tanggal_lahir:v('k-tgl'),jk:d0.jk,pekerjaan:d0.kerja||''})}catch(e){}msg('Menyiapkan '+label+'\u2026');try{await draw();var r=await fn();msg(r==='declined'?'Penyimpanan dibatalkan.':label+' siap. Periksa folder unduhan Anda.')}catch(e){msg('Gagal menyiapkan '+label+'. Coba lagi.',1)}}
$('k-pdf').addEventListener('click',function(){job('PDF kartu',async function(){var a=await bytes($('k-front')),b=await bytes($('k-back')),mk=function(x){return{imgs:[{b:x,w:W,h:H,x:0,y:0,mw:85.6,mh:54}]}};return save('kartu-anggota-'+slug()+'.pdf',pdf([mk(a),mk(b)],85.6,54))})});
$('k-a4').addEventListener('click',function(){job('PDF A4',async function(){var a=await bytes($('k-front')),b=await bytes($('k-back')),cw=85.6,ch=54,x1=13.4,x2=x1+cw+12,y=48,L=[];[x1,x2].forEach(function(x){[[x,x+cw],[x,x+cw]].forEach(function(_,k){});var xs=[x,x+cw],ys=[y,y+ch];xs.forEach(function(px,i){ys.forEach(function(py,j){var sx=i?1:-1,sy=j?1:-1;L.push([px+sx*2,py,px+sx*6,py]);L.push([px,py+sy*2,px,py+sy*6])})})});
var pgs=[{imgs:[{b:a,w:W,h:H,x:x1,y:y,mw:cw,mh:ch},{b:b,w:W,h:H,x:x2,y:y,mw:cw,mh:ch}],lines:L,texts:[{t:'Kartu Anggota MWCNU Pondok Aren',x:13.4,y:22,s:14,g:0.1},{t:'Cetak pada ukuran 100% (jangan pilih Fit to Page), lalu potong mengikuti tanda sudut.',x:13.4,y:30,s:8},{t:'DEPAN',x:x1+4,y:y-7,s:7},{t:'BELAKANG',x:x2+4,y:y-7,s:7},{t:CFG.web,x:13.4,y:285,s:7}]}];return save('kartu-anggota-'+slug()+'-A4.pdf',pdf(pgs,210,297))})});
$('k-png').addEventListener('click',function(){job('gambar kartu',async function(){var cv=document.createElement('canvas');cv.width=W;cv.height=H*2+40;var c=cv.getContext('2d');c.fillStyle='#FFFFFF';c.fillRect(0,0,cv.width,cv.height);c.drawImage($('k-front'),0,0);c.drawImage($('k-back'),0,H+40);return save('kartu-anggota-'+slug()+'.png',await blob(cv,'image/png'))})});
$('k-wa').addEventListener('click',function(){if(!sesGet()||!sesGet().user){authMsg('Masuk dulu untuk membuat kartu.',1);toggleAuth();return}if(!valid())return;try{var d0=info();profSave({nama:d0.nama,hp:d0.hp,email:(sesGet().user||{}).email||'',nia:d0.nia,wadah:d0.wadah,tingkat:lvl(),ranting:d0.rt||'',alamat:d0.alamat,tempat_lahir:d0.tmp,tanggal_lahir:v('k-tgl'),jk:d0.jk,pekerjaan:d0.kerja||''})}catch(e){}var d=info(),t='Assalamualaikum, saya mendaftar sebagai anggota MWCNU Pondok Aren.\n\nNama: '+d.nama+'\nJenis kelamin: '+d.jk+'\nTempat, tgl lahir: '+d.tmp+', '+d.tgl+'\nAlamat: '+d.alamat+'\nTingkat/wilayah: '+d.wilayah+'\nPekerjaan: '+(d.kerja||'-')+'\nWadah khidmah: '+d.wadah+'\nNo. HP: '+d.hp+'\nNomor induk: '+d.nia+'\n\nFile kartu (PDF) dan foto saya lampirkan pada chat ini. Mohon verifikasi. Terima kasih.';msg('Membuka WhatsApp\u2026');window.open('https://wa.me/'+CFG.wa+'?text='+encodeURIComponent(t),'_blank','noopener')});
window.addEventListener('load',function(){toggleAuth();profFetch().then(function(){toggleAuth()});draw()});if(document.readyState==='complete'){toggleAuth();profFetch().then(function(){toggleAuth()});draw()}
}catch(e){}})();
/* ===== KONSULTASI AGAMA ===== */
(function(){try{
var $=function(i){return document.getElementById(i)};if(!$('konsultasi'))return;
var QA=window.MWC_QA||[];
/* Isi QA dengan data nyata, contoh: {k:'Ibadah',q:'Pertanyaan ...',a:'Jawaban ...'} */
var C=[['Ibadah','Shalat, puasa, zakat, haji'],['Akidah','Keyakinan dan keimanan'],['Akhlak & tasawuf','Adab dan pembinaan diri'],['Muamalah','Jual beli dan ekonomi syariah'],['Keluarga','Pernikahan dan rumah tangga'],['Waris & wasiat','Pembagian harta peninggalan'],['Amaliyah NU','Tahlil, maulid, ziarah, qunut'],['Lainnya','Pertanyaan di luar topik lain']];
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
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
var MT=window.MWC_MT||[];
/* Isi MT dengan data nyata, contoh: {nama:'Majelis Taklim ...',asuh:'Ust. ...',hari:'Kamis',jam:'19.30',tempat:'...',ranting:'Pondok Karya',hp:'628...'} */
var RT=['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung','Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat','Pondok Kacang Timur','Parigi Baru','Parigi Lama'];
var fr=$('mt-ranting');fr.textContent='';var all=document.createElement('option');all.value='';all.textContent='Semua ranting';fr.appendChild(all);RT.forEach(function(r){var o=document.createElement('option');o.textContent=r;fr.appendChild(o)});
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function card(m){var jd=[m.hari,m.jam].filter(Boolean).join(' · '),hp=String(m.hp||'').replace(/\D/g,'');if(hp.charAt(0)=='0')hp='62'+hp.slice(1);if(!/^62\d{8,13}$/.test(hp))hp='';return '<div class="mt-c"><b>'+esc(m.nama)+'</b>'+(m.asuh?'<p>Pengasuh: '+esc(m.asuh)+'</p>':'')+(jd?'<p>'+esc(jd)+'</p>':'')+(m.tempat?'<p>'+esc(m.tempat)+'</p>':'')+(m.ranting?'<p>Ranting '+esc(m.ranting)+'</p>':'')+(hp?'<a class="loc-btn" href="https://wa.me/'+hp+'" target="_blank" rel="noopener">Hubungi</a>':'')+'</div>'}
function draw(){var r=fr.value,q=$('mt-q').value.trim().toLowerCase(),L=MT.filter(function(m){return(!r||m.ranting==r)&&(!q||(m.nama+' '+(m.asuh||'')+' '+(m.tempat||'')).toLowerCase().indexOf(q)>-1)});
put($('mt-list'),L.length?L.map(card).join(''):'<div class="mt-e"><span>'+(MT.length?'Tidak ada majelis yang cocok dengan pencarian Anda.':'Data majelis taklim sedang dihimpun. Pengasuh dan pengurus ranting dapat mendaftarkan majelisnya melalui formulir di bawah.')+'</span><button type="button" class="loc-btn" data-go="mt-daftar">Daftarkan majelis</button></div>');$('mt-n').textContent=MT.length?L.length+' majelis':''}
fr.addEventListener('change',draw);$('mt-q').addEventListener('input',draw);draw();
$('majelis').addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(!b)return;var t=$(b.getAttribute('data-go'));if(t)t.scrollIntoView({behavior:'smooth',block:'start'})});
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
function put(el,html){if(el)el.innerHTML=html}
function imgURL(s){s=String(s||'').trim();if(/^\/(?!\/)[^\\"'<>]*$/.test(s))return s;try{var u=new URL(s,location.href);if(u.protocol==='https:'&&u.origin!==location.origin)return u.href}catch(e){}return ''}
var PAY=window.MWC_PAY||{banks:[],qris:''};
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
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
seg('dn-seg',function(b){J=b.getAttribute('data-j');$('dn-zj').hidden=J!='Zakat';$('dn-pr').hidden=J=='Zakat'});
$('dn-chips').addEventListener('click',function(e){var b=e.target.closest('button');if(b)$('dn-nom').value=dot(b.getAttribute('data-v'))});
$('dn-anon').addEventListener('change',function(){var n=$('dn-nama');n.disabled=this.checked;if(this.checked)n.value='';n.placeholder=this.checked?'Hamba Allah':''});
$('zk-pay-btn').addEventListener('click',function(){if(Z<=0)return;$('dn-seg').children[0].click();$('dn-zjenis').value=ZK;$('dn-nom').value=dot(Z);go('zk-pay')});
var box=$('pay-box'),hb='';
(PAY.banks||[]).forEach(function(b){var bank=esc(b.bank),norek=esc(b.norek),an=esc(b.an);hb+='<div class="bank"><div><b>'+bank+'</b><span>'+norek+'</span><small>a.n. '+an+'</small></div><button type="button" class="loc-btn" data-copy="'+norek+'">Salin</button></div>'});
var qris=imgURL(PAY.qris);if(qris)hb+='<div class="qr"><img src="'+esc(qris)+'" alt="QRIS MWCNU Pondok Aren"></div>';
if(!hb)hb='<div class="pay-empty"><div>Rekening dan QRIS resmi MWCNU Pondok Aren akan ditampilkan di sini. Untuk saat ini, mintalah nomor rekening atau QRIS resmi lewat WhatsApp sekretariat.</div><a class="btn wa" href="https://wa.me/6285161033689?text=Assalamualaikum%2C%20saya%20ingin%20meminta%20nomor%20rekening%20%2F%20QRIS%20resmi%20MWCNU%20Pondok%20Aren%20untuk%20zakat%2Finfaq%2Fsedekah." target="_blank" rel="noopener">Minta rekening / QRIS</a></div>';
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
var WA='6285161033689',RT=['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung','Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat','Pondok Kacang Timur','Parigi Baru','Parigi Lama'];
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
function act(){var h=location.hash.slice(1).split('/')[0],k=(h==''||h=='beranda'||h=='top')?0:(h=='berita'||h=='baca')?1:h=='agenda'?2:h=='galeri'?3:h=='kontak'?4:-1;[].forEach.call(tb.children,function(a,i){var on=i==k;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});tb.classList.remove('banom-active')}
addEventListener('hashchange',act);act();
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
(function(){var kc=document.getElementById('ka-cats'),form=document.getElementById('ka-form'),cats=[['Ibadah','Shalat, puasa, zakat, haji'],['Akidah','Keyakinan dan keimanan'],['Akhlak & tasawuf','Adab dan pembinaan diri'],['Muamalah','Jual beli dan ekonomi syariah'],['Keluarga','Pernikahan dan rumah tangga'],['Waris & wasiat','Pembagian harta peninggalan'],['Amaliyah NU','Tahlil, maulid, ziarah, qunut'],['Lainnya','Pertanyaan di luar topik lain']];if(!kc||!form)return;if(!kc.querySelector('.mt-f'))kc.innerHTML=cats.map(function(c,i){return '<button type="button" class="mt-f" data-i="'+i+'" aria-controls="ka-kat" aria-label="Pilih topik '+c[0]+'"><b>'+c[0]+'</b><small>'+c[1]+'</small></button>'}).join('');function fillSelect(id,label,values){var s=document.getElementById(id);if(!s||s.options.length>1)return;var o=document.createElement('option');o.value='';o.textContent=label;s.appendChild(o);values.forEach(function(v){var q=document.createElement('option');q.value=v;q.textContent=v;s.appendChild(q)})}var names=cats.map(function(c){return c[0]});fillSelect('ka-kat','Pilih topik',names);fillSelect('ka-fk','Semua topik',names);fillSelect('ka-rt','Pilih ranting / kelurahan',['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung','Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat','Pondok Kacang Timur','Parigi Baru','Parigi Lama']);if(kc.dataset.topicBound)return;kc.dataset.topicBound='1';kc.addEventListener('click',function(e){var b=e.target.closest('.mt-f');if(!b)return;var i=+b.dataset.i;if(!cats[i])return;var select=document.getElementById('ka-kat');if(select){select.value=cats[i][0];select.classList.remove('err');select.dispatchEvent(new Event('change',{bubbles:true}))}var header=document.querySelector('header');if(header)header.classList.add('sc');form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});setTimeout(function(){form.scrollIntoView({behavior:'auto',block:'start'});var q=document.getElementById('ka-q');if(q)q.focus({preventScroll:true})},650)})})();
