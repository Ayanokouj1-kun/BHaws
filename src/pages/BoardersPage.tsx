import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail, Phone, Edit, Trash2, Eye, User, Home, Calendar, ShieldCheck, Camera, X, Lock, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boarder } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const BoardersPage = () => {
  const { boarders, rooms, profiles, payments, addBoarder, updateBoarder, deleteBoarder, addUser, isLoading, user } = useData();
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentMonthStr = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const [currentBoarder, setCurrentBoarder] = useState<Partial<Boarder>>({
    fullName: "",
    contactNumber: "",
    email: "",
    address: "",
    emergencyContact: "",
    gender: "Male",
    assignedRoomId: "",
    assignedBedId: "",
    moveInDate: new Date().toISOString().split('T')[0],
    advanceAmount: 0,
    depositAmount: 0,
    status: "Active",
    profilePhoto: "",
    createAccount: false,
    username: "",
  });

  const navigate = useNavigate();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Photo size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentBoarder(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setCurrentBoarder(prev => ({ ...prev, profilePhoto: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = useMemo(() => {
    return boarders
      .filter(b => {
        const matchesSearch = b.fullName.toLowerCase().includes(search.toLowerCase()) ||
          b.email.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.fullName.localeCompare(b.fullName);
        if (sortBy === "name-desc") return b.fullName.localeCompare(a.fullName);
        if (sortBy === "date-asc") return new Date(a.moveInDate).getTime() - new Date(b.moveInDate).getTime();
        if (sortBy === "date-desc") return new Date(b.moveInDate).getTime() - new Date(a.moveInDate).getTime();
        return 0;
      });
  }, [boarders, search, statusFilter, sortBy]);

  const getRoomName = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.name ?? "—";
  };

  const statusInfo = (s: string) => {
    switch (s) {
      case "Active": return "bg-success/10 text-success border-success/20";
      case "Inactive": return "bg-muted text-muted-foreground border-border";
      case "Evicted": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "";
    }
  };

  const handleOpenAdd = () => {
    setMode("add");
    setCurrentBoarder({
      fullName: "", contactNumber: "", email: "", address: "",
      emergencyContact: "", gender: "Male", assignedRoomId: "", assignedBedId: "",
      moveInDate: new Date().toISOString().split('T')[0],
      advanceAmount: 0, depositAmount: 0, status: "Active",
      profilePhoto: "",
      createAccount: false,
      username: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (boarder: Boarder) => {
    setMode("edit");
    setCurrentBoarder(boarder);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!currentBoarder.fullName || !currentBoarder.contactNumber || !currentBoarder.assignedRoomId || !currentBoarder.assignedBedId) {
      toast.error("Required fields: Name, Contact, Room, Bed");
      return;
    }

    if (mode === "add") {
      const boarder: Boarder = {
        ...currentBoarder as Boarder,
        id: `bo${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      addBoarder(boarder).then((nb) => {
        if (currentBoarder.createAccount && currentBoarder.username && nb) {
          addUser({
            username: currentBoarder.username,
            fullName: boarder.fullName,
            role: "Boarder",
            boarderId: nb.id,
          });
        }
      });
      toast.success("Boarder registered successfully");
    } else {
      updateBoarder(currentBoarder as Boarder);
      toast.success("Profile updated");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove records for ${name}? This will mark their bed as available.`)) {
      deleteBoarder(id);
      toast.success("Boarder removed");
    }
  };

  const selectedRoom = rooms.find(r => r.id === currentBoarder.assignedRoomId);
  const availableBeds = selectedRoom?.beds.filter(b => b.status === "Available" || b.id === currentBoarder.assignedBedId) || [];

  const hasAvailableBeds = rooms.some(r => r.beds.some(b => b.status === "Available"));

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Boarders</h1>
            <p className="page-subtitle">Directory of active and past residents</p>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <Button className="gap-2 shadow-sm" onClick={handleOpenAdd} disabled={!hasAvailableBeds}>
              <Plus className="h-4 w-4" /> Add Boarder
            </Button>
            {!hasAvailableBeds && (
              <p className="text-[10px] text-destructive mt-1.5 font-semibold text-right max-w-[200px] leading-tight flex items-start gap-1">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                All rooms are full. Add a new room or free up a bed first.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-card border-border/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Evicted">Evicted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-card border-border/60">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground pl-6">Boarder Profile</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Placement</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Contact Detail</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Finance</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow
                  key={b.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      {b.profilePhoto ? (
                        <img
                          src={b.profilePhoto}
                          className="h-10 w-10 rounded-full object-cover border border-accent/20"
                          alt="Boarder profile"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-bold transition-transform duration-200 group-hover:scale-[1.03]">
                          {b.fullName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <button onClick={() => navigate(`/boarders/${b.id}`)} className="font-bold text-sm text-foreground hover:text-accent truncate block">
                          {b.fullName}
                        </button>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> In: {b.moveInDate}
                        </p>
                        {profiles.some(p => p.boarderId === b.id) && (
                           <div className="flex items-center gap-1 mt-1">
                             <ShieldCheck className="h-2.5 w-2.5 text-success" />
                             <span className="text-[8px] font-bold text-success uppercase tracking-wider">Has Login Account</span>
                           </div>
                        )}
                        {payments.some(p => p.boarderId === b.id && p.status === "Overdue") && (
                           <div className="flex items-center gap-1 mt-1">
                             <AlertCircle className="h-2.5 w-2.5 text-destructive animate-pulse" />
                             <span className="text-[8px] font-bold text-destructive uppercase tracking-wider">Overdue Payment</span>
                           </div>
                        )}
                        {!payments.some(p => p.boarderId === b.id && p.status === "Overdue") && (() => {
                           const hasPaid = payments.some(p => p.boarderId === b.id && p.type === "Monthly Rent" && p.month === currentMonthStr && p.status === "Paid");
                           const isNew = b.moveInDate && new Date(b.moveInDate).toLocaleString("default", { month: "long", year: "numeric" }) === currentMonthStr;
                           const paidInitial = (b.depositAmount || 0) >= (rooms.find(r => r.id === b.assignedRoomId)?.monthlyRate || 0);
                           
                           if (hasPaid || (isNew && paidInitial)) return null;
                           
                           return (
                             <div className="flex items-center gap-1 mt-1">
                               <Clock className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                               <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider">Unpaid This Month</span>
                             </div>
                           );
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="marquee-container overflow-hidden">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground marquee-scroll" title={getRoomName(b.assignedRoomId)}>
                          <Home className="h-3.5 w-3.5 text-accent shrink-0" /> {getRoomName(b.assignedRoomId)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-muted/30">
                          {rooms.find(r => r.id === b.assignedRoomId)?.beds.find(bed => bed.id === b.assignedBedId)?.name || "Bed ?"}
                        </Badge>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-70">
                          Floor {rooms.find(r => r.id === b.assignedRoomId)?.floor || 1}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 text-xs text-foreground group-hover:text-accent transition-colors">
                        <Phone className="h-3 w-3 text-muted-foreground" /> {b.contactNumber}
                      </p>
                      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Mail className="h-3 w-3" /> {b.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Paid Total</span>
                      <span className="text-xs font-bold text-success">₱{(b.depositAmount ?? 0).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase ${statusInfo(b.status)}`}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 whitespace-nowrap">
                    <div className="flex gap-1 items-center justify-end flex-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors"
                        onClick={() => navigate(`/boarders/${b.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors"
                        onClick={() => handleOpenEdit(b)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/5 transition-colors"
                          onClick={() => handleDelete(b.id, b.fullName)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">No boarders found matching your search.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-border/50">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <User className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold">
                {mode === "add" ? "Register New Boarder" : "Edit Boarder Profile"}
              </DialogTitle>
              <p className="text-[9px] text-muted-foreground mt-0.5 hidden sm:block">Fill in the details below</p>
            </div>
          </div>

          {/* Body — stacked on mobile, side-by-side on md+ */}
          <div className="flex flex-col md:flex-row md:divide-x md:divide-border/50 max-h-[65vh] md:max-h-[60vh] overflow-y-auto md:overflow-hidden">

            {/* ── LEFT PANEL: Photo + Accommodation ── */}
            <div className="md:w-[200px] md:shrink-0 flex flex-col gap-3 px-3 sm:px-4 py-3 bg-muted/20 md:overflow-y-auto border-b border-border/40 md:border-b-0">

              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative group">
                  <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-xl bg-muted border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden transition-all hover:border-accent/50 shadow-sm" style={{ height: '72px', width: '72px' }}>
                    {currentBoarder.profilePhoto ? (
                      <img src={currentBoarder.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-lg shadow-md border border-border"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3 w-3" />
                  </Button>
                  {currentBoarder.profilePhoto && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full shadow-md"
                      onClick={removePhoto}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Photo</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>

              <div className="border-t border-border/40" />

              {/* Accommodation */}
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-accent">
                  <Home className="h-3 w-3" /> Accommodation
                </p>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Room *</Label>
                    <Select
                      value={currentBoarder.assignedRoomId}
                      onValueChange={(val) => {
                        const room = rooms.find(r => r.id === val);
                        const rate = room?.monthlyRate ?? 0;
                        setCurrentBoarder({
                          ...currentBoarder,
                          assignedRoomId: val,
                          assignedBedId: "",
                          depositAmount: rate,
                          advanceAmount: 0,
                        });
                      }}
                    >
                      <SelectTrigger className="bg-card h-8 text-xs"><SelectValue placeholder="Select room" /></SelectTrigger>
                      <SelectContent side="bottom" className="max-h-[250px]">
                        {rooms.filter(r => !r.underMaintenance).map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name} ({r.beds.filter(bed => bed.status === "Available").length} av.)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Bed *</Label>
                    <Select value={currentBoarder.assignedBedId} onValueChange={(val) => setCurrentBoarder({ ...currentBoarder, assignedBedId: val })} disabled={!currentBoarder.assignedRoomId}>
                      <SelectTrigger className="bg-card h-8 text-xs"><SelectValue placeholder="Select bed" /></SelectTrigger>
                      <SelectContent>
                        {availableBeds.map((bed) => (
                          <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40" />

              {/* Move-in + Status */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Move-in Date
                  </Label>
                  <Input
                    type="date"
                    value={currentBoarder.moveInDate}
                    onChange={(e) => setCurrentBoarder({ ...currentBoarder, moveInDate: e.target.value })}
                    className="h-8 px-2 text-xs bg-card"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" /> Status
                  </Label>
                  <Select value={currentBoarder.status} onValueChange={(val: any) => setCurrentBoarder({ ...currentBoarder, status: val })}>
                    <SelectTrigger className="bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Evicted">Evicted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL: Personal Info ── */}
            <div className="flex-1 flex flex-col gap-3 px-3 sm:px-4 py-3 md:overflow-y-auto">

              {/* Personal Info */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Personal Information</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <User className="h-3 w-3" /> Full Name *
                    </Label>
                    <Input
                      value={currentBoarder.fullName}
                      onChange={(e) => setCurrentBoarder({ ...currentBoarder, fullName: e.target.value })}
                      placeholder="Juan Dela Cruz"
                      className="h-8 px-2 text-xs bg-card"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Gender</Label>
                    <Select
                      value={currentBoarder.gender}
                      onValueChange={(val: "Male" | "Female" | "Other") => setCurrentBoarder({ ...currentBoarder, gender: val })}
                    >
                      <SelectTrigger className="bg-card h-8 text-xs"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Phone className="h-3 w-3" /> Contact *
                    </Label>
                    <Input
                      value={currentBoarder.contactNumber}
                      onChange={(e) => setCurrentBoarder({ ...currentBoarder, contactNumber: e.target.value })}
                      placeholder="09XXXXXXXXX"
                      className="h-9 px-3 text-xs bg-card"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Mail className="h-3 w-3" /> Email
                    </Label>
                    <Input
                      type="email"
                      value={currentBoarder.email}
                      onChange={(e) => setCurrentBoarder({ ...currentBoarder, email: e.target.value })}
                      placeholder="juan@email.com"
                      className="h-9 px-3 text-xs bg-card"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Home Address</Label>
                  <Input
                    value={currentBoarder.address}
                    onChange={(e) => setCurrentBoarder({ ...currentBoarder, address: e.target.value })}
                    placeholder="City, Province"
                    className="h-9 px-3 text-xs bg-card"
                  />
                  </div>
                <div className="grid gap-1.5">
                  <Label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    <AlertCircle className="h-3 w-3" /> Emergency Contact
                  </Label>
                  <Input
                    value={currentBoarder.emergencyContact}
                    onChange={(e) => setCurrentBoarder({ ...currentBoarder, emergencyContact: e.target.value })}
                    placeholder="Name & Number"
                    className="h-9 px-3 text-xs bg-card"
                  />
                </div>
                </div>

                {mode === "add" && (

                  <div className="space-y-3 p-3 rounded-xl border border-accent/20 bg-accent/5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                        <Lock className="h-3 w-3" /> System Account
                      </Label>
                      <input 
                        type="checkbox" 
                        checked={currentBoarder.createAccount} 
                        onChange={(e) => setCurrentBoarder({...currentBoarder, createAccount: e.target.checked})}
                        className="rounded border-border"
                      />
                    </div>
                    {currentBoarder.createAccount && (
                      <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-1">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Login Username</Label>
                        <Input 
                          placeholder="e.g. juan123" 
                          value={currentBoarder.username}
                          onChange={(e) => setCurrentBoarder({...currentBoarder, username: e.target.value})}
                          className="h-8 text-xs bg-card"
                        />
                        <p className="text-[8px] text-muted-foreground">Default password will be the same as username.</p>
                      </div>
                    )}
                  </div>
                )}


              <div className="border-t border-border/40" />

              {/* Finance */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Initial Payments</p>

                {/* Room rate info */}
                {selectedRoom && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/40 px-2.5 py-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Room Rate</span>
                    <span className="text-xs font-bold text-foreground">₱{selectedRoom.monthlyRate.toLocaleString()} / mo</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* Deposit — manually entered */}
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Deposit (₱)</Label>
                    <Input
                      type="number"
                      value={currentBoarder.depositAmount}
                      onChange={(e) => {
                        const deposit = Number(e.target.value);
                        const rate = selectedRoom?.monthlyRate ?? 0;
                        const advance = deposit > rate ? deposit - rate : 0;
                        setCurrentBoarder({ ...currentBoarder, depositAmount: deposit, advanceAmount: advance });
                      }}
                      className="h-8 px-2 text-xs bg-card"
                    />
                  </div>

                  {/* Advance — auto-calculated */}
                  <div className="grid gap-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      Advance (₱)
                      <span className="text-[8px] text-accent font-semibold normal-case tracking-normal">(auto)</span>
                    </Label>
                    <div className="flex items-center h-8 px-2 rounded-md border border-border/60 bg-muted/30 text-xs font-mono text-foreground">
                      <span className="flex-1">{(currentBoarder.advanceAmount ?? 0).toLocaleString()}</span>
                      <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Breakdown summary */}
                <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 space-y-1">
                  {selectedRoom && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">Covers Rent</span>
                      <span className="font-bold text-foreground">
                        {(currentBoarder.depositAmount ?? 0) >= selectedRoom.monthlyRate ? "✓ 1 month" : `₱${((currentBoarder.depositAmount ?? 0)).toLocaleString()} of ₱${selectedRoom.monthlyRate.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {(currentBoarder.advanceAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-[9px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">Advance Credit</span>
                      <span className="font-bold text-accent">₱{(currentBoarder.advanceAmount ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] border-t border-accent/20 pt-1.5 mt-1">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Total Collected</span>
                    {/* Advance is already inside deposit, NOT added on top */}
                    <span className="font-bold text-accent text-sm">
                      ₱{(currentBoarder.depositAmount ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedRoom && (currentBoarder.depositAmount ?? 0) < selectedRoom.monthlyRate && (currentBoarder.depositAmount ?? 0) > 0 && (
                  <p className="text-[9px] text-warning font-semibold">
                    ⚠ Deposit is below room rate — ₱{(selectedRoom.monthlyRate - (currentBoarder.depositAmount ?? 0)).toLocaleString()} short
                  </p>
                )}
            </div>
          </div>
        </div>

          {/* Footer */}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 border-t border-border/50 bg-muted/10">
            <p className="text-[10px] text-muted-foreground">Fields marked * are required</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" className="rounded-xl flex-1 sm:flex-none" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-xl px-6 flex-1 sm:flex-none" onClick={handleSubmit}>
                {mode === "add" ? "Register Boarder" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default BoardersPage;
