# RPA Lead Submission Blueprint

This repository provides a production-ready reference implementation for submitting leads to a partner portal **without an API** using server-side browser automation (Playwright), queue-based processing (BullMQ + Redis), and TypeScript services.

## What is in this repository

- **API service** to intake and validate leads.
- **Queue layer** for asynchronous processing, retries, and idempotency.
- **Worker service** that automates partner-portal submission via Playwright.
- **Shared libraries** for domain types, business validation, mapping, and queue setup.
- **Operational artifacts** for environment config and containerized deployment.
- **Documentation set** split by feature + centralized architecture reference.

## Project structure

```text
apps/
  api/
  worker/
libs/
  domain/
  validation/
  mappers/
  queue/
config/
docs/
  ARCHITECTURE/
  features/
scripts/
```

## Quick start

```bash
cp .env.example .env
npm install
npm run start:api
npm run start:worker
```

## Core flow (high level)

1. `POST /leads` accepts input.
2. API validates schema + business rules.
3. Valid leads are enqueued with idempotent job IDs.
4. Worker consumes jobs and submits them in the partner portal.
5. Status is updated (`SUBMITTED`/failure states) and exposed via status endpoint.

## API endpoints

### `POST /leads`
- Accepts lead payload.
- Returns immediate result:
  - `QUEUED` for accepted leads.
  - `VALIDATION_FAILED` for business-rule violations.

### `GET /leads/:leadId/status`
- Returns the latest processing status and metadata for a lead.

## Business rules

A lead is eligible only when both rules are true:

- Company age is greater than 305 days.
- Requested amount is less than or equal to 2.5 × monthly revenue.

If not eligible:
- Lead is not sent to partner.
- Status is set to `VALIDATION_FAILED`.
- Reasons are recorded.

## Status model

- `QUEUED`
- `VALIDATION_FAILED`
- `SUBMITTED`
- `FAILED_TEMPORARY`
- `FAILED_PERMANENT`
- `MANUAL_REVIEW_REQUIRED`

## Configuration

All runtime configuration is environment-driven. See:

- `.env.example`

Common variables include:

- API: `API_PORT`
- Queue: `REDIS_URL`, `QUEUE_RETRIES`, `WORKER_CONCURRENCY`
- Portal access: `PARTNER_PORTAL_URL`, `PARTNER_PORTAL_USERNAME`, `PARTNER_PORTAL_PASSWORD`
- Adviser mapping: `ADVISER_EMAIL`, `ADVISER_KVK`
- Diagnostics: `ERROR_SCREENSHOT_DIR`, `STATUS_WEBHOOK_URL`

## Deployment

- Container-ready via `Dockerfile`.
- Local multi-service run via `docker-compose.yml`.
- Single codebase with separate startup commands for API and worker.

## Documentation

### Main architecture reference
- `docs/ARCHITECTURE/architecture.md`

### Feature documentation (split by domain)
- `docs/features/feature-overview.md`
- `docs/features/feature-1-lead-intake-api.md`
- `docs/features/feature-2-business-validation.md`
- `docs/features/feature-3-data-mapping.md`
- `docs/features/feature-4-queue-and-idempotency.md`
- `docs/features/feature-5-worker-playwright-rpa.md`
- `docs/features/feature-6-observability-documentation-deployment.md`

### Other docs
- `docs/technical-blueprint.md` (index to split feature docs)
- `docs/management-summary.docx`

## Security notes

- Keep secrets in environment variables or a secure vault.
- Never commit credentials.
- Apply retention/encryption controls for error screenshots and logs that may include PII.
- Use least-privilege access for bot identities and runtime services.

## Current limitations

- Status repository is currently in-memory (non-persistent).
- Selector drift in partner portal UI may require maintenance.
- Automated test coverage is not yet fully implemented end-to-end.

## Suggested next steps

- Move status persistence to a durable datastore.
- Add CI checks for lint/typecheck/tests.
- Add integration tests against a mock portal.
- Add operational dashboards/alerts for queue lag and worker failures.
