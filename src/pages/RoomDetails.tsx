import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useData } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Home,
    Bed as BedIcon,
    AlertCircle,
    Info,
    WrenchIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { computeRoomStatus } from "@/context/DataContext";
import { toast } from "sonner";

const statusBadgeClass = (s: string) => {
    switch (s) {
        case "Available": return "bg-success text-white";
        case "Full": return "bg-primary text-white";
        case "Partial": return "bg-amber-500 text-white";
        case "Under Maintenance": return "bg-orange-500 text-white";
        default: return "bg-muted text-muted-foreground";
    }
};

const RoomDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { rooms, boarders, updateRoom, isLoading } = useData();

    const room = rooms.find((r) => r.id === id);
    const liveStatus = room ? computeRoomStatus(room.beds, !!room.underMaintenance) : "Available";
    const occupiedCount = room?.beds.filter(b => b.status === "Occupied").length || 0;
    const occupancyRate = room ? Math.round((occupiedCount / room.capacity) * 100) : 0;

    const handleMaintenanceToggle = async (val: boolean) => {
        if (!room) return;
        const updated = { ...room, underMaintenance: val };
        updated.status = computeRoomStatus(updated.beds, val);
        await updateRoom(updated);
        toast.success(val ? "Room set to Under Maintenance" : "Maintenance mode lifted");
    };

    if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div></AppLayout>;
    if (!room) return <AppLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Room not found</div></AppLayout>;

    return (
        <AppLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="page-header">{room.name}</h1>
                        <p className="page-subtitle">Detailed Room Status &amp; Occupancy</p>
                    </div>
                    <div className="ml-auto">
                        <Badge className={`${statusBadgeClass(liveStatus)} font-semibold`}>
                            {liveStatus}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* ── Sidebar info card ── */}
                    <Card className="lg:col-span-1 shadow-sm border-border/60">
                        <CardHeader className="bg-accent/5 pb-6">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-card rounded-2xl shadow-sm border border-border/40">
                                    <Home className="h-8 w-8 text-accent" />
                                </div>
                                <Badge className={`${statusBadgeClass(liveStatus)} font-semibold`}>
                                    {liveStatus}
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <CardTitle className="text-2xl font-bold">{room.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">₱{room.monthlyRate.toLocaleString()}/bed · Floor {room.floor || 1}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <span>Occupancy</span>
                                    <span>{occupancyRate}%</span>
                                </div>
                                <Progress value={occupancyRate} className="h-2" />
                                <p className="text-[10px] text-muted-foreground text-center">
                                    {occupiedCount} of {room.capacity} beds occupied
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center">
                                    <p className="text-xs text-muted-foreground uppercase mb-1">Max Revenue</p>
                                    <p className="text-lg font-bold tracking-tight">₱{(room.monthlyRate * room.capacity).toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-success/5 border border-success/10 text-center">
                                    <p className="text-xs text-success uppercase mb-1">Current Revenue</p>
                                    <p className="text-lg font-bold text-success tracking-tight">₱{(room.monthlyRate * occupiedCount).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Maintenance toggle */}
                            <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-3 gap-3">
                                <div className="flex items-center gap-2">
                                    <WrenchIcon className="h-4 w-4 text-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold leading-tight">Maintenance Mode</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight">Locks room as unavailable</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={!!room.underMaintenance}
                                    onCheckedChange={handleMaintenanceToggle}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Beds layout ── */}
                    <div className="lg:col-span-3 space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                            <BedIcon className="h-5 w-5 text-accent" /> Bed Layout &amp; Occupants
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {room.beds.map((bed) => {
                                const occupant = boarders.find((b) => b.id === bed.boarderId);
                                const isOccupied = bed.status === "Occupied";
                                return (
                                    <Card
                                        key={bed.id}
                                        className={`shadow-sm transition-all hover:shadow-md border-border/60 ${isOccupied ? "bg-accent/5 border-accent/20" : "bg-card"}`}
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isOccupied ? "bg-accent/10" : "bg-muted"}`}>
                                                        <BedIcon className={`h-6 w-6 ${isOccupied ? "text-accent" : "text-muted-foreground"}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground">{bed.name}</p>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-bold uppercase mt-0.5 ${isOccupied ? "text-accent border-accent/20 bg-accent/5" : "text-muted-foreground"}`}
                                                        >
                                                            {bed.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {isOccupied && occupant ? (
                                                    <Link
                                                        to={`/boarders/${occupant.id}`}
                                                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                                    >
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-foreground">{occupant.fullName}</p>
                                                            <p className="text-[10px] text-muted-foreground">Since {occupant.moveInDate}</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-full bg-accent/20 border-2 border-accent/10 flex items-center justify-center text-accent font-bold overflow-hidden">
                                                            {occupant.profilePhoto ? (
                                                                <img src={occupant.profilePhoto} alt={occupant.fullName} className="h-full w-full object-cover" />
                                                            ) : (
                                                                occupant.fullName.charAt(0)
                                                            )}
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-muted-foreground"
                                                        onClick={() => navigate("/boarders")}
                                                    >
                                                        Assign Boarder
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <Card className="shadow-sm border-border/60 mt-8">
                            <CardHeader className="pb-3 border-b border-border/40">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Room Compliance &amp; Maintenance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                                        <span className="text-sm">Last Inspection</span>
                                        <span className="text-sm font-semibold">October 15, 2023</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                                        <span className="text-sm">Utility Meter Access</span>
                                        <Badge variant="outline">Shared (Hallway 2)</Badge>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 mt-6 pt-6 border-t border-border/40">
                                    <Info className="h-4 w-4 text-accent mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Room status is <strong>automatically computed</strong> from bed occupancy.
                                        Toggle <em>Maintenance Mode</em> above to override it — this marks the room
                                        as unavailable regardless of bed records.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default RoomDetails;
