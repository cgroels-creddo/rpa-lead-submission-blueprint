# 🧭 Feature Overview — RPA Lead Submission via Partner Portal

## 🎯 Scope
This documentation splits the technical blueprint into separate feature files so each domain can be read, reviewed, and changed independently.

## 📚 Feature Index
1. [Feature 1 — Lead Intake API](./feature-1-lead-intake-api.md)
2. [Feature 2 — Business Validation](./feature-2-business-validation.md)
3. [Feature 3 — Data Mapping](./feature-3-data-mapping.md)
4. [Feature 4 — Queue and Idempotency](./feature-4-queue-and-idempotency.md)
5. [Feature 5 — Worker + Playwright RPA](./feature-5-worker-playwright-rpa.md)
6. [Feature 6 — Observability, Documentation, and Deployment](./feature-6-observability-documentation-deployment.md)

## 🧩 Shared Status Model
- `QUEUED`
- `VALIDATION_FAILED`
- `SUBMITTED`
- `FAILED_TEMPORARY`
- `FAILED_PERMANENT`
- `MANUAL_REVIEW_REQUIRED`

## 🔁 High-Level Flow
1. API accepts lead input.
2. Business rules validate acceptance.
3. Accepted leads are queued with idempotent identifiers.
4. Worker maps fields and submits through Playwright.
5. Status is updated and exposed for observability.

## 📝 Notes
- All feature documents use the same section template for consistency.
- Headings use emoji markers to improve readability for junior developers.
