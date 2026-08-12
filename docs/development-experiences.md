# Development experiences

Work-in-progress pages and features can ship in the production codebase without
becoming public. Visibility is controlled in **Admin → Development previews**.

## Roles and states

Only Site Admins, Editors, and Testers can view an `admin_preview` experience.
Only Site Admins and Editors can change its state.

- `off`: hidden from everyone, including authorized preview users;
- `admin_preview`: visible only to Site Admins, Editors, and Testers;
- `public`: available to anonymous visitors wherever the canonical public
  surface uses the development-experience guard.

Tester is deliberately view-only. It does not grant content editing,
publishing, source-data, Museum, analytics, or user-management capabilities.

## Adding a page or feature

1. Register a stable key and review details in
   `lib/development-experience-registry.ts`. New keys default to `off` even
   after their code is deployed.
2. For a page, call `requireDevelopmentExperience(key)` before loading or
   rendering unpublished data. Unauthorized and disabled requests receive a
   true 404.
3. For a section on an existing public page, call
   `canViewDevelopmentExperience(key)` and render the section only when it
   returns true.
4. For an API or server action that supports the experience, call
   `requireDevelopmentExperience(key)` before reading or changing data.
5. Give dedicated reviewer pages a `/preview/*` URL and list that URL in the
   registry. The preview layout adds its own role gate and noindex metadata.
6. Keep preview-only records out of public queries, public search, navigation,
   `sitemap.xml`, feeds, structured data, and social-image endpoints. UI hiding
   is never a substitute for a server-side query or route guard.

## Caching and indexing

The request middleware makes authenticated responses and all `/admin`,
`/museumadmin`, `/preview`, and `/api/admin` responses private and `no-store`.
It also sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet,
noimageindex`. Admin and preview layouts emit matching robots metadata, and
`robots.txt` disallows those route families.

Anonymous public documents retain the existing five-minute shared cache and
preserve Next.js response-variation headers. The production CDN must bypass
its shared cache whenever an Auth.js session cookie is present. Do not rely on
`Vary: Cookie` for this boundary because Next.js can replace that header while
rendering React Server Components. Authenticated origin responses are also
marked private and `no-store` as a second layer of protection.

Development-only media should be served through authenticated admin routes or
private object storage. Do not place confidential draft assets at permanent
public `/media/*` or public object-storage URLs; noindex does not make a known
asset URL private.
