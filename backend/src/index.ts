import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer, WebSocket } from 'ws';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import credentialsRoutes from './routes/credentials';
import alertsRoutes from './routes/alerts';
import scannerRoutes from './routes/scanner';
import rotationRoutes from './routes/rotation';
import graphRoutes from './routes/graph';
import { seedDatabase } from './services/seed';

dotenv.config();

export const prisma = new PrismaClient();
export let wss: WebSocketServer;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/rotation', rotationRoutes);
app.use('/api/graph', graphRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'iSecNet API', version: '1.0.0' });
});

export function broadcastEvent(event: object) {
  if (!wss) return;
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

const demoAlerts = [
  { title: 'Suspicious Geographic Access', severity: 'HIGH', type: 'GEOGRAPHIC_ANOMALY', description: 'Credential accessed from unexpected location' },
  { title: 'API Call Volume Spike', severity: 'MEDIUM', type: 'ANOMALOUS_USAGE', description: 'Call volume 10x above baseline' },
  { title: 'Credential Nearing Expiry', severity: 'LOW', type: 'EXPIRED_CREDENTIAL', description: 'Credential expires in 7 days' },
  { title: 'Privilege Escalation Attempt', severity: 'CRITICAL', type: 'PRIVILEGE_ESCALATION', description: 'Attempt to assume admin role was blocked' },
];

async function main() {
  await prisma.$connect();

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('🌱 Seeding database...');
    await seedDatabase();
    console.log('✅ Database seeded successfully');
  }

  const server = http.createServer(app);

  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'iSecNet real-time active' }));
  });

  server.listen(PORT, () => {
    console.log(`🚀 iSecNet API  → http://localhost:${PORT}`);
    console.log(`🔌 WebSocket    → ws://localhost:${PORT}`);
    console.log(`🔑 Login        → admin@isecnet.io / Demo@1234`);
  });

  setInterval(() => {
    const alert = demoAlerts[Math.floor(Math.random() * demoAlerts.length)];
    broadcastEvent({ type: 'NEW_ALERT', data: alert });
  }, 45000);
}

main().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
