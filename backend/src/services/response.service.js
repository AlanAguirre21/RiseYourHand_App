import mongoose from 'mongoose';
import Response from '../models/Response.js';
import { FORM_KEY, findVersion, getCurrent, listVersions } from './form.service.js';
import { findByName } from './user.service.js';
import { computeFields } from '../utils/computed.js';
import { TRACKING, isStarted, trackingOf } from '../utils/tracking.js';

export const OPEN_MAX_LENGTH = 1000;
const LIST_LIMIT = 500;
const USER_COLUMN = 'user';   // first column of the export: who filled the response

const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });
const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });

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
  tracking: trackingOf(response),
  createdAt: response.createdAt,
});

// Checks the answers (a Map of question key -> value) against the form and returns them clean:
// only known questions, in form order
const cleanAnswers = async (form, byKey) => {
  const clean = [];

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
    if (q.type === 'user') {
      // Stored as the name of the user, as it is written in their account
      const user = typeof value === 'string' ? await findByName(value) : null;
      if (!user) throw badRequest(`No hay ningún usuario llamado «${String(value).slice(0, 100)}». Elige uno de la lista o regístralo.`);
      if (q.champions && !user.champion) {
        throw badRequest(`«${user.name}» no está marcado como champion. Elige un champion o márcalo como tal.`);
      }
      value = user.name;
    }
    clean.push({ questionKey: q.key, value });
  }
  return clean;
};

export const submit = async ({ formVersion, answers } = {}, user) => {
  if (!Array.isArray(answers)) throw badRequest('answers must be a list');

  const form = await findVersion(formVersion);
  if (!form) throw notFound('Form not found');

  const clean = await cleanAnswers(form, new Map(answers.map((a) => [a?.questionKey, a?.value])));
  const response = await Response.create({
    formKey: form.key, formVersion: form.version, user: user._id, answers: clean,
  });

  // Who to tell about the new manita: the user picked in the question for champions
  const championKey = form.sections.flatMap((s) => s.questions).find((q) => q.champions)?.key;
  const championName = clean.find((a) => a.questionKey === championKey)?.value;
  const champion = championName ? await findByName(championName) : null;
  return {
    ...toPublicResponse(response, form, user),
    champion: champion ? { name: champion.name, email: champion.email ?? null } : null,
  };
};

// Replaces the answers that are sent and keeps the rest. They are checked against the current
// form, so editing a response filled with an older version brings it up to date: the questions
// added since then have to be answered. An empty value removes the answer of an optional question
export const update = async (id, { answers } = {}) => {
  if (!Array.isArray(answers)) throw badRequest('answers must be a list');

  const response = mongoose.isValidObjectId(id)
    ? await Response.findOne({ _id: id, formKey: FORM_KEY }).populate('user', 'name')
    : null;
  if (!response) throw notFound('Respuesta no encontrada.');

  const form = await getCurrent();
  const byKey = new Map([...response.answers, ...answers].map((a) => [a?.questionKey, a?.value]));
  response.answers = await cleanAnswers(form, byKey);
  response.formVersion = form.version;
  await response.save();
  return toPublicResponse(response, form, response.user);
};

// Tracking of a response:
//   { started: true }  marks it as started (its status answer)
//   { progress }       0 to 100, only once started; reaching 100 records when it was finished
export const updateTracking = async (id, { started, progress } = {}) => {
  const response = mongoose.isValidObjectId(id)
    ? await Response.findOne({ _id: id, formKey: FORM_KEY }).populate('user', 'name')
    : null;
  if (!response) throw notFound('Respuesta no encontrada.');

  const form = await findVersion(response.formVersion);
  if (!form) throw notFound('Form not found');

  if (started === true && !isStarted(response)) {
    const status = response.answers.find((a) => a.questionKey === TRACKING.statusKey);
    if (!status) throw badRequest('Esta manita no tiene estatus.');
    status.value = TRACKING.startedValue;
    response.markModified('answers');
  }
  if (progress !== undefined) {
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      throw badRequest('El avance debe ser un número entero entre 0 y 100.');
    }
    if (!isStarted(response)) {
      throw Object.assign(new Error('La manita todavía no se ha iniciado.'), { status: 409 });
    }
    response.progress = progress;
    if (progress < 100) response.completedAt = null;
    else response.completedAt ??= new Date();
  }

  await response.save();
  return toPublicResponse(response, form, response.user);
};

// Newest first. Each response is resolved against the form version it was filled with
export const list = async (filter = {}, limit = LIST_LIMIT) => {
  const responses = await Response.find({ ...filter, formKey: FORM_KEY })
    .sort({ createdAt: -1 })
    .limit(limit)   // 0 means no limit
    .populate('user', 'name')
    .lean();

  const forms = new Map();
  for (const version of new Set(responses.map((r) => r.formVersion))) {
    forms.set(version, await findVersion(version));
  }
  return responses.map((r) => toPublicResponse(r, forms.get(r.formVersion), r.user));
};

// The manitas of a user: the ones where they are the champion or the person who reported it (the
// answer of a question of type "user" is their name). Having registered it is not enough
export const listOf = async (user) => {
  const userKeys = [...new Set((await listVersions())
    .flatMap((f) => f.sections)
    .flatMap((s) => s.questions)
    .filter((q) => q.type === 'user')
    .map((q) => q.key))];
  return list({
    answers: { $elemMatch: { questionKey: { $in: userKeys }, value: user.name } },
  });
};

// Every response as one table (header first), newest first: one row per response and one column
// per question and computed field. The columns cover all the form versions and are named after
// the keys of form.json; a response leaves empty the ones its version did not have
export const exportTable = async () => {
  const [responses, versions] = await Promise.all([
    Response.find({ formKey: FORM_KEY }).sort({ createdAt: -1 }).populate('user', 'name').lean(),
    listVersions(),
  ]);

  const forms = new Map(versions.map((f) => [f.version, f]));
  // Keys in the order of the latest form; the ones only older versions had come after
  const questions = new Set();
  const computed = new Set();
  for (const section of versions.toReversed().flatMap((f) => f.sections)) {
    for (const q of section.questions) questions.add(q.key);
    for (const c of section.computed ?? []) computed.add(c.key);
  }

  const header = [USER_COLUMN, ...questions, ...computed];

  const rows = responses.map((r) => {
    const form = forms.get(r.formVersion);
    const answers = new Map(r.answers.map((a) => [a.questionKey, a.value]));
    const fields = new Map((form ? computeFields(form, r.answers) : []).map((c) => [c.key, c.value]));
    return [
      r.user?.name ?? '',
      ...[...questions].map((key) => {
        const value = answers.get(key);
        return Array.isArray(value) ? value.join('; ') : value;
      }),
      ...[...computed].map((key) => fields.get(key)),
    ];
  });

  return [header, ...rows];
};
