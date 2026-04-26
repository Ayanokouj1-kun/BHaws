import { useMemo, useEffect } from "react";
import {
  Users, Building2, PhilippinePeso, TrendingUp, TrendingDown,
  Home, CreditCard, Settings, Clock, User as UserIcon,
  Wrench, AlertCircle, AlertTriangle, CheckCircle2, Receipt, Bell, Plus,
  Download, ArrowUpRight, ArrowDownRight, Smartphone, QrCode, CreditCard as CardIcon, Copy, Loader2, Check, Maximize2
} from "lucide-react";
import { useData } from "@/hooks/useData";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  LineChart, Line, ReferenceLine,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState as useReactState } from "react";

// Month sort order
const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmt = (n: number) =>
  n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${n}`;

const Dashboard = () => {
  const { rooms, boarders, payments, auditLogs, maintenance, expenses, announcements, settings, user, isLoading } = useData();
  const navigate = useNavigate();
  const [payModalOpen, setPayModalOpen] = useReactState(false);
  const [qrZoomed, setQrZoomed] = useReactState(false);
  const [copied, setCopied] = useReactState(false);
  const [overdueWarningOpen, setOverdueWarningOpen] = useReactState(false);

  useEffect(() => {
    document.title = "BHaws Management and Monitoring System Dashboard";
    return () => {
      document.title = "BHaws Management System";
    };
  }, []);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
  const isStaff = user?.role === "Staff" || user?.role === "Admin" || user?.role === "SuperAdmin";
  const isBoarder = user?.role === "Boarder";

  // ── Boarder specific logic ──
  const myProfile = useMemo(() => isBoarder ? boarders.find(b => b.id === user?.boarderId) : null, [isBoarder, boarders, user]);
  const myRoom = useMemo(() => myProfile ? rooms.find(r => r.id === myProfile.assignedRoomId) : null, [myProfile, rooms]);
  const myBed = useMemo(() => myRoom ? myRoom.beds.find(b => b.id === myProfile?.assignedBedId) : null, [myRoom, myProfile]);
  const myPayments = useMemo(() => isBoarder ? payments.filter(p => p.boarderId === user?.boarderId).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()) : [], [isBoarder, payments, user]);
  const activeAnnouncements = useMemo(() => announcements.filter(a => !a.expiresAt || new Date(a.expiresAt) > new Date()), [announcements]);

  const myOverduePayments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return myPayments.filter(p => p.status === "Overdue" || (p.status !== "Paid" && p.dueDate && p.dueDate < todayStr));
  }, [myPayments]);
  
  const myUpcomingPayments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const in3DaysStr = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    return myPayments.filter(p => (p.status === "Pending" || p.status === "Unpaid") && p.dueDate && p.dueDate >= todayStr && p.dueDate <= in3DaysStr);
  }, [myPayments]);

  const balanceBreakdown = useMemo(() => {
    if (!isBoarder || !user?.boarderId) return { previous: 0, current: 0, total: 0, totalPaid: 0 };
    
    const currentMonthStr = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    const boarderProfile = boarders.find(b => b.id === user.boarderId);
    const room = rooms.find(r => r.id === boarderProfile?.assignedRoomId);
    const roomRate = room?.monthlyRate || 0;

    // Check if any Monthly Rent record exists for this month
    const existingMonthlyRent = myPayments.find(p => p.type === "Monthly Rent" && p.month === currentMonthStr);
    
    let currentRent = 0;
    if (existingMonthlyRent) {
      // Use existing record if not paid
      if (existingMonthlyRent.status !== "Paid") {
        currentRent = existingMonthlyRent.amount;
      }
    } else if (boarderProfile?.status === "Active") {
      // Assume they owe the room rate if no record exists yet
      currentRent = roomRate;
    }
      
    const previous = myPayments
      .filter(p => p.status !== "Paid" && (p.type !== "Monthly Rent" || p.month !== currentMonthStr))
      .reduce((sum, p) => sum + (p.amount + (p.lateFee || 0)), 0);

    const totalPaid = myPayments
      .filter(p => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAdvance = myPayments
      .filter(p => p.type?.toLowerCase().includes("advance") && p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalDeposit = myPayments
      .filter(p => p.type?.toLowerCase().includes("deposit") && p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
      
    return {
      previous,
      current: currentRent,
      total: previous + currentRent,
      totalPaid,
      totalAdvance,
      totalDeposit
    };
  }, [isBoarder, user?.boarderId, myPayments, boarders, rooms]);

  const currentMonthStr = useMemo(() => new Date().toLocaleString("default", { month: "long", year: "numeric" }), []);
  const hasPaidCurrentMonth = useMemo(() => isBoarder && myPayments.some(p => p.type === "Monthly Rent" && p.month === currentMonthStr && p.status === "Paid"), [isBoarder, myPayments, currentMonthStr]);

  // Aggressively show overdue warning
  useEffect(() => {
    if (isBoarder && myOverduePayments.length > 0) {
      setOverdueWarningOpen(true);
    }
  }, [isBoarder, myOverduePayments.length]);

  // ── Derived stats (recalculated whenever data changes) ──────────────────────
  const stats = useMemo(() => {
    const activeBoarders = boarders.filter(b => b.status === "Active").length;
    const allBeds = rooms.flatMap(r => r.beds);
    const occupiedBeds = allBeds.filter(b => b.status === "Occupied").length;
    const totalBeds = allBeds.length;
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const availableRooms = rooms.filter(r => r.status === "Available" && !r.underMaintenance).length;
    const lockedRooms = rooms.filter(r => r.underMaintenance).length;

    const paidPayments = payments.filter(p => p.status === "Paid");
    const overduePayments = payments.filter(p => p.status === "Overdue");
    const unpaidPayments = payments.filter(p => p.status === "Unpaid");
    const pendingPayments = payments.filter(p => p.status === "Pending");
    
    const todayStr = new Date().toISOString().split("T")[0];
    const in3DaysStr = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    const upcomingPayments = payments.filter(p => p.status === "Pending" && p.dueDate && p.dueDate >= todayStr && p.dueDate <= in3DaysStr);

    const totalIncome = paidPayments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netFlow = totalIncome - totalExpenses;

    const openMaintenance = maintenance.filter(m => m.status === "Open" || m.status === "In Progress").length;
    const urgentMaintenance = maintenance.filter(m => m.priority === "Urgent" && m.status !== "Resolved" && m.status !== "Closed").length;

    return {
      activeBoarders, totalBoarders: boarders.length,
      occupiedBeds, totalBeds, occupancyPct, availableRooms, lockedRooms,
      totalIncome, totalExpenses, netFlow,
      overdueCount: overduePayments.length,
      overdueTotal: overduePayments.reduce((s, p) => s + (p.amount + (p.lateFee || 0)), 0),
      upcomingDueCount: upcomingPayments.length,
      upcomingDueTotal: upcomingPayments.reduce((s, p) => s + p.amount, 0),
      pendingCount: pendingPayments.length,
      unpaidCount: unpaidPayments.length,
      paidCount: paidPayments.length,
      openMaintenance, urgentMaintenance,
    };
  }, [rooms, boarders, payments, expenses, maintenance]);

  // ── Chart data: Income vs Expenses by month (real-time from payments + expenses) ──
  const chartData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};

    payments.filter(p => p.status === "Paid" && p.month).forEach(p => {
      const short = (p.month ?? "").split(" ")[0].substring(0, 3);
      if (!map[short]) map[short] = { income: 0, expenses: 0 };
      map[short].income += p.amount;
    });

    expenses.filter(e => e.date).forEach(e => {
      const d = new Date(e.date);
      const short = d.toLocaleString("default", { month: "short" }).substring(0, 3);
      if (!map[short]) map[short] = { income: 0, expenses: 0 };
      map[short].expenses += e.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b))
      .map(([month, vals]) => ({ month, ...vals, profit: vals.income - vals.expenses }));
  }, [payments, expenses]);

  // ── Payment status breakdown for bar chart ──────────────────────────────────
  const paymentBreakdown = useMemo(() => [
    { label: "Paid", value: payments.filter(p => p.status === "Paid").length, fill: "hsl(var(--success))" },
    { label: "Pending", value: payments.filter(p => p.status === "Pending").length, fill: "hsl(var(--warning))" },
    { label: "Unpaid", value: payments.filter(p => p.status === "Unpaid").length, fill: "hsl(var(--accent))" },
    { label: "Overdue", value: payments.filter(p => p.status === "Overdue").length, fill: "hsl(var(--destructive))" },
  ], [payments]);

  // ── SMART ANALYTICS DATA ─────────────────────────────────────────────────

  // 1. Revenue Forecast — linear regression on monthly income, project 3 months ahead
  const forecastData = useMemo(() => {
    if (chartData.length < 2) return [];
    const n = chartData.length;
    const xs = chartData.map((_, i) => i);
    const ys = chartData.map(d => d.income);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const base = [...chartData.map((d, i) => ({ month: d.month, actual: d.income, forecast: Math.round(intercept + slope * i) }))];
    const extraMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const lastIdx = MONTH_ORDER.indexOf(chartData[n - 1].month);
    for (let i = 1; i <= 3; i++) {
      const nextIdx = (lastIdx + i) % 12;
      base.push({ month: extraMonths[nextIdx] + "*", actual: 0, forecast: Math.max(0, Math.round(intercept + slope * (n - 1 + i))) });
    }
    return base;
  }, [chartData]);

  // 2. Monthly occupancy trend
  const occupancyTrend = useMemo(() => {
    const map: Record<string, { active: number; inactive: number }> = {};
    boarders.forEach(b => {
      const key = b.moveInDate ? b.moveInDate.slice(0, 7) : "Unknown";
      if (!map[key]) map[key] = { active: 0, inactive: 0 };
      if (b.status === "Active") map[key].active++;
      else map[key].inactive++;
    });
    return Object.entries(map)
      .filter(([k]) => k !== "Unknown")
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, vals]) => ({ month: month.slice(5) + " '" + month.slice(2, 4), ...vals, total: vals.active + vals.inactive }));
  }, [boarders]);

  // 3. Expense category pie
  const expensePie = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
    const COLORS = ["hsl(var(--accent))","hsl(var(--warning))","hsl(var(--destructive))","hsl(var(--success))","hsl(220,70%,60%)", "hsl(280,60%,60%)"];
    return Object.entries(cats).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));
  }, [expenses]);

  // 4. Boarder payment health — per boarder: paid vs overdue ratio
  const boarderPaymentHealth = useMemo(() => {
    return boarders
      .filter(b => b.status === "Active")
      .slice(0, 8)
      .map(b => {
        const bp = payments.filter(p => p.boarderId === b.id);
        return {
          name: b.fullName.split(" ")[0],
          paid: bp.filter(p => p.status === "Paid").length,
          pending: bp.filter(p => p.status === "Pending" || p.status === "Unpaid").length,
          overdue: bp.filter(p => p.status === "Overdue").length,
        };
      })
      .filter(d => d.paid + d.pending + d.overdue > 0);
  }, [boarders, payments]);

  // 5. Maintenance resolution efficiency (radial)
  const maintenanceEfficiency = useMemo(() => {
    const total = maintenance.length;
    if (!total) return [];
    const resolved = maintenance.filter(m => m.status === "Resolved" || m.status === "Closed").length;
    const inProgress = maintenance.filter(m => m.status === "In Progress").length;
    const open = maintenance.filter(m => m.status === "Open").length;
    return [
      { name: "Resolved", value: Math.round((resolved / total) * 100), fill: "hsl(var(--success))" },
      { name: "In Progress", value: Math.round((inProgress / total) * 100), fill: "hsl(var(--warning))" },
      { name: "Open", value: Math.round((open / total) * 100), fill: "hsl(var(--destructive))" },
    ];
  }, [maintenance]);

  // AI insight generators
  const revenueInsight = useMemo(() => {
    if (forecastData.length < 4) return "Not enough data for prediction.";
    const lastActual = forecastData.filter(d => d.actual > 0).at(-1)?.actual ?? 0;
    const nextForecast = forecastData.find(d => d.month.includes("*"))?.forecast ?? 0;
    const diff = nextForecast - lastActual;
    if (diff > 0) return `📈 Revenue is trending upward. Next month is projected at ₱${nextForecast.toLocaleString()} (+₱${diff.toLocaleString()}).`;
    if (diff < 0) return `📉 Revenue may dip next month to ₱${nextForecast.toLocaleString()}. Consider following up on pending payments.`;
    return `➡️ Revenue is stable. Forecast for next month: ₱${nextForecast.toLocaleString()}.`;
  }, [forecastData]);

  const occupancyInsight = useMemo(() => {
    const rate = stats.occupancyPct;
    if (rate >= 90) return `🏠 Excellent occupancy at ${rate}%. Consider expanding capacity or raising rates.`;
    if (rate >= 70) return `✅ Healthy occupancy at ${rate}%. ${stats.totalBeds - stats.occupiedBeds} bed(s) still available.`;
    return `⚠️ Occupancy at ${rate}%. ${stats.totalBeds - stats.occupiedBeds} beds vacant — consider promotions to attract new boarders.`;
  }, [stats]);

  const overdueInsight = useMemo(() => {
    const overdueRate = payments.length > 0 ? Math.round((stats.overdueCount / payments.length) * 100) : 0;
    if (overdueRate === 0) return "✅ All payments are current. No overdue accounts detected.";
    if (overdueRate < 15) return `⚡ ${overdueRate}% overdue rate — low risk. Send reminders to ${stats.overdueCount} boarder(s).`;
    return `🚨 ${overdueRate}% overdue rate is high. ₱${stats.overdueTotal.toLocaleString()} at risk. Immediate follow-up recommended.`;
  }, [payments, stats]);

  const getLogIcon = (entity: string) => {
    switch (entity) {
      case "Boarder": return <UserIcon className="h-3.5 w-3.5" />;
      case "Room": return <Home className="h-3.5 w-3.5" />;
      case "Payment": return <CreditCard className="h-3.5 w-3.5" />;
      case "Maintenance": return <Wrench className="h-3.5 w-3.5" />;
      case "Settings": return <Settings className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getLogColor = (action: string) => {
    if (action.includes("Added") || action.includes("Recorded") || action.includes("Posted")) return "bg-success/10 text-success border-success/20";
    if (action.includes("Deleted") || action.includes("Removed") || action.includes("Overdue")) return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-accent/10 text-accent border-accent/20";
  };

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="page-header">{isBoarder ? `Welcome, ${user?.fullName}` : "BHaws Management and Monitoring System"}</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {!isBoarder && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/boarders")}>
                <Plus className="h-3.5 w-3.5" /> Add Boarder
              </Button>
              <Button size="sm" className="gap-2" onClick={() => navigate("/reports")}>
                <Download className="h-3.5 w-3.5" /> Reports
              </Button>
            </div>
          )}
        </div>

        {/* ── Top Level Critical Alerts ──────────────────────────────────── */}
        {isBoarder && myOverduePayments.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] text-destructive font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-[11px]">WARNING: You have {myOverduePayments.length} overdue payment(s) totaling ₱{balanceBreakdown.total.toLocaleString()}.</span>
            <Button size="sm" className="ml-auto bg-destructive text-white h-7 px-3 text-[10px] font-bold" onClick={() => setPayModalOpen(true)}>
              Settle Now
            </Button>
          </div>
        )}

        {isBoarder && myOverduePayments.length === 0 && !hasPaidCurrentMonth && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-[11px] text-amber-600 dark:text-amber-400 font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-[11px]">
              {myPayments.find(p => p.type === "Monthly Rent" && p.month === currentMonthStr) 
                ? `NOTICE: Your rent for ${currentMonthStr} is currently ${myPayments.find(p => p.type === "Monthly Rent" && p.month === currentMonthStr)?.status.toLowerCase()}.` 
                : `NOTICE: No payment record found for your ${currentMonthStr} rent.`}
            </span>
            <Button size="sm" className="ml-auto bg-amber-500 text-white h-7 px-3 text-[10px] font-bold" onClick={() => setPayModalOpen(true)}>
              Pay Now
            </Button>
          </div>
        )}

        {isBoarder && myOverduePayments.length === 0 && hasPaidCurrentMonth && myUpcomingPayments.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-[11px]">REMINDER: You have {myUpcomingPayments.length} upcoming bill(s). Next due in 3 days.</span>
            <Button size="sm" className="ml-auto bg-blue-500 text-white h-7 px-3 text-[10px] font-bold" onClick={() => setPayModalOpen(true)}>
              View Bill
            </Button>
          </div>
        )}

        {isBoarder ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Accommodation */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border/60 shadow-sm bg-accent/5">
                  <CardHeader className="pb-1.5 px-4 pt-3">
                    <CardTitle className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <Home className="h-3.5 w-3.5 text-accent" /> My Room
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-xl font-bold text-foreground">{myRoom?.name || "No Assignment"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{myBed?.name || "No Bed Assigned"} · Floor {myRoom?.floor || "-"}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm bg-success/5">
                  <CardHeader className="pb-1.5 px-4 pt-3">
                    <CardTitle className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Total Paid to Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-xl font-black text-success">
                      ₱{balanceBreakdown.totalPaid.toLocaleString()}
                    </p>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                      Payments recorded
                    </p>
                  </CardContent>
                </Card>

                <Card className={`border-border/60 shadow-sm ${balanceBreakdown.total > 0 ? (myOverduePayments.length > 0 ? "bg-destructive/5 border-destructive/20 ring-1 ring-destructive/10" : "bg-warning/5 border-warning/20") : "bg-success/5"}`}>
                  <CardHeader className="pb-1.5 px-4 pt-3">
                    <CardTitle className="text-[10px] font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5 uppercase tracking-wider">
                        <PhilippinePeso className={`h-3.5 w-3.5 ${balanceBreakdown.total > 0 ? (myOverduePayments.length > 0 ? "text-destructive" : "text-warning") : "text-success"}`} />
                        Outstanding Balance
                      </div>
                      {balanceBreakdown.total > 0 && (
                        <Badge variant="outline" className={`text-[7px] h-3.5 px-1 uppercase tracking-tighter ${myOverduePayments.length > 0 ? "bg-destructive text-white border-none animate-pulse" : "bg-warning/20 text-warning border-warning/30"}`}>
                          {myOverduePayments.length > 0 ? "Overdue" : "Due"}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <p className={`text-xl font-black ${balanceBreakdown.total > 0 ? (myOverduePayments.length > 0 ? "text-destructive" : "text-warning") : "text-success"}`}>
                      ₱{balanceBreakdown.total.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-border/40">
                       <span className="text-[8px] text-muted-foreground font-bold uppercase">Debt Detail</span>
                       <span className="text-[8px] font-black text-foreground">₱{balanceBreakdown.previous.toLocaleString()} Arr / ₱{balanceBreakdown.current.toLocaleString()} Cur</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm bg-accent/5">
                  <CardHeader className="pb-1.5 px-4 pt-3">
                    <CardTitle className="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                      <CreditCard className="h-3.5 w-3.5 text-accent" /> Initial Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Advance: ₱{balanceBreakdown.totalAdvance.toLocaleString()}</p>
                        <p className="text-xs font-semibold text-foreground">Deposit: ₱{balanceBreakdown.totalDeposit.toLocaleString()}</p>
                      </div>
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <CreditCard className="h-4.5 w-4.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Announcements for boarders */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-accent" /> Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeAnnouncements.length > 0 ? activeAnnouncements.map(ann => (
                    <div key={ann.id} className="p-4 rounded-xl border border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm text-foreground">{ann.title}</h3>
                        <Badge variant="outline" className={`text-[9px] uppercase ${ann.priority === "High" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-accent/10 text-accent border-accent/20"}`}>
                          {ann.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ann.message}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-3 uppercase font-bold tracking-widest">{ann.createdAt}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No new announcements at this time.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar for boarders */}
            <div className="space-y-6">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => setPayModalOpen(true)}>
                    <Smartphone className="h-4 w-4 text-blue-500" /> Pay via GCash
                  </Button>
                  <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => navigate("/payments")}>
                    <Receipt className="h-4 w-4 text-success" /> View My Payments
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Recent Payments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myPayments.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-bold">{p.month}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">{p.type}</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] ${p.status === "Paid" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                  {myPayments.length === 0 && <p className="text-[10px] text-muted-foreground text-center">No payment history.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* ── Alerts ──────────────────────────────────────────────────── */}
            {stats.urgentMaintenance > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20 text-sm text-destructive font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {stats.urgentMaintenance} urgent maintenance {stats.urgentMaintenance === 1 ? "request requires" : "requests require"} immediate attention.
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10 h-7 px-2 text-xs" onClick={() => navigate("/maintenance")}>
                  View →
                </Button>
              </div>
            )}
            {stats.overdueCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/40 shadow-sm text-sm text-destructive font-bold relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
                URGENT: {stats.overdueCount} overdue payment{stats.overdueCount > 1 ? "s" : ""} — total ₱{stats.overdueTotal.toLocaleString()} outstanding.
                <Button size="sm" variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10 h-7 px-3 text-xs border border-destructive/20 font-bold" onClick={() => navigate("/payments")}>
                  Manage →
                </Button>
              </div>
            )}
            {stats.upcomingDueCount > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 shadow-sm text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
                Due Soon: {stats.upcomingDueCount} payment(s) are due in the next 3 days (totaling ₱{stats.upcomingDueTotal.toLocaleString()}).
                <Button size="sm" variant="ghost" className="ml-auto text-amber-600 dark:text-amber-400 hover:bg-warning/20 h-7 px-3 text-xs font-bold border border-warning/20" onClick={() => navigate("/payments")}>
                  Review →
                </Button>
              </div>
            )}

            {/* ── KPI Cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Boarders */}
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/boarders")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeBoarders}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Active Boarders</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{stats.totalBoarders} total registered</p>
                </CardContent>
              </Card>

              {/* Occupancy */}
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/rooms")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-success/10 group-hover:bg-success/20 transition-colors">
                      <Building2 className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">{stats.availableRooms} Available</span>
                      {stats.lockedRooms > 0 && <span className="text-[10px] font-bold text-orange-600 bg-orange-600/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">{stats.lockedRooms} Locked</span>}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.occupancyPct}%</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Occupancy Rate</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${stats.occupancyPct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{stats.occupiedBeds}/{stats.totalBeds} beds occupied</p>
                </CardContent>
              </Card>

              {/* Total Income */}
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/payments")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <PhilippinePeso className="h-5 w-5 text-primary" />
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stats.overdueCount > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      {stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : "All clear"}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{fmt(stats.totalIncome)}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Total Collected</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{stats.paidCount} paid · {stats.pendingCount + stats.unpaidCount} pending/unpaid</p>
                </CardContent>
              </Card>

              {/* Net Cash Flow */}
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate("/expenses")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl transition-colors ${stats.netFlow >= 0 ? "bg-success/10 group-hover:bg-success/20" : "bg-destructive/10 group-hover:bg-destructive/20"}`}>
                      {stats.netFlow >= 0
                        ? <TrendingUp className="h-5 w-5 text-success" />
                        : <TrendingDown className="h-5 w-5 text-destructive" />}
                    </div>
                    {stats.netFlow >= 0
                      ? <ArrowUpRight className="h-4 w-4 text-success/60 group-hover:text-success transition-colors" />
                      : <ArrowDownRight className="h-4 w-4 text-destructive/60 group-hover:text-destructive transition-colors" />}
                  </div>
                  <p className={`text-2xl font-bold ${stats.netFlow >= 0 ? "text-success" : "text-destructive"}`}>
                    {stats.netFlow >= 0 ? "+" : ""}{fmt(stats.netFlow)}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Net Cash Flow</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Expenses: {fmt(stats.totalExpenses)}</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Charts Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Area chart — Income vs Expenses (live) */}
              <Card className="xl:col-span-2 border-border/60 shadow-sm">
                <CardHeader className="pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">Revenue Overview</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Monthly income vs expenses · updates in real-time as payments are recorded</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold text-accent border-accent/20 bg-accent/5">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {chartData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                      No payment data yet. Record a payment to see analytics.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} width={48} />
                        <Tooltip
                          cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                          contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                          formatter={(v: number, name: string) => [`₱${v.toLocaleString()}`, name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Net Profit"]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={v => v === "income" ? "Income" : v === "expenses" ? "Expenses" : "Profit"} />
                        <Area type="monotone" dataKey="income" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4 }} />
                        <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Sidebar: Payment Status + Quick Actions */}
              <div className="space-y-4">

                {/* Payment status bar chart */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-bold">Payment Status</CardTitle>
                    <p className="text-xs text-muted-foreground">{payments.length} total records</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart data={paymentBreakdown} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                          contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                          formatter={(v: number) => [v, "Records"]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {paymentBreakdown.map((entry, i) => (
                            <rect key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {paymentBreakdown.map(item => (
                        <div key={item.label} className="text-center">
                          <p className="text-base font-bold text-foreground">{item.value}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance snapshot */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold">Maintenance</CardTitle>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-accent" onClick={() => navigate("/maintenance")}>View all</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Open", value: maintenance.filter(m => m.status === "Open").length, color: "text-accent" },
                      { label: "In Progress", value: maintenance.filter(m => m.status === "In Progress").length, color: "text-warning" },
                      { label: "Resolved", value: maintenance.filter(m => m.status === "Resolved").length, color: "text-success" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Smart Analytics Section ──────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Smart Analytics & AI Insights</h2>
                  <p className="text-xs text-muted-foreground">Auto-analysed from live payment, boarder & maintenance data</p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] font-bold text-purple-600 border-purple-400/30 bg-purple-500/5">AI Powered</Badge>
              </div>

              {/* Row 1: Revenue Forecast + Occupancy Trend */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Chart 1 — Revenue Forecast */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold">Revenue Forecast</CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Actual income + 3-month AI projection</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-bold text-purple-600 border-purple-400/30 bg-purple-500/5">Predictive</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {forecastData.length < 2 ? (
                      <div className="h-44 flex items-center justify-center text-sm text-muted-foreground italic">Record more payments to enable forecasting.</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={170}>
                          <LineChart data={forecastData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={6} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} width={42} />
                            <Tooltip
                              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }}
                              formatter={(v: number, name: string) => [`₱${v.toLocaleString()}`, name === "actual" ? "Actual" : "AI Forecast"]}
                            />
                            <ReferenceLine x={forecastData.find(d => d.month.includes("*"))?.month} stroke="hsl(var(--border))" strokeDasharray="4 2" label={{ value: "Forecast", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                            <Line type="monotone" dataKey="actual" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--accent))" }} activeDot={{ r: 5 }} connectNulls={false} />
                            <Line type="monotone" dataKey="forecast" stroke="hsl(280,60%,60%)" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: "hsl(280,60%,60%)" }} activeDot={{ r: 5 }} />
                            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} formatter={v => v === "actual" ? "Actual" : "AI Forecast"} />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-2 p-2.5 rounded-lg bg-purple-500/5 border border-purple-400/20">
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 leading-relaxed">{revenueInsight}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Chart 2 — Boarder Move-In Trend */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold">Boarder Move-In Trend</CardTitle>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Monthly new vs total boarders over time</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-bold text-accent border-accent/30 bg-accent/5">Live</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {occupancyTrend.length < 2 ? (
                      <div className="h-44 flex items-center justify-center text-sm text-muted-foreground italic">Add boarders with move-in dates to see trends.</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={170}>
                          <AreaChart data={occupancyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} dy={6} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} width={24} />
                            <Tooltip
                              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                            <Area type="monotone" dataKey="active" name="Active" stroke="hsl(var(--success))" fill="url(#activeGrad)" strokeWidth={2} dot={{ r: 3 }} />
                            <Area type="monotone" dataKey="inactive" name="Inactive" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div className="mt-2 p-2.5 rounded-lg bg-success/5 border border-success/20">
                          <p className="text-[10px] text-success leading-relaxed">{occupancyInsight}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Expense Pie + Payment Health + Maintenance Efficiency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Chart 3 — Expense Breakdown Pie */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-bold">Expense Breakdown</CardTitle>
                    <p className="text-[10px] text-muted-foreground">By category · all time</p>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {expensePie.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">No expenses recorded yet.</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie data={expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                              {expensePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip
                              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }}
                              formatter={(v: number, name: string) => [`₱${v.toLocaleString()}`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1 mt-1">
                          {expensePie.slice(0, 4).map(e => (
                            <div key={e.name} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: e.fill }} />
                                <span className="text-muted-foreground">{e.name}</span>
                              </div>
                              <span className="font-bold text-foreground">₱{e.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Chart 4 — Boarder Payment Health */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-bold">Payment Health</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Per boarder — paid vs overdue</p>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {boarderPaymentHealth.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">No active boarders with payments.</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={boarderPaymentHealth} barSize={10} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={42} />
                            <Tooltip
                              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                            <Bar dataKey="paid" name="Paid" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="pending" name="Pending" stackId="a" fill="hsl(var(--warning))" />
                            <Bar dataKey="overdue" name="Overdue" stackId="a" fill="hsl(var(--destructive))" radius={[0, 3, 3, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-2 p-2 rounded-lg bg-warning/5 border border-warning/20">
                          <p className="text-[10px] text-warning leading-relaxed">{overdueInsight}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Chart 5 — Maintenance Resolution Efficiency */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-bold">Maintenance Efficiency</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Resolution rate by status</p>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {maintenanceEfficiency.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">No maintenance requests yet.</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={150}>
                          <RadialBarChart cx="50%" cy="50%" innerRadius={28} outerRadius={70} barSize={14} data={maintenanceEfficiency} startAngle={90} endAngle={-270}>
                            <RadialBar dataKey="value" cornerRadius={4} label={false} />
                            <Tooltip
                              contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11 }}
                              formatter={(v: number, name: string) => [`${v}%`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-1">
                          {maintenanceEfficiency.map(m => (
                            <div key={m.name} className="flex items-center justify-between text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: m.fill }} />
                                <span className="text-muted-foreground">{m.name}</span>
                              </div>
                              <span className="font-bold text-foreground">{m.value}%</span>
                            </div>
                          ))}
                        </div>
                        {maintenanceEfficiency[0]?.value >= 70 && (
                          <div className="mt-2 p-2 rounded-lg bg-success/5 border border-success/20">
                            <p className="text-[10px] text-success">✅ {maintenanceEfficiency[0].value}% resolution rate — great response time!</p>
                          </div>
                        )}
                        {maintenanceEfficiency[0]?.value < 70 && (
                          <div className="mt-2 p-2 rounded-lg bg-warning/5 border border-warning/20">
                            <p className="text-[10px] text-warning">⚠️ Only {maintenanceEfficiency[0].value}% resolved. {maintenance.filter(m => m.status === "Open").length} open issues need attention.</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Bottom Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Activity */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-accent" onClick={() => navigate("/audit-logs")}>View all →</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditLogs.slice(0, 6).map(log => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${getLogColor(log.action)}`}>
                        {getLogIcon(log.entity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-snug">{log.action}
                          <span className="font-normal text-muted-foreground"> · {log.entity}</span>
                        </p>
                        <p className="text-[9px] text-muted-foreground truncate">{log.details}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 shrink-0 mt-0.5">{log.timestamp.slice(0, 10)}</span>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Add Boarder", icon: <Users className="h-4 w-4" />, path: "/boarders", bg: "bg-accent/5 hover:bg-accent/10 border-accent/20 text-accent", roles: ["SuperAdmin", "Admin", "Staff"] },
                      { label: "Record Payment", icon: <CreditCard className="h-4 w-4" />, path: "/payments", bg: "bg-success/5 hover:bg-success/10 border-success/20 text-success", roles: ["SuperAdmin", "Admin", "Staff"] },
                      { label: "Add Room", icon: <Building2 className="h-4 w-4" />, path: "/rooms", bg: "bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary", roles: ["SuperAdmin", "Admin"] },
                      { label: "New Expense", icon: <Receipt className="h-4 w-4" />, path: "/expenses", bg: "bg-warning/5 hover:bg-warning/10 border-warning/20 text-warning", roles: ["SuperAdmin", "Admin", "Staff"] },
                      { label: "Maintenance", icon: <Wrench className="h-4 w-4" />, path: "/maintenance", bg: "bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 text-orange-600", roles: ["SuperAdmin", "Admin", "Staff", "Boarder"] },
                      { label: "Reports", icon: <Download className="h-4 w-4" />, path: "/reports", bg: "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-600", roles: ["SuperAdmin", "Admin", "Staff"] },
                      { label: "Audit Logs", icon: <CheckCircle2 className="h-4 w-4" />, path: "/audit-logs", bg: "bg-muted hover:bg-muted/80 border-border text-muted-foreground", roles: ["SuperAdmin", "Admin"] },
                      { label: "Settings", icon: <Settings className="h-4 w-4" />, path: "/settings", bg: "bg-muted hover:bg-muted/80 border-border text-muted-foreground", roles: ["SuperAdmin", "Admin"] },
                    ].filter(a => a.roles.includes(user?.role || "Boarder")).map(a => (
                      <button
                        key={a.label}
                        onClick={() => navigate(a.path)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${a.bg}`}
                      >
                        {a.icon} {a.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

      </div>
      {/* GCash Payment Modal — Refined Small & Informative Version */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="max-w-[320px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-card">
          <div className="p-5 space-y-5">
            {/* Minimal Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">GCash Payment</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{settings.name || "BHaws Residences"}</p>
              </div>
            </div>

            {/* QR Section */}
            <div className="bg-muted/30 rounded-2xl p-4 border border-border/40 space-y-4">
              <div
                className="aspect-square w-40 mx-auto bg-white rounded-xl shadow-inner border border-border/20 p-2 relative group cursor-zoom-in active:scale-95 transition-transform"
                onClick={() => settings.gcashQRCode && setQrZoomed(true)}
              >
                {settings.gcashQRCode ? (
                  <>
                    <img src={settings.gcashQRCode} alt="QR" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <Maximize2 className="h-5 w-5 text-blue-600" />
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/30 gap-1">
                    <QrCode className="h-8 w-8" />
                    <span className="text-[8px] font-bold uppercase">No QR</span>
                  </div>
                )}
              </div>

              {settings.gcashQRCode && (
                <p className="text-[9px] text-center text-blue-600/60 font-medium animate-pulse">Tap QR to enlarge for scanning</p>
              )}

              {/* Number Section */}
              <div className="text-center space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Account Number</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold font-mono tracking-tight text-foreground select-all">
                    {settings.gcashNumber || "09XX XXX XXXX"}
                  </span>
                  {settings.gcashNumber && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-blue-600/10 hover:text-blue-600"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.gcashNumber!);
                        setCopied(true);
                        toast.success("Number copied");
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Hint */}
            <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
              <AlertCircle className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-blue-700 font-medium">
                Save the receipt and send it to your administrator for verification.
              </p>
            </div>

            <Button
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              onClick={() => setPayModalOpen(false)}
            >
              Close
            </Button>
          </div>

          {/* Smart Zoom / Full Scan Feature */}
          {qrZoomed && (
            <div
              className="absolute inset-0 bg-white z-50 animate-in fade-in zoom-in duration-200 flex flex-col items-center justify-center p-6"
              onClick={() => setQrZoomed(false)}
            >
              <div className="w-full max-w-[280px] bg-white rounded-3xl p-4 shadow-2xl border border-border/40">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-blue-600 rounded-lg flex items-center justify-center">
                      <QrCode className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fast Scan Mode</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setQrZoomed(false)}>
                    <Plus className="h-3.5 w-3.5 rotate-45" />
                  </Button>
                </div>
                <div className="aspect-square w-full">
                  <img src={settings.gcashQRCode} alt="Zoomed QR" className="w-full h-full object-contain" />
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium italic">
                  Aim your phone camera at the screen to scan.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-6 rounded-full px-6 text-xs border-blue-200 text-blue-600"
                onClick={() => setQrZoomed(false)}
              >
                Back to Details
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Overdue Warning Modal — Refined Version */}
      <Dialog open={overdueWarningOpen} onOpenChange={setOverdueWarningOpen}>
        <DialogContent className="max-w-[360px] border-destructive/20 border shadow-2xl shadow-destructive/10 overflow-hidden sm:rounded-2xl p-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-sm font-black text-destructive uppercase tracking-widest leading-none">
                  Account Overdue
                </DialogTitle>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Payment balance requires attention</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dear <span className="font-bold text-foreground">{user?.fullName?.split(' ')[0] || "Boarder"}</span>, 
                you have <strong className="text-foreground">{myOverduePayments.length}</strong> overdue payment(s) pending settlement.
              </p>
              
              <div className="bg-destructive/[0.03] border border-destructive/10 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black uppercase text-destructive/60 tracking-widest mb-1">Total Outstanding</p>
                    <p className="text-2xl font-black text-destructive tracking-tighter">
                      ₱{balanceBreakdown.total.toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[8px] h-4 bg-destructive text-white border-none">LATE FEE ACTIVE</Badge>
                </div>
                
                <div className="pt-3 border-t border-destructive/10 space-y-1">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-muted-foreground">Previous Balance</span>
                    <span className="text-foreground">₱{balanceBreakdown.previous.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-muted-foreground">Current Rent</span>
                    <span className="text-foreground">₱{balanceBreakdown.current.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] font-medium text-destructive/70 bg-destructive/5 p-2 rounded-lg border border-destructive/10 italic text-center">
                Penalty: ₱{settings.lateFeeAmount || 200}/day is accumulating
              </p>
            </div>
            
            <div className="grid gap-2">
              <Button 
                size="lg" 
                className="w-full h-11 bg-destructive text-white hover:bg-destructive/90 font-bold text-xs uppercase tracking-widest rounded-xl"
                onClick={() => {
                  setOverdueWarningOpen(false);
                  setPayModalOpen(true);
                }}
              >
                Pay via GCash
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-9 text-[10px] text-muted-foreground hover:bg-muted rounded-xl"
                onClick={() => setOverdueWarningOpen(false)}
              >
                I will settle this later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Dashboard;
