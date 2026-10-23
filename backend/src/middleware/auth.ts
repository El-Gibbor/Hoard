import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '../generated/prisma/client';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

const invalidToken = () => new HttpError(401, 'Missing or invalid token');

const readPayload = (token: string): { id: string; role: Role } => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw invalidToken();
    }
    if (payload.role !== 'USER' && payload.role !== 'ADMIN') {
      throw invalidToken();
    }
    return { id: payload.sub, role: payload.role };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw invalidToken();
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw invalidToken();
  }

  req.user = readPayload(header.slice('Bearer '.length));
  next();
};

export const requireRole =
  (role: Role): RequestHandler =>
  (req, _res, next) => {
    if (req.user?.role !== role) {
      throw new HttpError(403, 'Forbidden');
    }
    next();
  };
