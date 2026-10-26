# Release Handoff: codex/spn-sankaranya-colocation

- Status: `ready`
- Branch: `codex/spn-sankaranya-colocation`
- Commit: `2f8ed7f40b9fb4f16087ccaaf026c21aaa09f550`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Applies the user-approved exact-source Sankaranya/Yogendranath co-location with Radharaman Charan Das to all five current SPN exact-allocation proposals, resolving the target per version rather than hardcoding32.
- Corrects local focus and rationale, recalculates affected recorded shelf-share estimates, preserves both Primary tiers and all other source/physical data. Original immutable packets remain intact; the dated correction applies to copies before live curator reconciliation.
- Future explicit curator destinations still take precedence with review flags. The archived design study has no individual allocations and is not given invented placements.

## Verification

- `npm run prepare:deployment`: passed.
- 26 targeted tests passed: every current version, exact source-only changes, 3.5484 target estimate, unchanged evidence and tiers, idempotence, different future target, ambiguous-target guard and live destination preservation.
- Browser checks passed across all five options: saint search and portrait rows put the pair together; updated rationale visible; mobile390px no overflow, no runtime errors.
- Nadi fresh after.json 2026-10-26T13:54:51.170Z checked: both Featured/Primary, FAM002, Proposed with empty destinations and no confirmations. No current saved placement conflict.
- Release captain owns integrated codex:verify.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill: no writes from this release. Nadi separately saved supported guru relationship; this feature does not modify relationships or tiers.
- Current five target cases are32: source estimate3.4373 plus1/9 becomes3.5484. Physical fit remains unconfirmed.
- Skill review: no reusable rule change; existing exact-identity/source-versus-placement principles applied.

## Risk And Conflicts

- Shared areas: protected plan server composition; new lib/spn-proposal-corrections.ts; explorer design documentation.
- No auth, routing, schema or dependency changes. Original proposal data untouched.
- Guard rejects an unexpected source set or ambiguous target rather than guessing a destination.
- Rollback: revert feature; historical proposal packets remain available.

## Release Captain Notes

- Main: pending
- Deploy: pending
- Production workflow: pending
