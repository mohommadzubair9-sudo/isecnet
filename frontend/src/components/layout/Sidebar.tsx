import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Key, Network, Scan, Bell, RotateCcw, Settings, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const links = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/credentials', icon: Key,             label: 'Credentials' },
  { to: '/graph',       icon: Network,         label: 'Identity Graph' },
  { to: '/scanner',     icon: Scan,            label: 'Scanner' },
  { to: '/alerts',      icon: Bell,            label: 'Alerts' },
  { to: '/rotation',    icon: RotateCcw,       label: 'Key Rotation' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 flex flex-col z-40" style={{ background: '#0d1426', borderRight: '1px solid #1f2937' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-dark-200">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-base leading-none">iSecNet</div>
          <div className="text-gray-500 text-xs mt-0.5">NHI Security</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {label === 'Alerts' && alertCount > 0 && (
              <span className="text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-dark-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200 truncate">{user?.name || 'Admin'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-xs text-gray-600">v1.0.0 · iSecNet Platform</span>
        </div>
      </div>
    </aside>
  );
}
