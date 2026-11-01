# Release Handoff: codex/spn-southern-headlines

- Status: `ready`
- Branch: `codex/spn-southern-headlines`
- Commit: `4068e73dca8c803e1bd7c68d584d4d41960230eb`
- Owner/agent: Citra

## Summary

- Southern guide v2 loads Saarthi's final v5 headline review: 146 source records across 51–57 and 62. Counts: 51=27, 52=20, 53=16, 54=11, 55=14, 56=16, 57=17, 62=25.
- Exactly sixteen approved destination updates: four Tamil entries to54, nine Srirangam entries to57, two Kadapa entries to53, Chattampi to56. Existing57 headline placements remain intact.
- Each vitrine has reviewed lead/placement guidance at the top and fit qualifications in the shared disclosure. No invented shelf allocations. Chandra Kali Prasad has a dated guide-only Still alive/bottom-shelf instruction.
- Original Southern v1 remains immutable and read-only; same-case clearance receipts carry forward. Nanna remains held at candidate51/native67. Mahan Maakan and Rangacharya remain locate/verify tasks until a location is recorded; Manick holding-verification restriction remains.

## Verification

- `npm run dev:check`: passed.
- `npm test`: 895 passed, 1 skipped before the final unlocated-holding test; final Southern focused suite: 9 passed.
- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed on the final committed code.
- Fresh catalog/physical projection: all146 rows and the eight counts above; zero changed source revisions; only expected Nanna51/native67 difference. Physical snapshot unchanged by projection.
- Exact roster-diff test verifies only16 changes, all previous145 sources retained, canonical identities and source revisions unchanged, and old57 records retained.

## Data And Deploy Notes

- Nadi already saved and read back all16 native proposals under explicit user approval. Evidence: southern16-final-readback.json, southern16-after-catalog.json and southern16-after-physical.json in her spn-jivan-checkbox-audit-2026-10-31 directory.
- Readback proves all physical locations, confirmation history, preparations and clearances unchanged; no outside proposals or tier/section changes. Chattampi remains confirmed in staging.
- Migrations: none. Environment variables: none. No deployment data script.
- No other fourteen regional candidates, canonical life-status edits or forced Nanna identity links. 17/70/23 reconciliation remains separate.
- Existing partial clearing and Western refresh are ancestors of this branch and already integrated by Mira.

## Shared Areas And Risks

- Guide registry, physical route version dispatch, shared guide type and companion renderer. Optional headline fields reuse existing shared styling and are documented in the design system.
- Old Southern clients must refresh to v2. Holds, current identity checks and newer curator destinations still take precedence. Fit estimates are not measured capacity; 51/52/57/62 retain fit cautions.
- Skill review: no reusable interpretation changes; existing source/identity rules retained.

## Release Captain Notes

- Integrate through main then deploy. Check Southern counts, headline guidance, Chandra tag and prior clearing state after release. Do not record physical test moves.

