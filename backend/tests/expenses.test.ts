import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seed } from '../prisma/seed';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { bearer, deleteRegisteredUsers, registerUser } from './helpers';

let categoryId = '';

const expenseBody = (overrides: Record<string, unknown> = {}) => ({
  title: 'Airtime',
  amount: 1500,
  categoryId,
  date: '2026-10-15',
  paymentMethod: 'MTN_MOMO',
  ...overrides,
});

describe('expenses', () => {
  beforeAll(async () => {
    await seed();
    const category = await prisma.category.findUnique({ where: { name: 'Food & Groceries' } });
    if (!category) {
      throw new Error('Seeded category Food & Groceries is missing');
    }
    categoryId = category.id;
  });

  afterEach(async () => {
    await deleteRegisteredUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 401 when creating an expense without a token', async () => {
    const res = await request(app).post('/api/expenses').send(expenseBody());

    expect(res.status).toBe(401);
  });

  it('returns 401 when listing expenses without a token', async () => {
    const res = await request(app).get('/api/expenses');

    expect(res.status).toBe(401);
  });

  it('creates an expense and lists it straight away', async () => {
    const user = await registerUser();
    const created = await request(app)
      .post('/api/expenses')
      .set(bearer(user.token))
      .send(expenseBody({ title: '  Weekly airtime  ', notes: '  Bundle  ' }));

    const listed = await request(app).get('/api/expenses').set(bearer(user.token));

    expect(created.status).toBe(201);
    expect(created.body.title).toBe('Weekly airtime');
    expect(created.body.amount).toBe(1500);
    expect(created.body.notes).toBe('Bundle');
    expect(created.body.date).toBe('2026-10-15T00:00:00.000Z');
    expect(created.body.category).toEqual({ id: categoryId, name: 'Food & Groceries' });
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.id })]));
  });

  it('returns 400 with details when the amount is zero', async () => {
    const user = await registerUser();
    const res = await request(app).post('/api/expenses').set(bearer(user.token)).send(expenseBody({ amount: 0 }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.amount).toBeDefined();
  });

  it('returns 400 with details when the amount is negative', async () => {
    const user = await registerUser();
    const res = await request(app).post('/api/expenses').set(bearer(user.token)).send(expenseBody({ amount: -500 }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.amount).toBeDefined();
  });

  it('returns 400 with details when the amount has decimals', async () => {
    const user = await registerUser();
    const res = await request(app).post('/api/expenses').set(bearer(user.token)).send(expenseBody({ amount: 1500.5 }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.amount).toBeDefined();
  });

  it('returns 400 with details when the amount is a string', async () => {
    const user = await registerUser();
    const res = await request(app).post('/api/expenses').set(bearer(user.token)).send(expenseBody({ amount: '1500' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.amount).toBeDefined();
  });

  it('returns 400 with details when category, date or payment method is missing', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/expenses')
      .set(bearer(user.token))
      .send({ title: 'Airtime', amount: 1500 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.categoryId).toBeDefined();
    expect(res.body.error.details.date).toBeDefined();
    expect(res.body.error.details.paymentMethod).toBeDefined();
  });

  it('returns 400 with details when the payment method is invalid', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/expenses')
      .set(bearer(user.token))
      .send(expenseBody({ paymentMethod: 'MOMO' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.paymentMethod).toBeDefined();
  });

  it('returns 400 with details when the date is invalid', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/expenses')
      .set(bearer(user.token))
      .send(expenseBody({ date: '2026-02-31' }));

    expect(res.status).toBe(400);
    expect(res.body.error.details.date).toBeDefined();
  });

  it('returns 400 when the category does not exist', async () => {
    const user = await registerUser();
    const res = await request(app)
      .post('/api/expenses')
      .set(bearer(user.token))
      .send(expenseBody({ categoryId: 'missing-category' }));

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Category not found');
  });

  it('allows an expense without notes', async () => {
    const user = await registerUser();
    const res = await request(app).post('/api/expenses').set(bearer(user.token)).send(expenseBody());

    expect(res.status).toBe(201);
    expect(res.body.notes).toBeNull();
  });

  it('hides another user\'s expenses', async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const created = await request(app)
      .post('/api/expenses')
      .set(bearer(owner.token))
      .send(expenseBody({ title: 'Private fare' }));

    const ownerList = await request(app).get('/api/expenses').set(bearer(owner.token));
    const res = await request(app).get('/api/expenses').set(bearer(other.token));

    expect(created.status).toBe(201);
    expect(ownerList.body.map((expense: { id: string }) => expense.id)).toEqual([created.body.id]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('lists newest dates first and can filter by month', async () => {
    const user = await registerUser();
    const headers = bearer(user.token);
    await request(app).post('/api/expenses').set(headers).send(expenseBody({ title: 'September rent', date: '2026-09-01' }));
    await request(app)
      .post('/api/expenses')
      .set(headers)
      .send(expenseBody({ title: 'September airtime', date: '2026-09-01' }));
    await request(app).post('/api/expenses').set(headers).send(expenseBody({ title: 'October early', date: '2026-10-01' }));
    await request(app).post('/api/expenses').set(headers).send(expenseBody({ title: 'October late', date: '2026-10-20' }));

    const listed = await request(app).get('/api/expenses').set(headers);
    const october = await request(app).get('/api/expenses').query({ month: '2026-10' }).set(headers);

    expect(listed.body.map((expense: { title: string }) => expense.title)).toEqual([
      'October late',
      'October early',
      'September airtime',
      'September rent',
    ]);
    expect(october.body.map((expense: { title: string }) => expense.title)).toEqual(['October late', 'October early']);
  });
});
