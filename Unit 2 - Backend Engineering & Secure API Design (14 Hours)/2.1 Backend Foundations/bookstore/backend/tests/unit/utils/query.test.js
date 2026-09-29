import { describe, expect, it } from 'vitest';
import { MAX_LIMIT, pageLinks, paginate, parsePagination, sortItems } from '../../../src/utils/query.js';

describe('parsePagination()', () => {
  it('uses defaults when nothing is given', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20 });
  });

  it('caps limit at MAX_LIMIT', () => {
    expect(parsePagination({ limit: '100000' }).limit).toBe(MAX_LIMIT);
  });

  it.each([
    [{ page: '0' }, 1],
    [{ page: '-3' }, 1],
    [{ page: 'abc' }, 1],
    [{ page: '4' }, 4],
  ])('%j → page %i', (query, expected) => {
    expect(parsePagination(query).page).toBe(expected);
  });
});

describe('sortItems()', () => {
  const items = [{ n: 2 }, { n: 3 }, { n: 1 }];

  it('sorts ascending and descending', () => {
    expect(sortItems(items, 'n', ['n']).map((i) => i.n)).toEqual([1, 2, 3]);
    expect(sortItems(items, '-n', ['n']).map((i) => i.n)).toEqual([3, 2, 1]);
  });

  it('does not mutate the input array', () => {
    sortItems(items, 'n', ['n']);
    expect(items.map((i) => i.n)).toEqual([2, 3, 1]);
  });

  it('rejects fields that are not whitelisted', () => {
    expect(() => sortItems(items, '-passwordHash', ['n'])).toThrow(/Cannot sort by "passwordHash"/);
  });

  it('rejects repeated sort params (?sort=a&sort=b arrives as an array)', () => {
    expect(() => sortItems(items, ['n', 'n'], ['n'])).toThrow(/single field/);
  });
});

describe('paginate()', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it('returns the requested slice and metadata', () => {
    const { data, meta } = paginate(items, { page: 3, limit: 10 });
    expect(data).toEqual([21, 22, 23, 24, 25]);
    expect(meta).toEqual({ page: 3, limit: 10, total: 25, totalPages: 3 });
  });

  it('reports totalPages = 1 for an empty list', () => {
    expect(paginate([], { page: 1, limit: 10 }).meta.totalPages).toBe(1);
  });
});

describe('pageLinks()', () => {
  it('keeps existing query params and sets page', () => {
    const req = { originalUrl: '/api/v1/books?sort=-price&page=2&limit=5' };
    expect(pageLinks(req, { page: 2, totalPages: 3 })).toEqual({
      self: '/api/v1/books?sort=-price&page=2&limit=5',
      next: '/api/v1/books?sort=-price&page=3&limit=5',
      prev: '/api/v1/books?sort=-price&page=1&limit=5',
    });
  });
});
