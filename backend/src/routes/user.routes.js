import { Router } from 'express';
import { getUsers, getUserNames, createUser, updateMe, updateUser, markUserChampion, updateUserRole } from '../controllers/user.controller.js';
import { optionalAuth, requireAuth, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post('/', optionalAuth, createUser);
router.patch('/me', requireAuth, updateMe);
router.get('/names', requireAuth, getUserNames);
router.get('/', requireAuth, requireRole(ROLES.ADMIN), getUsers);
router.patch('/:id', requireAuth, requireRole(ROLES.ADMIN), updateUser);
router.patch('/:id/champion', requireAuth, markUserChampion);
router.patch('/:id/role', requireAuth, requireRole(ROLES.ADMIN), updateUserRole);

export default router;
