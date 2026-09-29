import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/utils/password.js';

describe('password hashing', () => {
  it('never stores the plain password', async () => {
    const hash = await hashPassword('Secret123');
    expect(hash).not.toContain('Secret123');
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  it('produces a different hash each time (random salt)', async () => {
    expect(await hashPassword('Secret123')).not.toBe(await hashPassword('Secret123'));
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('Secret123');
    expect(await verifyPassword('Secret123', hash)).toBe(true);
    expect(await verifyPassword('secret123', hash)).toBe(false);
  });

  it('returns false for a malformed stored hash', async () => {
    expect(await verifyPassword('Secret123', 'not-a-hash')).toBe(false);
  });
});
