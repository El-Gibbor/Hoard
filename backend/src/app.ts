import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { requireAuth, requireRole } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';

export const app = express();

app.use(helmet());
// CLIENT_ORIGIN can hold several comma-separated origins
app.use(cors({ origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Issues #9 and #10 will use requireRole. Until then the tests call this route.
if (env.NODE_ENV === 'test') {
  app.get('/api/admin-check', requireAuth, requireRole('ADMIN'), (_req, res) => {
    res.json({ ok: true });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);
