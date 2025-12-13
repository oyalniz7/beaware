import { Router } from 'express';
import { getVulnerabilities, createVulnerability, getRisks, updateRiskStatus } from '../controllers/riskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/vulnerabilities', getVulnerabilities);
router.post('/vulnerabilities', createVulnerability);

router.get('/risks', getRisks);
router.put('/risks/:id', updateRiskStatus);

export default router;
