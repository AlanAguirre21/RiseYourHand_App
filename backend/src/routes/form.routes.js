import { Router } from 'express';
import { getForm, createResponse, getResponses, getTracking, getDashboard, updateResponse, updateResponseTracking, getExportKey, exportResponses } from '../controllers/form.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Before requireAuth: it is opened by Power BI with the key of the link, not by a logged user
router.get('/responses.csv', exportResponses);

router.use(requireAuth);

router.get('/', getForm);
router.get('/responses', getResponses);
router.get('/tracking', getTracking);
router.get('/dashboard', requireRole(ROLES.ADMIN), getDashboard);
router.post('/responses', requireRole(ROLES.ADMIN), createResponse);
router.patch('/responses/:id', requireRole(ROLES.ADMIN), updateResponse);
router.patch('/responses/:id/tracking', requireRole(ROLES.ADMIN), updateResponseTracking);
router.get('/export-key', requireRole(ROLES.ADMIN), getExportKey);

export default router;
