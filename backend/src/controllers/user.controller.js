import * as userService from '../services/user.service.js';
import { toPublicUser } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

export const getUsers = async (req, res) => {
  const users = await userService.findAll();
  res.json(users.map(toPublicUser));
};

// Open to anyone (self-registration), but only an admin can choose the role
export const createUser = async (req, res) => {
  const { name, role } = req.body ?? {};
  const isAdmin = req.user?.role === ROLES.ADMIN;
  const user = await userService.create({ name, role: isAdmin ? role : ROLES.USER });
  res.status(201).json(toPublicUser(user));
};

export const updateMe = async (req, res) => {
  const { name, avatar } = req.body ?? {};
  const user = await userService.updateProfile(req.user, { name, avatar });
  res.json(toPublicUser(user));
};

export const updateUserRole = async (req, res) => {
  const user = await userService.updateRole(req.params.id, req.body?.role);
  res.json(toPublicUser(user));
};
