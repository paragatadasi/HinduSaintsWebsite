# Museum admin security contract

Every museum page requires `access_museum`. The section browser reads private
checked-in proposals and explicit source-to-saint mappings. Browsing writes nothing. Saint
review and the coverage queue read private, explicitly selected database contracts.
Family-tree asset routes require the same capability and return private,
no-store, sandboxed SVG responses.

All placement saves and proposal decisions call
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

Existing proposals are projected read-only until a curator acts. Confirmation
rechecks identity and content under source/saint locks and captures the source
snapshot atomically with the audited decision. Ambiguous mappings never resolve
by name. No schema migration or bulk acceptance is needed for this workflow.
