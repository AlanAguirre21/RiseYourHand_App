import { Router } from 'express';
import { getUsers, createUser, updateMe, updateUserRole } from '../controllers/user.controller.js';
import { optionalAuth, requireAuth, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post('/', optionalAuth, createUser);
router.patch('/me', requireAuth, updateMe);
router.get('/', requireAuth, requireRole(ROLES.ADMIN), getUsers);
router.patch('/:id/role', requireAuth, requireRole(ROLES.ADMIN), updateUserRole);

export default router;
