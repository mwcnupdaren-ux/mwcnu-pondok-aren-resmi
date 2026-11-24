# PHASE 2E-R9 — CORRECTION REPORT

**Status:** PHASE 2E-R9 COMPLETE — NO-GO (pending independent re-audit)

## Findings corrected
Actual baseline: 12 target records do NOT have key `slug` (key absent), not JSON null.

## Changes per file
- 01-PRECHECK.sql: condition changed from `data->'slug' IS DISTINCT FROM 'null'::jsonb` to `(data ? 'slug')` (fail if key present).
- 02-BACKFILL.sql: in-tx precondition changed to `(data ? 'slug')`; UPDATE guard changed to `NOT (data ? 'slug')`; snapshot retains data_noslug and slug_json.
- 04-ROLLBACK.sql: restore now uses `data = c.data - 'slug'` (remove key) instead of JSON null.

## Mapping
Unchanged (13 approved pairs).

## Consistency
- 12 targets: key absent verified from source export.
- Rollback restores key absence.
- Case-insensitive collision checks retained.
- Non-slug integrity check retained.

## SQL execution
No SQL executed. No DB/schema/application changes.

**Final Status:** NO-GO (pending independent re-audit)
EOF
echo done