import { Router, Response } from 'express';
import { prisma, broadcastEvent } from '../index';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { subDays } from 'date-fns';

const router = Router();

router.get('/jobs', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const jobs = await prisma.scanJob.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/jobs/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const job = await prisma.scanJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/start', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { source = 'demo' } = req.body;

    const job = await prisma.scanJob.create({
      data: { status: 'RUNNING', source, logs: JSON.stringify([`[${new Date().toLocaleTimeString()}] Scan initiated...`]) },
    });

    // Simulate async scan
    runMockScan(job.id, source).catch(console.error);

    res.json({ jobId: job.id, message: 'Scan started' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

async function runMockScan(jobId: string, source: string) {
  const addLog = async (log: string) => {
    const job = await prisma.scanJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    const logs = JSON.parse(job.logs);
    logs.push(`[${new Date().toLocaleTimeString()}] ${log}`);
    await prisma.scanJob.update({ where: { id: jobId }, data: { logs: JSON.stringify(logs) } });
    broadcastEvent({ type: 'SCAN_PROGRESS', jobId, log });
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  await delay(1500); await addLog('Connecting to scan targets...');
  await delay(1200); await addLog('Connection established');
  await delay(1000); await addLog('Scanning AWS IAM users and roles... found 20 credentials');
  await delay(1500); await addLog('Scanning GitHub organisation tokens... found 8 tokens');
  await delay(1000); await addLog('Scanning Kubernetes service accounts... found 6 accounts');
  await delay(1200); await addLog('Scanning SaaS API integrations... found 8 keys');
  await delay(1000); await addLog('Scanning AI agent credentials... found 5 keys');
  await delay(1500); await addLog('Running risk scoring engine on 47 credentials...');
  await delay(2000); await addLog('Risk analysis complete — 4 CRITICAL, 8 HIGH, 14 MEDIUM identified');
  await delay(1000); await addLog('Generating security alerts for 6 new findings...');
  await delay(800);  await addLog('Scan complete — 47 credentials, 18 total issues found');

  await prisma.scanJob.update({
    where: { id: jobId },
    data: { status: 'COMPLETED', completedAt: new Date(), credentialsFound: 47, issuesFound: 6 },
  });

  broadcastEvent({ type: 'SCAN_COMPLETE', jobId, credentialsFound: 47, issuesFound: 6 });
}

export default router;
