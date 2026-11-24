# PHASE 3C-L — DIRECT ARTICLE LINK IMPLEMENTATION REPORT

## Changed files
- js/app.js: newsHref now returns `/berita/{slug}`; card click uses history.pushState + route() instead of location.hash.

## Validation (HTTP)
- /berita → 200
- /berita/{slug} direct → 200
- Browser click/legacy hash/spa navigation → NOT RUN (no browser automation)

## Risks
- Search results and hrefs now point to direct paths; full page navigation may occur for some clicks.

Status: LOCAL IMPLEMENTATION COMPLETE — awaiting owner review.
EOF
echo done