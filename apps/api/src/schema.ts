import { z } from 'zod';

// API boundary schema: validates structure and primitive constraints only.
export const leadInputSchema = z.object({
  externalLeadId: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(6),
  companyName: z.string().min(2),
  companyOrgNumber: z.string().min(3),
  registrationDate: z.string().date(),
  amount: z.number().positive(),
  monthlyRevenue: z.number().positive(),
  useOfFunds: z.string().min(1)
});

export type LeadInputRequest = z.infer<typeof leadInputSchema>;
