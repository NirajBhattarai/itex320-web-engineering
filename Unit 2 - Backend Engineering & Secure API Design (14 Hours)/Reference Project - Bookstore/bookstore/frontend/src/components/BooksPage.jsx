import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ErrorMessage from './ErrorMessage.jsx';
import Pagination from './Pagination.jsx';

const GENRES = ['programming', 'databases', 'security', 'devops', 'design', 'other'];
const EMPTY_FORM = { title: '', author: '', isbn: '', publishedYear: '', price: '', stock: '', genre: 'programming' };

export default function BooksPage() {
  const [filters, setFilters] = useState({ q: '', genre: '', sort: 'title', page: 1, limit: 5 });
  const [result, setResult] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Re-fetch whenever filters change or after a create/delete.
  useEffect(() => {
    api.listBooks(filters).then(setResult).catch(setLoadError);
  }, [filters, reloadKey]);

  const updateFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value, page: 1 }));

  async function handleCreate(event) {
    event.preventDefault();
    setFormError(null);
    try {
      await api.createBook({
        ...form,
        publishedYear: Number(form.publishedYear),
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setForm(EMPTY_FORM);
      setReloadKey((k) => k + 1);
    } catch (error) {
      setFormError(error); // shows the API's validation messages
    }
  }

  async function handleDelete(book) {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    await api.deleteBook(book.id);
    setReloadKey((k) => k + 1);
  }

  return (
    <section>
      <div className="toolbar">
        <input placeholder="Search title or author…" value={filters.q} onChange={(e) => updateFilter('q', e.target.value)} />
        <select value={filters.genre} onChange={(e) => updateFilter('genre', e.target.value)}>
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
          <option value="title">Title A→Z</option>
          <option value="-publishedYear">Newest</option>
          <option value="price">Price ↑</option>
          <option value="-price">Price ↓</option>
        </select>
      </div>

      <ErrorMessage error={loadError} />

      <table>
        <thead>
          <tr><th>Title</th><th>Author</th><th>Year</th><th>Genre</th><th>Price</th><th>Stock</th><th /></tr>
        </thead>
        <tbody>
          {result?.data.map((book) => (
            <tr key={book.id}>
              <td>{book.title}<br /><small>ISBN {book.isbn}</small></td>
              <td>{book.author}</td>
              <td>{book.publishedYear}</td>
              <td>{book.genre}</td>
              <td>${book.price.toFixed(2)}</td>
              <td className={book.stock === 0 ? 'out' : ''}>{book.stock === 0 ? 'Out of stock' : book.stock}</td>
              <td><button className="danger" onClick={() => handleDelete(book)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination meta={result?.meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />

      <h2>Add a book</h2>
      <form className="grid-form" onSubmit={handleCreate}>
        {['title', 'author', 'isbn', 'publishedYear', 'price', 'stock'].map((field) => (
          <label key={field}>
            {field}
            <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
          </label>
        ))}
        <label>
          genre
          <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
        <button type="submit">Create book</button>
      </form>
      <ErrorMessage error={formError} />
    </section>
  );
}
