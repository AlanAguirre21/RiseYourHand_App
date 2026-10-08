import Response from '../models/Response.js';
import { FORM_KEY, findVersion, listVersions } from './form.service.js';
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

// Every response as one table (header first), newest first: one row per response and one column
// per question and computed field. The columns cover all the form versions, named after the
// latest text of each one; a response leaves empty the ones its version did not have
export const exportTable = async () => {
  const [responses, versions] = await Promise.all([
    Response.find({ formKey: FORM_KEY }).sort({ createdAt: -1 }).populate('user', 'name').lean(),
    listVersions(),
  ]);

  const forms = new Map(versions.map((f) => [f.version, f]));
  const questions = new Map();   // key -> text
  const computed = new Map();
  for (const section of versions.flatMap((f) => f.sections)) {
    for (const q of section.questions) questions.set(q.key, q.text);
    for (const c of section.computed ?? []) computed.set(c.key, c.text);
  }

  const header = ['ID', 'Fecha de registro', 'Usuario', 'Versión del formulario',
    ...questions.values(), ...computed.values()];

  const rows = responses.map((r) => {
    const form = forms.get(r.formVersion);
    const answers = new Map(r.answers.map((a) => [a.questionKey, a.value]));
    const fields = new Map((form ? computeFields(form, r.answers) : []).map((c) => [c.key, c.value]));
    return [
      String(r._id),
      r.createdAt.toISOString(),
      r.user?.name ?? '',
      r.formVersion,
      ...[...questions.keys()].map((key) => {
        const value = answers.get(key);
        return Array.isArray(value) ? value.join('; ') : value;
      }),
      ...[...computed.keys()].map((key) => fields.get(key)),
    ];
  });

  return [header, ...rows];
};
