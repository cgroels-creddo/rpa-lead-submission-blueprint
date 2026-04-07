# Technical Blueprint — RPA Lead Submission via Partner Portal

## Feature 1 — Lead Intake API
### Versioning
- Version: `v1.1`
- Owner: Platform Engineering
- Last updated: `2026-04-07`

### Resources and information
- Runtime: Node.js + TypeScript + Express
- Files: `apps/api/src/server.ts`, `apps/api/src/schema.ts`, `apps/api/src/repository.ts`

### Why?
- We need synchronous acceptance and asynchronous processing.
- The source system receives immediate, deterministic response (`QUEUED` or `VALIDATION_FAILED`).

### Assumptions
- Source system can call HTTP endpoint.
- Source system can optionally pass stable `externalLeadId`.

### Decisions
- Keep request validation in API boundary.
- Keep business-rule validation before queueing to avoid bad jobs.
- Use idempotent `jobId = leadId`.

### Config setup
- `API_PORT`
- `STATUS_WEBHOOK_URL` (used by worker status callback)

### Migration scripts
- Current state: no DB migrations required (in-memory status store).
- Future state: introduce SQL migrations for persistent status history table.

### Open questions
- Should we enforce authentication (API key/JWT) on intake endpoint in phase 1?
- Should API store original payload for audit/legal retention?

### As is
- Manual weekly submission process.
- No single source of truth for submission status.

### To be (with components and data fields)
- Component: `POST /leads`
- Data fields:
  - `name`, `email`, `phoneNumber`, `companyName`, `companyOrgNumber`, `registrationDate`, `amount`, `monthlyRevenue`, `useOfFunds`, optional `externalLeadId`
- Component: `GET /leads/:leadId/status`
- Status fields:
  - `leadId`, `status`, `updatedAt`, `reasons`, `partnerReference`, `screenshotPath`

### Edge cases and unhappy flows
- Missing/invalid schema field => `400`
- Business rule violation => `422` + `VALIDATION_FAILED`
- Duplicate `externalLeadId` => queue dedup by `jobId`

### Considered alternatives
- Synchronous full submission from API (rejected: high latency and fragile UX)
- Batch cron processing (rejected: not near-real-time)

### Future work
- Move state from in-memory to PostgreSQL.
- Add authenticated endpoint and rate limiting.

### Security impact
- Input validation reduces injection and malformed payload risk.
- Secrets are env-driven, not hardcoded.

---

## Feature 2 — Business Validation
### Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### Resources and information
- File: `libs/validation/src/leadValidation.ts`
- Rule formulas:
  - `today - registrationDate > 305`
  - `amount <= 2.5 * monthlyRevenue`

### Why?
- Rejecting invalid leads early saves costs and avoids partner-side rejection.

### Assumptions
- `registrationDate` is delivered as ISO date string.
- `amount` and `monthlyRevenue` are positive values.

### Decisions
- Business validation remains pure function for easy unit testing.
- Validation returns all reasons, not only first error.

### Config setup
- Constants currently in code:
  - `MIN_COMPANY_AGE_DAYS = 305`
  - `MAX_MULTIPLIER = 2.5`

### Migration scripts
- Not applicable (pure logic).

### Open questions
- Should thresholds become runtime config from feature flags?

### As is
- Human validates manually.

### To be (with components and data fields)
- Input: `registrationDate`, `amount`, `monthlyRevenue`
- Output: `{ valid: boolean, reasons: string[] }`

### Edge cases and unhappy flows
- Invalid date string => reason `registrationDate is invalid`
- Borderline age `<= 305` => invalid
- Borderline amount `>` max => invalid

### Considered alternatives
- Validate in worker only (rejected: wastes queue+browser resources)

### Future work
- Add unit test matrix for boundary values.

### Security impact
- Prevents unsafe data from entering automation workflow.

---

## Feature 3 — Data Mapping
### Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### Resources and information
- File: `libs/mappers/src/partnerMapping.ts`
- Partner mappings:
  - yearly revenue band from `monthlyRevenue * 12`
  - when needed fixed to `Vandaag`
  - `useOfFunds` map + fallback `anders`

### Why?
- Partner portal uses controlled options that differ from source schema.

### Assumptions
- `name` always includes at least one token.

### Decisions
- First token => `firstName`, remaining tokens => `lastName`.
- Adviser defaults from env, fallback to required constants.

### Config setup
- `ADVISER_EMAIL`
- `ADVISER_KVK`

### Migration scripts
- Not applicable.

### Open questions
- Should mapping be tenant-specific when onboarding multiple advisers?

### As is
- Human maps fields manually.

