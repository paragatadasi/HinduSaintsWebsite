# Museum relic intake

Backend foundation, 27 October 2026. Citra owns the intake UI. This checkpoint saves private entries, photos and curator decisions. It does **not** send records to either destination, create canonical saints or collection items, publish content, assign locations, or write to Airtable.

## Evidence and identity

One intake entry describes a received relic, not a new saint identity. Required at submission: reported saint name, relic description and at least one relic photo. Optional: saint portrait, reported place, birth date, samadhi date and who brought the relic. Preserve reported dates and places as strings. They do not establish a saint's locality, parsed chronology or reviewed biography. The donor/collector value and all intake material remain private.

Approval requires an explicit existing saint ID or `new_draft` decision. The latter records intent to create a private draft later; it does not create one at this checkpoint. Matching by name alone is insufficient. Existing reviewed website content must not be overwritten by optional intake fields. Future adapters must turn conflicting values into reconciliation evidence.

The official museum Airtable and the Saints project Airtable are separate bases. Existing read-only official access and read/write project access do not authorize using the project copy as the official delivery destination.

## Access and workflow

All endpoints require an active signed-in user with `access_museum`. Users see their own entries; `manage_museum` users can see and review all entries. This uses existing role grants, without adding volunteer access or changing roles. Confirm team accounts and access with the curator before rollout.

States: `draft` → `submitted` → `approved`, or `submitted` → `needs_changes` → `submitted`. Owners edit drafts and returned entries. Curators can also correct fields/photos while submitted. Every field change increments the entry version and records an audit event. Submission and approval validate the required fields again. Approval captures the raw fields, identity decision, selected saint revision, media references and hashes in an immutable snapshot. Approved entries cannot be edited or have photos removed.

Mutations use `expectedVersion`; conflicts return 409 and require reloading. Creation uses a client-generated UUID `clientRequestId`, unique per author, so a network retry returns the existing draft. Duplicate photo bytes within an entry and photo kind are deduplicated. Repeating the same approval request returns the stored result without new delivery rows. Transactions lock the entry and use serializable isolation; serialization conflicts require reload/retry.

## API contract

Base: `/api/admin/museum-intake`. Writes require same-origin requests. Configure the canonical public `AUTH_URL` (or `NEXTAUTH_URL`) behind a reverse proxy: Next's internal bind address may differ from the browser origin. Without that configuration, the fallback checks the browser Host and request protocol. Missing or foreign origins are rejected. Success returns the entry DTO directly, except list returns `{entries, limit:100, nextCursor}`. Errors return `{error:string}` with an appropriate HTTP status. JSON bodies are limited to 32 KiB; upload requests to 11 MiB, with an individual image limit of 10 MiB.

| Method and path | Body / result |
| --- | --- |
| GET base | Optional `museumId` and `cursor`; newest entries first. |
| POST base | `{museumId,clientRequestId,fields}`. SPN's ID is `museum-spn`. |
| GET `/:id` | Private entry DTO. |
| PATCH `/:id` | `{expectedVersion,fields}`; replaces the complete fields object. |
| POST `/:id/media` | Multipart `file`, `kind=relic\|saint_portrait`, `expectedVersion`; maximum 12 photos. |
| GET `/:id/media/:mediaId` | Authenticated JPEG bytes, private/no-store. |
| DELETE `/:id/media/:mediaId` | `{expectedVersion}`; editable entries only. |
| POST `/:id/submit` | `{expectedVersion}`. |
| POST `/:id/review` | `{action:"approve",expectedVersion,saintDecision,note?}` or `{action:"request_changes",expectedVersion,note}`. |

`fields`: `{saintName,relicDescription,saintPlaceRaw?,birthDateRaw?,samadhiDateRaw?,broughtByRaw?}`. `saintDecision`: `{kind:"existing",saintId}` or `{kind:"new_draft"}`. Notes are optional for approval, required for requested corrections.

DTO: `id,museumId,version,status,createdById,fields,reviewNote,reviewedAt,reviewedVersion,approvedSnapshot,createdAt,updatedAt,media,deliveries,deliverySummary`. Media exposes ID, kind, dimensions, byte size, MIME type and authenticated URL, never a storage key. Delivery exposes target, status, attempts, external record ID, error code and delivery timestamp. The snapshot is private and includes provenance hashes.

## Private photos

Do not use the existing public media uploader. Intake photos are decoded and validated as JPEG/PNG/WebP, orientation-corrected, resized to at most 2400 pixels, reencoded to JPEG and stripped of original metadata. The original-byte SHA-256 is retained for duplicate detection; original files are not retained.

Filesystem development defaults to ignored `private-uploads/`. Production requires `MUSEUM_INTAKE_UPLOAD_ROOT`, a persistent private directory. It must be outside public files and the public upload root, except for the exact guarded `_museum-private` subtree described below. Do not point it at symlinks/junctions into public storage or expose it through the web server. Protect filesystem access and backups.

With effective intake backend `s3` (`MUSEUM_INTAKE_STORAGE_BACKEND`, falling back to `MEDIA_STORAGE_BACKEND`), configure a separate **private** `MUSEUM_INTAKE_S3_BUCKET`; the public media bucket is rejected. Existing S3 endpoint/region/credentials configure the client. Operators must verify anonymous reads and public listing are denied, and ensure credentials can access the private bucket. No public or presigned URLs are emitted. The application serves bytes only after entry access checks.

