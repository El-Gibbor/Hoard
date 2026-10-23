import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { seed } from '../prisma/seed';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { calendarDate } from '../src/utils/calendar';
import { bearer, deleteRegisteredUsers, registerUser } from './helpers';

type CategoryTotal = { id: string; name: string; total: number; count: number };

const createdCategoryIds: string[] = [];
let adminToken = '';
let categoryId = '';

const currentMonth = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Kigali',
  year: 'numeric',
  month: '2-digit',
}).format(new Date());
const thisMonthDate = calendarDate(`${currentMonth}-01`);
const lastMonthDate = new Date(thisMonthDate.getTime() - 24 * 60 * 60 * 1000);

const getInsights = () => request(app).get('/api/admin/insights').set(bearer(adminToken));

const addExpense = (userId: string, amount: number, date: Date) =>
  prisma.expense.create({
    data: { userId, categoryId, title: 'Bus fare', amount, date, paymentMethod: 'MTN_MOMO' },
  });

const categoryTotal = (categories: CategoryTotal[], id: string) =>
  categories.find((category) => category.id === id);

describe('GET /api/admin/insights', () => {
  beforeAll(async () => {
    await seed();
    const category = await prisma.category.findUnique({ where: { name: 'Transport' } });
    if (!category) {
      throw new Error('Seeded category Transport is missing');
    }
    categoryId = category.id;

    const login = await request(app).post('/api/auth/login').send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    adminToken = login.body.token;
  });

  afterEach(async () => {
    await deleteRegisteredUsers();
    if (createdCategoryIds.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
      createdCategoryIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 401 when the token is missing', async () => {
    const res = await request(app).get('/api/admin/insights');

    expect(res.status).toBe(401);
  });

  it('returns 403 for a user who is not an admin', async () => {
    const user = await registerUser();
    const res = await request(app).get('/api/admin/insights').set(bearer(user.token));

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Forbidden');
  });

  it('returns totals, every category ranked by spending and recent activity', async () => {
    const res = await getInsights();
    const totals: number[] = res.body.categories.map((category: CategoryTotal) => category.total);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.totals).sort()).toEqual(
      ['expenses', 'expensesThisMonth', 'users', 'value', 'valueThisMonth'].sort(),
    );
    expect(res.body.categories).toHaveLength(await prisma.category.count());
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
    expect(res.body.topCategories).toEqual(res.body.categories.slice(0, 5));
    expect(res.body.bottomCategories).toEqual(res.body.categories.slice(-5).reverse());
    expect(Array.isArray(res.body.recentExpenses)).toBe(true);
    expect(Array.isArray(res.body.recentSignUps)).toBe(true);
  });

  it('increases the totals by exactly the users and expenses added', async () => {
    const before = await getInsights();
    const user = await registerUser();
    await addExpense(user.id, 1500, thisMonthDate);
    await addExpense(user.id, 2500, thisMonthDate);

    const after = await getInsights();
    const categoryBefore = categoryTotal(before.body.categories, categoryId);
    const categoryAfter = categoryTotal(after.body.categories, categoryId);

    expect(after.body.totals).toEqual({
      users: before.body.totals.users + 1,
      expenses: before.body.totals.expenses + 2,
      value: before.body.totals.value + 4000,
      expensesThisMonth: before.body.totals.expensesThisMonth + 2,
      valueThisMonth: before.body.totals.valueThisMonth + 4000,
    });
    expect(categoryAfter?.total).toBe((categoryBefore?.total ?? 0) + 4000);
    expect(categoryAfter?.count).toBe((categoryBefore?.count ?? 0) + 2);
  });

  it('lists a category nobody has used with a total of zero', async () => {
    const unused = await prisma.category.create({ data: { name: `Unused ${process.pid}-${Date.now()}` } });
    createdCategoryIds.push(unused.id);

    const res = await getInsights();

    expect(categoryTotal(res.body.categories, unused.id)).toEqual({
      id: unused.id,
      name: unused.name,
      total: 0,
      count: 0,
    });
  });

  it('leaves an expense dated last month out of this month', async () => {
    const before = await getInsights();
    const user = await registerUser();
    await addExpense(user.id, 3000, lastMonthDate);

    const after = await getInsights();

    expect(after.body.totals.expenses).toBe(before.body.totals.expenses + 1);
    expect(after.body.totals.value).toBe(before.body.totals.value + 3000);
    expect(after.body.totals.expensesThisMonth).toBe(before.body.totals.expensesThisMonth);
    expect(after.body.totals.valueThisMonth).toBe(before.body.totals.valueThisMonth);
  });

  it('shows recent expenses and sign-ups without emails or password hashes', async () => {
    const user = await registerUser();
    const expense = await addExpense(user.id, 1200, thisMonthDate);

    const res = await getInsights();
    const listed = res.body.recentExpenses.find((recent: { id: string }) => recent.id === expense.id);
    const signUp = res.body.recentSignUps.find((recent: { id: string }) => recent.id === user.id);

    expect(listed).toEqual({
      id: expense.id,
      title: 'Bus fare',
      amount: 1200,
      date: thisMonthDate.toISOString(),
      paymentMethod: 'MTN_MOMO',
      category: 'Transport',
      user: { id: user.id, name: 'Amina Keza' },
    });
    expect(JSON.stringify(res.body.recentExpenses)).not.toMatch(/passwordHash|email/);
    expect(signUp.email).toBe(user.email);
    expect(JSON.stringify(res.body.recentSignUps)).not.toContain('passwordHash');
    expect(res.body.recentSignUps.every((recent: { role: string }) => recent.role === 'USER')).toBe(true);
  });
});
