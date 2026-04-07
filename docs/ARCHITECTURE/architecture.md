# RPA Solution Architecture

This document is the main technical architecture reference for the RPA solution in this repository and is intended to guide implementation, operations, and lifecycle governance across environments.

## 🧭 Overview

The automation supports **Sending Leads to Bridgefund** by replacing manual lead-submission work with a controlled, observable, and queue-driven RPA flow.

- **Business context:** Partner submission is currently manual, periodic, and error-prone.
- **Objective:** Provide near real-time automated submission with traceable status and deterministic error handling.
- **In scope:** API intake, validation, queue processing, bot execution, status tracking, logging, and deployment patterns.
- **Out of scope:** Human UI frontend, partner-side platform changes, and non-approved process variants.

> To be completed during implementation/design review

## 🧱 Solution Architecture

The solution uses a layered architecture to isolate concerns and improve maintainability.

| Component | Responsibility | Notes |
|---|---|---|
| Intake/API Layer | Accept payloads, validate schema and business rules, enqueue jobs | Stateless service |
| Orchestration/Queue Layer | Buffer work, retries, idempotency, job lifecycle | Example: `[Queue Name]` |
| Bot/Worker Layer | Execute browser automation and submit transactions | Uses `[RPA Tool]` |
| Control/Status Layer | Persist and expose processing states | Supports operational monitoring |
| Observability Layer | Logs, metrics, alerts, screenshots/traces | Supports troubleshooting |

- **Bot type:** Unattended background bot(s).
- **Control model:** Centralized queue + status model.
- **Responsibility split:** Validation before queueing, automation in worker, state handling in shared repository/service.

> To be completed during implementation/design review

## 🔄 Process Flow

1. Trigger occurs (API request, scheduled import, or event from `[System Name]`).
2. Intake validates payload format and required fields.
3. Business-rule validation determines if transaction is eligible.
4. If invalid, mark as business rejection and stop.
5. If valid, enqueue idempotent job.
6. Worker consumes job and performs portal automation.
7. On success, mark as submitted and store reference.
8. On technical failure, retry according to policy.
9. On exhausted retries or non-recoverable error, route to manual review/failure queue.
10. Publish status updates to consumers (API/status endpoint/webhook).

Decision points:
- **Business exception:** Rule violation, missing required business data.
- **Technical exception:** Timeout, selector mismatch, login/session failure.

> To be completed during implementation/design review

## 🔌 System Integrations

| Integrated System | Integration Method | Purpose | Owner |
|---|---|---|---|
| `[Source System]` | HTTPS/API | Submit input records | `[Team/Owner]` |
| `[Partner Portal]` | Browser automation (`[RPA Tool]`) | Final transaction submission | `[External/Internal Owner]` |
| `[Queue Backend]` | Queue client protocol | Async work distribution | `[Platform Team]` |
| `[Credential Vault]` | Secret retrieval API | Runtime secret resolution | `[Security Team]` |
| `[Monitoring Platform]` | Log/metric exporter | Alerting and operational visibility | `[Ops Team]` |

- Add additional dependencies such as file shares, mailboxes, and databases as required.

> To be completed during implementation/design review

## 🗂️ Data Handling

**Input data (example):**
- `name`, `email`, `phoneNumber`, `companyName`, `companyOrgNumber`, `registrationDate`, `amount`, `monthlyRevenue`, `useOfFunds`, optional `externalLeadId`.

**Output data (example):**
- `status`, `reasons`, `partnerReference`, `timestamp`, `errorArtifacts`.

**Transformations:**
- Field normalization and controlled-option mapping.
- Revenue band derivation from monthly revenue.
- Name splitting and default fallback handling.

**Validation rules:**
- Age threshold and amount-to-revenue threshold.
- Schema and required-field checks.

**Storage locations and formats:**
- Queue payloads (JSON), status records (JSON/DB table), logs (structured JSON), artifacts (PNG/trace files).

**Sensitive data handling:**
- Minimize PII persistence.
- Apply retention and masking policies.
- Encrypt data at rest and in transit.

