import { Router } from 'express';
import { getInsights } from '../controllers/admin';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));
adminRouter.get('/insights', getInsights);
