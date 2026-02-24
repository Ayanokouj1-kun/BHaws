import { ReactNode, useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Bell, Search, LogOut, User, ChevronDown, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { payments, maintenance, announcements, settings, user, logout } = useData();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState<string[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Build notification list from real data
  const notifications = [
    ...payments
      .filter(p => p.status === "Overdue")
      .map(p => ({ id: `pay-${p.id}`, type: "overdue", message: `Payment overdue: ${p.receiptNumber || p.id} (₱${p.amount.toLocaleString()})`, time: p.date || "" })),
    ...payments
      .filter(p => p.status === "Pending")
      .slice(0, 3)
      .map(p => ({ id: `pend-${p.id}`, type: "pending", message: `Pending payment: ₱${p.amount.toLocaleString()} for ${p.month || "—"}`, time: p.date || "" })),
    ...maintenance
      .filter(m => (m.status === "Open" || m.status === "In Progress") && m.priority === "Urgent")
      .map(m => ({ id: `maint-${m.id}`, type: "urgent", message: `Urgent maintenance: ${m.title}`, time: m.createdAt })),
    ...announcements
      .filter(a => a.priority === "Urgent" || a.priority === "Important")
      .slice(0, 2)
      .map(a => ({ id: `ann-${a.id}`, type: "announce", message: a.title, time: a.createdAt })),
  ].slice(0, 8);

  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  const notifColors: Record<string, string> = {
    overdue: "bg-destructive/10 text-destructive",
    pending: "bg-warning/10 text-warning",
    urgent: "bg-orange-500/10 text-orange-600",
    announce: "bg-accent/10 text-accent",
  };

  const notifLabels: Record<string, string> = {
    overdue: "Overdue",
    pending: "Due",
    urgent: "Urgent",
    announce: "Notice",
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    setReadNotifs(notifications.map(n => n.id));
    toast.success("All notifications marked as read");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">

            {/* Left: sidebar trigger + search */}
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search boarders, rooms, payments..."
                  className="pl-9 w-72 h-9 bg-muted/40 border-border/60 focus:bg-card"
                />
              </div>
            </div>

            {/* Right: notifications + profile */}
            <div className="flex items-center gap-1">

              {/* ── Notifications ──────────────────────────────────────── */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                      <div>
                        <p className="text-sm font-bold text-foreground">Notifications</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{unreadCount} unread</p>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-accent hover:underline">
                          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          All caught up!
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${!readNotifs.includes(n.id) ? "bg-accent/5" : ""}`}
                          >
                            <span className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${notifColors[n.type]}`}>
                              {notifLabels[n.type]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground leading-snug">{n.message}</p>
                              {n.time && <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>}
                            </div>
                            {!readNotifs.includes(n.id) && (
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 border-t border-border/60">
                      <button
                        onClick={() => { navigate("/payments"); setNotifOpen(false); }}
                        className="text-xs text-accent hover:underline w-full text-center"
                      >
                        View all payment records →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Profile ────────────────────────────────────────────── */}
              <div className="relative ml-1" ref={profileRef}>
                <button
                  onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Profile"
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold uppercase">
                    {user?.fullName.charAt(0) || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-foreground leading-none">{user?.fullName || "User"}</p>
                    <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{user?.role || "System User"}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/60">
                      <p className="text-sm font-bold text-foreground">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.username}</p>
                      <Badge variant="outline" className={`mt-1.5 text-[9px] font-bold uppercase border-opacity-20 ${user?.role === "Admin" ? "text-accent border-accent bg-accent/5" :
                          user?.role === "Staff" ? "text-success border-success bg-success/5" :
                            "text-warning border-warning bg-warning/5"
                        }`}>
                        {user?.role}
                      </Badge>
                    </div>
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          if (user?.role === "Boarder") navigate(`/boarders/${user.boarderId}`);
                          else navigate("/settings");
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="h-4 w-4 text-muted-foreground" /> {user?.role === "Boarder" ? "My Profile" : "Settings"}
                      </button>
                    </div>
                    <div className="py-1.5 border-t border-border/60">
                      <button
                        onClick={() => {
                          logout();
                          toast.info("Session ended. Goodbye!");
                          navigate("/login");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Page Content ──────────────────────────────────────────────── */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
