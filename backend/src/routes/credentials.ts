import { Router, Response } from 'express';
import { prisma } from '../index';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { source, riskLevel, status, search, page = '1', limit = '15' } = req.query as Record<string, string>;
    const where: any = {};
    if (source) where.source = source;
    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;
    if (search) where.name = { contains: search };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [credentials, total] = await Promise.all([
      prisma.credential.findMany({ where, orderBy: { riskScore: 'desc' }, skip, take: limitNum }),
      prisma.credential.count({ where }),
    ]);

    res.json({ credentials, total, page: pageNum, totalPages: Math.ceil(total / limitNum), limit: limitNum });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cred = await prisma.credential.findUnique({ where: { id: req.params.id } });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });
    const rotations = await prisma.rotationHistory.findMany({
      where: { credentialId: req.params.id },
      orderBy: { rotatedAt: 'desc' },
      take: 5,
    });
    const alerts = await prisma.alert.findMany({
      where: { credentialId: req.params.id },
      orderBy: { detectedAt: 'desc' },
      take: 5,
    });
    res.json({ ...cred, rotationHistory: rotations, recentAlerts: alerts });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.credential.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
