import mongoose from 'mongoose';
import Counter from '../models/Counter.js';
import Evidence, { EVIDENCE_COMMENT_MAX, EVIDENCE_IMAGE_MAX_LENGTH, EVIDENCE_IMAGE_PATTERN } from '../models/Evidence.js';
import Response from '../models/Response.js';
import { FORM_KEY, findVersion, getCurrent, listVersions } from './form.service.js';
import { findByName, updateProfile } from './user.service.js';
import { ROLES } from '../constants/roles.js';
import { computeFields } from '../utils/computed.js';
import { TRACKING, answerOf, isStarted, trackingOf } from '../utils/tracking.js';

export const OPEN_MAX_LENGTH = 1000;
const LIST_LIMIT = 500;
const FOLIO_COUNTER = 'response_folio';

const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });
const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });

const isDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);   // rejects 2026-02-31

// " entre 99 y 999999", " mayor o igual a 99"... for the error of a "number" question
const rangeText = ({ min, max }) => {
  if (min != null && max != null) return ` entre ${min} y ${max}`;
  if (min != null) return ` mayor o igual a ${min}`;
  if (max != null) return ` menor o igual a ${max}`;
  return '';
};

// "user" is a populated User (or a plain { _id, name }); null if the user no longer exists
export const toPublicResponse = (response, form, user) => ({
  id: String(response._id),
  folio: response.folio ?? null,
  formKey: response.formKey,
  formVersion: response.formVersion,
  user: user ? { id: String(user._id), name: user.name } : null,
  answers: response.answers,
  computed: form ? computeFields(form, response.answers, { folio: response.folio ?? null }) : [],
  tracking: trackingOf(response),
  awardedAt: response.awardedAt ?? null,
  createdAt: response.createdAt,
});

// Whether a "single" answer is that option. The "other" option matches any typed answer
const isOption = (question, value, option) =>
  value === option || (option === question.other && typeof value === 'string' && !question.options.includes(value));

// Names compared like the database does (NAME_COLLATION): ignoring case, accents and extra spaces
const nameKey = (name) => String(name).normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
const sameName = (a, b) => nameKey(a) === nameKey(b);

// Today on the server's calendar, as YYYY-MM-DD
const todayOf = (now) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// The YYYY-MM-DD that is "days" weekdays after "from": Saturdays and Sundays are not counted
const addBusinessDays = (from, days) => {
  const date = new Date(`${from}T00:00:00Z`);
  for (let left = days; left > 0;) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) left -= 1;
  }
  return date.toISOString().slice(0, 10);
};

// Answer of a question with "auto", from the answers cleaned so far
const autoValue = ({ auto }, clean, now) => {
  if (auto.op === 'value') return auto.value;
  if (auto.op === 'today') return todayOf(now);
  const from = clean.find((a) => a.questionKey === auto.source)?.value;
  return from ? addBusinessDays(from, auto.days) : null;
};

