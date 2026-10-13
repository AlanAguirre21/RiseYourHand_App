import { Schema, model } from 'mongoose';
import { ROLES } from '../constants/roles.js';

export const NAME_COLLATION = { locale: 'es', strength: 1 };

// The picture is stored inline as a small data URL (the frontend resizes it before uploading)
export const AVATAR_MAX_LENGTH = 90_000;
export const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

const UserSchema = new Schema({
    name:   { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    // Optional in the schema because older users (and the default admin) were created without them;
    // user.service.js requires both for new users
    email:   { type: String, trim: true, lowercase: true, maxlength: 100 },
    payroll: { type: String, trim: true, uppercase: true, maxlength: 20 },
    champion: { type: Boolean, default: false },   // can be in charge of manitas
    role:   { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    avatar: { type: String, default: null, maxlength: AVATAR_MAX_LENGTH, match: AVATAR_PATTERN },
    active: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });
// Unique only among the users that have one
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
UserSchema.index({ payroll: 1 }, { unique: true, partialFilterExpression: { payroll: { $type: 'string' } } });

export const cleanName = name => (typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '');

export const toPublicUser = u => ({
  id: String(u._id),
  name: u.name,
  email: u.email ?? null,
  payroll: u.payroll ?? null,
  champion: u.champion ?? false,
  role: u.role,
  avatar: u.avatar ?? null,
  createdAt: u.createdAt,
});

export default model('User', UserSchema);