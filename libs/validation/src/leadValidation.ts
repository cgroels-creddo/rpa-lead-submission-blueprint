import { LeadInput, ValidationResult } from '../../domain/src/types.js';

// Business constants extracted so policy changes are low-risk and centralized.
const MAX_MULTIPLIER = 2.5;
const MIN_COMPANY_AGE_DAYS = 305;

// Validates domain rules that decide whether lead may be submitted to partner.
export function validateLeadBusinessRules(lead: LeadInput, today = new Date()): ValidationResult {
  const reasons: string[] = [];

  // Rule 1: registrationDate must parse and company age must be > 305 days.
  const registrationDate = new Date(lead.registrationDate);
  if (Number.isNaN(registrationDate.getTime())) {
    reasons.push('registrationDate is invalid');
  } else {
    const ageInDays = Math.floor((today.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays <= MIN_COMPANY_AGE_DAYS) {
      reasons.push(`Company age ${ageInDays} days is not greater than ${MIN_COMPANY_AGE_DAYS} days`);
    }
  }

  // Rule 2: amount may not exceed 2.5x monthly revenue.
  const maxAllowedAmount = lead.monthlyRevenue * MAX_MULTIPLIER;
  if (lead.amount > maxAllowedAmount) {
    reasons.push(`Amount ${lead.amount} exceeds ${MAX_MULTIPLIER}x monthly revenue (${maxAllowedAmount})`);
  }

  return {
    valid: reasons.length === 0,
    reasons
  };
}
