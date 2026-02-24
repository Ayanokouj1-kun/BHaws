import { Room, Boarder, Payment, AuditLog, MaintenanceRequest, Expense, Announcement } from "@/types";

export const mockRooms: Room[] = [
  {
    id: "r1", name: "Room 101", capacity: 3, monthlyRate: 3500, status: "Full", floor: "1st Floor",
    amenities: ["AC", "Private Bathroom", "WiFi"],
    description: "Spacious room with private bathroom and air conditioning.",
    beds: [
      { id: "b1", roomId: "r1", name: "Bed A", status: "Occupied", boarderId: "bo1" },
      { id: "b2", roomId: "r1", name: "Bed B", status: "Occupied", boarderId: "bo2" },
      { id: "b3", roomId: "r1", name: "Bed C", status: "Occupied", boarderId: "bo3" },
    ],
    createdAt: "2025-01-10", updatedAt: "2025-02-20",
  },
  {
    id: "r2", name: "Room 102", capacity: 2, monthlyRate: 4000, status: "Partial", floor: "1st Floor",
    amenities: ["AC", "Shared Bathroom", "WiFi", "Study Desk"],
    description: "Premium room with study desk, ideal for students.",
    beds: [
      { id: "b4", roomId: "r2", name: "Bed A", status: "Occupied", boarderId: "bo4" },
      { id: "b5", roomId: "r2", name: "Bed B", status: "Available" },
    ],
    createdAt: "2025-01-10", updatedAt: "2025-02-18",
  },
  {
    id: "r3", name: "Room 201", capacity: 4, monthlyRate: 3000, status: "Partial", floor: "2nd Floor",
    amenities: ["Fan", "Shared Bathroom", "WiFi"],
    description: "Budget-friendly room with shared amenities.",
    beds: [
      { id: "b6", roomId: "r3", name: "Bed A", status: "Occupied", boarderId: "bo5" },
      { id: "b7", roomId: "r3", name: "Bed B", status: "Occupied", boarderId: "bo6" },
      { id: "b8", roomId: "r3", name: "Bed C", status: "Available" },
      { id: "b9", roomId: "r3", name: "Bed D", status: "Available" },
    ],
    createdAt: "2025-01-12", updatedAt: "2025-02-22",
  },
  {
    id: "r4", name: "Room 202", capacity: 2, monthlyRate: 4500, status: "Available", floor: "2nd Floor",
    amenities: ["AC", "Private Bathroom", "WiFi", "Ref", "Study Desk"],
    description: "Premium deluxe room with complete amenities.",
    beds: [
      { id: "b10", roomId: "r4", name: "Bed A", status: "Available" },
      { id: "b11", roomId: "r4", name: "Bed B", status: "Available" },
    ],
    createdAt: "2025-01-15", updatedAt: "2025-01-15",
  },
  {
    id: "r5", name: "Room 203", capacity: 3, monthlyRate: 3800, status: "Partial", floor: "2nd Floor",
    amenities: ["AC", "Shared Bathroom", "WiFi", "Locker"],
    description: "Comfortable room with individual lockers for each boarder.",
    beds: [
      { id: "b12", roomId: "r5", name: "Bed A", status: "Occupied", boarderId: "bo7" },
      { id: "b13", roomId: "r5", name: "Bed B", status: "Available" },
      { id: "b14", roomId: "r5", name: "Bed C", status: "Available" },
    ],
    createdAt: "2025-01-18", updatedAt: "2025-02-10",
  },
];

