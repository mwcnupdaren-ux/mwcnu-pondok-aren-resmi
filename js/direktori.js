/* Direktori organisasi (FASE 2) — pengurus, struktur, ranting, detail orang.
   Sumber data: view public.directory_public + tabel public.organizational_units
   (lihat supabase/direktori-organisasi.sql). Semua baris sudah dibatasi RLS;
   kolom email internal tidak pernah diminta di sini.

   PRINSIP ANTI-REGRESI
   Modul ini hanya mengambil alih tampilan jika Supabase mengembalikan baris.
   Bila tabel belum dibuat, kosong, atau gagal dimuat, tampilan lama yang
   dirender js/app.js dibiarkan apa adanya — tidak ada halaman kosong. */
(function () {
  var CFG = window.MWC_CFG || {};
  var esc = function (s) { return window.mwcEsc(s); };
  var D = { rows: null, units: null, ok: false, busy: false, tried: false };
  var F = { tab: '', q: '', jab: '', unit: '', rt: '' };

  /* ---------- util ---------- */
  function get(path) {
    return fetch(CFG.supabaseUrl + '/rest/v1/' + path, {
      headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey },
      cache: 'no-store'
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }
  function safeImg(u) {
    u = String(u || '').trim();
    if (/^\/(?!\/)[^\\"'<>]*$/.test(u)) return u;
    try { var x = new URL(u, location.href); if (x.protocol === 'https:') return x.href; } catch (e) {}
    return '';
  }
  var GELAR = /^(dr|drs|dra|prof|k|kh|h|hj|ust|ustadz|ustadzah|lc|s|m|a|se|ss|sh|mm|mpd|mag|si|kom|sos|pd|ag|q|sq|hc|csp|cpm|ciisa|phd|ma|mh)$/i;
  function ini(n) {
    var w = String(n || '').replace(/\(hc\)/gi, ' ').replace(/[.,]/g, ' ')
      .split(/\s+/).filter(function (t) { return t && !GELAR.test(t); });
    return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase();
  }
  function avatar(p, cls) {
    var u = safeImg(p.photo);
    if (u) return '<span class="av dir-av' + (cls ? ' ' + cls : '') + '" aria-hidden="true" style="background-image:url(&quot;' + esc(u) + '&quot;)"></span>';
    return '<span class="av' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + esc(ini(p.name)) + '</span>';
  }
  var KIND = {
    mwc: 'MWC', prnu: 'PRNU', syuriyah: 'Syuriyah', tanfidziyah: 'Tanfidziyah',
    lembaga: 'Lembaga', badan_khusus: 'Badan Khusus', banom: 'Badan Otonom'
  };
  function kindLabel(k) { return KIND[k] || 'Unit'; }
  function terms() {
    var t = '';
    (D.rows || []).forEach(function (r) { if (r.is_current && !t) t = r.term_label || ''; });
    return t;
  }

  /* ---------- olah data ---------- */
  /* Satu orang = satu slug. items = semua jabatan (bisa lintas unit/masa). */
  function people() {
    var m = {}, order = [];
    (D.rows || []).forEach(function (r) {
      if (!m[r.slug]) {
        m[r.slug] = { slug: r.slug, name: r.full_name, photo: r.photo_url, bio: r.bio, items: [] };
        order.push(r.slug);
      }
      m[r.slug].items.push(r);
    });
    return order.map(function (k) { return m[k]; });
  }
  function primary(p) {
    return p.items.slice().sort(function (a, b) {
      return (a.unit_sort - b.unit_sort) || (a.position_rank - b.position_rank);
    })[0];
  }
  function unitNames() {
    var seen = {}, out = [];
    (D.rows || []).forEach(function (r) {
      if (!seen[r.unit_code]) { seen[r.unit_code] = 1; out.push({ code: r.unit_code, name: r.unit_name, sort: r.unit_sort, n: 0 }); }
    });
    var idx = {};
    out.forEach(function (u) { idx[u.code] = u; });
    people().forEach(function (p) {
      var seen2 = {};
      p.items.forEach(function (r) { if (!seen2[r.unit_code]) { seen2[r.unit_code] = 1; if (idx[r.unit_code]) idx[r.unit_code].n++; } });
    });
    return out.sort(function (a, b) { return a.sort - b.sort; });
  }
  function positions() {
    var seen = {}, out = [];
    (D.rows || []).forEach(function (r) { if (!seen[r.position_name]) { seen[r.position_name] = 1; out.push(r.position_name); } });
    return out;
  }
  function rantingList() {
    return (D.units || []).filter(function (u) { return u.kind === 'prnu'; })
      .sort(function (a, b) { return String(a.prnu_code || '').localeCompare(String(b.prnu_code || '')); });
  }
  function unitByCode(code) {
    return (D.units || []).filter(function (u) { return u.code === code; })[0] || null;
  }

  /* ---------- ambil data ---------- */
  function load() {
    if (D.busy) return Promise.resolve(D);
    if (D.tried) return Promise.resolve(D);
    if (!CFG.supabaseUrl || !CFG.supabaseKey) { D.tried = true; return Promise.resolve(D); }
    D.busy = true;
    var COLS = 'id,is_current,slug,full_name,photo_url,bio,unit_code,unit_name,kind,prnu_code,unit_sort,position_rank,position_name,term_label,starts_on,ends_on';
    var UCOLS = 'id,parent_id,code,name,kind,prnu_code,sort_order,is_public';
    return Promise.all([
      get('directory_public?select=' + COLS + '&order=unit_sort.asc,position_rank.asc,full_name.asc'),
      get('organizational_units?select=' + UCOLS + '&order=sort_order.asc,name.asc')
    ]).then(function (r) {
      D.rows = r[0] || [];
      D.units = r[1] || [];
      D.ok = D.units.length > 0;
      return D;
    }).catch(function () {
      D.rows = []; D.units = []; D.ok = false; return D;
    }).then(function (d) { D.busy = false; D.tried = true; return d; });
  }

  /* ---------- panel pengurus (dalam #struktur) ---------- */
  function matches(r) {
    if (F.tab && r.unit_code !== F.tab) return false;
    if (F.jab && r.position_name !== F.jab) return false;
    if (F.unit && r.unit_code !== F.unit) return false;
    if (F.rt && String(r.prnu_code || '') !== F.rt) return false;
    if (F.q) {
      var q = F.q.toLowerCase();
      if (String(r.full_name + ' ' + r.position_name + ' ' + r.unit_name).toLowerCase().indexOf(q) < 0) return false;
    }
    return true;
  }
  function cardFor(r) {
    return '<button type="button" class="person" data-slug="' + esc(r.slug) + '">'
      + avatar({ name: r.full_name, photo: r.photo_url })
      + '<span><b>' + esc(r.full_name) + '</b><small>' + esc(r.position_name + ' · ' + r.unit_name) + '</small></span></button>';
  }
  function renderPanel() {
    var panel = document.getElementById('panel');
    if (!panel) return;
    var rows = (D.rows || []).filter(matches);
    /* satu orang bisa punya >1 jabatan di unit yang sama: tampilkan sekali */
    var seen = {}, list = [];
    rows.forEach(function (r) { var k = r.slug + '|' + r.unit_code; if (!seen[k]) { seen[k] = 1; list.push(r); } });

    if (!list.length) {
      panel.innerHTML = '<div class="empty-sk"><b>Tidak ada pengurus yang cocok</b><p>Coba ubah kata kunci atau filter yang dipilih.</p><button type="button" class="btn o2" data-dir-reset>Reset filter</button></div>';
      return;
    }
    var groups = {}, order = [];
    list.forEach(function (r) {
      if (!groups[r.position_name]) { groups[r.position_name] = { rank: r.position_rank, items: [] }; order.push(r.position_name); }
      groups[r.position_name].items.push(r);
    });
    order.sort(function (a, b) { return groups[a].rank - groups[b].rank; });
    var uniq = {};
    list.forEach(function (r) { uniq[r.slug] = 1; });
    var nOrang = Object.keys(uniq).length;
    var h = '<p class="sres" aria-live="polite">' + nOrang + ' pengurus'
      + (list.length !== nOrang ? ' · ' + list.length + ' jabatan' : '')
      + ' ditampilkan' + (F.q ? ' untuk &ldquo;' + esc(F.q) + '&rdquo;' : '') + '.</p>';
    order.forEach(function (pos) {
      h += '<div class="grp"><h3>' + esc(pos) + '<em>' + groups[pos].items.length + '</em></h3><div class="gl">'
        + groups[pos].items.map(cardFor).join('') + '</div></div>';
    });
    panel.innerHTML = h;
  }
  function renderTabs() {
    var tb = document.getElementById('tabs');
    if (!tb) return;
    var units = unitNames(), h = '';
    h += '<button type="button" data-dir-tab="" aria-selected="' + (F.tab === '' ? 'true' : 'false') + '" role="tab">Semua<small>' + people().length + '</small></button>';
    units.forEach(function (u) {
      h += '<button type="button" data-dir-tab="' + esc(u.code) + '" aria-selected="' + (F.tab === u.code ? 'true' : 'false') + '" role="tab">'
        + esc(u.name.replace(/^(Syuriyah|Tanfidziyah) MWCNU Pondok Aren$/i, '$1')) + '<small>' + u.n + '</small></button>';
    });
    tb.innerHTML = h;
  }
  function renderFilters() {
    var box = document.getElementById('dir-pengurus-filters');
    if (!box) return;
    var jabs = positions();
    var rts = rantingList();
    var h = '<label class="dir-f"><span>Jabatan</span><select data-dir-f="jab"><option value="">Semua jabatan</option>'
      + jabs.map(function (j) { return '<option value="' + esc(j) + '"' + (F.jab === j ? ' selected' : '') + '>' + esc(j) + '</option>'; }).join('')
      + '</select></label>'
      + '<label class="dir-f"><span>Ranting</span><select data-dir-f="rt"><option value="">Semua ranting</option>'
      + rts.map(function (u) { return '<option value="' + esc(u.prnu_code) + '"' + (F.rt === u.prnu_code ? ' selected' : '') + '>' + esc(u.name.replace(/^PRNU /, '')) + '</option>'; }).join('')
      + '</select></label>';
    box.innerHTML = h;
    box.hidden = false;
    /* sembunyikan filter ranting bila belum ada pengurus tingkat PRNU */
    var hasRt = (D.rows || []).some(function (r) { return r.prnu_code; });
    var rtSel = box.querySelector('[data-dir-f="rt"]');
    if (rtSel && !hasRt) rtSel.parentNode.hidden = true;
  }
  function renderStats() {
    var el = document.getElementById('skStats');
    if (!el) return;
    var p = people();
    var sy = p.filter(function (x) { return x.items.some(function (r) { return r.kind === 'syuriyah'; }); }).length;
    var tf = p.filter(function (x) { return x.items.some(function (r) { return r.kind === 'tanfidziyah'; }); }).length;
    var rt = rantingList().length || 11;
    var rows = [['Pengurus', p.length], ['Syuriyah', sy], ['Tanfidziyah', tf], ['Ranting NU', rt]];
    el.innerHTML = rows.map(function (x) {
      return '<div class="sk-stat"><b>' + x[1] + ' &nbsp;' + x[0] + '</b><small>' + x[1] + '</small></div>';
    }).join('');
  }
  /* Ambil alih #tabs/#panel/#sq dari app.js: ganti node panel agar listener
     lama (dialog pengurus statis) tidak lagi aktif, lalu pasang listener baru. */
  function takeover() {
    var panel = document.getElementById('panel');
    if (panel) { var fresh = panel.cloneNode(false); panel.parentNode.replaceChild(fresh, panel); }
    var tb = document.getElementById('tabs');
    if (tb) {
      var tb2 = tb.cloneNode(false);
      tb.parentNode.replaceChild(tb2, tb);
      tb2.addEventListener('click', function (e) {
        var b = e.target.closest('[data-dir-tab]');
        if (!b) return;
        F.tab = b.getAttribute('data-dir-tab'); F.q = '';
        var sq = document.getElementById('sq'); if (sq) sq.value = '';
        renderTabs(); renderPanel();
      });
    }
    var sq = document.getElementById('sq');
    if (sq) {
      sq.value = '';
      sq.oninput = function () { F.q = sq.value.trim(); renderPanel(); };
      sq.onkeydown = function (e) { if (e.key === 'Escape' && sq.value) { sq.value = ''; F.q = ''; renderPanel(); } };
    }
    var box = document.getElementById('dir-pengurus-filters');
    if (box) box.addEventListener('change', function (e) {
      var s = e.target.closest('[data-dir-f]');
      if (!s) return;
      F[s.getAttribute('data-dir-f')] = s.value;
      renderPanel();
    });
    var pn = document.getElementById('panel');
    if (pn) pn.addEventListener('click', function (e) {
      if (e.target.closest('[data-dir-reset]')) {
        F.q = ''; F.jab = ''; F.rt = ''; F.unit = ''; F.tab = '';
        var s2 = document.getElementById('sq'); if (s2) s2.value = '';
        renderTabs(); renderFilters(); renderPanel(); return;
      }
      var c = e.target.closest('[data-slug]');
      if (c) location.hash = '#pengurus/' + c.getAttribute('data-slug');
    });
    renderTabs(); renderFilters(); renderPanel(); renderStats();
    var head = document.querySelector('.struktur-directory-head p');
    if (head && terms()) head.textContent = 'Pilih bagian organisasi atau cari nama untuk menemukan pengurus. Masa khidmat ' + terms() + '.';
  }

  /* ---------- struktur organisasi ---------- */
  function memberCount(code) {
    var n = 0, seen = {};
    (D.rows || []).forEach(function (r) { if (r.unit_code === code && !seen[r.slug]) { seen[r.slug] = 1; n++; } });
    return n;
  }
  function nodeHtml(u, kids, depth) {
    var n = memberCount(u.code), sub = kids[u.id] || [];
    var h = '<div class="org-node d' + depth + '">'
      + '<button type="button" class="org-h"' + (n ? ' data-org="' + esc(u.code) + '"' : ' disabled') + '>'
      + '<span class="org-kind">' + esc(kindLabel(u.kind)) + '</span>'
      + '<b>' + esc(u.name) + '</b>'
      + '<small>' + (n ? n + ' pengurus' : 'belum ada data pengurus') + '</small>'
      + (n ? '<i aria-hidden="true">&rarr;</i>' : '') + '</button>';
    if (sub.length && depth < 3) h += '<div class="org-kids">' + sub.map(function (c) { return nodeHtml(c, kids, depth + 1); }).join('') + '</div>';
    return h + '</div>';
  }
  function renderStructure() {
    var box = document.getElementById('dir-struktur');
    if (!box) return;
    if (!D.units || !D.units.length) {
      box.innerHTML = '<div class="empty-sk"><b>Struktur belum tersedia</b><p>Data unit organisasi belum dimuat. Silakan hubungi sekretariat bila ini berlanjut.</p></div>';
      return;
    }
    var kids = {}, roots = [];
    D.units.forEach(function (u) { if (u.parent_id) (kids[u.parent_id] = kids[u.parent_id] || []).push(u); else roots.push(u); });
    var h = '<div class="dir-meta">' + (terms() ? '<span class="chip">Masa khidmat ' + esc(terms()) + '</span>' : '')
      + '<span>' + D.units.length + ' unit organisasi</span></div><div class="org-tree">';
    h += roots.map(function (r) { return nodeHtml(r, kids, 0); }).join('');
    h += '</div>';
    box.innerHTML = h;
    if (!box._dirBound) {
      box._dirBound = 1;
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-org]');
        if (!b) return;
        F.tab = b.getAttribute('data-org'); F.q = ''; F.jab = ''; F.rt = '';
        location.hash = '#struktur';
        setTimeout(function () { renderTabs(); renderFilters(); renderPanel(); }, 60);
      });
    }
  }

  /* ---------- direktori ranting ---------- */
  function renderRanting() {
    var box = document.getElementById('dir-ranting');
    if (!box) return;
    var list = rantingList();
    if (!list.length) {
      box.innerHTML = '<div class="empty-sk"><b>Direktori ranting belum tersedia</b><p>Daftar PRNU belum dimuat.</p></div>';
      return;
    }
    var h = '<div class="prnu-grid">';
    list.forEach(function (u) {
      var n = memberCount(u.code);
      var nama = u.name.replace(/^PRNU\s+/, '');
      h += '<button type="button" class="prnu-card" data-prnu="' + esc(u.prnu_code) + '">'
        + '<span class="prnu-code">' + esc(u.prnu_code) + '</span>'
        + '<b>' + esc(nama) + '</b>'
        + '<small>' + (n ? n + ' pengurus' : 'Pengurus belum dimasukkan') + '</small>'
        + '<i aria-hidden="true">&rarr;</i></button>';
    });
    h += '</div>';
    box.innerHTML = h;
    /* Sembunyikan pencarian & chip bawaan app.js agar tidak ada dua daftar. */
    var q0 = document.getElementById('q'), ch0 = document.getElementById('chips');
    if (q0) q0.hidden = true;
    if (ch0) ch0.hidden = true;
    if (!box._dirBound) {
      box._dirBound = 1;
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-prnu]');
        if (!b) return;
        F.rt = b.getAttribute('data-prnu'); F.tab = ''; F.q = ''; F.jab = '';
        location.hash = '#struktur';
        setTimeout(function () { renderTabs(); renderFilters(); renderPanel(); }, 60);
      });
    }
  }

  /* ---------- detail orang (#pengurus/<slug>) ---------- */
  function renderDetail(slug) {
    var box = document.getElementById('dir-detail');
    if (!box) return;
    if (!D.ok) {
      box.innerHTML = '<div class="empty-sk"><b>Direktori belum tersedia</b><p>Data direktori belum dapat dimuat. Silakan coba lagi atau hubungi sekretariat.</p><a class="btn o2" href="#struktur">Buka direktori pengurus</a></div>';
      return;
    }
    var p = people().filter(function (x) { return x.slug === slug; })[0];
    if (!p) {
      box.innerHTML = '<div class="empty-sk"><b>Pengurus tidak ditemukan</b><p>Data mungkin sudah diperbarui. Kembali ke direktori untuk melihat daftar terbaru.</p><a class="btn o2" href="#struktur">Buka direktori pengurus</a></div>';
      return;
    }
    var main = primary(p);
    var items = p.items.slice().sort(function (a, b) {
      return (a.unit_sort - b.unit_sort) || (a.position_rank - b.position_rank);
    });
    var h = '<div class="pg-person"><div class="pg-person-h">'
      + avatar({ name: p.name, photo: p.photo }, 'lg')
      + '<div><span class="pd-kick">' + esc(main.unit_name) + '</span><h1>' + esc(p.name) + '</h1>'
      + '<p class="pd-role">' + esc(main.position_name) + '</p></div></div>';
    if (p.bio) h += '<p class="pg-bio">' + esc(p.bio) + '</p>';
    h += '<h2 class="pg-sub">Jabatan &amp; masa khidmat</h2><ul class="pg-pos">';
    items.forEach(function (r) {
      h += '<li><b>' + esc(r.position_name) + '</b><span>' + esc(r.unit_name) + '</span>'
        + '<small>' + esc(r.term_label || '') + (r.is_current ? ' · aktif' : '') + '</small></li>';
    });
    h += '</ul>';
    h += '<div class="pd-act"><a class="btn" href="#kontak">Hubungi sekretariat</a><a class="btn o2" href="#struktur">Kembali ke direktori</a></div>';
    h += '<p class="pd-note">Data direktori MWCNU Pondok Aren. Perubahan data dilakukan oleh pengurus melalui sekretariat.</p>';
    box.innerHTML = h;
    try { document.title = p.name + ' — Direktori MWCNU Pondok Aren'; } catch (e) {}
  }

  /* ---------- titik masuk dari router app.js ---------- */
  function route(view, slug) {
    /* Rute yang punya halaman sendiri tetap dirender walau DB kosong,
       supaya tidak pernah muncul halaman kosong. */
    if (view === 'pengurus') { renderDetail(slug); return; }
    if (view === 'struktur-organisasi') { renderStructure(); return; }
    if (view === 'ranting') { renderRanting(); return; }
    if (!D.ok) return;
    if (view === 'struktur') { renderTabs(); renderFilters(); renderPanel(); renderStats(); }
  }

  function init() {
    load().then(function () {
      if (D.ok) takeover();
      else if (window.console) console.info('[direktori] data DB belum tersedia, memakai daftar bawaan.');
      var h = (location.hash || '').replace(/^#/, '');
      var m = h.match(/^pengurus\/([a-z0-9-]+)$/);
      route(m ? 'pengurus' : h.split('/')[0], m ? m[1] : '');
    });
  }

  window.MWCDIR = { init: init, route: route, load: load, _state: D, _filters: F };
})();
