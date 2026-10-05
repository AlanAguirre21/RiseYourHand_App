import User from '../models/user.model.js';

export const findAll = () => User.find();

export const create = (data) => User.create(data);