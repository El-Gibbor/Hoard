import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Role } from '../generated/prisma/client';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';
import { hashPassword, verifyPassword } from '../utils/password';
import type { LoginInput, RegisterInput } from '../schemas/auth';

const INVALID_LOGIN = 'Invalid email or password';

type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

export const toPublicUser = (user: PublicUser): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const signToken = (user: { id: string; role: Role }): string =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    // jsonwebtoken types expiresIn as a ms StringValue, not a plain string
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

const authResult = (user: PublicUser) => ({
  user: toPublicUser(user),
  token: signToken(user),
});

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
  });

  return authResult(user);
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    throw new HttpError(401, INVALID_LOGIN);
  }

  return authResult(user);
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  return toPublicUser(user);
};
