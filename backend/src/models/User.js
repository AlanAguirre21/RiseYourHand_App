import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

export const NAME_COLLATION = { locale: 'es', strength: 1 };

// The picture is stored inline as a small data URL (the frontend resizes it before uploading)
export const AVATAR_MAX_LENGTH = 90_000;
export const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

const UserSchema = new Schema({
    name:   { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    role:   { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    avatar: { type: String, default: null, maxlength: AVATAR_MAX_LENGTH, match: AVATAR_PATTERN },
    active: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });

export const cleanName = name => (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '');

export const toPublicUser = u => ({
  id: String(u._id),
  name: u.name,
  role: u.role,
  avatar: u.avatar ?? null,
  createdAt: u.createdAt,
});

export default model('User', UserSchema);