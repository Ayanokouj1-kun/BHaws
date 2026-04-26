import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Room, Boarder, Payment, AuditLog, BhSettings, MaintenanceRequest, Expense, Announcement, User, Bed } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { generateReceiptNumber } from "@/utils/receiptGenerator";

// ── Derives the display status from actual bed occupancy + maintenance flag ──
export const computeRoomStatus = (
    beds: Bed[],
    underMaintenance: boolean
): Room["status"] => {
    if (underMaintenance) return "Under Maintenance";
    if (!beds || beds.length === 0) return "Available";
    const occupied = beds.filter(b => b.status === "Occupied").length;
    if (occupied === 0) return "Available";
    if (occupied === beds.length) return "Full";
    return "Partial";
};

interface DataContextType {
    rooms: Room[];
    boarders: Boarder[];
    payments: Payment[];
    auditLogs: AuditLog[];
    settings: BhSettings;
    maintenance: MaintenanceRequest[];
    expenses: Expense[];
    announcements: Announcement[];
    profiles: User[];
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
    addAnnouncement: (ann: Announcement) => Promise<boolean>;
    deleteAnnouncement: (id: string) => Promise<void>;
    updateSettings: (newSettings: BhSettings) => Promise<void>;
    updateUserRole: (userId: string, newRole: "Admin" | "Staff" | "Boarder") => Promise<void>;
    addUser: (profile: { username: string; fullName: string; role: UserRole; boarderId?: string; createdBy?: string }) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    updateProfile: (userId: string, data: { fullName?: string; email?: string; phone?: string; address?: string; profilePhoto?: string; emergencyContact?: string }) => Promise<void>;
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
    { id: "sa1", username: "superadmin", fullName: "Super Admin", role: "SuperAdmin" as const },
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
    const [profiles, setProfiles] = useState<User[]>([]);
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("bhaws_user_session");
        return saved ? JSON.parse(saved) : null;
    });
    // Start as FALSE so the login page shows immediately
    const [isLoading, setIsLoading] = useState(false);

    // --- BACKGROUND CLOUD SYNC ---
    const refreshData = useCallback(async () => {
        // If no user, only fetch basic info like settings or announcements if public
        // For simplicity, we fetch everything if possible but filter based on role logic
        try {
            const getAdminIdFilter = () => {
                if (!user) return null;
                // SuperAdmin and Admin each have their own isolated data silo
                if (user.role === "SuperAdmin" || user.role === "Admin") return user.id;
                // Staff/Boarders see their manager's data
                return user.createdBy || null;
            };

            const adminFilter = getAdminIdFilter();

            // Always apply a strict filter — NEVER fall back to unfiltered "see everything" queries
            const filteredSelect = async (table: string, query = "*") => {
                let q = supabase.from(table).select(query);
                if (adminFilter) {
                    q = q.eq("admin_id", adminFilter);
                } else {
                    // No valid admin context — return empty to prevent data leaks
                    return [];
                }
                const { data, error } = await q as any;
                if (error) { console.warn(`[Sync] ${table}:`, error.message); return null; }
                return data;
            };

            const [roomsRes, boardersRes, paymentsRes, logsRes, settingsRes, maintRes, expRes, annRes, profRes] =
                await Promise.all([
                    // Rooms — always filter by adminFilter
                    adminFilter
                        ? supabase.from("rooms").select("*, beds(*)").eq("admin_id", adminFilter)
                        : { data: [] },
                    // Boarders — always filter by adminFilter
                    adminFilter
                        ? supabase.from("boarders").select("*").eq("admin_id", adminFilter).order("created_at", { ascending: true })
                        : { data: [] },
                    // Payments — filter via filteredSelect
                    filteredSelect("payments"),
                    // Audit Logs — always filter by adminFilter
                    adminFilter
                        ? supabase.from("audit_logs").select("*").eq("admin_id", adminFilter).order("timestamp", { ascending: false })
                        : { data: [] },
                    // Settings — fetch by the admin's own ID
                    supabase.from("settings").select("*").eq("admin_id", adminFilter || (user?.id || "")).maybeSingle(),
                    // Maintenance & Expenses — filtered
                    filteredSelect("maintenance_requests"),
                    filteredSelect("expenses"),
                    // Announcements — show global (null admin_id) + own
                    adminFilter
                        ? supabase.from("announcements").select("*").or(`admin_id.is.null,admin_id.eq.${adminFilter}`)
                        : supabase.from("announcements").select("*").is("admin_id", null),
                    // Profiles — own profile + staff/boarders created under this admin
                    adminFilter
                        ? supabase.from("profiles").select("*").or(`id.eq.${user?.id},created_by.eq.${adminFilter}`)
                        : supabase.from("profiles").select("*").eq("id", user?.id || "")
                ]);

            if (roomsRes?.data) setRooms(roomsRes.data.map((r: any) => {
                const beds: Bed[] = (r.beds || []).map((b: any) => ({ ...b, roomId: b.room_id, boarderId: b.boarder_id }));
                const underMaintenance = !!r.under_maintenance;
                return {
                    ...r,
                    monthlyRate: parseFloat(r.monthly_rate) || 0,
                    createdAt: r.created_at,
                    updatedAt: r.updated_at,
                    underMaintenance,
                    beds,
                    status: computeRoomStatus(beds, underMaintenance),
                };
            }));

            if (boardersRes?.data) setBoarders(boardersRes.data.map((b: any) => ({
                id: b.id,
                fullName: b.full_name || "",
                contactNumber: b.contact_number || "",
                email: b.email || "",
                address: b.address || "",
                emergencyContact: b.emergency_contact || "",
                assignedRoomId: b.assigned_room_id,
                assignedBedId: b.assigned_bed_id,
                moveInDate: b.move_in_date || "",
                moveOutDate: b.move_out_date,
                advanceAmount: parseFloat(b.advance_amount) || 0,
                depositAmount: parseFloat(b.deposit_amount) || 0,
                status: b.status || "Active",
                profilePhoto: b.profile_photo,
                occupation: b.occupation,
                gender: b.gender,
                createdAt: b.created_at || "",
            })));

            if (paymentsRes) {
                const s = settingsRes?.data;
                const lateFeeEnabled = s ? s.late_fee_enabled !== false : DEFAULT_SETTINGS.lateFeeEnabled;
                const lateFeePerDay = s ? (parseFloat(s.late_fee_amount) || 0) : DEFAULT_SETTINGS.lateFeeAmount;
                const gracePeriod = s ? (parseInt(s.grace_period_days) || 0) : DEFAULT_SETTINGS.gracePeriodDays;

                setPayments(paymentsRes.map((p: any) => {
                    let status = p.status;
                    let lateFee = parseFloat(p.late_fee) || 0;

                    // Dynamically compute per-day late fee for unpaid payments past due date
                    if (status !== "Paid" && p.due_date) {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const due = new Date(p.due_date);
                        due.setHours(0,0,0,0);
                        
                        const deadline = new Date(due);
                        deadline.setDate(deadline.getDate() + (gracePeriod || 0));

                        if (today > deadline) {
                            status = "Overdue";
                            if (lateFeeEnabled && lateFeePerDay && lateFeePerDay > 0) {
                                const diffTime = Math.abs(today.getTime() - deadline.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                lateFee = diffDays * lateFeePerDay;
                            }
                        }
                    }

                    return {
                        ...p,
                        boarderId: p.boarder_id,
                        amount: parseFloat(p.amount) || 0,
                        paidDate: p.paid_date,
                        dueDate: p.due_date,
                        lateFee: lateFee,
                        status: status,
                        receiptNumber: p.receipt_number,
                        createdAt: p.created_at
                    };
                }));
            }

            if (logsRes?.data) setAuditLogs(logsRes.data.map((l: any) => ({
                ...l, entityId: l.entity_id, performedBy: l.performed_by
            })));

            if (settingsRes?.data) {
                const s = settingsRes.data;
                setSettings({
                    name: s.name || "BHaws Residences",
                    address: s.address || "",
                    contact: s.contact || "",
                    email: s.email || "",
                    ownerName: s.owner_name || "",
                    website: s.website || "",
                    taxId: s.tax_id || "",
                    currency: s.currency || "PHP",
                    lateFeeEnabled: s.late_fee_enabled !== false,
                    lateFeeAmount: parseFloat(s.late_fee_amount) || 0,
                    gracePeriodDays: s.grace_period_days || 0,
                    gcashNumber: s.gcash_number || localStorage.getItem(`bhaws_fallback_gcash_number_${adminFilter || 'global'}`) || "",
                    gcashQRCode: s.gcash_qr_code || localStorage.getItem(`bhaws_fallback_gcash_qr_${adminFilter || 'global'}`) || "",
                    adminId: s.admin_id
                });
            } else {
                // If admin has no settings record yet, use DEFAULT but link to their effective admin ID
                setSettings({ ...DEFAULT_SETTINGS, adminId: adminFilter || user?.id });
            }

            if (maintRes) setMaintenance(maintRes.map((m: any) => ({
                ...m, roomId: m.room_id, boarderId: m.boarder_id, createdAt: m.created_at, resolvedAt: m.resolved_at
            })));
            if (expRes) setExpenses(expRes.map((e: any) => ({ ...e, paidBy: e.paid_by, receiptRef: e.receipt_ref })));
            if (annRes?.data) setAnnouncements(annRes.data.map((a: any) => ({ ...a, createdAt: a.created_at, expiresAt: a.expires_at })));
            if (profRes?.data) {
                const updatedProfiles = profRes.data.map((p: any) => {
                    let role = p.role;
                    if (p.username === "superadmin") role = "SuperAdmin";
                    if (p.username === "admin") role = "Admin";
                    if (p.username === "staff") role = "Staff";

                    // Fallback to boarder photo if profile photo is missing
                    let photo = p.profile_photo;
                    if (!photo && p.boarder_id) {
                        const b = boardersRes?.data?.find((b: any) => b.id === p.boarder_id);
                        if (b) photo = b.profile_photo;
                    }

                    return {
                        ...p,
                        role,
                        fullName: p.full_name,
                        boarderId: p.boarder_id,
                        email: p.email,
                        phone: p.phone,
                        address: p.address,
                        profilePhoto: photo,
                        emergencyContact: p.emergency_contact,
                        createdBy: p.created_by,
                    };
                });
                setProfiles(updatedProfiles);

                // Sync the current 'user' object if they are in this list
                if (user) {
                    const myUpdatedProfile = updatedProfiles.find(p => p.id === user.id);
                    if (myUpdatedProfile) {
                        setUser(prev => {
                            if (!prev) return null;
                            // Only update if something actually changed to avoid loop
                            if (prev.fullName !== myUpdatedProfile.fullName || 
                                prev.profilePhoto !== myUpdatedProfile.profilePhoto ||
                                prev.role !== myUpdatedProfile.role) {
                                return { ...prev, ...myUpdatedProfile };
                            }
                            return prev;
                        });
                    }
                }
            }

            console.log("✅ BHaws: Cloud sync complete.");
        } catch (err) {
            console.error("Cloud sync error:", err);
        }
    }, [user]);

    // Kick off cloud sync in background after mount
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // ── Supabase Realtime subscriptions (all users stay in sync) ─────────────
    useEffect(() => {
        const channel = supabase
            .channel("bhaws-realtime")
            // Announcements — notify all users on INSERT
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, (payload) => {
                const a = payload.new as any;
                const ann = { ...a, createdAt: a.created_at, expiresAt: a.expires_at };

                setAnnouncements(prev => {
                    if (prev.find(x => x.id === ann.id)) return prev;
                    return [ann, ...prev];
                });

                // Check if this was created by ME (using local storage tracking)
                const myPosts = JSON.parse(localStorage.getItem("bhaws_my_recent_announcements") || "[]");
                if (myPosts.includes(a.id)) return;

                // Show live toast for all OTHER users
                toast.info(`📢 New Announcement: ${a.title}`, {
                    description: a.message,
                    duration: 6000,
                });
            })
            .on("postgres_changes", { event: "DELETE", schema: "public", table: "announcements" }, (payload) => {
                setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "announcements" }, () => {
                refreshData();
            })
            // Payments — refresh on any change
            .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
                refreshData();
            })
            // Maintenance — refresh on any change
            .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_requests" }, () => {
                refreshData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshData]);

    // --- LOGIN ---
    const login = async (username: string, password: string): Promise<boolean> => {
        const lc = username.toLowerCase().trim();

        // 1. Try Supabase profiles table (preferred path for Admin/Staff/Boarder)
        try {
            const { data: profile, error } = await supabase
                .from("profiles").select("*").eq("username", lc).single();
            if (!error && profile && password === lc) {
                let effectiveRole = profile.role || "Boarder";
                if (profile.username === "superadmin") effectiveRole = "SuperAdmin";
                if (profile.username === "admin") effectiveRole = "Admin";
                if (profile.username === "staff") effectiveRole = "Staff";

                // If this is a Boarder profile, ensure it's linked to an active boarder
                if (effectiveRole === "Boarder") {
                    if (!profile.boarder_id) return false;
                    const { data: boarder } = await supabase
                        .from("boarders")
                        .select("status")
                        .eq("id", profile.boarder_id)
                        .single();
                    if (!boarder || boarder.status !== "Active") return false;
                }

                const u = {
                    id: profile.id, username: profile.username,
                    fullName: profile.full_name, role: effectiveRole, boarderId: profile.boarder_id,
                    email: profile.email, phone: profile.phone, address: profile.address,
                    profilePhoto: profile.profile_photo, emergencyContact: profile.emergency_contact,
                    createdBy: profile.created_by,
                };
                setUser(u as any);
                localStorage.setItem("bhaws_user_session", JSON.stringify(u));
                refreshData();
                return true;
            }
        } catch (e) {
            console.warn("Profile lookup failed:", e);
        }

        // 2. Fallback: built-in mock users (only when no profile exists)
        const mock = MOCK_USERS.find(u => u.username === lc && password === lc);
        if (mock) {
            setUser(mock as any);
            localStorage.setItem("bhaws_user_session", JSON.stringify(mock));
            refreshData();
            return true;
        }

        return false;
    };

    // --- LOGOUT ---
    const logout = async () => {
        setUser(null);
        localStorage.removeItem("bhaws_user_session");
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
    };

    // --- AUDIT LOG ---
    const addLog = async (action: string, entity: string, entityId: string, details: string) => {
        try {
            const adminId = user?.role === "SuperAdmin" ? user.id : (user?.role === "Admin" ? user.id : user?.createdBy);
            await supabase.from("audit_logs").insert([{
                action, entity, entity_id: entityId, details, 
                performed_by: user?.fullName || "System",
                admin_id: adminId
            }]);
            refreshData();
        } catch { /* non-blocking */ }
    };

    const addRoom = async (room: Room) => {
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        
        const adminId = room.adminId || user?.id;
        const underMaintenance = !!room.underMaintenance;
        const initialStatus = underMaintenance ? "Under Maintenance" : "Available";

        const { data: newRoom, error } = await supabase.from("rooms").insert([{
            name: room.name, capacity: room.capacity, monthly_rate: room.monthlyRate,
            status: initialStatus, under_maintenance: underMaintenance,
            floor: room.floor, amenities: room.amenities, description: room.description,
            admin_id: adminId
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
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        
        const underMaintenance = !!room.underMaintenance;
        const newStatus = computeRoomStatus(room.beds || [], underMaintenance);

        const { error } = await supabase.from("rooms").update({
            name: room.name, capacity: room.capacity, monthly_rate: room.monthlyRate,
            status: newStatus,
            under_maintenance: underMaintenance,
            floor: room.floor, amenities: room.amenities, description: room.description
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
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        const { error } = await supabase.from("rooms").delete().eq("id", id);
        if (error) toast.error("Failed to delete room");
        else { toast.success("Room deleted"); addLog("Room Deleted", "Room", id, "Room removed."); refreshData(); }
    };

    // --- BOARDERS ---
    const addBoarder = async (boarder: Boarder) => {
        if (user?.role === "Boarder") { toast.error("Unauthorized"); return; }
        const adminId = boarder.adminId || user?.id;
        
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
            admin_id: adminId
        }]).select().single();

        if (error) { toast.error("Failed to add boarder: " + error.message); return; }
        if (boarder.assignedBedId) {
            await supabase.from("beds").update({ boarder_id: nb.id, status: "Occupied" }).eq("id", boarder.assignedBedId);
        }
        toast.success("Boarder added");
        const assignedRoom = rooms.find(r => r.id === boarder.assignedRoomId);
        const roomRate = assignedRoom?.monthlyRate || 0;

        // 1. Create Monthly Rent payment for the move-in month
        // We consider the deposit amount as the primary source for the first month's rent
        if (boarder.depositAmount > 0) {
            const moveInMonth = new Date(boarder.moveInDate).toLocaleString("default", { month: "long", year: "numeric" });
            const rentAmount = Math.min(boarder.depositAmount, roomRate);
            
            const { error: p1Error } = await supabase.from("payments").insert([{
                boarder_id: nb.id,
                type: "Monthly Rent",
                amount: rentAmount,
                month: moveInMonth,
                date: boarder.moveInDate,
                dueDate: boarder.moveInDate,
                paid_date: boarder.moveInDate,
                status: "Paid", // Registration fees are collected upfront
                method: "Cash",
                notes: `Initial monthly rent settled during registration for ${moveInMonth}`,
                receipt_number: generateReceiptNumber(),
                admin_id: adminId
            }]);
            
            if (p1Error) console.error("Monthly Rent auto-insert failed:", p1Error);
            
            // 2. Create Security Deposit for the remainder
            // In boarding house terms, the excess is usually the security deposit
            const remainder = boarder.depositAmount - rentAmount;
            if (remainder > 0) {
                const { error: p2Error } = await supabase.from("payments").insert([{
                    boarder_id: nb.id,
                    type: "Security Deposit",
                    amount: remainder,
                    date: boarder.moveInDate,
                    paid_date: boarder.moveInDate,
                    status: "Paid",
                    method: "Cash",
                    notes: "Security deposit settled during registration",
                    receipt_number: generateReceiptNumber(),
                    admin_id: adminId
                }]);
                if (p2Error) console.error("Security Deposit auto-insert failed:", p2Error);
            }
        }

        // If there's a separate advanceAmount explicitly provided in the boarder record, 
        // we could also create an Advance record, but usually depositAmount contains the total.
        // However, looking at BoardersPage, advanceAmount is the "excess".
        // In my logic above, the excess is labeled as "Security Deposit".

        addLog("Boarder Registered", "Boarder", nb.id, `${boarder.fullName} registered. Monthly Rent and Initial Fees recorded to history.`);
        
        // Wait a bit for Supabase to propagate before refreshing to ensure state consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshData();
        return { ...boarder, id: nb.id };
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
        
        // Sync to Profile if exists
        await supabase.from("profiles").update({
            full_name: boarder.fullName,
            profile_photo: boarder.profilePhoto,
            email: boarder.email,
            phone: boarder.contactNumber,
            address: boarder.address,
            emergency_contact: boarder.emergencyContact
        }).eq("boarder_id", boarder.id);

        if (old && old.assigned_bed_id !== boarder.assignedBedId) {
            if (old.assigned_bed_id) await supabase.from("beds").update({ boarder_id: null, status: "Available" }).eq("id", old.assigned_bed_id);
            if (boarder.assignedBedId) await supabase.from("beds").update({ boarder_id: boarder.id, status: "Occupied" }).eq("id", boarder.assignedBedId);
        }
        toast.success("Boarder updated");
        addLog("Boarder Updated", "Boarder", boarder.id, `Profile for ${boarder.fullName} was updated.`);
        refreshData();
    };


    const deleteBoarder = async (id: string) => {
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
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
        const adminId = payment.adminId || user?.id;
        const { error } = await supabase.from("payments").insert([{
            boarder_id: payment.boarderId, type: payment.type, amount: payment.amount,
            month: payment.month, due_date: payment.dueDate, status: payment.status,
            method: payment.method, notes: payment.notes, late_fee: payment.lateFee,
            receipt_number: payment.receiptNumber || generateReceiptNumber(),
            admin_id: adminId
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
            boarder_id: payment.boarderId, type: payment.type, amount: payment.amount,
            month: payment.month, due_date: payment.dueDate, status: payment.status,
            paid_date: payment.paidDate, method: payment.method, late_fee: payment.lateFee,
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
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
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
        const adminId = req.adminId || user?.id;
        const { error } = await supabase.from("maintenance_requests").insert([{
            room_id: req.roomId, boarder_id: req.boarderId, title: req.title,
            description: req.description, priority: req.priority, status: req.status,
            category: req.category, images: req.images,
            admin_id: adminId
        }]);
        if (error) {
            console.error("Supabase Maintenance Insert Error:", error);
            toast.error("Failed to submit request to database");
        } else {
            toast.success("Request submitted");
            addLog("Maintenance Requested", "Maintenance", req.roomId, `New request: ${req.title}`);
            refreshData();
        }
    };

    const updateMaintenance = async (req: MaintenanceRequest) => {
        const { error } = await supabase.from("maintenance_requests").update({
            title: req.title,
            description: req.description,
            category: req.category,
            priority: req.priority,
            status: req.status,
            images: req.images,
            resolved_at: req.status === "Resolved" ? new Date().toISOString() : req.resolvedAt
        }).eq("id", req.id);
        if (error) {
            console.error("Supabase Maintenance Update Error:", error);
            toast.error("Failed to update status in database");
        } else {
            toast.success("Request updated");
            addLog("Maintenance Updated", "Maintenance", req.id, `Request status changed to ${req.status}.`);
            refreshData();
        }
    };

    const deleteMaintenance = async (id: string) => {
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        await supabase.from("maintenance_requests").delete().eq("id", id);
        refreshData();
    };

    // --- EXPENSES ---
    const addExpense = async (expense: Expense) => {
        const adminId = expense.adminId || user?.id;
        const { error } = await supabase.from("expenses").insert([{
            category: expense.category, description: expense.description,
            amount: expense.amount, date: expense.date, paid_by: expense.paidBy,
            receipt_ref: expense.receiptRef || null,
            admin_id: adminId
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
            amount: expense.amount, date: expense.date, paid_by: expense.paidBy,
            receipt_ref: expense.receiptRef || null
        }).eq("id", expense.id);
        refreshData();
    };

    const deleteExpense = async (id: string) => {
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        await supabase.from("expenses").delete().eq("id", id);
        refreshData();
    };

    // --- ANNOUNCEMENTS ---
    const addAnnouncement = async (ann: Announcement): Promise<boolean> => {
        if (user?.role === "Boarder") { toast.error("Unauthorized"); return false; }
        const adminId = ann.adminId || (user?.role === "SuperAdmin" ? null : (user?.role === "Admin" ? user.id : user?.createdBy));
        const { data, error } = await supabase.from("announcements").insert([{
            title: ann.title,
            message: ann.message,
            priority: ann.priority,
            expires_at: ann.expiresAt,
            admin_id: adminId
        }]).select();

        if (error) {
            console.error("Supabase Announcement Error:", error);
            toast.error(`Error: ${error.message}`);
            return false;
        }

        // Save ID locally so we know we created it (to exempt ourselves from badges/toasts)
        if (data && data[0]) {
            try {
                const myPosts = JSON.parse(localStorage.getItem("bhaws_my_recent_announcements") || "[]");
                myPosts.push(data[0].id);
                localStorage.setItem("bhaws_my_recent_announcements", JSON.stringify(myPosts.slice(-20))); // Keep last 20
            } catch (e) { console.error("Filter Save Error:", e); }
        }

        addLog("Announcement Posted", "Announcement", ann.id, `New announcement: ${ann.title}`);
        refreshData();
        return true;
    };

    const deleteAnnouncement = async (id: string) => {
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (!error) addLog("Announcement Deleted", "Announcement", id, `Announcement was removed.`);
        refreshData();
    };

    // --- SETTINGS ---
    const updateSettings = async (newSettings: BhSettings) => {
        const canWrite = user?.role === "SuperAdmin" || user?.role === "Admin";
        if (!canWrite) { toast.error("Unauthorized"); return; }
        try {
            setIsLoading(true);
            const updatePayload: any = {
                name: newSettings.name,
                address: newSettings.address,
                contact: newSettings.contact,
                email: newSettings.email,
                website: newSettings.website,
                owner_name: newSettings.ownerName,
                tax_id: newSettings.taxId,
                currency: newSettings.currency,
                late_fee_enabled: newSettings.lateFeeEnabled,
                late_fee_amount: newSettings.lateFeeAmount,
                grace_period_days: newSettings.gracePeriodDays,
                gcash_number: newSettings.gcashNumber,
                gcash_qr_code: newSettings.gcashQRCode
            };

            const adminId = (user?.role === "Admin" || user?.role === "SuperAdmin") ? user.id : user?.createdBy;
            if (!adminId) throw new Error("No administrator ID found for settings.");

            // 1. Find existing settings for this specific admin
            const { data: existing } = await supabase
                .from("settings")
                .select("id")
                .eq("admin_id", adminId)
                .maybeSingle();

            if (existing) {
                // 2. Perform a direct UPDATE by Primary Key ID
                const { error: upError } = await supabase
                    .from("settings")
                    .update(updatePayload)
                    .eq("id", existing.id);
                
                if (upError) throw upError;
            } else {
                // 3. Try to INSERT new row
                const { error: inError } = await supabase
                    .from("settings")
                    .insert({ ...updatePayload, admin_id: adminId });
                
                if (inError) {
                    // Critical catch: Table is still in "Single Row" mode
                    if (inError.message?.includes("settings_pkey") || inError.message?.includes("id = 1")) {
                        toast.error("Database Error: Duplicate Settings ID. Please run the FIX_SETTINGS_ERROR.sql script in Supabase to enable multiple admins.");
                        setIsLoading(false);
                        return;
                    }
                    throw inError;
                }
            }

            toast.success("Settings saved successfully");
            addLog("Settings Updated", "Settings", adminId, "Administrator settings were updated.");
            await refreshData();
        } catch (error: any) {
            console.error("Error updating settings:", error);
            toast.error(error.message || "Failed to save settings");
        } finally {
            setIsLoading(false);
        }
    };
    const updateUserRole = async (userId: string, newRole: UserRole) => {
        const isSuper = user?.role === "SuperAdmin";
        const isAdmin = user?.role === "Admin";
        if (!isSuper && !isAdmin) { toast.error("Unauthorized"); return; }
        
        const target = profiles.find(p => p.id === userId);
        if (target && (target.username === "superadmin" || target.username === "admin" || target.username === "staff")) {
            toast.error("Cannot change role of protected system accounts.");
            return;
        }
        
        if (isAdmin && (newRole === "SuperAdmin" || newRole === "Admin")) {
             toast.error("Admins cannot promote users to Admin or SuperAdmin.");
             return;
        }

        const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
        if (error) { toast.error("Failed to update user role"); return; }
        toast.success(`User role updated to ${newRole}`);
        addLog("User Role Updated", "User", userId, `Role changed to ${newRole}`);
        refreshData();
    };

    const addUser = async (profile: { username: string; fullName: string; role: UserRole; boarderId?: string; createdBy?: string }) => {
        const isSuper = user?.role === "SuperAdmin";
        const isAdmin = user?.role === "Admin";
        if (!isSuper && !isAdmin) { toast.error("Unauthorized"); return; }
        
        if (isAdmin && (profile.role === "SuperAdmin" || profile.role === "Admin")) {
            toast.error("Admins cannot create other admins or superadmins.");
            return;
        }

        const usernameClean = profile.username.trim().toLowerCase();
        if (!usernameClean) { toast.error("Username is required"); return; }
        
        const createdBy = profile.createdBy || user?.id;
        
        const uuidv4 = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        };

        const id = (typeof crypto !== "undefined" && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : uuidv4();

        const insertData: any = {
            id,
            username: usernameClean,
            full_name: profile.fullName.trim(),
            role: profile.role,
            boarder_id: profile.boarderId || null,
            created_by: createdBy
        };

        const { data: newProfile, error } = await supabase.from("profiles").insert([insertData]).select().single();
        
        if (error) {
            if (error.code === "23505") toast.error("That username is already taken.");
            else toast.error("Failed to create account: " + error.message);
            return;
        }
        
        const finalId = newProfile.id;
        toast.success(`Account created. Login with username "${usernameClean}" (password same as username).`);
        addLog("Account Created", "User", finalId, `${profile.fullName} (${profile.role})`);
        refreshData();
        return { ...profile, id: finalId };
    };

    const deleteUser = async (userId: string) => {
        const isSuper = user?.role === "SuperAdmin";
        const isAdmin = user?.role === "Admin";
        if (!isSuper && !isAdmin) { toast.error("Unauthorized"); return; }
        
        if (userId === user?.id) { toast.error("You cannot delete your own account"); return; }
        const target = profiles.find(p => p.id === userId);
        
        if (target && target.username === "superadmin") {
            toast.error("Cannot delete the system superadmin account.");
            return;
        }

        const { error } = await supabase.from("profiles").delete().eq("id", userId);
        if (error) { toast.error("Failed to delete account"); return; }
        toast.success("Account deleted");
        addLog("Account Deleted", "User", userId, "User account removed.");
        refreshData();
    };

    const updateProfile = async (userId: string, data: { fullName?: string; email?: string; phone?: string; address?: string; profilePhoto?: string; emergencyContact?: string }) => {
        const payload: Record<string, unknown> = {};
        if (data.fullName !== undefined) {
            payload.full_name = data.fullName;
        }
        if (data.email !== undefined) payload.email = data.email;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.address !== undefined) payload.address = data.address;
        if (data.profilePhoto !== undefined) payload.profile_photo = data.profilePhoto;
        if (data.emergencyContact !== undefined) payload.emergency_contact = data.emergencyContact;
        if (Object.keys(payload).length === 0) return;
        
        let targetId = userId;
        // If using mock ID 'sa1', try to find real ID first
        if (userId === "sa1") {
            const { data: realProf } = await supabase.from("profiles").select("id").eq("username", "superadmin").maybeSingle(); // Changed from profiles
            if (realProf) targetId = realProf.id;
        }

        if (targetId === "sa1") {
             toast.error("Your account is currently in 'Mock' mode. Please register this account in the database first to enable profile updates.");
             return;
        }

        const { error } = await supabase.from("profiles").update(payload).eq("id", targetId).select(); // Changed from profiles
        
        if (error) { 
            toast.error("Failed to update profile: " + error.message); 
            return; 
        }

        // Sync to Boarder if exists
        const currentProf = profiles.find(p => p.id === targetId);
        if (currentProf?.boarderId) {
            const boarderPayload: any = {};
            if (data.fullName) boarderPayload.full_name = data.fullName;
            if (data.profilePhoto) boarderPayload.profile_photo = data.profilePhoto;
            if (data.email) boarderPayload.email = data.email;
            if (data.phone) boarderPayload.contact_number = data.phone;
            if (data.address) boarderPayload.address = data.address;
            if (data.emergencyContact) boarderPayload.emergency_contact = data.emergencyContact;

            if (Object.keys(boarderPayload).length > 0) {
                await supabase.from("boarders").update(boarderPayload).eq("id", currentProf.boarderId);
            }
        }

        toast.success("Profile updated");
        addLog("Profile Updated", "User", userId, "Personal account data updated.");
        await refreshData();
        // Keep current session user in sync so header/My Account update immediately
        if (user) {
            const next = { ...user, ...data };
            setUser(next as any);
            localStorage.setItem("bhaws_user_session", JSON.stringify(next));
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
            maintenance, expenses, announcements, profiles, user, isLoading,
            login, logout,
            addRoom, updateRoom, deleteRoom,
            addBoarder, updateBoarder, deleteBoarder,
            addPayment, updatePayment, deletePayment,
            addMaintenance, updateMaintenance, deleteMaintenance,
            addExpense, updateExpense, deleteExpense,
            addAnnouncement, deleteAnnouncement,
            updateSettings, updateUserRole, addUser, deleteUser, updateProfile, addLog, resetData, loadStats, refreshData
        }}>
            {children}
        </DataContext.Provider>
    );
};
