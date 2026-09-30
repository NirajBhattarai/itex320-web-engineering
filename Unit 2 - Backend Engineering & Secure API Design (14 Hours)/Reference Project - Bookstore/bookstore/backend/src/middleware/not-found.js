import { HttpError } from '../utils/http-error.js';

// Reached only when no route matched.
export function notFoundHandler(req, res, next) {
  next(new HttpError(404, 'Not Found', `No route for ${req.method} ${req.path}`));
}
