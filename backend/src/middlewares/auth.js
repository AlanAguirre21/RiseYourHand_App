import * as userService from '../services/user.service.js';

const httpError = (status, msg) => Object.assign(new Error(msg), { status });

// Access is by name only, so there is no password nor signed token: the session is the user id,
// sent as "Authorization: Bearer <id>"
const userFrom = (req) => {
  const [scheme, id] = (req.headers.authorization ?? '').split(' ');
  return scheme === 'Bearer' && id ? userService.findById(id) : null;
};

// Sets req.user when a valid session comes with the request, without requiring it
export const optionalAuth = async (req, res, next) => {
  req.user = await userFrom(req);
  next();
};

export const requireAuth = async (req, res, next) => {
  req.user = await userFrom(req);
  if (!req.user) throw httpError(401, 'Inicia sesión para continuar.');
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw httpError(403, 'No tienes permiso para esta acción.');
  next();
};
