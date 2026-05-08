export interface User { id: string; email: string; name: string; role: string; }

export interface Credential {
  id: string; name: string; type: string; source: string; sourceDetail: string;
  status: string; riskScore: number; riskLevel: string;
  lastUsed: string | null; lastRotated: string | null; createdAt: string;
  expiresAt: string | null; neverExpires: boolean;
  isShared: boolean; hasProductionAccess: boolean; isOverPrivileged: boolean;
  permissions: string; blastRadius: string; metadata: string;
}

export interface Alert {
  id: string; title: string; description: string; severity: string; type: string;
  status: string; credentialId: string | null; credentialName: string | null;
  detectedAt: string; resolvedAt: string | null; metadata: string;
}

export interface ScanJob {
  id: string; status: string; source: string;
  startedAt: string; completedAt: string | null;
  credentialsFound: number; issuesFound: number; logs: string;
}

export interface RotationHistory {
  id: string; credentialId: string; credentialName: string;
  rotatedAt: string; rotatedBy: string; previousRisk: number; newRisk: number;
  status: string; notes: string | null;
}

export interface DashboardStats {
  totalCredentials: number; criticalCount: number; highCount: number;
  mediumCount: number; lowCount: number; minimalCount: number;
  avgRiskScore: number; overallSecurityScore: number;
  openAlerts: number; totalAlerts: number;
  credentialsNeverRotated: number; orphanedCount: number; totalRotations: number;
  credentialsBySource: { source: string; count: number }[];
  credentialsByType: { type: string; count: number }[];
  topRiskyCredentials: Credential[];
  recentAlerts: Alert[];
}
