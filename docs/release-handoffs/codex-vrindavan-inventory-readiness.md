# Release Handoff: codex/vrindavan-inventory-readiness

- Status: ready
- Branch: `codex/vrindavan-inventory-readiness`
- Commit: `5dd2ee7ba3fe4ce411a08df79b6c8573e78ebac7`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate compatible release candidate

## Summary

- Private read-only inventory readiness reader/export over confirmed Vrindavan source rows. Preserves all original quantities, source places, positions and notes; reports object-identity, quantity, identity, location and source-note review reasons.
- Applied manual geography decisions are exposed beside raw evidence, with erroneous source place excluded independently per linked canonical saint. Source evidence never implies verified physical placement.
- Consolidated completed checkpoints, production actions pending and the remaining phase sequence in docs/museum-data-status.md; linked from the existing workflow document. Records delivered workspace 84-saint QR shortlist provenance.

## Verification

- `npm run dev:check`: passed.
- `npm run prepare:deployment`: passed.
- Four focused contract tests: passed (text preservation, quantity ambiguity, per-saint geography exclusions, unavailable identity/location/note review).
- `npm run codex:verify`: passed.

## Deploy Notes

- Migrations: none.
- Environment variables/dependencies: none.
- Data/backfill steps: none. Read-only. No objects, placements, saint identities/geography, proposals, membership or status records are changed.
- Protected export: /admin/source-data/museum/vrindavan/inventory-audit; optional snapshot SHA-256. Requires access_museum and full catalogue; private/no-store/noindex.
- Dependency: reviewed-museum-corrections ebd5e44 is in ancestry; integrate that ready handoff first. Applied decisions only appear after its explicit authenticated production apply step; raw source values remain intact.
- UX workstream has the contract; it owns screen wiring and independent museum proposal/status editing.

## Risk And Conflicts

- Shared areas: append to docs/museum-data-integration.md only; new isolated reader/domain/route and status document.
- No edits to getEditableMuseumProposalData, section-proposal audit, shared components or schema in this checkpoint.
- Later section-audit consumers must also honor source geography decisions; this report does not rewrite the section-audit projection.
- Standard code rollback leaves all data intact.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: no.
- Merged to deploy: pending.
- Production workflow: pending.
- Notify Museum Data Integration chat directly after deployment completion so the next data checkpoint can continue.

