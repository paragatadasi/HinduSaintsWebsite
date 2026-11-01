# Partial staging and receiver availability

Partial staging records only the selected source observations in generic staging. It does not empty a vitrine or move its unselected contents. Fixed housing, verified inventory items, changed identities and component scopes keep their existing separate workflows.

## Selected contents

Use `GET /api/admin/museum-historical-staging?museumId=museum-spn&vitrine=59&mode=contents`. The existing response supplies `eligible`, `blocked`, `preservedSourceIds` and `revision`. Current registered receiving vitrines are supported alongside the existing optional-content cases. Historical reconciliation retains its narrower scope.

Submit the existing physical confirmation payload with only selected records targeting `{kind:"table",code:"staging-area",label:"Staging area"}` and `caseContentsStaging: {vitrine,expectedRevision,selectedContentsPhysicallyStaged:true,confirmedTargetPlacementsPreserved:true}`. Omit `guideContext` and `clearedVitrines`. Refresh and reselect after a conflict. The snapshot and every selected source/location version are checked in the transaction.

## Space for incoming relics

Use `GET /api/admin/museum-physical-locations?museumId=museum-spn&view=receiver-availability&vitrine=59&guideVersion=...` for `guideContext`, `revision`, `expectedPreparationVersion`, `occupants` and `incoming`.

POST to the same endpoint:

```json
{
  "action": "receiver.availability",
  "museumId": "museum-spn",
  "clientRequestId": "a-new-UUID",
  "guideContext": {"guideVersion":"...","contentDigest":"...","assignmentDigest":"..."},
  "vitrine": "59",
  "expectedRevision": "preview revision",
  "expectedPreparationVersion": 0,
  "availableSpaceAcknowledged": true
}
```

This management-permission action saves a preparation receipt with `physicalMoveClaim:false` and `emptyCaseClaim:false`. It changes no locations, proposals or full-clear receipts. Identical retries are idempotent; stale snapshots and changed request reuse are rejected.

The full physical GET and availability POST return `receiverAvailabilities`: `{vitrine,guideVersion,receiptId,recordedAt,valid,reason}`. A matching current-guide entry with `valid:true` satisfies receiver clearance separately from `phaseClearances`. The ordinary preparation and movement safeguards still apply.

An acknowledgement covers the captured remaining occupants and incoming proposal roster. Normal subsequent approved arrivals remain valid. Unexpected occupants, changed or removed retained contents, source/roster changes, undo or further moves of incoming entries, a superseded guide, and a later preparation update invalidate it. Refresh the preview and confirm available space again. This is a curator's capacity assessment, not a calculated physical-fit guarantee.

No migration or environment configuration is required. No production data is changed by deploying this contract. The museum interpretation skill already distinguishes availability, partial contents and empty-case claims; this workflow adds no new interpretation rule.
