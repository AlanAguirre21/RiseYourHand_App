import Form, { QUESTION_TYPES, COMPUTED_OPS } from '../models/Form.js';
import Response from '../models/Response.js';
import formData from '../seed/form.json' with { type: 'json' };

export const FORM_STATUS_MESSAGES = {
  created: 'created from seed/form.json',
  updated: 'updated from seed/form.json (it had no responses yet)',
  outdated: 'differs from seed/form.json but already has responses: increment "version" to apply the changes',
};

// The project has a single form: the one defined in seed/form.json
export const FORM_KEY = formData.key;

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
  for (const q of questions) {
    if (!QUESTION_TYPES.includes(q.type)) fail(`question "${q.key}" has unknown type "${q.type}"`);
    if (['single', 'multiple'].includes(q.type) && !q.options?.length) {
      fail(`question "${q.key}" needs options`);
    }
  }
  for (const c of computed) {
    if (!COMPUTED_OPS.includes(c.op)) fail(`computed "${c.key}" has unknown op "${c.op}"`);
    if (questions.find(q => q.key === c.source)?.type !== 'date') {
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

export const findVersion = (version) => Form.findOne({ key: FORM_KEY, version }).lean();

// Latest version: the one new responses are filled against
export const getCurrent = async () => {
  const form = await Form.findOne({ key: FORM_KEY }).sort({ version: -1 }).lean();
  if (!form) throw Object.assign(new Error('Form not found'), { status: 404 });
  return form;
};

export const toPublicForm = f => ({
  key: f.key,
  version: f.version,
  title: f.title,
  sections: f.sections,
});
