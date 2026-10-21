import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, CircleCheck, Medal, Search, Trash2 } from 'lucide-react';
import StatusMessage from './StatusMessage.jsx';
import ResponseEditor from './ResponseEditor.jsx';
import Button from './Button.jsx';
import ConfirmModal from './ui/ConfirmModal.jsx';
import { Input, Select } from './Input.jsx';
import { awardResponse, deleteResponse, getForm } from '../api/forms.js';
import { useLiveData } from '../hooks/useLiveData.js';
import { PANEL } from '../constants/styles.js';
import { ALL, PAGE_SIZES } from '../constants/lists.js';
import { TRACKING_KEYS, isDone } from '../constants/tracking.js';
import { flattenQuestions, formatAnswer, formatComputed, shownQuestions } from '../utils/answers.js';
import { formatDateTime } from '../utils/dates.js';



const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const userName = response => response.user?.name ?? 'Usuario eliminado';

const isFinished = response => isDone(response.tracking?.state);

// Each manita is in one of these: not finished yet, finished and waiting for its award, or awarded
const STATUS_FILTERS = {
  active:   { label: 'Manitas activas',    test: r => !isFinished(r) },
  finished: { label: 'Manitas terminadas', test: r => isFinished(r) && !r.awardedAt },
  awarded:  { label: 'Manitas premiadas',  test: r => isFinished(r) && Boolean(r.awardedAt) },
};

