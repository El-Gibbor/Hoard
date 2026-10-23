import type { Request, Response } from 'express';
import { listCategories } from '../services/categories';
import { HttpError } from '../utils/http-error';

export const getCategories = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const categories = await listCategories();
  res.status(200).json(categories);
};
