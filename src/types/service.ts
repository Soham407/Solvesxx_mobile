import type { AppRole } from './app';
import type { GuardLocationSnapshot } from './guard';

export type ServiceRole = Extract<
  AppRole,
  'ac_technician' | 'pest_control_technician' | 'delivery_boy' | 'service_boy'
>;

export type ServiceDutyStatus = 'off_duty' | 'on_duty';
export type ServiceTaskCategory = 'ac_service' | 'pest_control' | 'delivery' | 'general_service';
export type ServiceTaskPriority = 'low' | 'medium' | 'high';
export type ServiceTaskStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_progress'
  | 'awaiting_material'
  | 'in_transit'
  | 'completed'
  | 'delivered';
export type ServiceMaterialType = 'part' | 'chemical' | 'supply';
export type ServiceMaterialStatus = 'pending_approval' | 'approved' | 'issued';
export type ServiceProofStage = 'before' | 'after' | 'delivery';
export type ServiceLocationSnapshot = GuardLocationSnapshot;

export interface ServiceAttendanceEntry {
  id: string;
  action: 'check_in' | 'check_out';
  recordedAt: string;
  photoUri: string | null;
  location: ServiceLocationSnapshot | null;
}

export interface ServiceTaskRecord {
  id: string;
  role: ServiceRole;
  taskType: ServiceTaskCategory;
  referenceCode: string;
  title: string;
  description: string;
  locationName: string;
  unitLabel: string | null;
  priority: ServiceTaskPriority;
  status: ServiceTaskStatus;
  assignedAt: string;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  beforePhotoUri: string | null;
  afterPhotoUri: string | null;
  deliveryProofUri: string | null;
  requiresBeforeAfterPhotos: boolean;
  requiresDeliveryProof: boolean;
  requiresResidentNotification: boolean;
  residentNotificationSentAt: string | null;
  notes: string | null;
}

export interface ServiceMaterialRequest {
  id: string;
  taskId: string;
  label: string;
  quantity: number;
  unit: string;
  requestType: ServiceMaterialType;
  status: ServiceMaterialStatus;
  requestedAt: string;
  approvedAt: string | null;
  note: string | null;
}

export interface ServicePPEItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

export interface ServicePersistedState {
  ownerUserId: string | null;
  role: ServiceRole;
  dutyStatus: ServiceDutyStatus;
  lastKnownLocation: ServiceLocationSnapshot | null;
  lastSyncAt: string | null;
  attendanceLog: ServiceAttendanceEntry[];
  tasks: ServiceTaskRecord[];
  materialRequests: ServiceMaterialRequest[];
  ppeChecklist: ServicePPEItem[];
}
