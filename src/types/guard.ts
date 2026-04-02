export type GuardDutyStatus = 'off_duty' | 'on_duty';

export type GuardQueueActionType = 'attendance' | 'checklist' | 'sos' | 'visitor';

export type GuardSosType = 'panic' | 'inactivity';

export interface GuardLocationSnapshot {
  latitude: number;
  longitude: number;
  capturedAt: string;
  distanceFromAssignedSite: number | null;
  withinGeoFence: boolean;
}

export interface GuardAttendanceEntry {
  id: string;
  action: 'clock_in' | 'clock_out';
  recordedAt: string;
  photoUri: string | null;
  location: GuardLocationSnapshot | null;
  queued: boolean;
}

export interface GuardSosEvent {
  id: string;
  alertType: GuardSosType;
  note: string;
  recordedAt: string;
  status: 'queued' | 'sent';
  photoUri: string | null;
  location: GuardLocationSnapshot | null;
}

export interface GuardChecklistItem {
  id: string;
  title: string;
  description: string;
  requiredEvidence: boolean;
  status: 'pending' | 'completed';
  completedAt: string | null;
  evidenceUri: string | null;
}

export interface GuardVisitorEntry {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  destination: string;
  vehicleNumber: string;
  photoUri: string | null;
  recordedAt: string;
  status: 'inside' | 'checked_out';
  frequentVisitor: boolean;
}

export interface GuardFrequentVisitorTemplate {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  destination: string;
  vehicleNumber: string;
}

export interface GuardEmergencyContact {
  id: string;
  label: string;
  role: string;
  phone: string;
  description: string;
  primary: boolean;
}

export interface GuardOfflineQueueItem {
  id: string;
  actionType: GuardQueueActionType;
  label: string;
  queuedAt: string;
}

export interface GuardPersistedState {
  ownerUserId: string | null;
  isOfflineMode: boolean;
  dutyStatus: GuardDutyStatus;
  lastPatrolResetAt: string | null;
  lastSyncAt: string | null;
  lastKnownLocation: GuardLocationSnapshot | null;
  attendanceLog: GuardAttendanceEntry[];
  sosEvents: GuardSosEvent[];
  checklistItems: GuardChecklistItem[];
  checklistSubmittedAt: string | null;
  visitorLog: GuardVisitorEntry[];
  frequentVisitors: GuardFrequentVisitorTemplate[];
  emergencyContacts: GuardEmergencyContact[];
  offlineQueue: GuardOfflineQueueItem[];
}
