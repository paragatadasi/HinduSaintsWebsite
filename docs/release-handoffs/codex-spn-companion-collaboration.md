# Release Handoff: codex/spn-companion-collaboration

- Status: ready
- Branch: `codex/spn-companion-collaboration`
- Commit: `07af67aa74317e3278d7a1c7a3d63ff12207fc1f`
- Owner/agent: Museum companion UI with Nadi backend
- Bundle priority: immediate release candidate

## Summary

- Preserve phase, vitrine and active workspace tab on refresh.
- Poll lightweight physical progress every 10 seconds while visible and on focus, with ETag/304, periodic full refresh, stale-response protection and immediate saving feedback. Exact stale duplicate confirmations are no-ops; conflicting moves return a refreshed conflict.
- Search the full SPN source inventory beyond ready phases. Source-scoped additions support proposed destinations or an explicit physical confirmation, with optional shelf preserved on reopening.
- Project additions into the overall current proposal and receiving phase. Remove old membership without mutating frozen guides, merging identities, duplicating sources, or rewriting prior physical receipts.
- New protected catalogue route and append-only `MuseumCompanionAddition` audit records. Assistant roles can read but cannot plan/confirm.

## Verification

- `npm run prepare:deployment` and final `npm run dev:check`: passed.
- `npm test`: 710 passed, 1 skipped, 0 failed.
- `npm run codex:verify`: production build and 27 static pages passed; final release-build log is in the local QA directory below.
- Actual component in two browser pages with a shared simulated server: remote checkbox update, no duplicate write, retained Vitrine 73 after reload, outside-phase search, proposed-only versus direct physical move, saved shelf preservation, and mobile layout passed.
- Nadi ran `scripts/verify-museum-physical-locations-local.ts` against fresh disposable PostgreSQL 16: stale same-target no-op/no new audit; stale different target conflict; exact addition version/source/target; current receiver guide and readiness; newer arrangement precedence; progress revision parity all passed. No production test writes.
- Projection regressions: current proposal inclusion, removal of pending receiver hold, private holdings stay excluded, stale/removed identities ignored, receiving phase only, no duplicate/invented phase.
- Browser harness and logs: `C:/Users/aporu/.codex/visualizations/2026/09/08/01a08075-8a60-7603-adb1-c380dff548d8/companion-parchment-qa/` (`concurrent-check.cjs`, `concurrent-mobile.png`, `collaboration-build-release.log`, `collaboration-tests-final.log`).

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Data/backfill/release steps: none. Existing proposals, physical receipts, drafts, submissions and photos are untouched at deployment.
- Includes Nadi commits 75c85bc/2185e2b as cherry-picks 42f4e87/f1e689a. Do not separately integrate a duplicate backend handoff.
- If physical confirmation fails after planning succeeds, the UI explicitly leaves the destination proposed and offers recovery; it does not label the relic moved.
- Production smoke should be read-only: museum-wide search, refresh retains selection, permission visibility, background progress endpoint. Do not create test physical moves in production.

## Risk And Conflicts

- Shared areas: physical-location HTTP/domain/client, guide registry and source validation; SPN reviewer and companion; design-system documentation.
- New additions keep exact source identity and version. Registered phase clear/transfer requirements and destination readiness still apply to direct confirmation.
- A destination without a ready phase appears in the overall proposal/search but does not create invented guidance. Added sources can be reassigned through search; frozen-guide suggestion controls are not sent for unsupported dynamic groups.
- Release captain must run integrated verification against current main. This branch includes no unrelated root-worktree changes.
- Rollback: revert this feature's UI/backend integration together. Preserve append-only audit data and all physical history.
- Skill review: no new reusable museum interpretation rule; existing separation of proposal and physical state remains applicable.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
