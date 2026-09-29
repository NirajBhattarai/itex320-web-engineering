import { Router } from 'express';
import { validateBody } from '../middleware/validate-body.js';
import { bookSchema } from '../validators/book.schema.js';

// Routes only map URL + method → [middleware..., controller]. Nothing else.
export function createBooksRouter(controller) {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', validateBody(bookSchema), controller.create);
  router.put('/:id', validateBody(bookSchema), controller.replace);
  router.patch('/:id', validateBody(bookSchema, { partial: true }), controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
