import { randomUUID } from 'node:crypto';

// A tiny in-memory "database table". Every method is async on purpose:
// in Unit 3 we replace this class with a Prisma/PostgreSQL repository that has the
// SAME method names, and the services above it won't need to change.
export class InMemoryRepository {
  #rows = new Map();

  async findAll() {
    return [...this.#rows.values()].map((row) => structuredClone(row));
  }

  async findById(id) {
    const row = this.#rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findOne(predicate) {
    for (const row of this.#rows.values()) {
      if (predicate(row)) return structuredClone(row);
    }
    return null;
  }

  async create(data) {
    const now = new Date().toISOString();
    const row = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.#rows.set(row.id, row);
    return structuredClone(row);
  }

  async update(id, changes) {
    const existing = this.#rows.get(id);
    if (!existing) return null;
    // id and createdAt can never be overwritten.
    const row = { ...existing, ...changes, id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    this.#rows.set(id, row);
    return structuredClone(row);
  }

  async delete(id) {
    return this.#rows.delete(id);
  }
}
