import { Router, Response } from 'express';
import { prisma } from '../index';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const SOURCE_COLORS: Record<string, string> = {
  aws: '#FF9900',
  github: '#24292F',
  kubernetes: '#326CE5',
  saas: '#8B5CF6',
  'ai-agent': '#10B981',
};

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  MINIMAL: '#22c55e',
};

router.get('/nodes', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const credentials = await prisma.credential.findMany({ orderBy: { source: 'asc' } });

    const sourceGroups: Record<string, typeof credentials> = {};
    credentials.forEach((c) => {
      if (!sourceGroups[c.source]) sourceGroups[c.source] = [];
      sourceGroups[c.source].push(c);
    });

    const nodes: any[] = [];
    const edges: any[] = [];

    const sources = Object.keys(sourceGroups);
    const centerX = 600;
    const centerY = 400;
    const sourceRadius = 280;

    sources.forEach((source, si) => {
      const angle = (si / sources.length) * 2 * Math.PI - Math.PI / 2;
      const sx = centerX + sourceRadius * Math.cos(angle);
      const sy = centerY + sourceRadius * Math.sin(angle);

      nodes.push({
        id: `source-${source}`,
        type: 'sourceNode',
        position: { x: sx, y: sy },
        data: {
          label: source.toUpperCase(),
          count: sourceGroups[source].length,
          color: SOURCE_COLORS[source] || '#6366f1',
          source,
        },
      });

      const creds = sourceGroups[source];
      const credRadius = 160;

      creds.forEach((cred, ci) => {
        const credAngle = angle + ((ci - (creds.length - 1) / 2) * (Math.PI / 4)) / Math.max(creds.length, 1);
        const cx = sx + credRadius * Math.cos(credAngle);
        const cy = sy + credRadius * Math.sin(credAngle);

        nodes.push({
          id: `cred-${cred.id}`,
          type: 'credentialNode',
          position: { x: cx, y: cy },
          data: {
            label: cred.name,
            type: cred.type,
            riskScore: cred.riskScore,
            riskLevel: cred.riskLevel,
            status: cred.status,
            color: RISK_COLORS[cred.riskLevel] || '#6366f1',
            source: cred.source,
            id: cred.id,
          },
        });

        edges.push({
          id: `e-${source}-${cred.id}`,
          source: `source-${source}`,
          target: `cred-${cred.id}`,
          type: 'smoothstep',
          animated: cred.riskLevel === 'CRITICAL',
          style: {
            stroke: RISK_COLORS[cred.riskLevel] || '#4b5563',
            strokeWidth: cred.riskLevel === 'CRITICAL' ? 2 : 1,
            opacity: 0.7,
          },
        });
      });
    });

    res.json({ nodes, edges, credentialCount: credentials.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
