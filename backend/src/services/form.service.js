import Form, { QUESTION_TYPES, COMPUTED_OPS, AUTO_OPS, PREFILL_FIELDS } from '../models/Form.js';
import Response from '../models/Response.js';
import { FOLIO_KEY, templateKeys } from '../utils/computed.js';
import { findChampions } from './user.service.js';
import formData from '../seed/form.json' with { type: 'json' };

export const FORM_STATUS_MESSAGES = {
  created: 'created from seed/form.json',
  updated: 'updated from seed/form.json (it had no responses yet)',
  outdated: 'differs from seed/form.json but already has responses: increment "version" to apply the changes',
};

// The project has a single form: the one defined in seed/form.json
export const FORM_KEY = formData.key;

// The choices of the question for champions ("champions": true) are not written in form.json: they
// are the champions registered (seeded from seed/default_champions.json, or added by an admin),
// shown as "area: name". They are added when the form is read, so every version offers the current ones
const championChoices = async () => (await findChampions()).map((u) => ({ label: u.area, name: u.name }));

const withChampions = (form, choices) => form && {
  ...form,
  sections: form.sections.map((s) => ({
    ...s,
    questions: (s.questions ?? []).map((q) => (q.champions ? { ...q, users: choices } : q)),
  })),
};

export function validate(form) {
  const fail = msg => { throw new Error(`"${form.key}": ${msg}`); };

  if (!form.sections?.length) fail('needs at least one section');
  const sectionKeys = form.sections.map(s => s.key);
  if (new Set(sectionKeys).size !== sectionKeys.length) fail('section keys must be unique');

  const questions = form.sections.flatMap(s => s.questions ?? []);
  const computed = form.sections.flatMap(s => s.computed ?? []);
  const keys = [...questions, ...computed].map(q => q.key);
  if (new Set(keys).size !== keys.length) fail('question and computed keys must be unique');

  for (const s of form.sections) {
    if (!s.questions?.length) fail(`section "${s.key}" has no questions`);
  }
  for (const [i, q] of questions.entries()) {
    if (!QUESTION_TYPES.includes(q.type)) fail(`question "${q.key}" has unknown type "${q.type}"`);
    if (q.showIf) {
      // Only on an earlier question, so the form can be walked in order
      const source = questions.slice(0, i).find(s => s.key === q.showIf.question);
      if (source?.type !== 'single') fail(`question "${q.key}": "showIf" needs an earlier single question`);
      if (!source.options?.includes(q.showIf.option)) {
        fail(`question "${q.key}": "showIf" option "${q.showIf.option}" is not an option of "${source.key}"`);
      }
    }
    if (['single', 'multiple'].includes(q.type) && !q.options?.length) {
      fail(`question "${q.key}" needs options`);
    }
    if (q.champions && q.type !== 'user') fail(`question "${q.key}": "champions" is only for user questions`);
    const isPath = p => typeof p === 'string' && p.startsWith('/');
    if (q.image != null && !isPath(q.image)) fail(`question "${q.key}": "image" must be a path starting with "/"`);
    if (q.optionImages != null) {
      if (!['single', 'multiple'].includes(q.type)) fail(`question "${q.key}": "optionImages" is only for single and multiple questions`);
      for (const [option, path] of Object.entries(q.optionImages)) {
        if (!q.options.includes(option)) fail(`question "${q.key}": "optionImages" has "${option}", which is not an option`);
        if (!isPath(path)) fail(`question "${q.key}": the image of "${option}" must be a path starting with "/"`);
      }
    }
    if (q.users) {
      if (q.type !== 'user' || !q.users.length) fail(`question "${q.key}": "users" must be a non-empty list on a user question`);
      if (q.users.some(u => !u?.label || !u?.name)) fail(`question "${q.key}": every one of "users" needs a label and a name`);
      const names = q.users.map(u => u.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) fail(`question "${q.key}": a user is listed twice in "users"`);
    }
    if (q.other != null && (q.type !== 'single' || !q.options?.includes(q.other))) {
      fail(`question "${q.key}": "other" must be one of the options of a single question`);
    }
    if (q.auto) {
      const { op, value, source, days } = q.auto;
      if (!AUTO_OPS.includes(op)) fail(`question "${q.key}" has unknown auto op "${op}"`);
      if (q.showIf) fail(`question "${q.key}": "auto" and "showIf" cannot go together`);
      if (op === 'value' && (q.type !== 'single' || !q.options?.includes(value))) {
        fail(`question "${q.key}": auto "value" must be one of the options of a single question`);
      }
      if (op !== 'value' && q.type !== 'date') fail(`question "${q.key}": auto "${op}" is only for date questions`);
      if (op === 'add_business_days') {
        if (questions.slice(0, i).find(s => s.key === source)?.type !== 'date') {
          fail(`question "${q.key}": auto "source" must be an earlier date question`);
        }
        if (!Number.isInteger(days) || days < 0) fail(`question "${q.key}": auto "days" must be a whole number, 0 or more`);
      }
    }
    if (q.prefill) {
      if (!['open', 'number'].includes(q.type)) fail(`question "${q.key}": "prefill" is only for open and number questions`);
      if (questions.slice(0, i).find(s => s.key === q.prefill.question)?.type !== 'user') {
        fail(`question "${q.key}": "prefill" needs an earlier user question`);
      }
      if (!PREFILL_FIELDS.includes(q.prefill.field)) fail(`question "${q.key}": "prefill" field must be one of ${PREFILL_FIELDS.join(', ')}`);
    }
    if ((q.min != null || q.max != null) && q.type !== 'number') {
      fail(`question "${q.key}": "min" and "max" are only for number questions`);
    }
    if (q.min != null && q.max != null && q.min > q.max) fail(`question "${q.key}": "min" is greater than "max"`);
  }
  for (const c of computed) {
    if (!COMPUTED_OPS.includes(c.op)) fail(`computed "${c.key}" has unknown op "${c.op}"`);
    if (c.op === 'template') {
      if (typeof c.template !== 'string' || !c.template) fail(`computed "${c.key}" needs a template`);
      const unknown = templateKeys(c.template).filter(k => k !== FOLIO_KEY && !questions.some(q => q.key === k));
      if (unknown.length) fail(`computed "${c.key}": the template uses unknown keys ${unknown.join(', ')}`);
    } else if (questions.find(q => q.key === c.source)?.type !== 'date') {
      fail(`computed "${c.key}" needs a date question as source`);
    }
  }
}

