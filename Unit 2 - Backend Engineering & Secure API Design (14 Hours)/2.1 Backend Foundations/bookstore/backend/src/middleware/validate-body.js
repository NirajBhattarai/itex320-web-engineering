import { validate } from '../validators/validate.js';

// Route-level middleware: validate req.body against a schema, then replace it
// with the cleaned version so controllers only ever see safe, known fields.
export const validateBody = (schema, options) => (req, res, next) => {
  req.body = validate(schema, req.body, options);
  next();
};
