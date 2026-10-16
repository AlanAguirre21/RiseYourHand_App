import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionKey: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },    // String (open/single/date/user), Number (number) or [String] (multiple)
}, { _id: false });

const responseSchema = new mongoose.Schema({
  // Number of the manita: 1, 2, 3... in the order they were sent (see nextFolio). Responses saved
  // before it existed get theirs on startup (ensureFolios)
  folio: { type: Number },
  formKey: { type: String, required: true },
  formVersion: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // who filled it
  answers: [answerSchema],
  // Tracking: percentage of advance, and when it reached 100 (null while unfinished)
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

responseSchema.index({ folio: 1 }, { unique: true, partialFilterExpression: { folio: { $type: 'number' } } });
responseSchema.index({ formKey: 1, formVersion: 1 });
responseSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Response', responseSchema);
