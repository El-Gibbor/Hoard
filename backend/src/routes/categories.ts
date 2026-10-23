import { Router } from 'express';
import { getCategories } from '../controllers/categories';
import { requireAuth } from '../middleware/auth';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);
categoriesRouter.get('/', getCategories);
