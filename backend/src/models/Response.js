import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionKey: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },    // String (open/single/date) or [String] (multiple)
}, { _id: false });

const responseSchema = new mongoose.Schema({
  formKey: { type: String, required: true },
  formVersion: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // who filled it
  answers: [answerSchema],
}, { timestamps: true });

responseSchema.index({ formKey: 1, formVersion: 1 });
responseSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Response', responseSchema);
