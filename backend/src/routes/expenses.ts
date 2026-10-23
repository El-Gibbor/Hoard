import { Router } from 'express';
import { getExpenses, postExpense } from '../controllers/expenses';
import { requireAuth } from '../middleware/auth';

export const expensesRouter = Router();

expensesRouter.use(requireAuth);
expensesRouter.post('/', postExpense);
expensesRouter.get('/', getExpenses);
