# Shelf recommendation browsing

`readShelfPlanningContext(packet, current, physical, alternatives?)` supplies the protected move companion with a separate, read-only shelf workspace. The caller must enforce museum access and pass its existing current museum data and physical snapshot. No new physical-location query or move-guide registration is needed.

The pure `projectShelfPlanningContext` adapter returns `mode: recommendations_only`, `physicalActionsEnabled: false`, and one case per packet case. Each case includes compatible shelf allocations/groups/relationships, current `GuideEntry` values, notes, band warnings and `reviewedChanges`. The UI must render these changed/pending sources explicitly, not silently hide them or expose movement controls. Existing executable phases and their receipts, digests, source membership and preparation guards remain separate.

Source identity, current source revision and captured curator baseline are checked against the current approved reviewer, saved guide alternatives and valid current additions. Newer destinations are retained. A changed identity, stale source interpretation or changed curator baseline withholds the captured position for review. Names, tiers, life-status labels and physical locations come from current data. Missing death data never creates a living label. New positive living evidence holds a stale top-position recommendation for review.

The Baman display exception is limited to the exact source, canonical identity and reviewed baseline captured on 30 October 2026. It represents the user's approved Vitrine 78 co-location intent. A newer curator arrangement overrides it; it creates no identity merge, physical confirmation or historical relationship.

Five conceptual bands and source-context loads remain planning comparisons, not measured shelf dimensions or certified fit. Preserve source/component housing restrictions. Contextual figures with unresolved names must have neutral labels rather than internal database identifiers.

Verification: focused adapter tests cover current physical overlays, destination/identity/source changes, curator changes, life-status changes, the guarded Baman exception, manual additions and duplicate packet sources. The captured full-roster audit accounts for all 347 observations across 18 cases: 347 active recommendations. Revision 5 refreshes only the two reviewed stale baselines (Gaudi Das Pandit and Maa Moni), preserving their earlier baselines in the packet history; runtime identity, destination and revision guards remain unchanged. Re-evaluate against current production data on each page load.

Workflow learning review: existing museum interpretation and identity skills already require these distinctions; no reusable rule change was needed.

The companion Shelf plans tab loads the protected read-only endpoint on entry and refreshes on focus and every 30 seconds. It preserves the selected vitrine in the URL. Physical labels use the existing live companion state; recommendations cannot issue physical writes. Open move guide returns to an existing registered phase. Changed recommendations remain in an explicit review list with their earlier suggested row.
