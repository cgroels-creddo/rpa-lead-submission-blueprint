// Status model used across API and worker components.
export type LeadStatus =
  | 'QUEUED'
  | 'VALIDATION_FAILED'
  | 'SUBMITTED'
  | 'FAILED_TEMPORARY'
  | 'FAILED_PERMANENT'
  | 'MANUAL_REVIEW_REQUIRED';

// Raw source lead payload.
export interface LeadInput {
  externalLeadId?: string;
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  companyOrgNumber: string;
  registrationDate: string;
  amount: number;
  monthlyRevenue: number;
  useOfFunds: string;
}

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

// Queue payload shape consumed by worker.
export interface LeadJobPayload {
  leadId: string;
  receivedAt: string;
  lead: LeadInput;
}

// Normalized processing result shape for status handling.
export interface LeadProcessingResult {
  status: LeadStatus;
  message: string;
  partnerReference?: string;
  screenshotPath?: string;
}
