import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
    Plus, Receipt, Search, Trash2, Edit, TrendingDown, Wallet,
    ArrowUp, ArrowDown, CalendarRange, X, ChevronDown, ChevronRight, LayoutList, LayoutGrid,
    Zap, Wrench, Package, BadgePercent, MoreHorizontal,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Expense } from "@/types";

/* ─────────────────────────── constants ─────────────────────────── */

const categoryColors: Record<string, string> = {
    Utilities: "bg-accent/10 text-accent border-accent/20",
    Maintenance: "bg-warning/10 text-warning border-warning/20",
    Supplies: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    Taxes: "bg-destructive/10 text-destructive border-destructive/20",
    Salary: "bg-success/10 text-success border-success/20",
    Other: "bg-muted text-muted-foreground border-border",
};

const categoryIcons: Record<string, React.ComponentType<LucideProps>> = {
    Utilities: Zap,
    Maintenance: Wrench,
    Supplies: Package,
    Taxes: BadgePercent,
    Salary: Wallet,
    Other: MoreHorizontal,
};

const CATEGORIES = ["Utilities", "Maintenance", "Supplies", "Taxes", "Salary", "Other"] as const;

const emptyForm = (): Partial<Expense> => ({
    category: "Utilities",
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    paidBy: "Admin",
});

/* ─────────────────────────── helpers ─────────────────────────── */

/** Format "2025-03-15" → "Mar 15, 2025" */
const formatDate = (iso: string): string => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PH", {
        year: "numeric", month: "short", day: "numeric",
    }).format(new Date(y, m - 1, d));
};

/** Format "2025-03" → "March 2025" */
const formatMonthGroup = (ym: string): string => {
    const [y, m] = ym.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long" }).format(new Date(y, m - 1, 1));
};

type SortOrder = "newest" | "oldest";

/* ─────────────────────────── component ─────────────────────────── */

