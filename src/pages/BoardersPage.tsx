import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Mail, Phone, Edit, Trash2, Eye, User, Home, Calendar, ShieldCheck, Camera, X } from "lucide-react";
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
  const { boarders, rooms, addBoarder, updateBoarder, deleteBoarder, isLoading } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentBoarder, setCurrentBoarder] = useState<Partial<Boarder>>({
    fullName: "",
    contactNumber: "",
    email: "",
    address: "",
    emergencyContact: "",
    assignedRoomId: "",
    assignedBedId: "",
    moveInDate: new Date().toISOString().split('T')[0],
    advanceAmount: 0,
    depositAmount: 0,
    status: "Active",
    profilePhoto: "",
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
    return boarders.filter(b => {
      const matchesSearch = b.fullName.toLowerCase().includes(search.toLowerCase()) ||
        b.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [boarders, search, statusFilter]);

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
      emergencyContact: "", assignedRoomId: "", assignedBedId: "",
      moveInDate: new Date().toISOString().split('T')[0],
      advanceAmount: 0, depositAmount: 0, status: "Active",
      profilePhoto: "",
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
      addBoarder(boarder);
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

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Boarders</h1>
            <p className="page-subtitle">Directory of active and past residents</p>
          </div>
          <Button className="gap-2 shadow-sm" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4" /> Add Boarder
          </Button>
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
                <TableHead className="w-[60px] pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/20 transition-colors group">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      {b.profilePhoto ? (
                        <img src={b.profilePhoto} className="h-10 w-10 rounded-full object-cover border border-accent/20" alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-bold group-hover:bg-accent group-hover:text-white transition-all duration-300">
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
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Home className="h-3 w-3 text-muted-foreground" /> {getRoomName(b.assignedRoomId)}
                      </div>
                      <Badge variant="outline" className="w-fit text-[9px] font-bold px-1.5 py-0 bg-muted/30">
                        Bed {rooms.find(r => r.id === b.assignedRoomId)?.beds.find(bed => bed.id === b.assignedBedId)?.name || "?"}
                      </Badge>
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
                      <span className="text-xs font-bold text-success">₱{(b.advanceAmount + b.depositAmount).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase ${statusInfo(b.status)}`}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex gap-1 items-center transition-opacity flex-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => navigate(`/boarders/${b.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => handleOpenEdit(b)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id, b.fullName)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Register New Boarder" : "Edit Profile"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center justify-center pb-4">
                <div className="relative group">
                  <div className="h-24 w-24 rounded-2xl bg-muted border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden transition-all hover:border-accent/40">
                    {currentBoarder.profilePhoto ? (
                      <img src={currentBoarder.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl shadow-lg border border-border"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  {currentBoarder.profilePhoto && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-3">Profile Photo</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Full Name *
                </Label>
                <Input value={currentBoarder.fullName} onChange={(e) => setCurrentBoarder({ ...currentBoarder, fullName: e.target.value })} placeholder="Juan Dela Cruz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> Contact *
                  </Label>
                  <Input value={currentBoarder.contactNumber} onChange={(e) => setCurrentBoarder({ ...currentBoarder, contactNumber: e.target.value })} placeholder="09XXX" />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input type="email" value={currentBoarder.email} onChange={(e) => setCurrentBoarder({ ...currentBoarder, email: e.target.value })} placeholder="juan@gmail.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Home Address</Label>
                <Input value={currentBoarder.address} onChange={(e) => setCurrentBoarder({ ...currentBoarder, address: e.target.value })} placeholder="City, Province" />
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
                  <Home className="h-3.5 w-3.5" /> Accommodation
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold text-muted-foreground">Select Room</Label>
                    <Select value={currentBoarder.assignedRoomId} onValueChange={(val) => setCurrentBoarder({ ...currentBoarder, assignedRoomId: val, assignedBedId: "" })}>
                      <SelectTrigger className="bg-card"><SelectValue placeholder="Room" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name} ({r.beds.filter(bed => bed.status === "Available").length} av.)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold text-muted-foreground">Select Bed</Label>
                    <Select value={currentBoarder.assignedBedId} onValueChange={(val) => setCurrentBoarder({ ...currentBoarder, assignedBedId: val })} disabled={!currentBoarder.assignedRoomId}>
                      <SelectTrigger className="bg-card"><SelectValue placeholder="Bed" /></SelectTrigger>
                      <SelectContent>
                        {availableBeds.map((bed) => (
                          <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Move-in Date
                  </Label>
                  <Input type="date" value={currentBoarder.moveInDate} onChange={(e) => setCurrentBoarder({ ...currentBoarder, moveInDate: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Status
                  </Label>
                  <Select value={currentBoarder.status} onValueChange={(val: any) => setCurrentBoarder({ ...currentBoarder, status: val })}>
                    <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Evicted">Evicted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Advance (₱)</Label>
                  <Input type="number" value={currentBoarder.advanceAmount} onChange={(e) => setCurrentBoarder({ ...currentBoarder, advanceAmount: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deposit (₱)</Label>
                  <Input type="number" value={currentBoarder.depositAmount} onChange={(e) => setCurrentBoarder({ ...currentBoarder, depositAmount: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl px-8" onClick={handleSubmit}>{mode === "add" ? "Register Boarder" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default BoardersPage;
