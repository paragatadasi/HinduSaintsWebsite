# Project rules for AI agents

This is a production MVP for the Hindu Saints Website.

Architecture:
- Use Next.js App Router, TypeScript, PostgreSQL, Prisma, and Docker.
- The app includes both public pages and a custom protected admin CMS.
- Do not use Airtable as the live website source of truth.
- Airtable is import/reference only.
- Do not introduce Directus, Payload, Sanity, or another CMS unless explicitly requested.

Public content:
- Public pages show only published content, except `draft` and `needs_review`
  traditions may appear as basic directory/detail pages and configured homepage
  features. Basic tradition views expose only the tradition name, neutral
  fallback copy, and associated published saints; unpublished editorial fields
  remain private. Archived traditions never appear publicly.
- Never expose museum/relic fields publicly.
- Saint pages must use shared templates and components.
- Missing data must be handled gracefully.

Admin/CMS:
- Build domain-specific admin workflows for saints, aliases, traditions, biographies, sources, Instagram items, and reconciliation.
- Contributors can draft and preview.
- Editors/admins can publish.
- Preview routes must require auth and be noindexed.

Design system:
- Use design tokens for colors, fonts, spacing, shadows, radii, widths, and image treatments.
- All design and layout changes must go through the design system first: tokens, shared CSS classes, shared configuration, or reusable components.
- Before changing admin review/detail UX, read `docs/design-system.md`, especially "Admin review UX direction" and "Detail-page review model".
- Do not hard-code colors, fonts, spacing, shadows, radii, widths, or image treatments in components.
- Do not add one-off inline styles or page-specific layout wrappers unless the pattern is genuinely unique and explicitly justified.
- If a visual or layout pattern appears in more than one place, promote it into `styles/tokens.css`, `styles/globals.css`, shared configuration, or a reusable component.
- Theme-specific changes must use theme tokens instead of conditional component logic.
- Reuse existing UI components before creating new ones.

Security:
- Do not expose secrets in client code.
- Validate server-side form inputs.
- Sanitize Markdown rendering.
- Protect all admin routes.

Verification:
- Use `npm run dev:check` for the normal development loop after TypeScript, component, route, or data-contract edits.
- `npm run dev:check` generates the Prisma client and runs TypeScript without doing a production Next.js build.
- `npm run build` is the web build only. Do not add database migrations, seeds, or other database access to the web build path.
- Keep database imports build-safe: modules may import `@/lib/db`, but Prisma must not connect or require `DATABASE_URL` at module import time. Initialize the client lazily when query code actually uses `db`.
- Prisma client generation is code generation, not database access. Keep it explicit in `dev:check`, `db:generate`, Docker build setup, and `codex:verify`.
- Use `npm run codex:verify` only as a heavier gate: after dependency/setup changes, before handing off a large route/rendering change, before commits intended for deployment, or when a production-build failure is specifically suspected.
- Do not run `npm run codex:verify` as the default checker for every small frontend iteration.
- Individual feature agents preparing a handoff should usually run `npm run prepare:deployment`, which runs `dev:check` and creates the release handoff. The release captain owns `npm run codex:verify` for the integrated release unless the feature branch changed dependencies, Prisma/schema/migrations, build configuration, auth, routing, or another production-sensitive surface.
- Production database migrations must run in the deployment migrate/release phase, not while building the web image.
- Do not run database migrations against production from Codex Cloud.
- Cloud tasks that need database access must use a development PostgreSQL database configured through environment settings.
- If `CODEX_START_POSTGRES=1` and Docker is available in Codex Cloud, use `scripts/start-dev-postgres.sh` to run a disposable local Postgres 16 container for development tasks.

Data ingestion and reconciliation:
- "Import" means bringing external content records into the website database from Airtable exports, Instagram exports/scrapes, CSV files, or other editorial data sources.
- Preserve raw external Airtable, Instagram, CSV, and manual-ingest values for review and debugging.
- Create reconciliation issues when external content conflicts with reviewed website content.
- Do not silently overwrite human CMS edits with later Airtable, Instagram, CSV, or script-ingested data.

Worktree and branch hygiene:
- Treat the repository root as the canonical working tree for `main`. Do not leave `main` checked out in long-lived Codex task worktrees.
- Treat `deploy` as a release target only. Do not develop directly on `deploy`, and do not leave `deploy` checked out in stale worktrees after a release.
- Do feature work on short-lived `codex/...` branches. Merge or fast-forward the finished work into `main`, then merge `main` into `deploy` only as part of the deployment workflow.
- Before switching, merging, or deploying, run `git worktree list` and `git status -sb` to confirm that `main` and `deploy` are not blocked by stale worktrees or dirty release checkouts.
- After a feature branch has been merged and deployed, remove any temporary worktree for that branch with `git worktree remove <path>` and then run `git worktree prune`.
- If a stale worktree has uncommitted changes, back them up outside the repository before removal. Do not discard dirty worktrees unless the user explicitly approves the cleanup.

