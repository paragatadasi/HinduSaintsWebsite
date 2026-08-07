# Release Handoff: codex/use-hero-share-previews

- Status: ready
- Branch: `codex/use-hero-share-previews`
- Commit: `8e25571a7a771ad6a434747017d6ead85c14f774`
- Owner/agent: `aporu`

## Summary

- Use the configured homepage and Saints directory hero headings, descriptions, and banners for Open Graph and Twitter previews.
- Serve managed hero banners through a crawler-friendly 1200x630 JPEG crop route while preserving configured focal points and the existing fallback image.
- Keep filtered Saints directory URLs noindexed and preserve the current canonical/public SEO metadata behavior from `main`.

## Verification

- `npm run dev:check`: passed
- `npm run codex:verify`: passed (production build includes `/social-image/[...key]`)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: homepage metadata, Saints directory/profile metadata, and managed media reads for the new social-image route
- Expected conflicts: possible if another release changes `app/page.tsx`, `app/saints/page.tsx`, `app/saints/[slug]/page.tsx`, or shared social metadata
- Rollback notes: revert `8e25571` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
