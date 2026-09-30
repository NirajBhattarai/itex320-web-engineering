// Factories for valid request bodies. Tests override only the fields they care about.

export const validBook = (overrides = {}) => ({
  title: 'Designing Data-Intensive Applications',
  author: 'Martin Kleppmann',
  isbn: '9781449373320',
  publishedYear: 2017,
  price: 45.99,
  stock: 12,
  genre: 'databases',
  ...overrides,
});

export const validUser = (overrides = {}) => ({
  firstName: 'Sita',
  lastName: 'Gurung',
  email: 'sita@example.com',
  password: 'Secret123',
  phone: '+977-9800000002',
  dateOfBirth: '2002-11-03',
  address: { street: 'Lakeside Road 5', city: 'Pokhara', postalCode: '33700', country: 'Nepal' },
  ...overrides,
});

// More real ISBN-13s (valid checksums) for tests that need several distinct books.
export const ISBNS = ['9781491952023', '9781492051725', '9781593279943', '9781098110208', '9780134757599'];
