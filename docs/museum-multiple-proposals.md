# Multiple museum move proposals and the short-visit plan

Implemented 21 October 2026 for Vrindavan. The current full regional reorganization remains the long-term proposal. The separate **Before the visit · five targeted moves** proposal is a small, source-checked intervention for a short curator visit.

## Curator workflow

1. Open `/vrindavanadmin/plan`. **Move proposals** identifies the active proposal.
2. **Preview the minimal-move proposal** saves a separate reviewed option and preserves the original full proposal. Previewing does not change active destinations.
3. **Use this proposal** explicitly changes the active planning workspace. The outgoing proposal is saved with its latest edits before switching. Saved proposals can be previewed and selected again; **Save another version** makes a named copy.
4. Open **Move companion** for the short task list and seven-step handling sequence. Source and destination row/position are visible on the collapsed cards. Only confirm final physical placement, not temporary staging.

The targeted plan does not assign one guessed current vitrine to every saint. Non-target saints are no-operation cases: source entries and physical history remain untouched, including saints with relics in multiple vitrines. Their previous future destinations remain in the full saved proposal. Map counts show only destinations in this short plan, not all physical contents. Intentional additional Planned/flexible tasks remain visible in the companion.

## Reviewed core

| Saint | Reported origin | Destination | Purpose |
| --- | --- | --- | --- |
| Samarth Ramdas | 4 / 2.1 | 5 / 1.1 | Join Vena Bai; primary saint on the top row |
| Akkalkot Maharaj | 3 / 4.2 | 4 / 2.1 | Join Krishna Saraswati and Balappa; remains row two |
| Siddheshwar Maharaj | 5 / 1.1 | 3 / 4.2 | Balance the first exchange; no family claim inferred |
| Satyendranath Swami | 4 / 4.2 | 5 / 2.1 | Join the existing Balabai display grouping; remains row two |
| Bhaskar Maharaj | 5 / 2.1 | 4 / 4.2 | Join Gajanan in the same vitrine |

Notation is vitrine / row.position; rows run top to bottom. These are five complete single-source Box entries, five cross-vitrine moves, two closed exchanges and seven handling steps including staging. Four existing display groups are brought together; only Ramdas is newly placed on row one. No frame, small-frame or mixed-frame saint moves. Each vitrine retains its source entry count. This is not a guarantee of fit or a measured duration. Check every complete exchange before beginning it and use a labelled temporary tray. If the actual starting location, identity, packaging or fit differs, stop and review the exchange.

Nadi checked preferred Sheet1 packaging and exact observation IDs against the 449-entry source inventory and current identity/plan export (21 October, revision `88dac8acae48333d980967d08d42fc14db6bc2576de2ffdab428278cc32001ad`). Saarthi reviewed the family priorities. Satyendranath/Balabai is an existing display-family grouping, not a new canonical initiation assertion. Earlier frame/box assumptions involving Shankar, Tampure and Sacchidanand were discarded. The fixed Sikh display in Vitrine 11 is untouched. Optional extra exchanges are not part of the loaded core.

## Storage and safeguards

- Named snapshots use private, versioned `MuseumPlanVariants` audit records, following the existing saved diagram pattern. No schema migration or new environment setting is required. The active arrangement tables remain the active workspace; switching is atomic under the existing museum-curator lock.
- Every snapshot retains saint identity, section/proposal fingerprint, exact/flexible destinations and section areas. Incoming stale identity/proposal changes fail closed; flexible revision references are regenerated on activation.
- Template registration validates exact source observation IDs, origin vitrine/shelf, raw packaging, tier, family key and absence of a new physical confirmation. Unknown/multiple source locations, uncertain packaging and partial shared-entry moves require separate review. Frame-bearing incoming saints cannot exceed outgoing frame-bearing saints in any receiving vitrine.
- A targeted proposal also retains a source/physical-history fingerprint. Subsequent changes block stale activation rather than reusing an outdated execution sequence.
- A snapshot never replays an Implemented status. Matching completed destinations remain confirmed. Choosing a different explicit future destination creates a new Planned move while retaining the earlier immutable confirmation as `lastConfirmed` starting-location evidence. No-target cases preserve the existing confirmation.
- All reads require museum and full-catalog capabilities; mutations also require museum management. Template data is server-owned, not accepted from client destinations, and never exposed through public pages.

Key files: `lib/museum-plan-variants*.ts`, `components/admin/museum-plan-variants.tsx`, `data/museum/vrindavan-minimal-move-plan.json`. The template contains the five exact targets, expected source evidence, frame ledger and sequence. Local PostgreSQL lifecycle verification is in `scripts/verify-museum-plan-variants.ts` and refuses non-local/non-test database names.

## Verification

Thirteen targeted unit tests cover proposal drift, flexible changes, physical-history lifecycle, frame capacity, shared/unknown source rejection, the five-slot permutation and occupied-slot simulation of all seven steps. Disposable PostgreSQL integration exercises preservation/restoration, stale guards, template source checks, flexible revisions and minimal-complete-to-full-replan history. The production build and TypeScript checks passed. Local browser verification covers the preview dialog and short companion; deployment and production registration remain release-captain/data-agent steps. Deploying code never activates the temporary proposal automatically.
