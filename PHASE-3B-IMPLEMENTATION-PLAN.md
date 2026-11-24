# PHASE 3B — IMPLEMENTATION PLAN & TECHNICAL SPECIFICATION

**Status:** READY FOR OWNER APPROVAL  
**Mode:** Planning only — no implementation

## A. Final architecture
- Serverless endpoint `/api/article-meta?slug=...` returns full HTML document with SEO meta tags.
- Browser bootstraps SPA from same HTML using existing assets.
- Crawler without JS receives metadata in initial HTML.
- Legacy hash routes remain client-side.

Request flow:
1. Crawler/browser requests `/berita/{slug}`.
2. Vercel rewrite routes to function.
3. Function queries Supabase anon for published berita by slug.
4. Returns 200 HTML with meta + SPA bootstrap, or 404 HTML.

## B. HTML and SPA bootstrap
- Function generates HTML document mirroring index.html structure but with dynamic meta tags in <head>.
- Loads `/css/*` and `/js/app.js`, `/js/content.js` etc. via script tags.
- Injects `window.__ARTICLE_SLUG__ = "..."` before app.js so SPA can auto-open article.
- app.js route() already supports `berita/{slug}`; if slug present in hash? Need set location.hash to `#berita/{slug}` before route() or call renderArticle. Plan: inject script sets `if(!location.hash) location.hash='#berita/'+slug;` then load app.
- No duplicate content: server HTML contains only meta + empty article container; SPA renders article client-side.
- Fallback: if bootstrap fails, HTML still has meta and a noscript link to homepage.

## C. Endpoint specification
- File: `api/article-meta.js` (Node serverless).
- Validate slug regex + length.
- Supabase anon REST: GET /rest/v1/content_items?select=id,type,data,published&data->>slug=eq.{slug}&type=eq.berita&published=eq.true&limit=1.
- Use env vars SUPABASE_URL, SUPABASE_ANON_KEY (or reuse config values; better env).
- Map fields: data.judul -> title; data.meta_judul/meta_desc/ringkasan -> description; data.foto -> image; data.tanggal/created_at -> published time.
- Escape HTML entities for all values.
- Fallback image: default OG image URL.
- Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=600.
- Errors: 400 invalid slug, 404 not found/not published, 500 query error.

## D. Vercel routing
Add rewrite before existing `/berita`:
```
{ "source": "/berita/:slug", "destination": "/api/article-meta?slug=:slug" }
```
Keep `/berita` -> `/`.

## E. Sitemap
- Source: published berita with valid slug.
- Prerequisite: verify live data count.
- Generate sitemap.xml manually or via script; include canonical www URLs.
- Update after publish/edit.

## F. File-level plan
Create:
- api/article-meta.js
Modify:
- vercel.json (rewrite)
- sitemap.xml (add 13 URLs)
Do not touch:
- index.html, app.js, content.js, CMS, auth, RBAC, KARTANU.

## G. Implementation sequence
1. Create endpoint locally, test with mock.
2. Add rewrite.
3. Test direct URLs, meta, 404, legacy hash.
4. Update sitemap.
5. Deploy (owner approval required).

## H. Acceptance criteria
- Valid URL 200 + meta.
- Invalid 404.
- Unpublished 404.
- Crawler sees meta without JS.
- OG/Twitter present.
- Canonical correct.
- Direct nav/refresh works.
- Legacy hash works.
- SPA nav works.
- Mobile OK.
- Supabase error handled.
- No regression to CMS/admin.

**Final status:** READY FOR OWNER APPROVAL
EOF
echo done