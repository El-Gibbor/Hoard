import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const createdEmails: string[] = [];
let sequence = 0;

export const registerUser = async () => {
  sequence += 1;
  const email = `spender-${process.pid}-${sequence}-${Date.now()}@hoard.test`;
  createdEmails.push(email);

  const res = await request(app).post('/api/auth/register').send({
    name: 'Amina Keza',
    email,
    password: 'password1',
  });

  return {
    email,
    id: res.body.user.id as string,
    token: res.body.token as string,
  };
};

export const deleteRegisteredUsers = async () => {
  if (createdEmails.length === 0) {
    return;
  }
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  createdEmails.length = 0;
};

export const bearer = (token: string): { Authorization: string } => ({
  Authorization: `Bearer ${token}`,
});
