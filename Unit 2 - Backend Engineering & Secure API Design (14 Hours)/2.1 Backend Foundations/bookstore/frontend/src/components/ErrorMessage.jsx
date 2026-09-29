// Shows an ApiError, including every field-level validation message.
export default function ErrorMessage({ error }) {
  if (!error) return null;
  return (
    <div className="error" role="alert">
      <strong>{error.message}</strong>
      {error.errors?.length > 0 && (
        <ul>
          {error.errors.map((e) => (
            <li key={e.field}>
              <code>{e.field}</code> {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
