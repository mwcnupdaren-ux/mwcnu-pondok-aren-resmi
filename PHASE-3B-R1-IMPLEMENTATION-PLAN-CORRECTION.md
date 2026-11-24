# PHASE 3B-R1 — IMPLEMENTATION PLAN CORRECTION

**Status:** READY FOR OWNER APPROVAL (planning only)

## Corrections
1. Server-rendered content: serverless HTML should include article title, description, sanitized body, date, image, and SEO meta. Browser takes over via JS after load; avoid duplication by rendering container empty and letting SPA render, or inject article JSON into window for client to render. Trade-off: server-rendering full body increases endpoint complexity; acceptable for crawlability.
2. SPA routing: setting location.hash = '#berita/'+slug may append hash to path URL (/berita/{slug}#berita/{slug}). Safer: use history.replaceState to normalize URL and let route() handle hash; or inject `window.__ARTICLE_SLUG__` and call renderArticle directly. Requires limited app.js integration.
3. Asset paths verified from index.html: CSS `/css/style.css?v=79`; scripts `/js/vendor/qrcode.js?v=20`, `/js/config.js?v=22`, `/js/direktori.js?v=3`, `/js/content.js?v=47`, `/js/konsultasi.js?v=1`; app.js loaded dynamically by content.js as `/js/app.js?v=80`.
4. Supabase config: uses window.MWC_CFG with anon/publishable key; endpoint should use env vars SUPABASE_URL and SUPABASE_ANON_KEY (Vercel env), never service role. If missing, endpoint returns 500 generic.
5. Sitemap: live verification required; do not assume 13. Generate from published berita with valid slug.
6. File plan: create api/article-meta.js; modify vercel.json and sitemap.xml; possibly limited app.js changes for slug bootstrap. Do not touch CMS/auth/RBAC.

## Final status
READY FOR OWNER APPROVAL
EOF
echo done