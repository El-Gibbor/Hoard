import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const healthRouter = Router();

// Ready only when the database answers, so probes and the deploy smoke test catch a broken connection.
healthRouter.get('/', async (_req, res) => {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', timestamp });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable', timestamp });
  }
});
