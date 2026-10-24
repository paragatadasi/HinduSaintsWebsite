# Public saint editorial pilot

[Design system index](../design-system.md)

## Public saint editorial pilot

The approved saint pilot keeps the Instagram-first audience: View the Post stays
primary, the mobile hero leads with the photograph, and saint names remain
uppercase serif. Profile title size, tracking, line height and overview measure
use the saint-profile tokens. Keep eras, dates, places and traditions in one
wrapping facts group; do not add a separate guru fact or competing context panel.
Preserve the hero bottom divider, existing source typography and source links,
but omit internal source-list rules on saint profiles.

The overview uses the original shared prose width rather than the pilot's
narrower character cap. Profile action labels use regular weight, scoped to the
saint header. Source entries keep their gold sans-serif section heading and use
regular-weight serif titles, compact book icons, and a quieter trailing external
link icon. Author, publisher, year, notes and link behavior remain intact. Use the
saint-profile action/source tokens; do not change global button or source styles
to tune this page.

Short overviews may remain expandable until full biographies are available.
Use the editorial variant of SaintProfileSummary on public profiles, preserving
authored paragraph breaks when expanded. Private museum summaries retain their
compact variant. Do not synthesize biography text or paragraph divisions.

Hero portraits use the shared portrait aspect token. FocalImage must consume the
saved focus, calculated against the gallery's measured frame; museum frames may
have different dimensions. Keep manual focus overrides. Automatic face detection
is separate future work, not part of this pilot.

The existing photo-card rails, up-to-eight related-saint network traversal and
featured-saint fallback are unchanged. Mockup card counts are illustrative and
must never replace production recommendation logic.
