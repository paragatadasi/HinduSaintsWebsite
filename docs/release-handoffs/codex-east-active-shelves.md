# Release Handoff: codex/east-active-shelves

- Status: `ready`
- Branch: `codex/east-active-shelves`
- Commit: `28605b28172c30aaaf6b80dd657094eaa197171d`
- Owner/agent: Citra with Nadi backend

## Summary

- Loads remaining Eastern guides: V26 (30 source entries) and V24 (12), including Paramanand's approved V26 destination and provisional shelf 5 with unknown footprint/width fit warning.
- Consolidates navigation into Gaudiya East (former starter), Datta, Ram bhakti, East, Vraj, Northern journey. Combined row buttons retain each registered guide's save context and history; progress includes its guide-specific decisions.
- New immutable Eastern guide validates current source, identity and destination under the existing transaction. Two existing housing holds remain; no physical placements are written by deployment.
- Operational shelf packet adds the reviewed Paramanand supplement without modifying the captured 347-source packet. Current curator overrides remain authoritative.

## Verification

- npm run prepare:deployment passed (Prisma generation and TypeScript).
- npm test: 784 passed, 1 skipped, 0 failed.
- Actual-component browser checks passed: combined East V37 to V26 navigation; correct destination guide context; checkbox immediate pending feedback without claiming saved; no proposed shelf included in placement payload.
- Nadi fresh 31 October 09:20Z preflight: 42 sources, 40 actionable, 2 existing housing holds, 0 changed or pending shelf-context entries. Counts are source entries, not individual relic objects.

## Deploy Notes

- Integrate this combined branch. Includes Nadi 9796f45 cherry-picked as 28605b2.
- Migrations: none. Environment variables: none. Backfill: none. Physical writes: none. Airtable remains disabled.
- Entry link: https://hindusaints.org/museumadmin/move?phase=east2 (displayed within East).
- User requested load and deployment; ready for Mira's release.

## Risk And Conflicts

- Shared areas: companion navigation, move page, guide registry, physical mutation validation, shelf context API, addition owner order.
- Do not overwrite current proposals, clearance receipts, placements or decisions. Existing phase IDs stay stable behind consolidated navigation.
- Shelf fit remains provisional; known handling restrictions remain in force. Later Lokanath destination V10 is handled by current addition projection, not this fixed packet.
- Rollback code only; retain all saved physical history and curator edits.
- Data workflow skill review found no new reusable interpretation rule.

## Release Captain Notes

- Integration and production verification pending. Public workflow dispatch success alone does not verify the serving image.
