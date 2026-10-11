# Private sample requests

As of October 10, 2026, the public `/#submit` section directs visitors to book
a call. The upload form and backend remain in the repository, but enabling
public uploads again requires restoring `SampleSubmissionForm` in
`SampleSubmissionSection` as well as completing the configuration below.

The private inbox is at `/admin/samples`.
This workflow reuses Postgres + Drizzle, Azure Blob Storage, and Auth.js database
sessions with the existing `users.role = 'admin'` authorization. It does not
create a new provider, send notifications, process samples, or provision services.
It never writes private samples to the existing public media container.

## Configuration

Existing application environment names are `DATABASE_URL`, `AUTH_SECRET`,
`AUTH_URL` (optional), `ACS_CONNECTION_STRING`, `EMAIL_FROM`,
`ADMIN_NOTIFY_EMAIL`, `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`,
`AZURE_STORAGE_CONTAINER`, `AZURE_ASSET_BUNDLE_CONTAINER`, and `SITE_URL`.
Keep all credentials server-side. Do not prefix them with `NEXT_PUBLIC_`.

Add `AZURE_SAMPLE_CONTAINER` with the name of a **separate private container**.
There is intentionally no default. It must differ from the public media and
asset-bundle containers. The application checks the container access policy
before issuing every upload/download grant and before storage operations. An
anonymous blob/container ACL, missing container, failed ACL lookup, or missing
configuration fails closed. The homepage remains usable and displays an honest
unavailable form when configuration is absent. Network/provider failures are
shown during submission; they never produce success.

Optional limits (integer byte counts):

| Variable | Default | Allowed maximum |
|---|---:|---:|
| `SAMPLE_MAX_FILES` | 20 | 100 |
| `SAMPLE_MAX_FILE_BYTES` | 524288000 (500 MiB) | 2147483648 (2 GiB) |
| `SAMPLE_MAX_TOTAL_BYTES` | 2147483648 (2 GiB) | 10737418240 (10 GiB) |

Azure container setup, performed by an authorized operator:

1. Create a dedicated sample container with anonymous access disabled. Do not
   reuse the public media container. Use an account with HTTPS required in
   production; disable account-level public blob access if that account does
   not need to serve the existing public media.
2. Configure Blob service CORS for the exact site origins (and only explicitly
   needed local origins). Allow `PUT`, `GET`, `HEAD`, `OPTIONS`; allow
   `content-type` and `x-ms-*` request headers; expose `etag` and `x-ms-*`.
   Suggested preflight max age: 300 seconds. CORS is not authorization: SAS
   permissions and private container ACLs enforce access.
3. Set `AZURE_SAMPLE_CONTAINER` and the existing storage account/key names in
   the host's secret environment settings. Set `SITE_URL` to the intended origin.
4. Review and apply `0003_private_samples.sql` and
   `0004_sample_upload_expiry.sql` with `npm run db:migrate` against the intended
   database after backup/review. These migrations only add sample tables,
   indexes, enums and one sample-only timestamp column. They do not alter or
   delete existing requests, users, assets, leads, or votes. Do not run seed or
   `db:push` against an existing production database.
5. Verify the public container ACL check, direct upload CORS, submission and
   admin access using synthetic data before enabling real uploads.

No production migration or resource creation is part of this implementation.

## Upload lifecycle and privacy

1. `POST /api/samples` validates contact information, relative paths, formats,
   file count, individual sizes, and total size. It records a request and all
   attachment metadata in one database transaction before issuing upload URLs.
   Contact details are never placed in blob names. Staging and committed keys
   use generated request/attachment UUIDs.
2. Creation returns a 48-hour random upload capability (only its SHA-256 hash is
   persisted) and blob-scoped, create/write-only SAS grants valid for 20 minutes.
   These grants cannot list or read files. There are no public list/read/edit/
   delete routes. Request IDs alone confer no access. The capability only allows
   resuming and finalizing that one immutable file manifest.
