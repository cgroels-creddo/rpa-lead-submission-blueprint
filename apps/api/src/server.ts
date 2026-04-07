diff --git a/apps/api/src/server.ts b/apps/api/src/server.ts
new file mode 100644
index 0000000000000000000000000000000000000000..25acb9bbdccc67bf06e382728034738bc574b582
--- /dev/null
+++ b/apps/api/src/server.ts
@@ -0,0 +1,97 @@
+import 'dotenv/config';
+import express from 'express';
+import pino from 'pino';
+import { v4 as uuidv4 } from 'uuid';
+import { leadInputSchema } from './schema.js';
+import { validateLeadBusinessRules } from '../../../libs/validation/src/leadValidation.js';
+import { createLeadQueue } from '../../../libs/queue/src/queue.js';
+import { getLeadStatus, upsertLeadStatus } from './repository.js';
+
+// API process responsible for lead intake and status reads.
+const app = express();
+const log = pino({ name: 'lead-api' });
+
+// Single shared queue client for this process.
+const queue = createLeadQueue();
+
+// Parse JSON body for incoming lead payloads.
+app.use(express.json());
+
+// Intake endpoint: validates payload, applies business rules, and enqueues valid leads.
+app.post('/leads', async (req, res) => {
+  // 1) Structural validation (required fields, types, basic formats).
+  const parsed = leadInputSchema.safeParse(req.body);
+  if (!parsed.success) {
+    return res.status(400).json({
+      status: 'VALIDATION_FAILED',
+      errors: parsed.error.flatten()
+    });
+  }
+
+  const lead = parsed.data;
+
+  // Use external id for idempotency when caller provides one; otherwise create a UUID.
+  const leadId = lead.externalLeadId ?? uuidv4();
+
+  // 2) Business-rule validation (company age and amount vs revenue multiplier).
+  const validation = validateLeadBusinessRules(lead);
+
+  // Reject invalid business leads before queueing; persist reason for traceability.
+  if (!validation.valid) {
+    const now = new Date().toISOString();
+    upsertLeadStatus({
+      leadId,
+      status: 'VALIDATION_FAILED',
+      reasons: validation.reasons,
+      updatedAt: now
+    });
+
+    log.warn({ leadId, reasons: validation.reasons }, 'Lead business validation failed');
+    return res.status(422).json({
+      leadId,
+      status: 'VALIDATION_FAILED',
+      reasons: validation.reasons
+    });
+  }
+
+  // 3) Queue the lead for async processing.
+  // `jobId` makes BullMQ treat duplicates as same job id (idempotency guard).
+  await queue.add(
+    'submit-lead',
+    {
+      leadId,
+      receivedAt: new Date().toISOString(),
+      lead
+    },
+    {
+      jobId: leadId
+    }
+  );
+
+  // Store current process status for polling endpoint.
+  upsertLeadStatus({
+    leadId,
+    status: 'QUEUED',
+    updatedAt: new Date().toISOString()
+  });
+
+  return res.status(202).json({
+    leadId,
+    status: 'QUEUED'
+  });
+});
+
+// Polling endpoint used by upstream systems to check lead processing result.
+app.get('/leads/:leadId/status', (req, res) => {
+  const state = getLeadStatus(req.params.leadId);
+  if (!state) {
+    return res.status(404).json({ error: 'Lead not found' });
+  }
+
+  return res.status(200).json(state);
+});
+
+const port = Number(process.env.API_PORT ?? 3000);
+app.listen(port, () => {
+  log.info({ port }, 'Lead API listening');
+});
