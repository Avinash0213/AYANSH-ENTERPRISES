export interface Customer {
  id: number;
  serialNumber: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tokenNumber?: string;
  inquiryFrom?: string;
  comment?: string;
  address?: string;
  type: number;
  typeName: string;
  status: number;
  statusName: string;
  startDate?: string;
  period?: number;
  renewalDate?: string;
  endDate: string;
  createdDate: string;
  createdByName?: string;
  rent: number;
  deposit: number;
  quotedAmount: number;
  remainingAmount: number;
}

export interface CreateCustomerRequest {
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tokenNumber?: string;
  inquiryFrom?: string;
  comment?: string;
  address?: string;
  type: number;
  status: number;
  startDate?: string;
  period?: number | '';
  renewalDate?: string;
  // Optional payment fields
  receivedAmount?: number;
  governmentCharges?: number;
  employeeCommission?: number;
  paymentDate?: string;
  paymentComment?: string;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {}

export interface Payment {
  id: number;
  customerId?: number;
  sataraVisitCode?: string;
  customerSerial?: string;
  customerOwner?: string;
  receivedAmount: number;
  governmentCharges: number;
  employeeCommission: number;
  profit: number;
  paymentDate: string;
  comment?: string;
  collectorName?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  customerId?: number;
  sataraVisitCode?: string;
  receivedAmount: number;
  governmentCharges: number;
  employeeCommission: number;
  paymentDate: string;
  comment?: string;
  collectorName?: string;
}

export interface PaymentSummary {
  totalReceived: number;
  totalGovernmentCharges: number;
  totalCommission: number;
  totalProfit: number;
  totalPayments: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  isDeleted: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  roleId: number;
  password?: string;
}

export interface Permission {
  id: number;
  name: string;
}

export interface UserPermission {
  permissionId: number;
  permissionName: string;
  isGranted: boolean;
  source: string;
}

export interface SataraVisit {
  id: number;
  visitCode: string;
  personName: string;
  phoneNumber?: string;
  address?: string;
  scheduledTime: string;
  taskType?: string;
  tokenNumber?: string;
  password?: string;
  remarks?: string;
  status: string;
  createdAt: string;
  createdById: number;
  createdByName?: string;
}

export interface CreateSataraVisitRequest {
  personName: string;
  phoneNumber?: string;
  address?: string;
  scheduledTime: string;
  taskType?: string;
  tokenNumber?: string;
  password?: string;
  remarks?: string;
}

export interface UpdateSataraVisitRequest extends CreateSataraVisitRequest {
  status: string;
}
