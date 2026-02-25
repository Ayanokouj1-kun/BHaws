import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Receipt, Search, Trash2, Edit, TrendingDown, Wallet } from "lucide-react";
import { Expense } from "@/types";

const categoryColors: Record<string, string> = {
    Utilities: "bg-accent/10 text-accent border-accent/20",
    Maintenance: "bg-warning/10 text-warning border-warning/20",
    Supplies: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    Taxes: "bg-destructive/10 text-destructive border-destructive/20",
    Salary: "bg-success/10 text-success border-success/20",
    Other: "bg-muted text-muted-foreground border-border",
};

const categoryIcons: Record<string, string> = {
    Utilities: "⚡", Maintenance: "🔧", Supplies: "📦", Taxes: "🏛️", Salary: "💼", Other: "📌"
};

const emptyForm = (): Partial<Expense> => ({
    category: "Utilities",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paidBy: "Admin",
});

const ExpensesPage = () => {
    const { expenses, addExpense, updateExpense, deleteExpense, payments, isLoading } = useData();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [current, setCurrent] = useState<Partial<Expense>>(emptyForm());

    const filtered = expenses.filter(e => {
        const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
            (e.receiptRef || "").toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;

    const byCategory = ["Utilities", "Maintenance", "Supplies", "Taxes", "Salary", "Other"].map(cat => ({
        label: cat,
        amount: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    }));

    const handleOpenAdd = () => { setMode("add"); setCurrent(emptyForm()); setIsDialogOpen(true); };
    const handleEdit = (expense: Expense) => { setMode("edit"); setCurrent(expense); setIsDialogOpen(true); };

    const handleSubmit = () => {
        if (!current.description || !current.amount || !current.date) {
            toast.error("Please fill in all required fields"); return;
        }
        if (mode === "add") {
            addExpense({ ...current as Expense, id: `e${Date.now()}` });
            toast.success("Expense recorded");
        } else {
            updateExpense(current as Expense);
            toast.success("Expense updated");
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this expense record?")) {
            deleteExpense(id); toast.success("Expense deleted");
        }
    };

    if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;

    return (
        <AppLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="page-header">Expenses</h1>
                        <p className="page-subtitle">Track operational costs and financial outflows</p>
                    </div>
                    <Button className="gap-2 shrink-0" onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4" /> Record Expense
                    </Button>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat-card flex items-center gap-4">
                        <div className="p-3 bg-success/10 rounded-2xl"><Wallet className="h-6 w-6 text-success" /></div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Income</p>
                            <p className="text-2xl font-bold text-success">₱{totalIncome.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="stat-card flex items-center gap-4">
                        <div className="p-3 bg-destructive/10 rounded-2xl"><TrendingDown className="h-6 w-6 text-destructive" /></div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Expenses</p>
                            <p className="text-2xl font-bold text-destructive">₱{totalExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={`stat-card flex items-center gap-4`}>
                        <div className={`p-3 rounded-2xl ${netCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                            <Receipt className={`h-6 w-6 ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Net Cash Flow</p>
                            <p className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
                                {netCashFlow >= 0 ? "+" : ""}₱{netCashFlow.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Breakdown by Category */}
                <div className="stat-card">
                    <h3 className="font-semibold text-sm text-foreground mb-4">Expense Breakdown by Category</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {byCategory.map(cat => (
                            <div key={cat.label} className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
                                <p className="text-2xl mb-1">{categoryIcons[cat.label]}</p>
                                <p className="text-xs font-bold text-muted-foreground uppercase">{cat.label}</p>
                                <p className="text-sm font-bold text-foreground mt-1">₱{cat.amount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {["Utilities", "Maintenance", "Supplies", "Taxes", "Salary", "Other"].map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="hidden md:table-cell">Paid By</TableHead>
                                <TableHead className="hidden md:table-cell">Receipt Ref</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(expense => (
                                <TableRow key={expense.id} className="hover:bg-muted/20 group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{categoryIcons[expense.category]}</span>
                                            <span className="text-sm font-medium">{expense.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] font-bold uppercase ${categoryColors[expense.category]}`}>
                                            {expense.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-destructive">₱{expense.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{expense.date}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{expense.paidBy}</TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground hidden md:table-cell">{expense.receiptRef || "—"}</TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <div className="flex gap-1 items-center justify-end flex-nowrap">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors" onClick={() => handleEdit(expense)}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5 transition-colors" onClick={() => handleDelete(expense.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-14 text-muted-foreground italic">
                                        No expense records found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{mode === "add" ? "Record Expense" : "Edit Expense"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={current.category} onValueChange={v => setCurrent({ ...current, category: v as Expense["category"] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Utilities", "Maintenance", "Supplies", "Taxes", "Salary", "Other"].map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description *</Label>
                            <Input value={current.description} onChange={e => setCurrent({ ...current, description: e.target.value })} placeholder="e.g., Monthly electricity bill" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Amount (₱) *</Label>
                                <Input type="number" value={current.amount} onChange={e => setCurrent({ ...current, amount: Number(e.target.value) })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Date *</Label>
                                <Input type="date" value={current.date} onChange={e => setCurrent({ ...current, date: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Paid By</Label>
                                <Input value={current.paidBy} onChange={e => setCurrent({ ...current, paidBy: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Receipt Ref</Label>
                                <Input value={current.receiptRef || ""} onChange={e => setCurrent({ ...current, receiptRef: e.target.value })} placeholder="Optional" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{mode === "add" ? "Record" : "Save Changes"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default ExpensesPage;
