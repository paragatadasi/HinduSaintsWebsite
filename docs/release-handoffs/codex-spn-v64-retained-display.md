# Release Handoff: codex/spn-v64-retained-display

- Status: `ready`
- Branch: `codex/spn-v64-retained-display`
- Commit: `3e39859a66f2e6d9b7ad04ff2c41c5f3dc384458`
- Owner/agent: Citra

## Summary

Remove Vitrine 64's special bulk-clearing card and its forced selectable-map entry. It is a retained display, not an incoming placement phase. Individual outgoing placement/search workflows remain unchanged so non-Sikh relics can still leave for their approved destinations. No classification or location changes.

## Verification

- npm run dev:check: passed.
- npm run prepare:deployment: passed.
- git diff --check: passed.
- Narrow removal of existing UI only; no new controls or backend behavior. Existing source/housing guards retained.

## Deploy Notes

- No migrations or environment changes.
- No data writes, physical history or staging corrections.
- Shared file: components/admin/spn-room-move-companion.tsx.
- Based on Southern headline head08d00bf; integrate after that branch if not already integrated.
- Production spot check: no Clear Vitrine 64 card; individual records originally in64 remain searchable/movable through destination guides.
- Existing clearance receipts and backend history remain readable.
