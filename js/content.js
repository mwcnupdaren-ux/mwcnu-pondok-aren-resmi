/* Pemuat konten CMS: mengambil data dari Supabase lalu menjalankan js/app.js.
   Jika Supabase belum diisi / gagal / lambat, situs memakai data bawaan di app.js. */
(function () {
  var C = window.MWC_CFG || {};
  var BL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  var M = window.MWC = { D: null, R: [] };
  M.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  M.tgl = function (iso) { var p = String(iso || '').split('-'); return p.length == 3 && +p[0] ? (+p[2]) + ' ' + BL[+p[1] - 1] + ' ' + p[0] : String(iso || ''); };
  M.lines = function (s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  M.paras = function (s) { return String(s || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  M.kv = function (s) { return M.lines(s).map(function (l) { var i = l.indexOf(':'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }); };
  M.yt = function (s) { s = String(s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : s; };
  M.mark = function (s) { return M.esc(s).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>'); };
  /* teks kaya sederhana: "## Judul", "- butir", paragraf dipisah baris kosong, **tebal** */
  M.rich = function (s) {
    var out = [], list = false;
    String(s || '').split('\n').forEach(function (l) {
      l = l.trim();
      var b = M.esc(l).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (/^- /.test(l)) { if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + b.slice(2) + '</li>'); return; }
      if (list) { out.push('</ul>'); list = false; }
      if (/^## /.test(l)) out.push('<h3>' + b.slice(3) + '</h3>'); else if (l) out.push('<p>' + b + '</p>');
    });
    if (list) out.push('</ul>');
    return out.join('');
  };
  M.set = function (k) { var D = M.D; return D && D.set ? D.set[k] || null : null; };
  M.managed = function (t) { var D = M.D; return !!(D && D.set && D.set.managed && D.set.managed[t]); };
  M.raw = function (t) { return (M.D && M.D.items[t]) || []; };
  /* md(jenis, pemetaan, bawaan, pembanding): data CMS bila dikelola, jika tidak data bawaan */
  M.md = function (t, f, d, cmp) {
    if (!M.managed(t)) return d;
    var a = M.raw(t).slice(); if (cmp) a.sort(cmp);
    return a.map(f).filter(function (x) { return x != null; });
  };
  M.byDate = function (a, b) { return String(b.tanggal || '').localeCompare(String(a.tanggal || '')); };
  M.grp = function (def) {
    if (!M.managed('pengurus')) return def;
    var o = {}; ['Mustasyar', 'Syuriyah', 'Tanfidziyah', 'Badan otonom'].forEach(function (k) { o[k] = []; });
    M.raw('pengurus').forEach(function (x) { (o[x.bagian] = o[x.bagian] || []).push([x.jabatan, x.nama]); });
    return o;
  };
  M.tok = function (s) { M.R.forEach(function (r) { s = String(s).split(r[0]).join(r[1]); }); return s; };
  M.safeImage = function (s) { s = String(s || '').trim(); if (/^\/(?!\/)[^\\"'<>]*$/.test(s)) return s; try { var u = new URL(s, location.href); if (u.protocol === 'https:' && u.origin !== location.origin) return u.href; } catch (e) {} return ''; };
  M.safeSocial = function (s, host) { try { var u = new URL(String(s || '').trim()); var hosts = { facebook: /(^|\.)facebook\.com$/i, instagram: /(^|\.)instagram\.com$/i, tiktok: /(^|\.)tiktok\.com$/i, youtube: /(^|\.)youtube\.com$/i }; return u.protocol === 'https:' && hosts[host] && hosts[host].test(u.hostname) ? u.href : ''; } catch (e) { return ''; } };

  /* daftar penggantian token untuk nomor WA, email, medsos, alamat */
  M.prep = function () {
    var S = (M.D && M.D.set) || {}, k = S.kontak || {}, m = S.medsos || {}; M.R = [];
    function add(o, n) { n = String(n == null ? '' : n).trim(); if (n && o !== n) M.R.push([o, n]); }
    add('6285161033689', String(k.wa || '').replace(/\D/g, ''));
    add('0851-6103-3689', k.wa_tampil);
    add('mwcnu.pdaren@gmail.com', k.email);
    add('Jl. Garuda Raya No. 107A, Kel. Jurangmangu Timur, Kec. Pondok Aren, Kota Tangerang Selatan', k.alamat);
    add('https://web.facebook.com/mwcnupdaren', M.safeSocial(m.facebook, 'facebook'));
    add('https://www.instagram.com/mwcnupondokaren/', M.safeSocial(m.instagram, 'instagram'));
    add('https://www.tiktok.com/@mwcnupdaren', M.safeSocial(m.tiktok, 'tiktok'));
    add('https://www.youtube.com/@TVNUPondokAren', M.safeSocial(m.youtube, 'youtube'));
    if (S.pay) window.MWC_PAY = S.pay;
    if (M.managed('majelis')) window.MWC_MT = M.raw('majelis');
    if (M.managed('tanya_jawab')) window.MWC_QA = M.raw('tanya_jawab');
    var o = window.open;
    window.open = function (u) { var a = [].slice.call(arguments); if (typeof u === 'string') a[0] = M.tok(u); return o.apply(window, a); };
  };

  /* menerapkan teks & gambar ke halaman setelah app.js berjalan */
  M.apply = function () {
    var D = M.D; if (!D || !D.set) return;
    var S = D.set;
    function get(p) { var v = S, a = p.split('.'); for (var i = 0; i < a.length && v != null; i++) v = v[a[i]]; return v; }
    [].forEach.call(document.querySelectorAll('[data-cms]'), function (e) {
      var v = get(e.getAttribute('data-cms')); if (v == null || v === '') return;
      if (e.hasAttribute('data-cms-md')) e.innerHTML = M.mark(v); else e.textContent = v;
    });
    [].forEach.call(document.querySelectorAll('[data-cms-src]'), function (e) {
      var v = M.safeImage(get(e.getAttribute('data-cms-src'))); if (v) e.setAttribute('src', v);
    });
    /* Tipografi global (Pengaturan ? Tipografi & Bacaan) */
    var tg = S.tipografi || {}, fam = function (n) { return n === 'Serif' ? "Georgia,'Times New Roman',serif" : n === 'Plus Jakarta Sans' ? "'Plus Jakarta Sans',system-ui,sans-serif" : "'Inter',system-ui,sans-serif"; };
    var root = document.documentElement;
    if (tg.font_judul) root.style.setProperty('--art-judul', fam(tg.font_judul));
    if (tg.font_isi) root.style.setProperty('--art-font', fam(tg.font_isi));
    var sz = parseFloat(tg.ukuran_isi); if (sz && sz >= 14 && sz <= 20) root.style.setProperty('--art-size', sz + 'px');
    var lh = parseFloat(tg.jarak_baris); if (lh && lh >= 1.4 && lh <= 2.2) root.style.setProperty('--art-lh', String(lh));
    try { if (tg.dropcap) document.body.classList.add('art-drop-global'); } catch (e) {}
    if (S.sambutan && S.sambutan.nama) [].forEach.call(document.querySelectorAll('[data-cms-src="sambutan.foto"]'), function (e) { if (e.alt.indexOf('H. Fathur Rahman') === 0) e.alt = e.alt.replace('H. Fathur Rahman', String(S.sambutan.nama)); });
    if (M.R.length) {
      var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, ns = [];
      while ((n = w.nextNode())) { if (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) continue; ns.push(n); }
      ns.forEach(function (t) { var v = t.nodeValue, x = M.tok(v); if (x !== v) t.nodeValue = x; });
      [].forEach.call(document.querySelectorAll('a[href]'), function (a) {
        var v = a.getAttribute('href'), x = M.tok(v);
        if (x === v) return;
        try { var u = new URL(x, location.href); a.setAttribute('href', /^(https?:|mailto:|tel:)$/.test(u.protocol) || x.charAt(0) === '#' ? x : '#'); }
        catch (e) { a.setAttribute('href', '#'); }
      });
    }
    var z = S.zakat;
    if (z && z.harga_emas) {
      var inp = document.getElementById('zk-emas');
      if (inp) { inp.value = String(z.harga_emas).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      var note = document.querySelector('#zk-calc .zk-s');
      if (note && z.acuan) note.textContent = 'Acuan: harga jual emas ' + z.acuan + '. Ubah sesuai harga terbaru. Nisab zakat = 85 gram emas.';
    }
    M.raw('halaman').forEach(function (h) {
      var sec = h.slug && document.getElementById(h.slug); if (!sec || sec.hasAttribute('data-cms-off')) return;
      var wrap = sec.querySelector('.wrap'), back = wrap && wrap.querySelector('.back'); if (!wrap || !back) return;
      if (h.judul) { var t = wrap.querySelector('h2'); if (t) t.textContent = h.judul; }
      while (back.nextSibling) wrap.removeChild(back.nextSibling);
      var d = document.createElement('div'); d.className = 'pg-body';
      var foto = M.safeImage(h.foto);
      d.innerHTML = (foto ? '<img class="pg-img" alt="" src="' + M.esc(foto) + '">' : '') + M.rich(h.isi);
      wrap.appendChild(d);
    });
  };

  function validConfig() { try { var u = new URL(String(C.supabaseUrl || '')); return u.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/i.test(u.hostname) && /^((sb_publishable_[A-Za-z0-9_-]+)|(eyJ[A-Za-z0-9._-]+))$/.test(String(C.supabaseKey || '')); } catch (e) { return false; } }
  var rendered = false;
  function go(d) {
    if (rendered) return; rendered = true; M.D = d || null;
    try { if (d) M.prep(); } catch (e) { M.D = null; }
    var s = document.createElement('script'); s.src = '/js/app.js?v=42';
    s.onload = function () { try { M.apply(); } catch (e) { if (window.console) console.error(e); } };
    document.body.appendChild(s);
  }
  if (!validConfig()) return go(null);
  var cache = null; try { cache = JSON.parse(localStorage.getItem('mwc_data') || 'null'); } catch (e) {}
  if (window.MWC_CFG_FALLBACK) return go(cache);
  var H = { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey };
  function q(path) { return fetch(C.supabaseUrl + '/rest/v1/' + path, { headers: H, cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }); }
  /* Penanda sekali pakai: mencegah halaman memuat ulang berulang saat data CMS berubah. */
  function syncFlag(v) { try { if (v) sessionStorage.setItem('mwc_sync', '1'); else sessionStorage.removeItem('mwc_sync'); } catch (e) {} }
  function synced() { try { return sessionStorage.getItem('mwc_sync') === '1'; } catch (e) { return true; } }
  /* Cache dipakai lebih dulu agar halaman langsung terisi; data terbaru menyusul. */
  var timer = setTimeout(function () { go(cache); }, cache ? 0 : 3000);
  Promise.all([q('content_items?select=type,data&published=eq.true&order=sort.asc,created_at.asc,id.asc'), q('site_settings?select=key,value&order=key.asc')]).then(function (r) {
    var d = { items: {}, set: {} };
    r[0].forEach(function (x) { (d.items[x.type] = d.items[x.type] || []).push(x.data); });
    r[1].forEach(function (x) { d.set[x.key] = x.value; });
    var next = JSON.stringify(d), prev = null;
    try { prev = localStorage.getItem('mwc_data'); localStorage.setItem('mwc_data', next); } catch (e) {}
    clearTimeout(timer);
    if (!rendered) { syncFlag(false); go(d); return; } /* belum tampil: langsung pakai data terbaru */
    if (prev === next) { syncFlag(false); return; } /* sudah sama dengan cache */
    if (synced()) { syncFlag(false); return; }      /* sudah pernah dimuat ulang pada kunjungan ini */
    /* Jangan reload saat pengguna sedang mengisi formulir yang belum dikirim,
       agar isian KTA/zakat/layanan tidak hilang tanpa konfirmasi. */
    var hasDraft = false;
    try {
      hasFormCheck: {
        var els = document.querySelectorAll('input:not([type=hidden]):not([type=search]), textarea, select');
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          if (el.disabled || el.readOnly) continue;
          if (el.type === 'checkbox' || el.type === 'radio' || el.type === 'submit' || el.type === 'button') continue;
          if (String(el.value || '').trim()) { hasDraft = true; break hasFormCheck; }
        }
      }
    } catch (e) {}
    if (hasDraft && !confirm('Ada perubahan konten baru di CMS. Halaman akan dimuat ulang, tetapi isian formulir Anda yang belum dikirim akan hilang. Muat ulang sekarang?')) {
      syncFlag(false); return; /* coba lagi pada kunjungan berikutnya */
    }
    syncFlag(true); location.reload();              /* tampilkan perubahan CMS yang baru disimpan */
  }).catch(function () { clearTimeout(timer); go(cache); });
})();
