
### Relic intake

SPN's protected `/museumadmin/intake` uses the museum shell and URL-backed Team
intake / Curator review tabs. Reuse `MuseumRelicIntake` field, private-photo,
inline-error and queue treatments for future museum intake callers. Required
fields lead; optional reported dates, place and arrival details stay in a disclosure.
Errors belong beside the relevant control, with accessible associations and focus
on the first missing field only after submission. Do not pre-render validation errors.

Drafts and photos save to authenticated storage; approval freezes the reviewed
snapshot. Delivery status is separate from approval and must report actual backend
state. Setup-pending delivery never means a record was sent or published. Do not
show mock matching, simulated sends or public image URLs in the live workflow.
Existing roles apply; expanded team access and official Airtable setup need separate
review. No intake action publishes a saint or changes museum locations.
