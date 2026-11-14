-- Patch 2026-11-14: kolom created_by di content_items belum ada di produksi.
-- Gejala  : admin CMS gagal simpan — "record \"new\" has no field \"created_by\" · kode 42703".
-- Penyebab: trigger trg_touch_items (fungsi touch_row) merujuk NEW.created_by
--           pada INSERT content_items, tetapi kolom tersebut belum dibuat
--           (blok ALTER TABLE di schema.sql belum pernah dijalankan di proyek ini).
-- Sifat   : idempotent — aman dijalankan berulang, tidak mengubah data yang ada.

-- 1) Tambahkan kolom yang dirujuk trigger (tanpa mengubah data yang ada)
alter table public.content_items add column if not exists created_by text;

-- 2) Backfill: baris lama dianggap dibuat oleh pengubah terakhirnya (updated_by),
--    agar RLS "items_update" (created_by = email editor) tetap mengizinkan
--    editor lama menyunting konten yang sudah ada.
update public.content_items set created_by = updated_by where created_by is null;

-- 3) Verifikasi (opsional, jalankan terpisah untuk melihat hasil):
--    select table_name, column_name
--      from information_schema.columns
--     where table_schema = 'public'
--       and table_name in ('content_items', 'site_settings')
--     order by table_name, ordinal_position;
--    Harus muncul: content_items.created_by dan content_items.updated_by.
