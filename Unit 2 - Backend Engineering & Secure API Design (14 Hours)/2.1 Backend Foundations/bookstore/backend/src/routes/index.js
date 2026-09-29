import { Router } from 'express';
import { createBooksRouter } from './books.routes.js';
import { createUsersRouter } from './users.routes.js';

// Everything under /api/v1. A future /api/v2 would get its own index file.
export function createApiRouter({ booksController, usersController }) {
  const router = Router();
  router.use('/books', createBooksRouter(booksController));
  router.use('/users', createUsersRouter(usersController));
  return router;
}
