import { LeadProcessingResult } from '../../../libs/domain/src/types.js';

// Sends status events to external sink (API/internal webhook) when configured.
export async function reportLeadStatus(leadId: string, result: LeadProcessingResult): Promise<void> {
  const statusWebhook = process.env.STATUS_WEBHOOK_URL;

  // No-op if status callback is disabled.
  if (!statusWebhook) {
    return;
  }

  await fetch(statusWebhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ leadId, ...result })
  });
}
