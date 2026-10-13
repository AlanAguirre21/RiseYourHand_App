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
  const users = await userService.findAll();
  res.json(users.map(toUserName));
};

// Open to anyone (self-registration). Only an admin can choose the role, and only a logged user
// can register a champion (from the form)
export const createUser = async (req, res) => {
  const { name, email, payroll, champion, role } = req.body ?? {};
  const isAdmin = req.user?.role === ROLES.ADMIN;
  const user = await userService.create({
    name, email, payroll,
    champion: req.user ? champion : false,
    role: isAdmin ? role : ROLES.USER,
  });
  res.status(201).json(toPublicUser(user));
};

export const updateMe = async (req, res) => {
  const { name, email, payroll, avatar } = req.body ?? {};
  const user = await userService.updateProfile(req.user, { name, email, payroll, avatar });
  res.json(toPublicUser(user));
};

export const updateUser = async (req, res) => {
  const { name, email, payroll, champion } = req.body ?? {};
  const user = await userService.updateById(req.params.id, { name, email, payroll, champion });
  res.json(toPublicUser(user));
};

export const markUserChampion = async (req, res) => {
  res.json(toUserName(await userService.markChampion(req.params.id)));
};

export const updateUserRole = async (req, res) => {
  const user = await userService.updateRole(req.params.id, req.body?.role);
  res.json(toPublicUser(user));
};