// Checks the answers (a Map of question key -> value) against the form and returns them clean:
// only known questions, in form order. The questions with "auto" get their value when fillAuto
// (a new response: whatever was sent for them is ignored) or when they have none (an older response)
const cleanAnswers = async (form, byKey, { fillAuto = false, now = new Date() } = {}) => {
  const clean = [];
  const asked = new Map();   // key -> question, of the questions asked so far

  for (const q of form.sections.flatMap((s) => s.questions)) {
    // A question with "showIf" not met is not asked: its answer, if any, is dropped
    if (q.showIf) {
      const source = asked.get(q.showIf.question);
      const answer = clean.find((a) => a.questionKey === q.showIf.question)?.value;
      if (!source || !isOption(source, answer, q.showIf.option)) continue;
    }
    asked.set(q.key, q);

    let value = byKey.get(q.key);
    if (typeof value === 'string') value = value.trim();
    const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (q.auto && (fillAuto || isEmpty(value))) value = autoValue(q, clean, now);
    const empty = isEmpty(value);

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
    if (q.type === 'number') {
      // Whole numbers only, sent as a number or as its digits; stored as a number
      value = typeof value === 'string' && /^-?\d+$/.test(value) ? Number(value) : value;
      if (!Number.isSafeInteger(value) || (q.min != null && value < q.min) || (q.max != null && value > q.max)) {
        throw badRequest(`El valor de «${q.text}» debe ser un número entero${rangeText(q)}.`);
      }
    }
    if (q.type === 'single') {
      // With an "other" option the answer can also be typed: it is stored as written, not as the option
      const typed = q.other != null && typeof value === 'string' && value.length <= OPEN_MAX_LENGTH;
      if (value === q.other || (!q.options.includes(value) && !typed)) {
        throw badRequest(q.other != null && value === q.other
          ? `Escribe tu respuesta para «${q.text}».`
          : `Invalid option: ${q.key}`);
      }
    }
    if (q.type === 'multiple' &&
        (!Array.isArray(value) || !value.every((v) => q.options.includes(v)))) {
      throw badRequest(`Invalid option: ${q.key}`);
    }
    if (q.type === 'user') {
      // Stored as the name of the user, as it is written in their account
      const user = typeof value === 'string' ? await findByName(value) : null;
      if (!user) throw badRequest(`No hay ningún usuario llamado «${String(value).slice(0, 100)}». Elige uno de la lista o regístralo.`);
      if (user.system) throw badRequest(`«${user.name}» no se puede elegir como respuesta. Elige a otro usuario.`);
      if (q.champions && !user.champion) {
        throw badRequest(`«${user.name}» no es champion. Elige uno de los champions de la lista.`);
      }
      if (q.users && !q.users.some((u) => sameName(u.name, user.name))) {
        throw badRequest(`«${user.name}» no es una de las opciones de «${q.text}».`);
      }
      value = user.name;
    }
    clean.push({ questionKey: q.key, value });
  }
  return clean;
};

// The next folio: one more than the last one given. A number is never given twice, even if the
// response it was for is then deleted
const nextFolio = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: FOLIO_COUNTER },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return counter.seq;
};

// Responses saved before folios existed get theirs, oldest first, after the highest folio given.
// Returns how many were numbered
export const ensureFolios = async () => {
  const pending = await Response.find({ folio: { $exists: false } }).sort({ createdAt: 1 }).select('_id').lean();
  // The counter never goes below the folios already given (e.g. if it was reset by hand)
  const highest = await Response.findOne({ folio: { $type: 'number' } }).sort({ folio: -1 }).select('folio').lean();
  if (highest) await Counter.updateOne({ _id: FOLIO_COUNTER }, { $max: { seq: highest.folio } }, { upsert: true });

  for (const { _id } of pending) {
    await Response.updateOne({ _id, folio: { $exists: false } }, { $set: { folio: await nextFolio() } });
  }
  return pending.length;
};

// The other way round of "prefill": when the user picked has no such data in their account (e.g.
// they registered without a payroll number) the answer is saved there. Data an account already
// has is never replaced. An admin completes any account; anyone else, only their own.
// Returns the accounts completed, as [{ name, field }]
const completeAccounts = async (form, clean, submitter) => {
  const valueOf = (key) => clean.find((a) => a.questionKey === key)?.value;
  const completed = [];

  for (const q of form.sections.flatMap((s) => s.questions).filter((q) => q.prefill)) {
    const name = valueOf(q.prefill.question);
    const value = valueOf(q.key);
    if (!name || value == null || value === '') continue;
    const account = await findByName(name);
    if (!account || account[q.prefill.field]) continue;
    if (submitter.role !== ROLES.ADMIN && !account._id.equals(submitter._id)) continue;
    try {
      await updateProfile(account, { [q.prefill.field]: String(value) });
      completed.push({ name: account.name, field: q.prefill.field });
    } catch {
      // Not valid for an account, or another user already has it: the response is saved anyway
    }
  }
  return completed;
};

