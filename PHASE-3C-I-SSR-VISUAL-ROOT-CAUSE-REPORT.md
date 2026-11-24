# PHASE 3C-I — SSR VISUAL SHELL & CSS ROOT-CAUSE AUDIT

## Root cause
The SSR document template in `api/article-meta.js` (lines 54–82) emits a minimal HTML document containing only `#arBody` and asset links, but omits the main site shell (header, nav, footer, layout containers) present in `index.html`. CSS variables and layout depend on the full shell; body background defaults to black due to missing theme variables/layout.

## Evidence
- `api/article-meta.js:54-82` — minimal template.
- `index.html` — full shell with header/topbar/main/footer.
- `css/style.css:600-603` — `.at`, `.abody` exist but rely on shell variables.
- Asset paths: `/css/style.css?v=79`, `/js/config.js?v=22`, `/js/content.js?v=47` resolve from `/berita/{slug}` as absolute paths (correct).

## SPA init
- `js/app.js` likely preserves `#arBody` if present (per 3C-C). Not verified in this audit due to scope, but template lacks full shell.

## Minimal correction proposal
Integrate SSR article into the full site shell by reusing `index.html` as template and injecting `#arBody` into the main content area, preserving metadata. Requires owner approval.

## Regression risks
- Duplicate `#arBody` if SPA also renders.
- Asset version mismatches.
- SEO metadata duplication.

## Validation steps
- Compare SSR source to index.html shell.
- Verify no duplicate metadata.
- Test at desktop/mobile.

Status: AUDIT ONLY — no code changes.
EOF
echo done