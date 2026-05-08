#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          iSecNet NHI Security Platform        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌  Node.js is not installed."
  echo "    Install it from https://nodejs.org (LTS version)"
  exit 1
fi

echo "✅  Node.js $(node --version)"

# Backend setup
echo ""
echo "── Backend ──────────────────────────────────────"
cd "$(dirname "$0")/backend"

if [ ! -d node_modules ]; then
  echo "📦  Installing backend dependencies..."
  npm install
fi

if [ ! -f prisma/isecnet.db ]; then
  echo "🗄️   Initialising database..."
  npx prisma generate
  npx prisma migrate dev --name init
fi

echo "🚀  Starting backend on http://localhost:3001 ..."
npm run dev &
BACKEND_PID=$!

# Frontend setup
echo ""
echo "── Frontend ─────────────────────────────────────"
cd "$(dirname "$0")/frontend"

if [ ! -d node_modules ]; then
  echo "📦  Installing frontend dependencies..."
  npm install
fi

echo "🚀  Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  App ready at  http://localhost:5173          ║"
echo "║  Login:  admin@isecnet.io  /  Demo@1234       ║"
echo "║                                               ║"
echo "║  Press Ctrl+C to stop both servers            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Kill both servers on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
