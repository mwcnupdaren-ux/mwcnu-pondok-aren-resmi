# PHASE 3A-R1 — ARCHITECTURE VALIDATION

**Status:** READY FOR PHASE 3B IMPLEMENTATION REVIEW

## A. RLS verification (VERIFIED FACT)
- Source: supabase/schema.sql lines 165, 183-185.
- Policy `items_read` on public.content_items for select to anon, authenticated:
  `using (published or public.can_edit(type, data) or public.can_review(type))`.
- VERIFIED: anon can SELECT rows where published=true.
- UNVERIFIED: exact runtime policy state in production (schema.sql is source; not queried live).
- RECOMMENDATION: endpoint uses anon key; only select published rows and required columns.

## B. Endpoint contract (RECOMMENDATION)
- Method: GET /api/article-meta?slug=...
- Validate slug with regex `^[a-z0-9]+(-[a-z0-9]+)*$`, max 100.
- Query Supabase anon: `content_items` select `id,type,judul,slug? (data->>slug), ringkasan/meta_desc, foto, tanggal/created_at` where type=berita, published=true, data->>'slug'=slug. Limit 1.
- 200 HTML with title/description/canonical/OG/Twitter.
- 404 for missing/not published/invalid.
- 400 for invalid slug.
- 500 for query error (generic).
- Content-Type text/html; charset=utf-8.
- Escape all metadata; fallback image default OG image.
- Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=600 (or shorter). Invalidate via Supabase updated_at if needed.

## C. Sitemap validation (UNVERIFIED)
- Cannot query live DB; count 13 is prior baseline only.
- Sitemap must be generated from published berita with valid slug.
- RECOMMENDATION: generate sitemap dynamically or manually from verified list at implementation.

## D. Vercel rewrite validation (RECOMMENDATION)
- Add rewrite:
  { "source": "/berita/:slug", "destination": "/api/article-meta?slug=:slug" }
- Place before `/berita` -> `/` rewrite to avoid catch-all.
- Legacy `/#berita/{slug}` remains client-side hash route; unaffected.
- Direct refresh on /berita/{slug}: server function responds 200 HTML.

## E. Architecture decision (RECOMMENDATION)
- Recommended: Serverless function returns full HTML document with SEO meta tags plus a small bootstrap that loads SPA and navigates to article view (or hydrates). Crawler gets meta without JS; browser gets interactive SPA.
- Alternative: metadata-only HTML with redirect; less ideal.
- Prerender: not needed initially.

## Risks
- RLS runtime drift; verify live before deploy.
- Slug uniqueness not enforced by DB (no unique index) -> rely on backfill + app validation.
- Cache invalidation after edits.

## Files to modify (implementation phase)
- vercel.json
- api/article-meta.js (new)
- sitemap.xml (regenerate)

## Acceptance criteria
- 200 + meta for valid slug; 404 invalid; legacy hash routes work; refresh works.

## Unverified items
- Live RLS state.
- Live count of published berita slugs.
- Vercel rewrite behavior in production (test after deploy).

**Final status:** READY FOR PHASE 3B IMPLEMENTATION REVIEW
EOF
echo done