import { describe, expect, it } from 'vitest';
import { email, integer, isbn13, money, object, password, pastDate, string } from '../../../src/validators/rules.js';

describe('string()', () => {
  const check = string({ min: 2, max: 5 });

  it('accepts a string within the length limits', () => {
    expect(check('abc')).toBeNull();
  });

  it.each([
    [123, 'must be a string'],
    ['a', 'must be at least 2 characters'],
    ['abcdef', 'must be at most 5 characters'],
    ['   a   ', 'must be at least 2 characters'], // whitespace is trimmed before measuring
  ])('rejects %j → "%s"', (value, message) => {
    expect(check(value)).toBe(message);
  });
});

describe('integer()', () => {
  it('rejects decimals and out-of-range values', () => {
    const check = integer({ min: 0, max: 10 });
    expect(check(5)).toBeNull();
    expect(check(5.5)).toBe('must be an integer');
    expect(check('5')).toBe('must be an integer');
    expect(check(11)).toBe('must be between 0 and 10');
  });
});

describe('money()', () => {
  const check = money();

  it.each([0, 0.29, 19.99, 45.99, 100])('accepts %d', (value) => {
    expect(check(value)).toBeNull();
  });

  it('rejects more than 2 decimal places', () => {
    expect(check(1.234)).toBe('must have at most 2 decimal places');
  });

  it('rejects negatives, NaN and strings', () => {
    expect(check(-1)).toMatch(/between/);
    expect(check(Number.NaN)).toBe('must be a number');
    expect(check('9.99')).toBe('must be a number');
  });
});

describe('email()', () => {
  it.each(['a@b.co', 'first.last@uni.edu.np'])('accepts %s', (value) => {
    expect(email()(value)).toBeNull();
  });

  it.each(['plainaddress', 'a@b', 'a b@c.com', '@c.com'])('rejects %s', (value) => {
    expect(email()(value)).toBe('must be a valid email address');
  });
});

describe('password()', () => {
  it('requires 8-72 characters with a letter and a digit', () => {
    expect(password()('Secret123')).toBeNull();
    expect(password()('short1')).toBe('must be 8-72 characters long');
    expect(password()('onlyletters')).toMatch(/letter and one digit/);
    expect(password()('12345678')).toMatch(/letter and one digit/);
  });
});

describe('pastDate()', () => {
  it('accepts a real date in the past', () => {
    expect(pastDate()('2000-02-29')).toBeNull(); // leap day
  });

  it('rejects wrong formats, impossible dates and future dates', () => {
    expect(pastDate()('29/02/2000')).toMatch(/YYYY-MM-DD/);
    expect(pastDate()('2001-02-29')).toBe('must be a real calendar date'); // 2001 is not a leap year
    expect(pastDate()('2999-01-01')).toBe('must be in the past');
  });
});

describe('isbn13()', () => {
  it('accepts valid ISBN-13s with or without hyphens', () => {
    expect(isbn13()('9781449373320')).toBeNull();
    expect(isbn13()('978-1-4493-7332-0')).toBeNull();
  });

  it('rejects a wrong checksum digit', () => {
    expect(isbn13()('9781449373321')).toBe('has an invalid ISBN-13 checksum');
  });

  it('rejects the wrong number of digits', () => {
    expect(isbn13()('12345')).toBe('must be a 13-digit ISBN');
  });
});

describe('object()', () => {
  const check = object({
    city: { required: true, check: string() },
    zip: { required: false, check: string() },
  });

  it('validates nested fields', () => {
    expect(check({ city: 'Pokhara' })).toBeNull();
    expect(check({})).toBe('city is required');
    expect(check({ city: '' })).toBe('city must not be empty');
    expect(check({ city: 'Pokhara', planet: 'Mars' })).toBe('planet is not allowed');
    expect(check([])).toBe('must be an object');
  });
});
