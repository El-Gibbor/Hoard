import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('GET /api/health', () => {
  it('reports the API as healthy', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });
});

describe('error handling', () => {
  it('returns 404 with a message for unknown routes', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Route GET /api/nope not found');
  });

  it('returns 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid JSON body');
  });
});
