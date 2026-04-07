diff --git a/apps/worker/src/portalClient.ts b/apps/worker/src/portalClient.ts
new file mode 100644
index 0000000000000000000000000000000000000000..5a529ca04320bd3c945f2d9f6bb210df5af8bf57
--- /dev/null
+++ b/apps/worker/src/portalClient.ts
@@ -0,0 +1,102 @@
+import { chromium } from 'playwright';
+import path from 'node:path';
+import fs from 'node:fs/promises';
+import pino from 'pino';
+import { LeadProcessingResult } from '../../../libs/domain/src/types.js';
+import { PartnerLeadPayload } from '../../../libs/mappers/src/partnerMapping.js';
+import { portalSelectors } from './portalSelectors.js';
+
+const log = pino({ name: 'portal-client' });
+
+// Maps low-level automation errors to operational statuses.
+function classifyError(error: unknown): LeadProcessingResult['status'] {
+  const message = error instanceof Error ? error.message.toLowerCase() : 'unknown';
+
+  // Usually transient infra/portal slowness.
+  if (message.includes('timeout') || message.includes('net::')) {
+    return 'FAILED_TEMPORARY';
+  }
+
+  // UI drift/selectors changed; human intervention likely needed.
+  if (message.includes('selector') || message.includes('strict mode violation')) {
+    return 'MANUAL_REVIEW_REQUIRED';
+  }
+
+  // Non-recoverable in current automated retry cycle.
+  return 'FAILED_PERMANENT';
+}
+
+// Performs the end-to-end browser automation for one lead.
+export async function submitToPortal(leadId: string, payload: PartnerLeadPayload): Promise<LeadProcessingResult> {
+  const browser = await chromium.launch({ headless: true });
+  const context = await browser.newContext();
+  const page = await context.newPage();
+
+  try {
+    const baseUrl = process.env.PARTNER_PORTAL_URL;
+    const username = process.env.PARTNER_PORTAL_USERNAME;
+    const password = process.env.PARTNER_PORTAL_PASSWORD;
+
+    // Fail fast if secret/config values are not present.
+    if (!baseUrl || !username || !password) {
+      throw new Error('Portal credentials/configuration missing');
+    }
+
+    // Login flow.
+    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
+    await page.fill(portalSelectors.login.username, username);
+    await page.fill(portalSelectors.login.password, password);
+    await page.click(portalSelectors.login.submit);
+
+    // Lead form flow.
+    await page.goto(`${baseUrl}/new-lead`, { waitUntil: 'networkidle' });
+
+    // Adviser section.
+    await page.fill(portalSelectors.form.adviserEmail, payload.adviserEmail);
+    await page.fill(portalSelectors.form.adviserKvk, payload.adviserKvk);
+
+    // Customer wishes section.
+    await page.fill(portalSelectors.form.amount, String(payload.amount));
+    await page.selectOption(portalSelectors.form.yearlyRevenue, { label: payload.yearlyRevenueBand });
+    await page.click(portalSelectors.form.whenNeededVandaag);
+    await page.selectOption(portalSelectors.form.useOfFunds, { label: payload.useOfFundsOption });
+
+    // Customer identity section.
+    await page.fill(portalSelectors.form.firstName, payload.firstName);
+    await page.fill(portalSelectors.form.lastName, payload.lastName);
+    await page.fill(portalSelectors.form.email, payload.email);
+    await page.fill(portalSelectors.form.phone, payload.phone);
+    await page.fill(portalSelectors.form.companyName, payload.companyName);
+    await page.fill(portalSelectors.form.kvk, payload.kvk);
+
+    // Submit and verify success marker.
+    await page.click(portalSelectors.form.submitButton);
+    await page.waitForSelector(portalSelectors.form.successToast, { timeout: 15_000 });
+
+    return {
+      status: 'SUBMITTED',
+      message: 'Lead submitted successfully',
+      partnerReference: `lead-${leadId}`
+    };
+  } catch (error) {
+    // Capture screenshot for support and incident triage.
+    const screenshotDir = process.env.ERROR_SCREENSHOT_DIR ?? 'artifacts/screenshots';
+    await fs.mkdir(screenshotDir, { recursive: true });
+    const screenshotPath = path.join(screenshotDir, `${leadId}.png`);
+    await page.screenshot({ path: screenshotPath, fullPage: true });
+
+    const status = classifyError(error);
+    const message = error instanceof Error ? error.message : 'Unknown automation error';
+    log.error({ leadId, status, message }, 'Lead submission failed');
+
+    return {
+      status,
+      message,
+      screenshotPath
+    };
+  } finally {
+    // Always release resources.
+    await context.close();
+    await browser.close();
+  }
+}
