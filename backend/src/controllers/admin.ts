import type { Request, Response } from 'express';
import { getPlatformInsights } from '../services/admin';

export const getInsights = async (_req: Request, res: Response) => {
  const insights = await getPlatformInsights();
  res.status(200).json(insights);
};
