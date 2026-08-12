# Anonymous analytics and diagnostic privacy

The public site uses first-party, aggregate telemetry to understand page usage,
performance, navigation reliability, and technical failures. This supports the
privacy policy purposes of improving services and diagnosing and resolving
technical issues without identifying visitors.

## Stored data

- Allowlisted event names.
- Normalized public route paths without queries or fragments.
- UTC day and aggregate count.
- Coarse performance buckets.
- Error channel, value category, and source scope from fixed allowlists.
- Sanitized same-origin `/_next/` bundle paths and fingerprints derived only
  from those sanitized paths.
- Resource type and source scope. External resource URLs are not retained.

## Data not stored by application telemetry

- Error messages, rejection values, or raw stack traces.
- IP addresses, cookies, user agents, referrers, visitor IDs, or session IDs.
- Query strings, search terms, form values, or full external URLs.
- Browser history or cross-site activity.

## Controls and retention

- Confirmed first-party errors, opaque signals, resource failures, and
  suppression notices are separated in the admin dashboard.
- A browser tab reports at most three copies of the same diagnostic per public
  route and emits one suppression notice if the problem continues.
- A tab reports at most twenty distinct diagnostics per public route.
- Browser requests marked as cross-site or same-site are rejected.
- Diagnostic events are deleted after 30 days. Other aggregate telemetry is
  deleted after 366 days.
- No third-party error-reporting service receives these diagnostics.

## Feedback form abuse protection

The feedback form derives a secret-keyed fingerprint from the proxy-forwarded
IP address to enforce a limit of five valid submission attempts in a rolling
ten-minute window. The raw address and fingerprint are not written to the
application database or attached to feedback submissions. Fingerprints remain
only in the running server process and are removed after the rate-limit window,
with cleanup running once per minute. The in-memory limit resets if the server
restarts.

The site privacy-policy link is configured through `SiteConfig` and currently
defaults to <https://bhaktimarga.org/privacy-policy>.
