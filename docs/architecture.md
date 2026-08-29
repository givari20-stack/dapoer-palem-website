# Dapoer Palem website architecture

The application uses the Next.js App Router under `src/app`. Shared interface
building blocks live in `src/components`, while static brand assets belong in
`public`.

## Implemented public routes

- `/`
- `/menu`
- `/promo`
- `/event`
- `/gallery`
- `/about`
- `/reservation`
- `/contact`
- `/login`
- `/preview/[module]/[id]` (authenticated CMS preview)

## Implemented admin routes

- `/admin`
- `/admin/about`
- `/admin/activity`
- `/admin/events`
- `/admin/gallery`
- `/admin/history/[module]/[id]`
- `/admin/homepage`
- `/admin/media`
- `/admin/menu`
- `/admin/promos`
- `/admin/reservations`
- `/admin/settings`

Public-site UI remains separate from the protected `/admin` surface so their
layouts, access rules, and dependencies can evolve safely. A future `/os`
surface is not currently implemented.

## Brand assets

Official logos belong at:

- `public/logo/dapoer-palem-black.png`
- `public/logo/dapoer-palem-white.png`

Do not synthesize replacements when either official asset is unavailable.
