import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Room, Boarder, Payment, AuditLog, BhSettings, MaintenanceRequest, Expense, Announcement, User } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
    name: "BoardHub Residences",
    address: "123 Mabini St, Santa Cruz, Manila, Philippines",
    contact: "+63 912 345 6789",
    email: "admin@boardhub.com",
    ownerName: "Administrator",
    currency: "PHP",
    lateFeeEnabled: true,
    lateFeeAmount: 200,
    gracePeriodDays: 5,
};

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
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = useCallback(async () => {
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userData.user.id)
                    .single();

                if (profile) {
                    setUser({
                        id: profile.id,
                        username: profile.username,
                        fullName: profile.full_name,
                        role: profile.role,
                        boarderId: profile.boarder_id
                    });
                }
            }

            const [
                { data: roomsData },
                { data: boardersData },
                { data: paymentsData },
                { data: logsData },
                { data: settingsData },
                { data: maintenanceData },
                { data: expensesData },
                { data: announcementsData }
            ] = await Promise.all([
                supabase.from('rooms').select('*, beds(*)'),
                supabase.from('boarders').select('*'),
                supabase.from('payments').select('*'),
                supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }),
                supabase.from('settings').select('*').eq('id', 1).single(),
                supabase.from('maintenance_requests').select('*'),
                supabase.from('expenses').select('*'),
                supabase.from('announcements').select('*')
            ]);

            if (roomsData) setRooms(roomsData.map(r => ({
                ...r,
                monthlyRate: parseFloat(r.monthly_rate),
                createdAt: r.created_at,
                updatedAt: r.updated_at
            })));

            if (boardersData) setBoarders(boardersData.map(b => ({
                ...b,
                fullName: b.full_name,
                contactNumber: b.contact_number,
                emergencyContact: b.emergency_contact,
                assignedRoomId: b.assigned_room_id,
                assignedBedId: b.assigned_bed_id,
                moveInDate: b.move_in_date,
                moveOutDate: b.move_out_date,
                advanceAmount: parseFloat(b.advance_amount),
                depositAmount: parseFloat(b.deposit_amount),
                profilePhoto: b.profile_photo,
                createdAt: b.created_at
            })));

            if (paymentsData) setPayments(paymentsData.map(p => ({
                ...p,
                boarderId: p.boarder_id,
                paidDate: p.paid_date,
                dueDate: p.due_date,
                lateFee: parseFloat(p.late_fee),
                receiptNumber: p.receipt_number,
                createdAt: p.created_at
            })));

            if (logsData) setAuditLogs(logsData.map(l => ({
                ...l,
                entityId: l.entity_id,
                performedBy: l.performed_by
            })));

            if (settingsData) setSettings({
                ...settingsData,
                ownerName: settingsData.owner_name,
                lateFeeEnabled: settingsData.late_fee_enabled,
                lateFeeAmount: parseFloat(settingsData.late_fee_amount),
                gracePeriodDays: settingsData.grace_period_days
            });

            if (maintenanceData) setMaintenance(maintenanceData.map(m => ({
                ...m,
                roomId: m.room_id,
                boarderId: m.boarder_id,
                createdAt: m.created_at,
                resolvedAt: m.resolved_at
            })));

            if (expensesData) setExpenses(expensesData.map(e => ({
                ...e,
                paidBy: e.paid_by,
                receiptRef: e.receipt_ref
            })));

            if (announcementsData) setAnnouncements(announcementsData.map(a => ({
                ...a,
                createdAt: a.created_at,
                expiresAt: a.expires_at
            })));

        } catch (err) {
            console.error("Error loading Supabase data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const login = async (username: string, password: string): Promise<boolean> => {
        // For now, we'll keep the mock logic but link it to the profiles table
        // In a real app, you'd use supabase.auth.signInWithPassword
        // Since we don't have Auth users yet, let's just find in profiles
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !profile) {
            // Temporary: fall back to mock if profiles table is empty for easy testing
            const MOCK_USERS = [
                { id: "u1", username: "admin", fullName: "House Admin", role: "Admin" },
                { id: "u2", username: "staff", fullName: "Care Taker", role: "Staff" },
                { id: "u3", username: "boarder", fullName: "Juan Dela Cruz", role: "Boarder", boarderId: "bo1" },
            ];
            const foundMock = MOCK_USERS.find(u => u.username === username && password === username);
            if (foundMock) {
                setUser(foundMock as any);
                localStorage.setItem("bh_user", JSON.stringify(foundMock));
                return true;
            }
            return false;
        }

        // Check simple password (password = username for now)
        if (password === username) {
            const u = {
                id: profile.id,
                username: profile.username,
                fullName: profile.full_name,
                role: profile.role,
                boarderId: profile.boarder_id
            };
            setUser(u as any);
            localStorage.setItem("bh_user", JSON.stringify(u));
            return true;
        }
        return false;
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem("bh_user");
        await supabase.auth.signOut();
    };

    const addLog = async (action: string, entity: string, entityId: string, details: string) => {
        const logData = {
            action,
            entity,
            entity_id: entityId,
            details,
            performed_by: user?.fullName || "System"
        };
        const { error } = await supabase.from('audit_logs').insert([logData]);
        if (!error) refreshData();
    };

    const addRoom = async (room: Room) => {
        const { error } = await supabase.from('rooms').insert([{
            name: room.name,
            capacity: room.capacity,
            monthly_rate: room.monthlyRate,
            status: room.status,
            floor: room.floor,
            amenities: room.amenities,
            description: room.description
        }]);
        if (error) toast.error("Failed to add room");
        else {
            toast.success("Room added successfully");
            addLog("Room Added", "Room", room.id, `Room ${room.name} was added.`);
            refreshData();
        }
    };

    const updateRoom = async (room: Room) => {
        const { error } = await supabase.from('rooms').update({
            name: room.name,
            capacity: room.capacity,
            monthly_rate: room.monthlyRate,
            status: room.status,
            floor: room.floor,
            amenities: room.amenities,
            description: room.description
        }).eq('id', room.id);
        if (error) toast.error("Failed to update room");
        else {
            toast.success("Room updated");
            addLog("Room Updated", "Room", room.id, `Room ${room.name} details were updated.`);
            refreshData();
        }
    };

    const deleteRoom = async (id: string) => {
        const { error } = await supabase.from('rooms').delete().eq('id', id);
        if (error) toast.error("Failed to delete room");
        else {
            toast.success("Room deleted");
            addLog("Room Deleted", "Room", id, `Room was removed.`);
            refreshData();
        }
    };

    const addBoarder = async (boarder: Boarder) => {
        const { error } = await supabase.from('boarders').insert([{
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
            occupation: boarder.occupation
        }]);
        if (error) toast.error("Failed to add boarder");
        else {
            toast.success("Boarder added");
            refreshData();
        }
    };

    const updateBoarder = async (boarder: Boarder) => {
        const { error } = await supabase.from('boarders').update({
            full_name: boarder.fullName,
            contact_number: boarder.contactNumber,
            email: boarder.email,
            address: boarder.address,
            emergency_contact: boarder.emergencyContact,
            assigned_room_id: boarder.assignedRoomId,
            assigned_bed_id: boarder.assignedBedId,
            status: boarder.status,
            occupation: boarder.occupation
        }).eq('id', boarder.id);
        if (error) toast.error("Failed to update boarder");
        else {
            toast.success("Boarder updated");
            refreshData();
        }
    };

    const deleteBoarder = async (id: string) => {
        const { error } = await supabase.from('boarders').delete().eq('id', id);
        if (error) toast.error("Failed to remove boarder");
        else {
            toast.success("Boarder removed");
            refreshData();
        }
    };

    const addPayment = async (payment: Payment) => {
        const { error } = await supabase.from('payments').insert([{
            boarder_id: payment.boarderId,
            type: payment.type,
            amount: payment.amount,
            month: payment.month,
            due_date: payment.dueDate,
            status: payment.status,
            method: payment.method,
            notes: payment.notes
        }]);
        if (error) toast.error("Failed to record payment");
        else {
            toast.success("Payment recorded");
            refreshData();
        }
    };

    const updatePayment = async (payment: Payment) => {
        const { error } = await supabase.from('payments').update({
            status: payment.status,
            paid_date: payment.paidDate,
            method: payment.method,
            receipt_number: payment.receiptNumber,
            notes: payment.notes
        }).eq('id', payment.id);
        if (error) toast.error("Failed to update payment");
        else {
            toast.success("Payment updated");
            refreshData();
        }
    };

    const deletePayment = async (id: string) => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) toast.error("Failed to delete payment");
        else {
            toast.success("Payment deleted");
            refreshData();
        }
    };

    const addMaintenance = async (req: MaintenanceRequest) => {
        const { error } = await supabase.from('maintenance_requests').insert([{
            room_id: req.roomId,
            boarder_id: req.boarderId,
            title: req.title,
            description: req.description,
            priority: req.priority,
            status: req.status
        }]);
        if (error) toast.error("Failed to submit request");
        else {
            toast.success("Request submitted");
            refreshData();
        }
    };

    const updateMaintenance = async (req: MaintenanceRequest) => {
        const { error } = await supabase.from('maintenance_requests').update({
            status: req.status,
            priority: req.priority,
            resolved_at: req.status === 'Resolved' ? new Date().toISOString() : null
        }).eq('id', req.id);
        if (error) toast.error("Failed to update status");
        else {
            toast.success("Status updated");
            refreshData();
        }
    };

    const deleteMaintenance = async (id: string) => {
        await supabase.from('maintenance_requests').delete().eq('id', id);
        refreshData();
    };

    const addExpense = async (expense: Expense) => {
        const { error } = await supabase.from('expenses').insert([{
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            paid_by: expense.paidBy
        }]);
        if (error) toast.error("Failed to record expense");
        else {
            toast.success("Expense recorded");
            refreshData();
        }
    };

    const updateExpense = async (expense: Expense) => {
        await supabase.from('expenses').update({
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            paid_by: expense.paidBy
        }).eq('id', expense.id);
        refreshData();
    };

    const deleteExpense = async (id: string) => {
        await supabase.from('expenses').delete().eq('id', id);
        refreshData();
    };

    const addAnnouncement = async (ann: Announcement) => {
        await supabase.from('announcements').insert([{
            title: ann.title,
            message: ann.message,
            priority: ann.priority,
            expires_at: ann.expiresAt
        }]);
        refreshData();
    };

    const deleteAnnouncement = async (id: string) => {
        await supabase.from('announcements').delete().eq('id', id);
        refreshData();
    };

    const updateSettings = async (newSettings: BhSettings) => {
        const { error } = await supabase.from('settings').update({
            name: newSettings.name,
            address: newSettings.address,
            contact: newSettings.contact,
            email: newSettings.email,
            website: newSettings.website,
            owner_name: newSettings.ownerName,
            currency: newSettings.currency,
            late_fee_enabled: newSettings.lateFeeEnabled,
            late_fee_amount: newSettings.lateFeeAmount,
            grace_period_days: newSettings.gracePeriodDays
        }).eq('id', 1);

        if (error) toast.error("Failed to save settings");
        else {
            toast.success("Settings saved");
            refreshData();
        }
    };

    const resetData = () => {
        toast.error("Cloud data cannot be reset this way.");
    };

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