Photo removal deletes the private object after its database reference is removed. Failed cleanup logs an identifier for operator reconciliation. An interrupted process can also leave unreferenced upload files. A future retention/cleanup job must compare database references and avoid deleting approved evidence; this checkpoint does not install a cleanup scheduler.

## Separate destination deliveries

Approval creates exactly one `website` and one `official_airtable` delivery row in the same transaction as the reviewed snapshot. Both start `blocked_configuration` with `delivery_adapter_not_enabled`. The UI must say approved and awaiting configuration, rather than sent. There is no send/retry endpoint or worker yet. Partial-success and unknown-result states are part of the future delivery contract, not evidence that external delivery works today.

Next adapter phase:

- Website delivery needs a transactionally unique intake receipt, existing identity revision checks, or explicit new private draft creation. Create the physical collection item separately from the person; do not publish automatically or silently overwrite reviewed fields.
- Official Airtable delivery needs an explicitly configured official base ID, verified destination table/field IDs, a narrowly scoped write credential and an external stable intake marker. Never fall back to `AIRTABLE_BASE_ID` or trial-write to discover permission. Confirm whether the destination is Saints plus Relics, or a dedicated intake table.
- Define private attachment transfer before enabling Airtable photos. Permanent public photo URLs are not an acceptable shortcut. Account for attachment expiry and retries.
- Each target needs a lease and receipt. Retry failed targets independently, never replay a successful target. A timeout after a possible remote create is `unknown`: reconcile the external intake marker before any new create. Do not claim atomic delivery across two systems or roll back one successful destination when the other fails.

## Rollout and verification

Additive migration: `20261027020000_museum_relic_intake`. Three private tables, no alteration of existing saints or inventory. Apply through the deployment migration phase, not the web build. Configure and verify private media storage before enabling uploads. No new dependency or Airtable environment variable is required for this foundation.

Focused tests cover required evidence, raw date/place preservation, explicit identity choice, locked approved records, target-specific retries, same-origin validation behind a proxy, actual image decode/metadata removal and private filesystem confinement. Run `dev:check`; schema/auth/API changes also require `codex:verify` before release.

`scripts/verify-museum-intake-local.ts` exercises persistence, concurrency, ownership and review against a migrated disposable local database. `scripts/verify-museum-intake-http-local.ts` checks real authenticated routes, private media access and denied requests against a local server using temporary database sessions. Both refuse nonlocal databases and require a database name beginning `museum_intake_test`; the HTTP test also requires `MUSEUM_INTAKE_TEST_URL` on HTTP localhost. Start that server against the same disposable database with a random test-only `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, matching `AUTH_URL`, `MUSEUM_INTAKE_STORAGE_BACKEND=filesystem`, a temporary `MEDIA_UPLOAD_ROOT`, and `MUSEUM_INTAKE_UPLOAD_ROOT` set to exactly that root plus `/_museum-private` for both server and test process. The HTTP check probes the actual reserved public key and expects 404 with no redirect. No OAuth login or email delivery is used. Never run these scripts against the website database. Disposable users, entries and private files remain for inspection; test sessions are removed. Dispose of the dedicated environment after testing.

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
- Configure persistent private photo storage before enabling production uploads.
- Run `scripts/verify-museum-intake-local.ts` against an isolated local database
  after applying migrations; Docker was unavailable for the combined checkpoint.
- Verify authenticated browser flow and mobile camera behavior with the integrated app.
- Implement and verify delivery adapters before enabling delivery. Approvals currently
  remain safely pending; no saints, collection items or external records are created.

This feature is held undeployed and is not part of the SPN proposal release.

## Local database verification, 27 October

All 85 migrations applied successfully to disposable localhost database `museum_intake_test_20261027`. `verify-museum-intake-local.ts` passed persistence, duplicate upload/create retries, concurrent edits, ownership, curator corrections, immutable approval, and disabled delivery checks. Combined `dev:check`, six focused tests and `codex:verify` passed. Production private-storage configuration and authenticated mobile/browser smoke checks remain rollout requirements. Airtable and website delivery adapters remain disabled.


## Approved shared-volume private storage

The intake can use the existing persistent `app_uploads` volume without publishing its files. Set `MUSEUM_INTAKE_STORAGE_BACKEND=filesystem` and `MUSEUM_INTAKE_UPLOAD_ROOT=/app/uploads/_museum-private`, with `MEDIA_UPLOAD_ROOT=/app/uploads`. The intake backend override is independent of the public media backend. Only this exact reserved subtree is allowed within the public upload root; other public paths remain rejected.

Deploy the public media deny guard in the same release, before accepting any photo. Both the public route and shared public media readers must reject `_museum-private` before reading or redirecting. Intake media remains served only through authenticated entry-media routes. The existing volume must be persistent, writable by runtime UID 1001, included in restricted backups, and not exposed by Caddy or another static file server.

Verify an actual photo persists across app restart, its authenticated URL works, and its exact reserved public key returns 404. Do not roll back to a version without the public deny guard while private files remain in the shared volume. Keep that guard as a rollback patch, or move the private directory to protected storage before rollback. Never delete private photos to perform rollback. Airtable and website delivery remain disabled.
