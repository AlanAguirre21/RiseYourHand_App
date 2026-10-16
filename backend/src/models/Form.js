import mongoose from 'mongoose';

export const QUESTION_TYPES = ['open', 'single', 'multiple', 'date', 'user', 'number'];
export const COMPUTED_OPS = ['days_since', 'days_until', 'expiration_status', 'template'];

// The question is asked only when an earlier "single" question has this option as answer
// (for its "other" option: when the answer was typed)
const showIfSchema = new mongoose.Schema({
  question: { type: String, required: true },     // key of the "single" question
  option: { type: String, required: true },
}, { _id: false });

// The question is not asked: its answer is set when the response is sent (and can be edited after)
//   value              - this answer, e.g. the first option of a status
//   today              - the day it is sent (date questions)
//   add_business_days  - "days" weekdays after the date of "source" (date questions)
export const AUTO_OPS = ['value', 'today', 'add_business_days'];

const autoSchema = new mongoose.Schema({
  op: { type: String, enum: AUTO_OPS, required: true },
  value: { type: String },                        // value
  source: { type: String },                       // add_business_days: key of an earlier date question
  days: { type: Number },                         // add_business_days
}, { _id: false });

// One of the users a "user" question offers: shown as "label: name", answered with the name
const userChoiceSchema = new mongoose.Schema({
  label: { type: String, required: true },        // e.g. the area they are in charge of
  name: { type: String, required: true },         // name of the user, as in their account
}, { _id: false });

// The chat writes in advance, in the answer field, this data of the user picked in an earlier
// "user" question (it can still be changed before sending). E.g. the payroll number of the employee
export const PREFILL_FIELDS = ['payroll', 'email'];

const prefillSchema = new mongoose.Schema({
  question: { type: String, required: true },     // key of the "user" question
  field: { type: String, enum: PREFILL_FIELDS, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  key: { type: String, required: true },          // stable id: "q1", "area_comment"
  text: { type: String, required: true },
  description: { type: String },                   // help shown under the text in the chat
  type: {
    type: String,
    enum: QUESTION_TYPES,                          // free text | one option | several | YYYY-MM-DD | name of a user | whole number
    required: true,
  },
  options: { type: [String], default: [] },        // only for single / multiple
  // Pictures, as paths of the frontend's public folder: "/images/manitas/amarilla.jpg"
  image: { type: String },                         // shown with the question
  optionImages: { type: mongoose.Schema.Types.Mixed, default: undefined },   // { option: path }, single / multiple
  other: { type: String },                         // only for single: the option that asks to type the answer instead
  champions: { type: Boolean, default: false },    // only for user: just the users marked as champion
  users: { type: [userChoiceSchema], default: undefined },   // only for user: just these users
  min: { type: Number },                           // only for number: lowest value allowed (inclusive)
  max: { type: Number },                           // only for number: highest value allowed (inclusive)
  required: { type: Boolean, default: true },     // when it is asked (see showIf)
  showIf: { type: showIfSchema, default: undefined },
  auto: { type: autoSchema, default: undefined },
  prefill: { type: prefillSchema, default: undefined },
}, { _id: false });

// Values derived from an answer when a response is read, never asked nor stored
const computedSchema = new mongoose.Schema({
  key: { type: String, required: true },
  text: { type: String, required: true },
  op: { type: String, enum: COMPUTED_OPS, required: true },
  source: { type: String },                        // date ops: key of a "date" question
  // template op: text with {key} for the answer of a question, {a|b} for the first of them that was
  // answered, and {folio} for the number of the response. E.g. "{folio}_{area}_{operation}"
  template: { type: String },
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },                   // shown under the name in the chat
  questions: [questionSchema],
  computed: { type: [computedSchema], default: [] },
}, { _id: false });

const formSchema = new mongoose.Schema({
  key: { type: String, required: true },
  version: { type: Number, required: true },
  title: { type: String, required: true },
  sections: [sectionSchema],
}, { timestamps: true });

formSchema.index({ key: 1, version: 1 }, { unique: true });

export default mongoose.model('Form', formSchema);
