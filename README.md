diff --git a/README.md b/README.md
new file mode 100644
index 0000000000000000000000000000000000000000..9b02a51ddeea55bea739b498559aba7187c89459
--- /dev/null
+++ b/README.md
@@ -0,0 +1,46 @@
+# RPA Lead Submission Blueprint
+
+This repository contains a production-ready reference implementation for submitting leads to a partner portal without an API, using server-side browser automation.
+
+## Quick start
+```bash
+cp .env.example .env
+npm install
+npm run start:api
+npm run start:worker
+```
+
+## Features overview
+
+### Feature: API intake
+- Endpoint: `POST /leads`
+- Validates schema and business rules
+- Queues valid leads with idempotent `jobId`
+
+### Feature: queue and retries
+- BullMQ + Redis
+- Exponential backoff
+- Configurable retries and worker concurrency
+
+### Feature: Playwright worker
+- Logs into partner portal
+- Fills adviser/customer/form fields
+- Submits and tracks status
+- Stores screenshots on errors
+
+### Feature: status model
+- `QUEUED`
+- `VALIDATION_FAILED`
+- `SUBMITTED`
+- `FAILED_TEMPORARY`
+- `FAILED_PERMANENT`
+- `MANUAL_REVIEW_REQUIRED`
+
+## Internal documentation
+- `docs/technical-blueprint.md` (feature-by-feature design with decision records)
+- `docs/management-summary.docx` (management/IT summary)
+
+## Security notes
+- Keep secrets in environment variables only.
+- Never commit credentials.
+- Review screenshot retention because screenshots may contain PII.
