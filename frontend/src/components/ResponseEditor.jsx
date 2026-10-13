import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Button from './Button.jsx';
import StatusMessage from './StatusMessage.jsx';
import UserPicker from './UserPicker.jsx';
import { Input, Label, Select } from './Input.jsx';
import { ANSWER_MAX } from './chat/AnswerControls.jsx';
import { updateResponse } from '../api/forms.js';
import { FIELD } from '../constants/styles.js';
import { formatComputed, isEmptyAnswer } from '../utils/answers.js';

const emptyValue = question => (question.type === 'multiple' ? [] : '');

// A "user" answer as a closed field: the users are listed on click, in a panel that floats over
// the card instead of making it taller. The list is four users tall and scrolls
function UserSelect({ id, value, onChange, disabled, championsOnly }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    // The window to register a user is a <dialog> outside this field: it must not close the panel
    const inDialog = e => e.target instanceof Element && e.target.closest('dialog');
    const onPointerDown = e => { if (!ref.current.contains(e.target) && !inDialog(e)) setOpen(false); };
    const onKeyDown = e => { if (e.key === 'Escape' && !inDialog(e)) setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        className={`${FIELD} flex w-full items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{value || 'Sin respuesta'}</span>
        <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div data-user-panel className="absolute inset-x-0 top-full z-20 mt-1 rounded-control border border-border-strong bg-surface p-1.5 shadow-2xl">
          <UserPicker
            value={value}
            onPick={name => { onChange(name); setOpen(false); }}
            disabled={disabled}
            championsOnly={championsOnly}
            autoFocus
            listClassName="max-h-36 overflow-y-scroll"
          />
        </div>
      )}
    </div>
  );
}

function AnswerField({ id, question, value, onChange, disabled }) {
  if (question.type === 'single') {
    return (
      <Select id={id} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        {(!question.options.includes(value) || question.required === false) && <option value="">Sin respuesta</option>}
        {question.options.map(option => <option key={option} value={option}>{option}</option>)}
      </Select>
    );
  }
  if (question.type === 'multiple') {
    const toggle = option =>
      // Keeps the order of the form, not the order of the clicks
      onChange(question.options.filter(o => (o === option ? !value.includes(o) : value.includes(o))));
    return (
      <div id={id} role="group" className="space-y-1">
        {question.options.map(option => (
          <label key={option} className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} disabled={disabled} />
            {option}
          </label>
        ))}
      </div>
    );
  }
  if (question.type === 'user') {
    return <UserSelect id={id} value={value} onChange={onChange} disabled={disabled} championsOnly={question.champions === true} />;
  }
  if (question.type === 'date') {
    return <Input id={id} type="date" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} />;
  }
  return (
    <textarea
      id={id}
      rows={2}
      maxLength={ANSWER_MAX}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`${FIELD} w-full resize-y`}
    />
  );
}

// The answers of one response as a form. The computed fields are shown as they were: the server
// recalculates them on save
export default function ResponseEditor({ response, questions, onSaved, onCancel }) {
  const [draft, setDraft] = useState(() => {
    const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
    return Object.fromEntries(questions.map(q => [q.key, byKey.get(q.key) ?? emptyValue(q)]));
  });
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState(null);

  const clean = value => (typeof value === 'string' ? value.trim() : value);
  const isValid = questions.every(q => q.required === false || !isEmptyAnswer(clean(draft[q.key])));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await updateResponse(response.id, questions.map(q => ({ questionKey: q.key, value: clean(draft[q.key]) }))));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {questions.map(q => {
          const id = `response-${response.id}-${q.key}`;
          return (
            <div key={q.key} className="min-w-0">
              <Label htmlFor={id}>{q.text}</Label>
              <AnswerField
                id={id}
                question={q}
                value={draft[q.key]}
                onChange={value => setDraft(d => ({ ...d, [q.key]: value }))}
                disabled={busy}
              />
            </div>
          );
        })}
        {response.computed.map(c => (
          <div key={c.key} className="min-w-0">
            <p className="text-xs text-text-muted">{c.text}</p>
            <p className="mt-0.5 font-medium text-text">{formatComputed(c.value)}</p>
          </div>
        ))}
      </div>

      {error && <div className="mt-3"><StatusMessage error={error} /></div>}

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={!isValid || busy}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button onClick={onCancel} disabled={busy}>Cancelar</Button>
        {!isValid && <span className="text-xs text-text-muted">Completa todos los campos obligatorios.</span>}
      </div>
    </form>
  );
}
