import { useEffect, useMemo, useState } from 'react';
import { getForm, submitResponse } from '../api/forms.js';
import { flattenQuestions, isEmptyAnswer, shownQuestions } from '../utils/answers.js';

// The questions asked for these values (one per asked question, in order): each answer can show
// or hide later questions ("showIf"), so they are found one answer at a time
function walk(allQuestions, values) {
  const byKey = new Map();
  let shown = shownQuestions(allQuestions, byKey);
  values.forEach((value, i) => {
    byKey.set(shown[i].key, value);
    shown = shownQuestions(allQuestions, byKey);
  });
  return shown;
}

// Walks the form one question at a time and sends every answer together after the last one.
// "questions" are the ones asked with the answers given so far, so their number can change
export function useFormChat() {
  const [form, setForm] = useState(null);
  const [values, setValues] = useState([]);       // one per answered question, in order
  const [response, setResponse] = useState(null); // saved response, set once the form is sent
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getForm()
      .then(f => { if (!cancelled) setForm(f); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // The questions with "auto" are not asked: the server sets their answer
  const allQuestions = useMemo(() => (form ? flattenQuestions(form).filter(q => !q.auto) : []), [form]);
  const questions = useMemo(() => walk(allQuestions, values), [allQuestions, values]);

  async function send(allValues) {
    setSending(true);
    setError(null);
    try {
      const answers = walk(allQuestions, allValues)
        .map((q, i) => ({ questionKey: q.key, value: allValues[i] }))
        .filter(a => !isEmptyAnswer(a.value));
      setResponse(await submitResponse(form.version, answers));
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  function answer(value) {
    if (sending || values.length >= questions.length) return;
    const next = [...values, value];
    setValues(next);
    if (next.length === walk(allQuestions, next).length) send(next);
  }

  // Drops the last answer so it can be given again
  function undo() {
    if (sending || response) return;
    setError(null);
    setValues(values.slice(0, -1));
  }

  return {
    form,
    questions,
    values,
    current: questions[values.length] ?? null,
    complete: questions.length > 0 && values.length === questions.length,
    response,
    loading: !form && !error,
    sending,
    error,
    answer,
    undo,
    retry: () => send(values),
  };
}
