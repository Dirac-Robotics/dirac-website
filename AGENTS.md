# Dirac Robotics — website

Marketing site and community "asset request" app for Dirac Robotics
(measured-physics Isaac Sim assets). Next.js App Router on React 19, deployed as
a standalone container to Azure Container Apps.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (standalone output)
- `npm run start` — run the built server
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — eslint
- `npm run db:generate` — generate a Drizzle migration from schema changes
- `npm run db:migrate` — apply migrations (uses `.env` `DATABASE_URL`)
- `npm run db:seed` — reseed domain data (10 leaderboard items + Commons images)

Run `typecheck`, `lint`, and `build` before committing.

## Stack

- Next.js 16 (App Router, RSC, Turbopack) + React 19
- Tailwind CSS v4 (`@import "tailwindcss"` in `app/globals.css`)
- Drizzle ORM + Postgres (`postgres` driver)
- Auth.js (next-auth v5 beta), passwordless email sign-in
- Azure: Blob Storage (media), Communication Services (email), Container Apps (host)
- three.js / @react-three/fiber (hero + gallery 3D), Zod validation

## Structure

- `app/` — routes (RSC). Server actions in `app/actions/`, API routes in `app/api/`,
  SEO files: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`.
- `components/`
  - `layout/` — header, footer, nav, logo
  - `ui/` — shadcn-style primitives (button, dialog, input, ...)
  - `assets/` — leaderboard, 3D showcase, submit modal, gallery
  - `marketing/` — page header, prose, spec strip, CTA, node mesh
  - `admin/`, `auth/`, `contact/`
- `lib/`
  - `config/` — `env` (Zod-validated), `site` constants
  - `db/` — schema, client, migrations
  - `auth/` — `index.ts` (next-auth), `session`, `entitlements`
  - `storage/` — Azure Blob (SAS upload, public read), upload client + constants
  - `data/` — leaderboard + admin queries
  - `http/` — rate limiting, request context (client IP)
  - `email.ts`, `validation.ts`, `utils.ts`, `types.ts`
- `scripts/seed.ts` — DB seed. Path alias `@/*` → repo root.

## Conventions

- Double-quoted imports, `@/` absolute paths.
- Server-only modules import `"server-only"`; never import them from a client component.
- Read env from `@/lib/config/env` (throws on missing/invalid at startup).
- No em dashes in user-facing copy (brand rule).
- Large media lives in Azure Blob, not git (`/public/*.mp4` is gitignored).

## Environment

Required (see `lib/config/env.ts`): `DATABASE_URL`, `AUTH_SECRET`,
`ACS_CONNECTION_STRING`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`,
`AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, `AZURE_STORAGE_CONTAINER`, `SITE_URL`.

## Deploy

Merge to `main` → GitHub Actions builds the Docker image, pushes to ACR, and
deploys to the `dirac-website` Azure Container App. The repo uses squash-merge.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
