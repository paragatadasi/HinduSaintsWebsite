# Saint primary tradition compatibility

Existing primary traditions must survive introduction of the optional
affiliations-only setting. Admin display uses the saved `isPrimary` membership;
for legacy records without one, it retains the first-membership fallback used
before the option was introduced. The existing query order is retained.

`Saint.noPrimaryTradition` records an explicit editorial opt-out. Only choosing
the no-primary control and saving opts out; marking a primary clears the opt-out.
A missing primary form field alone does not clear the existing primary. Adding
affiliations preserves it. Removing a primary retains the earlier behavior of
selecting a remaining tradition, unless the editor explicitly opts out.

Saving memberships updates retained rows in place, preserving their IDs and
notes. Only memberships actually removed by the editor are deleted.

## Release and historical data

Apply `20260913180000_explicit_no_primary_tradition` during the normal migration
phase before serving the new application. It adds a false-by-default flag and
does not update or delete any existing membership or `isPrimary` value. No
primary-tradition backfill or import replay is needed for this code correction.

The earlier option release did not include a bulk data migration. It removed
the legacy display fallback and allowed saving a missing primary as no primary.
Those are different from proof that production primary flags were erased.

Production data has not been inspected from this feature workspace. Sri Vamsi
Das Babaji is the user-reported example to verify against a pre-release snapshot.
If a saved primary was actually cleared after that release, recover that exact
membership from a pre-release backup or audit evidence; do not infer a replacement
from tradition names or imports. Existing records cleared intentionally through
the earlier option are indistinguishable from legacy unflagged records and will
need the explicit opt-out saved again if they should remain affiliations-only.

Verification: `lib/saint-primary-tradition.test.ts` covers saved primaries, legacy
display, missing form fields, explicit clearing, subsequent saves, reselecting a
primary, and removing memberships.