export const mockBoarders: Boarder[] = [
  { id: "bo1", fullName: "Juan Dela Cruz", contactNumber: "09171234567", email: "juan@email.com", address: "123 Rizal St, Manila", emergencyContact: "Maria Dela Cruz - 09179876543", assignedRoomId: "r1", assignedBedId: "b1", moveInDate: "2025-01-15", advanceAmount: 3500, depositAmount: 3500, status: "Active", occupation: "Student", createdAt: "2025-01-15" },
  { id: "bo2", fullName: "Maria Santos", contactNumber: "09181234567", email: "maria.s@email.com", address: "456 Mabini Ave, Quezon City", emergencyContact: "Pedro Santos - 09189876543", assignedRoomId: "r1", assignedBedId: "b2", moveInDate: "2025-01-20", advanceAmount: 3500, depositAmount: 3500, status: "Active", occupation: "Working Professional", createdAt: "2025-01-20" },
  { id: "bo3", fullName: "Pedro Reyes", contactNumber: "09191234567", email: "pedro.r@email.com", address: "789 Luna St, Pasig", emergencyContact: "Ana Reyes - 09199876543", assignedRoomId: "r1", assignedBedId: "b3", moveInDate: "2025-02-01", advanceAmount: 3500, depositAmount: 3500, status: "Active", occupation: "Student", createdAt: "2025-02-01" },
  { id: "bo4", fullName: "Ana Garcia", contactNumber: "09201234567", email: "ana.g@email.com", address: "321 Bonifacio St, Makati", emergencyContact: "Luis Garcia - 09209876543", assignedRoomId: "r2", assignedBedId: "b4", moveInDate: "2025-01-25", advanceAmount: 4000, depositAmount: 4000, status: "Active", occupation: "Working Professional", createdAt: "2025-01-25" },
  { id: "bo5", fullName: "Carlos Mendoza", contactNumber: "09211234567", email: "carlos.m@email.com", address: "654 Aguinaldo Dr, Taguig", emergencyContact: "Rosa Mendoza - 09219876543", assignedRoomId: "r3", assignedBedId: "b6", moveInDate: "2025-02-05", advanceAmount: 3000, depositAmount: 3000, status: "Active", occupation: "Student", createdAt: "2025-02-05" },
  { id: "bo6", fullName: "Rosa Villanueva", contactNumber: "09221234567", email: "rosa.v@email.com", address: "987 Del Pilar St, Mandaluyong", emergencyContact: "Jose Villanueva - 09229876543", assignedRoomId: "r3", assignedBedId: "b7", moveInDate: "2025-02-10", advanceAmount: 3000, depositAmount: 3000, status: "Active", occupation: "Student", createdAt: "2025-02-10" },
  { id: "bo7", fullName: "Luis Bautista", contactNumber: "09231234567", email: "luis.b@email.com", address: "147 Quezon Blvd, Caloocan", emergencyContact: "Carmen Bautista - 09239876543", assignedRoomId: "r5", assignedBedId: "b12", moveInDate: "2025-02-15", advanceAmount: 3800, depositAmount: 3800, status: "Active", occupation: "Working Professional", createdAt: "2025-02-15" },
];

export const mockPayments: Payment[] = [
  { id: "p1", boarderId: "bo1", type: "Advance", amount: 3500, date: "2025-01-15", month: "January 2025", paidDate: "2025-01-15", status: "Paid", method: "Cash", receivedBy: "Admin", receiptNumber: "RCP-2025-001", createdAt: "2025-01-15" },
  { id: "p2", boarderId: "bo1", type: "Monthly Rent", amount: 3500, date: "2025-02-15", month: "February 2025", paidDate: "2025-02-14", status: "Paid", method: "GCash", receivedBy: "Admin", receiptNumber: "RCP-2025-003", createdAt: "2025-02-14" },
  { id: "p3", boarderId: "bo1", type: "Monthly Rent", amount: 3500, date: "2025-03-15", month: "March 2025", status: "Pending", createdAt: "2025-03-01" },
  { id: "p4", boarderId: "bo2", type: "Advance", amount: 3500, date: "2025-01-20", month: "January 2025", paidDate: "2025-01-20", status: "Paid", method: "Bank Transfer", receivedBy: "Admin", receiptNumber: "RCP-2025-004", createdAt: "2025-01-20" },
  { id: "p5", boarderId: "bo2", type: "Monthly Rent", amount: 3500, date: "2025-02-20", month: "February 2025", status: "Overdue", lateFee: 200, createdAt: "2025-02-01" },
  { id: "p6", boarderId: "bo3", type: "Advance", amount: 3500, date: "2025-02-01", month: "February 2025", paidDate: "2025-02-01", status: "Paid", method: "Cash", receivedBy: "Staff", receiptNumber: "RCP-2025-006", createdAt: "2025-02-01" },
  { id: "p7", boarderId: "bo4", type: "Advance", amount: 4000, date: "2025-01-25", month: "January 2025", paidDate: "2025-01-25", status: "Paid", method: "GCash", receivedBy: "Admin", receiptNumber: "RCP-2025-008", createdAt: "2025-01-25" },
  { id: "p8", boarderId: "bo4", type: "Monthly Rent", amount: 4000, date: "2025-02-25", month: "February 2025", status: "Pending", createdAt: "2025-02-01" },
  { id: "p9", boarderId: "bo5", type: "Advance", amount: 3000, date: "2025-02-05", month: "February 2025", paidDate: "2025-02-05", status: "Paid", method: "Cash", receivedBy: "Admin", receiptNumber: "RCP-2025-009", createdAt: "2025-02-05" },
  { id: "p10", boarderId: "bo6", type: "Monthly Rent", amount: 3000, date: "2025-03-10", month: "March 2025", status: "Pending", createdAt: "2025-03-01" },
  { id: "p11", boarderId: "bo7", type: "Advance", amount: 3800, date: "2025-02-15", month: "February 2025", paidDate: "2025-02-15", status: "Paid", method: "GCash", receivedBy: "Admin", receiptNumber: "RCP-2025-011", createdAt: "2025-02-15" },
  { id: "p12", boarderId: "bo7", type: "Monthly Rent", amount: 3800, date: "2025-03-15", month: "March 2025", status: "Pending", createdAt: "2025-03-01" },
];

