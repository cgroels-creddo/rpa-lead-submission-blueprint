diff --git a/apps/worker/src/worker.ts b/apps/worker/src/worker.ts
new file mode 100644
index 0000000000000000000000000000000000000000..df63da89ed19701532d6e7b5bf1b1060a51e6fa7
--- /dev/null
+++ b/apps/worker/src/worker.ts
@@ -0,0 +1,43 @@
+import 'dotenv/config';
+import pino from 'pino';
+import { Worker } from 'bullmq';
+import { mapLeadToPartnerPayload } from '../../../libs/mappers/src/partnerMapping.js';
+import { LeadJobPayload } from '../../../libs/domain/src/types.js';
+import { LEAD_SUBMISSION_QUEUE, workerOptions } from '../../../libs/queue/src/queue.js';
+import { submitToPortal } from './portalClient.js';
+import { reportLeadStatus } from './statusReporter.js';
+
+const log = pino({ name: 'lead-worker' });
+
+// Worker consumes queue jobs and handles retry behavior.
+const worker = new Worker<LeadJobPayload>(
+  LEAD_SUBMISSION_QUEUE,
+  async (job) => {
+    // Map the internal lead schema to partner portal form schema.
+    const payload = mapLeadToPartnerPayload(job.data.lead);
+
+    // Execute browser automation.
+    const result = await submitToPortal(job.data.leadId, payload);
+
+    // Push status updates back to API (or another status sink) if configured.
+    await reportLeadStatus(job.data.leadId, result);
+
+    // Throw only for temporary errors so BullMQ retries the job.
+    if (result.status === 'FAILED_TEMPORARY') {
+      throw new Error(result.message);
+    }
+
+    return result;
+  },
+  workerOptions
+);
+
+worker.on('completed', (job, result) => {
+  log.info({ jobId: job.id, result }, 'Lead job completed');
+});
+
+worker.on('failed', (job, err) => {
+  log.error({ jobId: job?.id, error: err.message }, 'Lead job failed and scheduled for retry');
+});
+
+log.info('Lead submission worker started');
