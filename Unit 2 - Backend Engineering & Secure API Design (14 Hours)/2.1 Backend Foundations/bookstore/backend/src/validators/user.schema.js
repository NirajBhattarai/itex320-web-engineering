import { email, lowercase, object, password, pastDate, phone, string, trim } from './rules.js';

const addressShape = {
  street:     { required: true,  check: string({ max: 120 }) },
  city:       { required: true,  check: string({ max: 80 }) },
  postalCode: { required: false, check: string({ max: 20 }) },
  country:    { required: true,  check: string({ max: 80 }) },
};

// NOTE: "role" is deliberately NOT here. Clients must never choose their own role.
// New users are always "customer"; Topic 2.3 adds an admin-only endpoint to change roles.
export const createUserSchema = {
  firstName:   { required: true,  check: string({ max: 50 }), transform: trim },
  lastName:    { required: true,  check: string({ max: 50 }), transform: trim },
  email:       { required: true,  check: email(),             transform: lowercase },
  password:    { required: true,  check: password() },
  phone:       { required: false, check: phone(),             transform: trim },
  dateOfBirth: { required: false, check: pastDate() },
  address:     { required: false, check: object(addressShape) },
};

// Profile updates: same fields minus password (password changes get their own flow in Topic 2.3).
const { password: _omitPassword, ...updatableFields } = createUserSchema;
export const updateUserSchema = updatableFields;
