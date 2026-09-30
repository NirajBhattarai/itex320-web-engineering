// All HTTP calls to the backend live here. Components never call fetch() directly.
const BASE_URL = '/api/v1';

// Wraps an RFC 9457 Problem Details response from the API.
export class ApiError extends Error {
  constructor(problem) {
    super(problem.detail ?? problem.title ?? 'Request failed');
    this.status = problem.status;
    this.errors = problem.errors ?? []; // [{ field, message }] for validation failures
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null; // DELETE → No Content

  const json = await response.json().catch(() => ({ title: response.statusText, status: response.status }));
  if (!response.ok) throw new ApiError(json);
  return json;
}

// Drop empty values so optional fields are simply not sent.
const toQuery = (params) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)).toString();

export const api = {
  listBooks: (params = {}) => request(`/books?${toQuery(params)}`),
  createBook: (book) => request('/books', { method: 'POST', body: book }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),

  listUsers: (params = {}) => request(`/users?${toQuery(params)}`),
  getUser: (id) => request(`/users/${id}`),
  createUser: (user) => request('/users', { method: 'POST', body: user }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};
