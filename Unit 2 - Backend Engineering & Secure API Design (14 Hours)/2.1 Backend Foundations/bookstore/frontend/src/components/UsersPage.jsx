import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import ErrorMessage from './ErrorMessage.jsx';
import Pagination from './Pagination.jsx';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', password: '', phone: '', dateOfBirth: '',
  street: '', city: '', postalCode: '', country: '',
};

// Turn the flat form into the API's shape, leaving out optional fields that are empty.
function toUserBody(form) {
  const { street, city, postalCode, country, ...rest } = form;
  const body = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== ''));
  if (street || city || country) {
    body.address = { street, city, country, ...(postalCode && { postalCode }) };
  }
  return body;
}

export default function UsersPage() {
  const [filters, setFilters] = useState({ q: '', role: '', page: 1, limit: 5 });
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.listUsers(filters).then(setResult).catch(setFormError);
  }, [filters, reloadKey]);

  async function showDetails(id) {
    const { data } = await api.getUser(id);
    setSelected(data);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError(null);
    try {
      await api.createUser(toUserBody(form));
      setForm(EMPTY_FORM);
      setReloadKey((k) => k + 1);
    } catch (error) {
      setFormError(error);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) return;
    await api.deleteUser(user.id);
    setSelected(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <section>
      <div className="toolbar">
        <input
          placeholder="Search name or email…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
        />
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}>
          <option value="">All roles</option>
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th /></tr>
        </thead>
        <tbody>
          {result?.data.map((user) => (
            <tr key={user.id} className="clickable" onClick={() => showDetails(user.id)}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td><span className={`badge ${user.role}`}>{user.role}</span></td>
              <td>{user.address?.city ?? '—'}</td>
              <td>
                <button className="danger" onClick={(e) => { e.stopPropagation(); handleDelete(user); }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination meta={result?.meta} onPageChange={(page) => setFilters({ ...filters, page })} />

      {selected && (
        <div className="card">
          <h3>{selected.firstName} {selected.lastName} <span className={`badge ${selected.role}`}>{selected.role}</span></h3>
          <dl>
            <dt>Email</dt><dd>{selected.email}</dd>
            <dt>Phone</dt><dd>{selected.phone ?? '—'}</dd>
            <dt>Date of birth</dt><dd>{selected.dateOfBirth ?? '—'}</dd>
            <dt>Address</dt>
            <dd>
              {selected.address
                ? `${selected.address.street}, ${selected.address.city} ${selected.address.postalCode ?? ''}, ${selected.address.country}`
                : '—'}
            </dd>
            <dt>Member since</dt><dd>{new Date(selected.createdAt).toLocaleDateString()}</dd>
          </dl>
          <button onClick={() => setSelected(null)}>Close</button>
        </div>
      )}

      <h2>Register a user</h2>
      <form className="grid-form" onSubmit={handleCreate}>
        {Object.keys(EMPTY_FORM).map((field) => (
          <label key={field}>
            {field}
            <input
              type={field === 'password' ? 'password' : field === 'dateOfBirth' ? 'date' : 'text'}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </label>
        ))}
        <button type="submit">Create user</button>
      </form>
      <ErrorMessage error={formError} />
    </section>
  );
}
