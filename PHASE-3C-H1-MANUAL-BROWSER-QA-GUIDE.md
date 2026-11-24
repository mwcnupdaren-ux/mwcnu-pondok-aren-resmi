# PHASE 3C-H1 — MANUAL BROWSER QA GUIDE

## Start local runtime
```
cd mwcnu-meta-worktree
npx --yes vercel dev --listen 3000 --yes
```

## Verified slug
`halal-bi-halal-nu-pondok-aren-membumikan-dakwah-menguatkan-ranting`

## Article URL
`http://localhost:3000/berita/halal-bi-halal-nu-pondok-aren-membumikan-dakwah-menguatkan-ranting`

## Chrome test steps
1. **Direct navigation** — open URL, verify title/body visible, URL unchanged, no redirect.
2. **SSR preservation** — DevTools Network → disable cache → reload; check View Source for article body; after JS load body remains, no duplicate.
3. **SPA navigation** — click nav to `/`, then `/berita`, open another article, verify title/body update, return to original.
4. **Legacy hash** — open `/#berita/{slug}`, verify renders, no empty/duplicate.
5. **History** — navigate two articles, Back/Forward, verify URL/title/body sync.
6. **JS disabled** — Settings → disable JS, reload article, verify readable.
7. **Responsive** — DevTools device toolbar; desktop & mobile; check title/body/images/no horizontal overflow.

## Pass criteria
- Article title and body visible in all cases.
- No empty/duplicate body.
- Title/canonical/meta correct.
- URL remains canonical path (no hash/redirect).

## DevTools inspection
- Elements: `<title>`, `<meta name="description">`, `<link rel="canonical">`, `#arBody`.
- Console: no routing/article errors.
- Network: 200, no unexpected redirects.

## Evidence checklist
- Screenshots: direct, SSR source, SPA nav, legacy hash, history, JS-disabled, mobile.
- Notes: console errors, layout overflow.

No credentials or env values exposed. No code changes.
EOF
echo done