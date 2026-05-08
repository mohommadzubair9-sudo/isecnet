import { useEffect, useState, useCallback } from 'react';
import { Bell, AlertOctagon, AlertTriangle, Info, CheckCircle, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../api/client';
import { Alert } from '../types';

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; border: string }> = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: AlertOctagon, border: '#ef4444' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: AlertTriangle, border: '#f97316' },
  MEDIUM:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)',  icon: AlertTriangle, border: '#eab308' },
  LOW:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: Info,          border: '#3b82f6' },
  INFO:     { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: Info,          border: '#6366f1' },
};

const ACTIONS: Record<string, string[]> = {
  IMPOSSIBLE_TRAVEL: ['Immediately revoke this credential', 'Issue a new credential to the legitimate service', 'Investigate access logs for data exfiltration', 'File a security incident report'],
  EXPOSED_IN_CODE:   ['Rotate this credential immediately', 'Search all git history for other exposed secrets', 'Enable secret scanning on all repositories', 'Notify affected systems to regenerate tokens'],
  PRIVILEGE_ESCALATION: ['Audit recent actions taken by this credential', 'Reduce permissions to minimum required', 'Enable CloudTrail alerts for this role', 'Review IAM policies for over-permission'],
  ANOMALOUS_USAGE:   ['Review API call logs for this credential', 'Check for data exfiltration patterns', 'Temporarily suspend and monitor', 'Alert the security operations team'],
  NEVER_ROTATED:     ['Navigate to the Rotation page', 'Click Rotate Now for this credential', 'Set an auto-rotation schedule (90 days)', 'Verify all systems updated to new credential'],
  OVER_PRIVILEGED:   ['Review current permission set', 'Apply principle of least privilege', 'Remove unused permissions', 'Document required permissions going forward'],
  GEOGRAPHIC_ANOMALY: ['Verify with the owning team if access is legitimate', 'If not legitimate, immediately rotate the credential', 'Add IP restriction policies', 'Enable geo-blocking for this service account'],
  EXPIRED_CREDENTIAL: ['Rotate the credential before it expires', 'Set up expiry notifications', 'Implement auto-rotation for this credential type'],
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (severity) params.set('severity', severity);
    if (status)   params.set('status', status);
    if (search)   params.set('search', search);
    API.get(`/alerts?${params}`).then((r) => {
      setAlerts(r.data.alerts);
      setTotal(r.data.total);
      setOpenCount(r.data.openCount || 0);
    }).finally(() => setLoading(false));
  }, [severity, status, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await API.patch(`/alerts/${id}/status`, { status: newStatus });
      toast.success('Alert updated');
      load();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const counts = { total, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  alerts.forEach((a) => {
    const key = a.severity as keyof typeof counts;
    if (key in counts && key !== 'total') counts[key] = (counts[key] as number) + 1;
  });

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">{openCount} open alerts requiring attention</p>
        </div>
      </div>

      {/* Severity pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: 'All', val: '', count: total },
          { label: 'Critical', val: 'CRITICAL', count: counts.CRITICAL },
          { label: 'High',     val: 'HIGH',     count: counts.HIGH },
          { label: 'Medium',   val: 'MEDIUM',   count: counts.MEDIUM },
          { label: 'Low',      val: 'LOW',       count: counts.LOW },
          { label: 'Info',     val: 'INFO',      count: counts.INFO },
        ].map(({ label, val, count }) => {
          const cfg = val ? SEVERITY_CONFIG[val] : null;
          const active = severity === val;
          return (
            <button key={val} onClick={() => setSeverity(val)}
              className="text-xs font-semibold px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5"
              style={{
                background: active ? (cfg?.bg || 'rgba(99,102,241,0.1)') : 'transparent',
                color: active ? (cfg?.color || '#6366f1') : '#6b7280',
                borderColor: active ? (cfg?.border || '#6366f1') : '#1f2937',
              }}>
              {label}
              {count > 0 && <span className="px-1.5 py-0.5 rounded-full text-white text-xs" style={{ background: cfg?.color || '#6366f1', fontSize: '0.65rem' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts..." className="w-full pl-8 text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm">
          <option value="">All Statuses</option>
          {['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Alert Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="spinner w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={36} className="text-gray-600 mx-auto mb-3" />
          <div className="text-gray-400">No alerts found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.INFO;
            const Icon = cfg.icon;
            const isExp = expanded === a.id;
            const actions = ACTIONS[a.type] || ACTIONS.ANOMALOUS_USAGE;

            return (
              <div key={a.id} className="card overflow-hidden transition-all" style={{ borderLeft: `3px solid ${cfg.border}` }}>
                <div className="p-4 flex gap-4">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                    <Icon size={17} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white mb-1">{a.title}</div>
                        <div className="text-xs text-gray-400 leading-relaxed">{isExp ? a.description : a.description.slice(0, 120) + (a.description.length > 120 ? '...' : '')}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span>
                        <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                      </div>
                    </div>

                    {a.credentialName && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        🔑 <span className="font-mono text-gray-400">{a.credentialName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(a.detectedAt), { addSuffix: true })}</span>
                      {a.resolvedAt && <span className="text-xs text-green-500">Resolved {formatDistanceToNow(new Date(a.resolvedAt), { addSuffix: true })}</span>}
                      <button onClick={() => setExpanded(isExp ? null : a.id)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 ml-auto">
                        {isExp ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details</>}
                      </button>
                    </div>

                    {isExp && (
                      <div className="mt-4 pt-4 border-t border-dark-200">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Actions</div>
                        <div className="space-y-1.5 mb-4">
                          {actions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                              <span className="text-accent font-bold flex-shrink-0">{i + 1}.</span> {action}
                            </div>
                          ))}
                        </div>

                        {a.status === 'OPEN' && (
                          <div className="flex gap-2 flex-wrap">
                            <button disabled={updating === a.id} onClick={() => updateStatus(a.id, 'ACKNOWLEDGED')} className="btn-ghost text-xs py-1.5">
                              Acknowledge
                            </button>
                            <button disabled={updating === a.id} onClick={() => updateStatus(a.id, 'RESOLVED')} className="btn-primary text-xs py-1.5">
                              <CheckCircle size={12} /> Resolve
                            </button>
                            <button disabled={updating === a.id} onClick={() => updateStatus(a.id, 'FALSE_POSITIVE')} className="btn-ghost text-xs py-1.5 text-gray-500">
                              <X size={12} /> False Positive
                            </button>
                          </div>
                        )}
                        {a.status === 'ACKNOWLEDGED' && (
                          <button disabled={updating === a.id} onClick={() => updateStatus(a.id, 'RESOLVED')} className="btn-primary text-xs py-1.5">
                            <CheckCircle size={12} /> Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
