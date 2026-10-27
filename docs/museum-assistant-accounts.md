# Museum Assistant accounts

27 October 2026. Site Admins can create username/password accounts for museum intake teams without supplying an email address. These accounts have exactly one role, `museum_assistant`. Existing email accounts retain their additive role behavior.

## Access boundary

Museum Assistants receive `access_museum` and `view_museum_catalog`. They do not receive editorial catalogue access, website editing, imports, museum management, user management, review approval or publication. Museum read routes use the museum-specific capability; mutation routes continue to require their existing management permissions. Intake ownership checks allow assistants to create and edit their own drafts, upload their own photos and submit for review. They cannot read another person's intake entry or photo, correct submitted entries, or approve records.

The account-management action refuses to assign other roles to a username account. Password login and the shared admin-user reader independently reject credential accounts whose roles are no longer exactly Museum Assistant. Site Admins must use a separate email-based account for higher privileges.

## Authentication

The existing Google and email flows retain Auth.js database sessions. Auth.js's Credentials provider requires JWT sessions, so a dedicated password endpoint verifies credentials and creates the same opaque database session instead of changing all existing session strategies. Session callbacks expose the database user ID; access readers use that ID and re-read active state and roles. Email remains nullable; no placeholder inbox is generated.

`auth-session-policy.ts` shares the cookie name and options between Auth.js and password login: HttpOnly, SameSite=Lax, path `/`, Secure on the configured HTTPS origin. Production must use its canonical HTTPS `AUTH_URL` or `NEXTAUTH_URL`. Login and account-management endpoints enforce that public origin, accept bounded JSON bodies and never accept an arbitrary redirect. Session lifetime remains the existing 30 days. Standard Auth.js logout deletes the database session and clears its cookie.

Passwords use Node's scrypt with a random 16-byte salt, N=131072, r=8, p=1, a 64-byte result and a versioned stored format. Verification uses a constant-time comparison. Unknown usernames perform the same expensive derivation using dummy material. At most two password derivations run concurrently per application process; excess requests receive a busy response. Passwords are 12–128 characters and at most 256 UTF-8 bytes. Neither plaintext passwords nor hashes appear in API responses or audit records.

Login quotas are stored in PostgreSQL and serialized with an advisory transaction lock: eight attempts per normalized username in 15 minutes and 100 attempts globally per minute. Username keys are HMAC fingerprints using `AUTH_SECRET`. All validly shaped attempts consume quota, including successful logins. No forwarded IP header is trusted. The global quota protects the expensive hash path but can also delay legitimate logins during an attack; adjust policy only with explicit review. Old fingerprint rows are pruned after a day. A password reset clears that username's quota; it does not reset the global quota.

Site Admin password reset replaces the hash and revokes every target session atomically. Access changes and deactivation also revoke target sessions. Login checks active state, role and the current hash again under a user-row lock before issuing a session, preventing a concurrent reset from issuing a session with the old password. There is no email recovery or self-service password-reset flow; assistants ask a Site Admin.

## API contract

| Endpoint | Input | Success |
| --- | --- | --- |
| POST `/api/admin/local-accounts` | `{name?,username,password}` | `{userId,username}` |
| POST `/api/admin/local-accounts/:id/password` | `{password}` | `{userId,username}` |
| POST `/api/auth/local-sign-in` | `{username,password}` | `{ok:true,redirectTo:"/museumadmin/overview"}` plus session cookie |

The first two endpoints require active Site Admin access, checked again in the service transaction. Usernames normalize to lowercase ASCII, use 3–48 letters/numbers/dots/underscores/hyphens and start with a letter. Creation and reset do not return a password; the administrator supplies it in the form and shares it through an appropriate private channel.

Errors use `{error,fieldErrors?}`. Admin validation uses 400; duplicate usernames use 409. Login uses a generic 401 for incorrect credentials, inactive accounts and disallowed roles, and 429 for quota/busy conditions. All responses are private/no-store. Audit events record the actor, target and action, without credential values or session tokens.

## Migration and verification

Migration `20261027040000_museum_assistant_accounts` adds the role, nullable User email, private credential table and persistent throttle table. Existing users, sessions and OAuth accounts are retained. Apply it through the release migration phase. Do not restore the email NOT NULL constraint while username accounts exist.

Unit checks cover real scrypt hashing/verification, username normalization, role exclusivity and capability boundaries. `scripts/verify-museum-assistant-local.ts` exercises account creation, session creation/reset, inactive and disallowed-role rejection, and persistent quotas. It refuses any database except an explicitly named disposable localhost `museum_assistant_test*` database. It does not create production users or print passwords, hashes or tokens.

The combined UI release must additionally test real HTTP login/cookies, logout, existing email/database sessions, main-admin denial, museum read access, direct mutation denial, own-versus-other intake/photo access, approval denial, reset/deactivation invalidation, and public photo denial. The account backend alone does not establish that every UI/read route uses the new boundary correctly.

## Combined interface verification

The assistant-account UI branch passed `npm run dev:check`, `npm run codex:verify`, and 25 focused password, permission, display-name and intake-domain tests. The production check needed elevated access after Windows blocked standalone-file copying; the retry passed.

`scripts/verify-museum-assistant-http-local.ts` passed against the built application and disposable `museum_intake_test_20261027` database. It verifies Site Admin creation, case-insensitive username uniqueness, null email, secure cookie attributes on the local HTTP policy, museum page access, main-admin redirection, direct import/account-management denial, own intake/photo/submission, other-entry denial, approval denial, password-reset revocation, standard Auth.js logout, deactivated-user denial and foreign-origin denial. The synthetic email-based Site Admin database session continues to work. Live Google/email-provider delivery was not exercised.

The full suite now passes: 585 passed, zero failed and one existing skip out of 586. The mocked import test supplies its own nonconnecting database URL. Questionnaire expectations include the ninth optional Nar Hari Das case introduced with SPN v16. Navigation tests check the original researched bridge sequence with its own fixture, then separately verify that later catalogue additions remain visible under their correct parents with counts preserved. These changes do not alter museum data or production ordering.

No real assistant accounts were created. Site Admins create them in **Users & Access → Create a museum assistant account**, then share credentials privately. The username sign-in option is available on the existing sign-in screen. This branch has not been deployed; its migration must be included in the release phase.
