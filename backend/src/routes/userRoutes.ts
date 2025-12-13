import { Router } from 'express';
import { getUsers, createUser, deleteUser, getSettings, updateSettings } from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/users', requireAdmin, getUsers);
router.post('/users', requireAdmin, createUser);
router.delete('/users/:id', requireAdmin, deleteUser);

router.get('/settings', requireAdmin, getSettings);
router.put('/settings', requireAdmin, updateSettings);

export default router;
