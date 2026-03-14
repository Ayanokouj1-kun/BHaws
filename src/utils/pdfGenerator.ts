import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportConfig {
    title: string;
    subtitle?: string;
    headers: string[];
    data: any[][];
    fileName: string;
}

export const generatePDF = (config: ExportConfig) => {
    const doc = new jsPDF();
    const themeColor = [79, 70, 229]; // Indigo-600

    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text(config.title, 14, 22);

    if (config.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(config.subtitle, 14, 30);
    }

    // Add Timestamp
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

    autoTable(doc, {
        head: [config.headers],
        body: config.data,
        startY: 45,
        theme: 'grid',
        headStyles: {
            fillColor: themeColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250],
        },
        margin: { top: 45 },
    });

    // Save PDF
    doc.save(`${config.fileName}.pdf`);
};
export const generateReceipt = (data: {
    receiptNumber: string;
    boarderName: string;
    amount: number;
    type: string;
    month: string;
    date: string;
    receivedBy: string;
    houseName: string;
    houseAddress: string;
    lateFee?: number;
    paymentMethod?: string;
    notes?: string;
}) => {
    const doc = new jsPDF({
        format: 'a5', // Professional A5 format
        unit: 'mm',
        orientation: 'portrait'
    });

    const themeColor = [40, 50, 100]; // Professional Navy
    const accentColor = [79, 70, 229]; // Indigo
    const secondaryColor = [100, 116, 139]; // Slate

    // ── Pre-calculate values ──
    const lateFee = data.lateFee || 0;
    const totalAmount = data.amount + lateFee;

    // ── HEADER SECTION ──
    // Add Logo if possible (using the path from LoginPage)
    try {
        // Since we can't easily wait for Image.onload in a synchronous function without restructuring,
        // jspdf handles base64 or Image objects. For local paths in a vite app, we use absolute URLs.
        doc.addImage("/login.png", "PNG", 15, 12, 12, 12);
    } catch (e) {
        console.warn("Logo could not be loaded for PDF:", e);
    }

    // Company Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text(data.houseName.toUpperCase(), 30, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    // Multi-line address handling to prevent overflow
    const splitAddress = doc.splitTextToSize(data.houseAddress, 80);
    doc.text(splitAddress, 30, 23);

    // Document Title & Number (Moved slightly right and down to avoid logo/title)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("OFFICIAL RECEIPT", 148 - 15, 18, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`NO: ${data.receiptNumber}`, 148 - 15, 24, { align: 'right' });

    doc.setDrawColor(230);
    doc.line(15, 38, 148 - 15, 38);

    // ── BILLING INFO ──
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("RECEIVED FROM:", 15, 48);
    doc.text("DATE OF PAYMENT:", 148 - 15, 48, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(data.boarderName.toUpperCase(), 15, 54);
    doc.text(data.date, 148 - 15, 54, { align: 'right' });

    // ── ITEM TABLE ──
    autoTable(doc, {
        startY: 65,
        head: [['DESCRIPTION', 'PERIOD / NOTES', 'AMOUNT']],
        body: [
            [
                { content: data.type ? data.type.toUpperCase() : "PAYMENT", styles: { fontStyle: 'bold' } },
                data.month || "N/A",
                `PHP ${(data.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            ],
            [
                "LATE FEE CHARGE",
                lateFee > 0 ? "Penalty for late settlement" : "-",
                `PHP ${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            ]
        ],
        theme: 'striped',
        headStyles: {
            fillColor: themeColor,
            textColor: 255,
            fontSize: 9,
            cellPadding: 3
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            valign: 'middle',
            overflow: 'linebreak' // Ensure text in cells wraps
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 40 },
            2: { halign: 'right', fontStyle: 'bold', cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 80;

    // ── TOTALS ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("SUBTOTAL", 90, finalY);
    doc.text(`PHP ${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 148 - 15, finalY, { align: 'right' });

    doc.text("LATE SURCHARGE", 90, finalY + 6);
    doc.text(`PHP ${lateFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 148 - 15, finalY + 6, { align: 'right' });

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.3);
    doc.line(90, finalY + 9, 148 - 15, finalY + 9);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text("TOTAL PAID", 90, finalY + 16);
    doc.text(`PHP ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 148 - 15, finalY + 16, { align: 'right' });

    // ── FOOTER & SIGNATURE ──
    // Method & Notes
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`PAYMENT METHOD: ${data.paymentMethod || "CASH"}`, 15, finalY + 28);

    if (data.notes) {
        doc.text("REMARKS:", 15, finalY + 34);
        doc.setFontSize(7);
        const splitNotes = doc.splitTextToSize(data.notes, 65);
        doc.text(splitNotes, 15, finalY + 38);
    }

    // Official Stamp Area / Signature (Fixed at bottom)
    const pageHeight = doc.internal.pageSize.height;
    const sigY = pageHeight - 35;

    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.line(90, sigY, 148 - 15, sigY);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Authorized Signature", 148 - 15, sigY + 5, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(data.receivedBy.toUpperCase(), 148 - 15, sigY - 2, { align: 'right' });

    // Bottom Notice
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Thank you for choosing BHaws Management. Keep this receipt for your records.", 74, pageHeight - 15, { align: 'center' });
    doc.text("This is an electronically generated document. No signature required.", 74, pageHeight - 12, { align: 'center' });

    // Small Watermark
    doc.setFontSize(40);
    doc.setTextColor(245); // Very light
    doc.setFont("helvetica", "bold");
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.text("PAID", 74, 110, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();

    doc.save(`OR_${data.receiptNumber}.pdf`);
};

export const generateThermalPDF = (data: {
    receiptNumber: string;
    boarderName: string;
    amount: number;
    type: string;
    month: string;
    date: string;
    receivedBy: string;
    houseName: string;
    houseAddress: string;
    lateFee?: number;
    paymentMethod?: string;
    roomName: string;
}) => {
    const width = 80; // 80mm
    const padding = 5;
    const contentWidth = width - (padding * 2);

    // Auto-calculate height or use a safe fixed one for now
    const height = 140;

    const doc = new jsPDF({
        unit: 'mm',
        format: [width, height],
        orientation: 'portrait'
    });

    const lateFee = data.lateFee || 0;
    const total = data.amount + lateFee;
    let y = 12;

    // Center header
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text(data.houseName.toUpperCase(), width / 2, y, { align: 'center' });

    y += 5;
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    const splitAddr = doc.splitTextToSize(data.houseAddress, contentWidth);
    doc.text(splitAddr, width / 2, y, { align: 'center' });

    y += (splitAddr.length * 3) + 1;
    doc.text("-------------------------------", width / 2, y, { align: 'center' });

    y += 5;
    doc.setFontSize(8);
    doc.text(`OR NO: ${data.receiptNumber}`, padding, y);
    y += 4;
    doc.text(`DATE: ${data.date}`, padding, y);

    y += 6;
    doc.setFont("courier", "bold");
    doc.text("TENANT:", padding, y);
    y += 4;
    doc.text(data.boarderName.toUpperCase(), padding, y);
    y += 4;
    doc.setFont("courier", "normal");
    doc.text(`ROOM: ${data.roomName}`, padding, y);

    y += 6;
    doc.text("-------------------------------", width / 2, y, { align: 'center' });

    y += 6;
    doc.text(data.type.toUpperCase(), padding, y);
    y += 4;
    doc.text(`(${data.month})`, padding, y);
    doc.setFont("courier", "bold");
    doc.text(`${data.amount.toLocaleString()}`, width - padding, y, { align: 'right' });

    if (lateFee > 0) {
        y += 6;
        doc.setFont("courier", "normal");
        doc.text("LATE SURCHARGE/FEE", padding, y);
        doc.setFont("courier", "bold");
        doc.text(`${lateFee.toLocaleString()}`, width - padding, y, { align: 'right' });
    }

    y += 8;
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(padding, y, width - padding, y);

    y += 6;
    doc.setFontSize(10);
    doc.text("TOTAL:", padding, y);
    doc.text(`PHP ${total.toLocaleString()}`, width - padding, y, { align: 'right' });

    y += 6;
    doc.setFontSize(7);
    doc.setFont("courier", "normal");
    doc.text(`METHOD: ${data.paymentMethod || "CASH"}`, padding, y);

    y += 15;
    doc.text(`RECEIVED BY: ${data.receivedBy.toUpperCase()}`, width / 2, y, { align: 'center' });

    y += 8;
    doc.text("-------------------------------", width / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.setFont("courier", "bold");
    doc.text("THANK YOU! VISIT AGAIN!", width / 2, y, { align: 'center' });

    y += 5;
    doc.setFont("courier", "italic");
    doc.setFontSize(6);
    doc.text("Electronically generated receipt.", width / 2, y, { align: 'center' });

    doc.save(`Receipt_${data.receiptNumber}.pdf`);
};
