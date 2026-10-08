import { Router } from 'express';
import { getForm, createResponse, getResponses, getExportKey, exportResponses } from '../controllers/form.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Before requireAuth: it is opened by Power BI with the key of the link, not by a logged user
router.get('/responses.csv', exportResponses);

router.use(requireAuth);

router.get('/', getForm);
router.get('/responses', getResponses);
router.post('/responses', createResponse);
router.get('/export-key', requireRole(ROLES.ADMIN), getExportKey);

export default router;
