import request from 'supertest';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const createdEmails: string[] = [];
let sequence = 0;

const uniqueEmail = (label: string): string => {
  sequence += 1;
  const email = `${label}-${sequence}@example.com`;
  createdEmails.push(email);
  return email;
};

const invalidLogin = 'Invalid email or password';

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
      .get('/api/admin-check')
      .set('Authorization', `Bearer ${registered.body.token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('Forbidden');
  });
});
