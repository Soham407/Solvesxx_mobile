import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

export interface MDExecutiveSummary {
  monthlyRevenue: number;
  headcount: number;
  activeIncidents: number;
  pendingApprovalCount: number;
}

export interface MDApprovalItem {
  id: string;
  type: 'purchase_order' | 'budget_exception' | 'policy_exception';
  description: string;
  requestedBy: string;
  department: string;
  amount: number;
  createdAt: string;
}

interface MDExecutiveSummaryRow {
  monthly_revenue: number | null;
  headcount: number | null;
  active_incidents: number | null;
  pending_approval_count: number | null;
}

interface MDApprovalItemRow {
  id: string | null;
  type: string | null;
  description: string | null;
  requested_by: string | null;
  department: string | null;
  amount: number | null;
  created_at: string | null;
}

function normalizeType(value: string | null): MDApprovalItem['type'] {
  if (value === 'budget_exception' || value === 'policy_exception' || value === 'purchase_order') {
    return value;
  }

  return 'purchase_order';
}

export async function getMDExecutiveSummary(profile: AppUserProfile) {
  const { data, error } = await supabase.rpc('get_md_executive_summary', {
    p_user_id: profile.userId,
  });

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as MDExecutiveSummaryRow | null;

  return {
    monthlyRevenue: row?.monthly_revenue ?? 0,
    headcount: row?.headcount ?? 0,
    activeIncidents: row?.active_incidents ?? 0,
    pendingApprovalCount: row?.pending_approval_count ?? 0,
  } satisfies MDExecutiveSummary;
}

export async function getMDApprovalQueue(profile: AppUserProfile) {
  const { data, error } = await supabase.rpc('get_md_approval_queue', {
    p_user_id: profile.userId,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as MDApprovalItemRow[];

  return rows.map((row) => ({
    id: row.id ?? `md-item-${Math.random().toString(36).slice(2, 10)}`,
    type: normalizeType(row.type),
    description: row.description ?? 'Approval item',
    requestedBy: row.requested_by ?? 'Unknown',
    department: row.department ?? 'General',
    amount: row.amount ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  })) satisfies MDApprovalItem[];
}

export async function approveMDItem(input: { itemId: string; approverId: string }) {
  const { error } = await supabase.rpc('approve_md_item', {
    p_item_id: input.itemId,
    p_approver_id: input.approverId,
  });

  if (error) {
    throw error;
  }
}

export async function rejectMDItem(input: { itemId: string; approverId: string }) {
  const { error } = await supabase.rpc('reject_md_item', {
    p_item_id: input.itemId,
    p_approver_id: input.approverId,
  });

  if (error) {
    throw error;
  }
}
