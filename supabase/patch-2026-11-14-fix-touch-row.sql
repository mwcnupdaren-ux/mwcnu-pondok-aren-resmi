-- Patch 2026-11-14 (lanjutan): fungsi touch_row di produksi merujuk kolom
-- yang tidak ada di semua tabel.
-- Gejala  : simpan Pengaturan Situs (mis. Rekening & QRIS) gagal —
--           "record \"new\" has no field \"created_by\" · kode 42703",
--           padahal kolom created_by content_items sudah ditambahkan.
-- Penyebab: referensi NEW.created_by di dalam kondisi IF tetap di-resolve
--           oleh PL/pgSQL sebelum evaluasi kondisi berhenti di
--           tg_table_name = 'content_items' — jadi versi "guarded" biasa
--           pun tetap gagal di tabel tanpa kolom tersebut (teruji).
-- Solusi  : pemeriksaan via to_jsonb(new) — mencari kunci di JSON tidak
--           pernah error walau kolomnya tidak ada (hanya NULL). Penugasan
--           new.created_by hanya berjalan di cabang content_items.
-- Sifat   : create or replace — aman, tidak menyentuh data, tidak mengubah tabel.

create or replace function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := lower(coalesce(auth.jwt() ->> 'email', current_user));
  if tg_table_name = 'content_items' and tg_op = 'INSERT' then
    if to_jsonb(new) ->> 'created_by' is null then
      new.created_by := new.updated_by;
    end if;
  end if;
  return new;
end $$;

-- Verifikasi (opsional, jalankan terpisah):
--   1) Bentuk fungsi setelah pergantian:
--      select prosrc from pg_proc where proname = 'touch_row';
--   2) Daftar trigger pada kedua tabel (pastikan hanya trg_touch_items,
--      trg_touch_settings, trg_log_items, trg_log_settings + guard bawaan):
--      select c.relname as tabel, t.tgname, pg_get_triggerdef(t.oid)
--        from pg_trigger t join pg_class c on c.oid = t.tgrelid
--       where c.relname in ('content_items', 'site_settings')
--         and not t.tgisinternal;
