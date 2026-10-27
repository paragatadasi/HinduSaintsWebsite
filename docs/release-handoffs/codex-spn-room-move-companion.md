# Release Handoff: codex/spn-room-move-companion

- Status: deployed
- Branch: `codex/spn-room-move-companion`
- Commit: `8e764a691cd5c2462a56fc50f1f7b6f7bf9c7ec4`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Starter-row companion: clear, place key families, browse city groups, record actual moves and defer or decline suggestions.
- Versioned guide content stays separate from physical history; no new proposal activation.

## Verification

- dev:check passed; codex:verify passed; 12 focused tests passed; authenticated local HTTP save/reopen/retry/conflict/decision checks passed; local browser rendering checked.

## Deploy Notes

- Migrations: 20261028010000_museum_guide_suggestion_decisions (additive); prior physical ledger migration already deployed.
- Environment variables: None. Keep Airtable delivery disabled.
- Data/backfill/release steps: No automatic production data writes. Visible review panel records the user-approved23 reported placements; preserve originals and unspecified shelves. Current proposal default unchanged; final revisions load separately.
- Queue/deploy trigger: deployed

## Risk And Conflicts

- Shared areas touched: styles/globals.css; museum physical API; Prisma schema; protected museum move route.
- Expected conflicts: Includes Nadi365396d and58aa7f1 by cherry-pick; do not apply code twice. Backend handoffe434f0a can be reconciled as included.
- Rollback notes: revert `8e764a6` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: `9c45784`
- Pushed to `main`: yes
- Merged to `deploy`: `78468ff`
- Production workflow: [40579415267](https://github.com/paragatadasi/HinduSaintsWebsite/actions/runs/40579415267) — success