// "editable" turns each card into a form on click, and lets mark the finished manitas as awarded
// (the backend only lets admins do either). "championName" puts a medal on the manitas that have
// that user as their champion. "focusId" is a manita to scroll to and highlight (e.g. from the
// tracking page): every response is shown so it is on the page. "statusFilter" adds, next to the
// search, a filter for active, finished and awarded manitas. "grayFinished" shows every finished
// manita in the gray of the awarded ones, awarded or not, labelled just as finished. "deletable" adds
// a button to delete each manita for good (the backend only lets admins)
export default function ResponsesList({
  load, showUser = false, searchable = false, editable = false, championName = null, focusId = null,
  statusFilter = false, grayFinished = false, deletable = false, emptyText,
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(ALL);
  const [pageSize, setPageSize] = useState(focusId ? ALL : PAGE_SIZES[0]);
  const [editing, setEditing] = useState(() => new Set());   // ids of the responses being edited
  const [awarding, setAwarding] = useState(null);           // id of the response being saved
  const [awardError, setAwardError] = useState(null);       // { id, message }
  const [deleting, setDeleting] = useState(null);           // the response asked to be deleted
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const focused = useRef(false);

  const setEditingOf = (id, on) => setEditing(ids => {
    const next = new Set(ids);
    if (on) next.add(id); else next.delete(id);
    return next;
  });

  const fetchData = useCallback(
    () => Promise.all([getForm(), load()])
      .then(([form, responses]) => ({ questions: flattenQuestions(form), responses })),
    [load],
  );
  const { data, setData, error } = useLiveData(fetchData);

  const replace = updated => setData(d => ({ ...d, responses: d.responses.map(r => (r.id === updated.id ? updated : r)) }));

  // Once, when the list is first shown
  useEffect(() => {
    if (!data || !focusId || focused.current) return;
    focused.current = true;
    document.getElementById(`manita-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [data, focusId]);

  async function setAwarded(response, awarded) {
    setAwarding(response.id);
    setAwardError(null);
    try {
      replace(await awardResponse(response.id, awarded));
    } catch (err) {
      setAwardError({ id: response.id, message: err.message });
    } finally {
      setAwarding(null);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteResponse(deleting.id);
      setData(d => ({ ...d, responses: d.responses.filter(r => r.id !== deleting.id) }));
      setDeleting(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  const searchTexts = useMemo(() => {
    if (!data || !searchable) return null;
    return new Map(data.responses.map(response => {
      const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
      return [response.id, normalize([
        formatDateTime(response.createdAt),
        showUser ? userName(response) : '',
        ...data.questions.map(q => formatAnswer(q, byKey.get(q.key))),
        ...response.computed.map(c => formatComputed(c.value)),
        isFinished(response) ? 'manita terminada' : '',
        response.awardedAt ? 'manita premiada' : '',
      ].join('\n'))];
    }));
  }, [data, searchable, showUser]);

  if (error) return <StatusMessage error={error} />;
  if (!data) return <StatusMessage loading />;
  if (data.responses.length === 0) {
    return <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>{emptyText}</p>;
  }

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matching = data.responses
    .filter(r => !statusFilter || status === ALL || STATUS_FILTERS[status].test(r))
    .filter(r => !searchable || words.length === 0 || words.every(word => searchTexts.get(r.id).includes(word)));
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
          {statusFilter && (
            <Select block={false} value={status} onChange={e => setStatus(e.target.value)} aria-label="Filtrar por estado de la manita">
              <option value={ALL}>Todas las manitas</option>
              {Object.entries(STATUS_FILTERS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
            </Select>
          )}
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
        <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>
          {words.length === 0 && status !== ALL
            ? `No hay ${STATUS_FILTERS[status].label.toLowerCase()}.`
            : 'Ninguna respuesta coincide con la búsqueda.'}
        </p>
      )}
      {shown.map(response => {
        const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
        const isChampion = championName != null
          && data.questions.some(q => q.champions && byKey.get(q.key) === championName);
        const finished = isFinished(response);
        const awarded = Boolean(response.awardedAt);
        const reporter = byKey.get(TRACKING_KEYS.reporter);
        const payroll = byKey.get(TRACKING_KEYS.payroll);
        const pill = 'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2 pr-3 text-xs font-medium';
        const title = (
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-text-muted">
              {formatDateTime(response.createdAt)}
              {showUser && ` · ${userName(response)}`}
            </p>
            <div className="-mr-1 -mt-1 flex flex-wrap justify-end gap-2">
              {isChampion && (
                <span title="Eres el champion de esta manita" className={`${pill} bg-accent-soft text-accent`}>
                  <Medal size={16} aria-hidden="true" />
                  ¡Manita a mi cargo!
                </span>
              )}
              {grayFinished ? finished && (
                <span className={`${pill} bg-text-faint/15 text-text-muted`}>
                  <CircleCheck size={16} aria-hidden="true" />
                  Manita terminada
                </span>
              ) : awarded ? (
                <span className={`${pill} bg-text-faint/15 text-text-muted`}>
                  <Award size={16} aria-hidden="true" />
                  Manita premiada
                </span>
              ) : finished && (
                <span className={`${pill} bg-success/15 text-success`}>
                  <CircleCheck size={16} aria-hidden="true" />
                  Manita terminada
                </span>
              )}
            </div>
          </div>
        );
        // Who reported a finished manita, to give them their award
        const winner = finished && (reporter || payroll) && (
          <p className={`mt-2 text-sm font-medium ${awarded ? 'text-text-muted' : 'text-success'}`}>
            Reportó: {reporter ?? 'Sin nombre'}{payroll != null && payroll !== '' && ` · Nómina ${payroll}`}
          </p>
        );
        if (editing.has(response.id)) {
          return (
            // Raised while its users panel is open, so the panel lies over the cards below
            <article id={`manita-${response.id}`} key={response.id} className={`relative p-5 ring-2 ring-accent/30 has-[[data-user-panel]]:z-20 ${PANEL}`}>
              {title}
              <ResponseEditor
                response={response}
                questions={data.questions}
                onSaved={updated => {
                  replace(updated);
                  setEditingOf(response.id, false);
                }}
                onCancel={() => setEditingOf(response.id, false)}
              />
            </article>
          );
        }
        const editProps = editable && {
          role: 'button',
          tabIndex: 0,
          title: 'Editar respuesta',
          onClick: () => setEditingOf(response.id, true),
          onKeyDown: e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditingOf(response.id, true); }
          },
        };
        // Awarded ones in gray (and every finished one with "grayFinished"); finished ones outlined
        // in green; the one linked to, in blue
        const gray = awarded || (grayFinished && finished);
        const tone = [
          gray && 'opacity-70 grayscale',
          response.id === focusId ? 'ring-2 ring-accent' : finished && !gray && 'ring-2 ring-success/40',
        ].filter(Boolean).join(' ');
        return (
          <article
            id={`manita-${response.id}`}
            key={response.id}
            {...editProps}
            className={`p-5 ${PANEL} ${tone} ${editable ? 'cursor-pointer transition-all hover:bg-white/60 hover:ring-2 hover:ring-accent/30' : ''}`}
          >
            {title}
            {winner}
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {shownQuestions(data.questions, byKey).map(q => (
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
            {((editable && finished) || deletable) && (
              // Its clicks must not open the editor of the card
              <div
                className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/50 pt-3"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
              >
                {editable && finished && (awarded ? (
                  <Button size="sm" onClick={() => setAwarded(response, false)} disabled={awarding === response.id}>
                    {awarding === response.id ? 'Guardando…' : 'Quitar premio'}
                  </Button>
                ) : (
                  <Button size="sm" variant="success" onClick={() => setAwarded(response, true)} disabled={awarding === response.id}>
                    <Award size={14} /> {awarding === response.id ? 'Guardando…' : 'Marcar como premiada'}
                  </Button>
                ))}
                {awarded && <span className="text-xs text-text-muted">Premiada el {formatDateTime(response.awardedAt)}</span>}
                {awardError?.id === response.id && <span role="alert" className="text-xs text-danger">{awardError.message}</span>}
                {deletable && (
                  <Button size="sm" className="ml-auto" onClick={() => setDeleting(response)}>
                    <Trash2 size={14} /> Eliminar
                  </Button>
                )}
              </div>
            )}
          </article>
        );
      })}
      {deletable && (
        <ConfirmModal
          open={deleting !== null}
          title={deleting?.folio != null ? `¿Eliminar la manita ${deleting.folio}?` : '¿Eliminar esta manita?'}
          confirmLabel="Eliminar"
          busyLabel="Eliminando…"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => { setDeleting(null); setDeleteError(null); }}
        >
          <p>Dejará de aparecer en todas las páginas, en el dashboard y en la exportación a Power BI. También se eliminan sus evidencias.</p>
          <p className="mt-2">Esta acción no se puede deshacer.</p>
        </ConfirmModal>
      )}
    </>
  );
}
