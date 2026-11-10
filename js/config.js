/* Isi URL proyek Supabase dan anon/publishable key dari Project Settings > API.
   Nilai publik ini aman dibundel ke situs HANYA dengan RLS yang sudah aktif.
   Jangan pernah menaruh service_role di sini, di build output, atau repositori. */
window.MWC_CFG = {
  supabaseUrl: 'https://wvfcifqolohfipvepxss.supabase.co',   // https://<project-ref>.supabase.co
  supabaseKey: 'sb_publishable_ZFDHQDhZfHmKeH7elEOv7g_UV83GXR7'    // anon JWT lama atau sb_publishable_...; bukan service_role
};
window.MWC_CFG_FALLBACK = true;
