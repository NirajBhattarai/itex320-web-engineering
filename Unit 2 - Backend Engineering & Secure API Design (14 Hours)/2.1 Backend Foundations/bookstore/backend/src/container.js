import { createBooksController } from './controllers/books.controller.js';
import { createUsersController } from './controllers/users.controller.js';
import { BooksRepository } from './repositories/books.repository.js';
import { UsersRepository } from './repositories/users.repository.js';
import { BooksService } from './services/books.service.js';
import { UsersService } from './services/users.service.js';

// Composition root: the ONE place where objects are created and wired together
// (Dependency Injection). Tests call createContainer() to get a fresh, empty app every time.
export function createContainer(overrides = {}) {
  const booksRepository = overrides.booksRepository ?? new BooksRepository();
  const usersRepository = overrides.usersRepository ?? new UsersRepository();

  const booksService = new BooksService(booksRepository);
  const usersService = new UsersService(usersRepository, { hash: overrides.hashPassword });

  return {
    booksService,
    usersService,
    booksController: createBooksController(booksService),
    usersController: createUsersController(usersService),
  };
}
