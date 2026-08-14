# Release Handoffs

Use this folder when an agent has code ready for the release captain.

Shortcut instruction:

```text
Prepare for deployment.
```

For small, low-priority, or low-dependency work that should wait for the next
larger release, use:

```text
Queue for deployment.
```

When an individual feature agent receives that instruction, the agent should:

1. Finish the deployable code on its current feature branch.
2. Commit only the relevant code changes.
3. Run `npm run prepare:deployment` for an immediate ready handoff, or
   `npm run queue:deployment` for a queued handoff.
4. Review the generated handoff file and fill any placeholders.
5. Commit the handoff file on the same branch.
6. Push the feature branch.
7. Stop and report the branch, commit SHA, verification result, handoff status,
   and handoff file path.

`npm run prepare:deployment` runs `npm run dev:check` and creates a `ready`
handoff file for the current branch. `npm run queue:deployment` runs the same
check and creates a `queued` handoff file. Feature agents should not run
`npm run codex:verify` by default; the release captain runs the heavier
verification on the integrated release unless the branch changed dependencies,
Prisma/schema/migrations, build configuration, auth, routing, or another
production-sensitive surface.

That instruction does not authorize the feature agent to merge into `main` or
`deploy`. Only the release captain should do that.

Handoff status:

- `ready`: integrate on the next deployment request unless the release captain
  finds a blocker.
- `queued`: prepared and deployable, but intentionally waiting to be bundled
  with the next major, user-requested, or release-captain-triggered deployment.

Queued handoffs require the same code quality, commit hygiene, verification,
branch push, handoff file, and release-captain notification as ready handoffs.
The only difference is urgency: queued work should not trigger a deployment by
itself.

Each ready agent should add one handoff file on their feature branch:

```text
docs/release-handoffs/<branch-name-with-slashes-replaced-by-dashes>.md
```

For example, `codex/admin-review-flow` becomes:

```text
docs/release-handoffs/codex-admin-review-flow.md
```

The handoff file should be committed on the same branch as the code. Do not
merge directly into `main` or `deploy`.

Release captain workflow:

1. Fetch all candidate branches.
2. Read handoff files from ready and queued branches.
3. Prepare or reuse the persistent verification worktree:

   ```text
   npm run release:worktree
   ```

   By default this creates or updates a sibling worktree named
   `Saints Website Release Verify`. Set `SAINTS_RELEASE_WORKTREE` or pass
   `-Path` to use a different location. The helper keeps a real `node_modules`
   directory and runs `npm ci` only when `package-lock.json` changes.
4. Integrate ready branches plus compatible queued branches into `main` one at a
   time or in a coherent low-risk batch.
5. Run the appropriate verification in the persistent verification worktree.
6. Push `main`.
7. Merge `main` into `deploy`.
8. Push `deploy`.
9. Confirm the production deployment workflow status.
10. Remove or archive released handoff files as part of the release cleanup, and
   preserve still-queued handoffs.

Use full locked dependencies in the persistent verification worktree, not a
production-only install. The release checks need development tools including
Prisma CLI, TypeScript, and `tsx`; production-only pruning belongs to the
deployed runtime image. Also avoid junctioning `node_modules` from another
checkout, because Windows junctions can break Next.js standalone trace copying.

When a deployment is requested, the release captain should consider all queued
handoffs and include those that are still compatible with the requested release.
If queued work is intentionally left out, report the branch and reason in the
release summary.

Ready or queued agents can create handoffs manually from `TEMPLATE.md`, but
`npm run prepare:deployment` and `npm run queue:deployment` are the preferred
fast paths.
