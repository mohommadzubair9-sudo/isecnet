import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Key, Bell, Clock, RotateCcw, Shield, TrendingUp, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import API from '../api/client';
import { DashboardStats, Credential, Alert } from '../types';

const RISK_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', MINIMAL: '#22c55e' };
const SOURCE_LABELS: Record<string, string> = { aws: 'AWS IAM', github: 'GitHub', kubernetes: 'Kubernetes', saas: 'SaaS Tools', 'ai-agent': 'AI Agents' };
const SOURCE_COLORS: Record<string, string> = { aws: '#FF9900', github: '#8b5cf6', kubernetes: '#326CE5', saas: '#6366f1', 'ai-agent': '#10b981' };

function SecurityGauge({ score }: { score: number }) {
  const r = 80; const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#eab308' : pct >= 25 ? '#f97316' : '#ef4444';
  const label = pct >= 75 ? 'GOOD' : pct >= 50 ? 'FAIR' : pct >= 25 ? 'POOR' : 'CRITICAL';
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg width={200} height={200} className="mb-2">
        <circle cx={100} cy={100} r={r} fill="none" stroke="#1f2937" strokeWidth={14} />
        <circle cx={100} cy={100} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x={100} y={92} textAnchor="middle" fill="white" fontSize={34} fontWeight={700}>{pct}</text>
        <text x={100} y={112} textAnchor="middle" fill="#6b7280" fontSize={12}>/100</text>
        <text x={100} y={130} textAnchor="middle" fill={color} fontSize={11} fontWeight={600}>{label}</text>
      </svg>
      <div className="text-sm font-semibold text-gray-300">Security Score</div>
      <div className="text-xs text-gray-500 mt-1">Overall NHI posture</div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const cls = `badge badge-${level.toLowerCase()}`;
  return <span className={cls}>{level}</span>;
}

function SkeletonCard() {
  return <div className="stat-card animate-pulse"><div className="h-4 bg-dark-200 rounded w-1/2 mb-3" /><div className="h-8 bg-dark-200 rounded w-1/3" /></div>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/dashboard/stats').then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="mb-6"><div className="h-7 bg-dark-100 rounded w-48 animate-pulse" /></div>
      <div className="grid grid-cols-4 gap-4 mb-6">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
    </div>
  );
  if (!stats) return <div className="text-gray-400">Failed to load dashboard</div>;

  const riskDist = [
    { name: 'Critical', value: stats.criticalCount, color: '#ef4444' },
    { name: 'High',     value: stats.highCount,     color: '#f97316' },
    { name: 'Medium',   value: stats.mediumCount,   color: '#eab308' },
    { name: 'Low',      value: stats.lowCount,      color: '#3b82f6' },
    { name: 'Minimal',  value: stats.minimalCount,  color: '#22c55e' },
  ].filter((d) => d.value > 0);

  const sourceData = stats.credentialsBySource.map((s) => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: s.count,
    color: SOURCE_COLORS[s.source] || '#6366f1',
  }));

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">NHI posture overview across all infrastructure</p>
        </div>
        <button onClick={() => navigate('/scanner')} className="btn-primary">
          <Shield size={15} /> Run Scan
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Credentials', value: stats.totalCredentials, sub: 'across 5 sources', icon: Key, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Critical Risk', value: stats.criticalCount, sub: 'require immediate action', icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Never Rotated', value: stats.credentialsNeverRotated, sub: 'stale credentials', icon: Clock, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'Open Alerts', value: stats.openAlerts, sub: 'unresolved issues', icon: Bell, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Security Gauge */}
        <div className="card p-6">
          <SecurityGauge score={stats.overallSecurityScore} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {riskDist.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                {d.name}: <span className="text-white font-medium ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="card p-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Risk Distribution</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={riskDist} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={2}>
                {riskDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {riskDist.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-gray-400 flex-1">{d.name}</span>
                <span className="text-white font-medium">{d.value}</span>
                <span className="text-gray-600">({Math.round((d.value / stats.totalCredentials) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source Bar Chart */}
        <div className="card p-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Credentials by Source</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sourceData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {sourceData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Top Risks Table */}
        <div className="col-span-3 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-200">
            <div className="text-sm font-semibold text-white">Top Riskiest Credentials</div>
            <button onClick={() => navigate('/credentials')} className="text-xs text-accent flex items-center gap-1 hover:opacity-80">
              View all <ExternalLink size={11} />
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Source</th><th>Risk Score</th><th>Last Rotated</th><th></th>
              </tr>
            </thead>
            <tbody>
              {stats.topRiskyCredentials.map((c: Credential) => (
                <tr key={c.id}>
                  <td>
                    <div className="font-medium text-white text-xs truncate max-w-[160px]">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.type.replace('_', ' ')}</div>
                  </td>
                  <td><span className="text-xs font-mono text-gray-400">{c.source.toUpperCase()}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="risk-bar w-16">
                        <div className="risk-bar-fill" style={{ width: `${c.riskScore}%`, background: RISK_COLORS[c.riskLevel] }} />
                      </div>
                      <span className="text-sm font-bold" style={{ color: RISK_COLORS[c.riskLevel] }}>{c.riskScore}</span>
                    </div>
                  </td>
                  <td><span className="text-xs text-red-400">{c.lastRotated ? formatDistanceToNow(new Date(c.lastRotated), { addSuffix: true }) : 'Never'}</span></td>
                  <td>
                    <button onClick={() => navigate('/rotation')} className="text-xs text-accent hover:opacity-80">Rotate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Alerts */}
        <div className="col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-200">
            <div className="text-sm font-semibold text-white">Recent Alerts</div>
            <button onClick={() => navigate('/alerts')} className="text-xs text-accent flex items-center gap-1 hover:opacity-80">
              View all <ExternalLink size={11} />
            </button>
          </div>
          <div className="divide-y divide-dark-200">
            {stats.recentAlerts.map((a: Alert) => (
              <div key={a.id} className="px-4 py-3 flex gap-3 hover:bg-dark-100 transition-colors cursor-pointer" onClick={() => navigate('/alerts')}>
                <div className="w-1 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[a.severity] || '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{a.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <RiskBadge level={a.severity} />
                    <span>{formatDistanceToNow(new Date(a.detectedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
