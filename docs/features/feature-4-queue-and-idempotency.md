diff --git a/docs/features/feature-4-queue-and-idempotency.md b/docs/features/feature-4-queue-and-idempotency.md
new file mode 100644
index 0000000000000000000000000000000000000000..a6416b13e6720f10db5289ec34c7dff7df8769e1
--- /dev/null
+++ b/docs/features/feature-4-queue-and-idempotency.md
@@ -0,0 +1,52 @@
+# 📬 Feature 4 — Queue and Idempotency
+
+### 🏷️ Versioning
+- Version: `v1.1`
+- Last updated: `2026-04-07`
+
+### 📚 Resources and information
+- File: `libs/queue/src/queue.ts`
+- Stack: BullMQ + Redis
+
+### ❓ Why?
+- Decouple API from browser automation latency/failures.
+
+### 🧠 Assumptions
+- Redis is available and reliable in production.
+
+### ✅ Decisions
+- Retry attempts default `3` minimum.
+- Exponential backoff enabled.
+- Idempotency via `jobId = leadId`.
+
+### ⚙️ Config setup
+- `REDIS_URL`
+- `QUEUE_RETRIES`
+- `WORKER_CONCURRENCY`
+
+### 🗂️ Migration scripts
+- Not applicable.
+
+### ❔ Open questions
+- Should we add explicit dead-letter queue per failure category?
+
+### 🕰️ As is
+- No queue; manual work only.
+
+### 🛠️ To be (with components and data fields)
+- Queue name: `lead-submission`
+- Job payload fields:
+  - `leadId`, `receivedAt`, `lead`
+
+### 🚨 Edge cases and unhappy flows
+- Redis outage => enqueue fails, API should return error.
+- Poison message => retries exhausted and surfaced for manual handling.
+
+### 🔄 Considered alternatives
+- RabbitMQ (not chosen to keep implementation lean with BullMQ + Redis).
+
+### 🌱 Future work
+- Add queue metrics exporter and lag alerts.
+
+### 🔐 Security impact
+- Queue isolation reduces direct blast radius on API availability.
