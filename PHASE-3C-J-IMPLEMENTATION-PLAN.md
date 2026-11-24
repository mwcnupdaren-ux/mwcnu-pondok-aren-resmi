# PHASE 3C-J — SSR SITE SHELL REUSE IMPLEMENTATION PLAN

## Status
READY FOR OWNER REVIEW (planning only, no implementation)

## Recommendation
Reuse the existing `index.html` shell as a static template string in `api/article-meta.js`, injecting article metadata and `#arBody` into the main content area. Keep `js/app.js` and `js/content.js` initialization intact with a guard to avoid duplicate render when `#arBody[data-server-rendered]` exists.

## Files to modify (future)
- `api/article-meta.js` — replace minimal HTML template with full shell + article injection.
- `js/app.js` — add guard to skip re-render of server-rendered article body.
- `js/content.js` — ensure no duplicate init.

## Untouched
- Database, RLS, CMS, auth, KARTANU, other routes, vercel.json (already has rewrite), assets.

## Validation
- Direct article URL shows full site design + article.
- JS disabled still readable.
- SPA navigation works.
- No duplicate header/footer/scripts.

## Rollback
- Revert `api/article-meta.js` to minimal template; revert app.js guard.

No code changes performed.
EOF
echo done