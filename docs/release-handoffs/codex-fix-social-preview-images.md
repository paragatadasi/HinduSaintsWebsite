# Release Handoff: codex/fix-social-preview-images

- Status: ready
- Branch: `codex/fix-social-preview-images`
- Commit: `2285022cc657c2d89126c47075337dedd0ce0e00`
- Owner/agent: `aporu`

## Summary

- Adds complete canonical, Open Graph, and Twitter metadata to dynamic saint profiles, using each saint's existing hero portrait when available.
- Replaces the 2.05 MB directory/home share PNG with a versioned 83 KB, 1200x630 JPEG fallback so crawlers receive a compatible image URL and can escape stale image caches.

## Verification

- `npm run dev:check`: passed
- `npm run codex:verify`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: after deployment, probe `/`, `/saints`, `/saints/mahavatar-kriya-babaji`, and `/images/hindu-saints-share.jpg` with a crawler user agent; WhatsApp/Telegram may retain an older card until their external cache refreshes.

## Risk And Conflicts

- Shared areas touched: public metadata in `app/page.tsx`, `app/saints/page.tsx`, and `app/saints/[slug]/page.tsx`; static public image assets
- Expected conflicts: low; branch is rebased onto current `origin/main`
- Rollback notes: revert `2285022` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
