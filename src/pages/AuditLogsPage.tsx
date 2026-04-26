import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Input } from "@/components/ui/input";
import { Search, Clock, User, Filter, ArrowDownToLine } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

import { generateCSV } from "@/utils/csvGenerator";
import { generatePDF } from "@/utils/pdfGenerator";

const AuditLogsPage = () => {
  const { auditLogs, isLoading, settings, rooms, boarders, payments, addLog } = useData();
  const [isSyncing, setIsSyncing] = useState(false);
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

    const dateStr = new Date().toISOString().split('T')[0];
    const formalFileName = `BHaws_Audit_Logs_${dateStr}`;

    if (format === "PDF") {
      generatePDF({
        title: `${settings.name} - System Audit Logs`,
        subtitle: `Generated on ${new Date().toLocaleString()}`,
        headers,
        data,
        fileName: formalFileName
      });
      toast.success("Audit logs generated as PDF");
    } else {
      generateCSV(headers, data, formalFileName);
      toast.success("Audit logs exported as CSV");
    }
  };

  const handleSyncLogs = async () => {
    setIsSyncing(true);
    toast.info("Checking for untracked records...");

    let count = 0;
    try {
      const loggedIds = new Set(auditLogs.map(l => l.entityId));

      for (const room of rooms) {
        if (!loggedIds.has(room.id)) {
          await addLog("Initial Record", "Room", room.id, `Existing room "${room.name}" detected in system.`);
          count++;
        }
      }

      for (const boarder of boarders) {
        if (!loggedIds.has(boarder.id)) {
          await addLog("Initial Record", "Boarder", boarder.id, `Existing boarder "${boarder.fullName}" detected in system.`);
          count++;
        }
      }

      for (const p of payments) {
        const pId = String(p.id);
        if (!loggedIds.has(pId)) {
          await addLog("Initial Record", "Payment", pId, `Existing ${p.status} payment for ${p.month} detected.`);
          count++;
        }
      }

      if (count > 0) toast.success(`Successfully synced ${count} missing records to audit logs!`);
      else toast.info("Audit logs are already up to date with existing records.");
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleSyncLogs} disabled={isSyncing}>
              <Clock className="h-4 w-4" /> {isSyncing ? "Syncing..." : "Sync Logs"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExportLogs("CSV")}>
              <ArrowDownToLine className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" className="gap-2" onClick={() => handleExportLogs("PDF")}>
              <ArrowDownToLine className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-card border border-border/60 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-44 h-10">
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

          <div className="flex items-center gap-1.5 ml-auto">
            <Button variant="outline" size="sm" className="h-10 px-4 gap-2 rounded-xl" onClick={handleSyncLogs} disabled={isSyncing}>
              <Clock className="h-3.5 w-3.5" /> 
              <span className="text-[10px] font-black uppercase tracking-widest">{isSyncing ? "Syncing" : "Sync"}</span>
            </Button>
            <div className="h-6 w-px bg-border/60 mx-1" />
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" title="Export CSV" onClick={() => handleExportLogs("CSV")}>
              <ArrowDownToLine className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" className="h-10 px-4 gap-2 rounded-xl" onClick={() => handleExportLogs("PDF")}>
              <ArrowDownToLine className="h-3.5 w-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
            </Button>
          </div>
        </div>

        {/* ── Logs Table ── */}
        <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                  <TableHead className="text-[10px] font-black uppercase tracking-wider h-10 w-[60px] text-center">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider h-10">Action</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider h-10">Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider h-10">Performed By</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider h-10 text-right pr-6">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/20 border-b border-border/40 group">
                    <TableCell className="text-center py-3">
                      <div className="h-8 w-8 mx-auto rounded-lg bg-muted/50 flex items-center justify-center text-sm group-hover:bg-accent/10 transition-colors">
                        {entityIcon(log.entity)}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-tighter ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{log.entity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="text-sm text-foreground leading-snug" title={log.details}>{log.details}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/50 uppercase mt-1 tracking-tighter">Target ID: {log.entityId}</p>
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-accent" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{log.performedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                        {log.timestamp}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 opacity-20 mb-3" />
                        <p className="font-bold text-sm">No activity logs found</p>
                        <Button variant="link" size="sm" onClick={() => { setSearch(""); setEntityFilter("all"); }} className="text-accent mt-1">Clear all filters</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout >
  );
};

export default AuditLogsPage;
