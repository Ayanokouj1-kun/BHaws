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
    AlertCircle,
    PhilippinePeso
} from "lucide-react";
import { generateTenantPaymentReportPDF } from "@/utils/pdfGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BoarderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { boarders, rooms, payments, isLoading, user, settings } = useData();
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
    const roomRate = room?.monthlyRate || 0;

    // 1. Check if they have a specific 'Paid' record
    const hasPaidCurrentMonth = boarderPayments.some(p => p.type === "Monthly Rent" && p.month === currentMonthStr && p.status === "Paid");
    
    // 2. Calculate dynamic balance (includes room rate even if no record exists yet)
    const existingMonthlyRent = boarderPayments.find(p => p.type === "Monthly Rent" && p.month === currentMonthStr);
    const currentRentOwed = existingMonthlyRent 
        ? (existingMonthlyRent.status !== "Paid" ? existingMonthlyRent.amount : 0)
        : (boarder?.status === "Active" ? roomRate : 0);

    const previousBalance = boarderPayments
        .filter(p => p.status !== "Paid" && (p.type !== "Monthly Rent" || p.month !== currentMonthStr))
        .reduce((sum, p) => sum + (p.amount + (p.lateFee || 0)), 0);

    const totalOutstanding = previousBalance + currentRentOwed;

    const [emergencyName, emergencyInfo] = (boarder?.emergencyContact || "").split(" - ");

    const handlePrintReport = () => {
        if (!boarder) return;
        generateTenantPaymentReportPDF({
            boarder,
            payments: boarderPayments,
            roomName: room?.name || "N/A",
            bedName: bed?.name || "N/A",
            houseName: settings.name,
            houseAddress: settings.address,
            houseContact: settings.contact,
        });
    };

    const totalAdvancePaid = boarderPayments
        .filter(p => p.type?.toLowerCase().includes("advance") && p.status === "Paid")
        .reduce((sum, p) => sum + p.amount, 0);
    
    const totalDepositPaid = boarderPayments
        .filter(p => p.type?.toLowerCase().includes("deposit") && p.status === "Paid")
        .reduce((sum, p) => sum + p.amount, 0);

    if (isLoading) return <AppLayout><div>Loading...</div></AppLayout>;
    if (!boarder) return <AppLayout><div>Boarder not found</div></AppLayout>;

    return (
        <AppLayout>
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/boarders")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-black tracking-tight">{boarder.fullName}</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Profile & Payment History</p>
                    </div>
                    {(role === "Admin" || role === "SuperAdmin" || role === "Staff") && (
                        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handlePrintReport}>
                            <Printer className="h-4 w-4" /> Print Report
                        </Button>
                    )}
                </div>

                {overduePayments.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-[11px] text-destructive font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="flex-1">WARNING: {overduePayments.length} overdue payment(s) totaling ₱{overduePayments.reduce((s,p)=>s+p.amount+(p.lateFee||0), 0).toLocaleString()}.</span>
                        {role !== "Boarder" && (
                            <Button size="sm" className="ml-auto bg-destructive text-white h-7 px-2 text-[10px] font-bold" onClick={() => navigate("/payments")}>
                                Manage Payments
                            </Button>
                        )}
                    </div>
                )}

                {!hasPaidCurrentMonth && overduePayments.length === 0 && boarder.status === "Active" && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/30 text-[11px] text-amber-600 dark:text-amber-400 font-bold animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="flex-1">
                            {existingMonthlyRent 
                                ? `NOTICE: Rent for ${currentMonthStr} is currently ${existingMonthlyRent.status.toLowerCase()}.` 
                                : `NOTICE: No payment record found for ${currentMonthStr} rent.`}
                        </span>
                        {role !== "Boarder" && (
                            <Button size="sm" className="ml-auto bg-amber-500 text-white h-7 px-2 text-[10px] font-bold" onClick={() => navigate("/payments")}>
                                {existingMonthlyRent ? "Manage Payment" : "Record Payment"}
                            </Button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 shadow-sm border-border/60 overflow-hidden">
                        <div className="h-20 bg-accent/10 relative">
                            <div className="absolute -bottom-10 left-4">
                                <div className="h-20 w-20 rounded-xl bg-card border-2 border-card shadow-lg flex items-center justify-center text-accent text-2xl font-bold overflow-hidden">
                                    {boarder.profilePhoto ? (
                                        <img src={boarder.profilePhoto} className="h-full w-full object-cover" alt="" />
                                    ) : (
                                        boarder.fullName.charAt(0)
                                    )}
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-12 pb-4 px-4 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Information</h3>
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 h-5">{boarder.status}</Badge>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-[12px]">
                                        <div className="p-1.5 bg-muted rounded-md"><Mail className="h-3 w-3 text-muted-foreground" /></div>
                                        <span className="truncate">{boarder.email || "No email"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px]">
                                        <div className="p-1.5 bg-muted rounded-md"><Phone className="h-3 w-3 text-muted-foreground" /></div>
                                        <span>{boarder.contactNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px]">
                                        <div className="p-1.5 bg-muted rounded-md"><MapPin className="h-3 w-3 text-muted-foreground" /></div>
                                        <span className="truncate">{boarder.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px]">
                                        <div className="p-1.5 bg-muted rounded-md"><Calendar className="h-3 w-3 text-muted-foreground" /></div>
                                        <span>Moved in: {boarder.moveInDate}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/40">
                                <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Emergency</h3>
                                <div className="px-3 py-2 rounded-lg bg-destructive/5 border border-destructive/10">
                                    <p className="text-[11px] font-bold text-foreground">
                                        {emergencyName || "Not specified"}
                                    </p>
                                    {emergencyInfo && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{emergencyInfo}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="shadow-sm border-border/60">
                                <CardHeader className="pb-1.5 px-4 pt-3">
                                    <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <Home className="h-3 w-3" /> Room Assignment
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3 pt-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xl font-bold text-foreground">{room?.name || "N/A"}</p>
                                            <p className="text-[10px] text-muted-foreground">{bed?.name || "No bed assigned"}</p>
                                        </div>
                                        <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                            <Home className="h-4.5 w-4.5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-border/60">
                                <CardHeader className="pb-1.5 px-4 pt-3">
                                    <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <CreditCard className="h-3 w-3" /> Initial Fees
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3 pt-0">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-semibold text-foreground">Advance: ₱{totalAdvancePaid.toLocaleString()}</p>
                                            <p className="text-xs font-semibold text-foreground">Deposit: ₱{totalDepositPaid.toLocaleString()}</p>
                                        </div>
                                        <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center text-success">
                                            <CreditCard className="h-4.5 w-4.5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={`shadow-sm border-border/60 ${totalOutstanding > 0 ? "bg-destructive/5 border-destructive/20" : "bg-success/5"}`}>
                                <CardHeader className="pb-1.5 px-4 pt-3">
                                    <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                        <PhilippinePeso className={`h-3 w-3 ${totalOutstanding > 0 ? "text-destructive" : "text-success"}`} /> Outstanding Balance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3 pt-0">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className={`text-xl font-black ${totalOutstanding > 0 ? "text-destructive" : "text-success"}`}>₱{totalOutstanding.toLocaleString()}</p>
                                            <p className="text-[8px] text-muted-foreground mt-0.5 uppercase font-bold tracking-tight">
                                                {totalOutstanding > 0 ? "Pending Payment(s)" : "Fully Settled"}
                                            </p>
                                        </div>
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${totalOutstanding > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                                            <PhilippinePeso className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm border-border/60">
                            <CardHeader className="flex flex-row items-center justify-between py-2.5 px-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-accent" /> Payment History
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="text-accent text-[10px] h-7 px-2 font-bold uppercase tracking-wider" onClick={() => navigate("/payments")}>View All</Button>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableHead className="text-[10px] uppercase font-black px-4 h-9">Month</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black px-4 h-9">Receipt #</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black px-4 h-9">Type</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black px-4 h-9">Amount</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black px-4 h-9">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {boarderPayments.length > 0 ? (
                                                boarderPayments.slice(0, 5).map((p) => (
                                                    <TableRow key={p.id} className="hover:bg-muted/10">
                                                        <TableCell className="text-[11px] font-medium px-4 py-2 whitespace-nowrap">{p.month || p.date}</TableCell>
                                                        <TableCell className="text-[10px] font-mono text-muted-foreground px-4 py-2 whitespace-nowrap uppercase">{p.receiptNumber || 'N/A'}</TableCell>
                                                        <TableCell className="text-[11px] px-4 py-2 whitespace-nowrap">
                                                            <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground border border-border/40">{p.type}</span>
                                                        </TableCell>
                                                        <TableCell className="text-[11px] font-bold px-4 py-2 whitespace-nowrap">₱{p.amount.toLocaleString()}</TableCell>
                                                        <TableCell className="px-4 py-2">
                                                            <Badge variant="outline" className={`${p.status === "Paid" ? "bg-success/10 text-success border-success/20" : p.status === "Overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : p.status === "Unpaid" ? "bg-zinc-100 text-zinc-600 border-zinc-200" : "bg-warning/10 text-warning border-warning/20"} text-[9px] px-1.5 h-4.5 font-bold uppercase tracking-tighter`}>
                                                                {p.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-[11px] text-muted-foreground italic">
                                                        No records found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default BoarderDetails;
