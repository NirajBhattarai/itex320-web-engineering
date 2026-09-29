import { conflict, notFound, badRequest } from '../utils/http-error.js';
import { paginate, parsePagination, sortItems } from '../utils/query.js';

const SORTABLE_FIELDS = ['title', 'author', 'publishedYear', 'price', 'stock', 'createdAt'];

// Optional fields always exist in the stored object, so every book has the same shape.
const withDefaults = (data) => ({ ...data, genre: data.genre ?? 'other', description: data.description ?? null });

const toNumber = (value, name) => {
  const n = Number(value);
  if (value === '' || Number.isNaN(n)) throw badRequest(`${name} must be a number`);
  return n;
};

// Business rules for books. Knows nothing about HTTP (no req/res) — easy to unit test.
export class BooksService {
  constructor(booksRepository) {
    this.books = booksRepository; // injected: in-memory now, PostgreSQL in Unit 3
  }

  // query = { q, author, genre, minPrice, maxPrice, inStock, sort, page, limit }
  async list(query = {}) {
    let items = await this.books.findAll();

    if (typeof query.q === 'string' && query.q.trim()) {
      const needle = query.q.trim().toLowerCase();
      items = items.filter((b) => b.title.toLowerCase().includes(needle) || b.author.toLowerCase().includes(needle));
    }
    if (typeof query.author === 'string') {
      const needle = query.author.toLowerCase();
      items = items.filter((b) => b.author.toLowerCase().includes(needle));
    }
    if (typeof query.genre === 'string') {
      items = items.filter((b) => b.genre === query.genre);
    }
    if (query.minPrice !== undefined) {
      const min = toNumber(query.minPrice, 'minPrice');
      items = items.filter((b) => b.price >= min);
    }
    if (query.maxPrice !== undefined) {
      const max = toNumber(query.maxPrice, 'maxPrice');
      items = items.filter((b) => b.price <= max);
    }
    if (query.inStock === 'true') {
      items = items.filter((b) => b.stock > 0);
    }

    items = sortItems(items, query.sort ?? 'title', SORTABLE_FIELDS);
    return paginate(items, parsePagination(query));
  }

  async getById(id) {
    const book = await this.books.findById(id);
    if (!book) throw notFound(`Book ${id} does not exist`);
    return book;
  }

  async create(data) {
    await this.#assertIsbnAvailable(data.isbn);
    return this.books.create(withDefaults(data));
  }

  // PUT: full replacement — optional fields that are not sent go back to their defaults.
  async replace(id, data) {
    await this.getById(id);
    await this.#assertIsbnAvailable(data.isbn, id);
    return this.books.update(id, withDefaults(data));
  }

  // PATCH: only the given fields change.
  async update(id, changes) {
    await this.getById(id);
    if (changes.isbn) await this.#assertIsbnAvailable(changes.isbn, id);
    return this.books.update(id, changes);
  }

  async remove(id) {
    await this.getById(id);
    await this.books.delete(id);
  }

  // ISBNs are unique. exceptId lets a book keep its own ISBN when it is updated.
  async #assertIsbnAvailable(isbn, exceptId) {
    const existing = await this.books.findByIsbn(isbn);
    if (existing && existing.id !== exceptId) throw conflict(`A book with ISBN ${isbn} already exists`);
  }
}
