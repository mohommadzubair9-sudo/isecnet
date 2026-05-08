import { Router, Response } from 'express';
import { prisma } from '../index';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const [total, allCreds, allAlerts, rotations] = await Promise.all([
      prisma.credential.count(),
      prisma.credential.findMany({ orderBy: { riskScore: 'desc' } }),
      prisma.alert.findMany({ orderBy: { detectedAt: 'desc' } }),
      prisma.rotationHistory.count(),
    ]);

    const criticalCount = allCreds.filter((c) => c.riskLevel === 'CRITICAL').length;
    const highCount = allCreds.filter((c) => c.riskLevel === 'HIGH').length;
    const mediumCount = allCreds.filter((c) => c.riskLevel === 'MEDIUM').length;
    const lowCount = allCreds.filter((c) => c.riskLevel === 'LOW').length;
    const minimalCount = allCreds.filter((c) => c.riskLevel === 'MINIMAL').length;
    const avgRisk = total > 0 ? Math.round(allCreds.reduce((s, c) => s + c.riskScore, 0) / total) : 0;
    const securityScore = Math.max(0, 100 - avgRisk);
    const neverRotated = allCreds.filter((c) => !c.lastRotated).length;
    const orphaned = allCreds.filter((c) => c.status === 'ORPHANED').length;
    const openAlerts = allAlerts.filter((a) => a.status === 'OPEN').length;

    const sourceMap: Record<string, number> = {};
    allCreds.forEach((c) => { sourceMap[c.source] = (sourceMap[c.source] || 0) + 1; });
    const credentialsBySource = Object.entries(sourceMap).map(([source, count]) => ({ source, count }));

    const typeMap: Record<string, number> = {};
    allCreds.forEach((c) => { typeMap[c.type] = (typeMap[c.type] || 0) + 1; });
    const credentialsByType = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

    res.json({
      totalCredentials: total,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      minimalCount,
      avgRiskScore: avgRisk,
      overallSecurityScore: securityScore,
      openAlerts,
      totalAlerts: allAlerts.length,
      credentialsNeverRotated: neverRotated,
      orphanedCount: orphaned,
      totalRotations: rotations,
      credentialsBySource,
      credentialsByType,
      topRiskyCredentials: allCreds.slice(0, 5),
      recentAlerts: allAlerts.slice(0, 6),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
