import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/container.js';
import { ISBNS, validBook } from '../fixtures.js';

const BOOKS = '/api/v1/books';

describe('Books API /api/v1/books', () => {
  let app;

  beforeEach(() => {
    app = createApp(createContainer()); // brand-new empty app → tests never affect each other
  });

  const createBook = (overrides) => request(app).post(BOOKS).send(validBook(overrides));

  it('full CRUD lifecycle: create → read → patch → put → delete', async () => {
    // CREATE
    const created = await createBook();
    expect(created.status).toBe(201);
    const { id } = created.body.data;
    expect(created.headers.location).toBe(`${BOOKS}/${id}`);

    // READ
    const read = await request(app).get(`${BOOKS}/${id}`);
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ id, title: validBook().title, isbn: '9781449373320' });

    // PATCH (partial)
    const patched = await request(app).patch(`${BOOKS}/${id}`).send({ price: 39.99, stock: 0 });
    expect(patched.status).toBe(200);
    expect(patched.body.data).toMatchObject({ price: 39.99, stock: 0, title: validBook().title });

    // PUT (full replace)
    const replaced = await request(app).put(`${BOOKS}/${id}`).send(validBook({ title: 'DDIA 2nd Edition' }));
    expect(replaced.status).toBe(200);
    expect(replaced.body.data.title).toBe('DDIA 2nd Edition');

    // DELETE, then it's gone
    expect((await request(app).delete(`${BOOKS}/${id}`)).status).toBe(204);
    expect((await request(app).get(`${BOOKS}/${id}`)).status).toBe(404);
  });

  describe('POST validation', () => {
    it('400 with a list of field errors', async () => {
      const res = await request(app).post(BOOKS).send({ title: '', price: 1.234, isbn: '123' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          { field: 'title', message: 'must not be empty' },
          { field: 'price', message: 'must have at most 2 decimal places' },
          { field: 'isbn', message: 'must be a 13-digit ISBN' },
          { field: 'author', message: 'is required' },
        ]),
      );
    });

    it('400 when the client tries to set id', async () => {
      const res = await createBook({ id: 'my-own-id' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual([{ field: 'id', message: 'is not allowed' }]);
    });

    it('409 for a duplicate ISBN (hyphens ignored)', async () => {
      await createBook();
      const res = await createBook({ isbn: '978-1-4493-7332-0' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET list: pagination, filtering, sorting', () => {
    beforeEach(async () => {
      await createBook({ title: 'Book A', isbn: ISBNS[0], price: 10, genre: 'security' });
      await createBook({ title: 'Book B', isbn: ISBNS[1], price: 20, genre: 'programming' });
      await createBook({ title: 'Book C', isbn: ISBNS[2], price: 30, genre: 'programming' });
    });

    it('returns data + meta + links', async () => {
      const res = await request(app).get(`${BOOKS}?limit=2`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
      expect(res.body.links).toEqual({ self: `${BOOKS}?limit=2&page=1`, next: `${BOOKS}?limit=2&page=2`, prev: null });
    });

    it('filters and sorts', async () => {
      const res = await request(app).get(`${BOOKS}?genre=programming&sort=-price`);
      expect(res.body.data.map((b) => b.title)).toEqual(['Book C', 'Book B']);
    });

    it('400 for a sort field that is not allowed', async () => {
      const res = await request(app).get(`${BOOKS}?sort=-secret`);
      expect(res.status).toBe(400);
      expect(res.body.detail).toMatch(/Cannot sort by "secret"/);
    });
  });

  it('404 for PATCH / PUT / DELETE on an unknown id', async () => {
    const missing = `${BOOKS}/00000000-0000-0000-0000-000000000000`;
    expect((await request(app).patch(missing).send({ price: 1 })).status).toBe(404);
    expect((await request(app).put(missing).send(validBook())).status).toBe(404);
    expect((await request(app).delete(missing)).status).toBe(404);
  });
});
