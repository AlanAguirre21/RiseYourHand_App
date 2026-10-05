import Response from '../models/Response.js';
import { FORM_KEY, findVersion } from './form.service.js';
import { computeFields } from '../utils/computed.js';

export const OPEN_MAX_LENGTH = 1000;
const LIST_LIMIT = 500;

const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });

const isDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);   // rejects 2026-02-31

// "user" is a populated User (or a plain { _id, name }); null if the user no longer exists
export const toPublicResponse = (response, form, user) => ({
  id: String(response._id),
  formKey: response.formKey,
  formVersion: response.formVersion,
  user: user ? { id: String(user._id), name: user.name } : null,
  answers: response.answers,
  computed: form ? computeFields(form, response.answers) : [],
  createdAt: response.createdAt,
});

export const submit = async ({ formVersion, answers } = {}, user) => {
  if (!Array.isArray(answers)) throw badRequest('answers must be a list');

  const form = await findVersion(formVersion);
  if (!form) throw Object.assign(new Error('Form not found'), { status: 404 });

  const byKey = new Map(answers.map((a) => [a?.questionKey, a?.value]));
  const clean = [];   // only known questions, in form order

  for (const q of form.sections.flatMap((s) => s.questions)) {
    let value = byKey.get(q.key);
    if (typeof value === 'string') value = value.trim();
    const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);

    if (empty) {
      if (q.required) throw badRequest(`Missing answer: ${q.key}`);
      continue;
    }
    if (q.type === 'open' && (typeof value !== 'string' || value.length > OPEN_MAX_LENGTH)) {
      throw badRequest(`Invalid answer: ${q.key}`);
    }
    if (q.type === 'date' && !isDate(value)) {
      throw badRequest(`Invalid date: ${q.key}`);
    }
    if (q.type === 'single' && !q.options.includes(value)) {
      throw badRequest(`Invalid option: ${q.key}`);
    }
    if (q.type === 'multiple' &&
        (!Array.isArray(value) || !value.every((v) => q.options.includes(v)))) {
      throw badRequest(`Invalid option: ${q.key}`);
    }
    clean.push({ questionKey: q.key, value });
  }

  const response = await Response.create({
    formKey: form.key, formVersion: form.version, user: user._id, answers: clean,
  });
  return toPublicResponse(response, form, user);
};

// Newest first. Each response is resolved against the form version it was filled with
export const list = async (filter = {}) => {
  const responses = await Response.find({ ...filter, formKey: FORM_KEY })
    .sort({ createdAt: -1 })
    .limit(LIST_LIMIT)
    .populate('user', 'name')
    .lean();

  const forms = new Map();
  for (const version of new Set(responses.map((r) => r.formVersion))) {
    forms.set(version, await findVersion(version));
  }
  return responses.map((r) => toPublicResponse(r, forms.get(r.formVersion), r.user));
};
