import { useState } from 'react';
import { Check, Circle, CircleCheck, SendHorizontal } from 'lucide-react';
import Avatar from './Avatar.jsx';
import MenuOption from '../MenuOption.jsx';
import UserPicker from '../UserPicker.jsx';
import FormImage from './FormImage.jsx';
import DateInput from '../DateInput.jsx';
import { Label } from '../Input.jsx';
import { isValidNumber, numberRangeText } from '../../utils/answers.js';

export const ANSWER_MAX = 1000;

// Answered from the list shown in the chat, not from the bottom bar
const isChoice = question => ['single', 'multiple', 'user'].includes(question.type);

// Options of a "single" (answers on click) or "multiple" (pick several, then confirm) question.
// The "other" option of a single question does not answer: it calls onOther, so the answer is typed
export function OptionReplies({ question, onAnswer, onOther, typingOther, disabled }) {
  const [picked, setPicked] = useState([]);
  const multiple = question.type === 'multiple';
  const imageOf = option => question.optionImages?.[option];

  // With pictures the options are cards: the picture with the option under it
  if (!multiple && question.options.some(imageOf)) {
    return (
      <div className="flex items-end justify-start gap-2">
        <Avatar size={26} />
        <div className="glass neu-raised grid max-w-sm grid-cols-2 gap-1.5 rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
          {question.options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => (option === question.other ? onOther() : onAnswer(option))}
              disabled={disabled}
              className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-sm font-medium text-accent transition-all
                hover:bg-accent/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FormImage src={imageOf(option)} alt={option} className="h-24 w-full" />
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

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
            icon={(multiple ? picked.includes(option) : typingOther && option === question.other)
              ? <CircleCheck size={16} /> : <Circle size={16} />}
            onClick={() => {
              if (multiple) toggle(option);
              else if (option === question.other) onOther();
              else onAnswer(option);
            }}
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

// Users to pick for a "user" question (answers on click), with the way to register a missing one.
// A question with "users" offers just those, as "label: name", and answers with the name.
// "defaultName" (the user filling the form) comes first, already checked: one click answers with it
export function UserReplies({ question, onAnswer, defaultName = null, disabled }) {
  if (question.users?.length) {
    return (
      <div className="flex items-end justify-start gap-2">
        <Avatar size={26} />
        <div className="glass neu-raised min-w-[180px] rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
          {question.users.map(user => (
            <MenuOption key={user.name} icon={<Circle size={16} />} onClick={() => onAnswer(user.name)} disabled={disabled}>
              {user.label}: {user.name}
            </MenuOption>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end justify-start gap-2">
      <Avatar size={26} />
      <div className="glass neu-raised w-full max-w-xs rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
        {defaultName && (
          <>
            <MenuOption icon={<CircleCheck size={16} />} onClick={() => onAnswer(defaultName)} disabled={disabled}>
              <span className="min-w-0 flex-1 truncate">{defaultName}</span>
              <span className="shrink-0 text-xs font-normal text-text-muted">Soy yo</span>
            </MenuOption>
            <p className="mt-1 border-t border-white/60 px-1.5 pb-1.5 pt-2 text-xs font-medium text-text-muted">O elige a otro usuario:</p>
          </>
        )}
        <UserPicker value={defaultName ?? ''} onPick={onAnswer} disabled={disabled} />
      </div>
    </div>
  );
}

// Bottom bar: free text for "open" (and for the "other" option once picked: typingOther), a date
// picker for "date", a number field for "number", idle while options are shown.
// Mount it with a key that changes on every question (and on typingOther) so the draft resets
// "initialText" starts the field already written (e.g. the payroll number of the account), with
// "hint" saying where it came from
export function AnswerBar({ question, onAnswer, typingOther = false, initialText = '', hint, disabled }) {
  const [text, setText] = useState(initialText);
  const choice = isChoice(question) && !typingOther;
  const isDate = question.type === 'date';
  const isNumber = question.type === 'number';
  const isTyped = !choice && !isDate;   // written in the bar: open, number or the "other" option
  const optional = question.required === false;
  const value = text.trim();
  const outOfRange = isNumber && value !== '' && !isValidNumber(question, value);
  const canSend = !choice && !disabled && value !== '' && !outOfRange;

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
      {isTyped && <Label htmlFor="answer" className="mb-1.5 pl-1">Escriba su respuesta:</Label>}
      {hint && <p className="mb-1.5 pl-1 text-xs text-text-muted">{hint}</p>}
      {outOfRange && (
        <p className="mb-1.5 pl-1 text-xs text-danger">Escribe un número entero{numberRangeText(question)}.</p>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="answer" className="sr-only">{question.text}</label>
        {isNumber ? (
          <input
            id="answer"
            type="number"
            inputMode="numeric"
            step={1}
            min={question.min}
            max={question.max}
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={disabled}
            autoFocus
            placeholder={`Escribe un número${numberRangeText(question)}`}
            className={fieldClass}
          />
        ) : isDate ? (
          <div className="min-w-0 flex-1">
            <DateInput id="answer" value={text} onChange={setText} disabled={disabled} autoFocus className={`${fieldClass} w-full`} />
          </div>
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
