import { digitsOnly, integer, isbn13, money, string, trim } from './rules.js';

export const GENRES = ['programming', 'databases', 'security', 'devops', 'design', 'other'];

export const bookSchema = {
  title:         { required: true,  check: string({ max: 200 }), transform: trim },
  author:        { required: true,  check: string({ max: 120 }), transform: trim },
  isbn:          { required: true,  check: isbn13(),             transform: digitsOnly },
  publishedYear: { required: true,  check: integer({ min: 1450, max: new Date().getFullYear() }) },
  price:         { required: true,  check: money({ max: 10_000 }) },
  stock:         { required: true,  check: integer({ min: 0, max: 100_000 }) },
  genre:         { required: false, check: (v) => (GENRES.includes(v) ? null : `must be one of: ${GENRES.join(', ')}`) },
  description:   { required: false, check: string({ max: 2000 }), transform: trim },
};
