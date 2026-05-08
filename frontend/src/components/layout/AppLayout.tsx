import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import API from '../../api/client';

export default function AppLayout() {
  const [openAlerts, setOpenAlerts] = useState(0);

  useEffect(() => {
    API.get('/alerts?status=OPEN&limit=1').then((r) => setOpenAlerts(r.data.openCount || 0)).catch(() => {});

    // WebSocket for real-time events
    let ws: WebSocket;
    const connect = () => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        ws.onmessage = (e) => {
          const event = JSON.parse(e.data);
          if (event.type === 'NEW_ALERT') {
            const { severity, title } = event.data;
            const icon = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : 'ℹ️';
            if (severity === 'CRITICAL') {
              toast.error(`${icon} ${title}`, { duration: 6000 });
            } else {
              toast(`${icon} ${title}`, { duration: 4000 });
            }
            setOpenAlerts((n) => n + 1);
          }
          if (event.type === 'CREDENTIAL_ROTATED') {
            toast.success(`✅ Rotated: ${event.credentialName}`);
          }
        };
        ws.onerror = () => {};
        ws.onclose = () => setTimeout(connect, 3000);
      } catch {}
    };
    connect();
    return () => { try { ws?.close(); } catch {} };
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0f1e' }}>
      <Sidebar alertCount={openAlerts} />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="p-6 fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