Commit workflow:
- Multiple agents may work in this repository at the same time, so commits must be intentionally scoped.
- On this Windows/Codex setup, Git commands that write repository metadata may need to run elevated/outside the sandbox because `.git` can be write-protected for the sandbox user.
- It is acceptable to request/run elevated Git commands for normal repository operations such as `remote`, `fetch`, `pull`, `status`, `add`, `commit`, `push`, `log`, and `branch` when sandbox permissions block them.
- Elevated Git commands must still follow the scoped commit rules below and must not be used for destructive operations such as `reset --hard`, broad checkout/revert, or deleting branches unless explicitly requested.
- Before committing, inspect the working tree and identify only the files changed for the current task.
- Commit with one atomic command that resets the staged area, stages only the intended paths, and creates the commit.
- Do not use broad `git add .` or `git add -A` unless the current task genuinely owns every changed file.
- Do not commit unrelated changes made by users or other agents.
- Preferred shape:

```sh
git restore --staged :/ && git add path/to/file-a path/to/file-b && git commit -m "Short commit message"
```

- For multi-line commit messages, use the shell-appropriate equivalent of a single atomic command that includes unstaging, targeted staging, and committing together.

Deployment workflow:
- When explicitly asked to deploy, complete the full release sequence; do not stop after committing or pushing a feature branch.
- When the user tells an individual feature agent to "prepare for deployment", do not merge to `main` or `deploy`. Instead, finish and commit the branch's deployable code, run `npm run prepare:deployment` unless a heavier branch-specific check is required, commit the generated handoff file on the same branch, push the feature branch, locate the active release-captain Codex task if one exists, notify it with the ready-for-release branch, commit SHA, handoff file, verification, migrations, environment-variable changes, and any deploy notes, then stop with a concise handoff summary.
- When the user tells an individual feature agent to "queue for deployment", do the same preparation steps as "prepare for deployment", but run `npm run queue:deployment` or otherwise mark the handoff status as `queued` instead of `ready`. Queued handoffs mean the branch is deployable but intentionally waiting to be bundled with the next major, user-requested, or release-captain-triggered deployment. The feature agent should notify the active release-captain task with the same branch, SHA, handoff, verification, migration, environment, risk, and deploy-note details, and clearly state that the handoff is queued rather than requesting immediate deployment.
- If no active release-captain task can be located, stop with the same concise handoff summary and explicitly tell the user to send it to the release captain or say `deploy` in the release-captain task.
- First inspect the working tree, identify all and only the uncommitted changes relevant to the requested deployment, run the appropriate verification, and commit those relevant changes using the scoped commit workflow above.
- When multiple agents have deployable code ready, use a release-captain workflow. One designated release captain owns integration into `main`, the `main` push, the `main` to `deploy` merge, the `deploy` push, and deployment-status confirmation.
- Ready or queued agents should report their branch name, commit SHA, summary, verification run, migrations, environment-variable changes, and any shared areas touched before the release captain integrates their work.
- Ready agents should automate that report by adding one branch-specific handoff file under `docs/release-handoffs/`, using `docs/release-handoffs/TEMPLATE.md`. Replace slashes in the branch name with dashes, for example `codex/example-feature` becomes `docs/release-handoffs/codex-example-feature.md`.
- Handoff files must be committed on the same feature branch as the deployable code. They are release inputs, not permission to merge directly into `main` or `deploy`.
- The release captain should treat `ready` handoffs as immediate release candidates and `queued` handoffs as bundle candidates. When a deployment is requested, the release captain should scan for both ready and queued handoffs, include queued changes that are still compatible with the requested deployment, and report any queued branch intentionally left out with the reason.
- The release captain should integrate included branches into `main` one at a time, verifying after each merge or after each coherent batch when the risk is low. Order risky/shared changes first: schema and migrations, backend contracts, shared components/styles, then isolated UI/content. Within the same risk tier, prefer requested/ready changes before queued lower-priority changes.
- The release captain should scan `docs/release-handoffs/` while preparing a release, update or remove released handoff files as part of release cleanup, preserve still-queued handoffs, and report final `main`, `deploy`, production workflow status, and any queued work not yet deployed.
- Integrate the deployment commit(s) into `main` and push `main` to `origin` before updating `deploy`.
- Then merge the updated `main` into `deploy` and push `deploy` to `origin`. A push to `deploy` triggers the production deployment workflow.
- Never merge a feature branch directly into `deploy`, and never let `deploy` move ahead of the corresponding pushed `main` commit.
- Do not allow multiple agents to push or merge `deploy` for the same release. If another agent has already started a release, coordinate through that agent or stop and report the overlap.
- Do not include unrelated working-tree changes or commits from other agents. If unrelated changes prevent a safe branch switch or merge, preserve them and use a safe worktree or stop and report the blocker rather than discarding them.
- After pushing `deploy`, confirm that the production deployment workflow was triggered and report its status. If workflow access is unavailable, report that verification limitation explicitly.
