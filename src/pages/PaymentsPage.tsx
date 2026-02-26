import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Printer, Trash2, Edit, Hash, Lock, CalendarDays, CreditCard, Banknote, User, FileText, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Payment } from "@/types";
import { toast } from "sonner";
import { generateReceipt } from "@/utils/pdfGenerator";
import { generateReceiptNumber } from "@/utils/receiptGenerator";
import { Textarea } from "@/components/ui/textarea";

const PaymentsPage = () => {
  const { payments, boarders, addPayment, updatePayment, deletePayment, isLoading, settings, rooms } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const [currentPayment, setCurrentPayment] = useState<Partial<Payment>>({
    boarderId: "",
    amount: 0,
    date: today,
    paidDate: today,
    dueDate: "",
    month: currentMonthYear,
    type: "Monthly Rent",
    status: "Paid",
    method: "Cash",
    receivedBy: "Administrator",
    lateFee: 0,
    notes: "",
    receiptNumber: "",
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from({ length: 6 }, (_, i) => (2025 + i).toString()); // 2025–2030

  const getMonthYearParts = (value?: string): [string, string] => {
    if (!value) return ["", ""];
    const parts = value.trim().split(" ");
    if (parts.length === 1) return [parts[0], ""];
    const year = parts[parts.length - 1];
    const month = parts.slice(0, -1).join(" ");
    return [month, year];
  };

  const handlePrint = (p: Payment) => {
    const boarder = boarders.find(b => b.id === p.boarderId);
    generateReceipt({
      receiptNumber: p.receiptNumber || "N/A",
      boarderName: boarder?.fullName || "Guest",
      amount: p.amount,
      type: p.type,
      month: p.month || "N/A",
      date: p.paidDate || p.date || "N/A",
      receivedBy: p.receivedBy || "Administrator",
      houseName: settings.name,
      houseAddress: settings.address,
    });
    toast.success("Receipt generated successfully");
  };

  const filtered = payments.filter(p => {
    const boarderName = boarders.find(b => b.id === p.boarderId)?.fullName || "";
    const matchesSearch = boarderName.toLowerCase().includes(search.toLowerCase()) ||
      (p.receiptNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const dateA = new Date(a.paidDate || a.date || 0).getTime();
    const dateB = new Date(b.paidDate || b.date || 0).getTime();
    return dateB - dateA;
  });

  const statusStyle = (s: string) =>
    s === "Paid" ? "bg-success/10 text-success border-success/20" :
      s === "Pending" ? "bg-warning/10 text-warning border-warning/20" :
        "bg-destructive/10 text-destructive border-destructive/20";

  const getBoarderName = (id: string) => boarders.find(b => b.id === id)?.fullName || "Unknown";

  // Auto-fill amount when boarder is selected based on their room rate
  const getDefaultAmountForBoarder = (boarderId: string): number => {
    const boarder = boarders.find(b => b.id === boarderId);
    if (!boarder?.assignedRoomId) return 0;
    const room = rooms.find(r => r.id === boarder.assignedRoomId);
    return room?.monthlyRate || 0;
  };

  const handleOpenAdd = () => {
    setMode("add");
    setCurrentPayment({
      boarderId: "",
      amount: 0,
      date: today,
      paidDate: today,
      dueDate: "",
      month: currentMonthYear,
      type: "Monthly Rent",
      status: "Paid",
      method: "Cash",
      receivedBy: "Administrator",
      lateFee: undefined,
      notes: "",
      receiptNumber: generateReceiptNumber(),
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (payment: Payment) => {
    setMode("edit");
    setCurrentPayment(payment);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!currentPayment.boarderId) {
      toast.error("Please select a boarder");
      return;
    }
    if (!currentPayment.amount || currentPayment.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!currentPayment.month) {
      toast.error("Please specify the billing month");
      return;
    }

    // Auto-set paidDate when status is Paid and no paidDate is set
    const paymentData = { ...currentPayment };
    if (paymentData.status === "Paid" && !paymentData.paidDate) {
      paymentData.paidDate = today;
    }
    // Clear paidDate if not Paid
    if (paymentData.status !== "Paid") {
      paymentData.paidDate = undefined;
    }

    if (mode === "add") {
      const payment: Payment = {
        ...paymentData as Payment,
        id: `p${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      addPayment(payment);
      toast.success("Payment recorded successfully");
    } else {
      updatePayment(paymentData as Payment);
      toast.success("Payment updated successfully");
    }

    setIsDialogOpen(false);
  };

  const [billingMonth, billingYear] = getMonthYearParts(currentPayment.month);

  if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-header">Payments</h1>
            <p className="page-subtitle">Track rent and other utilities payments</p>
          </div>
          <Button className="gap-2" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-[11px]">Receipt #</TableHead>
                <TableHead className="text-[11px]">Boarder</TableHead>
                <TableHead className="text-[11px] whitespace-nowrap">Type</TableHead>
                <TableHead className="text-[11px]">Period</TableHead>
                <TableHead className="text-[11px]">Billing Date</TableHead>
                <TableHead className="text-[11px]">Due Date</TableHead>
                <TableHead className="text-[11px]">Date Paid</TableHead>
                <TableHead className="text-[11px]">Method</TableHead>
                <TableHead className="text-[11px]">Amount</TableHead>
                <TableHead className="text-[11px]">Late Fee</TableHead>
                <TableHead className="text-[11px]">Total</TableHead>
                <TableHead className="text-[11px] whitespace-nowrap">Received By</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="w-[170px] text-right text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 group">
                  <TableCell className="font-mono text-[10px] text-muted-foreground uppercase max-w-[90px] truncate">
                    {p.receiptNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[11px] font-bold overflow-hidden shadow-sm">
                        {boarders.find(b => b.id === p.boarderId)?.profilePhoto ? (
                          <img src={boarders.find(b => b.id === p.boarderId)?.profilePhoto} className="h-full w-full object-cover" alt="" />
                        ) : (
                          getBoarderName(p.boarderId).charAt(0)
                        )}
                      </div>
                      <span className="font-medium text-[12px] leading-tight line-clamp-2 max-w-[140px]">
                        {getBoarderName(p.boarderId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50 whitespace-nowrap">
                      {p.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-[11px]">{p.month}</TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap">
                    {p.date || "—"}
                  </TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap">
                    {p.dueDate || "—"}
                  </TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap">
                    {p.paidDate || (p.status === "Paid" ? "—" : "—")}
                  </TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap">
                    {p.method || "Cash"}
                  </TableCell>
                  <TableCell className="font-semibold text-[12px] whitespace-nowrap">
                    ₱{p.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap">
                    ₱{(p.lateFee || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-[12px] whitespace-nowrap">
                    ₱{(p.amount + (p.lateFee || 0)).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-[11px] whitespace-nowrap max-w-[120px] truncate">
                    {p.receivedBy || "Administrator"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusStyle(p.status)} font-bold text-[10px] uppercase tracking-wider`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex gap-1 items-center justify-end flex-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent"
                        onClick={() => setViewPayment(p)}
                        title="View details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent" onClick={() => handleOpenEdit(p)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      {p.status !== "Paid" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-[11px] font-bold text-success hover:bg-success/5 px-1.5 shrink-0"
                          onClick={() => {
                            updatePayment({
                              ...p,
                              status: "Paid",
                              paidDate: new Date().toISOString().split('T')[0],
                              receivedBy: "Administrator",
                              receiptNumber: p.receiptNumber || generateReceiptNumber(),
                            });
                            toast.success("Payment marked as paid");
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}

                      {p.status === "Paid" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:bg-accent/5" onClick={() => handlePrint(p)}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/5"
                        onClick={() => {
                          if (confirm("Delete this payment record?")) {
                            deletePayment(p.id);
                            toast.success("Payment record deleted");
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-5">
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className={`p-2 rounded-xl ${mode === "add" ? "bg-accent/10" : "bg-warning/10"}`}>
                {mode === "add" ? <CreditCard className="h-4 w-4 text-accent" /> : <Edit className="h-4 w-4 text-warning" />}
              </div>
              {mode === "add" ? "Record New Payment" : "Edit Payment Record"}
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {mode === "add" ? "Fill in the details below to record a new payment transaction." : "Update the payment record details."}
            </p>
          </DialogHeader>

          <div className="pt-2 pb-1">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              {/* Left: main form (landscape friendly) */}
              <div className="space-y-3">
                {/* ── Section 1: Boarder Selection ── */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" /> Boarder Information
                  </h4>
                  <div className="grid gap-2">
                    <Label>
                      Select Boarder <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={currentPayment.boarderId}
                      onValueChange={(val) => {
                        const amt =
                          currentPayment.type === "Monthly Rent"
                            ? getDefaultAmountForBoarder(val)
                            : currentPayment.amount;
                        setCurrentPayment({ ...currentPayment, boarderId: val, amount: amt || currentPayment.amount });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a boarder..." />
                      </SelectTrigger>
                      <SelectContent>
                        {boarders
                          .filter((b) => b.status === "Active")
                          .map((b) => {
                            const room = rooms.find((r) => r.id === b.assignedRoomId);
                            return (
                              <SelectItem key={b.id} value={b.id}>
                                <div className="flex items-center gap-2">
                                  <span>{b.fullName}</span>
                                  {room && (
                                    <span className="text-[10px] text-muted-foreground">
                                      ({room.name} · ₱{room.monthlyRate.toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Section 2: Payment Details ── */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                    <Banknote className="h-3 w-3" /> Payment Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="pay-amount">
                        Amount (₱) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="pay-amount"
                        type="number"
                        min="0"
                        value={currentPayment.amount || ""}
                        onChange={(e) => setCurrentPayment({ ...currentPayment, amount: Number(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pay-month">
                        Billing Month <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={billingMonth || undefined}
                          onValueChange={(val) => {
                            const [, yearPart] = getMonthYearParts(currentPayment.month);
                            const yearToUse = yearPart || new Date().getFullYear().toString();
                            setCurrentPayment({ ...currentPayment, month: `${val} ${yearToUse}` });
                          }}
                        >
                          <SelectTrigger id="pay-month">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={billingYear || undefined}
                          onValueChange={(val) => {
                            const [monthPart] = getMonthYearParts(currentPayment.month);
                            const monthToUse =
                              monthPart || new Date().toLocaleString("default", { month: "long" });
                            setCurrentPayment({ ...currentPayment, month: `${monthToUse} ${val}` });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Choose the billing month and year (day is handled by the dates below).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Payment Type</Label>
                      <Select
                        value={currentPayment.type}
                        onValueChange={(val) => {
                          const newState: Partial<Payment> = { ...currentPayment, type: val as any };
                          // Auto-fill room rate for monthly rent
                          if (val === "Monthly Rent" && currentPayment.boarderId) {
                            newState.amount = getDefaultAmountForBoarder(currentPayment.boarderId);
                          }
                          setCurrentPayment(newState);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly Rent">Monthly Rent</SelectItem>
                          <SelectItem value="Advance">Advance Payment</SelectItem>
                          <SelectItem value="Security Deposit">Security Deposit</SelectItem>
                          <SelectItem value="Deposit">Deposit</SelectItem>
                          <SelectItem value="Utility">Utility Bill</SelectItem>
                          <SelectItem value="Maintenance">Maintenance Fee</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Payment Status</Label>
                      <Select
                        value={currentPayment.status}
                        onValueChange={(val) => setCurrentPayment({ ...currentPayment, status: val as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Billing Date (kept on main column) ── */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" /> Billing Date
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid gap-2">
                      <Label>Billing Date</Label>
                      <Input
                        type="date"
                        value={currentPayment.date || ""}
                        onChange={(e) =>
                          setCurrentPayment({ ...currentPayment, date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* ── Late Fee ── */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-destructive flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" /> Late Fee
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Late Fee Amount (₱)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={currentPayment.lateFee === undefined ? "" : currentPayment.lateFee}
                        onChange={(e) =>
                          setCurrentPayment({
                            ...currentPayment,
                            lateFee:
                              e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <p className="text-xs text-muted-foreground">
                        Total:{" "}
                        <span className="font-bold text-foreground">
                          ₱
                          {((currentPayment.amount || 0) + (currentPayment.lateFee ?? 0)).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* (Notes moved to right column under Due Date) */}
              </div>

              {/* Right: receipt, method & summary (stacks under on mobile) */}
              <div className="space-y-3">
                {/* ── Receipt Number (read-only) ── */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Hash className="h-3 w-3" /> Receipt Number
                  </Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border/60 bg-muted/30 text-xs font-mono text-foreground">
                    <span className="flex-1 tracking-wider">
                      {currentPayment.receiptNumber}
                    </span>
                    <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-snug">
                    Auto-generated · cannot be edited
                  </p>
                </div>

                {/* ── Payment Method, Dates & Notes ── */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" /> Payment Method & Dates
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid gap-2">
                      <Label>Payment Method</Label>
                      <Select
                        value={currentPayment.method || "Cash"}
                        onValueChange={(val) =>
                          setCurrentPayment({ ...currentPayment, method: val as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="GCash">GCash</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Received By</Label>
                      <Input
                        value={currentPayment.receivedBy || ""}
                        onChange={(e) =>
                          setCurrentPayment({ ...currentPayment, receivedBy: e.target.value })
                        }
                        placeholder="Administrator"
                      />
                    </div>
                    {currentPayment.status === "Paid" && (
                      <div className="grid gap-2">
                        <Label>Date Paid</Label>
                        <Input
                          type="date"
                          value={currentPayment.paidDate || ""}
                          onChange={(e) =>
                            setCurrentPayment({ ...currentPayment, paidDate: e.target.value })
                          }
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={currentPayment.dueDate || ""}
                        onChange={(e) =>
                          setCurrentPayment({ ...currentPayment, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <FileText className="h-3 w-3" /> Additional Notes
                      </Label>
                      <Textarea
                        value={currentPayment.notes || ""}
                        onChange={(e) =>
                          setCurrentPayment({ ...currentPayment, notes: e.target.value })
                        }
                        placeholder="Optional remarks, e.g., partial payment, adjustment reason..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Compact Full Summary ── */}
                {currentPayment.boarderId && currentPayment.amount ? (
                  <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5 space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                      Review All Details
                    </p>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] leading-snug">
                      <span className="text-muted-foreground">Boarder</span>
                      <span className="font-semibold text-right truncate">
                        {getBoarderName(currentPayment.boarderId)}
                      </span>

                      <span className="text-muted-foreground">Type</span>
                      <span className="text-right">{currentPayment.type}</span>

                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-right">
                        ₱{(currentPayment.amount || 0).toLocaleString()}
                      </span>

                      <span className="text-muted-foreground">Late Fee</span>
                      <span className="text-right">
                        ₱{(currentPayment.lateFee ?? 0).toLocaleString()}
                      </span>

                      <span className="text-muted-foreground font-semibold">Total</span>
                      <span className="font-bold text-accent text-right">
                        ₱
                        {((currentPayment.amount || 0) + (currentPayment.lateFee ?? 0)).toLocaleString()}
                      </span>

                      <span className="text-muted-foreground">Period</span>
                      <span className="text-right">{currentPayment.month || "—"}</span>

                      <span className="text-muted-foreground">Billing Date</span>
                      <span className="text-right text-xs">
                        {currentPayment.date || "—"}
                      </span>

                      <span className="text-muted-foreground">Due Date</span>
                      <span className="text-right text-xs">
                        {currentPayment.dueDate || "—"}
                      </span>

                      <span className="text-muted-foreground">Date Paid</span>
                      <span className="text-right text-xs">
                        {currentPayment.paidDate ||
                          (currentPayment.status === "Paid"
                            ? "Today (auto on save)"
                            : "—")}
                      </span>

                      <span className="text-muted-foreground">Method</span>
                      <span className="text-right">
                        {currentPayment.method || "Cash"}
                      </span>

                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={`text-right font-semibold ${
                          currentPayment.status === "Paid"
                            ? "text-success"
                            : currentPayment.status === "Overdue"
                            ? "text-destructive"
                            : "text-warning"
                        }`}
                      >
                        {currentPayment.status}
                      </span>

                      <span className="text-muted-foreground">Receipt #</span>
                      <span className="font-mono text-[10px] text-right truncate">
                        {currentPayment.receiptNumber}
                      </span>

                      <span className="text-muted-foreground">Notes</span>
                      <span className="col-span-1 text-right text-[10px] line-clamp-3">
                        {currentPayment.notes || "—"}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="gap-2">
              {mode === "add" ? (
                <><CreditCard className="h-3.5 w-3.5" /> Record Payment</>
              ) : (
                <><Edit className="h-3.5 w-3.5" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Modal (read-only) */}
      <Dialog open={!!viewPayment} onOpenChange={(open) => !open && setViewPayment(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="p-2 rounded-xl bg-muted">
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              View Payment Details
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Read-only view of the full payment information.
            </p>
          </DialogHeader>

          {viewPayment && (
            <div className="space-y-4 py-2 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Boarder</p>
                  <p className="font-semibold">{getBoarderName(viewPayment.boarderId)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Receipt #</p>
                  <p className="font-mono text-[11px]">{viewPayment.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Type</p>
                  <p>{viewPayment.type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Status</p>
                  <p className={`font-semibold ${
                    viewPayment.status === "Paid"
                      ? "text-success"
                      : viewPayment.status === "Overdue"
                      ? "text-destructive"
                      : "text-warning"
                  }`}>
                    {viewPayment.status}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Period</p>
                  <p>{viewPayment.month}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Method</p>
                  <p>{viewPayment.method || "Cash"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Billing Date</p>
                  <p>{viewPayment.date || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Due Date</p>
                  <p>{viewPayment.dueDate || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Date Paid</p>
                  <p>{viewPayment.paidDate || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Amount</p>
                  <p className="font-semibold">
                    ₱{viewPayment.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Late Fee</p>
                  <p>
                    ₱{(viewPayment.lateFee || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Total</p>
                  <p className="font-bold text-accent">
                    ₱{(viewPayment.amount + (viewPayment.lateFee || 0)).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Received By</p>
                  <p>{viewPayment.receivedBy || "Administrator"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Created At</p>
                  <p className="text-[11px]">{viewPayment.createdAt}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest mb-1">Notes</p>
                <div className="rounded-md border border-border/50 bg-muted/30 p-2 min-h-[40px]">
                  <p className="text-[11px] whitespace-pre-wrap">
                    {viewPayment.notes || "No additional notes."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setViewPayment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PaymentsPage;
