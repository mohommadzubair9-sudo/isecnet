import { useEffect, useState, useCallback } from 'react';
import { Key, Search, ChevronLeft, ChevronRight, X, AlertCircle, Clock, Shield, Zap, RotateCcw } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../api/client';
import { Credential, RotationHistory, Alert } from '../types';

const RISK_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', MINIMAL: '#22c55e' };
const TYPE_ICONS: Record<string, string> = { API_KEY: '🔑', SERVICE_ACCOUNT: '⚙️', ACCESS_TOKEN: '🎫', SECRET_KEY: '🔐', OAUTH_TOKEN: '🔗', CERTIFICATE: '📜', SSH_KEY: '🖥️', DATABASE_CREDENTIAL: '🗄️', AI_AGENT_KEY: '🤖' };
const SOURCE_COLORS: Record<string, string> = { aws: '#FF9900', github: '#8b5cf6', kubernetes: '#326CE5', saas: '#6366f1', 'ai-agent': '#10b981' };

function RiskBar({ score, level }: { score: number; level: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="risk-bar w-20"><div className="risk-bar-fill" style={{ width: `${score}%`, background: RISK_COLORS[level] }} /></div>
      <span className="text-sm font-bold tabular-nums" style={{ color: RISK_COLORS[level] }}>{score}</span>
    </div>
  );
}

