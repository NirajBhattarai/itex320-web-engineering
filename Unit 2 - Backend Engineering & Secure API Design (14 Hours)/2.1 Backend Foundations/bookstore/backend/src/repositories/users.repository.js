import { InMemoryRepository } from './in-memory.repository.js';

export class UsersRepository extends InMemoryRepository {
  findByEmail(email) {
    return this.findOne((user) => user.email === email.toLowerCase());
  }
}
