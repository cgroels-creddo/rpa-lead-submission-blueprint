# 🗺️ Feature 3 — Data Mapping

### 🏷️ Versioning
- Version: `v1.1`
- Last updated: `2026-04-07`

### 📚 Resources and information
- File: `libs/mappers/src/partnerMapping.ts`
- Partner mappings:
  - yearly revenue band from `monthlyRevenue * 12`
  - when needed fixed to `Vandaag`
  - `useOfFunds` map + fallback `anders`

### ❓ Why?
- Partner portal uses controlled options that differ from source schema.

### 🧠 Assumptions
- `name` always includes at least one token.

### ✅ Decisions
- First token => `firstName`, remaining tokens => `lastName`.
- Adviser defaults from env, fallback to required constants.

### ⚙️ Config setup
- `ADVISER_EMAIL`
- `ADVISER_KVK`

### 🗂️ Migration scripts
- Not applicable.

### ❔ Open questions
- Should mapping be tenant-specific when onboarding multiple advisers?

### 🕰️ As is
- Human maps fields manually.

### 🛠️ To be (with components and data fields)
- Component: `mapLeadToPartnerPayload(lead)`
- Output fields:
  - `adviserEmail`, `adviserKvk`, `amount`, `yearlyRevenueBand`, `whenNeededOption`, `useOfFundsOption`, `firstName`, `lastName`, `email`, `phone`, `companyName`, `kvk`

### 🚨 Edge cases and unhappy flows
- Unknown `useOfFunds` => `anders`
- Single-word name => empty `lastName`

### 🔄 Considered alternatives
- Mapping directly in Playwright script (rejected: hard to test, mixed concerns)

### 🌱 Future work
- Add configurable mapping tables from JSON schema.

### 🔐 Security impact
- Explicit whitelist mapping limits uncontrolled value propagation.
