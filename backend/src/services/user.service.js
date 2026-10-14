import mongoose from 'mongoose';
import User, { NAME_COLLATION, cleanName } from '../models/User.js';
import { ROLES, DEFAULT_ADMIN_NAME } from '../constants/roles.js';

const httpError = (status, msg) => Object.assign(new Error(msg), { status });

const NAME_MIN_LENGTH = 3;
const EMAIL_MAX_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYROLL_PATTERN = /^[A-Z0-9-]{1,20}$/;

const validName = (raw) => {
  const name = cleanName(raw);
  if (name.length < NAME_MIN_LENGTH) throw httpError(400, `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres.`);
  return name;
};

const validEmail = (raw) => {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw httpError(400, 'Escribe un correo electrónico válido.');
  }
  return email;
};

const validPayroll = (raw) => {
  const payroll = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!PAYROLL_PATTERN.test(payroll)) {
    throw httpError(400, 'El número de nómina solo puede tener letras, números y guiones (máximo 20).');
  }
  return payroll;
};

// Email and payroll number are optional one by one: empty means "none" (undefined, so it is not stored)
const isEmpty = (raw) => raw == null || (typeof raw === 'string' && raw.trim() === '');
const optionalEmail = (raw) => (isEmpty(raw) ? undefined : validEmail(raw));
const optionalPayroll = (raw) => (isEmpty(raw) ? undefined : validPayroll(raw));

// A user needs at least one of the two besides the name
const assertContact = (email, payroll) => {
  if (!email && !payroll) throw httpError(400, 'Escribe el correo electrónico o el número de nómina (al menos uno).');
};

const validChampion = (raw) => {
  if (typeof raw !== 'boolean') throw httpError(400, 'El campo champion debe ser verdadero o falso.');
  return raw;
};

// Names are unique ignoring case and accents, also against inactive users (the index covers them)
const assertNameFree = async (name, exceptId) => {
  const filter = exceptId ? { name, _id: { $ne: exceptId } } : { name };
  const taken = await User.findOne(filter).collation(NAME_COLLATION);
  if (taken) throw httpError(409, 'Ya existe un usuario con ese nombre.');
};

// Email and payroll number are stored normalized, so an exact match is enough
const assertFieldFree = async (field, value, msg, exceptId) => {
  const filter = exceptId ? { [field]: value, _id: { $ne: exceptId } } : { [field]: value };
  if (await User.exists(filter)) throw httpError(409, msg);
};
const assertEmailFree = (email, exceptId) =>
  assertFieldFree('email', email, 'Ya existe un usuario con ese correo electrónico.', exceptId);
const assertPayrollFree = (payroll, exceptId) =>
  assertFieldFree('payroll', payroll, 'Ya existe un usuario con ese número de nómina.', exceptId);

const countAdmins =() => User.countDocuments({ role: ROLES.ADMIN, active: true });

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

export const create = async ({ name, email, payroll, champion = false, role = ROLES.USER }) => {
  const clean = validName(name);
  const cleanEmail = optionalEmail(email);
  const cleanPayroll = optionalPayroll(payroll);
  assertContact(cleanEmail, cleanPayroll);
  const isChampion = validChampion(champion);
  if (!Object.values(ROLES).includes(role)) throw httpError(400, 'Rol no válido.');
  await assertNameFree(clean);
  if (cleanEmail) await assertEmailFree(cleanEmail);
  if (cleanPayroll) await assertPayrollFree(cleanPayroll);
  return User.create({ name: clean, email: cleanEmail, payroll: cleanPayroll, champion: isChampion, role });
};

export const updateProfile = async (user, { name, email, payroll, avatar }) => {
  if (name !== undefined) {
    const clean = validName(name);
    await assertNameFree(clean, user._id);
    user.name = clean;
  }
  // An empty email or payroll number removes it, as long as the other one stays
  if (email !== undefined) {
    const clean = optionalEmail(email);
    if (clean) await assertEmailFree(clean, user._id);
    user.email = clean;
  }
  if (payroll !== undefined) {
    const clean = optionalPayroll(payroll);
    if (clean) await assertPayrollFree(clean, user._id);
    user.payroll = clean;
  }
  if (email !== undefined || payroll !== undefined) assertContact(user.email, user.payroll);
  if (avatar !== undefined) user.avatar = avatar;
  return user.save();
};

// For admins: the name, email, payroll number and champion flag of any user
export const updateById = async (id, { name, email, payroll, champion }) => {
  const user = await findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado.');
  if (champion !== undefined) user.champion = validChampion(champion);
  return updateProfile(user, { name, email, payroll });
};

// Open to any logged user, from the form: it only turns the flag on. Turning it off is for admins
export const markChampion = async (id) => {
  const user = await findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado.');
  user.champion = true;
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
