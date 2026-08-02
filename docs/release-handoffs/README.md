# Release Handoffs

Use this folder when an agent has code ready for the release captain.

Shortcut instruction:

```text
Prepare for deployment.
```

When an individual feature agent receives that instruction, the agent should:

1. Finish the deployable code on its current feature branch.
2. Commit only the relevant code changes.
3. Run `npm run prepare:deployment`.
4. Review the generated handoff file and fill any placeholders.
5. Commit the handoff file on the same branch.
6. Push the feature branch.
7. Stop and report the branch, commit SHA, verification result, and handoff file path.

`npm run prepare:deployment` runs `npm run dev:check` and creates the handoff
file for the current branch. Feature agents should not run
`npm run codex:verify` by default; the release captain runs the heavier
verification on the integrated release unless the branch changed dependencies,
Prisma/schema/migrations, build configuration, auth, routing, or another
production-sensitive surface.

That instruction does not authorize the feature agent to merge into `main` or
`deploy`. Only the release captain should do that.

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
2. Read handoff files from ready branches.
3. Integrate ready branches into `main` one at a time or in a coherent low-risk batch.
4. Run the appropriate verification.
5. Push `main`.
6. Merge `main` into `deploy`.
7. Push `deploy`.
8. Confirm the production deployment workflow status.
9. Remove or archive handoff files as part of the release cleanup.

Ready agents can create handoffs manually from `TEMPLATE.md`, but
`npm run prepare:deployment` is the preferred fast path.
