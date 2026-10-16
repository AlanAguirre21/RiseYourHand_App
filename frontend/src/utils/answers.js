import { formatDay } from './dates.js';

export const flattenQuestions = form =>
  form.sections.flatMap(section => section.questions.map(question => ({ ...question, section })));

export const isEmptyAnswer = value =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

// Whether a "single" answer is that option. The "other" option matches any typed answer
const isOption = (question, value, option) =>
  value === option || (option === question.other && !isEmptyAnswer(value) && !question.options.includes(value));

// The questions asked for these answers (Map key -> value), in form order: one with "showIf" only
// when the question it depends on is asked and has that option as answer
export function shownQuestions(questions, byKey) {
  const shown = new Map();
  for (const q of questions) {
    const source = q.showIf && shown.get(q.showIf.question);
    if (!q.showIf || (source && isOption(source, byKey.get(source.key), q.showIf.option))) shown.set(q.key, q);
  }
  return [...shown.values()];
}

// A "number" answer: a whole number within the min / max of the question, if it has them
export function isValidNumber(question, value) {
  if (!/^-?\d+$/.test(String(value).trim())) return false;
  const number = Number(value);
  return (question.min == null || number >= question.min) && (question.max == null || number <= question.max);
}

// " entre 99 y 999999", " mayor o igual a 99"... to tell the range of a "number" question
export function numberRangeText({ min, max }) {
  if (min != null && max != null) return ` entre ${min} y ${max}`;
  if (min != null) return ` mayor o igual a ${min}`;
  if (max != null) return ` menor o igual a ${max}`;
  return '';
}

// Names compared like the server does: ignoring case, accents and extra spaces
const nameKey = name => String(name).normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
export const sameName = (a, b) => nameKey(a) === nameKey(b);

// "label: name" of a user listed in a "user" question with "users" (e.g. "Mantenimiento: Daniela
// Pimentel"), or null if the question has no such list or that user is not in it
export function userChoiceText(question, name) {
  const choice = question.users?.find(u => nameKey(u.name) === nameKey(name));
  return choice ? `${choice.label}: ${choice.name}` : null;
}

// Text shown for an answer. Dates travel as YYYY-MM-DD and are shown as dd/mm/yyyy
export function formatAnswer(question, value) {
  if (isEmptyAnswer(value)) return 'Sin respuesta';
  if (question.type === 'date') return formatDay(value);
  if (question.type === 'user') return userChoiceText(question, value) ?? value;
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

// Value of a computed field of a response (e.g. the name of the manita), or null
export const computedValue = (response, key) => response.computed?.find(c => c.key === key)?.value || null;

// Computed fields come as a number of days or as a ready-made text
export function formatComputed(value) {
  if (value == null) return '—';
  if (typeof value !== 'number') return value;
  return `${value} ${Math.abs(value) === 1 ? 'día' : 'días'}`;
}