// Same shape for form.json and for the stored document, with the schema defaults applied to both
const definitionOf = (form) => {
  const { title, sections } = new Form(form).toObject();
  return JSON.stringify({ title, sections });
};

// Keeps the database in step with form.json. Returns what happened:
//   'created'  - this version was not stored yet
//   'updated'  - form.json changed and nobody had answered this version, so it was replaced
//   'outdated' - form.json changed but this version already has responses: increment "version"
//   null       - nothing to do
export const ensureForm = async () => {
  const listed = formData.sections?.flatMap((s) => s.questions ?? []).find((q) => q.champions && q.users);
  if (listed) throw new Error(`"${formData.key}": question "${listed.key}" takes its users from the registered champions, not from "users"`);
  validate(formData);
  const stored = await Form.findOne({ key: formData.key, version: formData.version }).lean();
  if (!stored) {
    await Form.create(formData);
    return 'created';
  }
  if (definitionOf(stored) === definitionOf(formData)) return null;

  const answered = await Response.exists({ formKey: formData.key, formVersion: formData.version });
  if (answered) return 'outdated';

  await Form.replaceOne({ _id: stored._id }, formData, { runValidators: true });
  return 'updated';
};

export const findVersion = async (version) =>
  withChampions(await Form.findOne({ key: FORM_KEY, version }).lean(), await championChoices());

// Every stored version, oldest first
export const listVersions = async () => {
  const [forms, choices] = await Promise.all([Form.find({ key: FORM_KEY }).sort({ version: 1 }).lean(), championChoices()]);
  return forms.map((f) => withChampions(f, choices));
};

// Latest version: the one new responses are filled against
export const getCurrent = async () => {
  const form = await Form.findOne({ key: FORM_KEY }).sort({ version: -1 }).lean();
  if (!form) throw Object.assign(new Error('Form not found'), { status: 404 });
  return withChampions(form, await championChoices());
};

export const toPublicForm = f => ({
  key: f.key,
  version: f.version,
  title: f.title,
  sections: f.sections,
});
