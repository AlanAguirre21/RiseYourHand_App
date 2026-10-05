const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });

export const flattenQuestions = form =>
  form.sections.flatMap(section => section.questions.map(question => ({ ...question, section })));

export const isEmptyAnswer = value =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

// Text shown for an answer. Dates travel as YYYY-MM-DD and are read as local days
export function formatAnswer(question, value) {
  if (isEmptyAnswer(value)) return 'Sin respuesta';
  if (question.type === 'date') return dateFormat.format(new Date(`${value}T00:00:00`));
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

export const formatDays = value => (value == null ? '—' : `${value} ${Math.abs(value) === 1 ? 'día' : 'días'}`);
