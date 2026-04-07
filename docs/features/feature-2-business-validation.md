# 🧪 Feature 2 — Business Validation

### 🏷️ Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### 📚 Resources and information
- File: `libs/validation/src/leadValidation.ts`
- Rule formulas:
  - `today - registrationDate > 305`
  - `amount <= 2.5 * monthlyRevenue`

### ❓ Why?
- Rejecting invalid leads early saves costs and avoids partner-side rejection.

### 🧠 Assumptions
- `registrationDate` is delivered as ISO date string.
- `amount` and `monthlyRevenue` are positive values.

### ✅ Decisions
- Business validation remains pure function for easy unit testing.
- Validation returns all reasons, not only first error.

### ⚙️ Config setup
- Constants currently in code:
  - `MIN_COMPANY_AGE_DAYS = 305`
  - `MAX_MULTIPLIER = 2.5`

### 🗂️ Migration scripts
- Not applicable (pure logic).

### ❔ Open questions
- Should thresholds become runtime config from feature flags?

### 🕰️ As is
- Human validates manually.

### 🛠️ To be (with components and data fields)
- Input: `registrationDate`, `amount`, `monthlyRevenue`
- Output: `{ valid: boolean, reasons: string[] }`

### 🚨 Edge cases and unhappy flows
- Invalid date string => reason `registrationDate is invalid`
- Borderline age `<= 305` => invalid
- Borderline amount `>` max => invalid

### 🔄 Considered alternatives
- Validate in worker only (rejected: wastes queue+browser resources)

### 🌱 Future work
- Add unit test matrix for boundary values.

### 🔐 Security impact
- Prevents unsafe data from entering automation workflow.
