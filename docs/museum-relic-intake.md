# Museum relic intake

Backend foundation, 27 October 2026. Citra owns the intake UI. This checkpoint saves private entries, photos and curator decisions. It does **not** send records to either destination, create canonical saints or collection items, publish content, assign locations, or write to Airtable.

## Evidence and identity

One intake group describes reported relics for one saint; it does not establish a new saint identity. Required at submission: reported saint name and one or more relic children, each with a description and at least one relic photo. Saint portrait, shared biography document, reported place, birth date, samadhi date and brought-by details are optional. Each child may have a supporting document and a brought-by override. An absent override inherits the shared value; an explicit empty string preserves an intentionally blank override. Preserve reported dates and places as strings. They do not establish a saint's locality, parsed chronology or reviewed biography. The donor/collector value and all intake material remain private.

Approval requires an explicit existing saint ID or `new_draft` decision. The latter records intent to create a private draft later; it does not create one at this checkpoint. Matching by name alone is insufficient. Existing reviewed website content must not be overwritten by optional intake fields. Future adapters must turn conflicting values into reconciliation evidence.

The official museum Airtable and the Saints project Airtable are separate bases. Existing read-only official access and read/write project access do not authorize using the project copy as the official delivery destination.

## Access and workflow

All endpoints require an active signed-in user with `access_museum`. Users see their own entries; `manage_museum` users can see and review all entries. This uses existing role grants, without adding volunteer access or changing roles. Confirm team accounts and access with the curator before rollout.

States: `draft` → `submitted` → `approved`, or `submitted` → `needs_changes` → `submitted`. Owners may correct their submitted or approved entries as well as drafts and returned entries. Curators may correct entries they can review. Editing submitted or approved content returns it to draft for resubmission. Every field change increments the entry version and records an audit event. Submission and approval validate the required fields again. Approval captures the raw fields, identity decision, selected saint revision, media references and hashes in an immutable snapshot. Each approval is retained in `MuseumIntakeApproval`. Later edits preserve that snapshot and its media; a subsequent approval creates a new snapshot and separate delivery receipts.

Mutations use `expectedVersion`; conflicts return 409 and require reloading. Creation uses a client-generated UUID `clientRequestId`, unique per author, so a network retry returns the existing draft. Duplicate photo bytes within one child and photo kind are deduplicated; the same image may document two different children. Repeating the same approval request returns the stored result without new delivery rows. Transactions lock the entry and use serializable isolation; serialization conflicts require reload/retry.

## API contract

Base: `/api/admin/museum-intake`. Writes require same-origin requests. Configure the canonical public `AUTH_URL` (or `NEXTAUTH_URL`) behind a reverse proxy: Next's internal bind address may differ from the browser origin. Without that configuration, the fallback checks the browser Host and request protocol. Missing or foreign origins are rejected. Success returns the entry DTO directly, except list returns `{entries, total, limit:100, nextCursor}`. Errors return `{error:string}` with an appropriate HTTP status. JSON bodies are limited to 512 KiB; upload requests to 11 MiB, with an individual image limit of 10 MiB.

| Method and path | Body / result |
| --- | --- |
| GET base | Optional `museumId`, `cursor` and `scope=mine`; newest entries first. Ownership is enforced before pagination and counts. |
| POST base | `{museumId,clientRequestId,fields,relics}`. SPN's ID is `museum-spn`. |
| GET `/:id` | Private entry DTO. |
| PATCH `/:id` | `{expectedVersion,fields,relics}`; replaces shared fields and the complete active child list. |
| POST `/:id/media` | Multipart `file`, `kind=relic\|relic_document\|saint_portrait\|bio_document`, `expectedVersion` and `relicId` for child media; maximum 12 photos per child or shared section. |
| GET `/:id/media/:mediaId` | Authenticated JPEG bytes, with the same photo also available through its public `/media/...` URL. |
| DELETE `/:id/media/:mediaId` | `{expectedVersion}`; archives the active photo reference; approved evidence remains available. |
| POST `/:id/submit` | `{expectedVersion}`. |
| POST `/:id/review` | `{action:"approve",expectedVersion,saintDecision,note?}` or `{action:"request_changes",expectedVersion,note}`. |

