import { Router } from 'express';
import { getBudgetSummary, putBudget } from '../controllers/budgets';
import { requireAuth } from '../middleware/auth';

export const budgetsRouter = Router();

budgetsRouter.use(requireAuth);
budgetsRouter.put('/:month', putBudget);
budgetsRouter.get('/:month', getBudgetSummary);
