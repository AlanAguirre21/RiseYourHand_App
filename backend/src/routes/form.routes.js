import { Router } from 'express';
import { getForm, createResponse, getResponses } from '../controllers/form.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getForm);
router.get('/responses', getResponses);
router.post('/responses', createResponse);

export default router;
