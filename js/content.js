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
    function inline(value) {
      return M.esc(value)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) { return '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>'; })
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }
    return String(s || '').replace(/\r/g, '').split(/\n\s*\n/).filter(function (b) { return b.trim(); }).map(function (block) {
      var lines = block.split('\n'), first = lines[0].trim(), m;
      if ((m = first.match(/^#{2,3}\s+(.+)$/))) return '<h3>' + inline(m[1]) + '</h3>';
      if (lines.every(function (line) { return /^\s*[-*]\s+/.test(line); })) return '<ul>' + lines.map(function (line) { return '<li>' + inline(line.replace(/^\s*[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      if (lines.every(function (line) { return /^\s*\d+[.)]\s+/.test(line); })) return '<ol>' + lines.map(function (line) { return '<li>' + inline(line.replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>';
      if (lines.every(function (line) { return /^\s*>\s?/.test(line); })) return '<blockquote><p>' + lines.map(function (line) { return inline(line.replace(/^\s*>\s?/, '')); }).join('<br>') + '</p></blockquote>';
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
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

  /* Status render: data dapat dirender ulang saat data terbaru tiba,
     tidak ada lagi guard "render sekali saja" yang menolak data Supabase. */
  var renderCount = 0;
  var lastData = null;   /* JSON string dari data terakhir yang dirender ke DOM */
  var appReady = false;  /* apakah js/app.js sudah termuat dan dieksekusi */
  var appScript = null;  /* elemen script app.js yang sedang/udah dimuat */

  function applyRender() { try { M.apply(); if (window.console) console.log('[MWC cache] applyRender dipanggil, render ke-' + renderCount); } catch (e) { if (window.console) console.error(e); } }

  /* Rute aktif (mis. #berita/<slug>) dirender app.js dari data saat M.D diterapkan.
     Setelah data remote menggantikan cache, router dipicu ulang agar halaman yang
     sedang tampil memakai data terbaru — tanpa memuat ulang halaman. */
  function rerenderRoute() {
    try { if (typeof window.MWC_RERENDER === 'function') window.MWC_RERENDER(); else window.dispatchEvent(new Event('hashchange')); } catch (e) {}
  }

  /* Terapkan data ke M.D lalu muat/terapkan js/app.js.
     Dipanggil berkali-kali aman: render ulang hanya jika data berubah. */
  function go(d) {
    var next = d || null;
    var nextJson = JSON.stringify(next);
    if (nextJson === lastData) { M.D = next; return; } /* data identik: hindari render ulang */
    M.D = next;
    lastData = nextJson;
    renderCount++;
    try { M.prep(); } catch (e) { M.D = null; }
    if (appReady) { applyRender(); rerenderRoute(); return; }
    if (appScript) return; /* app.js masih dimuat; onload akan menerapkan M.D terbaru */
    var s = document.createElement('script');
    s.src = (location.protocol === 'file:' ? 'js/app.js?v=80' : '/js/app.js?v=80');
    appScript = s;
    s.onload = function () { appReady = true; applyRender(); };
    document.body.appendChild(s);
  }

  /* Tampilkan pemberitahuan kosong/gagal hanya ketika tidak ada data sama sekali,
     tanpa menghapus konten yang masih valid dan tanpa mencipta data palsu. */
  function showEmpty(msg) {
    try {
      var el = document.getElementById('mwc-empty-state');
      if (!el) {
        el = document.createElement('div');
        el.id = 'mwc-empty-state';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        var target = document.getElementById('top') || document.body;
        target.insertBefore(el, target.firstChild);
      }
      el.textContent = msg;
    } catch (e) {}
  }

  if (!validConfig()) return go(null);
  var cache = null; try { cache = JSON.parse(localStorage.getItem('mwc_data') || 'null'); } catch (e) {}
  if (window.MWC_CFG_FALLBACK) return go(cache);
  var H = { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey };
  function q(path) { return fetch(C.supabaseUrl + '/rest/v1/' + path, { headers: H, cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }); }

  /* A. Halaman dibuka: tampilkan cache segera jika tersedia (pembukaan cepat),
     tetapi jangan anggap cache sebagai data final. Konten masih dapat diperbarui. */
  if (cache) {
    go(cache);
    if (window.console) console.log('[MWC cache] cache dirender, render ke-' + renderCount);
  } else {
    go(null);
  }

  Promise.all([q('content_items?select=type,data&published=eq.true&order=sort.asc,created_at.asc,id.asc'), q('site_settings?select=key,value&order=key.asc')]).then(function (r) {
    var d = { items: {}, set: {} };
    r[0].forEach(function (x) { (d.items[x.type] = d.items[x.type] || []).push(x.data); });
    r[1].forEach(function (x) { d.set[x.key] = x.value; });
    var next = JSON.stringify(d);
    try { localStorage.setItem('mwc_data', next); } catch (e) {}
    /* B. Supabase merespons: data remote menggantikan cache jika berbeda.
       Jika identik, jangan rendering ulang. Tidak ada pemuatan ulang halaman. */
    if (next !== lastData) {
      go(d);
      if (window.console) console.log('[MWC cache] data remote menggantikan cache, render ke-' + renderCount + ', DOM sekarang: ' + (document.querySelector('#baca figure.af img.ah') ? document.querySelector('#baca figure.af img.ah').getAttribute('src').slice(-40) : '-'));
    } else {
      if (window.console) console.log('[MWC cache] data remote sama dengan cache, tidak ada rendering ulang');
    }
  }).catch(function (err) {
    /* C & D. Supabase gagal: pertahankan cache terakhir; jika belum ada cache,
       tampilkan empty/error state, jangan halaman kosong tanpa penjelasan,
       jangan buat data palsu. */
    if (!cache) {
      showEmpty('Data terbaru tidak tersedia saat ini. Tampilan menggunakan data bawaan.');
    }
    if (window.console) console.error('[MWC cache] Supabase gagal:', err);
  });
})();
