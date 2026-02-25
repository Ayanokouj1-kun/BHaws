import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/hooks/useData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, BedDouble, Trash2, Edit, Eye, Filter, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Room } from "@/types";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Link } from "react-router-dom";

const RoomsPage = () => {
  const { rooms, addRoom, updateRoom, deleteRoom, isLoading } = useData();
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [currentRoom, setCurrentRoom] = useState<Partial<Room>>({
    name: "",
    capacity: 1,
    monthlyRate: 0,
    status: "Available",
    floor: 1,
  });

  const filtered = useMemo(() => {
    return rooms.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
      const matchesFloor = floorFilter === "all" || r.floor?.toString() === floorFilter;
      return matchesSearch && matchesFloor;
    });
  }, [rooms, search, floorFilter]);

  const statusInfo = (s: Room["status"]) => {
    switch (s) {
      case "Available": return { color: "bg-success/10 text-success border-success/20", label: "Available" };
      case "Full": return { color: "bg-primary/10 text-primary border-primary/20", label: "Occupied" };
      case "Partial": return { color: "bg-accent/10 text-accent border-accent/20", label: "Partial" };
      case "Under Maintenance": return { color: "bg-warning/10 text-warning border-warning/20", label: "Maintenance" };
      default: return { color: "bg-muted text-muted-foreground border-border", label: s };
    }
  };

  const floors = useMemo(() => {
    const f = Array.from(new Set(rooms.map(r => r.floor || 1)));
    return f.sort((a, b) => a - b);
  }, [rooms]);

  const handleOpenAdd = () => {
    setMode("add");
    setCurrentRoom({ name: "", capacity: 1, monthlyRate: 0, status: "Available", floor: 1 });
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
      const room: Room = {
        ...currentRoom as Room,
        id: roomId,
        beds: Array.from({ length: currentRoom.capacity || 0 }, (_, i) => ({
          id: `b${Date.now()}-${i}`,
          roomId: roomId,
          name: `Bed ${i + 1}`,
          status: "Available",
        })),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
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

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-header">Rooms</h1>
            <p className="page-subtitle">Manage room inventory and floor assignments</p>
          </div>
          <Button className="gap-2 shadow-sm" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by room name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/60"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-[140px] bg-card border-border/60">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((room) => {
            const occupied = room.beds.filter(b => b.status === "Occupied").length;
            const full = occupied === room.capacity;
            const info = statusInfo(room.status);

            return (
              <div
                key={room.id}
                className="group rounded-2xl p-5 border border-border/50 bg-card shadow-sm hover:bg-muted/40 hover:shadow-md transition-colors duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="relative mb-4">
                    {/* Status badge - absolute positioned to never affect flow */}
                    <div className="absolute -top-1 -right-1 z-10">
                      <Badge variant="outline" className={`text-[8px] h-4.5 px-1.5 shrink-0 font-black uppercase shadow-sm ${info.color}`}>
                        {info.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2.5 pr-16 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${full ? "bg-primary/10" : "bg-success/10"}`}>
                        <Building className={`h-4 w-4 ${full ? "text-primary" : "text-success"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link to={`/rooms/${room.id}`} className="font-bold text-sm text-foreground hover:text-accent transition-colors block leading-tight truncate">
                          {room.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 mt-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> Floor {room.floor || 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-muted/30">
                        <p className="text-muted-foreground mb-0.5 font-medium">Monthly Rate</p>
                        <p className="font-bold text-foreground">₱{room.monthlyRate.toLocaleString()}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/30">
                        <p className="text-muted-foreground mb-0.5 font-medium">Occupation</p>
                        <p className="font-bold text-foreground">{occupied}/{room.capacity} beds</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Beds Utilization</span>
                        <span>{Math.round((occupied / (room.capacity || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${full ? "bg-primary" : "bg-accent"}`}
                          style={{ width: `${(occupied / (room.capacity || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 flex-1 text-xs gap-2 hover:bg-muted/40"
                    asChild
                  >
                    <Link to={`/rooms/${room.id}`}><Eye className="h-3.5 w-3.5 text-accent" /> Details</Link>
                  </Button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-muted/40"
                      onClick={() => handleOpenEdit(room)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={currentRoom.status}
                onValueChange={(val: Room["status"]) => setCurrentRoom({ ...currentRoom, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Partial">Partial (Some Beds Occupied)</SelectItem>
                  <SelectItem value="Full">Full (Manually Set)</SelectItem>
                  <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
