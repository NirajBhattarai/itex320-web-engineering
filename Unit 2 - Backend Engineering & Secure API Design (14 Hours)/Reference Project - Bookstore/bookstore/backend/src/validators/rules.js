// Small, reusable checks. Each returns an error message string, or null when the value is valid.
// In Topic 2.5 we replace this hand-made layer with Zod — the idea stays exactly the same.

export const string = ({ min = 1, max = 255 } = {}) => (value) => {
  if (typeof value !== 'string') return 'must be a string';
  const length = value.trim().length;
  if (length < min) return min === 1 ? 'must not be empty' : `must be at least ${min} characters`;
  if (length > max) return `must be at most ${max} characters`;
  return null;
};

export const integer = ({ min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) => (value) => {
  if (!Number.isInteger(value)) return 'must be an integer';
  if (value < min || value > max) return `must be between ${min} and ${max}`;
  return null;
};

export const money = ({ min = 0, max = 100_000 } = {}) => (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'must be a number';
  if (value < min || value > max) return `must be between ${min} and ${max}`;
  // Compare with a tiny tolerance: in floating point, 0.29 * 100 === 28.999999999999996.
  if (Math.abs(Math.round(value * 100) - value * 100) > 1e-9) return 'must have at most 2 decimal places';
  return null;
};

export const oneOf = (allowed) => (value) =>
  allowed.includes(value) ? null : `must be one of: ${allowed.join(', ')}`;

// Deliberately simple: "something@something.tld". Real verification = sending an email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const email = () => (value) => {
  if (typeof value !== 'string') return 'must be a string';
  if (value.length > 254 || !EMAIL_PATTERN.test(value.trim())) return 'must be a valid email address';
  return null;
};

// At least 8 characters with at least one letter and one digit.
// Max 72 keeps us compatible with bcrypt if we switch hashing algorithms later.
export const password = () => (value) => {
  if (typeof value !== 'string') return 'must be a string';
  if (value.length < 8 || value.length > 72) return 'must be 8-72 characters long';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'must contain at least one letter and one digit';
  return null;
};

export const phone = () => (value) => {
  if (typeof value !== 'string') return 'must be a string';
  return /^\+?[0-9][0-9\s-]{6,19}$/.test(value.trim()) ? null : 'must be a valid phone number, e.g. +977-9800000000';
};

// "YYYY-MM-DD", a real calendar date, and in the past.
export const pastDate = () => (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'must be a date in YYYY-MM-DD format';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'must be a real calendar date';
  if (date >= new Date()) return 'must be in the past';
  return null;
};

// ISBN-13 with checksum: digits weighted 1,3,1,3,... must sum to a multiple of 10.
export const isbn13 = () => (value) => {
  if (typeof value !== 'string') return 'must be a string';
  const digits = value.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(digits)) return 'must be a 13-digit ISBN';
  const sum = [...digits].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0 ? null : 'has an invalid ISBN-13 checksum';
};

// Validates a nested object against a map of { field: { required, check } }.
export const object = (shape) => (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return 'must be an object';
  for (const [field, rule] of Object.entries(shape)) {
    if (value[field] === undefined) {
      if (rule.required) return `${field} is required`;
      continue;
    }
    const message = rule.check(value[field]);
    if (message) return `${field} ${message}`;
  }
  const unknown = Object.keys(value).find((key) => !(key in shape));
  return unknown ? `${unknown} is not allowed` : null;
};

// Common transforms applied AFTER a value passes its check.
export const trim = (value) => value.trim();
export const lowercase = (value) => value.trim().toLowerCase();
export const digitsOnly = (value) => value.replace(/[-\s]/g, '');
