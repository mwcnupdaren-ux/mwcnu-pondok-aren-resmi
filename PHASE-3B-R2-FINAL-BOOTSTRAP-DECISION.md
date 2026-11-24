# PHASE 3B-R2 — FINAL BOOTSTRAP ARCHITECTURE DECISION

**Status:** READY FOR IMPLEMENTATION APPROVAL  
**Mode:** Planning only

## Final architecture
- Serverless function returns full HTML document with server-rendered article title, description, date, image, body, and SEO meta.
- Browser loads existing assets (CSS/JS) and SPA takes over without duplicating content.
- Crawler without JS reads article body from initial HTML.
- Legacy hash routes remain client-side.

## HTML response structure
- Full HTML document mirroring index.html head/body.
- Dynamic meta tags in <head>.
- Article rendered inside `#arBody` container as server-rendered HTML.
- Script tag sets `window.__ARTICLE_SLUG__` before loading content.js/app.js.

## SPA takeover
- content.js loads app.js dynamically; app.js route() handles `berita/{slug}`.
- If server slug present, app should skip re-render or replace content cleanly using DOM markers to avoid flash.
- Use `history.replaceState` to normalize URL without hash duplication.
- No reliance on hashchange for initial server-rendered path.

## JavaScript disabled / bootstrap failure
- Article content already in HTML; remains readable.
- If app.js fails, page still shows article content and metadata.

## Security
- Sanitize article body: escape HTML then apply minimal rich-text formatting (bold/links/lists) or output escaped text. Prefer server-side escaping; do not inject raw HTML from DB.
- Escape metadata fields.
- Validate slug regex and image URLs.
- Validate/normalize all fields.

## File plan
Create:
- api/article-meta.js
Modify:
- vercel.json (rewrite /berita/:slug -> function)
- sitemap.xml (add verified published slugs)
Possibly:
- js/app.js (minimal integration for server slug)
- js/content.js (minimal bootstrap)

Do not touch CMS/auth/RBAC/KARTANU.

## Acceptance criteria
- Valid URL 200 with article body in HTML source.
- Invalid/unpublished 404.
- Crawler sees content without JS.
- Direct nav/refresh/back-forward work.
- Legacy hash routes work.
- No content duplication/flash.
- Mobile compatible.

**Final status:** READY FOR IMPLEMENTATION APPROVAL
EOF
echo done