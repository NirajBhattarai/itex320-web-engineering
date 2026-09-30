import { HttpError } from '../utils/http-error.js';

// The ONE place that turns errors into HTTP responses (RFC 9457 Problem Details).
// Express recognises error handlers by their 4 parameters, so `next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // HttpError → our status; body-parser errors carry err.status (400 bad JSON, 413 too large).
  const status = err instanceof HttpError ? err.status : (err.status ?? err.statusCode ?? 500);
  const isServerError = status >= 500;

  // Log full details for 5xx; never send stack traces to the client.
  if (isServerError) console.error({ requestId: req.id, err });

  res
    .status(status)
    .type('application/problem+json')
    .json({
      type: 'about:blank',
      title: err.title ?? (isServerError ? 'Internal Server Error' : 'Bad Request'),
      status,
      detail: isServerError ? 'An unexpected error occurred' : (err.detail ?? err.message),
      instance: req.originalUrl,
      requestId: req.id,
      ...(err.extras ?? {}),
    });
}
