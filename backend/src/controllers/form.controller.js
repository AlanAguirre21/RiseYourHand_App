import * as formService from '../services/form.service.js';
import * as responseService from '../services/response.service.js';
import { ROLES } from '../constants/roles.js';

export const getForm = async (req, res) => {
  const form = await formService.getCurrent();
  res.json(formService.toPublicForm(form));
};

export const createResponse = async (req, res) => {
  const response = await responseService.submit(req.body, req.user);
  res.status(201).json(response);
};

// Own responses by default; "?scope=all" lists everyone's and is only for admins
export const getResponses = async (req, res) => {
  const all = req.query.scope === 'all';
  if (all && req.user.role !== ROLES.ADMIN) {
    throw Object.assign(new Error('No tienes permiso para esta acción.'), { status: 403 });
  }
  res.json(await responseService.list(all ? {} : { user: req.user._id }));
};
