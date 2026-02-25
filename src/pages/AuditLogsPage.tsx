import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Input } from "@/components/ui/input";
import { Search, Clock, User, Filter, ArrowDownToLine } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { generateCSV } from "@/utils/csvGenerator";
import { generatePDF } from "@/utils/pdfGenerator";

const AuditLogsPage = () => {
  const { auditLogs, isLoading, settings } = useData();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const filtered = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter === "all" || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const actionColor = (action: string) => {
    if (action.includes("Added") || action.includes("Created")) return "bg-success/10 text-success border-success/20";
    if (action.includes("Updated") || action.includes("Assigned")) return "bg-accent/10 text-accent border-accent/20";
    if (action.includes("Deleted") || action.includes("Overdue")) return "bg-destructive/10 text-destructive border-destructive/20";
    if (action.includes("Recorded") || action.includes("Paid")) return "bg-success/10 text-success border-success/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const entityIcon = (entity: string) => {
    switch (entity) {
      case "Boarder": return "👤";
      case "Room": return "🏠";
      case "Payment": return "💰";
      case "Maintenance": return "🔧";
      case "Expense": return "📉";
      case "Announcement": return "📢";
      default: return "⚙️";
    }
  };

  const handleExportLogs = (format: string) => {
    const headers = ["Timestamp", "Action", "Entity", "Details", "Performed By"];
    const data = auditLogs.map(log => [
      log.timestamp,
      log.action,
      log.entity,
      log.details,
      log.performedBy
    ]);

    if (format === "PDF") {
      generatePDF({
        title: `${settings.name} - System Audit Logs`,
        subtitle: `Generated on ${new Date().toLocaleString()}`,
        headers,
        data,
        fileName: `audit_logs_${Date.now()}`
      });
      toast.success("Audit logs generated as PDF");
    } else {
      generateCSV(headers, data, `audit_logs_${Date.now()}`);
      toast.success("Audit logs exported as CSV");
    }
  };

  if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Audit Logs</h1>
            <p className="page-subtitle">Track every change and action within the system</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportLogs("CSV")}>
              <ArrowDownToLine className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" className="gap-2" onClick={() => handleExportLogs("PDF")}>
              <ArrowDownToLine className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder="All Entities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="Boarder">Boarders</SelectItem>
              <SelectItem value="Room">Rooms</SelectItem>
              <SelectItem value="Payment">Payments</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Expense">Expenses</SelectItem>
              <SelectItem value="Announcement">Announcements</SelectItem>
              <SelectItem value="Settings">Settings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
            <Clock className="h-3 w-3" />
            Recent Activity
          </div>

          <div className="grid gap-3">
            {filtered.map((log) => (
              <div key={log.id} className="stat-card flex items-start gap-4 hover:shadow-md transition-all group border-border/60">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-lg shrink-0 group-hover:bg-accent/5 transition-colors">
                  {entityIcon(log.entity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-foreground/80">{log.entity}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium bg-muted/30 px-2 py-0.5 rounded italic">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{log.details}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-[11px] font-medium">{log.performedBy}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">ID: {log.entityId}</span>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No activity logs found matching your criteria</p>
                <Button variant="link" onClick={() => { setSearch(""); setEntityFilter("all"); }} className="mt-2 text-accent">Clear all filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLogsPage;
