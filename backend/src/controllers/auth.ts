import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../schemas/auth';
import { getCurrentUser, loginUser, registerUser } from '../services/auth';
import { HttpError } from '../utils/http-error';

export const register = async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const result = await registerUser(body);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const result = await loginUser(body);
  res.status(200).json(result);
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const user = await getCurrentUser(req.user.id);
  res.status(200).json({ user });
};
