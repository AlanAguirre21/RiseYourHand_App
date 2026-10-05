import mongoose from 'mongoose';
import User, { NAME_COLLATION, cleanName } from '../models/User.js';
import { ROLES, DEFAULT_ADMIN_NAME } from '../constants/roles.js';

const httpError = (status, msg) => Object.assign(new Error(msg), { status });

const NAME_MIN_LENGTH = 3;

const validName = (raw) => {
  const name = cleanName(raw);
  if (name.length < NAME_MIN_LENGTH) throw httpError(400, `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres.`);
  return name;
};

// Names are unique ignoring case and accents, also against inactive users (the index covers them)
const assertNameFree = async (name, exceptId) => {
  const filter = exceptId ? { name, _id: { $ne: exceptId } } : { name };
  const taken = await User.findOne(filter).collation(NAME_COLLATION);
  if (taken) throw httpError(409, 'Ya existe un usuario con ese nombre.');
};

const countAdmins = () => User.countDocuments({ role: ROLES.ADMIN, active: true });

export const findAll = () => User.find({ active: true }).collation(NAME_COLLATION).sort({ name: 1 });

export const findById = (id) =>
  (mongoose.isValidObjectId(id) ? User.findOne({ _id: id, active: true }) : null);

export const findByName = (name) =>
  User.findOne({ name: cleanName(name), active: true }).collation(NAME_COLLATION);

// The app must always have an admin. If there is none, the default one is created (or, when a user
// with that name already exists, promoted and reactivated). Returns its name, or null if nothing was needed
export const ensureAdmin = async () => {
  if ((await countAdmins()) > 0) return null;
  try {
    await User.updateOne(
      { name: DEFAULT_ADMIN_NAME },
      { $set: { role: ROLES.ADMIN, active: true }, $setOnInsert: { name: DEFAULT_ADMIN_NAME } },
      { upsert: true, collation: NAME_COLLATION },
    );
  } catch (err) {
    if (err.code !== 11000) throw err;   // a concurrent call created it first
  }
  return DEFAULT_ADMIN_NAME;
};

export const login = async (name) => {
  await ensureAdmin();   // so the default admin can always get in, even if the admins were removed by hand
  const user = await findByName(name);
  if (!user) throw httpError(404, 'No hay ningún usuario con ese nombre. Regístrate para entrar.');
  return user;
};

export const create = async ({ name, role = ROLES.USER }) => {
  const clean = validName(name);
  if (!Object.values(ROLES).includes(role)) throw httpError(400, 'Rol no válido.');
  await assertNameFree(clean);
  return User.create({ name: clean, role });
};

export const updateProfile = async (user, { name, avatar }) => {
  if (name !== undefined) {
    const clean = validName(name);
    await assertNameFree(clean, user._id);
    user.name = clean;
  }
  if (avatar !== undefined) user.avatar = avatar;
  return user.save();
};

export const updateRole = async (id, role) => {
  if (!Object.values(ROLES).includes(role)) throw httpError(400, 'Rol no válido.');
  const user = await findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado.');

  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN && (await countAdmins()) <= 1) {
    throw httpError(409, 'Debe quedar al menos un administrador.');
  }
  user.role = role;
  return user.save();
};
