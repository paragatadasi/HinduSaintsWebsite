# Reviewed key localities for published saints

Status: implemented locally on `codex/researched-key-localities`; no production data operation has run.

## Research and scope

Exact source: `data/research/saints-key-localities-2026-10-19-v4.json`, provided by Saarthi. The original research covers 214 proposal identities, not the complete current published catalogue. It contains 172 supported shortlists and 42 unresolved records, with 363 recommendations, all medium confidence. Of these, 339 are named localities and 24 are regions or composites. Eleven representative recommendations are broad/composite, so at most 161 records can supply a named representative locality before current canonical/publication/place checks.

This research is editorial synthesis of earlier life-route research. Citation bundles are record-level evidence, not separately audited claims. Confidence, source URLs, ambiguity and evidence limitations are preserved. No new historical verification or geocoding is claimed.

## Operation

In the protected main admin Source Data area, open Visit-place research, then **Review Saarthi’s key locality updates for published saints** (`/admin/source-data/key-localities`). The page reads the current database, shows coverage gaps, current and proposed associations, and research. Filter eligible updates, select individual records or all eligible, confirm the displayed changes, and apply. An authorized editor can download `published-saints-locality-coverage.json` for further research.

Only an exact research slug or preserved external identity can identify a canonical saint. Conflicting canonical links, duplicate research identities for a canonical saint, unpublished saints, unresolved representative localities, ambiguous place records, missing country, archived places, and unpublished place editorial content block application. No name similarity match is accepted automatically.

The operation updates the first recommendation to primary and records up to two other named key localities in `SaintPlace.keyLocalityOrder`. It preserves old associations and existing route metadata. It does not change precise visit destinations, route chronology, coordinates, saint publication, museum section assignments or physical relic locations. Existing public profile main place lists use the ranked shortlist where available; legacy associations remain stored and remain available to other existing association-based workflows.

Country codes and full country names are normalized for place reuse. New locality records contain only the supplied name/country and neutral defaults. No region or coordinates are invented. Broad/composite recommendations remain research only. An unresolved first recommendation blocks that saint rather than substituting an additional place as representative.

## Integrity and later edits

Submitted selections include a hash of the research, canonical saint and place candidates. The complete selected batch is rechecked inside a serializable transaction, under the shared geography advisory lock and canonical saint row locks. A stale selection aborts the batch. Explicit confirmation authorizes the displayed corrections to existing website associations.

Each accepted saint gets an immutable `ExternalRecord` research snapshot, before/after associations, actor and timestamp, plus an audit event. Reapplying the same research version is blocked, so later manual changes survive. A new research version requires a fresh explicit review; no scheduled import applies this bundle.

Manual place saves preserve shortlist positions when the primary identity stays unchanged, and clear them when the primary changes. Visit-place acceptance clears the old shortlist if it changes the primary place. Saint merges prefer an existing target shortlist; place merges preserve surviving locality order. Research evidence remains in audit/external records.

## Release and verification

Migration: `20261019160000_saint_key_locality_order`. Adds nullable `SaintPlace.keyLocalityOrder`, a range check (1–3), and an index. Run migrations in the release/migrate phase, not image build. No new environment variables or dependency changes.

Checks: focused domain and visit-place tests, `npm run dev:check`, production build (`npm run codex:verify`), and guarded disposable PostgreSQL integration (`scripts/verify-key-localities.ts`, `KEY_LOCALITY_TEST_DATABASE_URL` restricted to localhost/127.0.0.1 and database `museum_integration_test`). Integration covers published-only matching, country reuse, source preservation, ranked ordering, legacy associations/routes/coordinates, stale forms, replay protection, uncovered saints, missing countries and conflicting canonical identities. No production or configured workspace database writes occur in these tests.

The production action still needs deployment and execution by an authenticated authorized editor. Current live coverage counts are deliberately computed at review time. A stale workspace snapshot cannot establish the current live published population.