`fields`: `{saintName,saintPlaceRaw?,birthDateRaw?,samadhiDateRaw?,broughtByRaw?}`. `relics`: `[{id,relicDescription,broughtByRaw?}]`, one to 50 children. Generate stable UUID child IDs in the form and reuse them across saves. Omitted existing children are archived, not deleted. Legacy one-relic requests may omit `relics` and retain `fields.relicDescription`; that compatibility path never replaces a multi-child list. `saintDecision`: `{kind:"existing",saintId}` or `{kind:"new_draft"}`. Notes are optional for approval, required for requested corrections.

DTO: `id,museumId,version,status,createdById,fields,reviewNote,reviewedAt,reviewedVersion,approvedSnapshot,createdAt,updatedAt,relics,approvals,media,deliveries,deliverySummary`. Each relic includes its scoped media. Top-level media is flattened and includes `relicId` (null for shared media). Media exposes ID, kind, dimensions, byte size, MIME type and public media URL, never a storage key. Delivery exposes target, reviewed version, status, attempts, external record ID, error code and delivery timestamp. The snapshot is private and includes provenance hashes.

## Public intake photos

Intake photos use the existing public media backend and `MEDIA_UPLOAD_ROOT`/`MEDIA_STORAGE_BACKEND` configuration. They are decoded and validated as JPEG/PNG/WebP, orientation-corrected, resized to at most 2400 pixels, reencoded to JPEG and stripped of original metadata. The original-byte SHA-256 is retained for duplicate detection; original files are not retained.

The normalized files use the `museum-intake/` storage prefix and ordinary public `/media/...` URLs. The intake record and all mutations remain authenticated and permission-checked; the photo itself follows the same public-media behavior as existing museum media.

With `MEDIA_STORAGE_BACKEND=s3`, the existing public `MEDIA_S3_BUCKET` and credentials are used. Existing S3 endpoint/region/credentials configure the client. Operators should verify the public media bucket behavior matches the rest of the museum media already in use.

Photo removal archives its active reference and retains its stored bytes for historical approvals. Child removal similarly archives its row and hides its media from the current DTO. Failed cleanup logs an identifier for operator reconciliation. An interrupted process can also leave unreferenced upload files. A future retention/cleanup job must compare database references and avoid deleting approved evidence; this checkpoint does not install a cleanup scheduler.

## Separate destination deliveries

Each approval revision creates exactly one `website` and one `official_airtable` delivery row in the same transaction as the reviewed snapshot. Both start `blocked_configuration` with `delivery_adapter_not_enabled`. The UI must say approved and awaiting configuration, rather than sent. There is no send/retry endpoint or worker yet. Partial-success and unknown-result states are part of the future delivery contract, not evidence that external delivery works today.

Next adapter phase:

- Website delivery needs a transactionally unique intake receipt, existing identity revision checks, or explicit new private draft creation. Create the physical collection item separately from the person; do not publish automatically or silently overwrite reviewed fields.
- Official Airtable delivery needs an explicitly configured official base ID, verified destination table/field IDs, a narrowly scoped write credential and an external stable intake marker. Never fall back to `AIRTABLE_BASE_ID` or trial-write to discover permission. Confirm whether the destination is Saints plus Relics, or a dedicated intake table.
- Define private attachment transfer before enabling Airtable photos. Permanent public photo URLs are not an acceptable shortcut. Account for attachment expiry and retries.
- Each target needs a lease and receipt. Retry failed targets independently, never replay a successful target. A timeout after a possible remote create is `unknown`: reconcile the external intake marker before any new create. Do not claim atomic delivery across two systems or roll back one successful destination when the other fails.

## Rollout and verification

