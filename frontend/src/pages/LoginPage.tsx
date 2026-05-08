import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, Zap, Search, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@isecnet.io');
  const [password, setPassword] = useState('Demo@1234');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data.user, data.token);
      toast.success('Welcome back, ' + data.user.name);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0f1e' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[60%] p-12" style={{ background: 'linear-gradient(135deg, #0d1426 0%, #111827 100%)', borderRight: '1px solid #1f2937' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">iSecNet</span>
          <span className="text-xs text-gray-500 ml-1">NHI Security Platform</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Securing the<br />
            <span style={{ color: '#6366f1' }}>Invisible Doors</span><br />
            Companies Forgot to Lock
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            AI-powered Non-Human Identity security. Discover, monitor, and protect every API key, token, and machine credential across your entire infrastructure.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Search, label: 'NHI Discovery', desc: 'Find all machine keys in 2 hours' },
              { icon: Shield, label: 'AI Protection', desc: 'Real-time prompt injection blocking' },
              { icon: Zap,    label: 'Auto-Rotation', desc: 'Zero-downtime credential rotation' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  <Icon size={15} style={{ color: '#6366f1' }} />
                </div>
                <div className="text-sm font-semibold text-white mb-1">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '47+', label: 'Credentials Monitored' },
              { value: '95%', label: 'Risk Reduction' },
              { value: '<1ms', label: 'Detection Latency' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold" style={{ color: '#6366f1' }}>{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600">
          ISO 27001:2022 · CEH Certified · DPIIT Recognised · Top 20 India Cybersecurity Startups 2026
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">iSecNet</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your security dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9" placeholder="admin@isecnet.io" required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-sm font-semibold">
              {loading ? (
                <><span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Signing in...</>
              ) : 'Sign in to Dashboard'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="text-xs font-semibold text-gray-400 mb-2">Demo credentials</div>
            <div className="text-xs text-gray-300 font-mono">admin@isecnet.io</div>
            <div className="text-xs text-gray-300 font-mono">Demo@1234</div>
          </div>
        </div>
      </div>
    </div>
  );
}
