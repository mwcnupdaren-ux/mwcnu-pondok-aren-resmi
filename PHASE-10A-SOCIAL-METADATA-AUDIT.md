# PHASE 10A — SOCIAL METADATA AUDIT

## Root cause
`api/article-meta.js` reuses `index.html` shell and replaces only `<title>`, `<meta name="description">`, and `<link rel="canonical">`. It does not replace any `og:*` or `twitter:*` tags, so homepage social metadata remains.

## Evidence
- api/article-meta.js: regex replacements only for title/description/canonical.
- index.html contains full OG/Twitter block with homepage values.

## Proposed minimal correction
Add regex replacements for:
- og:title, og:description, og:url, og:image, og:type=article
- twitter:title, twitter:description, twitter:image
- (optional) og:image:width/height/alt may remain generic or be updated.

No code changes in this phase.
EOF
echo done