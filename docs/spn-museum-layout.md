# SPN museum layout foundation — 23 October 2026

For curatorial grouping, space and move-order reasoning, read
[Museum planning principles](museum-planning-principles.md). This document defines
the SPN floorplan, numbering and protected-housing constraints.

The protected `/museumadmin/plan` screen begins SPN move planning with a browsable map and list. It shows recorded contents and restrictions; it does not yet save section assignments or record moves. Vrindavan retains its existing planner.

## Source and confirmed interpretation

The private source photo is `data/museum/layouts/spn-layout-source-2026-10-23.jpg`; its transcription and provenance are in `spn-layout-2026-10-23.json`. Neither is a public asset. Positions preserve the two-room arrangement and adjacency, not physical dimensions or capacity.

Paragata Dasi confirmed three new vitrines in the small island above 3 (one horizontal, two vertical; ignore the crossed-out divider), and three future spaces (above 1, above 4, and below 30).

## Numbering

Numbers 1–69 are retained. Vitrine 69 is new but already numbered on the source. The 13 unnumbered new spaces receive provisional labels 70–82:

| Labels | Location |
| --- | --- |
| 70, 71 | Above 18 and above 13 respectively |
| 72, 73 | Left island, between 20/25 and 21/24 |
| 74, 75 | Left island, between 22/23 and 5 |
| 76, 77 | Right island, between 28/34 and 29/33 |
| 78, 79 | Right island, between 36/32 and 2 |
| 80 | Small central island, horizontal top |
| 81, 82 | Small central island, vertical left/right |
| 83, 84 | Future spaces above 1 and 4 |
| 85 | Future walking-stick space below 30 |

There are 85 mapped spaces: 82 available for the current reorganization, including 14 new vitrines, and three future spaces. New does not certify empty. All provisional labels display an asterisk. They do not create database locations or renumber inventory. The page flags collisions against recorded SPN location codes and projected source locations.

## Restrictions and inventory

30 and 31 accept walking sticks only; 85 retains the same restriction but is unavailable now. The shared eligibility helper rejects every future space and rejects non-stick or unknown item types in stick-only vitrines. Future spaces remain inspectable in browse mode.

The page requires museum access and full saint-catalog access. Inventory items and source-only saint locations are counted separately using the existing location-browser reconciliation. An empty result is explicitly not evidence of physical emptiness. No production data mutations, schema migrations, or environment changes are part of this feature.

## Next implementation phase

Use this layout as the SPN destination catalogue after confirming provisional operational codes. Extend saved proposals and section assignments with server-side availability/item restrictions, then adapt the move companion. Walking-stick-only spaces require item-level planning; assigning an entire saint or family must not imply every associated relic is a walking stick.

## Verification

Layout tests cover all numbers, non-overlapping geometry, the confirmed central island, future spaces, entrance-room row order, eligibility and provisional-code collisions. Browser checks use the actual client component with empty inventory fixtures; authenticated live inventory still needs release smoke testing.

## Approved whole-room presentation (24 October 2026)

The curator selected Map first after comparing whole-room polish variants. The
production browser keeps the entire room geometry together, uses a compact
header and horizontal navigation, and shows selected-vitrine contents alongside
the map on wide screens. Narrow screens stack the details and retain the list
alternative and horizontal map scrolling.

Available vitrines have a lighter surface. Future spaces use the dark background,
a dashed boundary and a Future label. New spaces retain their label and subtle
tint; walking-stick restrictions remain explicit. Selection uses a gold outline
without changing the availability fill. The legend says “Provisional Number”.

The layout remains an inspection screen. Search, map selection and view switching
do not assign or move relics. Existing inventory/source distinctions, empty-record
cautions, provisional-number collisions and outside-layout records are retained.
The implementation contains no prototype picker or alternative production layout.
