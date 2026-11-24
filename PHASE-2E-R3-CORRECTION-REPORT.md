# PHASE 2E-R3 — CORRECTION REPORT

**Status:** PHASE 2E-R3 BLOCKED — OWNER DECISION REQUIRED

## Blocker
Production table identity cannot be verified without database access or schema evidence. The SQL currently assumes `articles(id, type, published, data jsonb)`, but this is unverified. No SQL was modified to avoid inventing the production table name.

## Required evidence from owner
- Exact table name and schema (e.g., public.<table>).
- Column names for UUID primary key, type, published, and JSONB data column.
- JSONB path/key for slug (currently assumed `data.slug` / `data->>'slug'`).
- Whether slug column is JSONB key or top-level column.
- Existing unique constraints/indexes on slug (if any).

## Mapping status
All 13 candidate slugs in 05-APPROVED-MAPPING.json already match the approved Phase 2D mapping; existing slug preserved. No mapping changes needed.

## SQL status
No SQL files changed in this phase due to unresolved table identity. Previous corrected SQL remains as draft and is NOT executable until table identity is confirmed.

## Unresolved assumptions
- Table name `articles`.
- Columns `id`, `type`, `published`, `data`.
- JSONB key `slug` under `data`.
- Lock mode and row semantics depend on actual schema.

## Owner decisions required
1. Confirm production table and column names.
2. Confirm JSONB slug path.
3. Approve any schema/index changes if needed for collision safety.

**Final Status:** PHASE 2E-R3 BLOCKED — OWNER DECISION REQUIRED
EOF
echo done