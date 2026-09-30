import { describe, expect, it } from 'vitest';
import { validate } from '../../../src/validators/validate.js';
import { bookSchema } from '../../../src/validators/book.schema.js';
import { createUserSchema, updateUserSchema } from '../../../src/validators/user.schema.js';
import { HttpError } from '../../../src/utils/http-error.js';
import { validBook, validUser } from '../../fixtures.js';

// Helper: run validate() and return the thrown HttpError (or fail the test).
const errorFrom = (fn) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error('Expected validate() to throw');
};

describe('validate() with bookSchema', () => {
  it('returns cleaned data for a valid body', () => {
    const data = validate(bookSchema, validBook({ title: '  DDIA  ', isbn: '978-1-4493-7332-0' }));
    expect(data.title).toBe('DDIA'); // trimmed
    expect(data.isbn).toBe('9781449373320'); // hyphens removed
  });

  it('lists EVERY invalid field, not just the first', () => {
    const err = errorFrom(() => validate(bookSchema, { title: '', price: -5 }));
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(400);
    const fields = err.extras.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'author', 'isbn', 'publishedYear', 'price', 'stock']));
  });

  it('rejects unknown fields (mass-assignment protection)', () => {
    const err = errorFrom(() => validate(bookSchema, validBook({ id: 'hacked', createdAt: 'x' })));
    expect(err.extras.errors).toEqual([
      { field: 'id', message: 'is not allowed' },
      { field: 'createdAt', message: 'is not allowed' },
    ]);
  });

  it('rejects bodies that are not JSON objects', () => {
    expect(errorFrom(() => validate(bookSchema, [])).detail).toBe('Request body must be a JSON object');
    expect(errorFrom(() => validate(bookSchema, undefined)).status).toBe(400);
  });

  describe('partial mode (PATCH)', () => {
    it('allows a subset of fields', () => {
      expect(validate(bookSchema, { price: 10 }, { partial: true })).toEqual({ price: 10 });
    });

    it('still validates the fields that are present', () => {
      const err = errorFrom(() => validate(bookSchema, { price: 'free' }, { partial: true }));
      expect(err.extras.errors[0].field).toBe('price');
    });

    it('rejects an empty update', () => {
      const err = errorFrom(() => validate(bookSchema, {}, { partial: true }));
      expect(err.detail).toBe('Provide at least one field to update');
    });
  });
});

describe('user schemas', () => {
  it('lower-cases email on create', () => {
    expect(validate(createUserSchema, validUser({ email: ' Sita@Example.COM ' })).email).toBe('sita@example.com');
  });

  it('never accepts a role from the client', () => {
    const err = errorFrom(() => validate(createUserSchema, validUser({ role: 'admin' })));
    expect(err.extras.errors).toEqual([{ field: 'role', message: 'is not allowed' }]);
  });

  it('does not allow password changes through the profile update schema', () => {
    const err = errorFrom(() => validate(updateUserSchema, { password: 'NewPass123' }, { partial: true }));
    expect(err.extras.errors[0]).toEqual({ field: 'password', message: 'is not allowed' });
  });

  it('validates the nested address object', () => {
    const err = errorFrom(() => validate(createUserSchema, validUser({ address: { street: 'x', country: 'Nepal' } })));
    expect(err.extras.errors).toEqual([{ field: 'address', message: 'city is required' }]);
  });
});
