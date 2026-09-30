// An Error that knows its HTTP status. The error-handler middleware turns it into
// an RFC 9457 "Problem Details" JSON response.
export class HttpError extends Error {
  constructor(status, title, detail, extras = {}) {
    super(detail ?? title);
    this.name = 'HttpError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.extras = extras; // extra JSON fields, e.g. { errors: [...] }
  }
}

export const badRequest = (detail, errors) =>
  new HttpError(400, 'Bad Request', detail, errors ? { errors } : {});

export const notFound = (detail) => new HttpError(404, 'Not Found', detail);

export const conflict = (detail) => new HttpError(409, 'Conflict', detail);
