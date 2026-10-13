import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import MessageBubble from '../components/chat/ChatBubble.jsx';
import Avatar from '../components/chat/Avatar.jsx';
import SectionDivider from '../components/chat/SectionDivider.jsx';
import ProgressBar from '../components/chat/ProgressBar.jsx';
import { OptionReplies, UserReplies, AnswerBar, ANSWER_MAX } from '../components/chat/AnswerControls.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useFormChat } from '../hooks/useFormChat.js';
import { formatAnswer, isEmptyAnswer } from '../utils/answers.js';

const dayFormat = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const capitalizeFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_TEXT = {
  open: `Escribe tu respuesta · máximo ${ANSWER_MAX} caracteres`,
  date: 'Selecciona una fecha',
  single: 'Elige una opción',
  multiple: 'Elige una o varias opciones y confirma',
  user: 'Elige un usuario o registra uno nuevo',
};

const linkButton = 'font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40';

export default function ChatPage() {
  const navigate = useNavigate();
  const {
    form, questions, values, current, complete, response, loading, sending, error, answer, undo, retry,
  } = useFormChat();
  const bottomRef = useRef(null);
  const [startedAt] = useState(() => new Date());

  useEffect(() => {
    if (response) navigate('/formulario/resultado', { replace: true, state: { form, response } });
  }, [response, form, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [values.length]);

  if (!form) {
    return (
      <PageContainer>
        <StatusMessage loading={loading} error={error} />
      </PageContainer>
    );
  }

  const messages = [
    <div key="date" className="flex items-center gap-3 text-[11px] text-text-muted">
      <span className="h-px flex-1 bg-white/60" />
      {capitalizeFirst(dayFormat.format(startedAt))}
      <span className="h-px flex-1 bg-white/60" />
    </div>,
  ];
  let lastSection = null;

  // Answered questions plus the one being asked
  questions.slice(0, values.length + 1).forEach((q, i) => {
    if (q.section.key !== lastSection) {
      messages.push(<SectionDivider key={`s-${q.key}`} name={q.section.name} />);
      lastSection = q.section.key;
    }
    messages.push(
      <MessageBubble key={`q-${q.key}`} from="bot">
        {q.text}
        {q.required === false && <span className="mt-1 block text-xs text-text-muted">Opcional</span>}
      </MessageBubble>
    );
    if (i < values.length) {
      messages.push(
        <MessageBubble key={`a-${q.key}`} from="user">
          {isEmptyAnswer(values[i]) ? <em>Sin respuesta</em> : formatAnswer(q, values[i])}
        </MessageBubble>
      );
    } else if (q.type === 'single' || q.type === 'multiple') {
      messages.push(<OptionReplies key={`o-${q.key}`} question={q} onAnswer={answer} disabled={sending} />);
    } else if (q.type === 'user') {
      messages.push(<UserReplies key={`o-${q.key}`} question={q} onAnswer={answer} disabled={sending} />);
    }
  });

  const statusText = sending
    ? 'Enviando…'
    : complete
      ? 'Respuestas completas'
      : STATUS_TEXT[current.type];

  return (
    <div className="flex min-h-0 flex-1 justify-center px-3 py-4 sm:px-4 sm:py-6">
      {/* chat card */}
      <div className="glass neu-raised flex h-full max-h-[880px] min-h-[420px] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/50 bg-white/40">

        {/* Header */}
        <div className="shrink-0 border-b border-white/40 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar size={42} />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold leading-tight text-zf-blue">{form.title}</h1>
                <p className="truncate text-xs leading-tight text-text-muted">
                  {(current ?? questions.at(-1)).section.name}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_6px_rgba(52,199,89,0.7)]" />
              <span className="text-xs font-medium text-success">
                {values.length}/{questions.length}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar answered={values.length} total={questions.length} />
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        {current && <AnswerBar key={current.key} question={current} onAnswer={answer} disabled={sending} />}

        {/* Status bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-1 text-[11px]">
          <p role={error ? 'alert' : undefined} className={error ? 'text-danger' : 'text-text-muted'}>
            {error ?? statusText}
          </p>
          <div className="flex shrink-0 gap-3">
            {values.length > 0 && !response && (
              <button type="button" onClick={undo} disabled={sending} className={linkButton}>
                Corregir anterior
              </button>
            )}
            {complete && error && (
              <button type="button" onClick={retry} disabled={sending} className={linkButton}>
                Reintentar envío
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
