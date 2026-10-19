import * as userService from '../services/user.service.js';
import { toPublicUser } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

const toUserName = (u) => ({ id: String(u._id), name: u.name, champion: u.champion ?? false });

export const getUsers = async (req, res) => {
  const users = await userService.findAll();
  res.json(users.map(toPublicUser));
};

// Just the names (and who is a champion), for any logged user: they are picked as the answer of
// "user" questions
export const getUserNames = async (req, res) => {
  const users = await userService.findPickable();   // not the default admin
  res.json(users.map(toUserName));
};

// Open to anyone (self-registration). Only an admin can choose the role and register a champion
// (with the area in their charge)
export const createUser = async (req, res) => {
  const { name, email, payroll, role, champion, area } = req.body ?? {};
  const isAdmin = req.user?.role === ROLES.ADMIN;
  const user = await userService.create(isAdmin
    ? { name, email, payroll, role, champion, area }
    : { name, email, payroll, role: ROLES.USER });
  res.status(201).json(toPublicUser(user));
};

export const updateMe = async (req, res) => {
  const { name, email, payroll, avatar } = req.body ?? {};
  // The default admin only changes its email
  if (req.user.system && [name, payroll, avatar].some((v) => v !== undefined)) {
    throw Object.assign(new Error('El administrador predeterminado solo puede cambiar su correo electrónico.'), { status: 403 });
  }
  const user = await userService.updateProfile(req.user, { name, email, payroll, avatar });
  res.json(toPublicUser(user));
};

export const updateUser = async (req, res) => {
  const { name, email, payroll, area } = req.body ?? {};
  const user = await userService.updateById(req.params.id, { name, email, payroll, area });
  res.json(toPublicUser(user));
};

export const deleteUser = async (req, res) => {
  await userService.remove(req.params.id, req.user);
  res.status(204).end();
};

export const updateUserRole = async (req, res) => {
  const user = await userService.updateRole(req.params.id, req.body?.role);
  res.json(toPublicUser(user));
};
