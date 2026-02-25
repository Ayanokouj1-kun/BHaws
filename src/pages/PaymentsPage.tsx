import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Printer, Trash2, Edit, Hash, Lock } from "lucide-react";
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

const PaymentsPage = () => {
  const { payments, boarders, addPayment, updatePayment, deletePayment, isLoading, settings } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [currentPayment, setCurrentPayment] = useState<Partial<Payment>>({
    boarderId: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paidDate: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('default', { month: 'long' }),
    type: "Monthly Rent",
    status: "Paid",
    receiptNumber: "",
  });

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

  const handleOpenAdd = () => {
    setMode("add");
    setCurrentPayment({
      boarderId: "",
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paidDate: new Date().toISOString().split('T')[0],
      month: new Date().toLocaleString('default', { month: 'long' }),
      type: "Monthly Rent",
      status: "Paid",
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
    if (!currentPayment.boarderId || !currentPayment.amount || !currentPayment.month) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (mode === "add") {
      const payment: Payment = {
        ...currentPayment as Payment,
        id: `p${Date.now()}`,
      };
      addPayment(payment);
      toast.success("Payment recorded successfully");
    } else {
      updatePayment(currentPayment as Payment);
      toast.success("Payment updated successfully");
    }

    setIsDialogOpen(false);
  };

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
                <TableHead>Receipt #</TableHead>
                <TableHead>Boarder</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 group">
                  <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">{p.receiptNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold overflow-hidden shadow-sm">
                        {boarders.find(b => b.id === p.boarderId)?.profilePhoto ? (
                          <img src={boarders.find(b => b.id === p.boarderId)?.profilePhoto} className="h-full w-full object-cover" alt="" />
                        ) : (
                          getBoarderName(p.boarderId).charAt(0)
                        )}
                      </div>
                      <span className="font-medium text-sm">{getBoarderName(p.boarderId)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">₱{p.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{p.month}</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50 whitespace-nowrap">
                      {p.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusStyle(p.status)} font-bold text-[10px] uppercase tracking-wider`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex gap-1 items-center justify-end flex-nowrap">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Record New Payment" : "Edit Payment Record"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Boarder *</Label>
              <Select
                value={currentPayment.boarderId}
                onValueChange={(val) => setCurrentPayment({ ...currentPayment, boarderId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Boarder" />
                </SelectTrigger>
                <SelectContent>
                  {boarders.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (₱) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={currentPayment.amount}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, amount: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="month">Billing Month *</Label>
                <Input
                  id="month"
                  value={currentPayment.month}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, month: e.target.value })}
                  placeholder="October 2023"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={currentPayment.type}
                  onValueChange={(val) => setCurrentPayment({ ...currentPayment, type: val as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly Rent">Monthly Rent</SelectItem>
                    <SelectItem value="Advance">Advance</SelectItem>
                    <SelectItem value="Security Deposit">Security Deposit</SelectItem>
                    <SelectItem value="Utility">Utility</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
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
            {/* Auto-generated receipt number — read only */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Hash className="h-3 w-3" /> Receipt Number
              </Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border/60 bg-muted/30 text-xs font-mono text-foreground">
                <span className="flex-1 tracking-wider">{currentPayment.receiptNumber}</span>
                <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              </div>
              <p className="text-[9px] text-muted-foreground">Auto-generated · cannot be edited</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{mode === "add" ? "Record Payment" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PaymentsPage;