3. The browser uploads 8 MiB blocks directly to Azure, with actual progress,
   three attempts per block, and a final block-list commit. No video passes
   through a Next.js JSON route. Metadata bodies are capped at 100 KB.
4. `POST /api/samples/:id/resume` checks the bearer capability, then skips files
   already present with the expected length and MIME type. It refreshes URLs
   for incomplete files. Same-tab reload recovery stores only contact/manifest/
   capability in sessionStorage; the user must reselect matching local files.
   A different browser or expired session requires a new request. Uncommitted
   partial blocks may be retransmitted on retry; Azure expires uncommitted
   blocks after its normal retention interval.
5. `POST /api/samples/:id/complete` checks the capability and expected object
   sizes/types, copies each file using a checked source ETag to a different
   server-owned committed key, waits for successful copy, and checks final
   metadata before marking the request complete. Old upload URLs can modify
   staging objects only. They can never change a completed attachment.
6. Only durable completion returns success. Interrupted attempts remain in the
   inbox as `Upload incomplete`. Each attachment retains both storage keys, so
   no created object is invisible to authorized cleanup. Transaction-scoped
   advisory locks serialize finalize/resume/delete for a request.

Allowed types: MP4/MOV/WebM/M4V; ROS BAG, MCAP, DB3; H5/HDF5, NPY/NPZ;
CSV, JSON/JSONL, YAML/YML, TXT; URDF, STL, OBJ, PLY, GLB; ZIP; PNG/JPG/JPEG.
Executables, HTML and SVG are rejected. Extensions determine the allowlisted
MIME type; the server checks actual blob length and stored type at finalization.
This is **not** a malware scanner or a deep file-format validator. Downloads
use attachment disposition; only allowed video types may be previewed. Treat
submitted datasets as untrusted and inspect them in appropriate tools.

Abuse controls include an invisible honeypot, same-origin browser checks,
strict body/manifest limits, atomic Postgres-backed creation limits (5 per IP
per hour, 3 per normalized email per hour, 200 total per day), and bounded
resume/finalize attempts (30 per request, per operation, per hour; independently committed even
when upload verification or storage fails). Capability validation happens before
accounting so an unrelated visitor cannot consume another request's allowance.
The ingress must supply
trusted `x-forwarded-for`. SAS cannot enforce a byte quota while uploading, so
oversized blobs fail final verification and remain associated with their
incomplete request for cleanup; monitor storage usage and cost at the account.

## Admin access and operations

Use the existing `/signin?next=/admin/samples` email magic-link flow. ACS must
be configured for real email delivery. Only a pre-authorized account with
`users.role = 'admin'` may enter. Existing non-admin accounts are not elevated.
An operator can grant the intended verified user this role in Postgres after
independently confirming the address. There is no new public registration or
role-management route.

Every inbox/detail page calls `requireAdmin` on the server. Every admin API
operation independently checks the current session's role. Anonymous/non-admin
API requests receive 403. Browser cross-origin mutations are rejected.
`/api/admin/samples` supplies list/create, `/api/admin/samples/:id` supplies
read/update/delete, and `/api/admin/samples/:id/attachments/:attachmentId`
issues a scoped read-only URL after checking both request and attachment.
Attachment URLs expire after 5 minutes. Do not share them.

The inbox supports New/Reviewing/Contacted/Closed, status filtering, oldest/
newest sorting, and incomplete-upload filtering. Detail screens support contact
edits, description, internal notes, private video previews/downloads, and
confirmed deletion. Manual requests may have no attachments. The list shows
at most 200 matching records to keep the small inbox bounded.

## Cleanup and failure recovery

Completed requests retain their tracked staging keys until cleanup. After the
last issued SAS expires, open the request and use **Clean up temporary uploads**
to remove staging copies without touching completed samples. An operations
schedule should review incomplete uploads and completed staging copies at a
cadence appropriate to volume. No automatic deletion of customer samples runs.

