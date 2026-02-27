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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Wrench, AlertCircle, Clock, CheckCircle2, XCircle, Search, Trash2, Edit } from "lucide-react";
import { MaintenanceRequest } from "@/types";

const priorityColors: Record<string, string> = {
    Low: "bg-muted text-muted-foreground border-border",
    Medium: "bg-warning/10 text-warning border-warning/20",
    High: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    Urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusColors: Record<string, string> = {
    Open: "bg-accent/10 text-accent border-accent/20",
    "In Progress": "bg-warning/10 text-warning border-warning/20",
    Resolved: "bg-success/10 text-success border-success/20",
    Closed: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<string, React.ReactNode> = {
    Open: <AlertCircle className="h-3.5 w-3.5" />,
    "In Progress": <Clock className="h-3.5 w-3.5" />,
    Resolved: <CheckCircle2 className="h-3.5 w-3.5" />,
    Closed: <XCircle className="h-3.5 w-3.5" />,
};

const emptyForm = (): Partial<MaintenanceRequest> => ({
    roomId: "",
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
});

const MaintenancePage = () => {
    const { rooms, maintenance, addMaintenance, updateMaintenance, deleteMaintenance, isLoading } = useData();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [current, setCurrent] = useState<Partial<MaintenanceRequest>>(emptyForm());

    const filtered = maintenance.filter(m => {
        const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.description.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || m.status === statusFilter;
        const matchPriority = priorityFilter === "all" || m.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name ?? "Unknown Room";

    const stats = [
        { label: "Open", value: maintenance.filter(m => m.status === "Open").length, color: "text-accent" },
        { label: "In Progress", value: maintenance.filter(m => m.status === "In Progress").length, color: "text-warning" },
        { label: "Resolved", value: maintenance.filter(m => m.status === "Resolved").length, color: "text-success" },
        { label: "Urgent", value: maintenance.filter(m => m.priority === "Urgent").length, color: "text-destructive" },
    ];

    const handleOpenAdd = () => {
        setMode("add");
        setCurrent(emptyForm());
        setIsDialogOpen(true);
    };

    const handleEdit = (req: MaintenanceRequest) => {
        setMode("edit");
        setCurrent(req);
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!current.roomId || !current.title || !current.description) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (mode === "add") {
            addMaintenance({ ...current as MaintenanceRequest, id: `m${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] });
            toast.success("Maintenance request submitted");
        } else {
            updateMaintenance(current as MaintenanceRequest);
            toast.success("Request updated");
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this maintenance request?")) {
            deleteMaintenance(id);
            toast.success("Request deleted");
        }
    };

    const handleQuickStatus = (req: MaintenanceRequest, status: MaintenanceRequest["status"]) => {
        updateMaintenance({
            ...req, status,
            resolvedAt: status === "Resolved" ? new Date().toISOString().split("T")[0] : req.resolvedAt
        });
        toast.success(`Request marked as ${status}`);
    };

    if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;

    return (
        <AppLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="page-header">Maintenance</h1>
                        <p className="page-subtitle">Track and manage room maintenance requests</p>
                    </div>
                    <Button className="gap-2 shrink-0" onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4" /> New Request
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map(s => (
                        <div key={s.label} className="stat-card text-center">
                            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Priority" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead>Title</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Date Filed</TableHead>
                                <TableHead className="w-[180px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(req => (
                                <TableRow key={req.id} className="hover:bg-muted/20 group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                                <Wrench className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{req.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-foreground whitespace-nowrap">
                                        {getRoomName(req.roomId)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 h-6 ${priorityColors[req.priority]}`}>
                                            {req.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`flex items-center gap-1.5 w-fit text-[9px] font-bold uppercase whitespace-nowrap px-2 py-0.5 h-6 ${statusColors[req.status]}`}>
                                            <span className="shrink-0 scale-90">{statusIcons[req.status]}</span>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{req.createdAt}</TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <div className="flex gap-1 items-center justify-end flex-nowrap">
                                            {req.status === "Open" && (
                                                <Button size="sm" variant="ghost" className="h-8 text-xs text-warning hover:bg-warning/5" onClick={() => handleQuickStatus(req, "In Progress")}>
                                                    Start
                                                </Button>
                                            )}
                                            {req.status === "In Progress" && (
                                                <Button size="sm" variant="ghost" className="h-8 text-xs text-success hover:bg-success/5" onClick={() => handleQuickStatus(req, "Resolved")}>
                                                    Resolve
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors" onClick={() => handleEdit(req)}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5 transition-colors" onClick={() => handleDelete(req.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-14 text-muted-foreground italic">
                                        No maintenance requests found
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
                        <DialogTitle>{mode === "add" ? "New Maintenance Request" : "Edit Request"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Room *</Label>
                            <Select value={current.roomId} onValueChange={v => setCurrent({ ...current, roomId: v })}>
                                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                                <SelectContent>
                                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Title *</Label>
                            <Input value={current.title} onChange={e => setCurrent({ ...current, title: e.target.value })} placeholder="e.g., Leaking faucet" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description *</Label>
                            <Textarea value={current.description} onChange={e => setCurrent({ ...current, description: e.target.value })} placeholder="Describe the issue..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Priority</Label>
                                <Select value={current.priority} onValueChange={v => setCurrent({ ...current, priority: v as MaintenanceRequest["priority"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={current.status} onValueChange={v => setCurrent({ ...current, status: v as MaintenanceRequest["status"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{mode === "add" ? "Submit Request" : "Save Changes"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default MaintenancePage;
