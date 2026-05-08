import { useEffect, useState, useCallback } from 'react';
import { RotateCcw, Clock, CheckCircle, AlertTriangle, TrendingDown } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../api/client';
import { Credential, RotationHistory } from '../types';

const RISK_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', MINIMAL: '#22c55e' };

function RotateModal({ cred, onConfirm, onClose, loading }: { cred: Credential; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (loading) {
      const steps = [500, 1500, 2500, 3500];
      steps.forEach((delay, i) => setTimeout(() => setStep(i + 1), delay));
    }
  }, [loading]);

  const steps = [
    'Generating new credential...',
    'Updating connected systems...',
    'Verifying new credential...',
    'Revoking old credential...',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={!loading ? onClose : undefined} />
      <div className="relative card p-6 w-full max-w-md">
        <div className="text-base font-bold text-white mb-2">Rotate Credential</div>
        <div className="text-sm text-gray-400 mb-5">
          This will generate a new credential for <span className="text-white font-medium">{cred.name}</span>, update all connected systems, and revoke the old one.
        </div>

        {loading && (
          <div className="space-y-3 mb-5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {i < step ? (
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                ) : i === step ? (
                  <div className="spinner w-4 h-4 border-2 border-accent border-t-transparent rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-dark-300 flex-shrink-0" />
                )}
                <span className={i <= step ? 'text-white' : 'text-gray-600'}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="flex gap-3">
            <button onClick={onConfirm} className="btn-primary flex-1 justify-center">
              <RotateCcw size={14} /> Confirm Rotation
            </button>
            <button onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RotationPage() {
  const [queue, setQueue] = useState<Credential[]>([]);
  const [history, setHistory] = useState<RotationHistory[]>([]);
  const [stats, setStats] = useState<any>({ complianceScore: 0, rotatedThisMonth: 0, neverRotated: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState<Credential | null>(null);
  const [rotatingId, setRotatingId] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      API.get('/rotation/queue'),
      API.get('/rotation/history'),
      API.get('/rotation/stats'),
    ]).then(([q, h, s]) => {
      setQueue(q.data.queue);
      setHistory(h.data.history);
      setStats(s.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const doRotate = async (cred: Credential) => {
    setRotatingId(true);
    try {
      const { data } = await API.post('/rotation/rotate', { credentialId: cred.id });
      await new Promise((r) => setTimeout(r, 4500)); // let animation play
      toast.success(`✅ Rotated! Risk: ${data.previousRisk} → ${data.newRisk}`);
      setRotating(null);
      load();
    } catch {
      toast.error('Rotation failed');
    } finally {
      setRotatingId(false);
    }
  };

  const handleRotateClick = (cred: Credential) => { setRotating(cred); };

  return (
    <div className="fade-in">
      {rotating && <RotateModal cred={rotating} onConfirm={() => doRotate(rotating)} onClose={() => !rotatingId && setRotating(null)} loading={rotatingId} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Key Rotation</h1>
        <p className="text-gray-500 text-sm mt-1">Manage credential lifecycle and rotation compliance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Compliance Score', value: `${stats.complianceScore}%`, icon: CheckCircle, color: stats.complianceScore > 70 ? '#22c55e' : '#ef4444', bg: stats.complianceScore > 70 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' },
          { label: 'Never Rotated', value: stats.neverRotated, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Rotations This Month', value: stats.rotatedThisMonth, icon: RotateCcw, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Overdue (>90 days)', value: stats.overdue, icon: Clock, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Rotation Queue */}
        <div className="col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-200">
            <div className="text-sm font-semibold text-white">Rotation Queue</div>
            <span className="text-xs text-gray-500">{queue.length} credentials overdue</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : queue.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
              <div className="text-green-400 font-medium">All credentials are up to date!</div>
            </div>
          ) : (
            <table>
              <thead><tr><th>Credential</th><th>Days Since Rotation</th><th>Risk</th><th>Action</th></tr></thead>
              <tbody>
                {queue.map((c) => {
                  const daysSince = c.lastRotated
                    ? Math.floor((Date.now() - new Date(c.lastRotated).getTime()) / 86400000)
                    : null;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="text-white text-xs font-medium">{c.name}</div>
                        <div className="text-gray-500 text-xs">{c.source.toUpperCase()}</div>
                      </td>
                      <td>
                        {daysSince !== null ? (
                          <span className="text-orange-400 font-medium text-sm">{daysSince} days</span>
                        ) : (
                          <span className="text-red-400 font-medium text-sm">Never rotated</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${c.riskLevel.toLowerCase()}`}>{c.riskLevel}</span>
                      </td>
                      <td>
                        <button onClick={() => handleRotateClick(c)} className="btn-primary text-xs py-1.5">
                          <RotateCcw size={12} /> Rotate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Rotation History */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-200">
            <div className="text-sm font-semibold text-white">Recent Rotations</div>
          </div>
          <div className="divide-y divide-dark-200 overflow-y-auto" style={{ maxHeight: '480px' }}>
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No rotations yet</div>
            ) : history.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="text-xs font-medium text-white truncate flex-1 mr-2">{r.credentialName}</div>
                  <span className={`badge ${r.status === 'SUCCESS' ? 'badge-resolved' : 'badge-critical'}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-400 font-bold">{r.previousRisk}</span>
                    <TrendingDown size={11} className="text-green-400" />
                    <span className="text-green-400 font-bold">{r.newRisk}</span>
                  </div>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{formatDistanceToNow(new Date(r.rotatedAt), { addSuffix: true })}</span>
                </div>
                {r.notes && <div className="text-xs text-gray-600 mt-1 truncate">{r.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
