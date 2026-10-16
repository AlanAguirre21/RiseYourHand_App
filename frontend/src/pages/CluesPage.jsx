import { useState } from 'react';
import { Play, Search } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import Button from '../components/Button.jsx';
import { Input, Select } from '../components/Input.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLiveData } from '../hooks/useLiveData.js';
import { listTracking, updateResponseTracking } from '../api/forms.js';
import { PANEL } from '../constants/styles.js';
import { TRACKING_KEYS, TRACKING_STATES, isDone } from '../constants/tracking.js';
import { computedValue, sameName } from '../utils/answers.js';
import { ROLES } from '../constants/roles.js';

const answerOf = (response, key) => response.answers.find(a => a.questionKey === key)?.value;
import { formatDate, formatDay } from '../utils/dates.js';
import EvidenceModal from '../components/tracking/EvidenceModal.jsx';
import EvidenceList from '../components/tracking/EvidenceList.jsx';

const showDay = value => formatDay(value) || 'Sin fecha';
const days = n => `${n} ${n === 1 ? 'día' : 'días'}`;

const PROGRESS_STEP = 5;
const KNOB_PX = 20;   // the "size-5" circle at the end of the progress bar
const ALL = 'all';

const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Subtitle of a card: who reported the manita, its champion and its area
const subtitleParts = answers => [
  answers.get(TRACKING_KEYS.reporter),
  answers.get(TRACKING_KEYS.champion),
  answers.get(TRACKING_KEYS.area),
].filter(Boolean);

// The text the search looks into: what the card shows as its title and subtitle
function searchText(response) {
  const answers = new Map(response.answers.map(a => [a.questionKey, a.value]));
  return normalize([computedValue(response, TRACKING_KEYS.name), ...subtitleParts(answers)].filter(Boolean).join('\n'));
}

// Where today falls between the creation and the expiration dates
function timeText({ state, totalDays, elapsedDays, completedAt }) {
  if (isDone(state)) return `Terminada el ${formatDate(completedAt)}`;
  if (totalDays == null || elapsedDays == null) return 'Sin fechas';
  if (elapsedDays < 0) return `Empieza en ${days(-elapsedDays)}`;
  if (elapsedDays > totalDays) return `Venció hace ${days(elapsedDays - totalDays)}`;
  if (elapsedDays === totalDays) return 'Vence hoy';
  return `Día ${elapsedDays} de ${totalDays} · quedan ${days(totalDays - elapsedDays)}`;
}

function timePercent({ totalDays, elapsedDays }) {
  if (totalDays == null || elapsedDays == null) return 0;
  if (totalDays <= 0) return elapsedDays >= 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
}

// Finished ones last; the rest by how close their expiration date is (expired first)
function byUrgency(a, b) {
  const done = isDone(a.tracking.state) - isDone(b.tracking.state);
  if (done !== 0) return done;
  const left = r => (r.tracking.totalDays ?? Infinity) - (r.tracking.elapsedDays ?? 0);
  return left(a) - left(b);
}

