BEGIN;

LOCK TABLE public.content_items IN EXCLUSIVE MODE;

CREATE TEMP TABLE _rollback_pairs (uuid uuid PRIMARY KEY, slug text NOT NULL);
INSERT INTO _rollback_pairs (uuid, slug) VALUES
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
('f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,'pbnu-bantah-isu-dana-rp70-miliar-muktamar');

DO $$
BEGIN
  IF (SELECT count(*) FROM _rollback_pairs p JOIN public.content_items c ON c.id=p.uuid
      WHERE c.data->>'slug' IS DISTINCT FROM p.slug) <> 0 THEN
    RAISE EXCEPTION 'Rollback precondition failed: not all 12 pairs match current slug';
  END IF;
  IF (SELECT count(*) FROM _rollback_pairs p JOIN public.content_items c ON c.id=p.uuid) <> 12 THEN
    RAISE EXCEPTION 'Rollback precondition failed: missing target rows';
  END IF;
END $$;

CREATE TEMP TABLE _rollback_result AS
WITH reverted AS (
  UPDATE public.content_items c
  SET data = c.data - 'slug'
  FROM _rollback_pairs p
  WHERE c.id = p.uuid
    AND c.data->>'slug' IS NOT DISTINCT FROM p.slug
  RETURNING c.id
)
SELECT id FROM reverted;

DO $$
BEGIN
  IF (SELECT count(*) FROM _rollback_result) <> 12 THEN
    RAISE EXCEPTION 'Rollback assertion failed: expected 12 reverted, got %', (SELECT count(*) FROM _rollback_result);
  END IF;
  IF (SELECT count(*) FROM public.content_items WHERE id = ANY (ARRAY[
    '0acaecff-ff03-42f8-be7d-85ed63a5b983'::uuid,'92fd61e6-1364-4058-bf4e-f058c720fd84'::uuid,
    'ae6d9241-216e-40ab-b466-3f19399d53db'::uuid,'e9a4b515-a16d-41bc-81bb-d310b936170d'::uuid,
    'b18c0158-672a-4ad9-b38e-7d222632c3a4'::uuid,'eb978bd1-b4af-4817-b27e-7cc557ac5a71'::uuid,
    '91880c5c-623b-4aa0-812d-0912850027cd'::uuid,'599ca2da-df16-4f12-a91e-09ca498e471f'::uuid,
    '99c61340-3f25-4fae-a471-a1f93f53cb34'::uuid,'20537a67-d5eb-42de-9c18-ab131d8be214'::uuid,
    'c533df16-e18b-4afb-b59a-749ccac13959'::uuid,'f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid
  ]) AND (data ? 'slug')) <> 0 THEN
    RAISE EXCEPTION 'Rollback verification failed: a reverted target still has key slug';
  END IF;
  IF (SELECT data->>'slug' FROM public.content_items WHERE id = 'd13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid)
     IS DISTINCT FROM 'merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga' THEN
    RAISE EXCEPTION 'Rollback verification failed: preserved slug changed';
  END IF;
END $$;

-- COMMIT; -- manual
ROLLBACK;
SQLEOF
echo done