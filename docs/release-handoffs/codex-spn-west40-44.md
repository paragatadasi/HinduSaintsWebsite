# Release Handoff: codex/spn-west40-44

- Status: ready
- Branch: `codex/spn-west40-44`
- Commit: `52d0ea6`
- Owner/agent: Citra
- Bundle priority: Immediate user-requested deployment

## Summary

- Loads West Vitrines 40–44: 112 exact source entries, counts 21/28/19/20/24. Family/locality groups and full checklists use the existing parchment companion.
- Headline display groups: Dadu/Garib, Brahma Kumaris, Ramdev/Dali, Mekan's two separate observations. No invented relationship edges, merges, tier changes or shelf allocations.
- All five cases have full clearing workflows. Current physical locations and newer curator proposals remain authoritative.
- Sukhdev stays visibly review-only at candidate43 while native39 remains unchanged. Bimal stays visibly held at candidate40 until fresh reviewed housing and native40 both match. Other64 collection guards remain.
- Saved additions preserve guide holds and qualifications. Two remaining Bimal client checks now use the same narrow64/E-to40 exception as the server.

## Verification

- Six targeted guide tests passed.
- Full suite: 873 passed, 1 existing skip, zero failures.
- `npm run prepare:deployment` / dev:check passed.
- `npm run codex:verify` passed on elevated retry after a Windows build-folder permission failure.
- Independent exact source/canonical/sourceRevision/candidateDestination match112/112 against Nadi final audit.
- Saarthi semantic review passed for exact membership and named groups.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- No physical or database writes by this branch. Nadi completed110 native targets; Sukhdev and Bimal retained original proposal holds at readback. Latest fresh112 catalog matches final audit.
- Parent is Bimal branch47051ce. Include that dependency if not already integrated; don't duplicate released Junagadh delta.
- After deployment verify `/museumadmin/move?phase=west40-44&vitrine=40`, all five cases under West, visible holds and current origins. Do not confirm physical moves for testing.
- Notify Nadi when Bimal review code is actually served so she can save proposed40 and verify preservation; arrival remains unconfirmed.
- Source packet: spn-saurashtra-rajasthan40-44-review-2026-10-31-v2.json. No approved shelf packet exists; intentionally use grouped guide now.

## Risk And Conflicts

- Shared move route, registry, physical confirmation dispatch, navigation, addition projection and client preflight touched.
- Source-only review candidates remain non-actionable; saved curator additions cannot erase their guide hold.
- No Southern proposals included.
- Rollback code independently, preserving native proposals and physical history.
- Skill review: existing museum planning/evidence rules cover this load; no reusable rule changes needed.

## Release Captain Notes

- Integration and production pending.

