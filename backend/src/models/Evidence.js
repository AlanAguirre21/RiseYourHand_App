import mongoose from 'mongoose';

export const EVIDENCE_COMMENT_MAX = 1000;
// The picture is resized by the frontend (at most 1280 px) and sent inline as a data URL
export const EVIDENCE_IMAGE_MAX_LENGTH = 700_000;
export const EVIDENCE_IMAGE_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// What justifies a change of the progress of a manita: who changed it, from what to what, a comment
// and, if they added one, a picture. Kept apart from the response, so listing the manitas does not
// load the pictures
const evidenceSchema = new mongoose.Schema({
  response: { type: mongoose.Schema.Types.ObjectId, ref: 'Response', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: Number, required: true, min: 0, max: 100 },
  to: { type: Number, required: true, min: 0, max: 100 },
  comment: { type: String, required: true, trim: true, maxlength: EVIDENCE_COMMENT_MAX },
  image: { type: String, default: null, maxlength: EVIDENCE_IMAGE_MAX_LENGTH, match: EVIDENCE_IMAGE_PATTERN },
}, { timestamps: true });

evidenceSchema.index({ response: 1, createdAt: -1 });

export default mongoose.model('Evidence', evidenceSchema);
