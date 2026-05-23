import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

interface AccountFinanceSummaryRpcRecord {
  today_collections?: number | null;
  outstanding_receivables?: number | null;
  pending_bills_count?: number | null;
  overdue_pmt_count?: number | null;
}

interface RecentBillRpcRecord {
  id?: string | null;
  bill_number?: string | null;
  party_name?: string | null;
  amount?: number | null;
  date?: string | null;
  type?: string | null;
  status?: string | null;
}

interface PaymentStatusRpcRecord {
  id?: string | null;
  invoice_number?: string | null;
  customer_name?: string | null;
  amount_due?: number | null;
  due_date?: string | null;
  is_overdue?: boolean | null;
}

export interface AccountFinanceSummaryRecord {
  todayCollections: number;
  outstandingReceivables: number;
  pendingBillsCount: number;
  overduePmtCount: number;
}

export interface BillRecord {
  id: string;
  billNumber: string;
  partyName: string;
  amount: number;
  date: string;
  type: 'purchase' | 'sale';
  status: 'paid' | 'pending' | 'overdue';
}

export interface PaymentStatusRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amountDue: number;
  dueDate: string;
  isOverdue: boolean;
}

function sanitizeType(value: string | null | undefined): BillRecord['type'] {
  return value === 'purchase' ? 'purchase' : 'sale';
}

function sanitizeBillStatus(value: string | null | undefined): BillRecord['status'] {
  if (value === 'paid' || value === 'pending' || value === 'overdue') {
    return value;
  }

  return 'pending';
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

export async function fetchRecentBills(profile: AppUserProfile): Promise<BillRecord[]> {
  const { data, error } = await supabase.rpc('get_recent_bills', toAccountContext(profile));

  if (error) {
    throw error;
  }

  const rows = (Array.isArray(data) ? data : []) as RecentBillRpcRecord[];

  return rows.map((row, index) => ({
    id: row.id ?? `bill-${index}`,
    billNumber: row.bill_number ?? `BILL-${index + 1}`,
    partyName: row.party_name ?? 'Unknown party',
    amount: Number(row.amount ?? 0),
    date: row.date ?? new Date().toISOString(),
    type: sanitizeType(row.type),
    status: sanitizeBillStatus(row.status),
  }));
}

export async function fetchPaymentStatusList(
  profile: AppUserProfile,
): Promise<PaymentStatusRecord[]> {
  const { data, error } = await supabase.rpc('get_payment_status_list', toAccountContext(profile));

  if (error) {
    throw error;
  }

  const rows = (Array.isArray(data) ? data : []) as PaymentStatusRpcRecord[];

  return rows.map((row, index) => ({
    id: row.id ?? `payment-${index}`,
    invoiceNumber: row.invoice_number ?? `INV-${index + 1}`,
    customerName: row.customer_name ?? 'Unknown customer',
    amountDue: Number(row.amount_due ?? 0),
    dueDate: row.due_date ?? new Date().toISOString(),
    isOverdue: Boolean(row.is_overdue),
  }));
}