> To be completed during implementation/design review

## 🔐 Security & Access Control

- Use dedicated bot identities (least privilege).
- Retrieve secrets from `[Credential Vault]`; no hardcoded credentials.
- Scope permissions by environment and role.
- Enforce audit trails for submissions, retries, overrides, and manual interventions.
- Protect PII in logs and screenshots via masking/redaction policy.
- Capture compliance requirements: `[GDPR/ISO/SOC2/etc.]`.

> To be completed during implementation/design review

## ⚙️ Infrastructure & Environments

| Environment | Purpose | Runtime | Data Policy | Access |
|---|---|---|---|---|
| Development | Local engineering and debugging | Container/VM | Synthetic/sanitized | Dev team |
| Test/UAT | Business validation and integration tests | Container/VM | Masked representative data | QA + business testers |
| Production | Live operations | Hardened runtime | Production controls | Ops + approved support |

- Define queue names, assets, and runtime machine pools per environment.
- Document network allowlists, outbound rules, DNS/proxy requirements, and uptime expectations.

> To be completed during implementation/design review

## 📦 Deployment & Release Strategy

- Package as container image(s) with version tags.
- Promote artifacts across environments using CI/CD gates.
- Use semantic versioning for code and release notes for operational changes.
- Maintain rollback plan (previous stable image + config rollback).
- Validate post-deploy with smoke checks and queue health verification.

> To be completed during implementation/design review

## 🚨 Error Handling & Logging

- Categorize exceptions into **business** vs **technical**.
- Retry only transient technical failures.
- Route permanent failures to manual review queue/process.
- Use structured logging with correlation IDs (`leadId`, `jobId`, `traceId`).
- Capture artifacts (screenshots/traces) for failed automations.
- Integrate alerts for error-rate spikes, queue lag, and worker downtime.

> To be completed during implementation/design review

## 📊 Performance & Scalability

- Define expected throughput: `[X items/hour]`.
- Define max acceptable latency: `[Y minutes per transaction]`.
- Scale horizontally by increasing worker replicas and queue concurrency.
- Prevent overload with rate limits, backpressure, and queue partitioning.
- Track bottlenecks: portal response times, selector stability, and login/session churn.

> To be completed during implementation/design review

## 🛠️ Maintenance & Support

- Assign ownership:
  - Product owner: `[Name/Team]`
  - Technical owner: `[Name/Team]`
  - Operational support: `[L1/L2/L3 Model]`
- Define runbooks for restart, replay, and manual fallback.
- Schedule periodic selector review and credential rotation.
- Maintain known issues and support SLAs.

> To be completed during implementation/design review

## 🧪 Testing Strategy

- **Unit tests:** validation rules, mappings, status transitions.
- **Integration tests:** queue + worker + mock portal flow.
- **UAT:** business-approved scenarios and exception handling.
- **Regression tests:** repeat core happy path and major failure paths on each release.
- **Test data:** synthetic and masked data sets; no unmanaged production PII.

> To be completed during implementation/design review

## 📚 Assumptions & Constraints

- Required systems remain available and reachable.
- Partner portal structure remains sufficiently stable for automation.
- Queue backend and secret store are managed by platform teams.
- Constraints may include captcha/MFA, strict network boundaries, and third-party rate limits.

> To be completed during implementation/design review

## 🗺️ Future Enhancements

- Move from UI automation to direct API integration if partner API becomes available.
- Add dynamic selector health checks and self-healing locator strategies.
- Introduce dead-letter workflows and advanced replay tooling.
- Expand observability dashboards and SLO-driven alerting.
- Add multi-tenant configuration packs for additional partners.

> To be completed during implementation/design review

## 📎 Appendices

Use this section to attach or link:
- Architecture diagrams and sequence diagrams.
- Configuration matrix (env vars, queue configs, feature flags).
- Glossary of business and technical terms.
- Links to supporting docs (`README`, runbooks, operations guides).

> To be completed during implementation/design review
