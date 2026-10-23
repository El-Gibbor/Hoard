import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seed } from '../prisma/seed';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { bearer, deleteRegisteredUsers, registerUser } from './helpers';

describe('GET /api/categories', () => {
  beforeAll(async () => {
    await seed();
  });

  afterAll(async () => {
    await deleteRegisteredUsers();
    await prisma.$disconnect();
  });

  it('returns 401 when the token is missing', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(401);
  });

  it('returns the seeded categories with Uncategorized last', async () => {
    const user = await registerUser();
    const res = await request(app).get('/api/categories').set(bearer(user.token));

    const names = res.body.map((category: { name: string }) => category.name);
    const uncategorized = res.body.find((category: { name: string }) => category.name === 'Uncategorized');

    expect(res.status).toBe(200);
    expect(names).toHaveLength(11);
    expect(names.at(-1)).toBe('Uncategorized');
    expect(names.slice(0, -1)).toEqual([...names.slice(0, -1)].sort((a, b) => a.localeCompare(b)));
    expect(uncategorized.isDefault).toBe(true);
  });
});
