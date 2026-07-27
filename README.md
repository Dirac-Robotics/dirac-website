# Dirac Robotics

Community asset program, leaderboard, and lead capture for Dirac Robotics.
Physics-accurate Isaac Sim assets with measured mass, inertia, friction, and
joint dynamics, each with stated uncertainty.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack), React 19
- Postgres (Supabase or Neon) via Drizzle ORM, migrations checked in
- Supabase Storage for uploads (presigned, direct-to-storage, never through the app)
- Auth.js (NextAuth v5) passwordless email magic link, via Resend
- Resend for magic links and internal notifications
- Zod validation shared client and server
- Deployed on Vercel

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from the template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   See **Environment variables** below for what each key is.

3. Provision infrastructure:
   - A Postgres database (Supabase project or Neon). Put the connection string
     in `DATABASE_URL`. On Vercel + Supabase, use the pooled (transaction mode)
     string.
   - A Supabase Storage bucket named `uploads` (private). Put the project URL and
     service role key in `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
   - A Resend account with a verified sender domain. Put the API key in
     `RESEND_API_KEY` and the sender in `EMAIL_FROM`.

4. Run migrations, then seed:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Environment variables

Every key is documented in [`.env.example`](./.env.example). Summary:

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (pooled on Vercel) |
| `AUTH_SECRET` | Auth.js session/token secret (`npx auth secret`) |
| `AUTH_URL` | Optional. Auto-detected on Vercel |
| `RESEND_API_KEY` | Resend key for magic links and notifications |
| `EMAIL_FROM` | Verified sender, e.g. `Dirac Robotics <noreply@diracrobotics.com>` |
| `ADMIN_NOTIFY_EMAIL` | Inbox for new-request / new-lead notifications. Also the seeded admin account |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Mints presigned upload URLs |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (default `uploads`) |
| `SITE_URL` | Public origin, used in emails and metadata |

Never commit `.env`. `.env*` is gitignored.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration (dev only) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed 10 asset requests + votes, 4 catalog assets, sample leads |
| `npm run asset-pack:upload -- /path/to/bundles` | Upload the four release ZIPs to private Azure storage |

## Asset pack route

The evaluation-beta asset gallery is available at `/asset-pack`. It is kept out
of the primary navigation and sitemap, and is marked `noindex` while it is under
review. Browser previews are public, while simulation ZIPs are served from a
private Azure container through 15-minute signed links.

The checked-in public manifest currently runs in showcase-only mode with
downloads and server analytics disabled. The gallery, GLB previews, and physics
tracks therefore have no database or Azure runtime dependency. Set both
capabilities to `true` only after completing the storage and migration steps
below.

Asset pack download setup requires `AZURE_STORAGE_ACCOUNT` and
`AZURE_STORAGE_KEY`. `AZURE_ASSET_BUNDLE_CONTAINER` optionally changes the
private container name from its `asset-bundles` default.

Before enabling downloads in an environment:

1. Apply the checked-in database migration:

   ```bash
   npm run db:migrate
   ```

2. Put the four release ZIPs in one directory using these exact names:

   ```text
   purple-chair-0.1.0-beta.1.zip
   table-0.1.0-beta.1.zip
   hammer-v2-0.1.0-beta.1.zip
   all-assets-0.1.0-beta.1.zip
   ```

3. Upload them to the private container:

   ```bash
   npm run asset-pack:upload -- /absolute/path/to/bundles
   ```

The uploader processes files sequentially, keeps the container private, records
each SHA-256 digest as blob metadata, and verifies the uploaded byte count. The
download API resolves fixed bundle IDs server-side and never accepts an Azure
storage path from the client.

## Admin

`/admin` is gated by a server-side role check on every request. The seed script
gives the account at `ADMIN_NOTIFY_EMAIL` the `admin` role. To sign in, use the
magic-link flow at `/signin` with that email, then open `/admin`.

To promote another user, set their `users.role` to `admin` in the database.

## How the vote integrity works

- A vote requires a verified email. Sign-in is passwordless magic link; a valid
  session only exists after confirming the email, so a session implies a
  verified account. One account per email (unique), one vote per request
  (unique DB constraint on `(request_id, user_id)`).
- Anonymous visitors see the leaderboard and controls; clicking prompts sign-in.
- Submissions, votes, and leads are rate limited per account and per IP
  (Postgres-backed; see `lib/rate-limit.ts`).
- Vote timestamps are stored for after-the-fact auditing (`/admin` vote audit).
- `asset_requests.vote_score` is denormalized for sorting but recomputed from the
  `votes` table inside the same transaction on every vote. The votes table is the
  source of truth.
- Requests carry a `moderation_state` so spam can be hidden without deleting the
  record.

## Payments seam (Phase 2, not built)

Selling asset packs, entitlements, and gated Evals access are deferred but not
architected out. Future payment tables join on the stable UUIDs `users.id` and
`assets.id`, so they slot in with new tables only, no migration of core tables.
The seams are marked in:

- `lib/db/schema.ts` (PHASE 2 SEAM block describing the planned tables)
- `lib/entitlements/index.ts` (`canDownloadAsset`, `canAccessEvals`)
- The 3D-viewer seam in `components/assets/asset-gallery.tsx`

## Notes

- The brand logo file was not provided. `components/logo.tsx` renders the
  `dirac.` wordmark as a placeholder and documents the one-line swap to
  `public/logo.svg`.
