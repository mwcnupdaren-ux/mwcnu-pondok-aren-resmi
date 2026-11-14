/* Admin direktori organisasi (FASE 5).
   Mengelola 5 tabel relasional dari supabase/direktori-organisasi.sql:
   unit, jabatan, profil publik, kepengurusan, masa khidmat.

   Dimuat SEBELUM admin.js. Semua akses ke fungsi admin.js lewat
   window.MWCADM (dipasang admin.js tepat sebelum boot()), jadi tidak ada
   ketergantungan saat pemuatan berkas.

   BATASAN HAK KOLOM (lihat migrasi bagian 9): authenticated hanya boleh
   membaca kolom publik pada organizational_units dan organizational_profiles.
   Karena itu semua select memakai daftar kolom eksplisit dan penulisan
   TIDAK memakai .select() (return=representation akan meminta kolom terlarang).
   linked_staff_email sengaja tidak ditampilkan: kolom itu tidak diberikan
   kepada authenticated, dan menampilkannya butuh grant kolom baru. */
(function () {
  'use strict';

  function API() { return window.MWCADM; }
  function sb() { return API().sb; }
  function esc(s) { return API().esc(s); }

  var KIND = {
    mwc: 'MWC', prnu: 'PRNU', syuriyah: 'Syuriyah', tanfidziyah: 'Tanfidziyah',
    lembaga: 'Lembaga', badan_khusus: 'Badan Khusus', banom: 'Badan Otonom'
  };
  var KIND_OPTS = ['mwc', 'prnu', 'syuriyah', 'tanfidziyah', 'lembaga', 'badan_khusus', 'banom'];
  var PRNU_OPTS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
  var RT = window.MWC_RT || [];

  function role() { var s = API().state; return (s.me && s.me.role) || ''; }
  function isAdmin() { return API().isAdmin(); }
  function isPengurus() { return role() === 'pengurus' || isAdmin(); }
  function myPrnu() { var s = API().state; return (s.me && s.me.prnu) || ''; }

  /* ---------- pesan galat yang bisa ditindaklanjuti ---------- */
  function friendly(e) {
    var m = (e && (e.message || e.error_description)) || String(e || '');
    var code = (e && (e.code || e.status)) || '';
    var detail = e && e.details ? ' Detail: ' + e.details : '';
    var hint = e && e.hint ? ' Petunjuk: ' + e.hint : '';
    var suffix = detail + hint;
    if (code === 'PGRST205' || /schema cache|does not exist|tidak ada/i.test(m)) {
      return 'Tabel direktori belum tersedia. Jalankan supabase/direktori-organisasi.sql di SQL Editor Supabase, lalu muat ulang halaman ini.';
    }
    if (code === '42501' || /permission denied|row-level security/i.test(m)) {
      return 'Server menolak perubahan ini. Anda hanya dapat mengubah unit di ranting Anda' + (isAdmin() ? '.' : ' (periksa kolom prnu pada menu Pengelola).') + suffix;
    }
    if (code === '23505' || /duplicate key|sudah ada/i.test(m)) return 'Data dengan kunci yang sama sudah ada: ' + m + suffix;
    if (code === '23503' || /foreign key|masih dipakai/i.test(m)) return 'Data ini masih dipakai data lain sehingga tidak dapat dihapus. Hapus turunannya lebih dulu.' + suffix;
    if (code === '23514' || /violates check constraint/i.test(m)) return 'Isian tidak memenuhi aturan data: ' + m + suffix;
    return (m || 'Terjadi kesalahan.') + (code ? ' (kode ' + code + ')' : '') + suffix;
  }

  /* ---------- olah unit: siapa yang boleh mengubah ---------- */
  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  /* Pengurus boleh mengelola unit ber-prnu_code miliknya DAN seluruh turunannya
     (selaras dengan manages_unit() di migrasi, maks 10 tingkat). */
  function manages(units, unit) {
    if (!unit) return false;
    if (isAdmin()) return true;
    if (!isPengurus()) return false;
    var p = myPrnu(), u = unit, n = 0;
    while (u && n < 10) {
      if (u.prnu_code && u.prnu_code === p) return true;
      u = u.parent_id ? byId(units, u.parent_id) : null;
      n++;
    }
    return false;
  }
  function descendants(units, id) {
    var out = {}, frontier = [id], n = 0;
    while (frontier.length && n < 10) {
      var next = [];
      units.forEach(function (u) {
        if (u.parent_id && frontier.indexOf(u.parent_id) >= 0 && !out[u.id]) { out[u.id] = 1; next.push(u.id); }
      });
      frontier = next; n++;
    }
    return out;
  }

  /* ---------- muat data + cache ---------- */
  var CACHE = null;
  var UCOLS = 'id,parent_id,code,name,kind,prnu_code,sort_order,is_public';
  var PCOLS = 'id,slug,full_name,photo_url,bio,is_public';

  function load(force) {
    if (CACHE && !force) return Promise.resolve(CACHE);
    var s = sb();
    return Promise.all([
      s.from('organizational_units').select(UCOLS).order('sort_order', { ascending: true }).order('name', { ascending: true }),
      s.from('organizational_positions').select('id,unit_id,name,rank').order('rank', { ascending: true }).order('name', { ascending: true }),
      s.from('organizational_profiles').select(PCOLS).order('full_name', { ascending: true }),
      s.from('organizational_terms').select('id,label,starts_on,ends_on,is_current').order('starts_on', { ascending: false }),
      s.from('organizational_memberships').select('id,profile_id,position_id,term_id,notes')
    ]).then(function (rs) {
      var bad = rs.filter(function (r) { return r.error; })[0];
      if (bad) throw bad.error;
      CACHE = {
        units: rs[0].data || [], positions: rs[1].data || [], profiles: rs[2].data || [],
        terms: rs[3].data || [], memberships: rs[4].data || []
      };
      return CACHE;
    });
  }
  function dropCache() { CACHE = null; }

  /* ---------- daftar entitas ---------- */
  var E = {
    unit: {
      t: 'organizational_units', l: 'Unit Organisasi', cols: UCOLS,
      title: function (r) { return r.name; },
      sub: function (r, d) {
        var par = r.parent_id ? byId(d.units, r.parent_id) : null;
        return (KIND[r.kind] || r.kind) + (r.prnu_code ? ' · kode ' + r.prnu_code : '')
          + (par ? ' · induk: ' + par.name : '')
          + (r.is_public ? '' : ' · tidak tampil di situs');
      },
      chip: function (r) { return r.is_public ? '' : 'x'; },
      fields: function (d, row) {
        var ban = row ? descendants(d.units, row.id) : {};
        var parentOpts = d.units.filter(function (u) { return !row || (u.id !== row.id && !ban[u.id]); })
          .map(function (u) { return { v: u.id, l: u.name }; });
        return [
          { k: 'name', l: 'Nama unit', t: 'text', req: 1 },
          { k: 'code', l: 'Kode unik', t: 'text', req: 1, h: 'Huruf kecil, angka, tanda hubung. Contoh: syuriyah, prnu-08, banom-gp-ansor. Dipakai di URL dan rujukan.' },
          { k: 'kind', l: 'Jenis unit', t: 'select', req: 1, o: KIND_OPTS.map(function (k) { return { v: k, l: KIND[k] }; }) },
          { k: 'parent_id', l: 'Unit induk', t: 'select', o: parentOpts, empty: '— Tanpa induk (unit puncak) —', h: 'Kosongkan untuk unit puncak. PRNU berada di bawah MWC.' },
          { k: 'prnu_code', l: 'Kode PRNU (01–11)', t: 'select', o: PRNU_OPTS.map(function (c) { return { v: c, l: c + ' · ' + (RT[+c - 1] || '') }; }), empty: '— Bukan unit ranting —', h: 'Hanya untuk jenis PRNU. Satu kode hanya boleh dipakai satu unit.' },
          { k: 'sort_order', l: 'Urutan tampil', t: 'num', h: 'Angka kecil tampil lebih dulu. MWC 0, Syuriyah 1, Tanfidziyah 2, PRNU 10–20, banom 40.' },
          { k: 'is_public', l: 'Tampilkan di situs publik', t: 'bool' }
        ];
      }
    },
    jabatan: {
      t: 'organizational_positions', l: 'Jabatan', cols: 'id,unit_id,name,rank',
      title: function (r) { return r.name; },
      sub: function (r, d) {
        var u = byId(d.units, r.unit_id);
        var n = d.memberships.filter(function (m) { return m.position_id === r.id; }).length;
        return (u ? u.name : 'Unit tidak dikenal') + ' · urutan ' + r.rank + ' · ' + n + ' orang';
      },
      fields: function (d) {
        return [
          { k: 'unit_id', l: 'Unit', t: 'select', req: 1, o: d.units.map(function (u) { return { v: u.id, l: u.name }; }) },
          { k: 'name', l: 'Nama jabatan', t: 'text', req: 1, h: 'Contoh: Rois, Wakil Rois, Ketua, Sekretaris. Satu nama hanya sekali per unit.' },
          { k: 'rank', l: 'Urutan jabatan', t: 'num', h: 'Angka kecil tampil lebih dulu (Ketua 1, Wakil 2, Sekretaris 3, …).' }
        ];
      }
    },
    profil: {
      t: 'organizational_profiles', l: 'Profil Direktori', cols: PCOLS, adminOnly: 1,
      title: function (r) { return r.full_name; },
      sub: function (r) {
        return '/' + r.slug + (r.is_public ? '' : ' · belum tampil di situs') + (r.bio ? ' · ada bio' : '');
      },
      chip: function (r) { return r.is_public ? '' : 'x'; },
      fields: function () {
        return [
          { k: 'full_name', l: 'Nama lengkap dan gelar', t: 'text', req: 1, h: 'Tampil apa adanya di direktori. Contoh: Dr. K.H. Syuhada, M.A.' },
          { k: 'slug', l: 'Slug URL', t: 'text', req: 1, h: 'Huruf kecil, angka, tanda hubung. Menjadi alamat #pengurus/<slug>. Terisi otomatis dari nama bila dibiarkan.' },
          { k: 'photo_url', l: 'Foto', t: 'image', f: 'direktori', max: 1000, h: 'Rasio potret (3:4) paling rapi. Bila kosong, UI memakai inisial nama.' },
          { k: 'bio', l: 'Biografi singkat', t: 'area', h: 'Opsional. Tampil di halaman detail pengurus.' },
          { k: 'is_public', l: 'Tampilkan di direktori publik', t: 'bool', h: 'Nonaktifkan untuk menyembunyikan orang ini dari situs tanpa menghapus datanya.' }
        ];
      }
    },
    kepengurusan: {
      t: 'organizational_memberships', l: 'Kepengurusan', cols: 'id,profile_id,position_id,term_id,notes',
      title: function (r, d) {
        var p = byId(d.profiles, r.profile_id), pos = byId(d.positions, r.position_id);
        return (p ? p.full_name : 'Profil terhapus') + ' — ' + (pos ? pos.name : 'jabatan terhapus');
      },
      sub: function (r, d) {
        var pos = byId(d.positions, r.position_id), u = pos ? byId(d.units, pos.unit_id) : null, t = byId(d.terms, r.term_id);
        return (u ? u.name : '') + ' · ' + (t ? t.label : 'masa khidmat tidak dikenal') + (r.notes ? ' · ' + r.notes : '');
      },
      fields: function (d) {
        var posOpts = d.positions.map(function (p) {
          var u = byId(d.units, p.unit_id);
          return { v: p.id, l: (u ? u.name : '?') + ' — ' + p.name };
        });
        return [
          { k: 'profile_id', l: 'Orang', t: 'select', req: 1, o: d.profiles.map(function (p) { return { v: p.id, l: p.full_name }; }), h: 'Profil harus dibuat lebih dulu di menu Profil Direktori.' },
          { k: 'position_id', l: 'Jabatan', t: 'select', req: 1, o: posOpts, h: 'Jabatan menentukan unit tempat orang ini tampil.' },
          { k: 'term_id', l: 'Masa khidmat', t: 'select', req: 1, o: d.terms.map(function (t) { return { v: t.id, l: t.label + (t.is_current ? ' (aktif)' : '') }; }) },
          { k: 'notes', l: 'Catatan', t: 'text', h: 'Opsional. Contoh: merangkap, pelaksana harian.' }
        ];
      }
    },
    masa: {
      t: 'organizational_terms', l: 'Masa Khidmat', cols: 'id,label,starts_on,ends_on,is_current', adminOnly: 1,
      title: function (r) { return r.label; },
      sub: function (r) {
        return API().fd(r.starts_on) + (r.ends_on ? ' – ' + API().fd(r.ends_on) : ' – sekarang') + (r.is_current ? ' · aktif' : '');
      },
      chip: function (r) { return r.is_current ? '' : 'x'; },
      fields: function () {
        return [
          { k: 'label', l: 'Label masa khidmat', t: 'text', req: 1, h: 'Contoh: 2025–2030. Dipakai sebagai penanda di direktori.' },
          { k: 'starts_on', l: 'Mulai', t: 'date', req: 1 },
          { k: 'ends_on', l: 'Selesai', t: 'date', h: 'Boleh kosong bila belum ditetapkan.' },
          { k: 'is_current', l: 'Masa khidmat aktif', t: 'bool', h: 'Hanya satu yang boleh aktif. Mengaktifkan yang ini akan menonaktifkan yang lain.' }
        ];
      }
    }
  };
  var ORDER = ['unit', 'jabatan', 'profil', 'kepengurusan', 'masa'];

  /* ---------- navigasi ---------- */
  function allowed(key) {
    var e = E[key];
    return !!e && (!e.adminOnly || isAdmin());
  }
  function visible() { return isPengurus(); }
  function nav(active) {
    var links = ORDER.filter(allowed).map(function (k) {
      var on = active === 'dir/' + k || active === 'dir/' + k + '/new';
      return '<a data-nav href="#/dir/' + k + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(E[k].l) + '</a>';
    }).join('');
    return links;
  }

  /* ---------- tampilan daftar ---------- */
  function notice(html) {
    return '<div class="note">' + html + '</div>';
  }
  function missing(e) {
    var msg = friendly(e);
    API().shell('Direktori organisasi', 'dir/unit',
      notice(esc(msg)) +
      '<div class="panel empty">Setelah migrasi dijalankan, halaman ini otomatis terisi. Data awal berisi 14 unit struktural dan 46 pengurus yang sudah tayang di situs.</div>');
  }

  function viewList(key, q) {
    var e = E[key];
    if (!e) { location.hash = '#/dir/unit'; return; }
    if (!allowed(key)) return API().shell('Tidak ada akses', 'dir/' + key, '<div class="panel empty">Peran Anda tidak memiliki akses ke bagian ini.</div>');
    var data;
    load().then(function (d) {
      data = d;
      var rows = d[e.t === 'organizational_units' ? 'units' : e.t === 'organizational_positions' ? 'positions' : e.t === 'organizational_profiles' ? 'profiles' : e.t === 'organizational_terms' ? 'terms' : 'memberships'];
      var body = rows.map(function (r) {
        var writable = true;
        if (key === 'unit') writable = manages(d.units, r);
        if (key === 'jabatan' || key === 'kepengurusan') {
          var pos = key === 'jabatan' ? r : byId(d.positions, r.position_id);
          writable = pos ? manages(d.units, byId(d.units, pos.unit_id)) : false;
        }
        var chip = e.chip ? e.chip(r) : '';
        return '<tr><td class="t"><b>' + esc(e.title(r, d)) + '</b><small>' + esc(e.sub(r, d)) + '</small></td>'
          + (e.chip ? '<td class="hm"><span class="chip ' + chip + '">' + (chip ? 'Tersembunyi' : 'Tampil') + '</span></td>' : '')
          + '<td class="a">' + (writable
            ? '<a class="act" data-nav href="#/dir/' + key + '/' + encodeURIComponent(r.id) + '">Ubah</a>'
              + (isAdmin() || key !== 'profil' && key !== 'masa' ? '<button class="act d" data-del="' + esc(r.id) + '">Hapus</button>' : '')
            : '<span class="chip">Hanya baca</span>') + '</td></tr>';
      }).join('');

      var hint = '';
      if (key === 'unit' && !isAdmin()) hint = 'Anda dapat mengubah unit ranting Anda dan unit turunannya. Unit lain hanya dapat dibaca.';
      if (key === 'kepengurusan' && !isAdmin()) hint = 'Anda dapat mengelola kepengurusan pada jabatan di ranting Anda.';
      if (key === 'profil') hint = 'Profil di sini adalah data publik direktori, terpisah dari akun anggota (KTA). Hanya Super Admin yang dapat mengubahnya.';

      API().shell(e.l, 'dir/' + key,
        (hint ? notice(hint) : '') +
        '<div class="panel"><div class="bar"><input type="search" id="dq" placeholder="Cari…" value="' + esc(q || '') + '"><span class="chip">' + rows.length + ' data</span></div>'
        + (rows.length ? '<table><thead><tr><th>' + esc(e.l) + '</th>' + (e.chip ? '<th class="hm">Status</th>' : '') + '<th></th></tr></thead><tbody>' + body + '</tbody></table>'
          : '<div class="empty">Belum ada data. Gunakan tombol Tambah untuk mengisi.</div>')
        + '</div>',
        '<a class="btn" data-nav href="#/dir/' + key + '/new">+ Tambah</a>');

      var dq = document.getElementById('dq');
      if (dq) {
        dq.addEventListener('input', function () {
          var t = dq.value.toLowerCase();
          [].forEach.call(document.querySelectorAll('.main tbody tr'), function (tr) {
            tr.style.display = !t || tr.textContent.toLowerCase().indexOf(t) > -1 ? '' : 'none';
          });
        });
        dq.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); viewList(key, dq.value.trim()); }
        });
      }
      var main = document.querySelector('.main');
      main.addEventListener('click', async function (ev) {
        var b = ev.target.closest('[data-del]'); if (!b) return;
        if (!confirm('Hapus data ini? Tindakan ini tidak dapat dibatalkan.')) return;
        try {
          var r = await sb().from(e.t).delete().eq('id', b.getAttribute('data-del'));
          if (r.error) throw r.error;
          dropCache(); API().toast('Dihapus.'); viewList(key, '');
        } catch (er) { API().toast('Gagal menghapus: ' + friendly(er), 1); }
      });
    }).catch(missing);
  }

  /* ---------- tampilan formulir ---------- */
  /* Slug mengikuti aturan seed: gelar & titel dibuang agar URL rapi
     (syuhada, syarief-muawan, …), bukan dr-k-h-syuhada-m-a. */
  var GELAR = /^(dr|drs|dra|prof|k|kh|h|hj|ust|ustadz|ustadzah|lc|s|m|a|se|ss|sh|mm|mpd|mag|si|kom|sos|pd|ag|q|sq|hc|csp|cpm|ciisa|phd|ma|mh)$/i;
  function slugify(s) {
    return String(s || '').toLowerCase()
      .replace(/\(hc\)/gi, ' ').replace(/[.,]/g, ' ')
      .split(/\s+/).filter(function (t) { return t && !GELAR.test(t); })
      .join('-')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function viewForm(key, id) {
    var e = E[key];
    if (!e) { location.hash = '#/dir/unit'; return; }
    if (!allowed(key)) return API().shell('Tidak ada akses', 'dir/' + key, '<div class="panel empty">Peran Anda tidak memiliki akses ke bagian ini.</div>');
    var data, row = null;
    load().then(function (d) {
      data = d;
      if (id !== 'new') {
        var list = key === 'unit' ? d.units : key === 'jabatan' ? d.positions : key === 'profil' ? d.profiles : key === 'masa' ? d.terms : d.memberships;
        row = byId(list, id);
        if (!row) { API().toast('Data tidak ditemukan.', 1); return location.hash = '#/dir/' + key; }
      }
      var F = e.fields(d, row);
      var vals = row ? Object.assign({}, row) : (key === 'unit' ? { kind: 'lembaga', sort_order: 0, is_public: true }
        : key === 'jabatan' ? { rank: 0 }
        : key === 'profil' ? { is_public: true }
        : key === 'masa' ? { is_current: false } : {});
      var title = (row ? 'Ubah ' : 'Tambah ') + e.l;
      API().shell(title, 'dir/' + key,
        notice(key === 'unit'
          ? 'Kode unit dipakai sebagai rujukan tetap. Mengubah kode unit yang sudah dipakai dapat memutus tautan lama — ubah hanya bila perlu.'
          : key === 'profil'
            ? 'Perubahan di sini langsung memengaruhi direktori publik. Profil non-publik tidak tampil di situs.'
            : ''),
        '<form class="form panel" id="form" novalidate>' + API().formHTML(F, vals)
        + '<div class="foot"><button class="btn g" id="save" type="submit">Simpan</button><a class="btn o" data-nav href="#/dir/' + key + '">Batal</a></div></form>');

      var form = document.getElementById('form');
      form.__F = F;
      API().bindForm(form);

      /* Slug otomatis dari nama untuk profil baru (berhenti bila slug disunting manual). */
      if (key === 'profil') {
        var nameEl = form.querySelector('[data-k="full_name"] .in');
        var slugEl = form.querySelector('[data-k="slug"] .in');
        var touched = !!(row && row.slug);
        if (slugEl) slugEl.addEventListener('input', function () { touched = true; });
        if (nameEl && slugEl) nameEl.addEventListener('input', function () {
          if (!touched) slugEl.value = slugify(nameEl.value);
        });
      }

      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var v = API().readForm(form, F);
        if (key === 'unit' && v.code && !/^[a-z0-9][a-z0-9-]*$/.test(v.code)) {
          return API().toast('Kode unit hanya boleh huruf kecil, angka, dan tanda hubung.', 1);
        }
        if (key === 'profil' && v.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) {
          return API().toast('Slug hanya boleh huruf kecil, angka, dan tanda hubung tunggal.', 1);
        }
        if (!API().validate(form, F, v)) { API().toast('Periksa isian yang ditandai merah.', 1); return; }
        var btn = document.getElementById('save'); btn.disabled = true;
        try {
          /* Angka kosong disimpan sebagai 0 agar kolom int tidak menolak. */
          if (key === 'unit') v.sort_order = v.sort_order === '' ? 0 : Number(v.sort_order);
          if (key === 'jabatan') v.rank = v.rank === '' ? 0 : Number(v.rank);
          if (key === 'unit') v.prnu_code = v.prnu_code || null;
          if (key === 'unit') v.parent_id = v.parent_id || null;
          if (key === 'masa') v.ends_on = v.ends_on || null;

          /* Hanya satu masa khidmat aktif: nonaktifkan yang lain lebih dulu. */
          if (key === 'masa' && v.is_current) {
            var q0 = sb().from('organizational_terms').update({ is_current: false }).eq('is_current', true);
            if (row) q0 = q0.neq('id', row.id);
            var u0 = await q0; if (u0.error) throw u0.error;
          }

          var r2;
          if (row) r2 = await sb().from(e.t).update(v).eq('id', row.id);
          else r2 = await sb().from(e.t).insert(v);
          if (r2.error) throw r2.error;
          API().state.dirty = false; dropCache();
          API().toast('Tersimpan.'); location.hash = '#/dir/' + key;
        } catch (er) {
          API().toast('Gagal menyimpan: ' + friendly(er), 1);
          btn.disabled = false;
        }
      });
    }).catch(missing);
  }

  /* ---------- router ---------- */
  function route(sub, id) {
    if (!sub) return viewList('unit', '');
    if (!E[sub]) return viewList('unit', '');
    if (id) return viewForm(sub, id);
    return viewList(sub, '');
  }

  window.MWCDIRADM = { nav: nav, route: route, visible: visible, _cache: function () { return CACHE; }, _entities: E };
})();
