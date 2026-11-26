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
      /* Penanda gaya dikenali sebelum escaping (lihat articleInlineHTML). */
      var marks = [];
      function mark(open, body) { var i = marks.length; marks.push(open); return '\u0001' + i + '\u0001' + body + '\u0002'; }
      var raw = String(value == null ? '' : value).replace(/<(size=(\d{2})|align=(left|center|right))>(.*?)<\/(?:size|align)>/g, function (all, attr, px, al, body) {
        if (px) { var n = +px; return n >= 12 && n <= 72 ? mark('<span data-fs="' + n + '">', body) : body; }
        return mark('<span data-al="' + al + '">', body);
      });
      return M.esc(raw)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) { return '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>'; })
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/~~(.+?)~~/g, '<s>$1</s>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\u0001(\d+)\u0001/g, function (_, i) { return marks[+i] || ''; })
        .replace(/\u0002/g, '</span>');
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
  /* Profil penulis terbit (tabel author_profiles). */
  M.authors = function () { return (M.D && Array.isArray(M.D.authors)) ? M.D.authors : []; };
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
  /* shownRaw: bentuk JSON data yang benar-benar sedang tampil, dipakai untuk
     memastikan halaman hanya dimuat ulang bila isinya memang berbeda. */
  var rendered = false, shownRaw = null;
  function go(d) {
    if (rendered) return; rendered = true; shownRaw = d ? JSON.stringify(d) : 'null'; M.D = d || null;
    try { if (d) M.prep(); } catch (e) { M.D = null; }
    var s = document.createElement('script'); s.src = (location.protocol === 'file:' ? 'js/app.js?v=79' : '/js/app.js?v=79');
    s.onload = function () { try { M.apply(); } catch (e) { if (window.console) console.error(e); } };
    document.body.appendChild(s);
  }
  if (!validConfig()) return go(null);
  /* Data cache terakhir: dipakai agar halaman langsung terisi sebelum data
     terbaru dari server tiba. */
  var cache = null;
  try { cache = JSON.parse(localStorage.getItem('mwc_data') || 'null'); } catch (e) { cache = null; }
  if (window.MWC_CFG_FALLBACK) return go(cache);
  var H = { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey };
  function q(path) { return fetch(C.supabaseUrl + '/rest/v1/' + path, { headers: H, cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }); }
  /* Penanda sekali pakai: mencegah halaman memuat ulang berulang saat data CMS berubah. */
  function syncFlag(v) { try { if (v) sessionStorage.setItem('mwc_sync', '1'); else sessionStorage.removeItem('mwc_sync'); } catch (e) {} }
  function synced() { try { return sessionStorage.getItem('mwc_sync') === '1'; } catch (e) { return true; } }
  /* Isian hanya dianggap draf bila pengguna sendiri yang mengubahnya.
     Nilai awal dari CMS (mis. harga emas zakat) dan event programatik tidak
     boleh menahan pembaruan data, karena dulu itu membuat data lama bertahan
     sampai pengguna me-refresh manual. */
  function markDraft(e) {
    if (!e.isTrusted) return;
    var t = e.target;
    if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (t.type === 'hidden' || t.type === 'search' || t.type === 'checkbox' || t.type === 'radio' || t.type === 'submit' || t.type === 'button') return;
    t.setAttribute('data-mwc-dirty', '1');
  }
  document.addEventListener('input', markDraft, true);
  document.addEventListener('change', markDraft, true);
  /* Cache dipakai lebih dulu agar halaman langsung terisi (tidak kosong).
     Bila data server ternyata berbeda, halaman dimuat ulang sekali saja
     setelah data terbaru diterima (lihat blok perbandingan di bawah).
     Tanpa cache, beri waktu data terbaru datang sebelum memakai data bawaan. */
  var timer = setTimeout(function () { go(cache); }, cache ? 0 : 3000);
  Promise.all([q('content_items?select=type,data&published=eq.true&order=sort.asc,created_at.asc,id.asc'), q('site_settings?select=key,value&order=key.asc'), q('author_profiles?select=id,nama,foto,bidang,pendidikan,pengalaman,bio,kontak&order=nama.asc').then(function (v) { return Array.isArray(v) ? v : []; }).catch(function () { return null; })]).then(function (r) {
    var d = { items: {}, set: {} };
    r[0].forEach(function (x) { (d.items[x.type] = d.items[x.type] || []).push(x.data); });
    r[1].forEach(function (x) { d.set[x.key] = x.value; });
    /* Profil penulis: disimpan terpisah dari items agar tidak tercampur konten.
       Filter published TIDAK dipakai di query: hak select anon pada tabel ini
       hanya diberikan per-kolom (tanpa kolom published), sehingga WHERE pada
       kolom itu ditolak 42501. Penyaringan baris sudah dilakukan RLS di server
       (author_read: published or milik sendiri or can_review), jadi hasil untuk
       anon tetap hanya profil yang sudah disetujui.
       Bila query gagal, pakai profil dari cache agar kegagalan sementara tidak
       menghapus data yang masih valid. */
    d.authors = Array.isArray(r[2]) ? r[2] : (cache && Array.isArray(cache.authors) ? cache.authors : []);
    var next = JSON.stringify(d);
    try { localStorage.setItem('mwc_data', next); } catch (e) {}
    clearTimeout(timer);
    if (!rendered) { syncFlag(false); go(d); return; } /* belum tampil: langsung pakai data terbaru */
    /* Isi halaman sudah sama dengan data server: tidak perlu reload. Perbandingan
       ini juga mencegah reload sia-sia saat situs dibuka di tab atau sesi baru. */
    if (shownRaw === next) { syncFlag(false); return; }
    if (synced()) { syncFlag(false); return; }       /* sudah pernah dimuat ulang pada kunjungan ini */
    /* Jangan reload diam-diam saat ada isian yang benar-benar diubah pengguna.
       Data CMS baru sudah masuk cache dan akan tampil pada pemuatan berikutnya. */
    var hasDraft = false;
    try {
      var els = document.querySelectorAll('[data-mwc-dirty]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.disabled || el.readOnly) continue;
        if (String(el.value || '').trim()) { hasDraft = true; break; }
      }
    } catch (e) {}
    if (hasDraft) { syncFlag(false); return; }       /* pakai data baru pada pemuatan berikutnya */
    /* Tampilkan perubahan CMS yang baru disimpan. Flag mwc_sync sekali pakai
       hanya disetel tepat sebelum reload agar tidak terjadi reload berulang. */
    syncFlag(true); location.reload();
  }).catch(function () { clearTimeout(timer); go(cache); });
})();
