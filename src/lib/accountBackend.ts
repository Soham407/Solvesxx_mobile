import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

interface AccountFinanceSummaryRpcRecord {
  today_collections?: number | null;
  outstanding_receivables?: number | null;
  pending_bills_count?: number | null;
  overdue_pmt_count?: number | null;
}

export interface AccountFinanceSummaryRecord {
  todayCollections: number;
  outstandingReceivables: number;
  pendingBillsCount: number;
  overduePmtCount: number;
}

function toAccountContext(profile: AppUserProfile) {
  return {
    p_company_id: profile.societyId,
    p_user_id: profile.userId,
  };
}

export async function fetchAccountFinanceSummary(
  profile: AppUserProfile,
): Promise<AccountFinanceSummaryRecord> {
  const { data, error } = await supabase.rpc('get_account_finance_summary', toAccountContext(profile));

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as AccountFinanceSummaryRpcRecord | null;

  return {
    todayCollections: Number(row?.today_collections ?? 0),
    outstandingReceivables: Number(row?.outstanding_receivables ?? 0),
    pendingBillsCount: Number(row?.pending_bills_count ?? 0),
    overduePmtCount: Number(row?.overdue_pmt_count ?? 0),
  };
}
