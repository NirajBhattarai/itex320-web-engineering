import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';

// Integration tests: real Express app + real middleware + real services, driven over HTTP by Supertest.
// No port is opened — Supertest calls the app directly.
const app = createApp(createContainer());

describe('App-level behaviour', () => {
  it('GET /health → 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('adds X-Request-Id and hides X-Powered-By', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('reuses an incoming X-Request-Id (e.g. set by Nginx)', async () => {
    const res = await request(app).get('/health').set('X-Request-Id', 'abc-123');
    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('unknown route → 404 Problem Details', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({ title: 'Not Found', status: 404, instance: '/api/v1/nope' });
  });

  it('malformed JSON → 400, not 500', async () => {
    const res = await request(app).post('/api/v1/books').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.requestId).toEqual(expect.any(String));
  });

  it('body larger than the limit → 413', async () => {
    const res = await request(app)
      .post('/api/v1/books')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ title: 'x'.repeat(200_000) }));
    expect(res.status).toBe(413);
  });
});
