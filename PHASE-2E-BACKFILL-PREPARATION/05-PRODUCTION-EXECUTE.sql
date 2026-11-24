BEGIN;

LOCK TABLE public.content_items IN EXCLUSIVE MODE;

SELECT id FROM public.content_items
WHERE id = ANY (ARRAY[
  '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
  'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
  'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
  '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
  '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
  'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
  'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
]) FOR UPDATE;

CREATE TEMP TABLE _pre_snapshot AS
SELECT id, (data - 'slug') AS data_noslug, (data -> 'slug') AS slug_json
FROM public.content_items
WHERE id = ANY (ARRAY[
  '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
  'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
  'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
  '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
  '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
  'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
  'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
]);

DO $$
BEGIN
  IF (SELECT count(*) FROM public.content_items WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
    'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
  ])) <> 13 THEN
    RAISE EXCEPTION 'In-tx precondition failed: target count';
  END IF;
  IF (SELECT count(*) FROM public.content_items WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
    'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
  ]) AND type IS DISTINCT FROM 'berita') <> 0 THEN
    RAISE EXCEPTION 'In-tx precondition failed: non-berita target';
  END IF;
  IF (SELECT count(*) FROM public.content_items WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
    'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
  ]) AND published IS NOT TRUE) <> 0 THEN
    RAISE EXCEPTION 'In-tx precondition failed: non-published target';
  END IF;
  IF (SELECT count(*) FROM public.content_items WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid
  ]) AND (data ? 'slug')) <> 0 THEN
    RAISE EXCEPTION 'In-tx precondition failed: a backfill target already has key slug';
  END IF;
  IF (SELECT data->>'slug' FROM public.content_items WHERE id='d13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid)
     IS DISTINCT FROM 'merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga' THEN
    RAISE EXCEPTION 'In-tx precondition failed: existing slug mismatch';
  END IF;
  -- internal collision among 13 (case-insensitive)
  IF (SELECT count(DISTINCT lower(s)) FROM (VALUES
    ('lailatul-ijtima-tawaqufan-mwcnu-pondok-aren-pondok-kacang-barat'),
    ('halal-bi-halal-nu-pondok-aren-membumikan-dakwah-menguatkan-ranting'),
    ('launching-qris-mwcnu-pondok-aren-melangkah-maju-dari-koin-nu'),
    ('turba-mwcnu-pondok-aren-di-prnu-jurangmangu-timur'),
    ('kh-fathur-rahman-tradisi-dan-warisan-ulama-harus-terus-dilestarikan'),
    ('pbnu-pwnu-se-indonesia-rilis-6-pernyataan-sikap-dinamika-nasional'),
    ('mwcnu-pondok-aren-gelar-tarling-di-musholla-al-ikhwan-kenalkan-prinsip-dasar-nu'),
    ('pentingnya-menjaga-tradisi-aswaja-di-era-modern-pesan-kh-m-thoha'),
    ('menyiapkan-bekal-akhirat-pesan-kh-ahmad-misbah-di-pondok-aren'),
    ('aksi-sosial-gp-ansor-banser-griya-al-fath-pondok-aren-idul-adha'),
    ('menjaga-istiqomah-pesan-kh-mohammad-jamil-di-pondok-jaya-aren'),
    ('pbnu-bantah-isu-dana-rp70-miliar-muktamar'),
    ('merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga')
  ) AS t(s)) <> 13 THEN
    RAISE EXCEPTION 'In-tx precondition failed: internal slug collision';
  END IF;
  -- external collision case-insensitive
  IF EXISTS (
    SELECT 1 FROM public.content_items a
    WHERE a.id <> ALL (ARRAY[
      '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
      'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
      'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
      '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
      '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
      'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
      'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
    ])
    AND lower(a.data->>'slug') = ANY (ARRAY[
      'lailatul-ijtima-tawaqufan-mwcnu-pondok-aren-pondok-kacang-barat',
      'halal-bi-halal-nu-pondok-aren-membumikan-dakwah-menguatkan-ranting',
      'launching-qris-mwcnu-pondok-aren-melangkah-maju-dari-koin-nu',
      'turba-mwcnu-pondok-aren-di-prnu-jurangmangu-timur',
      'kh-fathur-rahman-tradisi-dan-warisan-ulama-harus-terus-dilestarikan',
      'pbnu-pwnu-se-indonesia-rilis-6-pernyataan-sikap-dinamika-nasional',
      'mwcnu-pondok-aren-gelar-tarling-di-musholla-al-ikhwan-kenalkan-prinsip-dasar-nu',
      'pentingnya-menjaga-tradisi-aswaja-di-era-modern-pesan-kh-m-thoha',
      'menyiapkan-bekal-akhirat-pesan-kh-ahmad-misbah-di-pondok-aren',
      'aksi-sosial-gp-ansor-banser-griya-al-fath-pondok-aren-idul-adha',
      'menjaga-istiqomah-pesan-kh-mohammad-jamil-di-pondok-jaya-aren',
      'pbnu-bantah-isu-dana-rp70-miliar-muktamar',
      'merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga'
    ])
  ) THEN
    RAISE EXCEPTION 'In-tx precondition failed: slug collision';
  END IF;
END $$;

CREATE TEMP TABLE _backfill_result AS
WITH updated AS (
  UPDATE public.content_items
  SET data = jsonb_set(data, '{slug}', to_jsonb(v.slug), true)
  FROM (VALUES
    ('0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'lailatul-ijtima-tawaqufan-mwcnu-pondok-aren-pondok-kacang-barat'),
    ('92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,'halal-bi-halal-nu-pondok-aren-membumikan-dakwah-menguatkan-ranting'),
    ('ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'launching-qris-mwcnu-pondok-aren-melangkah-maju-dari-koin-nu'),
    ('e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,'turba-mwcnu-pondok-aren-di-prnu-jurangmangu-timur'),
    ('b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'kh-fathur-rahman-tradisi-dan-warisan-ulama-harus-terus-dilestarikan'),
    ('eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,'pbnu-pwnu-se-indonesia-rilis-6-pernyataan-sikap-dinamika-nasional'),
    ('91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'mwcnu-pondok-aren-gelar-tarling-di-musholla-al-ikhwan-kenalkan-prinsip-dasar-nu'),
    ('599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,'pentingnya-menjaga-tradisi-aswaja-di-era-modern-pesan-kh-m-thoha'),
    ('99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'menyiapkan-bekal-akhirat-pesan-kh-ahmad-misbah-di-pondok-aren'),
    ('20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,'aksi-sosial-gp-ansor-banser-griya-al-fath-pondok-aren-idul-adha'),
    ('c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'menjaga-istiqomah-pesan-kh-mohammad-jamil-di-pondok-jaya-aren'),
    ('f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,'pbnu-bantah-isu-dana-rp70-miliar-muktamar')
  ) AS v(uuid, slug)
  WHERE public.content_items.id = v.uuid
    AND public.content_items.type = 'berita'
    AND public.content_items.published = true
    AND NOT (public.content_items.data ? 'slug')
  RETURNING public.content_items.id
)
SELECT id FROM updated;

DO $$
BEGIN
  IF (SELECT count(*) FROM _backfill_result) <> 12 THEN
    RAISE EXCEPTION 'Backfill assertion failed: expected 12 updated, got %', (SELECT count(*) FROM _backfill_result);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.content_items a JOIN _pre_snapshot s ON a.id = s.id
    WHERE (a.data - 'slug') IS DISTINCT FROM s.data_noslug
  ) THEN
    RAISE EXCEPTION 'Integrity check failed: non-slug data changed';
  END IF;
END $$;

COMMIT;
