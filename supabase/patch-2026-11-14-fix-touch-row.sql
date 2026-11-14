-- Patch 2026-11-14 (lanjutan): fungsi touch_row di produksi masih versi lama.
-- Gejala  : simpan Pengaturan Situs (mis. Rekening & QRIS) gagal —
--           "record \"new\" has no field \"created_by\" · kode 42703",
--           padahal kolom created_by content_items sudah ditambahkan.
-- Penyebab: fungsi touch_row versi lama merujuk NEW.created_by untuk SEMUA tabel,
--           sedangkan tabel site_settings resmi tidak memiliki kolom tersebut.
--           Versi resmi (schema.sql baris 98-105) hanya mengisi created_by
--           untuk INSERT content_items.
-- Sifat   : create or replace — aman, tidak menyentuh data, tidak mengubah tabel.

create or replace function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := lower(coalesce(auth.jwt() ->> 'email', current_user));
  if tg_table_name = 'content_items' and tg_op = 'INSERT' and new.created_by is null then new.created_by := new.updated_by; end if;
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
