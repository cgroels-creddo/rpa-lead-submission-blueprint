# 🚀 Feature 1 — Lead Intake API

### 🏷️ Versioning
- Version: `v1.1`
- Owner: Platform Engineering
- Last updated: `2026-04-07`

### 📚 Resources and information
- Runtime: Node.js + TypeScript + Express
- Files: `apps/api/src/server.ts`, `apps/api/src/schema.ts`, `apps/api/src/repository.ts`

### ❓ Why?
- We need synchronous acceptance and asynchronous processing.
- The source system receives immediate, deterministic response (`QUEUED` or `VALIDATION_FAILED`).

### 🧠 Assumptions
- Source system can call HTTP endpoint.
- Source system can optionally pass stable `externalLeadId`.

### ✅ Decisions
- Keep request validation in API boundary.
- Keep business-rule validation before queueing to avoid bad jobs.
- Use idempotent `jobId = leadId`.

### ⚙️ Config setup
- `API_PORT`
- `STATUS_WEBHOOK_URL` (used by worker status callback)

### 🗂️ Migration scripts
- Current state: no DB migrations required (in-memory status store).
- Future state: introduce SQL migrations for persistent status history table.

### ❔ Open questions
- Should we enforce authentication (API key/JWT) on intake endpoint in phase 1?
- Should API store original payload for audit/legal retention?

### 🕰️ As is
- Manual weekly submission process.
- No single source of truth for submission status.

### 🛠️ To be (with components and data fields)
- Component: `POST /leads`
- Data fields:
  - `name`, `email`, `phoneNumber`, `companyName`, `companyOrgNumber`, `registrationDate`, `amount`, `monthlyRevenue`, `useOfFunds`, optional `externalLeadId`
- Component: `GET /leads/:leadId/status`
- Status fields:
  - `leadId`, `status`, `updatedAt`, `reasons`, `partnerReference`, `screenshotPath`

### 🚨 Edge cases and unhappy flows
- Missing/invalid schema field => `400`
- Business rule violation => `422` + `VALIDATION_FAILED`
- Duplicate `externalLeadId` => queue dedup by `jobId`

### 🔄 Considered alternatives
- Synchronous full submission from API (rejected: high latency and fragile UX)
- Batch cron processing (rejected: not near-real-time)

### 🌱 Future work
- Move state from in-memory to PostgreSQL.
- Add authenticated endpoint and rate limiting.

### 🔐 Security impact
- Input validation reduces injection and malformed payload risk.
- Secrets are env-driven, not hardcoded.
