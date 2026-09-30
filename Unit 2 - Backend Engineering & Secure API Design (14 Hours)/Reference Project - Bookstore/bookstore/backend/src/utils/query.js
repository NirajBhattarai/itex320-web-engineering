import { badRequest } from './http-error.js';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ?page=2&limit=10 → { page: 2, limit: 10 }. Bad or missing values fall back to safe defaults.
export function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit };
}

// ?sort=-price → sorts by price descending. Only whitelisted fields are allowed.
export function sortItems(items, sortParam, allowedFields) {
  if (sortParam === undefined) return items;
  if (typeof sortParam !== 'string') throw badRequest('sort must be a single field name');

  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  if (!allowedFields.includes(field)) {
    throw badRequest(`Cannot sort by "${field}". Allowed: ${allowedFields.join(', ')}`);
  }

  const direction = desc ? -1 : 1;
  // Copy first: never mutate the caller's array.
  return [...items].sort((a, b) => {
    if (a[field] === b[field]) return 0;
    return a[field] > b[field] ? direction : -direction;
  });
}

// Slice one page out of an array and describe it.
export function paginate(items, { page, limit }) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = items.slice((page - 1) * limit, page * limit);
  return { data, meta: { page, limit, total, totalPages } };
}

// Build self/next/prev links from the incoming request so filters and sort are preserved.
export function pageLinks(req, { page, totalPages }) {
  const linkFor = (p) => {
    const url = new URL(req.originalUrl, 'http://placeholder'); // base is required but discarded
    url.searchParams.set('page', p);
    return url.pathname + url.search;
  };
  return {
    self: linkFor(page),
    next: page < totalPages ? linkFor(page + 1) : null,
    prev: page > 1 ? linkFor(page - 1) : null,
  };
}
