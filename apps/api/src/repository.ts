diff --git a/apps/api/src/repository.ts b/apps/api/src/repository.ts
new file mode 100644
index 0000000000000000000000000000000000000000..a67a9585038f009f30f47cf2792d2f25362c00f5
--- /dev/null
+++ b/apps/api/src/repository.ts
@@ -0,0 +1,35 @@
+import { LeadProcessingResult, LeadStatus } from '../../../libs/domain/src/types.js';
+
+export interface LeadRecord {
+  leadId: string;
+  status: LeadStatus;
+  reasons?: string[];
+  updatedAt: string;
+  partnerReference?: string;
+  screenshotPath?: string;
+}
+
+// NOTE: in-memory store is suitable for blueprint/demo only.
+// Production should replace this with PostgreSQL or another persistent datastore.
+const store = new Map<string, LeadRecord>();
+
+export function upsertLeadStatus(record: LeadRecord): void {
+  store.set(record.leadId, record);
+}
+
+export function getLeadStatus(leadId: string): LeadRecord | undefined {
+  return store.get(leadId);
+}
+
+// Adapter helper for writing worker outcomes into status store.
+export function applyProcessingResult(leadId: string, result: LeadProcessingResult): void {
+  const existing = store.get(leadId);
+  store.set(leadId, {
+    leadId,
+    status: result.status,
+    updatedAt: new Date().toISOString(),
+    reasons: [result.message],
+    partnerReference: result.partnerReference ?? existing?.partnerReference,
+    screenshotPath: result.screenshotPath ?? existing?.screenshotPath
+  });
+}
