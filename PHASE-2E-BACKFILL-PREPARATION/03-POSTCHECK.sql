-- POSTCHECK: exact verification (run after commit)
CREATE TEMP TABLE _approved (uuid uuid PRIMARY KEY, slug text NOT NULL);
INSERT INTO _approved (uuid, slug) VALUES
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
('f13d845b-cfd0-47a1-b4b8-a2cf60670dd8'::uuid,'pbnu-bantah-isu-dana-rp70-miliar-muktamar'),
('d13af14b-52e7-44fd-a503-514adb1b5ca6'::uuid,'merindukan-reuni-di-surga-adn-empat-bekal-untuk-berkumpul-kembali-bersama-keluarga');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM _approved a LEFT JOIN public.content_items c ON c.id=a.uuid WHERE c.id IS NULL) THEN
    RAISE EXCEPTION 'Postcheck failed: missing target UUID';
  END IF;
  IF EXISTS (SELECT 1 FROM _approved a JOIN public.content_items c ON c.id=a.uuid
             WHERE c.data->>'slug' IS DISTINCT FROM a.slug OR c.type IS DISTINCT FROM 'berita' OR c.published IS NOT TRUE) THEN
    RAISE EXCEPTION 'Postcheck failed: mapping/type/published mismatch';
  END IF;
  IF EXISTS (SELECT 1 FROM _approved a JOIN public.content_items c ON c.id=a.uuid
             WHERE c.data->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(c.data->>'slug') > 100) THEN
    RAISE EXCEPTION 'Postcheck failed: invalid slug format/length';
  END IF;
  IF EXISTS (SELECT lower(data->>'slug') FROM public.content_items WHERE type = 'berita' AND data->>'slug' IS NOT NULL GROUP BY lower(data->>'slug') HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Postcheck failed: duplicate slug (case-insensitive)';
  END IF;
  IF (SELECT count(*) FROM _approved) <> 13 THEN
    RAISE EXCEPTION 'Postcheck failed: approved count not 13';
  END IF;
END $$;
SQLEOF
echo done