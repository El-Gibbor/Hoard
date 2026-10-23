import { z } from 'zod';
import { PaymentMethod } from '../generated/prisma/client';
import { amountSchema } from './amount';
import { monthSchema } from './month';

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(100),
  amount: amountSchema,
  categoryId: z.string().trim().min(1),
  date: z.iso.date(),
  paymentMethod: z.enum(PaymentMethod),
  notes: z.string().trim().max(500).optional(),
});

export const listExpensesQuerySchema = z.object({
  month: monthSchema.optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
