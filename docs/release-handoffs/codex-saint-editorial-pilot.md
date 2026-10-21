# Release Handoff: codex/saint-editorial-pilot

- Status: ready
- Branch: `codex/saint-editorial-pilot`
- Commit: `ab8266c0c4a84c6528f5209b92999de60faea795`
- Owner/agent: `Public Experience Designer`
- Bundle priority: immediate release candidate

## Summary

- Ship the approved saint editorial pilot: refined uppercase title typography,
  wrapping mobile facts, a separate Read more/Read less control and preserved
  authored paragraph breaks. Keep photo-first mobile and View the Post primary.
- Correct hero focus rendering and calculate focus against the measured frame.
  Keep the header divider; remove internal source-list rules on saint pages.
- Preserve source and related-card typography, photo cards, the existing
  up-to-eight related-saint network and featured-saint fallback. No guru fact or
  separate header context panel is introduced.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed after temporary browser fixtures and their
  stale generated route validator were removed.
- Existing focal-position and related-saint-network tests: 11 passed.
- Browser fixtures: desktop, 390px and 320px, long names, missing images,
  eight related cards, featured fallback, expanded paragraphs, biography contents,
  gallery navigation, primary Instagram viewer, and private museum gallery sizing.
- `git diff --check`: passed. No temporary test routes or images are committed.
- Integrated production build belongs to the release captain.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: styles/tokens.css, styles/globals.css,
  SaintProfileSummary, SaintHeroGallery, lib/image-crop-config.ts,
  SaintDetailPageContent, docs/design-system.md.
- Expected conflicts: adjacent design-system documentation or shared CSS changes
  may need combining. Preserve other agents' changes.
- Risk: gallery component is also used by protected museum profiles. Its frame
  measurement supports their existing fixed image height; browser fixture checked
  288 by 336 pixels with saved focus applied. Compact museum summaries retain
  their existing presentation.
- Follow-up: automatic face detection and manual data recropping are separate work.
- Rollback notes: revert `ab8266c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