interface DetailPanelProps { cred: Credential; onClose: () => void; onRotate: (id: string) => void; }
function DetailPanel({ cred, onClose, onRotate }: DetailPanelProps) {
  const [detail, setDetail] = useState<any>(null);
  useEffect(() => {
    API.get(`/credentials/${cred.id}`).then((r) => setDetail(r.data)).catch(() => {});
  }, [cred.id]);

  const permissions: string[] = JSON.parse(cred.permissions || '[]');
  const blastRadius: string[] = JSON.parse(cred.blastRadius || '[]');

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-[480px] h-full overflow-y-auto flex flex-col" style={{ background: '#0d1426', borderLeft: '1px solid #1f2937' }}>
        <div className="flex items-start justify-between p-5 border-b border-dark-200 sticky top-0 z-10" style={{ background: '#0d1426' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{TYPE_ICONS[cred.type] || '🔑'}</span>
              <h2 className="font-bold text-white text-sm">{cred.name}</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`badge badge-${cred.riskLevel.toLowerCase()}`}>{cred.riskLevel}</span>
              <span className={`badge badge-${cred.status.toLowerCase()}`}>{cred.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Risk Breakdown */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Risk Score Breakdown</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold" style={{ background: `${RISK_COLORS[cred.riskLevel]}20`, color: RISK_COLORS[cred.riskLevel], border: `2px solid ${RISK_COLORS[cred.riskLevel]}40` }}>
                {cred.riskScore}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: RISK_COLORS[cred.riskLevel] }}>{cred.riskLevel} RISK</div>
                <div className="text-xs text-gray-500">out of 100 maximum</div>
              </div>
            </div>
            {[
              { label: 'Production Access', val: cred.hasProductionAccess, color: '#ef4444', pts: cred.hasProductionAccess ? 20 : 0 },
              { label: 'Over-Privileged', val: cred.isOverPrivileged, color: '#f97316', pts: cred.isOverPrivileged ? 15 : 0 },
              { label: 'Shared Credential', val: cred.isShared, color: '#eab308', pts: cred.isShared ? 10 : 0 },
              { label: 'Never Rotated', val: !cred.lastRotated, color: '#ef4444', pts: !cred.lastRotated ? 25 : 5 },
              { label: 'No Expiry Set', val: cred.neverExpires, color: '#6366f1', pts: cred.neverExpires ? 10 : 0 },
            ].map(({ label, val, color, pts }) => (
              <div key={label} className="flex items-center gap-3 text-xs py-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: val ? color : '#1f2937', border: `1px solid ${val ? color : '#374151'}` }} />
                <span className="flex-1 text-gray-400">{label}</span>
                <span className={val ? 'font-medium' : 'text-gray-600'} style={{ color: val ? color : undefined }}>+{pts} pts</span>
              </div>
            ))}
          </div>

          {/* Blast Radius */}
          {blastRadius.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle size={12} className="text-red-400" /> Blast Radius — If Stolen
              </div>
              <div className="rounded-lg p-3 space-y-1.5" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {blastRadius.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-red-400 mt-0.5">•</span>{item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {permissions.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions</div>
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((p, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#1f2937', color: '#a78bfa', border: '1px solid #374151' }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Type', val: cred.type.replace(/_/g, ' ') },
              { label: 'Source', val: cred.source.toUpperCase() },
              { label: 'Last Used', val: cred.lastUsed ? formatDistanceToNow(new Date(cred.lastUsed), { addSuffix: true }) : 'Unknown' },
              { label: 'Last Rotated', val: cred.lastRotated ? formatDistanceToNow(new Date(cred.lastRotated), { addSuffix: true }) : <span className="text-red-400 font-medium">Never</span> },
              { label: 'Created', val: format(new Date(cred.createdAt), 'MMM d, yyyy') },
              { label: 'Expires', val: cred.expiresAt ? format(new Date(cred.expiresAt), 'MMM d, yyyy') : <span className="text-orange-400">Never</span> },
            ].map(({ label, val }) => (
              <div key={label} className="p-2.5 rounded-lg" style={{ background: '#111827' }}>
                <div className="text-gray-500 mb-1">{label}</div>
                <div className="text-white font-medium">{val as any}</div>
              </div>
            ))}
          </div>

          {/* Rotation History */}
          {detail?.rotationHistory?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rotation History</div>
              {detail.rotationHistory.slice(0, 3).map((r: RotationHistory) => (
                <div key={r.id} className="flex items-center gap-3 py-2 text-xs border-b border-dark-200">
                  <span className="text-green-400">✓</span>
                  <span className="flex-1 text-gray-400">{format(new Date(r.rotatedAt), 'MMM d, yyyy')}</span>
                  <span className="text-gray-600">{r.previousRisk}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-400 font-medium">{r.newRisk}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-dark-200 flex gap-3">
          <button onClick={() => onRotate(cred.id)} className="btn-primary flex-1 justify-center">
            <RotateCcw size={14} /> Rotate Now
          </button>
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function CredentialsPage() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Credential | null>(null);
  const [rotating, setRotating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search)    params.set('search', search);
    if (source)    params.set('source', source);
    if (riskLevel) params.set('riskLevel', riskLevel);
    if (status)    params.set('status', status);
    API.get(`/credentials?${params}`).then((r) => {
      setCreds(r.data.credentials);
      setTotal(r.data.total);
      setTotalPages(r.data.totalPages);
    }).finally(() => setLoading(false));
  }, [page, search, source, riskLevel, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, source, riskLevel, status]);

  const handleRotate = async (id: string) => {
    setRotating(id);
    try {
      const { data } = await API.post('/rotation/rotate', { credentialId: id });
      toast.success(`Rotated! Risk: ${data.previousRisk} → ${data.newRisk}`);
      load();
      setSelected(null);
    } catch { toast.error('Rotation failed'); }
    finally { setRotating(null); }
  };

  return (
    <div className="fade-in">
      {selected && <DetailPanel cred={selected} onClose={() => setSelected(null)} onRotate={handleRotate} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Credentials</h1>
          <p className="text-gray-500 text-sm mt-1">{total} Non-Human Identities monitored</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credentials..." className="w-full pl-8 text-sm" />
        </div>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="text-sm min-w-[130px]">
          <option value="">All Sources</option>
          {['aws', 'github', 'kubernetes', 'saas', 'ai-agent'].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
        </select>
        <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="text-sm min-w-[130px]">
          <option value="">All Risk Levels</option>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm min-w-[120px]">
          <option value="">All Status</option>
          {['ACTIVE', 'ORPHANED', 'INACTIVE', 'COMPROMISED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || source || riskLevel || status) && (
          <button onClick={() => { setSearch(''); setSource(''); setRiskLevel(''); setStatus(''); }} className="btn-ghost text-sm">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden mb-4">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="spinner w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
            Loading credentials...
          </div>
        ) : creds.length === 0 ? (
          <div className="p-12 text-center">
            <Key size={32} className="text-gray-600 mx-auto mb-3" />
            <div className="text-gray-400">No credentials found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Credential</th><th>Source</th><th>Risk Score</th>
                <th>Status</th><th>Last Used</th><th>Last Rotated</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {creds.map((c) => (
                <tr key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TYPE_ICONS[c.type] || '🔑'}</span>
                      <div>
                        <div className="text-white text-xs font-medium">{c.name}</div>
                        <div className="text-gray-500 text-xs">{c.type.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: `${SOURCE_COLORS[c.source]}20`, color: SOURCE_COLORS[c.source] }}>
                      {c.source.toUpperCase()}
                    </span>
                  </td>
                  <td><RiskBar score={c.riskScore} level={c.riskLevel} /></td>
                  <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                  <td className="text-xs text-gray-400">{c.lastUsed ? formatDistanceToNow(new Date(c.lastUsed), { addSuffix: true }) : '—'}</td>
                  <td className="text-xs">
                    {c.lastRotated ? (
                      <span className="text-gray-400">{formatDistanceToNow(new Date(c.lastRotated), { addSuffix: true })}</span>
                    ) : (
                      <span className="text-red-400 font-medium">Never</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRotate(c.id)}
                      disabled={rotating === c.id}
                      className="text-xs text-accent hover:opacity-80 flex items-center gap-1 disabled:opacity-40"
                    >
                      <RotateCcw size={11} className={rotating === c.id ? 'spinner' : ''} />
                      Rotate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-ghost disabled:opacity-40 px-2 py-1">
              <ChevronLeft size={14} />
            </button>
            <span className="text-white">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="btn-ghost disabled:opacity-40 px-2 py-1">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
