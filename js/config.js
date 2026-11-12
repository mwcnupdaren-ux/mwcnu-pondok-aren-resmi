/* Isi URL proyek Supabase dan anon/publishable key dari Project Settings > API.
   Nilai publik ini aman dibundel ke situs HANYA dengan RLS yang sudah aktif.
   Jangan pernah menaruh service_role di sini, di build output, atau repositori. */
window.MWC_CFG = {
  supabaseUrl: 'https://wvfcifqolohfipvepxss.supabase.co',   // https://<project-ref>.supabase.co
  supabaseKey: 'sb_publishable_ZFDHQDhZfHmKeH7elEOv7g_UV83GXR7'    // anon JWT lama atau sb_publishable_...; bukan service_role
};
/* false = publik selalu mengambil konten terbaru dari Supabase (wajib agar CMS tampil).
   true hanya untuk uji luring: situs memakai cache localStorage dan tidak menghubungi Supabase. */
window.MWC_CFG_FALLBACK = false;

/* ===== SUMBER TUNGGAL BERSAMA (P1 konsolidasi) =====
   Satu definisi untuk semua halaman: index, admin, verifikasi.
   Urutan kode '01'-'11' HARUS paritas dengan profile_prnu() di supabase-profiles.sql
   (di sana nama disimpan sendiri sebagai salinan sisi server). */
window.MWC_RT = ['Pondok Aren','Jurangmangu Barat','Jurangmangu Timur','Pondok Betung','Pondok Karya','Pondok Jaya','Pondok Pucung','Pondok Kacang Barat','Pondok Kacang Timur','Parigi Baru','Parigi Lama'];

/* Check-digit NIA — sumber tunggal sisi klien.
   Wajib paritas dengan public.nia_check() di supabase-profiles.sql:
   digit terakhir = (10 - (jumlah bobot 1-3-1-3... dari kanan) % 10) % 10. */
window.MWC_NIA_CD = function (s) {
  var d = String(s == null ? '' : s).replace(/\D/g, ''), t = 0;
  for (var i = 0; i < d.length; i++) t += (+d[d.length - 1 - i]) * (i % 2 ? 3 : 1);
  return (10 - t % 10) % 10;
};

/* Escape HTML — satu definisi untuk semua modul/IIFE (sebelumnya 6 salinan). */
window.mwcEsc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};
