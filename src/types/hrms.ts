export type HrmsSyncStatus = 'synced' | 'pending' | 'local-preview';

export interface HrmsGeoFenceStatus {
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  distanceMeters: number;
  withinFence: boolean;
}

export interface HrmsAttendanceRecord {
  id: string;
  logDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number | null;
  status: string | null;
  syncStatus: HrmsSyncStatus;
  lastSelfieUri: string | null;
  geoFenceStatus: HrmsGeoFenceStatus | null;
  note: string | null;
}

export interface HrmsLeaveType {
  id: string;
  code: string;
  name: string;
  yearlyQuota: number;
  remainingDays: number;
  requiresApproval: boolean;
  description: string | null;
}

export interface HrmsLeaveApplication {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  status: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  syncStatus: HrmsSyncStatus;
  note: string | null;
}

export interface HrmsPayslip {
  id: string;
  payslipNumber: string;
  payPeriodFrom: string;
  payPeriodTo: string;
  workingDays: number | null;
  presentDays: number | null;
  absentDays: number | null;
  leaveDays: number | null;
  basicSalary: number | null;
  hra: number | null;
  specialAllowance: number | null;
  overtimeAmount: number | null;
  grossSalary: number;
  pfEmployee: number | null;
  esicEmployee: number | null;
  professionalTax: number | null;
  tds: number | null;
  otherDeductions: number | null;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: string | null;
  paymentDate: string | null;
  paymentReference: string | null;
  pdfUrl: string | null;
}

export type HrmsDocumentType =
  | 'aadhar'
  | 'pan'
  | 'voter_id'
  | 'passport'
  | 'psara'
  | 'police_verification'
  | 'other';

export interface HrmsDocument {
  id: string;
  documentType: HrmsDocumentType;
  documentNumber: string | null;
  documentUrl: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  notes: string | null;
  syncStatus: HrmsSyncStatus;
  localUri: string | null;
}

export interface HrmsDashboardData {
  isPreview: boolean;
  attendance: HrmsAttendanceRecord[];
  leaveTypes: HrmsLeaveType[];
  leaveApplications: HrmsLeaveApplication[];
  payslips: HrmsPayslip[];
  documents: HrmsDocument[];
}
