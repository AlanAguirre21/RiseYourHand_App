import mongoose from 'mongoose';
import User, { NAME_COLLATION, cleanName } from '../models/User.js';
import { ROLES, DEFAULT_ADMIN_NAME } from '../constants/roles.js';
import defaultChampions from '../seed/default_champions.json' with { type: 'json' };

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

const AREA_MAX_LENGTH = 100;

const validArea = (raw) => {
  const area = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  if (!area || area.length > AREA_MAX_LENGTH) {
    throw httpError(400, `Escribe el área o departamento a cargo del champion (máximo ${AREA_MAX_LENGTH} caracteres).`);
  }
  return area;
};

// Email and payroll number are optional one by one: empty means "none" (undefined, so it is not stored)
const isEmpty = (raw) => raw == null || (typeof raw === 'string' && raw.trim() === '');
const optionalEmail = (raw) => (isEmpty(raw) ? undefined : validEmail(raw));
const optionalPayroll = (raw) => (isEmpty(raw) ? undefined : validPayroll(raw));

// A user needs at least one of the two besides the name
const assertContact = (email, payroll) => {
  if (!email && !payroll) throw httpError(400, 'Escribe el correo electrónico o el número de nómina (al menos uno).');
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

// The users that can be picked as the answer of the form: every active one but the default admin
export const findPickable = () =>
  User.find({ active: true, system: { $ne: true } }).collation(NAME_COLLATION).sort({ name: 1 });

const SYSTEM_STATE = { role: ROLES.ADMIN, active: true, system: true, champion: false };

// The default admin always exists, as an active admin. It is created on start (or, when a user with
// that name already exists, made the default admin) and put back as it must be if it was changed by
// hand in the database. Returns its name when something was done, null when it was already right
export const ensureAdmin = async () => {
  const filter = { name: DEFAULT_ADMIN_NAME, ...SYSTEM_STATE };
  if (await User.exists(filter).collation(NAME_COLLATION)) return null;
  try {
    await User.updateOne(
      { name: DEFAULT_ADMIN_NAME },
      { $set: SYSTEM_STATE, $setOnInsert: { name: DEFAULT_ADMIN_NAME } },
      { upsert: true, collation: NAME_COLLATION },
    );
  } catch (err) {
    if (err.code !== 11000) throw err;   // a concurrent call created it first
  }
  return DEFAULT_ADMIN_NAME;
};

// The champions of the question for champions: active, and with the area in their charge
export const findChampions = () =>
  User.find({ champion: true, active: true, area: { $nin: [null, ''] } })
    .collation(NAME_COLLATION).sort({ area: 1, name: 1 }).lean();

// A champion is a user with the area in their charge: the ones of seed/default_champions.json and
// the ones an admin adds. On start, the champions of the file that no user has the name of yet
// (active or not) are created, and existing users with those names are marked as champions. The
// area of the file is only given to the ones that have none, so an area an admin changed stays.
// Users marked as champion before champions had an area (and not in the file) are unmarked. Email and payroll number are optional here.
// Returns the names created, the names unmarked and the entries that failed, with the reason
export const ensureDefaultChampions = async () => {
  if (!Array.isArray(defaultChampions)) throw new Error('seed/default_champions.json must be a list');
  const created = [];
  const failed = [];
  const names = [];

  for (const entry of defaultChampions) {
    const { name, email, payroll, area } = entry ?? {};
    try {
      const cleanArea = validArea(area);
      names.push(validName(name));
      const existing = await User.findOne({ name: cleanName(name) }).collation(NAME_COLLATION);
      if (existing?.system) throw new Error('it is the name of the default admin');
      if (existing) {
        if (!existing.champion || !existing.area) {
          existing.champion = true;
          existing.area ||= cleanArea;
          await existing.save();
        }
        // Still listed in the form, but nobody can pick a deleted user
        if (!existing.active) failed.push({ name: existing.name, reason: 'the user was deleted' });
        continue;
      }
      const user = await create({
        name,
        email,
        payroll: typeof payroll === 'number' ? String(payroll) : payroll,
        champion: true,
        area: cleanArea,
      }, { requireContact: false });
      created.push(user.name);
    } catch (err) {
      failed.push({ name: String(name), reason: err.message });
    }
  }

  const unmarked = await User.find({ champion: true, area: { $in: [null, ''] }, name: { $nin: names } })
    .collation(NAME_COLLATION);
  await User.updateMany({ _id: { $in: unmarked.map((u) => u._id) } }, { $set: { champion: false } });
  return { created, unmarked: unmarked.map((u) => u.name), failed };
};

export const login = async (name) => {
  await ensureAdmin();   // so the default admin can always get in, even if the admins were removed by hand
  const user = await findByName(name);
  if (!user) throw httpError(404, 'No hay ningún usuario con ese nombre. Regístrate para entrar.');
  return user;
};

// requireContact is false only for the users the app creates by itself (seed files), which may come
// with just the name, like the default admin: they can add their email or payroll number later.
// A champion needs the area in their charge and, unless it comes from the seed file, an email
// (the manitas assigned to them are sent there)
export const create = async ({ name, email, payroll, champion = false, area, role = ROLES.USER }, { requireContact = true } = {}) => {
  const clean = validName(name);
  const cleanEmail = optionalEmail(email);
  const cleanPayroll = optionalPayroll(payroll);
  if (requireContact) assertContact(cleanEmail, cleanPayroll);
  const isChampion = champion === true;
  const cleanArea = isChampion ? validArea(area) : undefined;
  if (isChampion && requireContact && !cleanEmail) throw httpError(400, 'Escribe el correo electrónico del champion.');
  if (!Object.values(ROLES).includes(role)) throw httpError(400, 'Rol no válido.');
  await assertNameFree(clean);
  if (cleanEmail) await assertEmailFree(cleanEmail);
  if (cleanPayroll) await assertPayrollFree(cleanPayroll);
  return User.create({ name: clean, email: cleanEmail, payroll: cleanPayroll, champion: isChampion, area: cleanArea, role });
};

export const updateProfile = async (user, { name, email, payroll, avatar }) => {
  if (name !== undefined) {
    const clean = validName(name);
    // Champions are matched by name with default_champions.json, and their manitas keep the name
    if (user.champion && clean !== user.name) {
      throw httpError(409, 'El nombre de un champion no se puede cambiar.');
    }
    // The default admin is found by its name on every start
    if (user.system && clean !== user.name) {
      throw httpError(409, 'El nombre del administrador predeterminado no se puede cambiar.');
    }
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

// For admins. The user is deactivated, not erased: the manitas keep who reported them and who is
// in charge, and the name stays taken. A deleted user can no longer log in nor be picked.
// Nobody can delete themselves, so there is always an admin left (the one deleting)
export const remove = async (id, actor) => {
  const user = await findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado.');
  if (user._id.equals(actor._id)) throw httpError(409, 'No puedes eliminar tu propio usuario.');
  if (user.system) throw httpError(409, 'El administrador predeterminado no se puede eliminar.');
  user.active = false;
  return user.save();
};

// For admins: the name, email and payroll number of any user, and the area of a champion. The
// default admin is not editable by anyone else (it edits its own data, but its name, in its profile)
export const updateById = async (id, { name, email, payroll, area }) => {
  const user = await findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado.');
  if (user.system) throw httpError(403, 'El administrador predeterminado no se puede editar.');
  if (area !== undefined) {
    if (!user.champion) throw httpError(400, 'Solo los champions tienen un área a cargo.');
    user.area = validArea(area);
  }
  return updateProfile(user, { name, email, payroll });
};

export const updateRole = async (id, role) => {
  if (!Object.values(ROLES).includes(role)) throw httpError(400, 'Rol no válido.');
  const user = await findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado.');
  if (user.system && role !== ROLES.ADMIN) {
    throw httpError(409, 'El administrador predeterminado siempre es administrador.');
  }

  if (user.role === ROLES.ADMIN && role !== ROLES.ADMIN && (await countAdmins()) <= 1) {
    throw httpError(409, 'Debe quedar al menos un administrador.');
  }
  user.role = role;
  return user.save();
};
