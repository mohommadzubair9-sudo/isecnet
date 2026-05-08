import { Router, Response } from 'express';
import { prisma, broadcastEvent } from '../index';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/history', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.rotationHistory.findMany({ orderBy: { rotatedAt: 'desc' }, take: 50 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const total = await prisma.credential.count();
    const rotatedThisMonth = await prisma.rotationHistory.count({
      where: { rotatedAt: { gte: new Date(new Date().setDate(1)) } },
    });
    const neverRotated = await prisma.credential.count({ where: { lastRotated: null } });
    const overdue = await prisma.credential.count({
      where: { lastRotated: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    });
    const complianceScore = total > 0 ? Math.round(((total - neverRotated) / total) * 100) : 0;
    res.json({ complianceScore, rotatedThisMonth, neverRotated, overdue });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/rotate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { credentialId } = req.body;
    const cred = await prisma.credential.findUnique({ where: { id: credentialId } });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const prevRisk = cred.riskScore;
    const newRisk = Math.max(5, Math.round(prevRisk * 0.45)); // Rotation dramatically reduces risk
    const newRiskLevel = newRisk >= 80 ? 'CRITICAL' : newRisk >= 60 ? 'HIGH' : newRisk >= 40 ? 'MEDIUM' : newRisk >= 20 ? 'LOW' : 'MINIMAL';

    await Promise.all([
      prisma.credential.update({
        where: { id: credentialId },
        data: { lastRotated: new Date(), riskScore: newRisk, riskLevel: newRiskLevel },
      }),
      prisma.rotationHistory.create({
        data: {
          credentialId,
          credentialName: cred.name,
          rotatedBy: req.userEmail || 'admin@isecnet.io',
          previousRisk: prevRisk,
          newRisk,
          status: 'SUCCESS',
          notes: 'Manual rotation via iSecNet platform',
        },
      }),
    ]);

    broadcastEvent({ type: 'CREDENTIAL_ROTATED', credentialId, credentialName: cred.name, previousRisk: prevRisk, newRisk });

    res.json({ success: true, credentialId, credentialName: cred.name, previousRisk: prevRisk, newRisk, newRiskLevel });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/queue', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const queue = await prisma.credential.findMany({
      where: {
        OR: [
          { lastRotated: null },
          { lastRotated: { lt: ninetyDaysAgo } },
        ],
        status: 'ACTIVE',
      },
      orderBy: { riskScore: 'desc' },
    });
    res.json({ queue });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
