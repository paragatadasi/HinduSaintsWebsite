# Release Handoff: codex/museum-not-on-display-constraint

- Status: ready
- Branch: `codex/museum-not-on-display-constraint`
- Commit: `88fd24874fbfcb242d272be1478f85e7144452e4` (code `0f14284`)
- Owner/agent: Nadi
- Bundle priority: immediate curator-blocking fix

## Summary

The existing UI and domain accept `not_on_display`, but the database CHECK rejects it. Widen that CHECK to the four existing decision states. No decision records or physical locations are changed by this migration.

## Verification

- `npm run dev:check`: passed, including the prepare:deployment check.
- `npm run codex:verify`: exit 0; compilation, type checking and static page generation passed. This Windows worktree uses a dependency junction, so standalone trace copying reported the known EPERM symlink warning. Captain must use the persistent verification worktree with real dependencies for integrated packaging.
- Isolated localhost PostgreSQL regression: passed. It reproduces rejection before the migration, then tests the actual service save, idempotent retry, readback, reset, stale-version rejection, preserved other alternative/history, rejection of an invalid state, and zero physical/arrangement/item placement writes. Temporary database was dropped.
- Regression command: `node --env-file="C:/Users/aporu/OneDrive/Documents/Saints Website/.env" node_modules/tsx/dist/cli.mjs scripts/verify-museum-guide-decisions-local.ts`. This script refuses non-local databases and creates its own isolated database.
- `prepare:deployment` ran dev:check successfully; its handoff step initially required the documentation whitespace commit. After that scoped commit, `npm run release:handoff` completed on the clean branch.

## Deploy Notes

- Migration: `20261031000000_museum_not_on_display_decision`.
- Apply through the normal deployment migrate/release phase before serving the new release. No production migration was run from this feature worktree.
- Environment variables: none.
- Data/backfill/release steps: none. No production decision submission was used as a test.
- Queue/deploy trigger: ready now; notify Nadi and Citra directly on production completion so the curator can retry.

## Risk And Conflicts

- Shared areas touched: the decision-table CHECK, a new isolated regression script, and museum move-companion documentation.
- Existing decision versions, alternative destinations, notes and audit history are retained.
- DDL requires a brief table lock. No table rewrite or backfill is required.
- Expected conflicts: none; preserve newer decision UI/domain work.
- Rollback: reverting application code does not require narrowing this additive CHECK. Do not narrow it while not_on_display rows exist.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
