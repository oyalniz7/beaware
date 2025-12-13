import { Router } from 'express';
import { getScans, startScan } from '../controllers/scanController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getScans);
router.post('/', startScan);

export default router;