// "evidenceOptional": admins may save a new progress without evidence
function ManitaCard({ response, canEdit, evidenceOptional, onSaved }) {
  const { tracking } = response;
  const [draft, setDraft] = useState(null);   // progress while the bar is being dragged
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);   // new progress waiting for its evidence
  const [evidenceError, setEvidenceError] = useState(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceVersion, setEvidenceVersion] = useState(0);   // reloads the list after a new one

  const answers = new Map(response.answers.map(a => [a.questionKey, a.value]));
  const state = TRACKING_STATES[tracking.state];
  const progress = draft ?? tracking.progress;
  const overdue = tracking.state === 'overdue';
  const editable = canEdit && tracking.started;
  // Centre of the white circle: it stays inside the bar at 0% and at 100%
  const knobLeft = `calc(${progress}% + ${(0.5 - progress / 100) * KNOB_PX}px)`;
  const today = timePercent(tracking);
  const subtitle = subtitleParts(answers).join(' · ');

  async function save(data) {
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateResponseTracking(response.id, data));
    } catch (err) {
      setError(err.message);
    } finally {
      setDraft(null);
      setBusy(false);
    }
  }

  // Runs when the drag ends, and again when the bar loses the focus. A new progress is saved only
  // with its evidence: the window asks for it, and cancelling puts the bar back
  function commit() {
    if (busy || pending !== null) return;
    if (draft !== null && draft !== tracking.progress) {
      setEvidenceError(null);
      setPending(draft);
    } else {
      setDraft(null);
    }
  }

  async function saveProgress(evidence) {
    setBusy(true);
    setEvidenceError(null);
    try {
      onSaved(await updateResponseTracking(response.id, evidence ? { progress: pending, evidence } : { progress: pending }));
      setPending(null);
      setDraft(null);
      setEvidenceVersion(v => v + 1);
    } catch (err) {
      setEvidenceError(err.message);   // shown in the window, which stays open
    } finally {
      setBusy(false);
    }
  }

  function cancelProgress() {
    setPending(null);
    setDraft(null);
  }

  return (
    <article className={`p-5 ${PANEL}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words font-semibold text-text">{computedValue(response, TRACKING_KEYS.name) ?? 'Manita sin nombre'}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${state.badge}`}>{state.label}</span>
      </div>

      {/* Time: from the creation date to the expiration date, filled up to today */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-xs text-text-muted">
          <span>Tiempo</span>
          <span className={overdue ? 'font-medium text-danger' : ''}>{timeText(tracking)}</span>
        </div>
        <div className="relative mt-1.5">
          <div className="neu-inset h-2 overflow-hidden rounded-full bg-white/50">
            <div className={`h-full rounded-full ${overdue ? 'bg-danger' : 'bg-zf-blue/60'}`} style={{ width: `${today}%` }} />
          </div>
          {!isDone(tracking.state) && (
            <span
              title="Hoy"
              className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${overdue ? 'bg-danger' : 'bg-zf-blue'}`}
              style={{ left: `${today}%` }}
            />
          )}
        </div>
        <div className="mt-1.5 flex justify-between gap-3 text-xs text-text-faint">
          <span>{showDay(answers.get(TRACKING_KEYS.start))}</span>
          <span>{showDay(answers.get(TRACKING_KEYS.end))}</span>
        </div>
      </div>

      {/* Progress: a thin bar ending in a white circle; an invisible range input lies over it */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-xs text-text-muted">
          <span>Avance</span>
          <span className="font-medium text-text">{progress}%</span>
        </div>
        <div className="group relative mt-1.5 flex h-6 items-center">
          <div className="neu-inset h-2 w-full overflow-hidden rounded-full bg-white/50">
            <div className={`h-full rounded-full ${state.bar}`} style={{ width: knobLeft }} />
          </div>
          <span
            className={`pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border-strong bg-white shadow-md
              transition-transform ${editable ? 'group-hover:scale-110 group-focus-within:scale-110 group-focus-within:ring-2 group-focus-within:ring-accent/40' : ''}`}
            style={{ left: knobLeft }}
          />
          {editable && (
            <input
              type="range"
              min={0}
              max={100}
              step={PROGRESS_STEP}
              value={progress}
              onChange={e => setDraft(Number(e.target.value))}
              onPointerUp={commit}
              onKeyUp={commit}
              onBlur={commit}
              disabled={busy}
              aria-label={`Avance de ${computedValue(response, TRACKING_KEYS.name) ?? 'la manita'}`}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait"
            />
          )}
        </div>

        {!tracking.started && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {canEdit && (
              <Button size="sm" variant="primary" onClick={() => save({ started: true })} disabled={busy}>
                <Play size={14} /> {busy ? 'Iniciando…' : 'Iniciar manita'}
              </Button>
            )}
            <span className="text-xs text-text-muted">El avance se registra cuando la manita está iniciada.</span>
          </div>
        )}
        {tracking.started && canEdit && !isDone(tracking.state) && (
          <p className="mt-2 text-xs text-text-faint">Arrastra la barra para actualizar el avance. Se pide una evidencia.</p>
        )}
      </div>

      {error && <div className="mt-3"><StatusMessage error={error} /></div>}

      {tracking.started && (
        <div className="mt-3 border-t border-white/50 pt-3">
          <button
            type="button"
            onClick={() => setShowEvidence(s => !s)}
            aria-expanded={showEvidence}
            className="text-xs font-medium text-accent hover:underline"
          >
            {showEvidence ? 'Ocultar evidencias' : 'Ver evidencias'}
          </button>
          {showEvidence && <div className="mt-2"><EvidenceList responseId={response.id} version={evidenceVersion} /></div>}
        </div>
      )}

      <EvidenceModal
        open={pending !== null}
        from={tracking.progress}
        to={pending ?? tracking.progress}
        busy={busy}
        error={evidenceError}
        optional={evidenceOptional}
        onConfirm={saveProgress}
        onCancel={cancelProgress}
      />
    </article>
  );
}

export default function CluesPage() {
  const { user } = useAuth();
  // Admins start and update any manita; a champion, the ones in their charge (the server checks it too)
  const isAdmin = user.role === ROLES.ADMIN;
  const canEdit = response => isAdmin
    || (user.champion === true && sameName(answerOf(response, TRACKING_KEYS.champion) ?? '', user.name));
  const { data: responses, setData, error } = useLiveData(listTracking);
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState('');

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const shown = responses
    ?.filter(r => filter === ALL || r.tracking.state === filter)
    .filter(r => {
      if (words.length === 0) return true;
      const text = searchText(r);
      return words.every(word => text.includes(word));
    })
    .sort(byUrgency);

  return (
    <PageContainer size="lg">
      <div>
        <h1 className="text-2xl font-semibold text-text">Seguimiento</h1>
        <p className="mt-1 text-sm text-text-muted">
          El avance de todas las manitas registradas, entre su fecha de creación y su vencimiento.
          {!isAdmin && (user.champion
            ? ' Puedes iniciar y actualizar el avance de las manitas a tu cargo.'
            : ' Solo el champion a cargo de cada manita puede iniciarla y actualizar su avance.')}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar manita, champion, área o usuario…"
            aria-label="Buscar manitas"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
          Mostrar
          <Select block={false} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value={ALL}>Todas</option>
            {Object.entries(TRACKING_STATES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </Select>
        </label>
      </div>

      <div className="mt-6 space-y-4">
        {error && <StatusMessage error={error} />}
        {!error && !responses && <StatusMessage loading />}
        {shown?.length === 0 && (
          <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>
            {responses.length === 0
              ? 'Todavía no hay manitas registradas.'
              : words.length > 0
                ? 'Ninguna manita coincide con la búsqueda.'
                : 'Ninguna manita está en ese estado.'}
          </p>
        )}
        {shown?.map(response => (
          <ManitaCard
            key={response.id}
            response={response}
            canEdit={canEdit(response)}
            evidenceOptional={isAdmin}
            onSaved={updated => setData(list => list.map(r => (r.id === updated.id ? updated : r)))}
          />
        ))}
      </div>
    </PageContainer>
  );
}
