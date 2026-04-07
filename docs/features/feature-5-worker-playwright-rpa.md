# 🤖 Feature 5 — Worker + Playwright RPA

### 🏷️ Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### 📚 Resources and information
- Files:
  - `apps/worker/src/worker.ts`
  - `apps/worker/src/portalClient.ts`
  - `apps/worker/src/portalSelectors.ts`

### ❓ Why?
- Partner portal has no API, so browser automation is required.

### 🧠 Assumptions
- Portal credentials are valid.
- Portal pages remain structurally similar between releases.

### ✅ Decisions
- Use headless Chromium via Playwright.
- Keep selectors isolated in dedicated config file.
- Take screenshot for every automation error.
- Classify failures into:
  - `FAILED_TEMPORARY`
  - `FAILED_PERMANENT`
  - `MANUAL_REVIEW_REQUIRED`

### ⚙️ Config setup
- `PARTNER_PORTAL_URL`
- `PARTNER_PORTAL_USERNAME`
- `PARTNER_PORTAL_PASSWORD`
- `ERROR_SCREENSHOT_DIR`

### 🗂️ Migration scripts
- Not applicable.

### ❔ Open questions
- Do we need CAPTCHA handling strategy with partner?
- Do we need MFA-safe machine account for automation?

### 🕰️ As is
- Human portal entry once per week.

### 🛠️ To be (with components and data fields)
- Worker pulls queue job, maps lead, logs in, fills partner sections, submits.
- Success status: `SUBMITTED` + optional `partnerReference`.

### 🚨 Edge cases and unhappy flows
- Timeout/network errors => temporary failure + retry.
- Selector mismatch/UI drift => manual review required.
- Credential failure => permanent failure.

### 🔄 Considered alternatives
- Puppeteer (not chosen; Playwright has stronger locator tooling and reliability).

### 🌱 Future work
- Add optional video trace for severe failures.
- Add smoke test that validates selectors daily.

### 🔐 Security impact
- Credentials only in env/secrets manager.
- Screenshots can contain PII; retention and encryption policy required.
