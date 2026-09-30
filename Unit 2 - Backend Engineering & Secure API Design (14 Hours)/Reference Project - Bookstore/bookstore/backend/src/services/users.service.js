import { conflict, notFound } from '../utils/http-error.js';
import { hashPassword } from '../utils/password.js';
import { paginate, parsePagination, sortItems } from '../utils/query.js';

const SORTABLE_FIELDS = ['firstName', 'lastName', 'email', 'createdAt'];
export const ROLES = ['customer', 'admin'];

// Optional fields are stored as null so every user has the same shape.
const withDefaults = (profile) => ({
  ...profile,
  phone: profile.phone ?? null,
  dateOfBirth: profile.dateOfBirth ?? null,
  address: profile.address ?? null,
});

// The ONLY way a user leaves this service: without the password hash.
export const toPublicUser = ({ passwordHash, ...user }) => user;

export class UsersService {
  // `hash` is injectable so unit tests can use a fast fake instead of real scrypt.
  constructor(usersRepository, { hash = hashPassword } = {}) {
    this.users = usersRepository;
    this.hash = hash;
  }

  // query = { q, role, sort, page, limit }
  async list(query = {}) {
    let items = await this.users.findAll();

    if (typeof query.q === 'string' && query.q.trim()) {
      const needle = query.q.trim().toLowerCase();
      items = items.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(needle),
      );
    }
    if (typeof query.role === 'string') {
      items = items.filter((u) => u.role === query.role);
    }

    items = sortItems(items, query.sort ?? 'lastName', SORTABLE_FIELDS);
    const page = paginate(items, parsePagination(query));
    return { ...page, data: page.data.map(toPublicUser) };
  }

  async getById(id) {
    const user = await this.users.findById(id);
    if (!user) throw notFound(`User ${id} does not exist`);
    return toPublicUser(user);
  }

  // `role` is a second argument, NOT part of the request body — only trusted code (seed, admin tools) sets it.
  async create(data, { role = 'customer' } = {}) {
    await this.#assertEmailAvailable(data.email);
    const { password, ...profile } = data;
    const passwordHash = await this.hash(password);
    const user = await this.users.create({ ...withDefaults(profile), role, passwordHash });
    return toPublicUser(user);
  }

  async update(id, changes) {
    await this.getById(id);
    if (changes.email) await this.#assertEmailAvailable(changes.email, id);
    return toPublicUser(await this.users.update(id, changes));
  }

  async remove(id) {
    await this.getById(id);
    await this.users.delete(id);
  }

  async #assertEmailAvailable(email, exceptId) {
    const existing = await this.users.findByEmail(email);
    if (existing && existing.id !== exceptId) throw conflict(`Email ${email} is already registered`);
  }
}
