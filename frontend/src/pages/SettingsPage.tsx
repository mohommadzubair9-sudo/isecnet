import { useState } from 'react';
import { Save, Bell, Shield, Key, Database, User, Check, Globe, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

type Tab = 'profile' | 'notifications' | 'security' | 'integrations' | 'system';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'integrations',  label: 'Integrations',   icon: Globe },
  { id: 'system',        label: 'System',         icon: Database },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex w-10 h-5 rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? '#6366f1' : '#374151' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <div className="card p-5 space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm text-white">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({ name: 'Admin User', email: user?.email || 'admin@isecnet.io', role: 'Security Administrator', org: 'iSecNet Solutions' });
  const [notifs, setNotifs] = useState({ emailAlerts: true, criticalOnly: false, weeklyReport: true, slackEnabled: false, slackWebhook: '', rotationReminders: true, scanComplete: true });
  const [security, setSecurity] = useState({ sessionTimeout: '8', mfaEnabled: false, ipWhitelist: '', auditLog: true, autoRevoke: true, rotationInterval: '90' });
  const [integrations, setIntegrations] = useState({ awsEnabled: true, awsRegion: 'us-east-1', githubEnabled: true, githubOrg: 'your-org', k8sEnabled: false, slackEnabled: false, pagerdutyEnabled: false });

  const save = () => {
    setSaved(true);
    toast.success('Settings saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your iSecNet security platform</p>
      </div>

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left"
                style={{
                  background: activeTab === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeTab === id ? '#6366f1' : '#6b7280',
                  borderLeft: activeTab === id ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div>
              <Section title="Personal Information" description="Update your account details">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                    <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                    <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Role</label>
                    <input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Organisation</label>
                    <input value={profile.org} onChange={(e) => setProfile({ ...profile, org: e.target.value })} className="w-full text-sm" />
                  </div>
                </div>
              </Section>

              <Section title="Appearance" description="Customize the platform look">
                <SettingRow label="Theme" description="Platform color scheme">
                  <select className="text-sm">
                    <option>Dark (Default)</option>
                    <option>System</option>
                  </select>
                </SettingRow>
                <SettingRow label="Density" description="UI information density">
                  <select className="text-sm">
                    <option>Comfortable</option>
                    <option>Compact</option>
                  </select>
                </SettingRow>
                <SettingRow label="Date Format">
                  <select className="text-sm">
                    <option>MMM D, YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                  </select>
                </SettingRow>
              </Section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <Section title="Email Notifications" description="Choose when to receive email alerts">
                <SettingRow label="Security Alerts" description="Receive emails for new security alerts">
                  <Toggle checked={notifs.emailAlerts} onChange={(v) => setNotifs({ ...notifs, emailAlerts: v })} />
                </SettingRow>
                <SettingRow label="Critical Alerts Only" description="Only notify for CRITICAL severity">
                  <Toggle checked={notifs.criticalOnly} onChange={(v) => setNotifs({ ...notifs, criticalOnly: v })} />
                </SettingRow>
                <SettingRow label="Weekly Security Report" description="Sunday summary of your security posture">
                  <Toggle checked={notifs.weeklyReport} onChange={(v) => setNotifs({ ...notifs, weeklyReport: v })} />
                </SettingRow>
                <SettingRow label="Rotation Reminders" description="Remind when credentials are overdue">
                  <Toggle checked={notifs.rotationReminders} onChange={(v) => setNotifs({ ...notifs, rotationReminders: v })} />
                </SettingRow>
                <SettingRow label="Scan Complete" description="Notify when a scan finishes">
                  <Toggle checked={notifs.scanComplete} onChange={(v) => setNotifs({ ...notifs, scanComplete: v })} />
                </SettingRow>
              </Section>

              <Section title="Slack Integration" description="Send alerts to a Slack channel">
                <SettingRow label="Enable Slack Alerts">
                  <Toggle checked={notifs.slackEnabled} onChange={(v) => setNotifs({ ...notifs, slackEnabled: v })} />
                </SettingRow>
                {notifs.slackEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Webhook URL</label>
                    <input
                      value={notifs.slackWebhook}
                      onChange={(e) => setNotifs({ ...notifs, slackWebhook: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full text-sm"
                    />
                  </div>
                )}
              </Section>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <Section title="Session & Access" description="Control session and access security">
                <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
                  <select
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                    className="text-sm"
                  >
                    {[['1', '1 hour'], ['4', '4 hours'], ['8', '8 hours'], ['24', '24 hours'], ['168', '7 days']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </SettingRow>
                <SettingRow label="Multi-Factor Authentication" description="Require MFA for login (TOTP)">
                  <Toggle checked={security.mfaEnabled} onChange={(v) => setSecurity({ ...security, mfaEnabled: v })} />
                </SettingRow>
                <SettingRow label="Audit Logging" description="Log all admin actions">
                  <Toggle checked={security.auditLog} onChange={(v) => setSecurity({ ...security, auditLog: v })} />
                </SettingRow>
              </Section>

              <Section title="Credential Policies" description="Set platform-wide rotation and access rules">
                <SettingRow label="Auto-Revoke on Anomaly" description="Automatically disable credentials with detected anomalies">
                  <Toggle checked={security.autoRevoke} onChange={(v) => setSecurity({ ...security, autoRevoke: v })} />
                </SettingRow>
                <SettingRow label="Rotation Interval (days)" description="Maximum days before rotation is required">
                  <select
                    value={security.rotationInterval}
                    onChange={(e) => setSecurity({ ...security, rotationInterval: e.target.value })}
                    className="text-sm"
                  >
                    {[['30', '30 days'], ['60', '60 days'], ['90', '90 days (recommended)'], ['180', '180 days']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </SettingRow>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">IP Allowlist</label>
                  <input
                    value={security.ipWhitelist}
                    onChange={(e) => setSecurity({ ...security, ipWhitelist: e.target.value })}
                    placeholder="192.168.1.0/24, 10.0.0.0/8 (comma-separated, blank = all)"
                    className="w-full text-sm"
                  />
                </div>
              </Section>

              <Section title="Risk Scoring Weights" description="Adjust how risk scores are calculated">
                {[
                  { label: 'Credential Age',      weight: 25 },
                  { label: 'Production Access',   weight: 20 },
                  { label: 'Privilege Level',      weight: 20 },
                  { label: 'Sharing Pattern',      weight: 15 },
                  { label: 'Activity Anomaly',     weight: 10 },
                  { label: 'Expiry Status',        weight: 10 },
                ].map(({ label, weight }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</div>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1f2937' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${weight * 4}%`, background: '#6366f1' }} />
                    </div>
                    <div className="text-xs font-bold text-accent w-8 text-right">{weight}%</div>
                  </div>
                ))}
                <div className="text-xs text-gray-600 flex items-center gap-1.5 pt-1">
                  <AlertTriangle size={11} className="text-yellow-500" />
                  Contact support to customize weights for your environment
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <Section title="Cloud & Infrastructure" description="Connect your cloud providers">
                {[
                  { key: 'awsEnabled', label: 'Amazon Web Services', desc: 'Scan IAM users, roles, and access keys', icon: '☁️', connected: integrations.awsEnabled },
                  { key: 'githubEnabled', label: 'GitHub', desc: 'Scan repository secrets and deploy keys', icon: '🐙', connected: integrations.githubEnabled },
                  { key: 'k8sEnabled', label: 'Kubernetes', desc: 'Scan service accounts and secrets', icon: '⚓', connected: integrations.k8sEnabled },
                ].map(({ key, label, desc, icon, connected }) => (
                  <div key={key} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: '#0d1426', border: `1px solid ${connected ? 'rgba(99,102,241,0.3)' : '#1f2937'}` }}>
                    <div className="text-2xl">{icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {connected && <span className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Connected</span>}
                      <Toggle
                        checked={connected}
                        onChange={(v) => setIntegrations({ ...integrations, [key]: v })}
                      />
                    </div>
                  </div>
                ))}
              </Section>

              <Section title="Alerting & ITSM" description="Push alerts to your operations tools">
                {[
                  { key: 'slackEnabled', label: 'Slack', desc: 'Post alerts to channels', icon: '💬', connected: integrations.slackEnabled },
                  { key: 'pagerdutyEnabled', label: 'PagerDuty', desc: 'Trigger incidents for critical alerts', icon: '📟', connected: integrations.pagerdutyEnabled },
                ].map(({ key, label, desc, icon, connected }) => (
                  <div key={key} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: '#0d1426', border: `1px solid ${connected ? 'rgba(99,102,241,0.3)' : '#1f2937'}` }}>
                    <div className="text-2xl">{icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                    <Toggle
                      checked={connected}
                      onChange={(v) => setIntegrations({ ...integrations, [key]: v })}
                    />
                  </div>
                ))}
              </Section>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <Section title="Database" description="Database status and management">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Database', value: 'SQLite', icon: Database },
                    { label: 'Records', value: '47 credentials', icon: Key },
                    { label: 'Uptime', value: '99.9%', icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-3 rounded-lg text-center" style={{ background: '#0d1426', border: '1px solid #1f2937' }}>
                      <Icon size={20} className="text-accent mx-auto mb-1.5" />
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Data Management" description="Export and reset options">
                <SettingRow label="Export Credentials (CSV)" description="Download all credentials and risk scores">
                  <button className="btn-ghost text-xs py-1.5" onClick={() => toast.success('Export started — check your downloads')}>
                    Export CSV
                  </button>
                </SettingRow>
                <SettingRow label="Export Alerts (JSON)" description="Download full alert history">
                  <button className="btn-ghost text-xs py-1.5" onClick={() => toast.success('Alerts exported')}>
                    Export JSON
                  </button>
                </SettingRow>
                <SettingRow label="Reset Demo Data" description="Re-seed the database with fresh demo data">
                  <button className="text-xs py-1.5 px-3 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 transition-all" onClick={() => toast.error('Reset requires CLI: npm run seed')}>
                    Reset Data
                  </button>
                </SettingRow>
              </Section>

              <Section title="Platform Info" description="Version and licence information">
                {[
                  { label: 'Platform Version', value: '1.0.0-mvp' },
                  { label: 'API Version', value: 'v1' },
                  { label: 'Environment', value: 'Development' },
                  { label: 'Licence', value: 'iSecNet Proprietary' },
                  { label: 'Built with', value: 'React + Node.js + Prisma' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-300 font-mono text-xs">{value}</span>
                  </div>
                ))}
              </Section>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button onClick={save} className="btn-primary px-6">
              {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
