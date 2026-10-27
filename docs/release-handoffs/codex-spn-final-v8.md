# Release Handoff: codex/spn-final-v8

- Status: deployed
- Branch: `codex/spn-final-v8`
- Commit: `1adc06293bdcfc24bb1a25e7c97463e6c18ad2e3`
- Owner/agent: Citra
- Release scope: proposal-only; museum intake remains a separate blocked release candidate

## Summary

Final v8 proposal as latest East–North candidate, preserving earlier options and newer curator edits. Includes source-context fit estimates, uncertainty, local city/visitor connections, and protected pilgrimage companion.

## Verification

- `npm run prepare:deployment`: passed.
- Fifteen focused tests passed across final-v8, room-proposal and proposal-corrections (14 original tests, plus final per-case summary regression).
- Manifest hashes verified. 1,423 source observations, three named holdings, 99 reviewed relationships preserved. Raw observed shares 303 remain separate from planning estimates 318.5.
- Full production build and authenticated route/render smoke required in Mira's real-dependency release worktree. This feature worktree uses a dependency junction, unsuitable for standalone trace copying on Windows.

## Deploy Notes

- No migration, environment variable, production data write or backfill.
- Private HTML route `/museumadmin/plan/pilgrimage` requires museum and full-catalog access; no-store/noindex, sandboxed.
- Raw per-case totals, headroom and source lists/counts were stale in input packet; recomputed from final destinations with Saarthi approval. Original manifest and packaged hash/erratum retained in validation JSON.
- All current curator overrides retain precedence. No physical confirmations or identity merges.
- Sri Chand allowance is three of five standard shelf spaces; no unresolved approval hold.

## Risk And Conflicts

- Shared areas: SPN explorer, proposal reconciliation/correction reader, plan route, scoped stylesheet.
- Mira's duplicate local package must not be integrated alongside this branch.
- No intake code included; intake separately handed off on codex/museum-relic-intake-ui.
- Rollback: revert this feature integration; earlier proposals remain intact.

## Release Captain Notes

- Integrated main: `e44d756`.
- Deploy merge: `b78579b`.
- Production workflow: `Dispatch Production Deploy` run `40435750011`, completed successfully.
