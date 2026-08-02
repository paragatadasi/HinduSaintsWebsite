# Release Handoffs

Use this folder when an agent has code ready for the release captain.

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

Ready agents should copy `TEMPLATE.md` and fill in every section before
handoff.
