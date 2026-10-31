# Release Handoff: codex/vitrine-clearing-recovery

- Status: `ready`
- Branch: `codex/vitrine-clearing-recovery`
- Commit: `10bc955`
- Owner/agent: Citra with Nadi backend
- Bundle priority: immediate release candidate

## Summary

- Adds curator-only selected-contents staging for existing availability-only cases 1, 4, 11, 23, 36, 45 and 73. Keeps preparation and whole-case clearance separate; held 68 excluded.
- Adds scoped historical recovery with exact selected source references, explicit acknowledgements, current-revision guards and idempotent retries. Confirmed later placements remain protected.
- Supplies uncapped preparation/physical history audit. No automatic backfill or physical writes on deployment.
- Fixes blank optional shelf being sent as null in both added-relic confirmation paths; nonempty shelf retained.
- Includes Nadi backend branch `codex/spn-optional-contents-staging` HEAD `23faebf` (code `a28f8b6`); do not release backend separately.

## Verification

- Nadi: 41 focused backend tests, dev:check, prepare:deployment passed.
- Combined codex:verify passed (local Windows folder permissions required elevated retry).
- Final blank-shelf follow-up: dev:check and actual companion browser addition/error/retry payload checks passed. Captain to run final integrated build.
- Browser checks: selected subset only; historical acknowledgements; same request identity on retry; protected placement count; mobile no overflow; real V1 normal placement and optional staging visibility; no production writes.
- prepare:deployment passed; handoff updated for final follow-up.

## Deploy Notes

- Migrations: none.
- Environment variables: none; Airtable delivery remains disabled.
- After production success, Nadi reads `/api/admin/museum-historical-staging?mode=audit` and fresh scoped previews before corrections.
- User directly confirmed remaining original V1 (8) and V45 (14) pieces are staged. Restrict retrospective changes to those previously audited source IDs, excluding any later confirmed moves or changed evidence. V4 Govardhan Shila remains unanswered: DO NOT correct V4.
- No deployment-time backfill, resets, whole-case clear or shelf assignment.
- Tree-rail checkbox UI change was canceled and is not included.

## Risk And Conflicts

- Shared areas: physical-location validation, historical staging API, placement authorization, guide metadata/base type, companion component.
- API is curator-only. Existing fixed/component/item and identity restrictions remain intact.
- Rollback: code rollback only; preserve any already recorded physical receipts.
- Skill review: existing museum-data interpretation rules already cover readiness versus clearing and later placement protection; no reusable skill changes needed.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: pending.
- Merged to deploy: pending.
- Production workflow: pending.
