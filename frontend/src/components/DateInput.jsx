import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { FIELD } from '../constants/styles.js';
import { formatDay, parseDay } from '../utils/dates.js';

// Writes the slashes while typing: "16102026" -> "16/10/2026"
const mask = raw => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
};

// A date field that is always dd/mm/yyyy. The browser's own date field follows the language of the
// computer (mm/dd/yyyy on one in English), so the text is ours; the button still opens the
// browser's calendar. "value" and onChange are YYYY-MM-DD, or "" while the date is not complete.
// "min" and "max" (YYYY-MM-DD) limit the days the calendar offers
export default function DateInput({ id, value = '', onChange, min, max, disabled, autoFocus, 'aria-label': ariaLabel, className = `${FIELD} w-full` }) {
  const picker = useRef(null);
  const [text, setText] = useState(() => formatDay(value));

  // A value set from outside (the calendar, or a reset) replaces what is written
  useEffect(() => {
    if (value !== parseDay(text)) setText(formatDay(value));
  }, [value]);   // eslint-disable-line react-hooks/exhaustive-deps -- only when the value changes

  function write(raw) {
    const next = mask(raw);
    setText(next);
    onChange(parseDay(next));
  }

  const invalid = text.length === 10 && !parseDay(text);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={e => write(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={`${className} pr-10 ${invalid ? 'ring-2 ring-danger/40' : ''}`}
      />
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        min={min}
        max={max}
        onChange={e => { setText(formatDay(e.target.value)); onChange(e.target.value); }}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
      <button
        type="button"
        onClick={() => picker.current?.showPicker?.()}
        disabled={disabled}
        aria-label="Abrir calendario"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-control p-1.5 text-text-muted transition-all
          hover:bg-white/50 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CalendarDays size={16} />
      </button>
    </div>
  );
}
