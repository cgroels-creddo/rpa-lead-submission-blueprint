# RPA Solution Summary

This document provides a practical, beginner-friendly summary of the RPA lead-submission solution in this repository. It explains what the system does, how the architecture works, which languages/libraries are used, how the code is organized, how to implement/deploy it, and what alternatives exist with trade-offs.

## 1) What this solution does

- Automates lead submission to a partner portal that has **no API**.
- Replaces manual weekly input with near real-time processing.
- Applies business rules before submission.
- Uses queue-driven background processing for reliability.
- Tracks every lead with explicit status transitions.

## 2) Architecture at a glance

### Core components

- **API service (`apps/api`)**
  - Accepts lead input (`POST /leads`).
  - Validates schema and business rules.
  - Enqueues valid leads for async processing.
  - Exposes status lookup (`GET /leads/:leadId/status`).

- **Queue layer (`libs/queue`)**
  - BullMQ + Redis for decoupled processing.
  - Retries and backoff on recoverable failures.
  - Idempotency via stable `jobId`.

- **Worker service (`apps/worker`)**
  - Pulls queued jobs.
  - Maps lead data to partner form fields.
  - Runs Playwright browser automation.
  - Updates statuses and captures evidence on failures.

- **Shared libraries (`libs/*`)**
  - Domain types and enums.
  - Validation logic.
  - Mapping logic.
  - Queue setup.

### Status model

- `QUEUED`
- `VALIDATION_FAILED`
- `SUBMITTED`
- `FAILED_TEMPORARY`
- `FAILED_PERMANENT`
- `MANUAL_REVIEW_REQUIRED`

## 3) Language, libraries, and packages

### Language/runtime

- **Node.js** runtime
- **TypeScript** (strict mode)

### Main libraries

- **Express**: API endpoints
- **Zod**: request schema validation
- **BullMQ**: queue and worker job model
- **Redis**: queue backend
- **Playwright**: browser automation
- **dotenv** (via env usage): environment configuration

### Why this stack

- Works well for asynchronous pipelines.
- Strong typing reduces runtime mistakes.
- Playwright provides robust locator capabilities.
- BullMQ + Redis is simple and production-proven for job queues.

## 4) How the code lives and works

### Repository layout

- `apps/api`: intake and status API
- `apps/worker`: queue consumer and automation bot
- `libs/domain`: shared types/statuses
- `libs/validation`: business-rule checks
- `libs/mappers`: source-to-partner mapping
- `libs/queue`: queue configuration and helpers
- `config`: selector/portal config
- `docs`: architecture and feature docs

### End-to-end flow

1. Lead arrives at `POST /leads`.
2. Schema validation runs (input shape and types).
3. Business validation runs (eligibility rules).
4. Invalid lead is marked `VALIDATION_FAILED`.
5. Valid lead is enqueued (`QUEUED`).
6. Worker consumes queue job and maps payload.
7. Playwright logs in and submits portal form.
8. Status is set to `SUBMITTED` or failure status.
9. Errors include classification + screenshot evidence where applicable.

## 5) How to implement and run

### Local setup

- Copy env file: `cp .env.example .env`
- Install dependencies: `npm install`
- Start API: `npm run start:api`
- Start worker: `npm run start:worker`

### Environment requirements

- Running Redis instance
- Valid partner portal credentials
- Network access to partner portal URL

### Deployment approach

- Use `Dockerfile` for container image build
- Use `docker-compose.yml` for local multi-service orchestration
- Deploy API and worker as separate processes/services

### Implementation checklist

- [ ] Fill environment variables in `.env`
- [ ] Confirm queue connectivity
- [ ] Validate selectors against partner portal UI
- [ ] Verify mapping values and option lists
- [ ] Enable log aggregation and alerting
- [ ] Define screenshot retention policy

## 6) Alternatives and caveats

### Alternative A: Synchronous API-only submission

- **What it is:** API directly runs browser automation in-request.
- **Pros:** Simpler architecture (no queue).
- **Caveats:**
  - High response latency.
  - More fragile request path.
  - Harder retry/recovery behavior.

### Alternative B: Batch/cron processing

- **What it is:** Process accumulated leads on schedule.
- **Pros:** Predictable run windows.
- **Caveats:**
  - Not near real-time.
  - Longer delay for lead submission.
  - Operational spikes during batch windows.

### Alternative C: Different queue broker (e.g., RabbitMQ)

- **What it is:** Replace BullMQ/Redis with another messaging system.
- **Pros:** Potentially richer routing semantics.
- **Caveats:**
  - Added operational complexity.
  - More platform overhead for this use case.

### Alternative D: Different browser automation library (e.g., Puppeteer)

- **What it is:** Replace Playwright with another browser tool.
- **Pros:** Familiarity for some teams.
- **Caveats:**
  - Locator tooling and cross-browser ergonomics may be weaker depending on needs.
  - Migration cost from existing implementation.

### Alternative E: Partner API integration (if available later)

- **What it is:** Replace UI automation with direct API calls.
- **Pros:** More stable and maintainable long-term.
- **Caveats:**
  - Not possible until partner exposes a suitable API.
  - Requires contract/security integration work.

## 7) Frequently Asked Questions (FAQ)

### Q1) Why use a queue instead of direct submission?
- Queueing decouples intake from portal automation, improves reliability, enables retries, and prevents user-facing delays.

### Q2) Why validate before queueing?
- It avoids wasting queue/worker resources on leads that are guaranteed to fail business requirements.

### Q3) How is duplicate submission prevented?
- Idempotency uses stable job identifiers (for example `jobId = leadId`) so duplicates can be deduplicated by the queue layer.

### Q4) What happens if the portal is down?
- Worker marks temporary technical failures, retries according to policy, and escalates to manual review when needed.

### Q5) What if portal UI fields change?
- Selector drift can break automation. Keep selectors centralized and maintain periodic selector smoke checks.

### Q6) Is this safe for sensitive data?
- It can be, if secrets are vault-managed, logs are controlled, and screenshot/PII retention and encryption policies are enforced.

### Q7) Is the current status store production-ready?
- Current blueprint includes in-memory status handling as a starting point; production should move to persistent storage.

### Q8) Can this support multiple partners?
- Yes, with additional mapping/config layers and potentially queue partitioning per partner.

## 8) Recommended next improvements

- Add unit/integration test suites and CI checks.
- Move status persistence to a durable database.
- Add dashboards/alerts for queue lag and worker error rates.
- Add dead-letter queue strategy and replay tooling.
- Add scheduled selector validation and synthetic monitoring.
