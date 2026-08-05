# Admin conflict protection and presence

Saint, Tradition, Place, and Instagram item records carry an integer `version`.
Top-level review saves submit the version rendered with the form and update only
when that version still matches, incrementing it in the same database statement.
A stale save therefore cannot overwrite a newer edit.

Stale attempts create a private `AdminEditConflict` snapshot containing the
current record and the attempted values. The editor can compare both, reload the
current version, or deliberately reapply the allowlisted attempted fields. Reapply
has its own version precondition; if another save wins first, the comparison is
refreshed instead of overwriting it. Domain publish permissions remain enforced.

Detail pages send a presence heartbeat every 30 seconds. Rows expire after 90
seconds and old rows are pruned opportunistically. Presence shows viewers/editors
but is advisory only: the version precondition is the data-safety boundary.
Nested relationship and media rows are edited through their parent review
workflow; their parent top-level record is the collaboration identity.
