import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';
import { validUser } from '../fixtures.js';

const USERS = '/api/v1/users';

describe('Users API /api/v1/users', () => {
  let app;
  let container;

  beforeEach(() => {
    container = createContainer(); // real scrypt hashing — this is an integration test
    app = createApp(container);
  });

  const createUser = (overrides) => request(app).post(USERS).send(validUser(overrides));

  it('POST creates a customer with all profile details, without exposing the password', async () => {
    const res = await createUser();

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`${USERS}/${res.body.data.id}`);
    expect(res.body.data).toEqual({
      id: expect.any(String),
      firstName: 'Sita',
      lastName: 'Gurung',
      email: 'sita@example.com',
      phone: '+977-9800000002',
      dateOfBirth: '2002-11-03',
      address: { street: 'Lakeside Road 5', city: 'Pokhara', postalCode: '33700', country: 'Nepal' },
      role: 'customer',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('stores a real scrypt hash (checked through the service layer)', async () => {
    const { body } = await createUser();
    const stored = await container.usersService.users.findById(body.data.id);
    expect(stored.passwordHash).toMatch(/^scrypt\$/);
  });

  it('400 when a client tries to make themselves admin', async () => {
    const res = await createUser({ role: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([{ field: 'role', message: 'is not allowed' }]);
  });

  it('400 with detailed errors for bad input', async () => {
    const res = await request(app).post(USERS).send({
      firstName: 'S',
      email: 'not-an-email',
      password: 'short',
      dateOfBirth: '2999-01-01',
      address: { city: 'Pokhara' },
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'lastName', message: 'is required' },
        { field: 'email', message: 'must be a valid email address' },
        { field: 'password', message: 'must be 8-72 characters long' },
        { field: 'dateOfBirth', message: 'must be in the past' },
        { field: 'address', message: 'street is required' },
      ]),
    );
  });

  it('409 for a duplicate email, case-insensitive', async () => {
    await createUser();
    const res = await createUser({ email: 'SITA@Example.com' });
    expect(res.status).toBe(409);
  });

  it('GET list never includes password hashes and supports ?role and ?q', async () => {
    await createUser();
    await container.usersService.create(validUser({ firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@example.com' }), { role: 'admin' });

    const all = await request(app).get(USERS);
    expect(all.body.meta.total).toBe(2);
    expect(JSON.stringify(all.body)).not.toMatch(/passwordHash/);

    const admins = await request(app).get(`${USERS}?role=admin`);
    expect(admins.body.data.map((u) => u.email)).toEqual(['aarav@example.com']);

    const search = await request(app).get(`${USERS}?q=gurung`);
    expect(search.body.data).toHaveLength(1);
  });

  it('PATCH updates profile fields; password cannot be changed here', async () => {
    const { body } = await createUser();
    const url = `${USERS}/${body.data.id}`;

    const ok = await request(app).patch(url).send({ phone: '+977-9811111111' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.phone).toBe('+977-9811111111');

    const blocked = await request(app).patch(url).send({ password: 'NewPass123' });
    expect(blocked.status).toBe(400);
  });

  it('DELETE → 204, then GET → 404', async () => {
    const { body } = await createUser();
    const url = `${USERS}/${body.data.id}`;
    expect((await request(app).delete(url)).status).toBe(204);
    expect((await request(app).get(url)).status).toBe(404);
  });
});
