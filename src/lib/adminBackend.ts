import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

interface AdminDashboardSummaryRpcRow {
  active_users_count: number | null;
  logins_today: number | null;
  pending_onboarding: number | null;
  system_alerts: number | null;
}

export interface AdminDashboardSummaryRecord {
  activeUsersCount: number;
  loginsToday: number;
  pendingOnboarding: number;
  systemAlerts: number;
}

function readCompanyId(profile: AppUserProfile) {
  const candidate =
    typeof profile.preferences.company_id === 'string'
      ? profile.preferences.company_id
      : typeof profile.preferences.companyId === 'string'
        ? profile.preferences.companyId
        : null;

  return candidate?.trim() ? candidate.trim() : null;
}

export async function fetchAdminDashboardSummary(
  profile: AppUserProfile,
): Promise<AdminDashboardSummaryRecord> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_summary', {
    p_user_id: profile.userId,
    p_company_id: readCompanyId(profile),
  });

  if (error) {
    throw error;
  }

  const record = Array.isArray(data)
    ? ((data[0] ?? null) as AdminDashboardSummaryRpcRow | null)
    : ((data ?? null) as AdminDashboardSummaryRpcRow | null);

  return {
    activeUsersCount: record?.active_users_count ?? 0,
    loginsToday: record?.logins_today ?? 0,
    pendingOnboarding: record?.pending_onboarding ?? 0,
    systemAlerts: record?.system_alerts ?? 0,
  };
}
