import { Queue, QueueEvents, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';
import { LeadJobPayload } from '../../domain/src/types.js';

export const LEAD_SUBMISSION_QUEUE = 'lead-submission';

// Shared Redis client factory with BullMQ-recommended options for workers.
export function createRedisConnection(): IORedis {
  return new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

// Creates queue producer with retry/backoff defaults.
export function createLeadQueue() {
  const connection = createRedisConnection();
  return new Queue<LeadJobPayload>(LEAD_SUBMISSION_QUEUE, {
    connection,
    defaultJobOptions: {
      // Minimum requirement: at least 3 retries.
      attempts: Number(process.env.QUEUE_RETRIES ?? 3),
      removeOnComplete: 500,
      removeOnFail: 1000,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  });
}

// Queue event stream (useful for monitoring services/dashboards).
export function createLeadQueueEvents() {
  const connection = createRedisConnection();
  return new QueueEvents(LEAD_SUBMISSION_QUEUE, { connection });
}

// Shared worker runtime options.
export const workerOptions: WorkerOptions = {
  connection: createRedisConnection(),
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 3),
  lockDuration: 120_000
};
