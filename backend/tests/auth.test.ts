import { afterAll, afterEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';

const createdEmails: string[] = [];
let sequence = 0;

const uniqueEmail = (label: string): string => {
  sequence += 1;
  const email = `${label}-${sequence}@example.com`;
  createdEmails.push(email);
  return email;
};

const invalidLogin = 'Invalid email or password';
const invalidToken = 'Missing or invalid token';
const jwtSecret = String(process.env.JWT_SECRET);

const register = async (email: string) => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Amina Keza',
    email,
    password: 'password1',
  });
  return { id: res.body.user.id as string, token: res.body.token as string };
};

describe('authentication', () => {
  afterEach(async () => {
    if (createdEmails.length === 0) {
      return;
    }
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    createdEmails.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a user and returns a token without the password hash', async () => {
    const email = uniqueEmail('register');
    const res = await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email,
      password: 'password1',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('USER');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 409 when the email is already registered', async () => {
    const email = uniqueEmail('duplicate');
    const body = { name: 'Amina Keza', email, password: 'password1' };

    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Email is already registered');
  });

  it('returns 400 with details when the register body is invalid', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.details.password).toBeDefined();
    expect(res.body.error.details.email).toBeDefined();
  });

  it('stores the email trimmed and lowercased on register', async () => {
    const email = uniqueEmail('amina');
    const res = await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email: `  ${email.replace('amina', 'Amina').replace('example.com', 'Example.COM')} `,
      password: 'password1',
    });
    const stored = await prisma.user.findUnique({ where: { email } });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(stored).not.toBeNull();
  });

  it('logs in a registered user', async () => {
    const email = uniqueEmail('login');
    await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email,
      password: 'password1',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: `  ${email.toUpperCase()}  `,
      password: 'password1',
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 401 when the password is wrong', async () => {
    const email = uniqueEmail('wrong-password');
    await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email,
      password: 'password1',
    });

    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'password2',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidLogin);
  });

  it('returns 401 when the email is unknown', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: uniqueEmail('missing'),
      password: 'password1',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidLogin);
  });

  it('returns the current user for a valid token', async () => {
    const email = uniqueEmail('me');
    const registered = await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email,
      password: 'password1',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registered.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 for the current user when the token is missing', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Missing or invalid token');
  });

  it('returns 401 for the current user when the token is tampered', async () => {
    const email = uniqueEmail('tampered');
    const registered = await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email,
      password: 'password1',
    });
    const token = String(registered.body.token);
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tampered}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Missing or invalid token');
  });

  it('returns 403 when a user calls an admin-only route', async () => {
    const email = uniqueEmail('role');
    const registered = await request(app).post('/api/auth/register').send({
      name: 'Amina Keza',
      email,
      password: 'password1',
    });

    const res = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', `Bearer ${registered.body.token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Forbidden');
  });

  it('returns 401 when the token has expired', async () => {
    const user = await register(uniqueEmail('expired'));
    const expired = jwt.sign({ sub: user.id, role: 'USER' }, jwtSecret, { expiresIn: -10 });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidToken);
  });

  it('returns 401 when the token is signed with a different secret', async () => {
    const user = await register(uniqueEmail('foreign-secret'));
    const foreign = jwt.sign({ sub: user.id, role: 'USER' }, 'another-secret-that-is-at-least-32-chars');

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${foreign}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidToken);
  });

  it('returns 401 when the authorisation header is not a Bearer token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Basic abc');

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidToken);
  });

  it('returns 401 when the token role is not USER or ADMIN', async () => {
    const user = await register(uniqueEmail('unknown-role'));
    const token = jwt.sign({ sub: user.id, role: 'SUPERUSER' }, jwtSecret);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidToken);
  });

  it('returns 401 for the current user when the user has been deleted', async () => {
    const email = uniqueEmail('deleted');
    const user = await register(email);
    await prisma.user.delete({ where: { email } });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(invalidToken);
  });

  it('lets an admin call an admin-only route', async () => {
    const email = uniqueEmail('admin');
    await prisma.user.create({
      data: {
        name: 'Hoard Operator',
        email,
        passwordHash: await hashPassword('password1'),
        role: 'ADMIN',
      },
    });
    const login = await request(app).post('/api/auth/login').send({ email, password: 'password1' });

    const res = await request(app)
      .get('/api/admin/insights')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(login.body.user.role).toBe('ADMIN');
    expect(res.status).toBe(200);
    expect(res.body.totals).toBeDefined();
  });
});
