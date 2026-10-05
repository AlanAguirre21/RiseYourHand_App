import * as userService from '../services/user.service.js';

export const getUsers = async (req, res) => {
  const users = await userService.findAll();
  res.json(users);
};

export const createUser = async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
};