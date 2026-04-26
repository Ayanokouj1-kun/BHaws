export interface Room {
  id: string;
  name: string;
  capacity: number;
  monthlyRate: number;
  /** Computed automatically from beds — do not set manually */
  status: "Available" | "Full" | "Partial" | "Under Maintenance";
  /** When true, room is locked as Under Maintenance regardless of bed occupancy */
  underMaintenance?: boolean;
  beds: Bed[];
  floor?: number;
  amenities?: string[];
  description?: string;
  adminId?: string; // Owner Admin
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  roomId: string;
  name: string;
  status: "Available" | "Occupied";
  boarderId?: string;
}

export interface Boarder {
  id: string;
  fullName: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
  assignedRoomId: string;
  assignedBedId: string;
  moveInDate: string;
  moveOutDate?: string;
  advanceAmount: number;
  depositAmount: number;
  status: "Active" | "Inactive" | "Evicted";
  profilePhoto?: string;
  occupation?: string;
  gender?: "Male" | "Female" | "Other";
  adminId?: string; // Owner Admin
  createdAt: string;
}

export interface Payment {
  id: string;
  boarderId: string;
  type: "Advance" | "Deposit" | "Security Deposit" | "Monthly Rent" | "Utility" | "Maintenance" | "Balance Forward" | "Other";
  amount: number;
  month?: string;
  date?: string;
  dueDate?: string;
  paidDate?: string;
  status: "Paid" | "Pending" | "Unpaid" | "Overdue";
  method?: "Cash" | "GCash" | "Bank Transfer" | "Check";
  receivedBy?: string;
  lateFee?: number;
  receiptNumber?: string;
  notes?: string;
  adminId?: string; // Owner Admin
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface MaintenanceRequest {
  id: string;
  roomId: string;
  boarderId?: string;
  title: string;
  description: string;
  category: "Plumbing" | "Electrical" | "Structural" | "Appliance" | "Carpentry" | "Other";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  images?: string[];
  adminId?: string; // Owner Admin
  createdAt: string;
  resolvedAt?: string;
}

export interface Expense {
  id: string;
  category: "Utilities" | "Maintenance" | "Supplies" | "Taxes" | "Salary" | "Other";
  description: string;
  amount: number;
  date: string;
  paidBy: string;
  receiptRef?: string;
  adminId?: string; // Owner Admin
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "Normal" | "Important" | "Urgent";
  adminId?: string; // Owner Admin (or null for global/SuperAdmin)
  createdAt: string;
  expiresAt?: string;
}

export interface DashboardStats {
  totalBoarders: number;
  totalRooms: number;
  occupiedBeds: number;
  availableBeds: number;
  monthlyIncome: number;
  unpaidPayments: number;
}

export type UserRole = "SuperAdmin" | "Admin" | "Staff" | "Boarder";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  boarderId?: string; // Links to Boarder profile if role is 'Boarder'
  createdBy?: string; // ID of the Admin who created this user
  /** Personalized account data (stored in profiles) */
  email?: string;
  phone?: string;
  address?: string;
  profilePhoto?: string;
  emergencyContact?: string;
}

export interface BhSettings {
  name: string;
  address: string;
  contact: string;
  email: string;
  website?: string;
  taxId?: string;
  ownerName?: string;
  currency?: string;
  lateFeeEnabled?: boolean;
  lateFeeAmount?: number;
  gracePeriodDays?: number;
  gcashNumber?: string;
  gcashQRCode?: string;
  adminId?: string;
}
