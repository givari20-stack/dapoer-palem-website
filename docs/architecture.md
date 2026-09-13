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

## Implemented OS routes

- `/os`
- `/os/projects`
- `/os/tasks`
- `/os/campaigns`
- `/os/content`
- `/os/calendar`
- `/os/reports`
- `/os/analytics`
- `/os/team`
- `/os/knowledge`
- `/os/roadmap`
- `/os/assistant`

Public-site UI remains separate from both protected workspaces. `/admin` owns
CMS, reservation, media, settings, revision, and audit workflows. `/os` owns
internal project, task, campaign, content, reporting, knowledge, team, roadmap,
calendar, analytics, and decision-support workflows. Both protected surfaces
reuse Supabase Auth roles and server-enforced RLS.

The OS schema is introduced by append-only migration
`012_dapoer_palem_os.sql`. It uses UUID primary keys, permanent server-generated
public IDs for projects/tasks/subtasks, Media Library references, and the
existing audit log. Empty operational datasets remain empty; the application
does not seed illustrative projects, metrics, people, or processes.

## Brand assets

Official logos belong at:

- `public/logo/dapoer-palem-black.png`
- `public/logo/dapoer-palem-white.png`

Do not synthesize replacements when either official asset is unavailable.
