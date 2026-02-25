import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Room, Boarder, Payment, AuditLog, BhSettings, MaintenanceRequest, Expense, Announcement, User } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { generateReceiptNumber } from "@/utils/receiptGenerator";

interface DataContextType {
    rooms: Room[];
    boarders: Boarder[];
    payments: Payment[];
    auditLogs: AuditLog[];
    settings: BhSettings;
    maintenance: MaintenanceRequest[];
    expenses: Expense[];
    announcements: Announcement[];
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    addRoom: (room: Room) => Promise<void>;
    updateRoom: (room: Room) => Promise<void>;
    deleteRoom: (id: string) => Promise<void>;
    addBoarder: (boarder: Boarder) => Promise<void>;
    updateBoarder: (boarder: Boarder) => Promise<void>;
    deleteBoarder: (id: string) => Promise<void>;
    addPayment: (payment: Payment) => Promise<void>;
    updatePayment: (payment: Payment) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    addMaintenance: (req: MaintenanceRequest) => Promise<void>;
    updateMaintenance: (req: MaintenanceRequest) => Promise<void>;
    deleteMaintenance: (id: string) => Promise<void>;
    addExpense: (expense: Expense) => Promise<void>;
    updateExpense: (expense: Expense) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    addAnnouncement: (ann: Announcement) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    updateSettings: (newSettings: BhSettings) => Promise<void>;
    addLog: (action: string, entity: string, entityId: string, details: string) => Promise<void>;
    resetData: () => void;
    loadStats: () => any;
    refreshData: () => Promise<void>;
}

const DEFAULT_SETTINGS: BhSettings = {
    name: "BHaws Residences",
    address: "123 Mabini St, Santa Cruz, Manila, Philippines",
    contact: "+63 912 345 6789",
    email: "admin@boardhub.com",
    ownerName: "Administrator",
    currency: "PHP",
    lateFeeEnabled: true,
    lateFeeAmount: 200,
    gracePeriodDays: 5,
};