### To be (with components and data fields)
- Component: `mapLeadToPartnerPayload(lead)`
- Output fields:
  - `adviserEmail`, `adviserKvk`, `amount`, `yearlyRevenueBand`, `whenNeededOption`, `useOfFundsOption`, `firstName`, `lastName`, `email`, `phone`, `companyName`, `kvk`

### Edge cases and unhappy flows
- Unknown `useOfFunds` => `anders`
- Single-word name => empty `lastName`

### Considered alternatives
- Mapping directly in Playwright script (rejected: hard to test, mixed concerns)

### Future work
- Add configurable mapping tables from JSON schema.

### Security impact
- Explicit whitelist mapping limits uncontrolled value propagation.

---

## Feature 4 — Queue and Idempotency
### Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### Resources and information
- File: `libs/queue/src/queue.ts`
- Stack: BullMQ + Redis

### Why?
- Decouple API from browser automation latency/failures.

### Assumptions
- Redis is available and reliable in production.

### Decisions
- Retry attempts default `3` minimum.
- Exponential backoff enabled.
- Idempotency via `jobId = leadId`.

### Config setup
- `REDIS_URL`
- `QUEUE_RETRIES`
- `WORKER_CONCURRENCY`

### Migration scripts
- Not applicable.

### Open questions
- Should we add explicit dead-letter queue per failure category?

### As is
- No queue; manual work only.

### To be (with components and data fields)
- Queue name: `lead-submission`
- Job payload fields:
  - `leadId`, `receivedAt`, `lead`

### Edge cases and unhappy flows
- Redis outage => enqueue fails, API should return error.
- Poison message => retries exhausted and surfaced for manual handling.

### Considered alternatives
- RabbitMQ (not chosen to keep implementation lean with BullMQ + Redis).

### Future work
- Add queue metrics exporter and lag alerts.

### Security impact
- Queue isolation reduces direct blast radius on API availability.

---

## Feature 5 — Worker + Playwright RPA
### Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### Resources and information
- Files:
  - `apps/worker/src/worker.ts`
  - `apps/worker/src/portalClient.ts`
  - `apps/worker/src/portalSelectors.ts`

### Why?
- Partner portal has no API, so browser automation is required.

### Assumptions
- Portal credentials are valid.
- Portal pages remain structurally similar between releases.

### Decisions
- Use headless Chromium via Playwright.
- Keep selectors isolated in dedicated config file.
- Take screenshot for every automation error.
- Classify failures into:
  - `FAILED_TEMPORARY`
  - `FAILED_PERMANENT`
  - `MANUAL_REVIEW_REQUIRED`

### Config setup
- `PARTNER_PORTAL_URL`
- `PARTNER_PORTAL_USERNAME`
- `PARTNER_PORTAL_PASSWORD`
- `ERROR_SCREENSHOT_DIR`

### Migration scripts
- Not applicable.

### Open questions
- Do we need CAPTCHA handling strategy with partner?
- Do we need MFA-safe machine account for automation?

### As is
- Human portal entry once per week.

### To be (with components and data fields)
- Worker pulls queue job, maps lead, logs in, fills partner sections, submits.
- Success status: `SUBMITTED` + optional `partnerReference`.

### Edge cases and unhappy flows
- Timeout/network errors => temporary failure + retry.
- Selector mismatch/UI drift => manual review required.
- Credential failure => permanent failure.

### Considered alternatives
- Puppeteer (not chosen; Playwright has stronger locator tooling and reliability).

### Future work
- Add optional video trace for severe failures.
- Add smoke test that validates selectors daily.

### Security impact
- Credentials only in env/secrets manager.
- Screenshots can contain PII; retention and encryption policy required.

---

## Feature 6 — Observability, Documentation, and Deployment
### Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### Resources and information
- Files:
  - `.env.example`
  - `Dockerfile`
  - `docker-compose.yml`
  - `README.md`
  - `docs/management-summary.docx`

### Why?
- Operations must be transparent and deployment must be repeatable.

### Assumptions
- Team deploys in containerized environment.

### Decisions
- Single image, multiple commands (`start:api`, `start:worker`).
- Documented runbook and architecture in repo.

### Config setup
- Environment variables listed in `.env.example`.

### Migration scripts
- Not required currently.

### Open questions
- Should we include IaC templates (Terraform/Helm) in next iteration?

### As is
- No standardized deployment package.

### To be (with components and data fields)
- Containerized API and worker with shared configuration.
- Operational docs for engineering and management audiences.

### Edge cases and unhappy flows
- npm registry restrictions in isolated environments can block dependency installation.

### Considered alternatives
- VM-only deployment scripts (rejected for portability reasons).

### Future work
- Add CI pipeline: lint, typecheck, integration test against mock portal.

### Security impact
- Clear secret boundaries and deployment consistency reduce accidental exposure.
