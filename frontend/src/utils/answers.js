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

// Computed fields come as a number of days or as a ready-made text
export function formatComputed(value) {
  if (value == null) return '—';
  if (typeof value !== 'number') return value;
  return `${value} ${Math.abs(value) === 1 ? 'día' : 'días'}`;
}
