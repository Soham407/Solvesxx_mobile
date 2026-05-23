import { supabase } from './supabase';
import type { AppUserProfile } from '../types/app';

export interface StorekeeperSummary {
  totalItems: number;
  lowStockCount: number;
  pendingGRNCount: number;
}

export interface StockAlertItem {
  id: string;
  itemName: string;
  currentQuantity: number;
  minThreshold: number;
  unit: string;
  locationName: string;
  severity: 'critical' | 'warning';
}

export interface GRNRecord {
  id: string;
  grnNumber: string;
  supplierName: string;
  poNumber: string;
  receivedDate: string;
  itemCount: number;
  status: 'pending' | 'verified';
}

function resolveCompanyId(profile: AppUserProfile) {
  const preferenceCompanyId = profile.preferences?.companyId;
  if (typeof preferenceCompanyId === 'string' && preferenceCompanyId.length > 0) {
    return preferenceCompanyId;
  }

  return profile.societyId;
}

export async function fetchStorekeeperSummary(profile: AppUserProfile): Promise<StorekeeperSummary> {
  const { data, error } = await supabase.rpc('get_storekeeper_summary', {
    p_user_id: profile.userId,
    p_company_id: resolveCompanyId(profile),
  });

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | {
        total_items?: number | null;
        low_stock_count?: number | null;
        pending_grn_count?: number | null;
      }
    | null
    | undefined;

  return {
    totalItems: row?.total_items ?? 0,
    lowStockCount: row?.low_stock_count ?? 0,
    pendingGRNCount: row?.pending_grn_count ?? 0,
  };
}

export async function fetchStockAlerts(profile: AppUserProfile): Promise<StockAlertItem[]> {
  const { data, error } = await supabase.rpc('get_stock_alerts', {
    p_user_id: profile.userId,
    p_company_id: resolveCompanyId(profile),
  });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row) => {
    const entry = row as {
      id?: string | number | null;
      item_name?: string | null;
      current_quantity?: number | null;
      min_threshold?: number | null;
      unit?: string | null;
      location_name?: string | null;
      severity?: string | null;
    };

    return {
      id: String(entry.id ?? Math.random().toString(36).slice(2, 10)),
      itemName: entry.item_name ?? 'Unknown item',
      currentQuantity: entry.current_quantity ?? 0,
      minThreshold: entry.min_threshold ?? 0,
      unit: entry.unit ?? 'units',
      locationName: entry.location_name ?? 'Unknown location',
      severity: entry.severity === 'critical' ? 'critical' : 'warning',
    };
  });
}

export async function fetchPendingGRNs(profile: AppUserProfile): Promise<GRNRecord[]> {
  const { data, error } = await supabase.rpc('get_pending_grns', {
    p_user_id: profile.userId,
    p_company_id: resolveCompanyId(profile),
  });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];

  return rows.map((row) => {
    const entry = row as {
      id?: string | number | null;
      grn_number?: string | null;
      supplier_name?: string | null;
      po_number?: string | null;
      received_date?: string | null;
      item_count?: number | null;
      status?: string | null;
    };

    return {
      id: String(entry.id ?? Math.random().toString(36).slice(2, 10)),
      grnNumber: entry.grn_number ?? 'GRN-UNKNOWN',
      supplierName: entry.supplier_name ?? 'Unknown supplier',
      poNumber: entry.po_number ?? 'PO-UNKNOWN',
      receivedDate: entry.received_date ?? new Date(0).toISOString(),
      itemCount: entry.item_count ?? 0,
      status: entry.status === 'verified' ? 'verified' : 'pending',
    };
  });
}
