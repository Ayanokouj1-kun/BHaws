
import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { FileBarChart, Users, DoorOpen, CreditCard, TrendingUp, Download, Calendar, ArrowRight, ShieldCheck, PhilippinePeso, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { generatePDF } from "@/utils/pdfGenerator";
import { generateCSV } from "@/utils/csvGenerator";

type ReportType = "summary" | "income" | "unpaid" | "occupancy" | "history";

const ReportsPage = () => {
  const { rooms, boarders, payments, isLoading, settings, user } = useData();
  const [active, setActive] = useState<ReportType>("summary");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(25);
  const [historySearch, setHistorySearch] = useState("");

  const role = user?.role || "Boarder";

  const tabs = useMemo(() => {
    const allTabs: { key: ReportType; label: string; icon: React.ElementType; roles?: string[] }[] = [
      { key: "summary", label: "Financial Summary", icon: CreditCard, roles: ["Admin"] },
      { key: "income", label: "Monthly Income", icon: TrendingUp, roles: ["Admin"] },
      { key: "unpaid", label: "Receivables", icon: FileBarChart, roles: ["Admin"] },
      { key: "occupancy", label: "Occupancy", icon: DoorOpen },
      { key: "history", label: "History", icon: Users },
    ];
    return allTabs.filter(tab => !tab.roles || tab.roles.includes(role));
  }, [role]);

  // If role doesn't allow current active tab, switch to first allowed
  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.key === active)) {
      setActive(tabs[0].key);
    }
  }, [tabs, active]);

  const getBoarder = (boarderId: string) => boarders.find(b => b.id === boarderId);
  const getBoarderName = (boarderId: string) => getBoarder(boarderId)?.fullName ?? "Unknown";

  const paidPayments = useMemo(() => payments.filter(p => p.status === "Paid"), [payments]);
  const unpaidPayments = useMemo(() => payments.filter(p => p.status === "Overdue" || p.status === "Pending"), [payments]);

  const handleExport = (format: string) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const formattedActive = active.charAt(0).toUpperCase() + active.slice(1);
    const formalFileName = `BHaws_${formattedActive}_Report_${dateStr}`;

    const reportConfig: { headers: string[]; data: (string | number)[][]; fileName: string; title: string; subtitle: string } = {
      headers: [],
      data: [],
      fileName: formalFileName,
      title: `${settings.name} - ${active.toUpperCase()} REPORT`,
      subtitle: `Address: ${settings.address} | Contact: ${settings.contact}`,
    };

    if (active === "summary") {
      reportConfig.headers = ["Boarder Name", "Advance", "Deposit", "Total Paid", "Pending"];
      reportConfig.data = boarders.map(b => {
        const bPayments = payments.filter(p => p.boarderId === b.id);
        const totalPaid = bPayments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
        const totalBalance = bPayments.filter(p => p.status !== "Paid").reduce((s, p) => s + p.amount, 0);
        return [b.fullName, b.advanceAmount, b.depositAmount, totalPaid, totalBalance];
      });
    } else if (active === "income") {
      reportConfig.headers = ["Month", "Type", "Receipt #", "Boarder", "Amount", "Date Paid"];
      reportConfig.data = paidPayments.map(p => [
        p.month || "—",
        p.type,
        p.receiptNumber || "N/A",
        getBoarderName(p.boarderId),
        p.amount,
        p.paidDate || p.date
      ]);
    } else if (active === "occupancy") {
      reportConfig.headers = ["Room Name", "Rate", "Capacity", "Occupied", "Status"];
      reportConfig.data = rooms.map(r => {
        const occupied = r.beds.filter(b => b.status === "Occupied").length;
        return [r.name, r.monthlyRate, r.capacity, occupied, r.status];
      });
    } else if (active === "unpaid") {
      reportConfig.headers = ["Boarder Name", "Type", "Amount", "Billing Month", "Status"];
      reportConfig.data = unpaidPayments.map(p => {
        const name = getBoarderName(p.boarderId);
        return [name, p.type, p.amount, p.month || p.date, p.status];
      });
    } else if (active === "history") {
      reportConfig.headers = ["Receipt #", "Boarder Name", "Type", "Amount", "Month", "Date Paid"];
      reportConfig.data = paidPayments.map(p => {
        const name = getBoarderName(p.boarderId);
        return [p.receiptNumber || "N/A", name, p.type, p.amount, p.month || "N/A", p.paidDate || p.date];
      });
    }

    if (format === "PDF") {
      const pdfData = reportConfig.data.map((row: (string | number)[]) =>
        row.map((cell, idx) => {
          const header = reportConfig.headers[idx].toLowerCase();
          if (header.includes("amount") || header.includes("rate") || header.includes("paid") || header.includes("pending")) {
            return `₱${Number(cell).toLocaleString()}`;
          }
          return String(cell);
        })
      );
      generatePDF({ ...reportConfig, data: pdfData });
      toast.success(`${active.toUpperCase()} report PDF generated`);
    } else {
      generateCSV(reportConfig.headers, reportConfig.data, reportConfig.fileName);
      toast.success(`${active.toUpperCase()} report CSV exported`);
    }
  };

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Reports & Analytics</h1>
            <p className="page-subtitle">Track your revenue, occupancy, and collection history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => handleExport("CSV")}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" className="gap-2 rounded-xl" onClick={() => handleExport("PDF")}>
              <Download className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-2xl w-full overflow-x-auto border border-border/50 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex whitespace-nowrap items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${active === tab.key
                ? "bg-card text-accent shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              <tab.icon className={`h-4 w-4`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border/60 rounded-3xl p-8 shadow-sm min-h-[500px]">
          {active === "summary" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xl text-foreground">Financial Summary</h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">Boarder Settlement Overview</p>
                </div>
                <Badge variant="outline" className="w-fit bg-accent/5 text-accent border-accent/20 font-bold uppercase py-1 px-3">Live Analysis</Badge>
              </div>
              <div className="grid gap-4">
                {boarders.map((b) => {
                  const bPayments = payments.filter(p => p.boarderId === b.id);
                  const totalPaid = bPayments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
                  const totalBalance = bPayments.filter(p => p.status !== "Paid").reduce((s, p) => s + p.amount, 0);
                  return (
                    <div key={b.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-muted/20 border border-border/50 hover:border-accent/30 hover:bg-accent/[0.02] transition-all duration-300">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-lg font-bold group-hover:scale-110 transition-transform overflow-hidden">
                          {b.profilePhoto ? (
                            <img src={b.profilePhoto} alt={b.fullName} className="h-full w-full object-cover" />
                          ) : (
                            b.fullName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-base text-foreground mb-1">{b.fullName}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Dep: ₱{b.depositAmount.toLocaleString()}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Adv: ₱{b.advanceAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between sm:block sm:text-right border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0 w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase">Collected:</span>
                          <p className="font-bold text-lg text-success">₱{totalPaid.toLocaleString()}</p>
                        </div>
                        {totalBalance > 0 && (
                          <div className="mt-1.5 flex items-center justify-end gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                            <p className="text-[10px] text-destructive font-bold uppercase">Pending: ₱{totalBalance.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active === "income" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xl text-foreground">Revenue Distribution</h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">Monthly Breakdown</p>
                </div>
                <div className="w-fit flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5" /> Fiscal Year {new Date().getFullYear()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(new Set(paidPayments.map(p => p.month))).filter(Boolean).sort().map((monthLabel) => {
                  const monthlyTotal = paidPayments
                    .filter(p => p.month === monthLabel)
                    .reduce((sum, p) => sum + p.amount, 0);

                  return (
                    <div key={monthLabel} className="group p-8 rounded-3xl bg-muted/20 border border-border/50 hover:bg-card hover:shadow-xl hover:border-accent/20 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-[0.2em]">{monthLabel}</p>
                        <TrendingUp className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-4xl font-extrabold text-foreground tracking-tight">₱{monthlyTotal.toLocaleString()}</p>
                      <div className="mt-6 flex items-center gap-3">
                        <div className="h-1 flex-1 bg-muted rounded-full">
                          <div className="h-full bg-accent rounded-full w-full opacity-60" />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase text-success border-success/20 bg-success/5 px-2">Net</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="p-8 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-accent/80 uppercase tracking-widest mb-2">Total Collections</p>
                    <p className="text-4xl font-extrabold text-foreground">₱{paidPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-accent/10"><PhilippinePeso className="h-8 w-8 text-accent" /></div>
                </div>
                <div className="p-8 rounded-3xl bg-success/5 border border-success/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-success/80 uppercase tracking-widest mb-2">Utility Recovery</p>
                    <p className="text-4xl font-extrabold text-foreground">₱{paidPayments.filter(p => p.type === "Utility").reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-success/10"><TrendingUp className="h-8 w-8 text-success" /></div>
                </div>
              </div>
            </div>
          )}

          {active === "unpaid" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xl text-foreground">Receivables</h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">Pending and Overdue Bills</p>
                </div>
                <Badge variant="destructive" className="w-fit bg-destructive/10 text-destructive border-none font-bold py-1 px-4 text-xs animate-pulse">Critical View</Badge>
              </div>
              {unpaidPayments.length > 0 ? (
                <div className="grid gap-4">
                  {unpaidPayments.map((p) => {
                    const b = getBoarder(p.boarderId);
                    const name = b?.fullName ?? getBoarderName(p.boarderId);
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-destructive/[0.03] border border-destructive/10 hover:bg-destructive/[0.05] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-sm font-bold overflow-hidden">
                            {b?.profilePhoto ? (
                              <img src={b.profilePhoto} alt={name} className="h-full w-full object-cover" />
                            ) : (
                              name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-base text-foreground leading-tight">{name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${p.status === "Overdue" ? "bg-destructive text-white" : "bg-warning/20 text-warning"
                                  }`}
                              >
                                {p.status}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                                MONTH: {p.month || p.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between sm:block sm:text-right border-t sm:border-t-0 border-destructive/10 pt-3 sm:pt-0 w-full sm:w-auto mt-2 sm:mt-0">
                          <p className="font-black text-xl text-destructive">₱{p.amount.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{p.type}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-28 text-center text-muted-foreground">
                  <div className="h-20 w-20 rounded-full bg-success/5 flex items-center justify-center border border-success/10 mb-6">
                    <ShieldCheck className="h-10 w-10 text-success opacity-20" />
                  </div>
                  <p className="text-lg font-bold text-foreground">Zero Receivables</p>
                  <p className="text-sm opacity-60">All current bills have been successfully collected.</p>
                </div>
              )}
            </div>
          )}

          {active === "occupancy" && (
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-xl text-foreground">Occupancy Audit</h3>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">Beds Distribution and Room Status</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rooms.map((r) => {
                  const occupied = r.beds.filter(b => b.status === "Occupied").length;
                  const pct = Math.round((occupied / r.capacity) * 100);
                  const isFull = occupied === r.capacity;

                  return (
                    <div key={r.id} className="p-6 rounded-3xl bg-muted/20 border border-border/50 hover:border-accent/20 transition-all duration-300 group">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${isFull ? "bg-accent/10" : "bg-success/10"}`}>
                            <DoorOpen className={`h-5 w-5 ${isFull ? "text-accent" : "text-success"}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="marquee-container overflow-hidden">
                              <p className="font-bold text-base text-foreground leading-tight marquee-scroll" title={r.name}>
                                {r.name}
                              </p>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest mt-0.5">Floor {r.floor || 1}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0 border-none ${isFull ? "bg-accent/10 text-accent" : "bg-success/10 text-success"}`}>
                          {isFull ? "FULL" : `${occupied}/${r.capacity}`}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-muted-foreground uppercase opacity-40">
                          <span>Utilization</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${isFull ? "bg-accent" : "bg-success"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active === "history" && (() => {
            // Sort all payments by date (newest first)
            const allSorted = [...payments].sort((a, b) => {
              const dateA = new Date(a.paidDate || a.date || 0).getTime();
              const dateB = new Date(b.paidDate || b.date || 0).getTime();
              return dateB - dateA;
            });

            // Filter by search
            const filtered = allSorted.filter(p => {
              if (!historySearch) return true;
              const q = historySearch.toLowerCase();
              const name = getBoarderName(p.boarderId).toLowerCase();
              return (
                name.includes(q) ||
                (p.receiptNumber || "").toLowerCase().includes(q) ||
                p.type.toLowerCase().includes(q) ||
                p.status.toLowerCase().includes(q) ||
                (p.month || "").toLowerCase().includes(q)
              );
            });

            const totalEntries = filtered.length;
            const totalPages = Math.max(1, Math.ceil(totalEntries / historyPerPage));
            const safePage = Math.min(historyPage, totalPages);
            const startIdx = (safePage - 1) * historyPerPage;
            const pageItems = filtered.slice(startIdx, startIdx + historyPerPage);

            const statusColor = (s: string) => {
              if (s === "Paid") return "bg-success/10 text-success border-success/20";
              if (s === "Overdue") return "bg-destructive/10 text-destructive border-destructive/20";
              return "bg-warning/10 text-warning border-warning/20";
            };

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-xl text-foreground">Transaction Logs</h3>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-semibold opacity-60">Full Payment History</p>
                  </div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase bg-muted px-4 py-1.5 rounded-full border border-border/50">
                    {totalEntries.toLocaleString()} {totalEntries === 1 ? "Entry" : "Entries"} recorded
                  </div>
                </div>

                {/* Search + Per-page controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, receipt, type..."
                      value={historySearch}
                      onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                      className="pl-9 bg-card border-border/60"
                    />
                  </div>
                  <Select value={String(historyPerPage)} onValueChange={(v) => { setHistoryPerPage(Number(v)); setHistoryPage(1); }}>
                    <SelectTrigger className="w-[130px] bg-card border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="border border-border/40 rounded-3xl overflow-x-auto shadow-sm bg-muted/10">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-5 gap-4 px-8 py-5 border-b border-border/40 bg-muted/40 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                      <span>Detail</span>
                      <span>Boarder</span>
                      <span>Amount</span>
                      <span>Status</span>
                      <span className="text-right">Timestamp</span>
                    </div>
                    <div className="divide-y divide-border/20">
                    {pageItems.map((p) => {
                      const b = getBoarder(p.boarderId);
                      const name = b?.fullName ?? getBoarderName(p.boarderId);
                      return (
                        <div key={p.id} className="grid grid-cols-5 gap-4 px-8 py-5 hover:bg-card hover:translate-x-1 transition-all duration-200">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-foreground truncate">{p.type}</span>
                            <span className="text-[10px] text-muted-foreground font-bold font-mono opacity-50 uppercase tracking-tighter">{p.receiptNumber || 'OR-' + p.id.slice(-6)}</span>
                          </div>
                          <div className="flex items-center text-sm font-semibold text-foreground truncate gap-2">
                            <div className="h-6 w-6 rounded-lg bg-accent/5 flex items-center justify-center text-[9px] font-black text-accent border border-accent/10 overflow-hidden shrink-0">
                              {b?.profilePhoto ? (
                                <img src={b.profilePhoto} alt={name} className="h-full w-full object-cover" />
                              ) : (
                                name.charAt(0)
                              )}
                            </div>
                            <span className="truncate">{name}</span>
                          </div>
                          <span className={`text-base font-black self-center tracking-tight ${p.status === "Paid" ? "text-success" : p.status === "Overdue" ? "text-destructive" : "text-warning"}`}>₱{p.amount.toLocaleString()}</span>
                          <div className="self-center">
                            <Badge variant="outline" className={`text-[9px] font-black uppercase ${statusColor(p.status)}`}>
                              {p.status}
                            </Badge>
                          </div>
                          <div className="text-right self-center">
                            <span className="text-xs font-bold text-muted-foreground">{p.paidDate || p.date}</span>
                            {p.month && <p className="text-[9px] text-muted-foreground/50 mt-0.5">{p.month}</p>}
                          </div>
                        </div>
                      );
                    })}
                    {totalEntries === 0 && (
                      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground italic text-sm">
                        <Calendar className="h-12 w-12 opacity-5 mb-4" />
                        {historySearch ? "No matching entries found" : "No payment history found"}
                      </div>
                    )}
                  </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                      Showing <span className="font-bold text-foreground">{startIdx + 1}</span>–<span className="font-bold text-foreground">{Math.min(startIdx + historyPerPage, totalEntries)}</span> of <span className="font-bold text-foreground">{totalEntries.toLocaleString()}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={safePage <= 1}
                        onClick={() => setHistoryPage(safePage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 7) {
                          page = i + 1;
                        } else if (safePage <= 4) {
                          page = i + 1;
                        } else if (safePage >= totalPages - 3) {
                          page = totalPages - 6 + i;
                        } else {
                          page = safePage - 3 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={safePage === page ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8 text-xs"
                            onClick={() => setHistoryPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={safePage >= totalPages}
                        onClick={() => setHistoryPage(safePage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
