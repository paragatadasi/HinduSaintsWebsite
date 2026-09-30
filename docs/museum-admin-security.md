# Museum admin security contract

Every museum page requires `access_museum`. The section browser, saint review,
and coverage queue read only private, explicitly selected database contracts.
Family-tree asset routes require the same capability and return private,
no-store, sandboxed SVG responses.

All placement saves, proposal preparation, and proposal decisions call
`assertMuseumMutation()` from `lib/museum-access.ts`. Ordinary writes require
`manage_museum` (Site Admin or Curator). Irreversible deletion/bulk removal must
additionally call `assertMuseumMutation(true)` for `manage_sensitive_actions`;
this integration exposes no irreversible delete action.

Placement changes are validated, version-checked, serialized on the saint row,
and audited in the same transaction. Accepting a proposal checks its current
status and source-to-saint mapping while holding the source lock. Source refreshes
preserve reviewed snapshots, supersede obsolete pending proposals, and never
silently overwrite human decisions.

Curators can inspect allowlisted museum source values and Airtable references
inside the museum workflow without acquiring broad Source Data permissions.
Private relic/museum payloads never enter public page contracts or public APIs.
Museum assignment `published` means internally accepted and does not publish a
saint or make museum metadata public. See `museum-data-integration.md` for rollout.