export const submit = async ({ formVersion, answers } = {}, user) => {
  if (!Array.isArray(answers)) throw badRequest('answers must be a list');

  const form = await findVersion(formVersion);
  if (!form) throw notFound('Form not found');

  const clean = await cleanAnswers(form, new Map(answers.map((a) => [a?.questionKey, a?.value])), { fillAuto: true });
  // Only once the answers are valid, so a rejected response does not use up a folio
  const response = await Response.create({
    folio: await nextFolio(), formKey: form.key, formVersion: form.version, user: user._id, answers: clean,
  });
  const completedAccounts = await completeAccounts(form, clean, user);

  // Who to tell about the new manita: the user picked in the question for champions
  const championKey = form.sections.flatMap((s) => s.questions).find((q) => q.champions)?.key;
  const championName = clean.find((a) => a.questionKey === championKey)?.value;
  const champion = championName ? await findByName(championName) : null;
  return {
    ...toPublicResponse(response, form, user),
    champion: champion ? { name: champion.name, email: champion.email ?? null } : null,
    completedAccounts,
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
  // An "auto" answer missing from an older response is set as of the day it was sent
  response.answers = await cleanAnswers(form, byKey, { now: response.createdAt });
  response.formVersion = form.version;
  await response.save();
  return toPublicResponse(response, form, response.user);
};

// The evidence of a change of progress, checked before anything is saved
const newEvidence = (response, user, from, to, evidence) => {
  const comment = typeof evidence?.comment === 'string' ? evidence.comment.trim() : '';
  if (!comment) throw badRequest('Escribe un comentario como evidencia del avance.');
  if (comment.length > EVIDENCE_COMMENT_MAX) throw badRequest(`El comentario puede tener hasta ${EVIDENCE_COMMENT_MAX} caracteres.`);
  const image = evidence.image ?? null;
  if (image !== null && (typeof image !== 'string' || image.length > EVIDENCE_IMAGE_MAX_LENGTH || !EVIDENCE_IMAGE_PATTERN.test(image))) {
    throw badRequest('La imagen de la evidencia no es válida o es demasiado grande.');
  }
  return new Evidence({ response: response._id, user: user._id, from, to, comment, image });
};

// Tracking of a response, by an admin or by the champion in charge of it:
//   { started: true }          marks it as started (its status answer)
//   { progress, evidence }     0 to 100, only once started; reaching 100 records when it was finished.
//                              A change needs evidence: { comment, image? } (image as a data URL),
//                              except for admins, who may leave it out
export const updateTracking = async (id, { started, progress, evidence } = {}, user) => {
  const response = mongoose.isValidObjectId(id)
    ? await Response.findOne({ _id: id, formKey: FORM_KEY }).populate('user', 'name')
    : null;
  if (!response) throw notFound('Respuesta no encontrada.');

  const form = await findVersion(response.formVersion);
  if (!form) throw notFound('Form not found');

  // Admins update any manita; a champion, only the ones in their charge (picked in the question
  // for champions). Admins may skip the evidence
  const isAdmin = user.role === ROLES.ADMIN;
  const championKey = form.sections.flatMap((s) => s.questions).find((q) => q.champions)?.key;
  const inCharge = user.champion && championKey && sameName(answerOf(response, championKey) ?? '', user.name);
  if (!isAdmin && !inCharge) {
    throw Object.assign(new Error('Solo el champion a cargo de esta manita o un administrador pueden actualizar su avance.'), { status: 403 });
  }
  const skipsEvidence = isAdmin && !evidence?.comment?.trim() && !evidence?.image;

  let record = null;   // the evidence of the change of progress, saved with it
  if (started === true && !isStarted(response)) {
    const status =response.answers.find((a) => a.questionKey === TRACKING.statusKey);
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
    if (response.awardedAt && progress < 100) {
      throw Object.assign(new Error('La manita ya fue premiada: quita el premio antes de bajar su avance.'), { status: 409 });
    }
    const from = response.progress ?? 0;
    if (progress !== from && !skipsEvidence) {
      record = newEvidence(response, user, from, progress, evidence);
      await record.validate();
    }
    response.progress = progress;
    if (progress < 100) response.completedAt = null;
    else response.completedAt ??= new Date();
  }

  await response.save();
  if (record) await record.save();
  return toPublicResponse(response, form, response.user);
};

// Admins only. Marks a finished manita as awarded ({ awarded: true }), or takes the award back
export const updateAward = async (id, { awarded } = {}) => {
  if (typeof awarded !== 'boolean') throw badRequest('El campo awarded debe ser verdadero o falso.');
  const response = mongoose.isValidObjectId(id)
    ? await Response.findOne({ _id: id, formKey: FORM_KEY }).populate('user', 'name')
    : null;
  if (!response) throw notFound('Respuesta no encontrada.');
  if (awarded && !trackingOf(response).completedAt) {
    throw Object.assign(new Error('Solo se puede premiar una manita terminada.'), { status: 409 });
  }
  if (awarded) response.awardedAt ??= new Date();
  else response.awardedAt = null;
  await response.save();
  return toPublicResponse(response, await findVersion(response.formVersion), response.user);
};

// Admins only. Deletes a response for good, with its evidences: it leaves every list, the dashboard
// and the export. Its folio is not given again (see nextFolio)
export const remove = async (id) => {
  const response = mongoose.isValidObjectId(id)
    ? await Response.findOneAndDelete({ _id: id, formKey: FORM_KEY })
    : null;
  if (!response) throw notFound('Respuesta no encontrada.');
  await Evidence.deleteMany({ response: response._id });
};

// The evidences of a response, newest first, with the name of who added each one
export const listEvidence = async (id) => {
  if (!mongoose.isValidObjectId(id) || !(await Response.exists({ _id: id, formKey: FORM_KEY }))) {
    throw notFound('Respuesta no encontrada.');
  }
  const items = await Evidence.find({ response: id }).sort({ createdAt: -1 }).populate('user', 'name').lean();
  return items.map((e) => ({
    id: String(e._id),
    from: e.from,
    to: e.to,
    comment: e.comment,
    image: e.image,
    user: e.user ? { id: String(e.user._id), name: e.user.name } : null,
    createdAt: e.createdAt,
  }));
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

// Columns of the export, in this order, with "header" as their name. "key" is the key of form.json
// they come from:
//   answer    - the answer of that question
//   computed  - that computed field
//   status    - Not Started / In Progress / Completed, from the tracking of the manita (the stored
//               answer is not kept in step with it)
//   description - the answer to the last open question the manita has: the one where the problem is
//               described, whichever its color is (yellow_machine, red_safety, cis_anomaly...)
const EXPORT_COLUMNS = [
  { header: 'Champion',              key: 'champion',        from: 'answer' },
  { header: 'Nombre manita',         key: 'hand_name',       from: 'computed' },
  { header: 'Color',                 key: 'color',           from: 'answer' },
  { header: 'Estatus',               key: 'status',          from: 'status' },
  { header: 'Alerta',                key: 'alert',           from: 'computed' },
  { header: 'Fecha creación',        key: 'creation_date',   from: 'answer' },
  { header: 'Fecha vencimiento',     key: 'expiration_date', from: 'answer' },
  { header: 'Área',                  key: 'area',            from: 'answer' },
  { header: 'Dias transcurridos',    key: 'days_gone',       from: 'computed' },
  { header: 'Días para vencimiento', key: 'expiration_days', from: 'computed' },
  { header: 'Descripción',           key: 'description',     from: 'description' },
];

const statusOf = (response) => {
  const { started, completedAt } = trackingOf(response);
  if (completedAt) return 'Completed';
  return started ? 'In Progress' : 'Not Started';
};

const descriptionOf = (form, answers) => {
  const open = (form?.sections ?? []).flatMap((s) => s.questions).filter((q) => q.type === 'open');
  const answered = open.filter((q) => typeof answers.get(q.key) === 'string' && answers.get(q.key).trim());
  return answered.length ? answers.get(answered.at(-1).key) : '';
};

// Every response as one table (header first), newest first: one row per response with the columns
// of EXPORT_COLUMNS. Each response is read with the form version it was filled with
export const exportTable = async () => {
  const [responses, versions] = await Promise.all([
    Response.find({ formKey: FORM_KEY }).sort({ createdAt: -1 }).lean(),
    listVersions(),
  ]);
  const forms = new Map(versions.map((f) => [f.version, f]));

  const rows = responses.map((r) => {
    const form = forms.get(r.formVersion);
    const answers = new Map(r.answers.map((a) => [a.questionKey, a.value]));
    const fields = new Map((form ? computeFields(form, r.answers, { folio: r.folio ?? null }) : []).map((c) => [c.key, c.value]));
    return EXPORT_COLUMNS.map(({ key, from }) => {
      if (from === 'computed') return fields.get(key);
      if (from === 'status') return statusOf(r);
      if (from === 'description') return descriptionOf(form, answers);
      const value = answers.get(key);
      return Array.isArray(value) ? value.join('; ') : value;
    });
  });

  return [EXPORT_COLUMNS.map((c) => c.header), ...rows];
};
