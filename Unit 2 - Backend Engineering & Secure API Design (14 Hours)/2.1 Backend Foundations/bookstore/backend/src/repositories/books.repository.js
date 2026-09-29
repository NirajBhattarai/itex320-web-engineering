import { InMemoryRepository } from './in-memory.repository.js';

export class BooksRepository extends InMemoryRepository {
  findByIsbn(isbn) {
    return this.findOne((book) => book.isbn === isbn);
  }
}
