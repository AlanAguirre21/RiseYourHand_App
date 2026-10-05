export default function StatusMessage({ loading, error }) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-text-muted">Cargando…</p>;
  }
  if (error) {
    return (
      <div role="alert" className="glass rounded-control border border-danger/25 bg-danger/10 p-4 text-sm text-danger">
        {error}
      </div>
    );
  }
  return null;
}
