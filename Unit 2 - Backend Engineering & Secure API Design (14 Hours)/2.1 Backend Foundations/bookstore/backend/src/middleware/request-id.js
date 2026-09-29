import { randomUUID } from 'node:crypto';

// Give every request a correlation ID (reuse the one from Nginx if present).
// It is returned in the X-Request-Id header and included in logs and error responses.
export function requestId(req, res, next) {
  req.id = req.get('x-request-id') ?? randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
