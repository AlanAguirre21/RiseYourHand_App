import { Router } from 'express';
import { getForm, createResponse, getResponses, getTracking, getDashboard, updateResponse, deleteResponse,updateResponseAward, updateResponseTracking, getResponseEvidence, getExportKey, exportResponses } from '../controllers/form.controller.js';
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
router.post('/responses', createResponse);   // any logged user fills the form
router.patch('/responses/:id', requireRole(ROLES.ADMIN), updateResponse);
router.delete('/responses/:id', requireRole(ROLES.ADMIN), deleteResponse);
router.patch('/responses/:id/award', requireRole(ROLES.ADMIN), updateResponseAward);
router.patch('/responses/:id/tracking', updateResponseTracking);   // admins, or the champion in charge (see updateTracking)
router.get('/responses/:id/evidence', getResponseEvidence);   // anyone who sees the tracking
router.get('/export-key', requireRole(ROLES.ADMIN), getExportKey);

export default router;
