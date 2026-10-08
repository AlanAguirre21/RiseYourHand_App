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

// Own responses by default; "?scope=all" lists everyone's and is only for admins
export const getResponses = async (req, res) => {
  const all = req.query.scope === 'all';
  if (all && req.user.role !== ROLES.ADMIN) {
    throw Object.assign(new Error('No tienes permiso para esta acción.'), { status: 403 });
  }
  res.json(await responseService.list(all ? {} : { user: req.user._id }));
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
