# iSecNet — NHI Security Platform (MVP)

> Non-Human Identity security for modern enterprises. Discover, score, monitor and rotate all your machine credentials in one place.

---

## Quick Start

### 1. Install Node.js

Download and install Node.js LTS from **https://nodejs.org**

Verify installation:
```bash
node --version   # should print v18 or higher
npm --version
```

### 2. Launch the app (one command)

```bash
cd /Users/mohammadzubair/Documents/isecnet
bash start.sh
```

This will:
- Install all dependencies (first run only)
- Create and seed the SQLite database (first run only)
- Start the backend API on **http://localhost:3001**
- Start the frontend on **http://localhost:5173**

### 3. Open in browser

```
http://localhost:5173
```

**Demo login:**
```
Email:    admin@isecnet.io
Password: Demo@1234
```

---

## Manual Start (two terminals)

**Terminal 1 — Backend:**
```bash
cd /Users/mohammadzubair/Documents/isecnet/backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd /Users/mohammadzubair/Documents/isecnet/frontend
npm install
npm run dev
```

---

## What's Inside

| Feature | Description |
|---------|-------------|
| **Dashboard** | Security score gauge, risk distribution charts, top risky credentials |
| **Credentials** | 47 seeded credentials with risk scoring across AWS, GitHub, K8s, SaaS, AI-Agent |
| **Identity Graph** | Interactive React Flow graph — visualise credential relationships |
| **Alerts** | 18 security alerts with severity triage, recommended actions |
| **NHI Scanner** | Simulated scanner with live log streaming via WebSocket |
| **Key Rotation** | One-click rotation with animated 4-step progress modal |
| **Settings** | Notifications, security policies, integrations config |

---

## Architecture

```
isecnet/
├── backend/          Node.js + Express + TypeScript
│   ├── prisma/       SQLite schema & migrations
│   └── src/
│       ├── routes/   dashboard, credentials, alerts, scanner, rotation, graph
│       ├── services/ seed.ts — populates demo data on first run
│       └── index.ts  Express server (3001) + WebSocket server (8001)
└── frontend/         React + Vite + TypeScript + Tailwind CSS
    └── src/
        ├── pages/    8 pages (Login, Dashboard, Credentials, Alerts,
        │             Scanner, Rotation, IdentityGraph, Settings)
        ├── components/layout/  Sidebar, TopBar, AppLayout (WebSocket client)
        ├── store/    Zustand auth store with JWT persistence
        └── api/      Axios client (proxied to :3001)
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3 |
| Charts | Recharts (PieChart, BarChart) |
| Graph | @xyflow/react (React Flow) |
| State | Zustand + localStorage persist |
| Real-time | WebSocket (port 8001) |
| Backend | Node.js, Express, TypeScript, tsx |
| ORM | Prisma |
| Database | SQLite (zero-setup, file-based) |
| Auth | JWT + bcryptjs |

---

## Seeded Data

- **47 credentials** — AWS IAM (20), GitHub (8), Kubernetes (6), SaaS (8), AI-Agent (5)
- **Risk distribution** — 4 CRITICAL · 8 HIGH · 14 MEDIUM · 15 LOW · 6 MINIMAL
- **18 security alerts** — impossible travel, exposed secrets, privilege escalation, anomalous usage
- **12 rotation history** records showing risk reduction
- **Real-time simulation** — random alert broadcast every 45 seconds via WebSocket

---

*Built for iSecNet Solutions Private Limited — Founder & CEO: Mohammad Zubair*
