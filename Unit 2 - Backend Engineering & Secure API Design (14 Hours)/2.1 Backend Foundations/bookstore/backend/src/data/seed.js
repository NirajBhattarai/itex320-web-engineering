// Sample data so the API (and the frontend) have something to show on first run.
// Goes through the services, so passwords are hashed and rules are enforced.

export const seedUsers = [
  {
    role: 'admin',
    data: {
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.admin@bookstore.test',
      password: 'Admin12345',
      phone: '+977-9800000001',
      dateOfBirth: '1990-04-15',
      address: { street: 'Durbar Marg 12', city: 'Kathmandu', postalCode: '44600', country: 'Nepal' },
    },
  },
  {
    role: 'customer',
    data: {
      firstName: 'Sita',
      lastName: 'Gurung',
      email: 'sita.gurung@bookstore.test',
      password: 'Customer123',
      phone: '+977-9800000002',
      dateOfBirth: '2002-11-03',
      address: { street: 'Lakeside Road 5', city: 'Pokhara', postalCode: '33700', country: 'Nepal' },
    },
  },
];

export const seedBooks = [
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '9781449373320', publishedYear: 2017, price: 45.99, stock: 12, genre: 'databases' },
  { title: 'JavaScript: The Definitive Guide', author: 'David Flanagan', isbn: '9781491952023', publishedYear: 2020, price: 39.5, stock: 8, genre: 'programming' },
  { title: 'Learning React', author: 'Alex Banks & Eve Porcello', isbn: '9781492051725', publishedYear: 2020, price: 34, stock: 0, genre: 'programming' },
  { title: 'Web Security for Developers', author: 'Malcolm McDonald', isbn: '9781593279943', publishedYear: 2020, price: 29.95, stock: 5, genre: 'security' },
  { title: 'Kubernetes: Up and Running', author: 'Brendan Burns, Joe Beda & Kelsey Hightower', isbn: '9781098110208', publishedYear: 2022, price: 49, stock: 3, genre: 'devops' },
];

export async function seedDatabase({ usersService, booksService }) {
  for (const { data, role } of seedUsers) await usersService.create(data, { role });
  for (const book of seedBooks) await booksService.create(book);
  console.log(`Seeded ${seedUsers.length} users and ${seedBooks.length} books`);
}
