import { beforeEach, describe, expect, it } from 'vitest';
import { BooksRepository } from '../../../src/repositories/books.repository.js';
import { BooksService } from '../../../src/services/books.service.js';
import { ISBNS, validBook } from '../../fixtures.js';

// Unit tests: the service with a real in-memory repository (fast, no HTTP, no server).
describe('BooksService', () => {
  let service;

  beforeEach(() => {
    service = new BooksService(new BooksRepository()); // fresh, empty store for every test
  });

  describe('create()', () => {
    it('stores a book with id, timestamps and default optional fields', async () => {
      const { genre, ...withoutGenre } = validBook();
      const book = await service.create(withoutGenre);
      expect(book).toMatchObject({ title: withoutGenre.title, genre: 'other', description: null });
      expect(book.id).toEqual(expect.any(String));
      expect(book.createdAt).toBe(book.updatedAt);
    });

    it('rejects a duplicate ISBN with 409', async () => {
      await service.create(validBook());
      await expect(service.create(validBook({ title: 'Copy' }))).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('getById()', () => {
    it('throws 404 for an unknown id', async () => {
      await expect(service.getById('nope')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('list()', () => {
    beforeEach(async () => {
      await service.create(validBook({ title: 'C Book', isbn: ISBNS[0], price: 30, stock: 0, genre: 'programming' }));
      await service.create(validBook({ title: 'A Book', isbn: ISBNS[1], price: 10, stock: 5, genre: 'security' }));
      await service.create(validBook({ title: 'B Book', isbn: ISBNS[2], price: 20, stock: 1, genre: 'programming' }));
    });

    it('sorts by title by default', async () => {
      const { data } = await service.list();
      expect(data.map((b) => b.title)).toEqual(['A Book', 'B Book', 'C Book']);
    });

    it('filters by genre, price range and stock', async () => {
      expect((await service.list({ genre: 'programming' })).meta.total).toBe(2);
      expect((await service.list({ minPrice: '15', maxPrice: '25' })).data.map((b) => b.title)).toEqual(['B Book']);
      expect((await service.list({ inStock: 'true' })).meta.total).toBe(2);
    });

    it('searches title and author with q', async () => {
      expect((await service.list({ q: 'a book' })).meta.total).toBe(1);
      expect((await service.list({ q: 'kleppmann' })).meta.total).toBe(3);
    });

    it('rejects a non-numeric price filter', async () => {
      await expect(service.list({ minPrice: 'cheap' })).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('replace() vs update()', () => {
    it('PUT resets optional fields that were not sent; PATCH keeps them', async () => {
      const book = await service.create(validBook({ description: 'Great book' }));

      const patched = await service.update(book.id, { price: 50 });
      expect(patched).toMatchObject({ price: 50, description: 'Great book' });

      const { description, genre, ...required } = validBook();
      const replaced = await service.replace(book.id, required);
      expect(replaced).toMatchObject({ description: null, genre: 'other' });
    });

    it('lets a book keep its own ISBN but not take another one', async () => {
      const a = await service.create(validBook());
      const b = await service.create(validBook({ isbn: ISBNS[0] }));

      await expect(service.update(a.id, { isbn: a.isbn })).resolves.toBeDefined();
      await expect(service.update(b.id, { isbn: a.isbn })).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('remove()', () => {
    it('deletes the book, and a second delete is 404', async () => {
      const book = await service.create(validBook());
      await service.remove(book.id);
      await expect(service.remove(book.id)).rejects.toMatchObject({ status: 404 });
    });
  });
});
