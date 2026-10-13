import mongoose from 'mongoose';

export const QUESTION_TYPES = ['open', 'single', 'multiple', 'date', 'user'];
export const COMPUTED_OPS = ['days_since', 'days_until', 'expiration_status'];

const questionSchema = new mongoose.Schema({
  key: { type: String, required: true },          // stable id: "q1", "area_comment"
  text: { type: String, required: true },
  type: {
    type: String,
    enum: QUESTION_TYPES,                          // free text | one option | several | YYYY-MM-DD | name of a user
    required: true,
  },
  options: { type: [String], default: [] },        // only for single / multiple
  champions: { type: Boolean, default: false },    // only for user: just the users marked as champion
  required: { type: Boolean, default: true },
}, { _id: false });

// Values derived from an answer when a response is read, never asked nor stored
const computedSchema = new mongoose.Schema({
  key: { type: String, required: true },
  text: { type: String, required: true },
  op: { type: String, enum: COMPUTED_OPS, required: true },
  source: { type: String, required: true },        // key of a "date" question
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
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
