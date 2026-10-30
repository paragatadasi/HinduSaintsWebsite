# Release Handoff: companion confirmation reads

- Status: `ready`
- Branch: `codex/companion-confirmation-reads`
- Commit: `568d22d4e9faacefd818b54deb0d2ba397caa4d8`
- Owner: Citra

## Summary

Reduce redundant database reads during move confirmation. Selected ordinary records skip component receipts that can only apply to the centrally listed V20 sources. Clearance queries share one correction read per invocation. No caching across calls or writes; transaction, locks, revisions, source checks and correction semantics remain intact.

## Verification

- 28 physical/component/preparation tests passed, including new read-count tests and existing correction invalidation checks.
- dev:check and prepare:deployment passed.
- Browser fixture separately measured immediate checked/Saving feedback at 68ms before mocked save response; this is not a production latency benchmark.
- No claimed production save-time improvement yet. Broad source reconstruction remains a separate investigation with Nadi.

## Deployment

- No migrations, environment changes or data corrections. Airtable stays disabled.
- Descends from living-status branch; includes its ready handoff.
- Shared files: museum-physical-locations, museum-component-clearances, component read tests.
- Nadi exact-source reviewed arm-support work may overlap physical-location imports/projection. Preserve both changes; this patch only changes read selection and correction promise sharing.
- Standard code rollback; no database rollback required.
