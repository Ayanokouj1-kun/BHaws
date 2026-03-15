import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Trash2, Edit, Eye, Filter, Building,
  MapPin, CheckCircle2, Users, Wrench, BedDouble, WrenchIcon, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Room } from "@/types";
import { toast } from "sonner";
import { computeRoomStatus } from "@/context/DataContext";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

type StatusFilter = "all" | Room["status"];

const STATUS_FILTERS: { value: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "all", label: "All", icon: <Filter className="h-3.5 w-3.5" />, color: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  { value: "Available", label: "Available", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-success/10 text-success border-success/30 hover:bg-success/20" },
  { value: "Partial", label: "Partial", icon: <Users className="h-3.5 w-3.5" />, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20" },
  { value: "Full", label: "Full", icon: <BedDouble className="h-3.5 w-3.5" />, color: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" },
  { value: "Under Maintenance", label: "Maintenance", icon: <Wrench className="h-3.5 w-3.5" />, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20" },
];

const statusInfo = (s: Room["status"]) => {
  switch (s) {
    case "Available": return { color: "bg-success/10 text-success border-success/20", dot: "bg-success" };
    case "Full": return { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" };
    case "Partial": return { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500" };
    case "Under Maintenance": return { color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", dot: "bg-orange-500" };
    default: return { color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" };
  }
};

const getBedBarColor = (status: Room["status"]) => {
  switch (status) {
    case "Full": return "bg-primary";
    case "Partial": return "bg-amber-500";
    case "Under Maintenance": return "bg-orange-500";
    default: return "bg-success";
  }
};

const RoomsPage = () => {
  const { rooms, addRoom, updateRoom, deleteRoom, isLoading, user } = useData();
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [currentRoom, setCurrentRoom] = useState<Partial<Room>>({
    name: "", capacity: 1, monthlyRate: 0, floor: 1, underMaintenance: false,
  });

  // Compute live status for every room from its beds
  const roomsWithStatus = useMemo(() =>
    rooms.map(r => ({
      ...r,
      status: computeRoomStatus(r.beds, !!r.underMaintenance),
    })),
    [rooms]
  );

  const filtered = useMemo(() => {
    return roomsWithStatus.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchesFloor = floorFilter === "all" || r.floor?.toString() === floorFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesFloor && matchesStatus;
    });
  }, [roomsWithStatus, search, floorFilter, statusFilter]);

  const floors = useMemo(() => {
    const f = Array.from(new Set(rooms.map(r => r.floor || 1)));
    return f.sort((a, b) => Number(a) - Number(b));
  }, [rooms]);

  // Count per status for badge counters on filter pills
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: roomsWithStatus.length };
    for (const r of roomsWithStatus) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [roomsWithStatus]);

  const handleOpenAdd = () => {
    setMode("add");
    setCurrentRoom({ name: "", capacity: 1, monthlyRate: 0, floor: 1, underMaintenance: false });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setMode("edit");
    setCurrentRoom(room);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!currentRoom.name || !currentRoom.monthlyRate || !currentRoom.capacity) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (mode === "add") {
      const roomId = `r${Date.now()}`;
      const beds = Array.from({ length: currentRoom.capacity || 0 }, (_, i) => ({
        id: `b${Date.now()}-${i}`,
        roomId,
        name: `Bed ${i + 1}`,
        status: "Available" as const,
      }));
      const room: Room = {
        ...currentRoom as Room,
        id: roomId,
        beds,
        status: computeRoomStatus(beds, !!currentRoom.underMaintenance),
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      addRoom(room);
      toast.success("Room added successfully");
    } else {
      const room = { ...currentRoom } as Room;
      const currentBeds = room.beds || [];

      if (room.capacity > currentBeds.length) {
        const diff = room.capacity - currentBeds.length;
        const newBeds = Array.from({ length: diff }, (_, i) => ({
          id: `b${Date.now()}-${i}`,
          roomId: room.id,
          name: `Bed ${currentBeds.length + i + 1}`,
          status: "Available" as const,
        }));
        room.beds = [...currentBeds, ...newBeds];
      } else if (room.capacity < currentBeds.length) {
        const extraBeds = currentBeds.slice(room.capacity);
        if (extraBeds.some(b => b.status === "Occupied")) {
          toast.error("Cannot decrease capacity: Some removed beds are occupied");
          return;
        }
        room.beds = currentBeds.slice(0, room.capacity);
      }

      // Allow Maintenance regardless of occupancy - user wants to "just lock it"
      room.status = computeRoomStatus(room.beds, !!room.underMaintenance);
      updateRoom(room);
      toast.success("Room updated successfully");
    }

    setIsDialogOpen(false);
  };

  const handleDeleteRoom = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        deleteRoom(id);
        toast.success("Room deleted");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete room");
      }
    }
  };

  if (isLoading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Rooms</h1>
            <p className="page-subtitle">Manage room inventory and floor assignments</p>
          </div>
          {isAdmin && (
            <Button className="gap-2 shadow-sm" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" /> Add Room
            </Button>
          )}
        </div>

        {/* ── Search + Floor filter row ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by room name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-[130px] bg-card border-border/60">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map(f => (
                  <SelectItem key={f} value={f.toString()}>Floor {f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Status filter pills ── */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label, icon, color }) => {
            const active = statusFilter === value;
            const count = counts[value] ?? 0;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer select-none",
                  active
                    ? `${color} shadow-sm ring-2 ring-offset-2 ring-offset-background ${value === "all" ? "ring-secondary-foreground/20" :
                      value === "Available" ? "ring-success/30" :
                        value === "Partial" ? "ring-amber-500/30" :
                          value === "Full" ? "ring-primary/30" :
                            "ring-orange-500/30"
                    }`
                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                ].join(" ")}
              >
                {icon}
                {label}
                <span className={`ml-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold ${active ? "bg-background/30" : "bg-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Room grid ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground space-y-3">
            <Building className="h-12 w-12 opacity-20" />
            <p className="font-semibold">No rooms found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((room) => {
              const occupied = room.beds.filter(b => b.status === "Occupied").length;
              const info = statusInfo(room.status);
              const barColor = getBedBarColor(room.status);

              return (
                <div
                  key={room.id}
                  className="group rounded-2xl p-5 border border-border/50 bg-card shadow-sm hover:bg-muted/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2.5 rounded-xl shrink-0 ${room.status === "Full" ? "bg-primary/10" : room.status === "Under Maintenance" ? "bg-orange-500/10" : "bg-success/10"}`}>
                          <Building className={`h-5 w-5 ${room.status === "Full" ? "text-primary" : room.status === "Under Maintenance" ? "text-orange-500 animate-pulse" : "text-success"}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="marquee-container overflow-hidden">
                            <Link
                              to={`/rooms/${room.id}`}
                              className="font-bold text-base text-foreground hover:text-accent transition-colors block leading-tight marquee-scroll"
                              title={room.name}
                            >
                              {room.name}
                            </Link>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest flex items-center gap-1 mt-1.5 opacity-60">
                            <MapPin className="h-3 w-3 shrink-0" /> Floor {room.floor || 1}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1.5 text-[10px] h-6 px-2 shrink-0 font-bold uppercase shadow-sm border-none ${info.color}`}
                        >
                          {room.underMaintenance ? <Lock className="h-3 w-3" /> : <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${info.dot}`} />}
                          {room.underMaintenance ? "Unavailable" : room.status}
                        </Badge>
                        <p className="font-extrabold text-sm text-foreground tracking-tight">₱{room.monthlyRate.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-muted/30">
                          <p className="text-muted-foreground mb-0.5 font-medium">Monthly Rate</p>
                          <p className="font-bold text-foreground">₱{room.monthlyRate.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-muted/30">
                          <p className="text-muted-foreground mb-0.5 font-medium">Occupancy</p>
                          <p className="font-bold text-foreground">{occupied}/{room.capacity} beds</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <span>Bed Utilization</span>
                          <span>{Math.round((occupied / (room.capacity || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                            style={{ width: `${(occupied / (room.capacity || 1)) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Bed dots */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {room.beds.map(bed => (
                          <div
                            key={bed.id}
                            title={`${bed.name}: ${bed.status}`}
                            className={`h-2.5 w-2.5 rounded-sm transition-colors ${bed.status === "Occupied" ? `${barColor} opacity-80` : "bg-muted border border-border/60"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 mt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 flex-1 text-xs gap-2 hover:bg-accent/5 hover:text-accent transition-colors"
                      asChild
                    >
                      <Link to={`/rooms/${room.id}`}><Eye className="h-3.5 w-3.5 text-accent" /> Details</Link>
                    </Button>
                    <div className="flex gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-accent/5 hover:text-accent transition-colors"
                          onClick={() => handleOpenEdit(room)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/5 transition-colors"
                          onClick={() => handleDeleteRoom(room.id, room.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Add New Room" : "Edit Room"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="room-name">Room Name *</Label>
                <Input
                  id="room-name"
                  value={currentRoom.name || ""}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, name: e.target.value })}
                  placeholder="e.g., Room 101"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="floor">Floor Level</Label>
                <Input
                  id="floor"
                  type="number"
                  min="1"
                  value={currentRoom.floor || ""}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, floor: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacity">Bed Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={currentRoom.capacity || ""}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rate">Monthly Rate (₱) *</Label>
                <Input
                  id="rate"
                  type="number"
                  value={currentRoom.monthlyRate || ""}
                  onChange={(e) => setCurrentRoom({ ...currentRoom, monthlyRate: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Maintenance toggle — the ONLY manual status control */}
            <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <WrenchIcon className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold">Under Maintenance</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Overrides bed status — room shown as unavailable
                  </p>
                </div>
              </div>
              <Switch
                checked={!!currentRoom.underMaintenance}
                onCheckedChange={(v) => {
                  setCurrentRoom({ ...currentRoom, underMaintenance: v });
                }}
              />
            </div>

            {/* Read-only computed status preview */}
            {(() => {
              const previewBeds = currentRoom.beds || [];
              const previewStatus = computeRoomStatus(previewBeds, !!currentRoom.underMaintenance);
              const info = statusInfo(previewStatus);
              return (
                <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5">
                  <span className="text-xs text-muted-foreground font-medium">Computed Status</span>
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase ${info.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full mr-1 ${info.dot}`} />
                    {previewStatus}
                  </Badge>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{mode === "add" ? "Create Room" : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RoomsPage;
