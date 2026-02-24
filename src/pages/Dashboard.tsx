import { useMemo } from "react";
import {
  Users, Building2, DollarSign, TrendingUp, TrendingDown,
  Home, CreditCard, Settings, Clock, User as UserIcon,
  Wrench, AlertCircle, CheckCircle2, Receipt, Bell, Plus,
  Download, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useData } from "@/hooks/useData";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

// Month sort order
const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmt = (n: number) =>
  n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${n}`;

const Dashboard = () => {
  const { rooms, boarders, payments, auditLogs, maintenance, expenses, isLoading } = useData();
  const navigate = useNavigate();

  // ── Derived stats (recalculated whenever data changes) ──────────────────────
  const stats = useMemo(() => {
    const activeBoarders = boarders.filter(b => b.status === "Active").length;
    const allBeds = rooms.flatMap(r => r.beds);
    const occupiedBeds = allBeds.filter(b => b.status === "Occupied").length;
    const totalBeds = allBeds.length;
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const availableRooms = rooms.filter(r => r.status === "Available").length;

    const paidPayments = payments.filter(p => p.status === "Paid");
    const overduePayments = payments.filter(p => p.status === "Overdue");
    const pendingPayments = payments.filter(p => p.status === "Pending");

    const totalIncome = paidPayments.reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netFlow = totalIncome - totalExpenses;

    const openMaintenance = maintenance.filter(m => m.status === "Open" || m.status === "In Progress").length;
    const urgentMaintenance = maintenance.filter(m => m.priority === "Urgent" && m.status !== "Resolved" && m.status !== "Closed").length;

    return {
      activeBoarders, totalBoarders: boarders.length,
      occupiedBeds, totalBeds, occupancyPct, availableRooms,
      totalIncome, totalExpenses, netFlow,
      overdueCount: overduePayments.length,
      overdueTotal: overduePayments.reduce((s, p) => s + p.amount, 0),
      pendingCount: pendingPayments.length,
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
    { label: "Overdue", value: payments.filter(p => p.status === "Overdue").length, fill: "hsl(var(--destructive))" },
  ], [payments]);

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
            <h1 className="page-header">Dashboard</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/boarders")}>
              <Plus className="h-3.5 w-3.5" /> Add Boarder
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate("/reports")}>
              <Download className="h-3.5 w-3.5" /> Reports
            </Button>
          </div>
        </div>

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
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/5 border border-warning/20 text-sm text-warning font-medium">
            <Bell className="h-4 w-4 shrink-0" />
            {stats.overdueCount} overdue payment{stats.overdueCount > 1 ? "s" : ""} — total ₱{stats.overdueTotal.toLocaleString()} outstanding.
            <Button size="sm" variant="ghost" className="ml-auto text-warning hover:bg-warning/10 h-7 px-2 text-xs" onClick={() => navigate("/payments")}>
              View →
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
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{stats.availableRooms} free</span>
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
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stats.overdueCount > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                  {stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : "All clear"}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{fmt(stats.totalIncome)}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">Total Collected</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{stats.paidCount} paid · {stats.pendingCount} pending</p>
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
                    <p className="text-[10px] text-muted-foreground truncate">{log.details}</p>
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
                  { label: "Add Boarder", icon: <Users className="h-4 w-4" />, path: "/boarders", bg: "bg-accent/5 hover:bg-accent/10 border-accent/20 text-accent" },
                  { label: "Record Payment", icon: <CreditCard className="h-4 w-4" />, path: "/payments", bg: "bg-success/5 hover:bg-success/10 border-success/20 text-success" },
                  { label: "Add Room", icon: <Building2 className="h-4 w-4" />, path: "/rooms", bg: "bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary" },
                  { label: "New Expense", icon: <Receipt className="h-4 w-4" />, path: "/expenses", bg: "bg-warning/5 hover:bg-warning/10 border-warning/20 text-warning" },
                  { label: "Maintenance", icon: <Wrench className="h-4 w-4" />, path: "/maintenance", bg: "bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 text-orange-600" },
                  { label: "Reports", icon: <Download className="h-4 w-4" />, path: "/reports", bg: "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-600" },
                  { label: "Audit Logs", icon: <CheckCircle2 className="h-4 w-4" />, path: "/audit-logs", bg: "bg-muted hover:bg-muted/80 border-border text-muted-foreground" },
                  { label: "Settings", icon: <Settings className="h-4 w-4" />, path: "/settings", bg: "bg-muted hover:bg-muted/80 border-border text-muted-foreground" },
                ].map(a => (
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

      </div>
    </AppLayout>
  );
};

export default Dashboard;
