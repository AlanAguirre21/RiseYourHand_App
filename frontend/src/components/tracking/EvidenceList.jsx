import { useEffect, useState } from 'react';
import StatusMessage from '../StatusMessage.jsx';
import { listEvidence } from '../../api/forms.js';
import { formatDateTime } from '../../utils/dates.js';

// The evidences of a manita, newest first. Loaded when shown; "version" reloads them (e.g. after
// a new one is added)
export default function EvidenceList({ responseId, version }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [enlarged, setEnlarged] = useState(null);   // id of the evidence whose picture is shown big

  useEffect(() => {
    let active = true;
    setError(null);
    listEvidence(responseId)
      .then(list => { if (active) setItems(list); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [responseId, version]);

  if (error) return <StatusMessage error={error} />;
  if (!items) return <p className="text-xs text-text-muted">Cargando evidencias…</p>;
  if (items.length === 0) return <p className="text-xs text-text-muted">Todavía no hay evidencias.</p>;

  return (
    <ol className="space-y-3">
      {items.map(e => (
        <li key={e.id} className="rounded-control border border-white/60 bg-white/40 p-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-text-muted">
            <span><strong className="text-text">{e.from}% → {e.to}%</strong> · {e.user?.name ?? 'Usuario eliminado'}</span>
            <span>{formatDateTime(e.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-line break-words text-text">{e.comment}</p>
          {e.image && (
            <button
              type="button"
              onClick={() => setEnlarged(id => (id === e.id ? null : e.id))}
              title={enlarged === e.id ? 'Reducir' : 'Ampliar'}
              className="mt-2 block"
            >
              <img
                src={e.image}
                alt={`Foto de la evidencia de ${e.from}% a ${e.to}%`}
                className={`rounded-control border border-border object-contain ${enlarged === e.id ? 'max-h-[70vh]' : 'max-h-28'}`}
              />
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}
