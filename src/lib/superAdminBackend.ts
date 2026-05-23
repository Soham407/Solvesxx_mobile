import { supabase } from './supabase';

export interface SuperAdminPlatformSummary {
  totalCompanies: number;
  totalActiveUsers: number;
  activeIncidents: number;
  criticalAlertCount: number;
}

export interface CompanyHealthRecord {
  id: string;
  companyName: string;
  locationCount: number;
  activeUserCount: number;
  health: 'healthy' | 'warning' | 'critical';
  lastActivityAt: string;
}

interface PlatformSummaryRpcRecord {
  total_companies: number | null;
  total_active_users: number | null;
  active_incidents: number | null;
  critical_alert_count: number | null;
}

interface CompanyHealthRpcRecord {
  id: string;
  company_name: string | null;
  location_count: number | null;
  active_user_count: number | null;
  health: string | null;
  last_activity_at: string | null;
}

function normalizeHealth(value: string | null): CompanyHealthRecord['health'] {
  if (value === 'critical') {
    return 'critical';
  }

  if (value === 'warning') {
    return 'warning';
  }

  return 'healthy';
}

export async function fetchSuperAdminPlatformSummary(): Promise<SuperAdminPlatformSummary> {
  const { data, error } = await supabase.rpc('get_super_admin_platform_summary');

  if (error) {
    throw error;
  }

  const payload = (Array.isArray(data) ? data[0] : data) as PlatformSummaryRpcRecord | null;

  return {
    totalCompanies: Number(payload?.total_companies ?? 0),
    totalActiveUsers: Number(payload?.total_active_users ?? 0),
    activeIncidents: Number(payload?.active_incidents ?? 0),
    criticalAlertCount: Number(payload?.critical_alert_count ?? 0),
  };
}

export async function fetchAllCompaniesHealth(): Promise<CompanyHealthRecord[]> {
  const { data, error } = await supabase.rpc('get_all_companies_health');

  if (error) {
    throw error;
  }

  return ((data as CompanyHealthRpcRecord[] | null) ?? []).map((record) => ({
    id: record.id,
    companyName: record.company_name ?? 'Unnamed company',
    locationCount: Number(record.location_count ?? 0),
    activeUserCount: Number(record.active_user_count ?? 0),
    health: normalizeHealth(record.health),
    lastActivityAt: record.last_activity_at ?? '',
  }));
}
