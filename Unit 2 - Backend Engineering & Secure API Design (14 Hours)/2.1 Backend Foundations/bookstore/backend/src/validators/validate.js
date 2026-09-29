import { badRequest } from '../utils/http-error.js';

/**
 * Validate a request body against a schema.
 *
 * schema = { fieldName: { required: boolean, check: (value) => message|null, transform?: (value) => value } }
 *
 * - Unknown fields are rejected (stops "mass assignment", e.g. a client sending { "role": "admin" }).
 * - partial: true (for PATCH) makes every field optional but requires at least one.
 * - Returns a NEW object containing only the cleaned, allowed fields.
 */
export function validate(schema, body, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }

  const errors = [];
  const data = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = body[field];
    if (value === undefined) {
      if (rule.required && !partial) errors.push({ field, message: 'is required' });
      continue;
    }
    const message = rule.check(value);
    if (message) errors.push({ field, message });
    else data[field] = rule.transform ? rule.transform(value) : value;
  }

  for (const field of Object.keys(body)) {
    if (!(field in schema)) errors.push({ field, message: 'is not allowed' });
  }

  if (errors.length > 0) throw badRequest('Request body failed validation', errors);
  if (partial && Object.keys(data).length === 0) throw badRequest('Provide at least one field to update');

  return data;
}
