# Dirac redesign handoff

**Current implementation and verification:** see
[REVISION_NOTES.md](REVISION_NOTES.md). The final copy, hero image, responsive
layout and scroll-driven visuals supersede the early design descriptions and
screenshots below. [SCROLL_REVISION.md](SCROLL_REVISION.md) describes the
continuous animation approach.

Implemented on `redesign/website-visual-overhaul`, starting from fetched `main`
at `9697f8a`. The completed redesign is prepared for a pull request. Production
records and unrelated working-tree changes were preserved.

Merging into `main` triggers the existing GitHub Actions build and Azure
Container Apps deployment. The marketing site and booking links work without
sample storage. Uploads remain unavailable until the private sample container,
database migrations and runtime settings described below are configured.

## Open the result

- Website: http://localhost:3000/
- Five-stage story: http://localhost:3000/#how-it-works
- Asset explorer: http://localhost:3000/asset-pack
- Private inbox: http://localhost:3000/admin/samples
- Local synthetic admin sign-in fixture: http://localhost:3100/admin
- 390px mobile review: http://localhost:3100/mobile

The fixture on port 3100 is temporary, bound to loopback, and outside the
repository. It supplies a seeded synthetic Auth.js session for this local
database only. It is not a production login mechanism. The normal authorized
entry is `/signin?next=/admin/samples`; the email must already belong to a
`users.role = 'admin'` account, and Azure Communication Services must be
configured for magic-link delivery. No real email was sent during testing.

## September 24 visual revision

The homepage navigation now overlays the full-height hero. Backers are
**Entrepreneurs First** and **Transpose Platform**, as confirmed in the review.
The affiliation marquee scrolls inside the hero, with pause and reduced-motion
support. The problem copy now explains site-specific fine-tuning, reconstruction,
teleoperation collection, and gaps in trajectory/failure coverage.

A centered simulation-led statement introduces the new 3D walkthrough. See
[REVISION_NOTES.md](REVISION_NOTES.md) for the requested changes and review record.
The older screenshots below document the initial redesign and are superseded
by the `revision-*` captures in the local screenshots directory.

## Desktop and mobile

![Desktop homepage](../screenshots/desktop-home.jpg)

![Mobile homepage at 390px](../screenshots/mobile-home.png)

Warm off-white surfaces, charcoal text, orange accents, technical lines,
self-hosted licensed Geist Pixel/Inter/DM Mono, and the existing Syne logo
typography unify the site. The supplied horizon image is optimized to WebP.
Mobile gives the robot its own space below readable copy. All three asset
posters now use clean model views without baked controls or black padding.

The screenshots are local review artifacts in the ignored `screenshots/`
directory. The mobile capture is the actual site in a 390×844 browser frame,
cropped from the surrounding review harness; it is not a design mockup.

## Five-stage walkthrough

| Stage | Transformation | Artifact explained |
|---|---|---|
|01 Robot|Detailed arm, separated links and joint axes, reassembled model|URDF structure plus visual/collision meshes|
|02 Site|Physical-material warehouse, registered point cloud, reconstructed site, robot installation|Site geometry and physical properties|
|03 Train|Pick/transfer/place, shifted package, failed grasp, updated approach|Task trajectories and tagged failure cases|
|04 Evaluate|Explicit green Pass/red Fail checks, corresponding task inspection poses|Deployment-readiness report|
|05 Improve|Illustrative 95/97/98/99/100 percent success curve over one week|Continuous regression and performance history|

These are explicitly labeled illustrative procedural 3D scenes. The orange arm
and warehouse are visual explanations, not recordings, a reconstruction of a
specific robot/site, or a running physics simulation. The chart is an example,
not a measured benchmark. One consistent workcell supplies the geometry for
both the surface view and reconstruction point cloud. Existing R3F/three.js
packages provide the renderer, without remote HDRI/font dependencies.

The workflow is loaded near the viewport. Offscreen, paused, and reduced-motion
states use demand rendering. Manual phase changes explicitly request a frame;
replay resets the trajectory, and evaluation poses match their task checks.
The canvas has a phase-specific accessible description and a WebGL fallback.

## Motion choices

Design-time settings live in `lib/config/motion.ts`, without public design
switches.

| Area | Implemented default | Available alternative |
|---|---|---|
|Hero|Anchored full-screen image|Whole-image parallax|
|Story|Native scrolling with sticky desktop scene and direct stage links|Clickable tabs|
|Reconstruction|Warehouse → point cloud → simulation → robot placement|Manual phase selection|
|Cursor|Normal pointer with restrained orange grid illumination|Standard pointer or small halo|

The flat hero image has no independent robot layer. Independent robot motion
would require a separated robot asset and reconstructed background. The final
hero remains anchored to avoid cursor/scroll jitter.

The workflow has manual phase/scenario controls and pause. Reduced-motion code
disables automatic phases, moving arms and transitions; visibility observers
pause animation offscreen, and hidden tabs also pause. Touch/coarse-pointer
devices avoid pointer parallax/illumination. Desktop native scrolling, mobile
stage selection and pause controls were browser-tested. Reduced-motion branches
were code-reviewed; OS-level preference emulation was unavailable in the browser
tool and was not changed on the user's computer.

