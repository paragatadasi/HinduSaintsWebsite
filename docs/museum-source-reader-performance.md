# Museum source identity read performance

30 October 2026

Physical confirmation reconstructs the museum source snapshot inside the existing transaction and museum lock. Three projections previously resolved every source observation by scanning and reparsing the complete external-link array: editable proposals, the working view, and the original proposal identities returned by `readMuseumData`.

`createSnapshotIdentityResolver` indexes the supplied links once per projection. It passes the matching candidates to the existing `resolveSnapshotIdentity` decision function. Missing links, inactive or unbound saints, malformed keys, non-Saint tables, and multiple candidates retain their existing results. Two bases linking the same source record ID remain ambiguous even when both point to the same saint. The index is local to that invocation; later reads build another index from fresh data.

No database query, isolation level, lock, idempotency rule, physical-write path, or revision input changes. Display collection cards and the separate verified-item binding query remain intact. The earlier experiment removing display-card queries is excluded from this change because it did not consistently reduce elapsed time.

## Local comparison

The verifier alternates legacy-first and indexed-first reads in one read-only Repeatable Read transaction. Both readers issue 38 database operations. An isolated local clone contained one verified SPN item plus unreviewed SPN and verified other-museum counterexamples. Only the first item may enter the SPN physical source binding.

| Source reconstruction | Legacy scan | Indexed |
| --- | ---: | ---: |
| Sample 1, legacy first | 10.874 s | 2.378 s |
| Sample 2, indexed first | 12.139 s | 2.125 s |
| Editable identity processing | 2.787–3.399 s | 22–32 ms |
| Working view, synchronous | 3.033–3.315 s | 34–74 ms |
| Original identity processing | 3.200–3.333 s | 5–16 ms |

Editable database awaits remained approximately 201–222 ms; the rest of finalization was 17–51 ms. These timings identify repeated synchronous identity processing, rather than three independent multi-second database waits. Nested timing phases overlap their enclosing totals and must not be added twice.

Both samples passed deep equality of the complete 1,422-source snapshot. The verifier also compared all 1,422 physical rows, preserving source and current revisions, identities, current locations, housing and component state. The positive verified binding and both exclusion counterexamples passed. No production writes or shared development database migrations were performed; the disposable clone was removed.

These are local source-read measurements, not production confirmation-request or lock-wait measurements. They establish a measured improvement to the reconstruction portion without promising a particular production response time.

## Verification tools

- `scripts/verify-physical-source-reader.ts` accepts only a local database and explicitly sets its transaction read-only. Run with `tsx`, optional `--env-file`, `--samples 2`, and a private `--out` path. It compares the indexed reader with `indexSourceIdentities: false`, the original scan algorithm. Output contains counts, durations and a snapshot digest, not source records or query parameters. Timing callbacks are opt-in and do not log by default.
- `scripts/seed-physical-source-reader-fixture.ts` writes test fixtures only when the local database name matches `codex_physical_reader_<16 lowercase hexadecimal characters>` and `PHYSICAL_READER_FIXTURE_DATABASE` exactly matches that name. Use a disposable isolated clone, apply migrations only there, seed once, then run the verifier with `--expect-verified`. That assertion expects exactly one protected SPN source and one bound item. Remove only the deliberately created clone afterward. Never run this fixture seed against the shared development database or a production connection.

Identity and working-view tests cover ambiguity, inactive records, differing source tables, changed bindings on a fresh invocation, canonical-field preservation, confirmed placements and conflicting proposals. The full test suite also checks movement holds, component scopes and stale-revision behavior.

The workflow learning review found no change to museum evidence interpretation or saint identity policy. Existing skills remain applicable; this change makes the existing policy faster to evaluate.
