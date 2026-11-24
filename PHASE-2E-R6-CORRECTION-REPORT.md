# PHASE 2E-R6 — CORRECTION REPORT

**Status:** PHASE 2E-R6 COMPLETE — READY FOR RE-AUDIT

## Changes per file
- 01-PRECHECK.sql: fixed UUID array syntax using `= ANY (ARRAY[...]::uuid[])`; existing slug uses IS DISTINCT FROM; internal collision check added; external collision case-insensitive.
- 02-BACKFILL.sql: fixed UUID syntax; table lock; data-modifying CTE with UPDATE...RETURNING into temp table; count assertion 12; snapshot includes original slug JSON; in-tx preconditions; integrity check.
- 03-POSTCHECK.sql: removed cross-statement CTE; temp table `_approved`; LEFT JOIN missing detection; IS DISTINCT FROM; fail-closed DO blocks; format/length/duplicate checks.
- 04-ROLLBACK.sql: paired UUID-slug verification; table lock; removal of slug key (data - 'slug'); count assertion 12; fail-closed.

## Mapping consistency
All 13 UUID-slug pairs consistent with approved mapping (5 revised + 8 retained + existing preserved).

## Syntax validation
- UUID casts use `::uuid[]` on ARRAY expressions.
- Data-modifying CTE uses `WITH updated AS (UPDATE ... RETURNING id) SELECT id FROM updated`.
- Rollback uses paired join and removal.

## Transaction and lock analysis
- EXCLUSIVE table lock acquired before checks/UPDATE in backfill and rollback.
- All assertions inside transaction; default ROLLBACK retained.

## Rollback strategy
- Verifies exact 12 paired rows before update.
- Restores by removing slug key (`data - 'slug'`) to represent absent key.
- Asserts exactly 12 rows reverted; aborts on mismatch.

## Unresolved items
- No unique slug index; collision risk outside transaction remains (owner decision).
- Post-commit non-slug integrity not independently provable without durable baseline.

**Final Status:** PHASE 2E-R6 COMPLETE — READY FOR RE-AUDIT
EOF
echo done