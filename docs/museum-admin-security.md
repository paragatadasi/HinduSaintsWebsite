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

## Curator revamp boundaries

SPN and Vrindavan enter through the shared `MuseumWorkspace` capability gate and
noindex layout. The Vrindavan section discussion route additionally requires
`view_full_saint_catalog` and exposes read-only controls; it cannot use source
observation IDs as physical item IDs. Shared dialog links are museum-specific.

Display-membership, relationship-correction and arrangement actions call
`assertMuseumMutation`, validate server-side inputs and write audit events.
Arrangement saves use serializable transactions, family/arrangement locks and
saint locks; family saves validate the current member/revision set before an
atomic update. The current mutation services are fixed to SPN server-side;
client-supplied museum IDs do not select another museum. Future Vrindavan writes
must validate their museum scope and keep SPN assignments independent.

Physical attestation with incomplete inventory is explicitly allowed. It records
who confirmed the arrangement and when, with the inventory gap acknowledged;
it must not invent inventory, end item placements or assert complete coverage.
Historical correction requests reuse reconciliation and do not grant curators
public-content editing rights. Identical open requests are deduplicated.

### Vrindavan editing extension

The current Vrindavan editor uses fixed server-side museum scope
`museum-vrindavan`, `manage_museum` and `view_full_saint_catalog`. Its working
reader only admits current reviewed inventory saint identities. Every write
rechecks that scope, available sections/group options and revisions under a
museum advisory lock in a serializable transaction. The shared arrangement
writer receives the museum ID from these fixed-scope server services, not from
form input. SPN editorial assignments and all physical inventory remain untouched.
The earlier read-only checkpoint above describes the meeting pilot; it is not a
permission bypass for the later editor. Historical corrections stay global,
permission-controlled reconciliation requests.

### Live relationship-tree preview

The read-only tree POST API requires an active user with both `access_museum` and
`view_full_saint_catalog` before reading seed saints, relatives, biographies or
museum evidence. Responses are private/no-store and noindexed, including errors.
Seed count, museum key, traversal depth, nodes and edges are bounded. The renderer
uses React SVG text (no injected markup) and preserves provenance/review metadata.
No public tree route, raw source export, database mutation or permission expansion
is introduced. Original SVG routes retain their existing capability checks.

The same protected reader may supplement a family with preserved member-snapshot
relationship IDs as explicitly unreviewed reference claims. These are rendered
through React text, never imported or approved, and cannot override any existing
website relationship decision, including archived records. Unresolved identities
remain labeled source-only nodes; name matching is prohibited.

Shared navigation checks `access_museum` before its loader runs. Section navigation
additionally requires `view_full_saint_catalog`; restricted users receive no
section counts or section-reader invocation. Vrindavan working data is deduplicated
only within the authenticated request, not persistently cached across users.
Client navigation receives only section names, slugs and counts, not placement or
inventory payloads. Sidebar links disable speculative route prefetching.