const ExpensesPage = () => {
    const { expenses, addExpense, updateExpense, deleteExpense, payments, isLoading } = useData();

    // existing filters
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // new: date filters & sort
    const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [groupByMonth, setGroupByMonth] = useState(false);
    const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

    // dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [current, setCurrent] = useState<Partial<Expense>>(emptyForm());

    /* ── derived data ── */

    const filtered = useMemo(() => {
        return expenses
            .filter(e => {
                const matchSearch =
                    e.description.toLowerCase().includes(search.toLowerCase()) ||
                    (e.receiptRef || "").toLowerCase().includes(search.toLowerCase());
                const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
                const matchFrom = !dateFrom || e.date >= dateFrom;
                const matchTo = !dateTo || e.date <= dateTo;
                return matchSearch && matchCategory && matchFrom && matchTo;
            })
            .sort((a, b) =>
                sortOrder === "newest"
                    ? b.date.localeCompare(a.date)
                    : a.date.localeCompare(b.date)
            );
    }, [expenses, search, categoryFilter, dateFrom, dateTo, sortOrder]);

    /** Group filtered results by "YYYY-MM" */
    const groupedByMonth = useMemo(() => {
        const map = new Map<string, Expense[]>();
        filtered.forEach(e => {
            const ym = e.date.slice(0, 7); // "YYYY-MM"
            if (!map.has(ym)) map.set(ym, []);
            map.get(ym)!.push(e);
        });
        // preserve sort order of keys
        return Array.from(map.entries());
    }, [filtered]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;

    const byCategory = CATEGORIES.map(cat => ({
        label: cat,
        amount: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    }));

    const hasDateFilter = dateFrom || dateTo;

    /* ── handlers ── */

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

    const clearDateFilters = () => { setDateFrom(""); setDateTo(""); };

    const toggleMonth = (ym: string) => {
        setCollapsedMonths(prev => {
            const next = new Set(prev);
            next.has(ym) ? next.delete(ym) : next.add(ym);
            return next;
        });
    };

    /* ── sort icon helper ── */
    const SortIcon = () =>
        sortOrder === "newest"
            ? <ArrowDown className="h-3.5 w-3.5" />
            : <ArrowUp className="h-3.5 w-3.5" />;

    if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;

    /* ── render table rows ── */
    const renderRows = (rows: Expense[]) =>
        rows.map(expense => (
            <TableRow key={expense.id} className="hover:bg-muted/20 group">
                <TableCell>
                    <div className="flex items-center gap-3">
                        {(() => { const RowIcon = categoryIcons[expense.category]; return <div className={`p-1.5 rounded-md border ${categoryColors[expense.category]}`}><RowIcon className="h-3.5 w-3.5" strokeWidth={1.75} /></div>; })()}
                        <span className="text-sm font-medium">{expense.description}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase ${categoryColors[expense.category]}`}>
                        {expense.category}
                    </Badge>
                </TableCell>
                <TableCell className="font-bold text-destructive">₱{expense.amount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(expense.date)}</TableCell>
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
        ));

    return (
        <AppLayout>
            <div className="animate-fade-in space-y-6">
                {/* Header */}
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
                    <div className="stat-card flex items-center gap-4">
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
                        {byCategory.map(cat => {
                            const CatIcon = categoryIcons[cat.label];
                            return (
                                <div key={cat.label} className="text-center p-4 rounded-xl bg-muted/30 border border-border/30 flex flex-col items-center gap-1.5">
                                    <div className={`p-2 rounded-lg ${categoryColors[cat.label]} border`}>
                                        <CatIcon className="h-4 w-4" strokeWidth={1.75} />
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{cat.label}</p>
                                    <p className="text-sm font-bold text-foreground">₱{cat.amount.toLocaleString()}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Filter & Sort Bar ── */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
                    {/* Row 1: search + category + sort */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search expenses..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Category filter */}
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map(c => {
                                    const CIcon = categoryIcons[c];
                                    return (
                                        <SelectItem key={c} value={c}>
                                            <span className="flex items-center gap-2">
                                                <CIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                                {c}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        {/* Sort toggle */}
                        <div className="flex items-center rounded-lg border border-border overflow-hidden shrink-0" role="group" aria-label="Sort order">
                            <button
                                onClick={() => setSortOrder("newest")}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all duration-150 ${sortOrder === "newest"
                                    ? "bg-primary text-primary-foreground shadow-inner"
                                    : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <ArrowDown className="h-3.5 w-3.5" />
                                <span>Newest</span>
                            </button>
                            <div className="w-px h-5 bg-border shrink-0" />
                            <button
                                onClick={() => setSortOrder("oldest")}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all duration-150 ${sortOrder === "oldest"
                                    ? "bg-primary text-primary-foreground shadow-inner"
                                    : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <ArrowUp className="h-3.5 w-3.5" />
                                <span>Oldest</span>
                            </button>
                        </div>

                        {/* Group by Month toggle */}
                        <Button
                            variant={groupByMonth ? "default" : "outline"}
                            size="sm"
                            className="gap-2 shrink-0"
                            onClick={() => setGroupByMonth(g => !g)}
                            title="Toggle group by month"
                        >
                            {groupByMonth ? <LayoutGrid className="h-3.5 w-3.5" /> : <LayoutList className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">
                                {groupByMonth ? "Ungroup" : "Group by Month"}
                            </span>
                        </Button>
                    </div>

                    {/* Row 2: Date Range */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                            <CalendarRange className="h-4 w-4" />
                            <span className="font-medium">Date Range:</span>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center flex-1">
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="w-40 h-9 text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    min={dateFrom || undefined}
                                    className="w-40 h-9 text-sm"
                                />
                            </div>

                            {hasDateFilter && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
                                    onClick={clearDateFilters}
                                >
                                    <X className="h-3.5 w-3.5" /> Clear Dates
                                </Button>
                            )}
                        </div>

                        {/* Active filter summary */}
                        {hasDateFilter && (
                            <div className="flex items-center gap-1.5 ml-auto">
                                <Badge variant="outline" className="text-[10px] bg-accent/5 border-accent/20 text-accent font-semibold gap-1">
                                    <CalendarRange className="h-3 w-3" />
                                    {dateFrom ? formatDate(dateFrom) : "∞"} → {dateTo ? formatDate(dateTo) : "∞"}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Results summary */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">
                            Showing <span className="font-bold text-foreground">{filtered.length}</span> of{" "}
                            <span className="font-bold text-foreground">{expenses.length}</span> expenses
                            {hasDateFilter && <span className="text-accent"> (date filtered)</span>}
                        </p>
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1">
                                        Date <SortIcon />
                                    </span>
                                </TableHead>
                                <TableHead className="hidden md:table-cell">Paid By</TableHead>
                                <TableHead className="hidden md:table-cell">Receipt Ref</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-14 text-muted-foreground italic">
                                        {hasDateFilter
                                            ? "No expenses found in the selected date range."
                                            : "No expense records found."}
                                    </TableCell>
                                </TableRow>
                            ) : groupByMonth ? (
                                /* ── Grouped by Month ── */
                                groupedByMonth.map(([ym, rows]) => {
                                    const isCollapsed = collapsedMonths.has(ym);
                                    const monthTotal = rows.reduce((s, e) => s + e.amount, 0);
                                    return (
                                        <>
                                            {/* Month header row */}
                                            <TableRow
                                                key={`month-${ym}`}
                                                className="bg-muted/40 hover:bg-muted/50 cursor-pointer select-none"
                                                onClick={() => toggleMonth(ym)}
                                            >
                                                <TableCell colSpan={7} className="py-2.5 px-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {isCollapsed
                                                                ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                            <span className="font-bold text-sm text-foreground">
                                                                {formatMonthGroup(ym)}
                                                            </span>
                                                            <Badge variant="secondary" className="text-[10px] ml-1">
                                                                {rows.length} {rows.length === 1 ? "entry" : "entries"}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-sm font-bold text-destructive">
                                                            ₱{monthTotal.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {/* Month rows */}
                                            {!isCollapsed && renderRows(rows)}
                                        </>
                                    );
                                })
                            ) : (
                                /* ── Flat list ── */
                                renderRows(filtered)
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{mode === "add" ? "Record Expense" : "Edit Expense"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select
                                value={current.category}
                                onValueChange={v => setCurrent({ ...current, category: v as Expense["category"] })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => {
                                        const DIcon = categoryIcons[c];
                                        return (
                                            <SelectItem key={c} value={c}>
                                                <span className="flex items-center gap-2">
                                                    <DIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                                                    {c}
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description *</Label>
                            <Input
                                value={current.description}
                                onChange={e => setCurrent({ ...current, description: e.target.value })}
                                placeholder="e.g., Monthly electricity bill"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Amount (₱) *</Label>
                                <Input
                                    type="number"
                                    value={current.amount}
                                    onChange={e => setCurrent({ ...current, amount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={current.date}
                                    onChange={e => setCurrent({ ...current, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Paid By</Label>
                                <Input
                                    value={current.paidBy}
                                    onChange={e => setCurrent({ ...current, paidBy: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Receipt Ref</Label>
                                <Input
                                    value={current.receiptRef || ""}
                                    onChange={e => setCurrent({ ...current, receiptRef: e.target.value })}
                                    placeholder="Optional"
                                />
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
