# PHASE 3B-R4 — ROUTING TAKEOVER DECISION

**Status:** READY FOR IMPLEMENTATION APPROVAL  
**Mode:** Read-only

## renderArticle contract (verified)
- `renderArticle(id)` at js/app.js:680 accepts ID or slug (via articleIndex).
- `articleIndex(ref)` (line 623) resolves numeric index or slug (case-insensitive).
- renderArticle fills `#arBody` via `put(document.getElementById('arBody'), h)` (line ~700).
- No URL mutation inside renderArticle; route() handles URL.
- Side effects: sets document.title, renders related, scroll.

## Final takeover mechanism
- Server HTML contains article body in #arBody with `data-server-rendered="true"`.
- SPA does not re-render on initial load if marker present; instead sets `window.__ARTICLE_SLUG__` and updates URL via `history.replaceState` to `/berita/{slug}` without hash.
- For subsequent SPA navigation, route() calls renderArticle(slug) normally and replaces #arBody content.
- Marker removed after first client-side navigation to avoid stale state.

## Marker lifecycle
- Present on initial server render.
- Removed when SPA renders a different article or user navigates away.
- Prevents false reuse of server content.

## Deployment gates
- Verify live RLS.
- Validate published slugs unique.
- Verify Vercel env vars.
- Pass direct URL/crawler tests.
- No deployment until owner approval.

**Final status:** READY FOR IMPLEMENTATION APPROVAL
EOF
echo done