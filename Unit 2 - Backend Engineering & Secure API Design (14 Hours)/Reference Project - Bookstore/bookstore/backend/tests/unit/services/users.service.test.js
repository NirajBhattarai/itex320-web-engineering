import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from '../../../src/repositories/users.repository.js';
import { UsersService } from '../../../src/services/users.service.js';
import { validUser } from '../../fixtures.js';

describe('UsersService', () => {
  let repository;
  let fakeHash;
  let service;

  beforeEach(() => {
    repository = new UsersRepository();
    // A mock function: fast, and lets us assert HOW it was called.
    fakeHash = vi.fn(async (plain) => `hashed:${plain}`);
    service = new UsersService(repository, { hash: fakeHash });
  });

  describe('create()', () => {
    it('hashes the password and never returns the hash', async () => {
      const user = await service.create(validUser());

      expect(fakeHash).toHaveBeenCalledOnce();
      expect(fakeHash).toHaveBeenCalledWith('Secret123');
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');

      // ...but the hash IS stored in the repository.
      const stored = await repository.findById(user.id);
      expect(stored.passwordHash).toBe('hashed:Secret123');
    });

    it('defaults role to "customer" and optional fields to null', async () => {
      const { phone, dateOfBirth, address, ...minimal } = validUser();
      const user = await service.create(minimal);
      expect(user).toMatchObject({ role: 'customer', phone: null, dateOfBirth: null, address: null });
    });

    it('allows trusted code to create an admin', async () => {
      expect((await service.create(validUser(), { role: 'admin' })).role).toBe('admin');
    });

    it('rejects a duplicate email with 409 and does not hash', async () => {
      await service.create(validUser());
      fakeHash.mockClear();
      await expect(service.create(validUser({ firstName: 'Other' }))).rejects.toMatchObject({ status: 409 });
      expect(fakeHash).not.toHaveBeenCalled(); // no wasted CPU on a request we reject
    });
  });

  describe('list()', () => {
    beforeEach(async () => {
      await service.create(validUser({ firstName: 'Sita', lastName: 'Gurung', email: 'sita@example.com' }));
      await service.create(validUser({ firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@example.com' }), { role: 'admin' });
    });

    it('never exposes password hashes', async () => {
      const { data } = await service.list();
      for (const user of data) expect(user).not.toHaveProperty('passwordHash');
    });

    it('filters by role and searches by name/email', async () => {
      expect((await service.list({ role: 'admin' })).data.map((u) => u.firstName)).toEqual(['Aarav']);
      expect((await service.list({ q: 'gurung' })).meta.total).toBe(1);
      expect((await service.list({ q: 'example.com' })).meta.total).toBe(2);
    });

    it('sorts by lastName by default', async () => {
      expect((await service.list()).data.map((u) => u.lastName)).toEqual(['Gurung', 'Sharma']);
    });
  });

  describe('update() and remove()', () => {
    it('updates profile fields', async () => {
      const user = await service.create(validUser());
      const updated = await service.update(user.id, { phone: '+977-9811111111' });
      expect(updated.phone).toBe('+977-9811111111');
      expect(updated).not.toHaveProperty('passwordHash');
    });

    it("rejects changing email to another user's email", async () => {
      await service.create(validUser({ email: 'taken@example.com' }));
      const user = await service.create(validUser({ email: 'me@example.com' }));
      await expect(service.update(user.id, { email: 'taken@example.com' })).rejects.toMatchObject({ status: 409 });
    });

    it('removes a user', async () => {
      const user = await service.create(validUser());
      await service.remove(user.id);
      await expect(service.getById(user.id)).rejects.toMatchObject({ status: 404 });
    });
  });
});