Additive migration: `20261027020000_museum_relic_intake`. The multi-relic follow-up `20261027200000_museum_multi_relic_intake` adds child rows, scoped media, approval history and revision-specific delivery uniqueness. Existing entries become one child each without changing raw fields, media IDs/storage keys or prior snapshots. Neither migration alters saints or inventory. Apply through the deployment migration phase, not the web build. Verify the existing public media storage before enabling uploads. No new dependency or Airtable environment variable is required for this foundation.

Focused tests cover required evidence, raw date/place preservation, explicit identity choice, preserved approval history, target-specific retries, same-origin validation behind a proxy, actual image decode/metadata removal and private filesystem confinement. Run `dev:check`; schema/auth/API changes also require `codex:verify` before release.

`scripts/verify-museum-intake-local.ts` exercises persistence, concurrency, ownership and review against a migrated disposable local database. `scripts/verify-museum-intake-http-local.ts` checks real authenticated routes and public photo URLs against a local server using temporary database sessions. Both refuse nonlocal databases and require a database name beginning `museum_intake_test`; the HTTP test also requires `MUSEUM_INTAKE_TEST_URL` on HTTP localhost. Start that server against the same disposable database with a random test-only `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, matching `AUTH_URL`, and a temporary `MEDIA_UPLOAD_ROOT`. No OAuth login or email delivery is used. Never run these scripts against the website database. Disposable users, entries and public media remain for inspection; test sessions are removed. Dispose of the dedicated environment after testing.

Docker was unavailable during initial implementation; Citra subsequently applied all 85 migrations and passed the database integration script on `museum_intake_test_20261027`. HTTP verification initially caught the internal-bind origin mismatch and prompted the guard correction. Record the rerun result in the release handoff; unit checks alone do not establish route or production-storage verification.

Skill review: this workflow follows existing museum evidence and identity rules; no source interpretation changed. Private storage and delivery contracts belong in this project document rather than the museum interpretation skills.

## Integrated interface checkpoint

The protected SPN `/museumadmin/intake` page now uses these endpoints for saved
entries, private camera/upload photos, inline validation, curator corrections,
explicit identity decisions and approval. The museum Workspace navigation exposes
“Receive a relic”. Review queue pagination keeps older entries reachable.

Morning review / release prerequisites:
- Decide which team accounts may submit; no roles or access were expanded.
- Confirm the official Airtable base/table fields and intended attachment handling.
- Verify the existing persistent public media storage before enabling production uploads.
- Run `scripts/verify-museum-intake-local.ts` against an isolated local database
  after applying migrations; Docker was unavailable for the combined checkpoint.
- Verify authenticated browser flow and mobile camera behavior with the integrated app.
- Implement and verify delivery adapters before enabling delivery. Approvals currently
  remain safely pending; no saints, collection items or external records are created.

This feature is held undeployed and is not part of the SPN proposal release.

## Local database verification, 27 October

All 85 migrations applied successfully to disposable localhost database `museum_intake_test_20261027`. `verify-museum-intake-local.ts` passed persistence, duplicate upload/create retries, concurrent edits, ownership, curator corrections, immutable approval, and disabled delivery checks. Combined `dev:check`, six focused tests and `codex:verify` passed. Production private-storage configuration and authenticated mobile/browser smoke checks remain rollout requirements. Airtable and website delivery adapters remain disabled.


## Existing public media storage

The intake reuses the existing persistent `app_uploads` volume and public media configuration. Verify an actual photo persists across app restart and its public `/media/...` URL works before collecting data. Airtable and website delivery remain disabled.


Multi-relic migration and persistence verification: run `scripts/verify-museum-multi-relic-local.ts` against a **fresh** disposable localhost database named `museum_intake_test_multi…`. It installs prior migrations, seeds a legacy approved entry/photo, applies the new migration, then checks child evidence, ownership, corrections, stale versions, approval/media retention and disabled delivery. Do not run this schema-building verifier against an existing development or production database. Shared model/schema changes require regenerating Prisma before starting either UI or API.

Learning review (27 October 2026): existing museum interpretation rules already separate saint identity, source observations and physical relics, and preserve evidence. This change applies those rules through explicit intake children and approval revisions; no reusable skill rule changed.
