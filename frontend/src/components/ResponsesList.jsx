import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import StatusMessage from './StatusMessage.jsx';
import { Input, Select } from './Input.jsx';
import { getForm } from '../api/forms.js';
import { PANEL } from '../constants/styles.js';
import { flattenQuestions, formatAnswer, formatComputed } from '../utils/answers.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

const PAGE_SIZES = [10, 25, 50, 100];
const ALL = 'all';

const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const userName = response => response.user?.name ?? 'Usuario eliminado';

export default function ResponsesList({ load, showUser = false, searchable = false, emptyText }) {
  const [data, setData]   = useState(null);  
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  useEffect(() => {
    let active = true;
    Promise.all([getForm(), load()])
      .then(([form, responses]) => { if (active) setData({ questions: flattenQuestions(form), responses }); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [load]);

  const searchTexts = useMemo(() => {
    if (!data || !searchable) return null;
    return new Map(data.responses.map(response => {
      const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
      return [response.id, normalize([
        dateFormat.format(new Date(response.createdAt)),
        showUser ? userName(response) : '',
        ...data.questions.map(q => formatAnswer(q, byKey.get(q.key))),
        ...response.computed.map(c => formatComputed(c.value)),
      ].join('\n'))];
    }));
  }, [data, searchable, showUser]);

  if (error) return <StatusMessage error={error} />;
  if (!data) return <StatusMessage loading />;
  if (data.responses.length === 0) {
    return <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>{emptyText}</p>;
  }

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matching = searchable && words.length > 0
    ? data.responses.filter(r => words.every(word => searchTexts.get(r.id).includes(word)))
    : data.responses;
  const shown = searchable && pageSize !== ALL ? matching.slice(0, pageSize) : matching;
  const total = matching.length;

  return (
    <>
      {searchable && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <Input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar en las respuestas…"
              aria-label="Buscar en las respuestas"
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
            Mostrar
            <Select
              block={false}
              value={pageSize}
              onChange={e => setPageSize(e.target.value === ALL ? ALL : Number(e.target.value))}
            >
              {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
              <option value={ALL}>Todas</option>
            </Select>
          </label>
        </div>
      )}
      <p className="text-sm text-text-muted">
        {shown.length < total && `Mostrando ${shown.length} de `}
        {total} {total === 1 ? 'respuesta' : 'respuestas'}
        {total < data.responses.length && ` (de ${data.responses.length} en total)`}
      </p>
      {total === 0 && (
        <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>Ninguna respuesta coincide con la búsqueda.</p>
      )}
      {shown.map(response => {
        const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
        return (
          <article key={response.id} className={`p-5 ${PANEL}`}>
            <p className="text-xs font-medium text-text-muted">
              {dateFormat.format(new Date(response.createdAt))}
              {showUser && ` · ${userName(response)}`}
            </p>
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {data.questions.map(q => (
                <div key={q.key} className="min-w-0">
                  <dt className="text-xs text-text-muted">{q.text}</dt>
                  <dd className="mt-0.5 whitespace-pre-line break-words font-medium text-text">
                    {formatAnswer(q, byKey.get(q.key))}
                  </dd>
                </div>
              ))}
              {response.computed.map(c => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-xs text-text-muted">{c.text}</dt>
                  <dd className="mt-0.5 font-medium text-text">{formatComputed(c.value)}</dd>
                </div>
              ))}
            </dl>
          </article>
        );
      })}
    </>
  );
}
