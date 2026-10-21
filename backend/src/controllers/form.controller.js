import { timingSafeEqual } from 'node:crypto';
import * as formService from '../services/form.service.js';
import * as responseService from '../services/response.service.js';
import { ROLES } from '../constants/roles.js';
import { toCsv } from '../utils/csv.js';

export const getForm = async (req, res) => {
  const form = await formService.getCurrent();
  res.json(formService.toPublicForm(form));
};

export const createResponse = async (req, res) => {
  const response = await responseService.submit(req.body, req.user);
  res.status(201).json(response);
};

// Admins only (see form.routes.js)
export const updateResponse = async (req, res) => {
  res.json(await responseService.update(req.params.id, req.body));
};

// Admins only (see form.routes.js). Marks a finished manita as awarded, or takes it back
export const updateResponseAward = async (req, res) => {
  res.json(await responseService.updateAward(req.params.id, req.body));
};

// Admins only (see form.routes.js). Deletes a manita and its evidences
export const deleteResponse = async (req, res) => {
  await responseService.remove(req.params.id);
  res.status(204).end();
};

// Start or advance of a manita, with its evidence. Admins, or the champion in charge of it
export const updateResponseTracking = async (req, res) => {
  res.json(await responseService.updateTracking(req.params.id, req.body, req.user));
};

export const getResponseEvidence = async (req, res) => {
  res.json(await responseService.listEvidence(req.params.id));
};

// By default the manitas of the user (with them as champion or as the person who reported it); "?scope=all" lists everyone's and is only for admins
export const getResponses = async (req, res) => {
  const all = req.query.scope === 'all';
  if (all && req.user.role !== ROLES.ADMIN) {
    throw Object.assign(new Error('No tienes permiso para esta acción.'), { status: 403 });
  }
  // The computed fields change with the date: never served from a cache
  res
    .set('Cache-Control', 'no-store')
    .json(await (all ? responseService.list() : responseService.listOf(req.user)));
};

// Every manita, for the tracking page: any logged user can read them, only admins change them
export const getTracking = async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await responseService.list());
};

// Every manita, without the limit of the lists: the dashboard counts all of them. Admins only
export const getDashboard = async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await responseService.list({}, 0));
};

// Key of the export link, for the admin that shares it with Power BI
export const getExportKey = (req, res) => {
  if (!process.env.EXPORT_KEY) {
    throw Object.assign(new Error('La exportación no está configurada (falta EXPORT_KEY en el servidor).'), { status: 503 });
  }
  res.json({ key: process.env.EXPORT_KEY });
};

// Power BI reads this link on its own, without a session: the access is the "?key=" of the link
export const exportResponses = async (req, res) => {
  const expected = Buffer.from(process.env.EXPORT_KEY ?? '');
  const given = Buffer.from(String(req.query.key ?? ''));
  if (!expected.length || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw Object.assign(new Error('Enlace de exportación no válido.'), { status: 401 });
  }
  res
    .type('text/csv')
    .set('Content-Disposition', 'inline; filename="respuestas.csv"')
    .set('Cache-Control', 'no-store')
    .send(toCsv(await responseService.exportTable()));
};
