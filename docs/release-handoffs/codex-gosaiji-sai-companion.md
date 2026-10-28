# Release Handoff: codex/gosaiji-sai-companion

- Status: ready
- Branch: `codex/gosaiji-sai-companion`
- Commit: `6afaaab037ccf2e3c4ada39df5a2d1df23daa38b`
- Owner/agent: Citra; backend verification by Nadi
- Bundle priority: immediate release candidate

## Summary

- Family-tree Defer, Decline and Restore share checklist state; relationship labels align with name cards.
- Approved phase: exact 11 records in Vitrine 75, 10 in Vitrine 37 and 15 in Vitrine 4, typed family relationships, live bring-from locations and fit cautions.
- Confirm Vitrine 75 availability separately, then fill it before clearing 37. This acknowledgement records no physical clearing. Seven curator-reported staged origins remain attributed separately from the ledger.
- Require a durable, explicit clearing receipt for current Vitrine 37 occupants before placing in either case. Clearing is transactional, complete, revision-checked and retry-safe.
- Starter v5 preserves all 136 historical observations and old receipts while applying Harendranath28, Srinivasa2, Dhanamamjari78 and the private Hemalata hold. Gauridasa36 retained. V4 becomes read-only; historical retries remain safe.
- Latest proposal reviewer applies the approved 85-row overlay while retaining earlier studies and newer curator arrangements. No physical moves occur on publication.

## Verification

- dev:check passed.
- Full suite: 683 passed, 1 skipped, 0 failures.
- Final integrated PostgreSQL regressions passed against all 36 registered phase entries, including historical UUID replay and rejection of new superseded-guide writes.
- Browser checks: tree decisions/alignment, desktop/mobile, both-case clearing gate, refresh persistence, reviewer rendering, and Harendranath in28 with bring-from78.
- Nadi isolated PostgreSQL integration: complete clearing, rollback, retry, post-clear placement and repeat-clear protection passed.
- Final dev:check and codex:verify passed (exit 0). Earlier Windows sandbox EPERM was resolved by elevated verification.

## Deploy Notes

- Migrations: none. Environment changes: none. Keep Airtable delivery disabled.
- URLs: /museumadmin/move?phase=gosaiji-sai and /museumadmin/plan.
- Guide: spn-gosaiji-sai-core-guide-2026-10-28-v2.
- Guide content digest: 85f95c1cb8546df51d8bb8118161a6f7a766318171d8088f634b7cab5a4f9ed8.
- Nadi starter0fb0c7a is included as8708722; final DB replay fixture60c76cc as c5b44d5.
- Nadi backend commits 2050de2/f80acb8 are already included as b26a5e5/d7e7bcc; do not integrate twice.
- After actual host promotion, coordinate with Nadi to create/deduplicate and read back the OPEN Maa Moni dates task (source recsumN8i2tdC7GbV) and Ramakrishna identity-review task. Do not infer dates or merge canonical identities.
- Vitrine 2 correction was independently verified complete: 13 restored, 5 remain staged. Do not repeat it.
- Follow-up23 presentation must retain Srijivasharan provisional association/identity uncertainty with no invented guru edge.
- The later Jaiguru23 arrangement saves project through live reconciliation; distinct Jaiguru/Anandamayi presentation is a separate follow-up, no23 execution phase.
- No broader eastern-row research proposal is included beyond the approved Vitrine 75 roster.
- Nadi sequencing commit 3f3e156 is included as a99b619; DB verification a702d55 as 799e9cf.
- Skills review: no additional reusable interpretation changes were needed in this UI work. Nadi maintains the related phase-projection interpretation.

## Risk And Conflicts

- Shared areas: physical-location service, guide registry, family-tree component, companion, proposal reviewer and shared styles.
- Preserve recorded physical moves, clearing receipts, source-only records and curator overrides.
- Publication must not clear cases or confirm placements. Clearing is a curator action using fresh occupancy.
- Rollback must preserve existing audit data and receipt readers; coordinate backend dependencies before reverting.

## Release Captain Notes

- Integration, main/deploy pushes and production confirmation: pending Mira.
