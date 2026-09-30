import { useState } from 'react';
import BooksPage from './components/BooksPage.jsx';
import UsersPage from './components/UsersPage.jsx';

export default function App() {
  const [tab, setTab] = useState('books');

  return (
    <main>
      <header>
        <h1>📚 Bookstore</h1>
        <nav>
          <button className={tab === 'books' ? 'active' : ''} onClick={() => setTab('books')}>Books</button>
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Users</button>
        </nav>
      </header>
      {tab === 'books' ? <BooksPage /> : <UsersPage />}
    </main>
  );
}
