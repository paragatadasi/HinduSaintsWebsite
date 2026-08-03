# Release Handoff: codex/catalog-ui-polish

- Status: ready
- Branch: `codex/catalog-ui-polish`
- Commit: `eebafbc23d8731b93027caf206a78a91cf3f6fbb`
- Owner/agent: `aporu`

## Summary

- Replace repetitive tradition-tile fallback copy with published saint counts.
- Improve Saints/Traditions index spacing and move the About disclosure control below expanded copy.
- Use translucent theme gold for secondary saint-count metadata on map, location, and tradition surfaces.
- Center the saint profile hero gallery within its section.
- Expose saint relationships in the saint review page with searchable creation, editing, moderation, public visibility, and deletion controls.
- Derive reciprocal relationship views from one directional record, including guru/disciple, parent/child, family, and spousal relationships.
- Make all published, publicly visible relationship types eligible for the public Related Saints rail.
- Repair previously accepted Instagram guru relationships that were published but left privately hidden.
- Fill sparse Related Saints rails through published relationship trees before using shared-tradition fallbacks.
- Rank direct related saints as guru, family, disciple, then other relationships.
- Show reciprocal-aware uppercase gold relationship tags with compact, readable padding on directly related saint portraits.
- Apply saved focal positioning to homepage featured-tradition banner images.
- Expand the header search icon into an accessible, homepage-styled saint search field that remains open for typing and submits to the filtered saints directory.
- Use subdued gold for static gold labels and full-strength gold for interactive text and quote attribution.
- Add a footer Contact us action that opens the existing feedback form in a modal dialog.
- Simplify the mobile homepage with a full-width frame, concise hero, equal-height tradition cards, and no generic tradition fallback descriptions.
- Make homepage section titles and eyebrow text configurable through the existing Homepage CMS workflow.
- Parse BC/BCE and early AD/CE saint dates and ranges into sortable structured years while preserving readable historical notation.
- Add country as a first-class place unit in creation, editing, filtering, and place-kind persistence.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (67 tests)
- `npm run codex:verify`: passed
- `npm run prepare:deployment`: `dev:check` passed; handoff update was completed manually because unrelated uncommitted stylesheet edits were preserved and this branch already had a handoff

## Deploy Notes

- Migrations: `20260803120000_publish_accepted_instagram_guru_relationships` repairs accepted guru visibility; `20260803130000_expand_saint_relationship_types` adds parent, child, father, mother, son, daughter, husband, and wife enum values; `20260803140000_home_section_headings` adds configurable homepage heading fields; `20260803150000_country_place_scope` adds the country place-scope enum value
- Environment variables: none
- Data/backfill/release steps: run the normal deployment migration phase; do not execute migrations during the web image build

## Risk And Conflicts

- Shared areas touched: `styles/globals.css`, `styles/tokens.css`, shared public header and homepage configuration, public tradition summary contract and cards, `prisma/schema.prisma`, saint/place admin actions and review pages, date parsing, and public saint relationship queries
- Expected conflicts: possible shared-style overlap with concurrent homepage/map work; possible saint admin/schema overlap with other CMS work
- Rollback notes: revert `eebafbc`, `18f7df4`, `0d9369c`, `fe55861`, `30adfcd`, `cb10472`, `d58d377`, `4d1423f`, `ea454c7`, `54e1544`, and any dependent release commits; coordinate database enum rollback rather than removing PostgreSQL enum values directly

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