## Submission and private inbox demonstration

A synthetic `synthetic-trajectory.json` was selected through the public browser
form and uploaded to local Azurite. The browser confirmed success only after
the server verified and finalized the private blob. The saved request is:

- Company: **Local Test Robotics**
- Name: **Synthetic Browser Demo**
- Reference: `5d3ab6ad-a964-4d28-b0ff-00992dbbf80b`
- Category: Robot teleoperation data
- Status: Reviewing
- Attachment: one synthetic JSON trajectory, privately stored

The request and file remained visible after refreshing the admin page. Status
and private notes were updated through the browser and persisted after refresh.
A second disposable manual request was created and deleted using the actual
admin controls and confirmation. The retained demo has no customer data.

![Private inbox](../screenshots/admin-inbox.jpg)

![Private request detail](../screenshots/admin-detail.jpg)

The implementation reuses Postgres/Drizzle, Azure Blob Storage, and Auth.js
database sessions. Additive migrations create private request/attachment
records. Anonymous visitors can submit with a scoped upload capability, but
cannot list, read, edit or delete requests. Admin APIs check authorization on
the server. Private downloads use five-minute read grants.

Uploads use Azure block upload with actual progress and retry. Staging keys
are copied to verified, immutable committed keys before success. Interrupted
uploads remain tracked, and the same browser tab can resume after matching
files are reselected. Deletion retains cleanup records while write grants may
still be active, and failed cleanup supports retry.

## Initial redesign verification

The backend checks below were completed in the earlier implementation. The
September24 visual revision does not change the backend; current frontend
verification is recorded in REVISION_NOTES.md.


- 57/57 integration checks passed against actual isolated local Postgres and
 Azurite, including authorization, persisted CRUD, private reads, incomplete
 uploads, wrong sizes/formats/paths, immutable completion, failed-attempt rate
 limits, one/zero-file counts, cleanup retry and preservation of unrelated data.
- 6/6 focused validation tests passed.
- `npm run typecheck` passed.
- `npm run lint` passed with no errors and one pre-existing unused `_userId`
 warning in `lib/auth/entitlements.ts`.
- `npm run build` passed and generated 23 pages. Node emitted dependency-level
 `module.register()` deprecation warnings.
- Desktop 1280px, tablet 736px and mobile 390px/320px were inspected. No horizontal
 page overflow or broken media was found in reviewed layouts.
- All five stages and direct stage navigation were reviewed. Mobile menu anchor
 navigation, cross-route navigation, keyboard access and Escape focus return
 were checked.
- Asset models and controls load. Preview/Specifications/Files/Physics proof
 panels work; chair press/release visibly changes compression and recovery.
- Fresh desktop, mobile, asset and admin tabs reported no browser console errors.
- Existing booking destination was opened and verified without booking a meeting.
- Missing sample configuration was tested in the built site on port 3001; inputs
 and submission are disabled, the unavailable message is visible, and booking
 remains accessible.

![Honest unavailable submission state](../screenshots/uploads-unavailable.jpg)

The tests prove behavior with local Postgres and an Azure emulator. They do not
prove a production Azure account, production database migrations, cloud CORS,
or real email delivery is configured.

## Enabling production submissions

1. Review/apply additive migrations `0003_private_samples.sql` and
   `0004_sample_upload_expiry.sql` to the intended database. No production
   migration was run here.
2. Configure a separate private Azure container with `AZURE_SAMPLE_CONTAINER`,
   storage credentials and exact-origin Blob CORS. The public media container
   is explicitly rejected for samples. Configure ACS and provision authorized
   admin accounts. See [SAMPLE_REQUESTS.md](SAMPLE_REQUESTS.md) and
   [environment.example](environment.example) for exact variable names,
   supported formats, limits, cleanup and setup steps.

The final headline uses the user-provided **5×** deployment-time claim. The
walkthrough and improvement chart are labeled illustrative. Affiliations
describe team/advisor connections; they are separate from the backer row.

The existing asset manifest disables public bundle downloads. That behavior
is preserved and labeled request-only; viewers and evidence remain available.
Active contact details use `founders@diracrobotics.com`.

Retired marketing routes redirect to the homepage sections: `/real2sim`,
`/evals`, `/deployments`, `/about`, `/contact`; `/community-assets` and `/requests`
redirect to `/asset-pack`. Backend and necessary legal routes are retained.

## Current local runtime

The running preview uses temporary helpers in
`/private/tmp/dirac-redesign-runtime/`: `postgres.mjs`, `setup-local.cjs`,
`local-env.cjs`, `run-local.cjs`, and `browser-harness.cjs`. These supply isolated
synthetic configuration and do not replace the repository's `.env`.

While the local Postgres/Azurite processes are running, restart the dev preview
with:

```sh
node /private/tmp/dirac-redesign-runtime/run-local.cjs npm run dev -- --hostname 127.0.0.1
```

The temporary runtime may be removed by system cleanup. For a lasting local
environment, use the setup instructions and placeholders in the linked docs.
Never run integration tests or seed scripts against the repository's remote
database configuration.
