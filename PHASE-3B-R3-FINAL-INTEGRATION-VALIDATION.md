# PHASE 3B-R3 — FINAL INTEGRATION VALIDATION

**Status:** READY FOR IMPLEMENTATION APPROVAL  
**Mode:** Read-only

## A. SPA takeover mechanism (verified)
- app.js route() parses hash/path; renders article via renderArticle(id).
- content.js loads app.js dynamically after Supabase data; rerenderRoute dispatches hashchange or MWC_RERENDER.
- Integration: server injects `window.__ARTICLE_SLUG__`. After app load, if slug present and no hash, set `location.hash = '#berita/'+slug` only if needed; better call renderArticle(slug) directly to avoid duplicate. Use `history.replaceState` to keep URL `/berita/{slug}` without hash.
- Legacy `/#berita/{slug}` handled by existing hash route.

## B. Article body format
- Data field `isi` is plain text with paragraph breaks; MW.rich renders headings/lists/blockquote/links.
- Server must sanitize: escape HTML, then apply minimal rich formatting allowlist (p, strong, em, h3, ul/ol/li, blockquote, a with https). No script/iframe/event handlers.

## C. Serverless integration
- HTML includes server-rendered article in #arBody.
- Inject `window.__ARTICLE_SLUG__` and marker `data-server-rendered="true"`.
- SPA should skip re-render if marker present, or replace content cleanly.
- If JS fails, article remains readable.

## D. Final file list
Create:
- api/article-meta.js
Modify:
- vercel.json (rewrite /berita/:slug)
- sitemap.xml (add verified slugs)
Possibly minimal:
- js/app.js (handle server slug, avoid duplicate)
- js/content.js (pass slug to app)
No changes to CMS/auth/RBAC/KARTANU.

## Pseudocode
- Server: validate slug; query Supabase anon; if not found return 404 HTML; else render HTML with meta + body; set window.__ARTICLE_SLUG__.
- Client: after data load, if window.__ARTICLE_SLUG__ and !location.hash, call renderArticle(slug) or set hash without triggering duplicate; use history.replaceState to keep path.

## Acceptance criteria
- Valid URL 200 with body in HTML.
- Invalid/unpublished 404.
- Crawler sees content without JS.
- Direct nav/refresh/back-forward work.
- Legacy hash works.
- No duplicate/flash.
- Mobile OK.

## Risks
- RLS live state.
- Slug uniqueness not enforced by DB.
- Cache invalidation.

**Final status:** READY FOR IMPLEMENTATION APPROVAL
EOF
echo done