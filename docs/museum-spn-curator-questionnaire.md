# SPN curator questionnaire

## Scope and workflow

The protected SPN move page includes eight source-review questions: four named identity/biography conflicts and four blank source rows. These are not eight verified saints or eight physical objects. All begin awaiting the curator; prior answers by Paragata are not substituted for curator answers.

The shared `MuseumQuestionnaire` component accepts protected load/save/profile actions. SPN uses its own service; existing Vrindavan review and placement actions remain unchanged.

- Identification: identifying text is required and saved for verification; no canonical identity link is made.
- On-site check: a distinct waiting group, with an optional note.
- Unknown or unlabelled item: optional note, moved out of the immediate checklist to Awaiting research.
- Referral: optional person/role, retained for follow-up; no automatic message.
- Apparently unused row: classification evidence awaiting verification; no deletion or object creation.
- Reopen/correction: append-only answer history, never replaces a previous answer.

Effect copy appears before Save. No case currently has an approved supported target. A future supported-target apply workflow needs its own server-owned preview/validation contract; this release does not implement identity, family, proposal, or destination changes.

## Evidence and persistence

Private manifest: `data/museum/spn-curator-questions.json`, sourced from Saarthi's 24 October 2026 reviewed content packet. It preserves selected source fields and the research capture time. Source lookup is the exact project-mirror tuple `appMapiXrtNwnS9oZ / Saints / recordId`; the official museum base is not a fallback.

The service reads current mirror rows and comparison candidates. Missing source entries and newer conflicting evidence appear under Needs data-team review. Older mirrors are dated and do not replace the newer research snapshot. Comparison profiles are server-whitelisted by case; portraits are explicitly comparison evidence, not museum-object photos.

Answers are stored as `AuditEvent` records, entity type `MuseumCuratorQuestionnaire`, entity ID `museum-spn:<stable caseId>`. Saving rechecks active actor capabilities, exact museum, allowed answer, current revision and source guard inside a serializable transaction with a museum-scoped advisory lock. History contains the prior answer ID and the evidence revision. No migration is required.

Revisions include meaningful source fields and the latest answer ID. Refresh timestamps, import-batch metadata, proposal changes and expiring image URLs are not evidence. Unknown answers remain in research unless their own explicit evidence version changes or a curator reopens them. Technical drift blocks saves rather than silently resubmitting the identity question.

## Adding questions

This is an extensible starter manifest, not a self-service question editor. Adding a case currently requires a reviewed repository change and deployment.

1. Coordinate the question and supporting source evidence with research/data owners. Identify the museum and exact source row; do not turn technical link errors into curator questions.
2. Add a unique stable case ID and source record ID, concise question/context, dated source evidence and optional allowlisted candidate slugs. Blank rows must remain unclassified source entries.
3. Give the case its own evidence version. Preserve existing case IDs and versions for unrelated additions, copy edits and timestamp refreshes so previous answers do not reopen.
4. Change an existing case's evidence version only for meaningful new evidence or a materially more specific question. Its full answer history stays available. Capture dates are per case; adding new evidence must not falsely re-date older questions.
5. Check permissions, drift handling, answer routing, browser presentation and release handoff. Supported targets require a separate preview/apply implementation, not an extra manifest field.

## Verification

- `dev:check` passed.
- Domain tests cover optional unknown notes, recognition evidence, museum/extra-effect rejection, answer routing and stable evidence normalization.
- `scripts/verify-spn-questionnaire.ts` passed against an isolated local PostgreSQL database with all migrations: actor denial, museum scope, invalid choices, stale and concurrent saves, durable history, reopen, timestamp stability, source drift/missing-source blocking, and no saint/external-link/proposal/arrangement/item writes.
- Browser fixture uses the actual production components with mock actions and illustrative inventory, not production saves. Unknown-save and reopen, 1600px map/portrait alignment, five loaded portraits, single-column rows, 390px stacking/no page overflow and 16px review inputs verified.
- `codex:verify` completed (exit 0), with existing CSS compatibility warnings and a Windows standalone trace-copy EPERM warning. Release captain must verify integrated packaging in the release worktree.
- Broader regression run: 26/27 passed; the unchanged Vrindavan navigation test expects Andhra at the South region's end, while existing catalogue ordering returns Kerala. No ordering change is included here; reported to release captain.

## Purpose-led questions (24 October 2026)

Reviewed with Saarthi and Nadi against the eight source records. Four blank rows are collection checks; two conflicting name/biography cases remain held and appear separately; Mauni Baba and Krishna Dasji are optional research, not preliminary-planning gates. Their existing proposals are source-level, not newly confirmed canonical assignments. Source Place and normalized place may share one upstream assertion. A museum shelf does not establish saint geography.

Question copy and group affect the optimistic revision so an old screen cannot silently submit against a changed prompt. Evidence versions and case IDs remain stable: historical answers, including unknown, remain saved without demanding repeated answers after copy edits. The response contract remains unchanged and writes only audit answers. No identity, proposal or physical location changes occur.

The shared questionnaire pattern uses purpose selectors, a bounded evidence/answer split, stacked mobile layout, neutral evidence text, optional notes, compact comparison profiles, selected comparison state and a focused save outcome. Optional research never contributes to the collection-check count.
