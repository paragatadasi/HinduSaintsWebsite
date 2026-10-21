# Curator identity review in the move planner

The Vrindavan planning experience includes an expandable identity-review list.
It is for the specific research questions a curator can answer by checking a
portrait, object label or collection evidence. It is not a general reassignment
tool, a fuzzy identity matcher, or a physical move confirmation.

## Experience

- Open **Review identities** in plan mode. Loading is deferred until the list is
  opened, so the research queue does not delay ordinary room planning.
- Select a case. Source inventory locations are historical locating aids; they
  are not assertions of the object's current physical location.
- Compare cited evidence and, where available, the website candidate's portrait
  and biography. A candidate portrait does not establish the object's identity.
- Choose a supported identity. No candidate is preselected. The comparison shows
  each current value and the resulting museum proposal before confirmation.
- Source identity-link choices remain blocked in this first release and use the
  existing reconciliation workflow. The shared review UI supports a separate
  acknowledgement for any future explicitly approved linking action.
- **Different saint** and **Unsure** require a note and keep the case pending.
  Cases needing further evidence or record cleanup are grouped separately.
- After saving, the queue reloads and the parent plan refreshes. Resolved cases
  leave the active list. Existing proposal and identity controls handle corrections.

## Safety and ownership

Research supplies versioned case and option identifiers with explicit supported
changes and evidence. The backend owns the allowed options and validates current
records; the browser never supplies arbitrary saint IDs, family IDs or sections
to this review action. Confirmation does not create saints, merge canonical
identities, edit public fields, or record a physical move. Existing reviewed
overrides and changed records require explicit review rather than silent replacement.

Case loading and candidate-profile loading require museum access and full-catalog
access. Mutations additionally require museum management; identity-link options
also require reconciliation permission. Profiles are loaded only for a current
server-owned case and revision.

An uncertain save disables retry until a successful fresh load. The component
uses a successful-load generation as well as the case revision to reset the form:
even when a transient failure leaves the revision unchanged, reloading restores
the ability to review and retry. A failed reload does not unlock a stale form.

## Verification notes

Synthetic browser interaction checks on 21 October 2026 covered:

- No default identity selection and confirmation disabled until selection.
- Explicit current/after comparison before confirmation.
- Failed save, successful reload with the same revision, then successful retry.
- Resolved case removal and updated queue counts after confirmation.
- An identity-link choice staying disabled until its separate acknowledgement.
- Unsure retaining the note and keeping the case open.

These interaction checks use synthetic records and do not exercise production
database writes. A separate test of the actual bundled service with an in-memory
transaction adapter covered allowlisted option enforcement (including prototype
property names), active-actor permissions, stale source rejection, rollback on
audit failure, Unsure without a proposal write, successful section confirmation,
duplicate confirmation rejection, and reopening after source changes. This is
not a PostgreSQL concurrency test.

The MVP save effect is limited to the museum subsection of an already linked
identity. It retains tier and display family, preserves a valid Planned destination
only when the section is unchanged, and never writes a physical location. The
server repeats all checks under the museum advisory lock and a Serializable
transaction. Both the proposal and decision are audited atomically. Existing
curator overrides are routed to normal proposal review rather than overwritten.
