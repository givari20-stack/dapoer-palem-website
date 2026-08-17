# Dapoer Palem website architecture

The application uses the Next.js App Router under `src/app`. Shared interface
building blocks live in `src/components`, while static brand assets belong in
`public`.

## Planned routes

Only `/` is implemented in Step 1. The following route segments are reserved
for later steps and should be added as focused features rather than empty public
pages:

- `/menu`
- `/promo`
- `/event`
- `/gallery`
- `/about`
- `/reservation`
- `/contact`
- `/admin`
- `/os`

Public-site UI should remain separate from future `/admin` and `/os` product
surfaces so their layouts, access rules, and dependencies can evolve safely.

## Brand assets

Official logos belong at:

- `public/logo/dapoer-palem-black.png`
- `public/logo/dapoer-palem-white.png`

Do not synthesize replacements when either official asset is unavailable.
