-- PRECHECK (fail-closed). Aborts on any mismatch.
DO $$
DECLARE
  v_found int; v_nonberita int; v_nonpub int; v_collision int; v_internal_dup int;
BEGIN
  SELECT count(*) INTO v_found
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
  IF v_found <> 13 THEN RAISE EXCEPTION 'Precheck failed: expected 13 targets, found %', v_found; END IF;

  SELECT count(*) INTO v_nonberita
  FROM public.content_items
  WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
    'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
  ]) AND type IS DISTINCT FROM 'berita';
  IF v_nonberita <> 0 THEN RAISE EXCEPTION 'Precheck failed: % non-berita targets', v_nonberita; END IF;

  SELECT count(*) INTO v_nonpub
  FROM public.content_items
  WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,
    'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid
  ]) AND published IS NOT TRUE;
  IF v_nonpub <> 0 THEN RAISE EXCEPTION 'Precheck failed: % non-published targets', v_nonpub; END IF;

  -- 12 backfill targets must NOT have key 'slug' (key absent)
  IF (SELECT count(*) FROM public.content_items
      WHERE id = ANY (ARRAY[
        '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
        'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
        'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
        '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
        '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
        'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid
      ]) AND (data ? 'slug')) <> 0 THEN
    RAISE EXCEPTION 'Precheck failed: a backfill target already has key slug';
  END IF;

  IF (SELECT data->>'slug' FROM public.content_items WHERE id = 'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid)
     IS DISTINCT FROM 'merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga' THEN
    RAISE EXCEPTION 'Precheck failed: existing slug mismatch';
  END IF;

  SELECT count(DISTINCT lower(s)) INTO v_internal_dup FROM (VALUES
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
  ) AS t(s);
  IF v_internal_dup <> 13 THEN RAISE EXCEPTION 'Precheck failed: internal slug collision among 13'; END IF;

  SELECT count(*) INTO v_collision
  FROM public.content_items a
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
  ]);
  IF v_collision <> 0 THEN RAISE EXCEPTION 'Precheck failed: slug collision with other records'; END IF;
END $$;
SQLEOF
echo done