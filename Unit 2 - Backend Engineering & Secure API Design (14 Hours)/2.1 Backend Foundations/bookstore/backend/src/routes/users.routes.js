import { Router } from 'express';
import { validateBody } from '../middleware/validate-body.js';
import { createUserSchema, updateUserSchema } from '../validators/user.schema.js';

export function createUsersRouter(controller) {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', validateBody(createUserSchema), controller.create);
  router.patch('/:id', validateBody(updateUserSchema, { partial: true }), controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
