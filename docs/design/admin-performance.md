# Admin interface performance

Use the shared `emil-performance` skill when building or reviewing admin screens with long lists, frequent updates, media, or slow interactions. It is installed in the user's Codex skills directory; discover it through the available-skills catalogue rather than assuming a machine-specific path. This topic applies its interface guidance to this project's protected, collaborative workflows.

## Measure the task, not just page availability

Separate request time, database work, payload transfer, React rendering, and browser layout/paint. Record the action, data size, device, concurrent users, and whether measurements are local or production. A fast public homepage or health endpoint does not prove that authenticated museum queries are healthy. Never label a slowdown resolved from unauthenticated responses alone.

For save and refresh work, compare before and after request timings, query counts, payload sizes, and interaction responsiveness. Test concurrent saves to different records, conflicting saves to the same record, retry after an uncertain response, and clearing alongside placement. Protect newer edits and preserve receipt history while reducing work.

## Fetch and save only what the task needs

- Update the affected record after a save; avoid rebuilding the entire museum or reloading unrelated panels.
- Check inexpensive revision information before expensive snapshot work. An unchanged response should avoid the work as well as the payload.
- Keep frequent progress polling lightweight. Load full proposal, identity, and historical context separately when needed.
- Suspend background polling in hidden tabs, avoid overlapping requests, and back off after failures. Multiple active curators multiply polling load.
- Bound read requests and provide a visible retry path. Cancel superseded reads and prevent late responses from replacing newer state.
- Treat a timed-out write as an unknown result, not a failed transaction. Reuse its idempotency key when retrying; never silently generate a second move.
- Show immediate pending feedback, reconcile with the saved receipt, and preserve the user's input on failure. Do not present pending work as confirmed.

Live placements and private museum records must remain authenticated and current. The skill's static-content advice applies to truly static presentation assets, not live location data or authorization decisions. Never place personalized or private data in a shared public cache.

## Validate cached reads against all their inputs

A move-ledger revision alone does not prove that source or CMS data is unchanged. Before caching a derived view, audit its dependencies, including relationship edits, identity relinks, deletions, and changes made outside the move workflow. Keep that dependency manifest with the implementation and extend it whenever the view gains another input.

Build a snapshot and its revision from consistent data. Test an out-of-ledger source edit, a relationship deletion or relink, and a newer read arriving while an older snapshot is still building. Every mutation must validate fresh authoritative records; test that a stale cached view cannot authorize a write. For the museum implementation and controlled measurements, see [Companion read performance](../museum-companion-read-performance.md).

## Keep rendering proportional to visible work

Profile long lists and repeated map/tree renders before optimizing. Prefer pagination, progressive disclosure with deferred mounting, or virtualization for large lists. A collapsed disclosure can still mount all of its children. Preserve keyboard navigation, browser find needs, checkbox state, and accessible reading order when choosing an approach.

Avoid repeated whole-catalog scans in each row; use shared indexed lookups where profiling shows a cost. Do not add blanket memoization or virtualization solely to satisfy an item-count rule. Keep frame-by-frame animation outside React state.

Reserve image and asynchronous-content dimensions; lazy-load noncritical portraits. Use tabular numerals for changing counts. Name transition properties explicitly, avoid layout-property animation, and add compositor hints only for measured problems. Apply styling through the existing tokens and shared components.

## Review and release

Performance review belongs in the initial UX implementation, not only a later polish pass. Apply the skill with current framework behavior and project conventions; verify version-specific claims before using them.

Include the measured bottleneck, scope of the fix, representative checks, and remaining evidence gaps in the normal release handoff. Do not claim production latency from local tests. Keep incident recovery patches isolated from broader refactoring, and coordinate with the release captain rather than changing a release already in progress.
