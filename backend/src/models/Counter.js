import mongoose from 'mongoose';

// Sequences that must not repeat, e.g. the folio of the responses. Increased atomically, so two
// requests at the same time never get the same number
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // name of the sequence
  seq: { type: Number, required: true },   // last number given
}, { versionKey: false });

export default mongoose.model('Counter', counterSchema);
