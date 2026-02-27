import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, FileText } from "lucide-react";
import { Payment, Boarder, Room, BhSettings } from "@/types";
import { generateReceipt, generateThermalPDF } from "@/utils/pdfGenerator";

interface ThermalReceiptProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Payment;
    boarder: Boarder;
    room: Room;
    settings: BhSettings;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
    isOpen,
    onClose,
    payment,
    boarder,
    room,
    settings,
}) => {
    const printRef = useRef<HTMLDivElement>(null);



    const handleDownload = () => {
        generateThermalPDF({
            receiptNumber: payment.receiptNumber || "N/A",
            boarderName: boarder.fullName,
            amount: payment.amount,
            type: payment.type,
            month: payment.month || "N/A",
            date: payment.paidDate || payment.date || new Date().toLocaleDateString(),
            receivedBy: payment.receivedBy || "Administrator",
            houseName: settings.name,
            houseAddress: settings.address,
            lateFee: payment.lateFee,
            paymentMethod: payment.method,
            roomName: room.name,
        });
    };

    const lateFee = payment.lateFee || 0;
    const total = payment.amount + lateFee;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-slate-100/50">
                <div className="flex flex-col h-full max-h-[90vh]">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
                        <h2 className="text-sm font-bold flex items-center gap-2 text-primary">
                            <FileText className="h-4 w-4" />
                            Digital Receipt
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Receipt Content Wrapper */}
                    <div className="p-6 overflow-y-auto flex-1 flex justify-center">
                        {/* The 80mm Virtual Receipt */}
                        <div
                            ref={printRef}
                            className="bg-white shadow-xl p-5 w-[80mm] min-h-[120mm] font-mono text-[11px] text-black border-t-8 border-slate-800"
                            style={{ fontFamily: "'Courier New', Courier, monospace" }}
                        >
                            <div className="text-center mb-4">
                                <div className="font-bold text-lg leading-tight uppercase mb-1">
                                    {settings.name}
                                </div>
                                <div className="text-[9px] leading-tight">
                                    {settings.address}
                                </div>
                                <div className="text-[9px]">
                                    Contact: {settings.contact}
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-300 my-3" />

                            <div className="space-y-1 mb-3">
                                <div className="flex justify-between">
                                    <span>OR NO:</span>
                                    <span className="font-bold">{payment.receiptNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>DATE:</span>
                                    <span>{payment.paidDate || payment.date || new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="space-y-1 mb-4">
                                <div>TENANT: <span className="font-bold underline">{boarder.fullName.toUpperCase()}</span></div>
                                <div>ROOM: <span className="font-bold">{room.name}</span></div>
                            </div>

                            <div className="border-t border-dashed border-slate-300 my-3" />

                            <div className="space-y-1.5 min-h-[40px]">
                                <div className="flex justify-between items-start">
                                    <span className="flex-1 pr-2">{payment.type.toUpperCase()} ({payment.month})</span>
                                    <span className="font-bold">₱{payment.amount.toLocaleString()}</span>
                                </div>
                                {lateFee > 0 && (
                                    <div className="flex justify-between items-start text-destructive">
                                        <span className="flex-1 pr-2">LATE SURCHARGE/FEE</span>
                                        <span className="font-bold">₱{lateFee.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-2 border-t border-slate-800">
                                <div className="flex justify-between font-bold text-[13px]">
                                    <span>TOTAL AMOUNT:</span>
                                    <span>₱{total.toLocaleString()}</span>
                                </div>
                                <div className="mt-2 text-[10px]">
                                    <span>METHOD: </span>
                                    <span className="font-bold">{payment.method || "CASH"}</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center text-[10px] italic space-y-1">
                                <div>RECEIVED BY: {payment.receivedBy || "ADMINISTRATOR"}</div>
                                <div className="border-t border-dashed border-slate-300 pt-3 mt-3">
                                    *** THANK YOU! VISIT AGAIN ***
                                </div>
                                <div className="text-[8px] text-slate-400">
                                    This is a computer generated receipt.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t flex gap-3 sticky bottom-0 z-10">
                        <Button className="flex-1 gap-2 shadow-md bg-primary hover:bg-primary/90" size="lg" onClick={handleDownload}>
                            <Download className="h-5 w-5" /> Download Thermal PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
