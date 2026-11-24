# PHASE 3A — CRAWLABLE ARTICLE URL & SEO METADATA AUDIT

**Status:** READY FOR OWNER REVIEW  
**Worktree:** mwcnu-meta-worktree  
**Audit type:** Read-only

## 1. Executive summary
Website is a static SPA with hash-based routing. There is no server-side rendering or Vercel Function. `/berita/{slug}` is not currently supported; vercel.json only rewrites `/berita` to `/`. Article data is loaded client-side from Supabase via anon key. Crawlable SEO requires a server-side metadata endpoint and rewrite.

## 2. Actual repository baseline
- Framework: static HTML/CSS/JS (no build step; `serve` for dev).
- Entry: index.html; app.js ~183KB; content.js loads Supabase data.
- Supabase URL/key in js/config.js (anon/publishable, no service role).
- Vercel config: cleanUrls true; rewrites list includes `/berita` -> `/` but no `/berita/:slug`.

## 3. Existing routing architecture
- Hash router: `location.hash` routes; `route()` parses `berita/{idOrSlug}`.
- Article links use `#berita/{slugOrIndex}`.
- Direct path `/berita/{slug}` is not handled; would rely on SPA fallback/404.

## 4. Existing article data structure
- Content loaded via Supabase `content_items` (type berita). Fields: judul, slug, ringkasan/deskripsi, foto, tanggal, isi, meta_judul, meta_desc, etc.
- RLS: public read for published (assumed; not verified here).

## 5. Deployment and serverless capability
- No Vercel Functions present. Capability exists (Vercel supports) but not implemented.
- Static hosting only currently.

## 6. SEO metadata implementation gaps
- No server-rendered title/description/OG/Twitter for articles.
- No canonical per article.
- Sitemap static (only homepage).

## 7. Sitemap and robots findings
- robots.txt allows /, disallows /v/ /admin/, points to sitemap.xml.
- sitemap.xml static single URL.

## 8. Recommended technical architecture
- Add Vercel Serverless Function (e.g., /api/article-meta?slug=) querying Supabase with anon key (RLS published only).
- Add rewrite `/berita/:slug` -> function returning HTML with meta tags + redirect/JS bootstrap, or prerendered HTML.
- Update sitemap dynamically or generate static list of 13 published slugs.

## 9. Alternatives and trade-offs
- Client-side meta only (poor crawler support).
- Prerender at build (requires build pipeline).
- Edge middleware (more complex).

## 10. Security and regression risks
- Must not expose service role; use anon key + RLS.
- Preserve legacy hash routes.
- Avoid breaking SPA navigation.

## 11. File-level implementation plan
- vercel.json: add rewrite `/berita/:slug` -> `/api/article-meta?slug=:slug`.
- New: api/article-meta.js (or .ts).
- Update sitemap.xml generation (manual or function).
- Keep index.html/app.js unchanged initially.

## 12. Ordered implementation phases
1. Create serverless metadata endpoint.
2. Add rewrite.
3. Test direct URLs/status/meta.
4. Update sitemap.
5. Legacy route verification.

## 13. Acceptance criteria and test plan
- GET /berita/{valid-slug}: 200, HTML contains title/description/OG/canonical.
- GET /berita/{invalid}: 404.
- Legacy #berita/{slug} still works.
- Refresh on direct URL works.
- Sitemap lists 13 published slugs.

## 14. Files that would need modification
- vercel.json
- New api/article-meta.js (or similar)
- sitemap.xml (or generator)
- Possibly robots.txt (no change needed)

**Final status:** READY FOR OWNER REVIEW
EOF
echo done