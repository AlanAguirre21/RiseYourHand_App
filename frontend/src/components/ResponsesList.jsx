import { useEffect, useState } from 'react';
import StatusMessage from './StatusMessage.jsx';
import { getForm } from '../api/forms.js';
import { PANEL } from '../constants/styles.js';
import { flattenQuestions, formatAnswer, formatComputed } from '../utils/answers.js';

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

// Loads responses with "load" (a function from api/forms.js) and shows one card per response
export default function ResponsesList({ load, showUser = false, emptyText }) {
  const [data, setData]   = useState(null);   // { questions, responses }
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getForm(), load()])
      .then(([form, responses]) => { if (active) setData({ questions: flattenQuestions(form), responses }); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [load]);

  if (error) return <StatusMessage error={error} />;
  if (!data) return <StatusMessage loading />;
  if (data.responses.length === 0) {
    return <p className={`py-12 text-center text-sm text-text-muted ${PANEL}`}>{emptyText}</p>;
  }

  return (
    <>
      <p className="text-sm text-text-muted">
        {data.responses.length} {data.responses.length === 1 ? 'respuesta' : 'respuestas'}
      </p>
      {data.responses.map(response => {
        const byKey = new Map(response.answers.map(a => [a.questionKey, a.value]));
        return (
          <article key={response.id} className={`p-5 ${PANEL}`}>
            <p className="text-xs font-medium text-text-muted">
              {dateFormat.format(new Date(response.createdAt))}
              {showUser && ` · ${response.user?.name ?? 'Usuario eliminado'}`}
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
