import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionKey: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },    // String (open/single/date/user) or [String] (multiple)
}, { _id: false });

const responseSchema = new mongoose.Schema({
  formKey: { type: String, required: true },
  formVersion: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // who filled it
  answers: [answerSchema],
  // Tracking: percentage of advance, and when it reached 100 (null while unfinished)
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

responseSchema.index({ formKey: 1, formVersion: 1 });
responseSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Response', responseSchema);