export const mockAuditLogs: AuditLog[] = [
  { id: "a1", action: "Boarder Added", entity: "Boarder", entityId: "bo7", details: "Luis Bautista registered and assigned to Room 203 - Bed A", performedBy: "Admin", timestamp: "2025-02-15 09:30:00" },
  { id: "a2", action: "Payment Recorded", entity: "Payment", entityId: "p11", details: "Advance payment of ₱3,800 received from Luis Bautista via GCash", performedBy: "Admin", timestamp: "2025-02-15 09:35:00" },
  { id: "a3", action: "Room Assigned", entity: "Room", entityId: "r5", details: "Room 203 - Bed A assigned to Luis Bautista", performedBy: "Admin", timestamp: "2025-02-15 09:30:00" },
  { id: "a4", action: "Payment Updated", entity: "Payment", entityId: "p2", details: "Monthly rent payment marked as Paid for Juan Dela Cruz (Feb 2025)", performedBy: "Admin", timestamp: "2025-02-14 14:20:00" },
  { id: "a5", action: "Boarder Added", entity: "Boarder", entityId: "bo6", details: "Rosa Villanueva registered and assigned to Room 201 - Bed B", performedBy: "Staff", timestamp: "2025-02-10 10:00:00" },
  { id: "a6", action: "Payment Overdue", entity: "Payment", entityId: "p5", details: "Maria Santos monthly rent is overdue. Late fee of ₱200 applied", performedBy: "System", timestamp: "2025-02-21 00:00:00" },
  { id: "a7", action: "Settings Updated", entity: "Settings", entityId: "system", details: "Boarding house information was updated by Administrator", performedBy: "Admin", timestamp: "2025-01-10 08:00:00" },
];

export const mockMaintenanceRequests: MaintenanceRequest[] = [
  { id: "m1", roomId: "r1", boarderId: "bo1", title: "Leaking Faucet", description: "Bathroom faucet is leaking continuously and needs repair.", priority: "High", status: "In Progress", createdAt: "2025-02-18" },
  { id: "m2", roomId: "r3", title: "Broken Window", description: "Window latch is broken and cannot be locked properly.", priority: "Medium", status: "Open", createdAt: "2025-02-20" },
  { id: "m3", roomId: "r2", boarderId: "bo4", title: "AC Not Cooling", description: "Air conditioning unit is not cooling the room effectively.", priority: "Urgent", status: "Resolved", createdAt: "2025-02-10", resolvedAt: "2025-02-12" },
  { id: "m4", roomId: "r5", title: "Light Bulb Replacement", description: "Ceiling light bulb needs replacement in the hallway.", priority: "Low", status: "Open", createdAt: "2025-02-22" },
];

export const mockExpenses: Expense[] = [
  { id: "e1", category: "Utilities", description: "Monthly electricity bill - February 2025", amount: 8500, date: "2025-02-28", paidBy: "Admin", receiptRef: "MERALCO-202502" },
  { id: "e2", category: "Utilities", description: "Water bill - February 2025", amount: 1200, date: "2025-02-28", paidBy: "Admin", receiptRef: "MAYNILAD-202502" },
  { id: "e3", category: "Maintenance", description: "AC repair - Room 102", amount: 2500, date: "2025-02-12", paidBy: "Admin" },
  { id: "e4", category: "Supplies", description: "Cleaning supplies - February", amount: 650, date: "2025-02-15", paidBy: "Staff" },
  { id: "e5", category: "Salary", description: "Caretaker salary - February 2025", amount: 8000, date: "2025-02-28", paidBy: "Admin" },
];

export const mockAnnouncements: Announcement[] = [
  { id: "an1", title: "WiFi Password Update", message: "The WiFi password has been updated. Please see the caretaker for the new password.", priority: "Normal", createdAt: "2025-02-20" },
  { id: "an2", title: "Water Interruption Notice", message: "There will be a scheduled water interruption on March 5, 2025 from 8AM to 5PM for maintenance. Please prepare accordingly.", priority: "Important", createdAt: "2025-02-25" },
  { id: "an3", title: "Monthly Rent Due", message: "Monthly rent for March 2025 is due on March 15. Please pay on time to avoid late fees.", priority: "Urgent", createdAt: "2025-03-01" },
];

export const getBoarderName = (boarderId: string): string => {
  return mockBoarders.find(b => b.id === boarderId)?.fullName ?? "Unknown";
};

export const getRoomName = (roomId: string): string => {
  return mockRooms.find(r => r.id === roomId)?.name ?? "Unknown";
};

export const getBedName = (bedId: string): string => {
  for (const room of mockRooms) {
    const bed = room.beds.find(b => b.id === bedId);
    if (bed) return bed.name;
  }
  return "Unknown";
};
