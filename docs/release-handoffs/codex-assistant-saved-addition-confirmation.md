# Release Handoff: codex/assistant-saved-addition-confirmation

- Status: ready
- Branch: `codex/assistant-saved-addition-confirmation`
- Commit: `80aca00d7bd75374850904ef6882b0a411e7f966`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Allow Museum Assistants to confirm one existing versioned curator addition in its current receiving guide, without creating or editing proposals. Exact saved source, identity, revision, destination and approved shelf remain authoritative.

## Verification

- `npm run dev:check`: passed
- 27 focused assistant/access/contents/preparation tests: passed
- `npm run prepare:deployment`: passed
- Required auth-sensitive integrated gate: release captain must run `npm run codex:verify` in the persistent release worktree before deployment. Feature worktree node_modules is a junction; no standalone production build is claimed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready for combined release after integrated authorization/build checks.
- Risk: physical authorization validation changes. Preserve historical/no-scope guide rejection, version/source/current-review/readiness/housing/item guards, and assistant no-create/no-edit/no-clear/no-undo limits.
- Diagnosis boundary: this is a verified assistant permission mismatch; it is not an established explanation for the reported curator checkbox failure. No production moves were used for testing.

## Risk And Conflicts

- Shared areas touched: assistant HTTP envelope, assistant domain guard, common saved-addition assertion in physical transaction; tests and museum move contract docs.
- Combine with Citra codex/companion-checkbox-feedback HEAD1071e96, which owns row-local failure visibility. No component files touched here.
- Rollback notes: revert `80aca00` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