// Built-in fallback users — always works even without Supabase
const MOCK_USERS = [
    { id: "u1", username: "admin", fullName: "House Admin", role: "Admin" as const },
    { id: "u2", username: "staff", fullName: "Care Taker", role: "Staff" as const },
    { id: "u3", username: "boarder", fullName: "Juan Dela Cruz", role: "Boarder" as const, boarderId: "bo1" },
];

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [boarders, setBoarders] = useState<Boarder[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [settings, setSettings] = useState<BhSettings>(DEFAULT_SETTINGS);
    const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [user, setUser] = useState<User | null>(null);
    // Start as FALSE so the login page shows immediately
    const [isLoading, setIsLoading] = useState(false);

    // --- SESSION RECOVERY (runs once at mount, synchronously from localStorage) ---
    useEffect(() => {
        const saved = localStorage.getItem("bh_user");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed?.id && parsed?.role) setUser(parsed);
            } catch {
                localStorage.removeItem("bh_user");
            }
        }
    }, []);

    // --- BACKGROUND CLOUD SYNC (never blocks the UI) ---
    const refreshData = useCallback(async () => {
        try {
            const safe = async (table: string, query = "*") => {
                const { data, error } = await (supabase.from(table) as any).select(query);
                if (error) { console.warn(`[Sync] ${table}:`, error.message); return null; }
                return data;
            };

            const [roomsRes, boardersRes, paymentsRes, logsRes, settingsRes, maintRes, expRes, annRes] =
                await Promise.all([
                    supabase.from("rooms").select("*, beds(*)"),
                    safe("boarders"),
                    safe("payments"),
                    supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }),
                    supabase.from("settings").select("*").eq("id", 1).single(),
                    safe("maintenance_requests"),
                    safe("expenses"),
                    safe("announcements"),
                ]);

            if (roomsRes?.data) setRooms(roomsRes.data.map((r: any) => ({
                ...r, monthlyRate: parseFloat(r.monthly_rate) || 0,
                createdAt: r.created_at, updatedAt: r.updated_at,
                beds: (r.beds || []).map((b: any) => ({ ...b, roomId: b.room_id, boarderId: b.boarder_id }))
            })));

            if (boardersRes) setBoarders(boardersRes.map((b: any) => ({
                ...b,
                fullName: b.full_name,
                contactNumber: b.contact_number,
                emergencyContact: b.emergency_contact,
                assignedRoomId: b.assigned_room_id,
                assignedBedId: b.assigned_bed_id,
                moveInDate: b.move_in_date,
                moveOutDate: b.move_out_date,
                advanceAmount: parseFloat(b.advance_amount) || 0,
                depositAmount: parseFloat(b.deposit_amount) || 0,
                profilePhoto: b.profile_photo,
                occupation: b.occupation,
                gender: b.gender,
                createdAt: b.created_at,
            })));

            if (paymentsRes) setPayments(paymentsRes.map((p: any) => ({
                ...p, boarderId: p.boarder_id, paidDate: p.paid_date, dueDate: p.due_date,
                lateFee: parseFloat(p.late_fee) || 0, receiptNumber: p.receipt_number, createdAt: p.created_at
            })));

            if (logsRes?.data) setAuditLogs(logsRes.data.map((l: any) => ({
                ...l, entityId: l.entity_id, performedBy: l.performed_by
            })));

            if (settingsRes?.data) {
                const s = settingsRes.data;
                setSettings({
                    ...s, ownerName: s.owner_name, lateFeeEnabled: s.late_fee_enabled,
                    lateFeeAmount: parseFloat(s.late_fee_amount) || 0, gracePeriodDays: s.grace_period_days || 0
                });
            }

            if (maintRes) setMaintenance(maintRes.map((m: any) => ({
                ...m, roomId: m.room_id, boarderId: m.boarder_id, createdAt: m.created_at, resolvedAt: m.resolved_at
            })));
            if (expRes) setExpenses(expRes.map((e: any) => ({ ...e, paidBy: e.paid_by, receiptRef: e.receipt_ref })));
            if (annRes) setAnnouncements(annRes.map((a: any) => ({ ...a, createdAt: a.created_at, expiresAt: a.expires_at })));

            console.log("✅ BHaws: Cloud sync complete.");
        } catch (err) {
            console.error("Cloud sync error:", err);
        }
    }, []);

    // Kick off cloud sync in background after mount
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // --- LOGIN ---
    const login = async (username: string, password: string): Promise<boolean> => {
        const lc = username.toLowerCase().trim();

        // 1. Always try the built-in mock users first for reliability
        const mock = MOCK_USERS.find(u => u.username === lc && password === lc);
        if (mock) {
            setUser(mock as any);
            localStorage.setItem("bh_user", JSON.stringify(mock));
            // Trigger background sync after login
            refreshData();
            return true;
        }

        // 2. Try Supabase profiles table
        try {
            const { data: profile, error } = await supabase
                .from("profiles").select("*").eq("username", lc).single();
            if (!error && profile && password === lc) {
                // If this is a boarder account, require linked boarder to be Active
                if (profile.role === "Boarder" && profile.boarder_id) {
                    const { data: boarder } = await supabase
                        .from("boarders")
                        .select("status")
                        .eq("id", profile.boarder_id)
                        .single();
                    if (!boarder || boarder.status !== "Active") {
                        return false;
                    }
                }

                const u = {
                    id: profile.id, username: profile.username,
                    fullName: profile.full_name, role: profile.role, boarderId: profile.boarder_id
                };
                setUser(u as any);
                localStorage.setItem("bh_user", JSON.stringify(u));
                refreshData();
                return true;
            }
        } catch (e) {
            console.warn("Profile lookup failed, mock used as fallback:", e);
        }

        return false;
    };

    // --- LOGOUT ---
    const logout = async () => {
        setUser(null);
        localStorage.removeItem("bh_user");
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
    };

    // --- AUDIT LOG ---
    const addLog = async (action: string, entity: string, entityId: string, details: string) => {
        try {
            await supabase.from("audit_logs").insert([{
                action, entity, entity_id: entityId, details, performed_by: user?.fullName || "System"
            }]);
            refreshData();
        } catch { /* non-blocking */ }
    };

    // --- ROOMS ---
    const addRoom = async (room: Room) => {
        const { data: newRoom, error } = await supabase.from("rooms").insert([{
            name: room.name, capacity: room.capacity, monthly_rate: room.monthlyRate,
            status: room.status, floor: room.floor, amenities: room.amenities, description: room.description
        }]).select().single();

        if (error) { toast.error("Failed to add room: " + error.message); return; }

        const beds = Array.from({ length: room.capacity }, (_, i) => ({
            room_id: newRoom.id, name: `Bed ${i + 1}`, status: "Available"
        }));
        await supabase.from("beds").insert(beds);
        toast.success("Room added successfully");
        addLog("Room Added", "Room", newRoom.id, `Room ${room.name} added.`);
        refreshData();
    };

    const updateRoom = async (room: Room) => {
        const { error } = await supabase.from("rooms").update({
            name: room.name, capacity: room.capacity, monthly_rate: room.monthlyRate,
            status: room.status, floor: room.floor, amenities: room.amenities, description: room.description
        }).eq("id", room.id);

        if (error) { toast.error("Failed to update room"); return; }

        const { data: existingBeds } = await supabase.from("beds").select("*").eq("room_id", room.id);
        const currentCount = existingBeds?.length || 0;
        if (room.capacity > currentCount) {
            const newBeds = Array.from({ length: room.capacity - currentCount }, (_, i) => ({
                room_id: room.id, name: `Bed ${currentCount + i + 1}`, status: "Available"
            }));
            await supabase.from("beds").insert(newBeds);
        } else if (room.capacity < currentCount) {
            const toRemove = existingBeds!.slice(room.capacity).map(b => b.id);
            if (toRemove.length) await supabase.from("beds").delete().in("id", toRemove);
        }
        toast.success("Room updated");
        addLog("Room Updated", "Room", room.id, `Room ${room.name} updated.`);
        refreshData();
    };

    const deleteRoom = async (id: string) => {
        const { error } = await supabase.from("rooms").delete().eq("id", id);
        if (error) toast.error("Failed to delete room");
        else { toast.success("Room deleted"); addLog("Room Deleted", "Room", id, "Room removed."); refreshData(); }
    };

    // --- BOARDERS ---
    const addBoarder = async (boarder: Boarder) => {
        const { data: nb, error } = await supabase.from("boarders").insert([{
            full_name: boarder.fullName,
            contact_number: boarder.contactNumber,
            email: boarder.email,
            address: boarder.address,
            emergency_contact: boarder.emergencyContact,
            assigned_room_id: boarder.assignedRoomId,
            assigned_bed_id: boarder.assignedBedId,
            move_in_date: boarder.moveInDate,
            advance_amount: boarder.advanceAmount,
            deposit_amount: boarder.depositAmount,
            status: boarder.status,
            occupation: boarder.occupation,
            gender: boarder.gender,
            profile_photo: boarder.profilePhoto,
        }]).select().single();

        if (error) { toast.error("Failed to add boarder: " + error.message); return; }
        if (boarder.assignedBedId) {
            await supabase.from("beds").update({ boarder_id: nb.id, status: "Occupied" }).eq("id", boarder.assignedBedId);
        }
        toast.success("Boarder added");
        addLog("Boarder Added", "Boarder", nb.id, `${boarder.fullName} was registered and assigned to ${room?.name || 'a room'}.`);
        refreshData();
    };

    const updateBoarder = async (boarder: Boarder) => {
        const { data: old } = await supabase.from("boarders").select("assigned_bed_id").eq("id", boarder.id).single();
        const { error } = await supabase.from("boarders").update({
            full_name: boarder.fullName,
            contact_number: boarder.contactNumber,
            email: boarder.email,
            address: boarder.address,
            emergency_contact: boarder.emergencyContact,
            assigned_room_id: boarder.assignedRoomId,
            assigned_bed_id: boarder.assignedBedId,
            status: boarder.status,
            occupation: boarder.occupation,
            gender: boarder.gender,
            profile_photo: boarder.profilePhoto,
        }).eq("id", boarder.id);

        if (error) { toast.error("Failed to update boarder"); return; }
        if (old && old.assigned_bed_id !== boarder.assignedBedId) {
            if (old.assigned_bed_id) await supabase.from("beds").update({ boarder_id: null, status: "Available" }).eq("id", old.assigned_bed_id);
            if (boarder.assignedBedId) await supabase.from("beds").update({ boarder_id: boarder.id, status: "Occupied" }).eq("id", boarder.assignedBedId);
        }
        toast.success("Boarder updated");
        addLog("Boarder Updated", "Boarder", boarder.id, `Profile for ${boarder.fullName} was updated.`);
        refreshData();
    };


    const deleteBoarder = async (id: string) => {
        // 1. Find the boarder's assigned bed BEFORE deleting
        const { data: boarderData } = await supabase
            .from("boarders")
            .select("assigned_bed_id")
            .eq("id", id)
            .single();

        // 2. Delete the boarder
        const { error } = await supabase.from("boarders").delete().eq("id", id);
        if (error) { toast.error("Failed to remove boarder"); return; }

        // 3. Free up the bed so the room shows correct availability
        if (boarderData?.assigned_bed_id) {
            await supabase
                .from("beds")
                .update({ status: "Available", boarder_id: null })
                .eq("id", boarderData.assigned_bed_id);
        }

        toast.success("Boarder removed");
        addLog("Boarder Removed", "Boarder", id, `Records for boarder ID ${id} were permanently removed.`);
        refreshData();
    };


    // --- PAYMENTS ---
    const addPayment = async (payment: Payment) => {
        const { error } = await supabase.from("payments").insert([{
            boarder_id: payment.boarderId, type: payment.type, amount: payment.amount,
            month: payment.month, due_date: payment.dueDate, status: payment.status,
            method: payment.method, notes: payment.notes,
            receipt_number: payment.receiptNumber || generateReceiptNumber(),
        }]);
        if (error) toast.error("Failed to record payment");
        else {
            toast.success("Payment recorded");
            addLog("Payment Recorded", "Payment", payment.boarderId, `Recorded₱${payment.amount} ${payment.type} for ${payment.month}.`);
            refreshData();
        }
    };

    const updatePayment = async (payment: Payment) => {
        const { error } = await supabase.from("payments").update({
            status: payment.status, paid_date: payment.paidDate, method: payment.method,
            receipt_number: payment.receiptNumber, notes: payment.notes
        }).eq("id", payment.id);
        if (error) toast.error("Failed to update payment");
        else {
            toast.success("Payment updated");
            addLog("Payment Updated", "Payment", payment.id, `Payment status updated to ${payment.status}.`);
            refreshData();
        }
    };

    const deletePayment = async (id: string) => {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) toast.error("Failed to delete payment");
        else {
            toast.success("Payment deleted");
            addLog("Payment Deleted", "Payment", id, `Payment record ID ${id} was deleted.`);
            refreshData();
        }
    };

    // --- MAINTENANCE ---
    const addMaintenance = async (req: MaintenanceRequest) => {
        const { error } = await supabase.from("maintenance_requests").insert([{
            room_id: req.roomId, boarder_id: req.boarderId, title: req.title,
            description: req.description, priority: req.priority, status: req.status
        }]);
        if (error) toast.error("Failed to submit request");
        else {
            toast.success("Request submitted");
            addLog("Maintenance Requested", "Maintenance", req.roomId, `New request: ${req.title}`);
            refreshData();
        }
    };

    const updateMaintenance = async (req: MaintenanceRequest) => {
        const { error } = await supabase.from("maintenance_requests").update({
            status: req.status, priority: req.priority,
            resolved_at: req.status === "Resolved" ? new Date().toISOString() : null
        }).eq("id", req.id);
        if (error) toast.error("Failed to update status");
        else {
            toast.success("Status updated");
            addLog("Maintenance Updated", "Maintenance", req.id, `Request status changed to ${req.status}.`);
            refreshData();
        }
    };

    const deleteMaintenance = async (id: string) => {
        await supabase.from("maintenance_requests").delete().eq("id", id);
        refreshData();
    };

    // --- EXPENSES ---
    const addExpense = async (expense: Expense) => {
        const { error } = await supabase.from("expenses").insert([{
            category: expense.category, description: expense.description,
            amount: expense.amount, date: expense.date, paid_by: expense.paidBy
        }]);
        if (error) toast.error("Failed to record expense");
        else {
            toast.success("Expense recorded");
            addLog("Expense Recorded", "Expense", expense.category, `Recorded ₱${expense.amount} for ${expense.description}.`);
            refreshData();
        }
    };

    const updateExpense = async (expense: Expense) => {
        await supabase.from("expenses").update({
            category: expense.category, description: expense.description,
            amount: expense.amount, date: expense.date, paid_by: expense.paidBy
        }).eq("id", expense.id);
        refreshData();
    };

    const deleteExpense = async (id: string) => {
        await supabase.from("expenses").delete().eq("id", id);
        refreshData();
    };

    // --- ANNOUNCEMENTS ---
    const addAnnouncement = async (ann: Announcement) => {
        await supabase.from("announcements").insert([{
            title: ann.title, message: ann.message, priority: ann.priority, expires_at: ann.expiresAt
        }]);
        addLog("Announcement Posted", "Announcement", ann.id, `New announcement: ${ann.title}`);
        refreshData();
    };

    const deleteAnnouncement = async (id: string) => {
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (!error) addLog("Announcement Deleted", "Announcement", id, `Announcement was removed.`);
        refreshData();
    };

    // --- SETTINGS ---
    const updateSettings = async (newSettings: BhSettings) => {
        const { error } = await supabase.from("settings").update({
            name: newSettings.name, address: newSettings.address, contact: newSettings.contact,
            email: newSettings.email, website: (newSettings as any).website, owner_name: newSettings.ownerName,
            currency: newSettings.currency, late_fee_enabled: newSettings.lateFeeEnabled,
            late_fee_amount: newSettings.lateFeeAmount, grace_period_days: newSettings.gracePeriodDays
        }).eq("id", 1);
        if (error) toast.error("Failed to save settings");
        else {
            toast.success("Settings saved");
            addLog("Settings Updated", "Settings", "1", "System global settings were updated.");
            refreshData();
        }
    };

    // --- UTILS ---
    const resetData = () => toast.error("Cloud data cannot be reset this way.");

    const loadStats = () => {
        const totalBeds = rooms.flatMap(r => r.beds || []).length;
        const occupiedBeds = rooms.flatMap(r => r.beds || []).filter(b => b.status === "Occupied").length;
        const totalIncome = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
        const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
        const overdueCount = payments.filter(p => p.status === "Overdue").length;
        const pendingCount = payments.filter(p => p.status === "Pending").length;
        return { totalBeds, occupiedBeds, totalIncome, totalExpense, overdueCount, pendingCount };
    };

    return (
        <DataContext.Provider value={{
            rooms, boarders, payments, auditLogs, settings,
            maintenance, expenses, announcements, user, isLoading,
            login, logout,
            addRoom, updateRoom, deleteRoom,
            addBoarder, updateBoarder, deleteBoarder,
            addPayment, updatePayment, deletePayment,
            addMaintenance, updateMaintenance, deleteMaintenance,
            addExpense, updateExpense, deleteExpense,
            addAnnouncement, deleteAnnouncement,
            updateSettings, addLog, resetData, loadStats, refreshData
        }}>
            {children}
        </DataContext.Provider>
    );
};
