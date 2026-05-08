import { Router, Response } from 'express';
import { prisma } from '../index';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { severity, status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: any = {};
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (search) where.title = { contains: search };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: [{ severity: 'asc' }, { detectedAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.alert.count({ where }),
    ]);

    const counts = await prisma.alert.groupBy({ by: ['severity'], _count: { severity: true } });
    const openCount = await prisma.alert.count({ where: { status: 'OPEN' } });

    res.json({ alerts, total, page: pageNum, totalPages: Math.ceil(total / limitNum), counts, openCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const data: any = { status };
    if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') data.resolvedAt = new Date();
    const updated = await prisma.alert.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
