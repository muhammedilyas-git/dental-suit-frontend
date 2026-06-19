// Dental Clinic Management System TypeScript Types (matching the SQL schema)

// 1. Security & User Management
export interface Role {
  RoleId: number;
  RoleName: string;
}

export interface Permission {
  PermissionId: number;
  PermissionName: string;
  Module: string;
}

export interface RolePermission {
  RoleId: number;
  PermissionId: number;
}

export interface User {
  UserId: number;
  Username: string;
  PasswordHash: string;
  FullName: string;
  Email?: string | null;
  Phone?: string | null;
  RoleId: number;
  IsActive: boolean;
  CreatedAt: string;
}

// 2. Patient Management
export interface Patient {
  PatientId: number;
  FirstName: string;
  LastName: string;
  Gender?: string;
  DOB?: string;
  Mobile: string;
  Email?: string;
  Address?: string;
  MedicalHistory?: string;
  Allergies?: string;
  EmergencyContactName?: string;
  EmergencyContactNumber?: string;
  InsuranceProvider?: string;
  InsurancePolicyNumber?: string;
  PhotoUrl?: string;
  CreatedAt: string;
}

// 3. Doctor Management
export interface Department {
  DepartmentId: number;
  DepartmentName: string;
}

export interface Doctor {
  DoctorId: number;
  UserId: number;
  Qualification?: string;
  Specialization?: string;
  ConsultationFee: number;
  DepartmentId: number;
  AvailableTiming?: string;
  IsActive: boolean;
}

// 4. Appointment Management
export type AppointmentStatus = 'Scheduled' | 'Waiting' | 'InConsultation' | 'Completed' | 'Cancelled';

export interface Appointment {
  AppointmentId: number;
  PatientId: number;
  DoctorId: number;
  AppointmentDate: string;
  TokenNumber?: string;
  Status: AppointmentStatus;
  Notes?: string;
  CreatedAt: string;
}

// 5. Consultation & Prescription
export interface Consultation {
  ConsultationId: number;
  AppointmentId: number;
  Symptoms?: string;
  Diagnosis?: string;
  Notes?: string;
  TreatmentAdvice?: string;
  FollowUpDate?: string;
  ConsultationCharges: number;
  CreatedAt: string;
  Prescriptions?: Prescription[];
  Appointment?: Appointment;
}

// 7. Inventory Management
export interface ItemCategory {
  CategoryId: number;
  CategoryName: string;
}

export interface Unit {
  UnitId: number;
  UnitName: string;
}

export interface Supplier {
  SupplierId: number;
  SupplierName: string;
  ContactPerson?: string;
  ContactNumber?: string;
  Email?: string;
  Address?: string;
  OpeningBalance?: number;
}

export interface Item {
  ItemId: number;
  ItemName: string;
  CategoryId: number;
  UnitId: number;
  BatchNumber?: string;
  ExpiryDate?: string;
  PurchaseRate: number;
  SellingRate: number;
  ReorderLevel: number;
  CurrentStock: number;
  IsActive: boolean;
}

export interface Prescription {
  PrescriptionId: number;
  ConsultationId: number;
  ItemId?: number; // Can be null if external medicine
  ExternalMedicineName?: string;
  Dosage?: string;
  Duration?: string;
  Instructions?: string;
  IsExternalPurchase: boolean;
  Quantity: number;
}

export type InventoryTransactionType = 'Purchase' | 'Sale' | 'StockIn' | 'StockOut' | 'Adjustment';

export interface InventoryTransaction {
  TransactionId: number;
  ItemId: number;
  TransactionType: InventoryTransactionType;
  QuantityBefore: number;
  QuantityAfter: number;
  QuantityChange: number;
  ReferenceId?: number; // InvoiceId, PurchaseId, etc.
  UserId: number;
  Remarks?: string;
  TransactionDate: string;
}

// 6. Treatment Plan
export type TreatmentStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Treatment {
  TreatmentId: number;
  PatientId: number;
  DoctorId: number;
  ToothNumber?: string; // e.g. "14", "UR6"
  Description?: string;
  EstimatedCost: number;
  Status: TreatmentStatus;
  Notes?: string;
  CreatedAt: string;
  TreatmentSteps?: TreatmentStep[];
}

export type TreatmentStepStatus = 'Pending' | 'Completed';

export interface TreatmentStep {
  StepId: number;
  TreatmentId: number;
  StepDescription: string;
  Status: TreatmentStepStatus;
  CompletedDate?: string;
}

// 10. Financial Accounting
export interface AccountGroup {
  GroupId: number;
  GroupName: string;
  ParentGroupId?: number | null;
}

export interface Ledger {
  LedgerId: number;
  LedgerName: string;
  GroupId: number;
  OpeningBalance: number;
  BalanceType: 'Dr' | 'Cr';
  CurrentBalance: number;
  ReferenceType?: string; // Customer, Supplier, General
  ReferenceId?: number; // PatientId, SupplierId, etc.
}

export type VoucherType = 'Payment' | 'Receipt' | 'Journal';

export interface AccountTransaction {
  TransactionId: number;
  VoucherNo: string;
  VoucherDate: string;
  VoucherType: VoucherType;
  LedgerId: number;
  Amount: number;
  TransactionType: 'Dr' | 'Cr'; // Dr or Cr
  Narration?: string;
  ReferenceId?: number; // InvoiceId
  UserId: number;
  CreatedAt: string;
}

// 8. Billing & Invoice
export type InvoiceStatus = 'Draft' | 'Final' | 'Paid' | 'Partial' | 'Cancelled';

export interface Invoice {
  InvoiceId: number;
  InvoiceNumber: string;
  PatientId: number;
  DoctorId: number;
  ConsultationId?: number | null;
  InvoiceDate: string;
  SubTotal: number;
  Discount: number;
  TaxAmount: number;
  TotalAmount: number;
  PaidAmount: number;
  Status: InvoiceStatus;
  Notes?: string;
  InvoiceItems?: InvoiceItem[];
}

export interface InvoiceItem {
  InvoiceItemId: number;
  InvoiceId: number;
  ItemType: 'Consultation' | 'Treatment' | 'Medicine' | 'Fee'; // Consultation, Treatment, Medicine, Fee
  ReferenceId?: number; // ConsultationId, TreatmentId, ItemId
  Description?: string;
  Quantity: number;
  Rate: number;
  Amount: number;
}

export interface Payment {
  PaymentId: number;
  InvoiceId: number;
  PaymentDate: string;
  Amount: number;
  PaymentMode: 'Cash' | 'Card' | 'UPI' | 'BankTransfer';
  TransactionReference?: string;
  AccountTransactionId?: number | null;
  UserId: number;
}

export interface Shift {
  ShiftId: number;
  UserId: number;
  StartTime: string;
  EndTime?: string;
  OpeningCash: number;
  OpeningCashDenominations: string;
  ExpectedClosingCash: number;
  ActualClosingCash?: number;
  ClosingCashDenominations?: string;
  Status: string;
  Notes?: string;
}

export interface SystemSetting {
  SettingKey: string;
  SettingValue: string;
}

export interface Attendance {
  AttendanceId: number;
  UserId: number;
  Date: string;
  ClockIn: string;
  ClockOut?: string | null;
  Status: string;
  Notes?: string | null;
  User?: User;
}


