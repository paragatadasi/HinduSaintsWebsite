# Museum admin security contract

The Museum workspace is intentionally separate because it owns its own section
navigation. Every page requires `access_museum`; direct family-tree asset routes
also enforce that capability and return private, no-store, sandboxed SVG responses.

The current section controls are a planning preview only. Their client-side tier,
anchor, and section changes are not persisted. When persisted Museum mutations
are introduced, they must use `assertMuseumMutation()` from `lib/museum-access.ts`:

- ordinary Museum writes require `manage_museum` (Site Admin or Curator);
- deletion, irreversible replacement, bulk removal, or similar destructive work
  calls `assertMuseumMutation(true)`, additionally requiring
  `manage_sensitive_actions` (Site Admin only).

This helper is the seam for a possible future Museum Assistant role: that role can
later receive `access_museum` and a narrower capability without weakening Curator
or Site Admin boundaries. No Museum or relic data is exposed through public routes.
