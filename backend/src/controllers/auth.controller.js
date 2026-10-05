import * as userService from '../services/user.service.js';
import { toPublicUser } from '../models/User.js';

export const login = async (req, res) => {
  const user = await userService.login(req.body?.name);
  res.json(toPublicUser(user));
};

export const getMe = (req, res) => {
  res.json(toPublicUser(req.user));
};
