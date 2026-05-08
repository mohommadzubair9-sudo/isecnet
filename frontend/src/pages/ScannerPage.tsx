import { useEffect, useState, useRef } from 'react';
import { Scan, Play, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../api/client';
import { ScanJob } from '../types';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDING:   { color: '#6b7280', icon: Clock,        label: 'Pending' },
  RUNNING:   { color: '#6366f1', icon: Scan,         label: 'Running' },
  COMPLETED: { color: '#22c55e', icon: CheckCircle,  label: 'Completed' },
  FAILED:    { color: '#ef4444', icon: AlertCircle,  label: 'Failed' },
};

export default function ScannerPage() {
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [source, setSource] = useState<'demo' | 'aws' | 'github'>('demo');
  const [running, setRunning] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const loadJobs = () => {
    API.get('/scanner/jobs').then((r) => setJobs(r.data.jobs)).catch(() => {});
  };

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [liveLogs]);

  // Poll active job
  useEffect(() => {
    if (!activeJobId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await API.get(`/scanner/jobs/${activeJobId}`);
        const logs: string[] = JSON.parse(data.logs || '[]');
        setLiveLogs(logs);
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          setRunning(false);
          setActiveJobId(null);
          loadJobs();
          toast.success(`Scan complete — ${data.credentialsFound} credentials found`);
          clearInterval(interval);
        }
      } catch {}
    }, 800);
    return () => clearInterval(interval);
  }, [activeJobId]);

  const startScan = async () => {
    setRunning(true);
    setLiveLogs([`[${new Date().toLocaleTimeString()}] Initiating ${source.toUpperCase()} scan...`]);
    try {
      const { data } = await API.post('/scanner/start', { source });
      setActiveJobId(data.jobId);
      loadJobs();
    } catch {
      toast.error('Failed to start scan');
      setRunning(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">NHI Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">Discover all machine identities across your infrastructure</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Config */}
        <div className="col-span-1 card p-6 h-fit">
          <div className="text-sm font-semibold text-white mb-4">Configure Scan</div>

          {/* Source Tabs */}
          <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: '#0d1426' }}>
            {(['demo', 'aws', 'github'] as const).map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className="flex-1 py-1.5 text-xs font-semibold rounded-md transition-all"
                style={{ background: source === s ? '#6366f1' : 'transparent', color: source === s ? 'white' : '#6b7280' }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          {source === 'demo' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg text-xs text-gray-400" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="font-semibold text-accent mb-1">Demo Scan</div>
                Simulates a realistic enterprise scan across all sources. No real credentials required.
              </div>
            </div>
          )}

          {source === 'aws' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">AWS Access Key ID</label>
                <input placeholder="AKIAIOSFODNN7EXAMPLE" className="w-full text-xs" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">AWS Secret Access Key</label>
                <input type="password" placeholder="••••••••••••••••••••" className="w-full text-xs" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Region</label>
                <select className="w-full text-xs">
                  {['us-east-1','us-west-2','eu-west-1','ap-south-1'].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="text-xs text-gray-600 flex items-center gap-1">🔒 Keys never stored — one-time use only</div>
            </div>
          )}

          {source === 'github' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Personal Access Token</label>
                <input type="password" placeholder="ghp_•••••••••••••••••" className="w-full text-xs" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Organisation</label>
                <input placeholder="your-org-name" className="w-full text-xs" />
              </div>
            </div>
          )}

          <button onClick={startScan} disabled={running} className="btn-primary w-full justify-center mt-5 py-3">
            {running ? (
              <><span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Scanning...</>
            ) : (
              <><Play size={15} /> Start Scan</>
            )}
          </button>
        </div>

        {/* Live Logs */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Scan size={15} className={running ? 'text-accent spinner' : 'text-gray-500'} />
              {running ? 'Scan in progress...' : 'Scan Output'}
            </div>
            {running && <span className="text-xs text-accent animate-pulse">● LIVE</span>}
          </div>

          <div ref={logRef} className="font-mono text-xs rounded-lg p-4 h-72 overflow-y-auto space-y-1" style={{ background: '#060b14', border: '1px solid #1f2937' }}>
            {liveLogs.length === 0 ? (
              <div className="text-gray-600 text-center pt-12">Start a scan to see live output</div>
            ) : liveLogs.map((log, i) => (
              <div key={i} className={`${log.includes('complete') || log.includes('success') ? 'text-green-400' : log.includes('Error') || log.includes('CRITICAL') ? 'text-red-400' : 'text-gray-400'}`}>
                {log}
              </div>
            ))}
            {running && <div className="text-accent animate-pulse">▌</div>}
          </div>

          {!running && liveLogs.length > 0 && (
            <div className="mt-4 p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle size={16} className="text-green-400" />
              <div className="text-sm text-green-400 font-medium">Scan completed successfully</div>
            </div>
          )}
        </div>
      </div>

      {/* Scan History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-200">
          <div className="text-sm font-semibold text-white">Scan History</div>
        </div>
        {jobs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No scans yet</div>
        ) : (
          <table>
            <thead><tr><th>Started</th><th>Source</th><th>Status</th><th>Credentials</th><th>Issues</th><th>Duration</th><th></th></tr></thead>
            <tbody>
              {jobs.map((job) => {
                const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                const duration = job.completedAt
                  ? Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
                  : null;
                const logs: string[] = JSON.parse(job.logs || '[]');
                return (
                  <>
                    <tr key={job.id}>
                      <td className="text-xs">{format(new Date(job.startedAt), 'MMM d, HH:mm')}</td>
                      <td><span className="text-xs font-semibold text-gray-300 uppercase">{job.source}</span></td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
                          <Icon size={12} className={job.status === 'RUNNING' ? 'spinner' : ''} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="text-white font-medium text-sm">{job.credentialsFound || '—'}</td>
                      <td className={`text-sm font-medium ${job.issuesFound > 0 ? 'text-orange-400' : 'text-gray-500'}`}>{job.issuesFound || '—'}</td>
                      <td className="text-xs text-gray-500">{duration ? `${duration}s` : '—'}</td>
                      <td>
                        <button onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                          Logs {expandedJob === job.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </td>
                    </tr>
                    {expandedJob === job.id && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="font-mono text-xs p-4 space-y-0.5" style={{ background: '#060b14', borderTop: '1px solid #1f2937' }}>
                            {logs.map((log, i) => <div key={i} className="text-gray-400">{log}</div>)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
