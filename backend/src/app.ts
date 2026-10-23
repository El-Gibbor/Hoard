import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { requireAuth, requireRole } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { budgetsRouter } from './routes/budgets';
import { categoriesRouter } from './routes/categories';
import { expensesRouter } from './routes/expenses';
import { healthRouter } from './routes/health';

export const app = express();

app.use(helmet());
// CLIENT_ORIGIN can hold several comma-separated origins
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/admin', adminRouter);

// Issues #9 and #10 will use requireRole. Until then the tests call this route.
if (env.NODE_ENV === 'test') {
  app.get('/api/admin-check', requireAuth, requireRole('ADMIN'), (_req, res) => {
    res.json({ ok: true });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