Deletion only targets the attachment keys stored on that request and requires
their generated request prefix. It attempts both staging and committed object
removal before deleting database records. If any storage deletion fails, the
request and remaining metadata are retained with **Cleanup needed** and a
**Retry deletion** action. Upload capabilities are immediately disabled.

Azure write SAS grants cannot be individually revoked. If a grant is still
valid, deletion removes the current objects but retains a cleanup record until
21 minutes after the most recent grant. The UI states the retry time. Retry
after that deadline removes any recreated staging objects and then deletes the
database request. This prevents a client recreating an untracked orphan after
deletion. Manual requests without files delete immediately. A grant's expiry
must never be shortened in production just to bypass this safeguard.

## Local verification

Use only an isolated local Postgres database and Azurite account/container.
Never point a test at `.env`'s remote database or real customer files. Start the
dev server with explicit test environment overrides. For Azurite only, set
`AZURE_SAMPLE_BLOB_ENDPOINT=http://127.0.0.1:10000/<local-account>` alongside its
local account/key and a private sample container. This endpoint override is
rejected when `NODE_ENV=production` and for non-loopback hostnames. Standard
Azure HTTPS endpoints are used otherwise. Configure Azurite CORS as above.

Validation tests: `npx tsx --test tests/submissions-validation.test.ts`.
Type/lint checks: `npm run typecheck` and `npm run lint`.

Run `node tests/submissions-integration.mjs` with the explicit local database,
site origin, storage account/key, sample-container name, and local blob endpoint
environment described above. It never reads `.env` and refuses non-loopback
services or database names without `test`/`local`. It temporarily creates one
empty public container solely to verify rejection, then removes it. That probe
executes the same storage module in an isolated Node bundle; it does not change
the running preview's private container or environment. Existing unrelated
records are checked alongside full-field synthetic sentinel records, and
synthetic requests/users/sentinels are removed after the run.

Integration checks should create synthetic admin and non-admin users/sessions
in the isolated database, exercise create/upload/finalize, confirm refresh
persistence, modify notes/status, verify unauthenticated and wrong-capability
denials, and confirm anonymous blob reads fail. Test unsupported/oversized
manifests, finalization before uploading, and wrong-size blob finalization.
Test full deletion, simulated storage failures, and retry. For the upload-SAS
expiry recovery branch, only an isolated synthetic record may have its stored
deadline advanced after the tests stop using its issued URLs. Validate missing
configuration and publicly readable container failure states. Never run these
tests using production auth cookies or customer records.

### Recorded backend verification: September 22, 2026

The final local rerun passed **6 validation tests** and **57 integration
checks** against isolated Postgres and Azurite. The integration suite includes
30 actual failed finalizations followed by a rejected 31st attempt, proves the
failed attempts remain counted, and verifies invalid capabilities cannot consume
another request's allowance. It also checks private storage admission, durable
completion, scoped attachment access, admin CRUD, deletion retry, same-origin
enforcement, inbox attachment counts (including requests without files), and
full-field preservation of unrelated records.

Missing `AZURE_SAMPLE_CONTAINER` was tested in the isolated storage probe and
returned an unavailable error without issuing any storage grant. No remote
environment file or production/customer data was used. The configured preview
container was not made public or otherwise changed by the denial probes.

These backend checks use locally seeded synthetic Auth.js sessions. They do
not verify real ACS magic-link delivery, production Azure configuration, or
production migrations. Those remain operator setup checks. Browser upload
progress, responsive layout and video codec support are separate UI checks.

Operational limits remain: uploads require correctly configured Azure CORS;
file-format checks are based on an allowlist and metadata rather than malware
scanning; direct SAS writes have no upload-time byte quota; staging cleanup
requires an operator; and deleting an upload with outstanding write URLs can
require a retry after the documented expiry deadline.
