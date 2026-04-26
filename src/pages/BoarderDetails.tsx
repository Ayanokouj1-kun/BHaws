import { AppLayout } from "@/components/layout/AppLayout";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    Home,
    User as UserIcon,
    Clock,
    Printer,
    FileText,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BoarderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { boarders, rooms, payments, isLoading, user } = useData();
    const role = user?.role || "Boarder";

    const boarder = boarders.find((b) => b.id === id);

    // Security check: Boarders can only see their own profile
    if (role === "Boarder" && user?.boarderId !== id) {
        return <AppLayout><div className="flex items-center justify-center h-64 text-destructive font-bold">Unauthorized Access</div></AppLayout>;
    }

    const boarderPayments = payments.filter((p) => p.boarderId === id);
    const overduePayments = boarderPayments.filter((p) => p.status === "Overdue");
    const currentMonthStr = new Date().toLocaleString("default", { month: "long", year: "numeric" });
    
    const room = rooms.find((r) => r.id === boarder?.assignedRoomId);
    const bed = room?.beds.find((b) => b.id === boarder?.assignedBedId);
    
    const hasPaidCurrentMonth = boarderPayments.some(p => p.type === "Monthly Rent" && p.month === currentMonthStr && p.status === "Paid");

    const [emergencyName, emergencyInfo] = (boarder?.emergencyContact || "").split(" - ");

    if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;
    if (!boarder) return <AppLayout><div>Boarder not found</div></AppLayout>;

    return (
        <AppLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/boarders")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="page-header">{boarder.fullName}</h1>
                        <p className="page-subtitle">Boarder Profile & Payment History</p>
                    </div>
                </div>

                {overduePayments.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive shadow-md text-sm text-destructive font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                        <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
                        <span className="flex-1">WARNING: This boarder has {overduePayments.length} overdue payment(s) totaling ₱{overduePayments.reduce((s,p)=>s+p.amount+(p.lateFee||0), 0).toLocaleString()}. Please follow up.</span>
                        {role !== "Boarder" && (
                            <Button size="sm" className="ml-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3 text-xs font-bold" onClick={() => navigate("/payments")}>
                                Manage Payments →
                            </Button>
                        )}
                    </div>
                )}

                {!hasPaidCurrentMonth && overduePayments.length === 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-warning/20 border border-warning/50 shadow-md text-sm text-amber-600 dark:text-amber-400 font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                        <AlertCircle className="h-5 w-5 shrink-0 animate-pulse" />
                        <span className="flex-1">NOTICE: Monthly rent for the current month ({currentMonthStr}) has not been settled yet.</span>
                        {role !== "Boarder" && (
                            <Button size="sm" className="ml-auto bg-amber-500 text-white hover:bg-amber-600 h-8 px-3 text-xs font-bold" onClick={() => navigate("/payments")}>
                                Record Payment →
                            </Button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 shadow-sm border-border/60 overflow-hidden">
                        <div className="h-32 bg-accent/10 relative">
                            <div className="absolute -bottom-12 left-6">
                                <div className="h-24 w-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center text-accent text-3xl font-bold overflow-hidden">
                                    {boarder.profilePhoto ? (
                                        <img src={boarder.profilePhoto} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                        boarder.fullName.charAt(0)
                                    )}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-16 pb-8 space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">Personal Information</h3>
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">{boarder.status}</Badge>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-muted rounded-lg"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                                        <span>{boarder.email || "No email provided"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-muted rounded-lg"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                                        <span>{boarder.contactNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-muted rounded-lg"><MapPin className="h-4 w-4 text-muted-foreground" /></div>
                                        <span>{boarder.address}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 bg-muted rounded-lg"><Calendar className="h-4 w-4 text-muted-foreground" /></div>
                                        <span>Moved in: {boarder.moveInDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border/40">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">Emergency Contact</h3>
                                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                                    <p className="text-sm font-semibold text-foreground">
                                        {emergencyName || "Not specified"}
                                    </p>
                                    {emergencyInfo && (
                                        <p className="text-xs text-muted-foreground mt-1">{emergencyInfo}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="shadow-sm border-border/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Home className="h-3.5 w-3.5" /> Room Assignment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{room?.name || "N/A"}</p>
                                            <p className="text-sm text-muted-foreground">{bed?.name || "No bed assigned"}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                            <Home className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-border/60">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard className="h-3.5 w-3.5" /> Initial Fees
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Advance: ₱{boarder.advanceAmount.toLocaleString()}</p>
                                            <p className="text-sm font-medium text-foreground">Deposit: ₱{boarder.depositAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm border-border/60">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-accent" /> Payment History
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="text-accent text-xs">View All</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="text-xs uppercase font-bold">Month</TableHead>
                                            <TableHead className="text-xs uppercase font-bold">Receipt #</TableHead>
                                            <TableHead className="text-xs uppercase font-bold">Type</TableHead>
                                            <TableHead className="text-xs uppercase font-bold">Amount</TableHead>
                                            <TableHead className="text-xs uppercase font-bold">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {boarderPayments.length > 0 ? (
                                            boarderPayments.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-muted/20">
                                                    <TableCell className="text-sm font-medium">{p.month || p.date}</TableCell>
                                                    <TableCell className="text-xs font-mono text-muted-foreground">{p.receiptNumber || 'N/A'}</TableCell>
                                                    <TableCell className="text-sm">{p.type}</TableCell>
                                                    <TableCell className="text-sm font-bold">₱{p.amount.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            p.status === "Paid" ? "bg-success/10 text-success border-success/20" :
                                                                p.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                                    "bg-warning/10 text-warning border-warning/20"
                                                        }>
                                                            {p.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                                    No payment history found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default BoarderDetails;
