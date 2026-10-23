import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seed } from '../prisma/seed';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { bearer, deleteRegisteredUsers, registerUser } from './helpers';

let categoryId = '';

const expense = (token: string, amount: number, date: string) =>
  request(app).post('/api/expenses').set(bearer(token)).send({
    title: 'Spending',
    amount,
    categoryId,
    date,
    paymentMethod: 'CASH',
  });

describe('budgets', () => {
  beforeAll(async () => {
    await seed();
    const category = await prisma.category.findUnique({ where: { name: 'Transport' } });
    if (!category) {
      throw new Error('Seeded category Transport is missing');
    }
    categoryId = category.id;
  });

  afterEach(async () => {
    await deleteRegisteredUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 401 when setting a budget without a token', async () => {
    const res = await request(app).put('/api/budgets/2026-10').send({ amount: 150000 });

    expect(res.status).toBe(401);
  });

  it('returns 401 when reading a budget without a token', async () => {
    const res = await request(app).get('/api/budgets/2026-10');

    expect(res.status).toBe(401);
  });

  it('updates the same month instead of creating a second budget', async () => {
    const user = await registerUser();
    const headers = bearer(user.token);

    const first = await request(app).put('/api/budgets/2026-10').set(headers).send({ amount: 100000 });
    const second = await request(app).put('/api/budgets/2026-10').set(headers).send({ amount: 150000 });
    const stored = await prisma.budget.count({ where: { userId: user.id, month: '2026-10' } });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.amount).toBe(150000);
    expect(stored).toBe(1);
  });

  it('counts only this user and this month towards the amount spent', async () => {
    const user = await registerUser();
    const other = await registerUser();
    await expense(user.token, 40000, '2026-10-05');
    await expense(user.token, 90000, '2026-09-05');
    await expense(other.token, 70000, '2026-10-05');
    await request(app).put('/api/budgets/2026-10').set(bearer(user.token)).send({ amount: 200000 });

    const res = await request(app).get('/api/budgets/2026-10').set(bearer(user.token));

    expect(res.status).toBe(200);
    expect(res.body.spent).toBe(40000);
    expect(res.body.remaining).toBe(160000);
    expect(res.body.status).toBe('within');
  });

  it('moves from within to approaching after another expense', async () => {
    const user = await registerUser();
    const headers = bearer(user.token);
    await request(app).put('/api/budgets/2026-10').set(headers).send({ amount: 100000 });
    await expense(user.token, 79000, '2026-10-02');

    const within = await request(app).get('/api/budgets/2026-10').set(headers);
    await expense(user.token, 1000, '2026-10-03');
    const approaching = await request(app).get('/api/budgets/2026-10').set(headers);

    expect(within.body.status).toBe('within');
    expect(approaching.body.spent).toBe(80000);
    expect(approaching.body.status).toBe('approaching');
    expect(approaching.body.percentUsed).toBe(80);
  });

  it('returns 400 for a month number that does not exist', async () => {
    const user = await registerUser();
    const res = await request(app).put('/api/budgets/2026-13').set(bearer(user.token)).send({ amount: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.month).toBeDefined();
  });

  it('returns 400 when the month is not zero padded', async () => {
    const user = await registerUser();
    const res = await request(app).put('/api/budgets/2026-1').set(bearer(user.token)).send({ amount: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.month).toBeDefined();
  });

  it('returns 400 when the budget amount is a decimal or negative', async () => {
    const user = await registerUser();
    const headers = bearer(user.token);
    const decimal = await request(app).put('/api/budgets/2026-10').set(headers).send({ amount: 1500.5 });
    const negative = await request(app).put('/api/budgets/2026-10').set(headers).send({ amount: -500 });

    expect(decimal.status).toBe(400);
    expect(decimal.body.error.details.amount).toBeDefined();
    expect(negative.status).toBe(400);
    expect(negative.body.error.details.amount).toBeDefined();
  });

  it('returns 404 when no budget is set for the month', async () => {
    const user = await registerUser();
    const res = await request(app).get('/api/budgets/2026-11').set(bearer(user.token));

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('No budget set for 2026-11');
  });
});
