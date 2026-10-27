
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

Save feedback belongs beside the intake action buttons. Distinguish saving details, uploading photos and submitting for review. Failed photo uploads retain the file in memory for retry, with an explicit remove option; pending uploads must not be mistaken for saved photos. Cancelling an unsaved-change navigation must also cancel the shared route-progress indicator.

The required intake fields include a **Bio document** photo directly below the relic description. Use the shared camera/upload controls and field-local errors. Drafts can be saved without it; submission requires both a relic photo and a bio-document photo. Keep the document visible in curator review as its own media kind.

Curator review shows submitted/reviewed entries in the main queue and unfinished drafts in a separate queue below it, each with its own loaded-entry count and empty state. Drafts remain editable but cannot be approved before submission.
