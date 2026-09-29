export default function Pagination({ meta, onPageChange }) {
  if (!meta) return null;
  return (
    <div className="pagination">
      <button disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
        ← Prev
      </button>
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <button disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
        Next →
      </button>
    </div>
  );
}
