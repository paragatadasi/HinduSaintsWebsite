# Release Handoff: reviewed component staging

- Status: `ready`
- Branch: `codex/reviewed-component-staging`
- Commit: `1a28252` (UI `6a52d6b`)
- Owner: Citra; backend parity reviewed by Nadi

## Change

Exact fresh reviewed classification one_complete_japa_arm_support can show Record in staging even when a historical partial component receipt is currently projected. All other identity, fixed housing, verified item, movement hold and ordinary placement checkbox restrictions remain unchanged. Uses existing one-source confirmation dialog and ordinary guarded POST; never clears a whole case or bypasses server review.

## Verification

- prepare:deployment passed for UI; final dev:check passed after adding regression.
- 8 focused reviewed-object/component tests passed. Regression verifies partial version0, reviewed ordinary staging permission, version1 whole location wins, original component receipt unchanged, changed/missing housing still throws.
- Actual-component browser fixture includes historical partial receipt/current unknown. Action visible; ordinary placement checkbox stays disabled; failure is visible and retry uses identical body/UUID with one staging record and no guide/clear scope.

## Deploy

No schema/env/backfill/data writes. Airtable stays disabled. Existing release ancestors already integrated; merge only new UI/test/handoff changes, preserving identity-index work in main. No backend code changed.
Nadi will perform the separately authorized exact-source staging correction only AFTER native UI is confirmed live and fresh evidence checked. Historical receipt remains in audit history. Do not report public dispatch workflow alone as proof private serving deployment is complete.
