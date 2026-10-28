# Companion life-status labels

On 28 October 2026 the curator requested restoration of living-status tags and suppression of **May be alive** for saints born more than a century ago.

The starter packet already contained lifeStatus metadata, but its display adapter omitted the field. The adapter now retains it. Current museum member dates/status are projected using an unambiguous current saint/source placement, with membersById accessed by placement ID. This reuses the initial museum read; switching phases adds no inventory request.

The century rule is a presentation rule, not a death determination. Only uncertain May be alive labels are suppressed. Explicit Still alive remains visible regardless of age. Reliable exact dates use the precise 100-year boundary; year-only evidence is suppressed only below currentYear minus100. Birth ranges use the latest plausible year. Missing or narrative-only birth dates do not trigger suppression. Missing death data never creates a living label. Known parsed samadhi dates withhold contradictory living tags; raw values and immutable guide packets are preserved.

Current member text is the current stored record, not fresh verification that someone is living. SamadhiDate prioritizes raw text in the existing museum reader; resolving a raw/numeric canonical contradiction requires a separate exact evidence review rather than assuming this display projection audited it.

Tests cover starter metadata retention, exact boundary, year-only ambiguity, range crossing, unknown/narrative birth, explicit living, recorded samadhi, unchanged raw guide, and ambiguous identity. No proposal, physical placement, canonical date or source record is changed.
