# Authentication architecture

Anime Clash uses provider-independent internal accounts. Community ownership is always attached to an application-owned `users.id`, never directly to an email address, Google subject, username, or hosted-platform user ID.

```text
User account
  -> auth identities
       -> email/password
       -> Google OIDC
       -> hosted ChatGPT/platform identity
  -> one profile
  -> community ownership
```

## Account and identity model

- `users`: stable internal `usr_<uuid>` account IDs, normalized email, verification state, and profile-completion state.
- `auth_identities`: provider identities linked to an internal user. Provider subjects are unique per provider.
- `profiles`: exactly one public profile per internal account, using the existing `profiles.user` ownership column.
- `auth_sessions`: server-side sessions. The browser receives the raw random session token in an HttpOnly cookie; D1 stores only its SHA-256 lookup hash.
- `email_verification_tokens` and `password_reset_tokens`: one-time, expiring, hashed tokens.
- `auth_oauth_states`: short-lived Google OAuth state and PKCE metadata.
- `auth_rate_limits`: bounded per-IP/per-identity abuse controls.

Migration `0005_auth_accounts.sql` converts existing hosted-platform ownership IDs to internal user IDs and creates a `chatgpt` auth identity for each legacy owner. Existing profiles, battles, votes, comments, posts, squads, progress, reports, notifications, watchlists, tournament votes, and structured evidence keep the same logical owner after migration.

## Authentication flows

Email registration requires email, password, username, and display name. The user, email identity, profile, and initial verification-token hash are created in one D1 batch. Email/password users may sign in before verification, but unverified profiles are not publicly discoverable and community contribution actions require a completed, verified account.

Google sign-in uses Authorization Code + PKCE, state, nonce, server-side code exchange, and server-side ID-token verification. Only `openid email profile` scopes are requested. Google access/refresh tokens are not persisted. A verified Google email can link to an existing account with the same normalized email. If that address only has an unverified password registration, its password identity, reset tokens, and sessions are revoked before the trusted provider is linked; this prevents pre-registration of somebody else's email from becoming a persistent account-takeover path. New Google accounts receive a temporary username and must complete the profile before contributing. Google avatar data initializes an empty avatar only and never overwrites a custom one.

Hosted ChatGPT/platform authentication remains supported for backward compatibility. Provider-specific headers are resolved centrally in `lib/auth.ts`; feature routes no longer read those headers directly. In non-development deployments those headers are ignored unless `AUTH_TRUST_HOSTED_IDENTITY_HEADERS=true` is explicitly set. Set that flag only when a trusted upstream strips client-supplied `oai-authenticated-user-*` headers and injects authenticated values. Direct Cloudflare/Vercel deployments should leave it unset. Existing platform IDs migrated by `0005` resolve to their previous content.

## Passwords and tokens

The current Cloudflare Worker implementation uses Web Crypto PBKDF2-HMAC-SHA-256 with a per-password random 128-bit salt and 310,000 iterations. Passwords are never trimmed and are limited to 8-128 characters. PBKDF2 was selected because it is natively available in the deployed Worker runtime without adding a native/WASM password-hashing dependency. Argon2id remains the preferred future upgrade if the runtime/dependency policy makes it practical.

Random session, verification, password-reset, OAuth-state, and PKCE values use cryptographically secure randomness. Reusable raw session/reset/verification secrets are not stored in D1. New verification and reset links carry their token in the URL fragment (`#token=...`) so the secret is not sent in the initial HTTP request or ordinary access logs; query-string links remain readable only for backward compatibility.

Normal sessions expire after 30 days and each account is capped at 12 active server-side sessions. Verification links expire after 60 minutes. Password-reset links expire after 45 minutes. Issuing a newer one-time link does not invalidate a previously delivered link; successfully consuming one invalidates the account's remaining links of that type. Resetting a password invalidates all existing sessions before creating a fresh session.

## Cookie and CSRF policy

The session cookie is HttpOnly, SameSite=Lax, Path=/, and Secure everywhere except explicit local development. Non-development session and Google OAuth cookies use the `__Host-` prefix so browsers enforce Secure, host-only scope, and Path=/. State-changing auth/community/evidence endpoints enforce same-origin Origin/Fetch-Metadata checks in addition to SameSite protection. Google sign-in validates state, PKCE and nonce, atomically consumes OAuth state, and validates the signed ID token against Google's JWKS. Return paths accept only safe relative URLs and reject absolute/cross-origin redirects.

## Contribution policy

Public browsing is allowed without authentication. Profile setup is allowed after authentication. Contribution actions require a completed account whose email/trust state has been verified. Google and trusted hosted-platform identities set that account-level verification state, so authorization does not depend on whichever linked provider happened to create the current session.

## Email delivery

The email abstraction in `lib/email.ts` currently supports Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured. Account creation and verification-token creation are committed atomically before delivery is attempted, and a Resend/network failure does not falsely roll back an account that was already created. If no provider is configured, registration still succeeds but real verification/reset delivery does not. Local development may opt in to development URL logging with `AUTH_DEV_EMAIL_LOG=true`; this must never be enabled in production.

## Required deployment variables

```text
APP_BASE_URL=https://your-anime-clash-host
ENVIRONMENT=production

# Only behind a trusted hosted-auth proxy that strips/injects oai-authenticated-user-*:
# AUTH_TRUST_HOSTED_IDENTITY_HEADERS=true

# Only for a non-Cloudflare trusted reverse proxy that overwrites client IP headers:
# AUTH_TRUST_PROXY_IP_HEADERS=true

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-anime-clash-host/api/auth/google/callback

EMAIL_FROM=Anime Clash <noreply@example.com>
RESEND_API_KEY=...

ANIME_CLASH_ADMIN_USER_ID=usr_...
```

Temporary backward compatibility also recognizes `ANIME_CLASH_ADMIN_ID` by matching the account's linked legacy ChatGPT identity, regardless of which linked provider created the current app session. Production should migrate moderation configuration to `ANIME_CLASH_ADMIN_USER_ID` after identifying the migrated internal account.

For local development only:

```text
ENVIRONMENT=development
APP_BASE_URL=http://localhost:3000
AUTH_DEV_EMAIL_LOG=true
```

`APP_BASE_URL` is mandatory outside explicit development and must be HTTPS there. `GOOGLE_REDIRECT_URI` must be exactly the same origin and use `/api/auth/google/callback`; invalid configuration disables the Google button rather than attempting a loose redirect.

Never expose Google secrets, Resend keys, raw sessions, passwords, password hashes, reset tokens, verification tokens, or OAuth access tokens to the client bundle or production logs.

## Validation

Run:

```bash
pnpm test:auth
pnpm test:domain
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

The authentication tests cover password hashing/verification, token hashing, return-path protection, request-size enforcement, same-origin mutation checks, legacy ownership migration, and database uniqueness. Google OAuth and real email delivery still require deployment-environment smoke tests because they depend on external credentials and provider callbacks.
