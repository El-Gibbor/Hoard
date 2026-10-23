import { z } from 'zod';

// Whole Rwandan francs. One hundred million is a generous cap for a single entry.
export const amountSchema = z.number().int().positive().max(100_000_000);
