import { useState } from 'react';
import { Check, Circle, CircleCheck, SendHorizontal } from 'lucide-react';
import Avatar from './Avatar.jsx';
import MenuOption from '../MenuOption.jsx';
import UserPicker from '../UserPicker.jsx';
import { Label } from '../Input.jsx';

export const ANSWER_MAX = 1000;

// Answered from the list shown in the chat, not from the bottom bar
const isChoice = question => ['single', 'multiple', 'user'].includes(question.type);

// Options of a "single" (answers on click) or "multiple" (pick several, then confirm) question
export function OptionReplies({ question, onAnswer, disabled }) {
  const [picked, setPicked] = useState([]);
  const multiple = question.type === 'multiple';

  function toggle(option) {
    setPicked(picked.includes(option) ? picked.filter(o => o !== option) : [...picked, option]);
  }

  return (
    <div className="flex items-end justify-start gap-2">
      <Avatar size={26} />
      <div className="glass neu-raised min-w-[180px] rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
        {question.options.map(option => (
          <MenuOption
            key={option}
            icon={multiple && picked.includes(option) ? <CircleCheck size={16} /> : <Circle size={16} />}
            onClick={() => (multiple ? toggle(option) : onAnswer(option))}
            disabled={disabled}
          >
            {option}
          </MenuOption>
        ))}
        {multiple && (
          <MenuOption
            icon={<Check size={16} />}
            color="success"
            // Keeps the order of the form, not the order of the clicks
            onClick={() => onAnswer(question.options.filter(o => picked.includes(o)))}
            disabled={disabled || picked.length === 0}
          >
            Confirmar
          </MenuOption>
        )}
      </div>
    </div>
  );
}

// Users to pick for a "user" question (answers on click), with the way to register a missing one
export function UserReplies({ question, onAnswer, disabled }) {
  return (
    <div className="flex items-end justify-start gap-2">
      <Avatar size={26} />
      <div className="glass neu-raised w-full max-w-xs rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
        <UserPicker onPick={onAnswer} disabled={disabled} championsOnly={question.champions === true} />
      </div>
    </div>
  );
}

// Bottom bar: free text for "open", a date picker for "date", idle while options are shown.
// Mount it with key={question.key} so the draft resets on every question
export function AnswerBar({ question, onAnswer, disabled }) {
  const [text, setText] = useState('');
  const choice = isChoice(question);
  const isDate = question.type === 'date';
  const isOpen = !choice && !isDate;
  const optional = question.required === false;
  const value = text.trim();
  const canSend = !choice && !disabled && value !== '';

  function handleSubmit(e) {
    e.preventDefault();
    if (canSend) onAnswer(value);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onAnswer(value);
    }
  }

  const fieldClass = `neu-inset max-h-32 min-w-0 flex-1 resize-none rounded-2xl border border-white/50 bg-white/50 px-4 py-2
    text-sm text-text placeholder:text-text-faint transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/30
    disabled:cursor-not-allowed`;

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-white/40 px-4 py-3.5">
      {isOpen && <Label htmlFor="answer" className="mb-1.5 pl-1">Escriba su respuesta:</Label>}
      <div className="flex items-end gap-2">
        <label htmlFor="answer" className="sr-only">{question.text}</label>
        {isDate ? (
          <input
            id="answer"
            type="date"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={disabled}
            autoFocus
            className={fieldClass}
          />
        ) : (
          <textarea
            id="answer"
            rows={1}
            maxLength={ANSWER_MAX}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={choice || disabled}
            autoFocus={!choice}
            placeholder={choice ? 'Elige una opción de la lista' : 'Escribe tu respuesta…'}
            className={fieldClass}
          />
        )}
        {optional && (
          <button
            type="button"
            onClick={() => onAnswer(null)}
            disabled={disabled}
            className="h-9 shrink-0 rounded-full px-3 text-xs font-medium text-text-muted transition-all hover:bg-white/50 hover:text-text
              disabled:cursor-not-allowed disabled:opacity-40"
          >
            Omitir
          </button>
        )}
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Enviar respuesta"
          className="neu-raised flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#409CFF]
            text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </form>
  );
}
