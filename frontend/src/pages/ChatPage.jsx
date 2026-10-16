import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import PageContainer from '../components/layout/PageContainer.jsx';
import MessageBubble from '../components/chat/ChatBubble.jsx';
import Avatar from '../components/chat/Avatar.jsx';
import SectionDivider from '../components/chat/SectionDivider.jsx';
import FormImage from '../components/chat/FormImage.jsx';
import { getMe, listUsers } from '../api/users.js';
import { useAuth } from '../hooks/useAuth.js';
import { ROLES } from '../constants/roles.js';
import ProgressBar from '../components/chat/ProgressBar.jsx';
import { OptionReplies, UserReplies, AnswerBar, ANSWER_MAX } from '../components/chat/AnswerControls.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useFormChat } from '../hooks/useFormChat.js';
import { formatAnswer, isEmptyAnswer, sameName } from '../utils/answers.js';

const dayFormat = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const capitalizeFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_TEXT = {
  open: `Escribe tu respuesta · máximo ${ANSWER_MAX} caracteres`,
  date: 'Selecciona una fecha',
  single: 'Elige una opción',
  multiple: 'Elige una o varias opciones y confirma',
  user: 'Elige un usuario o registra uno nuevo',
  number: 'Escribe un número entero',
};

const linkButton = 'font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const {
    form, questions, values, current, complete, response, loading, sending, error, answer, undo, retry,
  } = useFormChat();
  const bottomRef = useRef(null);
  const [startedAt] = useState(() => new Date());
  // Key of the question whose "other" option was picked: its answer is typed in the bottom bar
  const [otherFor, setOtherFor] = useState(null);
  const typingOther = current != null && otherFor === current.key;

  // A question with "prefill" starts with that data of the user picked before, e.g. the payroll
  // number of the employee. It is read when the question comes up, so a user registered during
  // the chat is found too. Admins can read every account; anyone else, only their own
  const [prefill, setPrefill] = useState(null);   // { key, text, from } of the current question
  const sourceIndex = current?.prefill ? questions.findIndex(q => q.key === current.prefill.question) : -1;
  const pickedName = sourceIndex >= 0 && sourceIndex < values.length ? values[sourceIndex] : null;
  const prefillField = current?.prefill?.field;
  const currentKey = current?.key;

  useEffect(() => {
    if (!pickedName || !prefillField) return undefined;
    let active = true;
    const accounts = me.role === ROLES.ADMIN ? listUsers() : getMe().then(account => [account]);
    accounts
      .then(users => {
        const account = users.find(u => sameName(u.name, pickedName));
        const data = account?.[prefillField];
        if (active && data) setPrefill({ key: currentKey, text: String(data), from: account.name });
      })
      .catch(() => {});   // without the data the field just starts empty
    return () => { active = false; };
  }, [currentKey, pickedName, prefillField, me.role]);

  const currentPrefill = prefill?.key === currentKey ? prefill : null;

  const answerQuestion = value => {
    setOtherFor(null);
    answer(value);
  };

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
      messages.push(<SectionDivider key={`s-${q.key}`} name={q.section.name} description={q.section.description} />);
      lastSection = q.section.key;
    }
    messages.push(
      <MessageBubble key={`q-${q.key}`} from="bot">
        {q.text}
        <FormImage src={q.image} alt={q.text} className="mt-2 max-h-48 w-full" />
        {q.description &&<span className="mt-1 block whitespace-pre-line text-xs text-text-muted">{q.description}</span>}
        {q.required === false && <span className="mt-1 block text-xs text-text-muted">Opcional</span>}
      </MessageBubble>
    );
    if (i < values.length) {
      messages.push(
        <MessageBubble key={`a-${q.key}`} from="user">
          {isEmptyAnswer(values[i]) ? <em>Sin respuesta</em> : formatAnswer(q, values[i])}
          <FormImage src={q.optionImages?.[values[i]]} alt={values[i]} className="mt-1.5 h-20" />
        </MessageBubble>
      );
    } else if (q.type === 'single' || q.type === 'multiple') {
      messages.push(
        <OptionReplies
          key={`o-${q.key}`}
          question={q}
          onAnswer={answerQuestion}
          onOther={() => setOtherFor(q.key)}
          typingOther={typingOther}
          disabled={sending}
        />
      );
    } else if (q.type === 'user') {
      messages.push(<UserReplies key={`o-${q.key}`} question={q} onAnswer={answerQuestion} disabled={sending} />);
    }
  });

  const statusText = sending
    ? 'Enviando…'
    : complete
      ? 'Respuestas completas'
      : current.users?.length
        ? 'Elige una opción'
        : STATUS_TEXT[typingOther ? 'open' : current.type];

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
        {current && (
          <AnswerBar
            key={`${current.key}-${typingOther}-${currentPrefill?.text ?? ''}`}
            question={current}
            onAnswer={answerQuestion}
            typingOther={typingOther}
            initialText={currentPrefill?.text}
            hint={currentPrefill && `Tomado de la cuenta de ${currentPrefill.from}. Puedes cambiarlo.`}
            disabled={sending}
          />
        )}

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
