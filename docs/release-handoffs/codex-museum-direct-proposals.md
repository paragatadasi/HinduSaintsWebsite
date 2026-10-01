# Release Handoff: codex/museum-direct-proposals

- Status: ready
- Branch: `codex/museum-direct-proposals`
- Commit: `02c7bafa93f325dbb31f53f4a3be8282b13bb365`
- Owner/agent: `Museum Data Integration`
- Bundle priority: immediate release candidate

## Summary

- Existing museum proposals appear directly on each unambiguously linked saint review, with no preparation step. Section listings and reference details remain accessible and link to the canonical review page.
- Remove temporary preview editing controls; prefill the real proposal edit form and capture the original source snapshot atomically when confirming or editing a proposal.
- Extend Placement review into reconciliation: latest imported Airtable values appear automatically, changed fields are identified against confirmed placement, and curators can keep, accept, or edit a resolution. Browsing remains read-only.
- Preserve confirmed decisions, reject stale source values, and recheck source identity/content under saint, source, and existing mirror-row locks. Unmatched records remain visible for reconciliation.

## Verification

- `npm run prepare:deployment`: passed, including fresh `dev:check`.
- `npm run codex:verify`: passed on final implementation before handoff.
- `npm test`: 202 passed.
- `npm run test:museum:integration`: passed against fresh isolated local PGlite, including direct availability with no snapshot, read-only browsing, ambiguous-link rejection, edited confirmation, immutable source capture, no repeated reviewed proposal, automatic mirror discrepancy, stale virtual/persisted snapshot rejection, keep-site resolution, and prior museum save/import/merge scenarios. Real PostgreSQL concurrent-session stress testing was not performed.
- Isolated authenticated browser: section-to-canonical-review link, immediate existing proposal, prefilled edit/confirm, persistence after reload, no repeated proposal and removal of preparation button passed.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: none; requires the already released museum integration schema.
- Environment variables: none.
- Data/backfill/release steps: none. Do not stage or bulk-accept proposals. Read projection makes linked proposals available immediately; snapshots are captured on an explicit decision. No production data was changed during development.
- Queue/deploy trigger: ready now under the user's prepare-for-deployment request and standing ready-handoff release policy.
- Smoke test: navigate a section, open a matched saint, verify its existing proposal is available without preparation, edit/confirm one authorized test record, and check reconciliation against latest imported source values. Unmatched records must remain visible without guessed saint links.

## Risk And Conflicts

- Shared areas touched: museum index, section workspace/page, actions, review and saint review pages; museum service/proposal contract; new read-only direct-proposals module; integration verification script and museum docs. No global CSS/auth/schema changes.
- Expected conflicts: queued `codex/museum-shared-search` overlaps `app/museumadmin/[section]/museum-section-workspace.tsx`, `app/museumadmin/page.tsx`, `app/museumadmin/review/page.tsx`, and `lib/museum-proposals.ts`. That branch also extracts a proposal dialog/preview helper. Preserve direct source-to-saint review links, removal of temporary unsaved edit controls/preparation, and reconciliation behavior when combining search changes. Release captain owns resolution or deliberate deferral; do not silently replace either feature.
- Rollback notes: revert application change if needed; retain source snapshots, decisions, and existing schema. Reverting restores the earlier preparation UI, not a data rollback. Confirmed placements remain intact.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
