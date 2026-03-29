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
import { Plus, Wrench, AlertCircle, Clock, CheckCircle2, XCircle, Search, Trash2, Edit, Droplets, Zap, Home, Tv, Hammer, ImagePlus, X, Image as ImageIcon, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

const categoryColors: Record<string, string> = {
    Plumbing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Electrical: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Structural: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    Appliance: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    Carpentry: "bg-amber-700/10 text-amber-800 border-amber-700/20",
    Other: "bg-muted text-muted-foreground border-border",
};

const categoryIcons: Record<string, any> = {
    Plumbing: Droplets,
    Electrical: Zap,
    Structural: Home,
    Appliance: Tv,
    Carpentry: Hammer,
    Other: Wrench,
};

const CATEGORIES = ["Plumbing", "Electrical", "Structural", "Appliance", "Carpentry", "Other"] as const;

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
    category: "Other",
    priority: "Medium",
    status: "Open",
    images: [],
});

const MaintenancePage = () => {
    const { rooms, maintenance, addMaintenance, updateMaintenance, deleteMaintenance, isLoading, user, boarders } = useData();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [current, setCurrent] = useState<Partial<MaintenanceRequest>>(emptyForm());

    // View Details modal
    const [viewReq, setViewReq] = useState<MaintenanceRequest | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    // Lightbox
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);

    const openLightbox = (images: string[], index: number) => {
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxSrc(images[index]);
    };
    const closeLightbox = () => setLightboxSrc(null);
    const lightboxPrev = () => {
        const newIdx = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        setLightboxIndex(newIdx);
        setLightboxSrc(lightboxImages[newIdx]);
    };
    const lightboxNext = () => {
        const newIdx = (lightboxIndex + 1) % lightboxImages.length;
        setLightboxIndex(newIdx);
        setLightboxSrc(lightboxImages[newIdx]);
    };

    const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
    const isStaff = user?.role === "Staff";
    const isBoarder = user?.role === "Boarder";

    const filtered = maintenance.filter(m => {
        // Security: Boarders only see their own requests (or requests for their room)
        if (isBoarder && m.boarderId !== user?.boarderId) return false;

        const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.description.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || m.status === statusFilter;
        const matchPriority = priorityFilter === "all" || m.priority === priorityFilter;
        return matchSearch && matchStatus && matchPriority;
    });

    const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name ?? "Unknown Room";

    const statsList = [
        { label: "Open", value: filtered.filter(m => m.status === "Open").length, color: "text-accent", bgColor: "bg-accent/10", icon: AlertCircle },
        { label: "In Progress", value: filtered.filter(m => m.status === "In Progress").length, color: "text-warning", bgColor: "bg-warning/10", icon: Clock },
        { label: "Resolved", value: filtered.filter(m => m.status === "Resolved").length, color: "text-success", bgColor: "bg-success/10", icon: CheckCircle2 },
        { label: "Urgent", value: filtered.filter(m => m.priority === "Urgent").length, color: "text-destructive", bgColor: "bg-destructive/10", icon: Wrench },
    ];

    const handleOpenAdd = () => {
        setMode("add");
        const boarder = boarders.find(b => b.id === user?.boarderId);
        setCurrent({
            ...emptyForm(),
            boarderId: user?.boarderId,
            roomId: boarder?.assignedRoomId || ""
        });
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
            addMaintenance({
                ...current as MaintenanceRequest,
                id: `m${Date.now()}`,
                createdAt: new Date().toISOString().split("T")[0],
                boarderId: user?.boarderId || current.boarderId,
                status: "Open"
            });
            toast.success("Maintenance request submitted");
        } else {
            updateMaintenance(current as MaintenanceRequest);
            toast.success("Request updated");
        }
        setIsDialogOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentImages = current.images || [];
        if (currentImages.length + files.length > 4) {
            toast.error("Maximum 4 photos allowed");
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setCurrent(prev => ({
                    ...prev,
                    images: [...(prev.images || []), base64]
                }));
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ""; // Reset input
    };

    const removeImage = (index: number) => {
        setCurrent(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }));
    };

    const handleDelete = (id: string) => {
        if (!isAdmin) {
            toast.error("Unauthorized: Only admins can delete requests.");
            return;
        }
        if (confirm("Delete this maintenance request?")) {
            deleteMaintenance(id);
            toast.success("Request deleted");
        }
    };

    const handleQuickStatus = (req: MaintenanceRequest, status: MaintenanceRequest["status"]) => {
        if (isBoarder) return;
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
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                            <Wrench className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="page-header">Maintenance</h1>
                            <p className="page-subtitle">Track and manage room maintenance requests</p>
                        </div>
                    </div>
                    <Button className="gap-2 shrink-0" onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4" /> New Request
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsList.map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="stat-card flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${s.bgColor}`}>
                                    <Icon className={`h-6 w-6 ${s.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                </div>
                            </div>
                        );
                    })}
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
                            {filtered.length > 0 ? (
                                filtered.map((req) => {
                                    const Icon = categoryIcons[req.category || "Other"];
                                    return (
                                        <TableRow key={req.id} className="hover:bg-muted/20 group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${categoryColors[req.category || "Other"]}`}>
                                                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-foreground truncate">{req.title}</p>
                                                            {req.images && req.images.length > 0 && (
                                                                <Badge variant="secondary" className="h-4 px-1 text-[8px] gap-1 bg-accent/5 text-accent border-accent/20">
                                                                    <ImageIcon className="h-2 w-2" /> {req.images.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-foreground uppercase tracking-tight">{getRoomName(req.roomId)}</span>
                                                    <Badge variant="outline" className={`w-fit text-[8px] font-bold uppercase h-4 px-1.5 ${categoryColors[req.category || "Other"]}`}>
                                                        {req.category || "Other"}
                                                    </Badge>
                                                </div>
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
                                                    {/* Show button — always visible */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-xs gap-1 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors"
                                                        onClick={() => { setViewReq(req); setIsViewOpen(true); }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" /> Show
                                                    </Button>
                                                    {!isBoarder && req.status === "Open" && (
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs text-warning hover:bg-warning/5" onClick={() => handleQuickStatus(req, "In Progress")}>
                                                            Start
                                                        </Button>
                                                    )}
                                                    {!isBoarder && req.status === "In Progress" && (
                                                        <Button size="sm" variant="ghost" className="h-8 text-xs text-success hover:bg-success/5" onClick={() => handleQuickStatus(req, "Resolved")}>
                                                            Resolve
                                                        </Button>
                                                    )}
                                                    {!isBoarder && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors" onClick={() => handleEdit(req)}>
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    {isAdmin && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5 transition-colors" onClick={() => handleDelete(req.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
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

            {/* ── View Details Modal ── */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {viewReq && (() => { const Icon = categoryIcons[viewReq.category || "Other"]; return <Icon className="h-4 w-4" />; })()}
                            {viewReq?.title}
                        </DialogTitle>
                    </DialogHeader>

                    {viewReq && (
                        <div className="space-y-5 py-2">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 h-6 ${statusColors[viewReq.status]}`}>
                                    <span className="mr-1 scale-90">{statusIcons[viewReq.status]}</span>
                                    {viewReq.status}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 h-6 ${priorityColors[viewReq.priority]}`}>
                                    {viewReq.priority}
                                </Badge>
                                <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 h-6 ${categoryColors[viewReq.category || "Other"]}`}>
                                    {viewReq.category || "Other"}
                                </Badge>
                            </div>

                            {/* Meta info */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Room</p>
                                    <p className="font-semibold text-foreground">{getRoomName(viewReq.roomId)}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Filed</p>
                                    <p className="font-semibold text-foreground">{viewReq.createdAt}</p>
                                </div>
                                {viewReq.resolvedAt && (
                                    <div className="space-y-0.5 col-span-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resolved On</p>
                                        <p className="font-semibold text-success">{viewReq.resolvedAt}</p>
                                    </div>
                                )}
                            </div>

                            {/* Issue Description */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Issue Description</p>
                                <div className="rounded-lg border border-border bg-muted/30 p-3">
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{viewReq.description}</p>
                                </div>
                            </div>

                            {/* Photos */}
                            {viewReq.images && viewReq.images.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <ImageIcon className="h-3.5 w-3.5" /> Attached Photos ({viewReq.images.length})
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {viewReq.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted group cursor-zoom-in"
                                                onClick={() => openLightbox(viewReq.images!, idx)}
                                            >
                                                <img src={img} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" alt={`Photo ${idx + 1}`} />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-center">Click a photo to view fullscreen</p>
                                </div>
                            )}

                            {(!viewReq.images || viewReq.images.length === 0) && (
                                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border text-muted-foreground">
                                    <ImageIcon className="h-4 w-4" />
                                    <p className="text-xs italic">No photos attached to this request.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                        {!isBoarder && viewReq && (
                            <Button onClick={() => { setIsViewOpen(false); handleEdit(viewReq); }}>
                                <Edit className="h-3.5 w-3.5 mr-1" /> Edit Request
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Lightbox ── */}
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Prev */}
                    {lightboxImages.length > 1 && (
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white z-10"
                            onClick={e => { e.stopPropagation(); lightboxPrev(); }}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}

                    <img
                        src={lightboxSrc}
                        className="max-h-[88vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
                        alt="Fullscreen photo"
                        onClick={e => e.stopPropagation()}
                    />

                    {/* Next */}
                    {lightboxImages.length > 1 && (
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white z-10"
                            onClick={e => { e.stopPropagation(); lightboxNext(); }}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}

                    {/* Close */}
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/25 transition-colors text-white"
                        onClick={closeLightbox}
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Counter */}
                    {lightboxImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-bold">
                            {lightboxIndex + 1} / {lightboxImages.length}
                        </div>
                    )}
                </div>
            )}

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{mode === "add" ? "New Maintenance Request" : "Edit Request"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
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
                                <Label>Category *</Label>
                                <Select value={current.category} onValueChange={v => setCurrent({ ...current, category: v as MaintenanceRequest["category"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c}>
                                                <div className="flex items-center gap-2">
                                                    {(() => { const Icon = categoryIcons[c]; return <Icon className="h-3.5 w-3.5" />; })()}
                                                    {c}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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

                        {/* Photo Attachment Section */}
                        <div className="grid gap-2 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    Photos <span className="text-[10px] text-muted-foreground">(Max 4)</span>
                                </Label>
                                <span className="text-[10px] font-bold text-muted-foreground">{current.images?.length || 0}/4</span>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {current.images?.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted group">
                                        <img src={img} className="h-full w-full object-cover" alt="" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {(current.images?.length || 0) < 4 && (
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 hover:border-accent/40 transition-all">
                                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-[9px] font-bold text-muted-foreground">ADD</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                                    </label>
                                )}
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
