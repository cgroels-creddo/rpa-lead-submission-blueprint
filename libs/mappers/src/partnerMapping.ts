diff --git a/libs/mappers/src/partnerMapping.ts b/libs/mappers/src/partnerMapping.ts
new file mode 100644
index 0000000000000000000000000000000000000000..49a2a9d1beb464743045585e82506ac59549fb11
--- /dev/null
+++ b/libs/mappers/src/partnerMapping.ts
@@ -0,0 +1,102 @@
+import { LeadInput } from '../../domain/src/types.js';
+
+export interface PartnerLeadPayload {
+  adviserEmail: string;
+  adviserKvk: string;
+  amount: number;
+  yearlyRevenueBand: string;
+  whenNeededOption: 'Vandaag';
+  useOfFundsOption: string;
+  firstName: string;
+  lastName: string;
+  email: string;
+  phone: string;
+  companyName: string;
+  kvk: string;
+}
+
+// Allowed partner options for use-of-funds; unknown values fall back to "anders".
+const USE_OF_FUNDS_MAP: Record<string, string> = {
+  debiteuren: 'debiteuren',
+  voorraad: 'voorraad',
+  inventaris: 'inventaris',
+  machines: 'machines',
+  marketing: 'marketing',
+  verbouwing: 'verbouwing',
+  'geld achter de hand': 'geld achter de hand',
+  vastgoed: 'vastgoed',
+  herfinanciering: 'herfinanciering',
+  voorfinanciering: 'voorfinanciering',
+  voertuigen: 'voertuigen'
+};
+
+interface RevenueBand {
+  label: string;
+  minInclusive: number;
+  maxExclusive: number;
+}
+
+// Explicit band table to remove ambiguity around boundaries.
+// Policy:
+// - Lower bound inclusive
+// - Upper bound exclusive
+// - Last configured band (500-1000k) includes exactly 1,000,000 via dedicated check below
+const YEARLY_REVENUE_BANDS: RevenueBand[] = [
+  { label: '<25k', minInclusive: 0, maxExclusive: 25_000 },
+  { label: '25-50k', minInclusive: 25_000, maxExclusive: 50_000 },
+  { label: '50-150k', minInclusive: 50_000, maxExclusive: 150_000 },
+  { label: '150-500k', minInclusive: 150_000, maxExclusive: 500_000 },
+  { label: '500-1000k', minInclusive: 500_000, maxExclusive: 1_000_000 }
+];
+
+// Converts monthly revenue into the partner's yearly revenue bucket labels.
+export function getYearlyRevenueBand(monthlyRevenue: number): string {
+  if (!Number.isFinite(monthlyRevenue) || monthlyRevenue < 0) {
+    throw new Error(`monthlyRevenue must be a finite number >= 0. Received: ${monthlyRevenue}`);
+  }
+
+  const yearlyRevenue = monthlyRevenue * 12;
+
+  for (const band of YEARLY_REVENUE_BANDS) {
+    if (yearlyRevenue >= band.minInclusive && yearlyRevenue < band.maxExclusive) {
+      return band.label;
+    }
+  }
+
+  // Business requirement states: > 1000k. We treat exactly 1,000,000 as part of 500-1000k.
+  if (yearlyRevenue === 1_000_000) {
+    return '500-1000k';
+  }
+
+  return '>1000k';
+}
+
+// Splits full name into first token and remaining tail for partner fields.
+export function splitName(fullName: string): { firstName: string; lastName: string } {
+  const [firstName = '', ...rest] = fullName.trim().split(/\s+/);
+  return {
+    firstName,
+    lastName: rest.join(' ')
+  };
+}
+
+// Maps internal lead input into exact portal fields expected by automation.
+export function mapLeadToPartnerPayload(lead: LeadInput): PartnerLeadPayload {
+  const { firstName, lastName } = splitName(lead.name);
+  const useOfFundsNormalized = lead.useOfFunds.trim().toLowerCase();
+
+  return {
+    adviserEmail: process.env.ADVISER_EMAIL ?? 'cedric@kompar.nl',
+    adviserKvk: process.env.ADVISER_KVK ?? '82654778',
+    amount: lead.amount,
+    yearlyRevenueBand: getYearlyRevenueBand(lead.monthlyRevenue),
+    whenNeededOption: 'Vandaag',
+    useOfFundsOption: USE_OF_FUNDS_MAP[useOfFundsNormalized] ?? 'anders',
+    firstName,
+    lastName,
+    email: lead.email,
+    phone: lead.phoneNumber,
+    companyName: lead.companyName,
+    kvk: lead.companyOrgNumber
+  };
+}
