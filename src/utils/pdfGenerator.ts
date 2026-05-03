import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────
//  Shared Design Tokens
// ─────────────────────────────────────────────
const C = {
    theme:    [28,  40,  90]  as [number, number, number], // deep navy
    success:  [14, 130,  64]  as [number, number, number], // green
    danger:   [196,  28,  28] as [number, number, number], // red
    accent:   [79,  70, 229]  as [number, number, number], // indigo
    gray:     [90, 100, 120]  as [number, number, number], // slate text
    muted:    [150, 158, 175] as [number, number, number], // light label
    lightBg:  [248, 249, 252] as [number, number, number], // off-white bg
    border:   [218, 222, 236] as [number, number, number], // border
    white:    [255, 255, 255] as [number, number, number],
    black:    [18,  18,  24]  as [number, number, number],
    headerFg: [200, 210, 240] as [number, number, number], // header sub-text
};
const M = 14; // page margin mm

// jsPDF setXxxColor overloads can't resolve tuple spread — use explicit helpers instead
const fill = (doc: jsPDF, c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
const text = (doc: jsPDF, c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
const draw = (doc: jsPDF, c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);

// ─────────────────────────────────────────────
//  Private Helpers
// ─────────────────────────────────────────────

/** Full-bleed A4 header band; returns Y where body content starts */
const drawA4Header = (
    doc: jsPDF,
    houseName: string,
    houseAddress: string,
    houseContact: string,
    reportTitle: string,
    reportSubtitle: string,
    pageWidth: number,
): number => {
    const H = 36; // header height

    // Background band
    fill(doc, C.theme);
    doc.rect(0, 0, pageWidth, H, "F");

    // Subtle bottom accent strip
    fill(doc, C.accent);
    doc.rect(0, H - 1.5, pageWidth, 1.5, "F");

    // Logo
    try { doc.addImage("/login.png", "PNG", M, 8, 11, 11); } catch {}

    // House name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    text(doc, C.white);
    doc.text(houseName.toUpperCase(), M + 14, 15);

    // Address & contact
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    text(doc, C.headerFg);
    const addrLines = doc.splitTextToSize(houseAddress, 100);
    doc.text(addrLines, M + 14, 21);
    doc.text(`Tel: ${houseContact}`, M + 14, addrLines.length > 1 ? 27 : 26);

    // Report title (right-aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    text(doc, C.white);
    doc.text(reportTitle, pageWidth - M, 13, { align: "right" });

    // Report subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    text(doc, C.headerFg);
    doc.text(reportSubtitle, pageWidth - M, 20, { align: "right" });

    // Generated timestamp
    doc.setFontSize(6.5);
    doc.setTextColor(170, 182, 218);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - M, 30, { align: "right" });

    return H + 8; // content starts 8mm below band
};

/** Section heading with left accent bar + full-width rule */
const drawSectionHead = (
    doc: jsPDF,
    label: string,
    y: number,
    pageWidth: number,
): number => {
    // Accent bar
    fill(doc, C.accent);
    doc.rect(M, y - 3.5, 3, 6, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    text(doc, C.theme);
    doc.text(label, M + 5, y);

    // Rule
    draw(doc, C.border);
    doc.setLineWidth(0.25);
    doc.line(M + 5 + doc.getTextWidth(label) + 3, y - 1, pageWidth - M, y - 1);

    return y + 7; // next Y
};

/** Metric card with filled background + left color accent */
const drawCard = (
    doc: jsPDF,
    x: number, y: number, w: number, h: number,
    label: string, value: string, sub: string,
    color: [number, number, number],
): void => {
    // Card bg
    fill(doc, C.lightBg);
    draw(doc, C.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");

    // Left color accent strip
    fill(doc, color);
    doc.roundedRect(x, y, 3.5, h, 1, 1, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    text(doc, color);
    doc.text(label, x + 6, y + 7);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    text(doc, C.black);
    doc.text(value, x + 6, y + 14.5);

    // Sub-label
    if (sub) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.5);
        text(doc, C.muted);
        doc.text(sub, x + 6, y + h - 3);
    }
};

/** Consistent footer on every page */
const drawPageFooter = (doc: jsPDF, systemLabel: string, pageWidth: number, pageHeight: number): void => {
    fill(doc, C.lightBg);
    doc.rect(0, pageHeight - 8, pageWidth, 8, "F");
    draw(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(0, pageHeight - 8, pageWidth, pageHeight - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    text(doc, C.muted);
    doc.text(systemLabel, M, pageHeight - 3);
    doc.text(`Page ${(doc as any).internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 3, { align: "center" });
    doc.text(new Date().toLocaleDateString(), pageWidth - M, pageHeight - 3, { align: "right" });
};

// ─────────────────────────────────────────────
//  Interfaces
// ─────────────────────────────────────────────

interface ExportConfig {
    title: string;
    subtitle?: string;
    headers: string[];
    data: any[][];
    fileName: string;
}

// ─────────────────────────────────────────────
//  generatePDF  (generic report export)
// ─────────────────────────────────────────────
export const generatePDF = (config: ExportConfig) => {
    const isWide = config.headers.length > 5;
    const doc = new jsPDF({ orientation: isWide ? "landscape" : "portrait", unit: "mm", format: "a4" });
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header band
    const H = 28;
    fill(doc, C.theme);
    doc.rect(0, 0, pageWidth, H, "F");
    fill(doc, C.accent);
    doc.rect(0, H - 1.5, pageWidth, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    text(doc, C.white);
    doc.text(config.title.toUpperCase(), M, 14);

    if (config.subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        text(doc, C.headerFg);
        doc.text(config.subtitle, M, 20);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(170, 182, 218);
    doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth - M, 22, { align: "right" });

    const baseFontSize = config.headers.length > 8 ? 6 : config.headers.length > 5 ? 7 : 7.5;

    autoTable(doc, {
        head: [config.headers],
        body: config.data,
        startY: H + 6,
        theme: "grid",
        headStyles: {
            fillColor: C.theme,
            textColor: [255, 255, 255],
            fontSize: baseFontSize,
            fontStyle: "bold",
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        styles: {
            fontSize: baseFontSize - 0.5,
            cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
            overflow: "linebreak",
            valign: "middle",
            lineWidth: 0.15,
            lineColor: C.border,
        },
        columnStyles: {
            ...config.headers.reduce((acc: any, header, idx) => {
                const h = header.toLowerCase();
                if (h.includes("amount") || h.includes("rate") || h.includes("balance") || h.includes("total") || h.includes("collected") || h.includes("price")) {
                    acc[idx] = { halign: "right", fontStyle: "bold" };
                } else if (h.includes("status") || h.includes("type") || h.includes("date")) {
                    acc[idx] = { halign: "center" };
                }
                if (h.includes("detail") || h.includes("description") || h.includes("name")) {
                    acc[idx] = { ...acc[idx], cellWidth: "auto" };
                }
                return acc;
            }, {}),
        },
        alternateRowStyles: { fillColor: C.lightBg },
        margin: { left: M, right: M, bottom: 12 },
        didDrawPage: () => { drawPageFooter(doc, "BHaws Management System", pageWidth, pageHeight); },
    });

    doc.save(`${config.fileName}.pdf`);
};

// ─────────────────────────────────────────────
//  generateReceipt  (A5 official receipt)
// ─────────────────────────────────────────────
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
    // A5 = 148 × 210 mm
    const doc = new jsPDF({ format: "a5", unit: "mm", orientation: "portrait" });
    const pw = doc.internal.pageSize.getWidth();   // 148
    const ph = doc.internal.pageSize.getHeight();  // 210
    const lm = 14; // left / right margin
    const lateFee    = data.lateFee || 0;
    const totalAmt   = data.amount + lateFee;

    // ── Header band ──
    const hH = 34;
    fill(doc, C.theme);
    doc.rect(0, 0, pw, hH, "F");
    fill(doc, C.accent);
    doc.rect(0, hH - 1.5, pw, 1.5, "F");

    try { doc.addImage("/login.png", "PNG", lm, 8, 10, 10); } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    text(doc, C.white);
    doc.text(data.houseName.toUpperCase(), lm + 13, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    text(doc, C.headerFg);
    const addrLines = doc.splitTextToSize(data.houseAddress, 72);
    doc.text(addrLines, lm + 13, 21);

    // Right: "OFFICIAL RECEIPT" + number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    text(doc, C.white);
    doc.text("OFFICIAL RECEIPT", pw - lm, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    text(doc, C.headerFg);
    doc.text(`No: ${data.receiptNumber}`, pw - lm, 20, { align: "right" });
    doc.text(data.date, pw - lm, 27, { align: "right" });

    let y = hH + 8;

    // ── Billed to / Date row ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    text(doc, C.muted);
    doc.text("RECEIVED FROM", lm, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    text(doc, C.black);
    doc.text(data.boarderName.toUpperCase(), lm, y + 6);

    // Thin divider
    y += 12;
    draw(doc, C.border);
    doc.setLineWidth(0.3);
    doc.line(lm, y, pw - lm, y);
    y += 6;

    // ── Line items table ──
    autoTable(doc, {
        startY: y,
        head: [["DESCRIPTION", "PERIOD", "AMOUNT"]],
        body: [
            [
                { content: data.type ? data.type.toUpperCase() : "PAYMENT", styles: { fontStyle: "bold" } },
                data.month || "—",
                { content: `PHP ${(data.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, styles: { halign: "right", fontStyle: "bold" } },
            ],
            ...(lateFee > 0 ? [[
                "LATE FEE SURCHARGE",
                "Penalty",
                { content: `PHP ${lateFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, styles: { halign: "right", fontStyle: "bold" } },
            ]] : []),
        ],
        theme: "grid",
        headStyles: {
            fillColor: C.theme,
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: "bold",
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        styles: {
            fontSize: 8,
            cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
            valign: "middle",
            lineWidth: 0.15,
            lineColor: C.border,
        },
        columnStyles: {
            0: { cellWidth: "auto" },
            1: { cellWidth: 32, halign: "center" },
            2: { cellWidth: 32, halign: "right" },
        },
        alternateRowStyles: { fillColor: C.lightBg },
        margin: { left: lm, right: lm },
    });

    const tY: number = ((doc as any).lastAutoTable?.finalY ?? y + 20) + 5;

    // ── Totals block ──
    const totX = pw / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    text(doc, C.gray);
    doc.text("SUBTOTAL", totX, tY);
    doc.setFont("helvetica", "bold");
    text(doc, C.black);
    doc.text(`PHP ${data.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, pw - lm, tY, { align: "right" });

    if (lateFee > 0) {
        doc.setFont("helvetica", "normal");
        text(doc, C.gray);
        doc.text("LATE FEE", totX, tY + 6);
        doc.setFont("helvetica", "bold");
        text(doc, C.danger);
        doc.text(`PHP ${lateFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, pw - lm, tY + 6, { align: "right" });
    }

    const lineY = tY + (lateFee > 0 ? 9 : 3);
    draw(doc, C.gray);
    doc.setLineWidth(0.4);
    doc.line(totX, lineY, pw - lm, lineY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    text(doc, C.theme);
    doc.text("TOTAL PAID", totX, lineY + 7);
    doc.text(`PHP ${totalAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, pw - lm, lineY + 7, { align: "right" });

    // ── Payment method + notes ──
    const metaY = lineY + 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    text(doc, C.gray);
    doc.text(`Payment Method: ${data.paymentMethod || "Cash"}`, lm, metaY);

    if (data.notes) {
        doc.setFontSize(7);
        const noteLines = doc.splitTextToSize(`Remarks: ${data.notes}`, (pw / 2) - lm - 4);
        doc.text(noteLines, lm, metaY + 5);
    }

    // ── Signature area ──
    const sigY = ph - 38;
    draw(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(totX, sigY, pw - lm, sigY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    text(doc, C.black);
    doc.text(data.receivedBy.toUpperCase(), pw - lm, sigY - 2, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    text(doc, C.gray);
    doc.text("Received by / Authorized Signature", pw - lm, sigY + 5, { align: "right" });

    // ── Bottom notice ──
    fill(doc, C.lightBg);
    doc.rect(0, ph - 18, pw, 18, "F");
    draw(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(0, ph - 18, pw, ph - 18);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    text(doc, C.muted);
    doc.text("Thank you for your payment. Please keep this receipt for your records.", pw / 2, ph - 12, { align: "center" });
    doc.text("This is an electronically generated document.", pw / 2, ph - 7, { align: "center" });

    // ── Watermark ──
    try {
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
        doc.setFont("helvetica", "bold");
        doc.setFontSize(52);
        text(doc, C.theme);
        doc.text("PAID", pw / 2, ph / 2 + 10, { align: "center", angle: 40 });
        doc.restoreGraphicsState();
    } catch {}

    doc.save(`OR_${data.receiptNumber}.pdf`);
};

// ─────────────────────────────────────────────
//  generateThermalPDF  (80mm thermal roll)
// ─────────────────────────────────────────────
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
    const W   = 80;
    const PAD = 5;
    const CW  = W - PAD * 2;
    const lateFee = data.lateFee || 0;
    const total   = data.amount + lateFee;

    const doc = new jsPDF({ unit: "mm", format: [W, 150], orientation: "portrait" });
    let y = 10;

    const line = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.15);
        doc.line(PAD, y, W - PAD, y);
        y += 4;
    };

    const row = (left: string, right: string, bold = false) => {
        doc.setFont("courier", bold ? "bold" : "normal");
        doc.setFontSize(7.5);
        doc.text(left, PAD, y);
        doc.text(right, W - PAD, y, { align: "right" });
        y += 4;
    };

    const center = (text: string, size = 7.5, bold = false) => {
        doc.setFont("courier", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.text(text, W / 2, y, { align: "center" });
        y += size > 9 ? 5 : 4;
    };

    // House header
    center(data.houseName.toUpperCase(), 10, true);
    doc.setFont("courier", "normal");
    doc.setFontSize(6.5);
    const addr = doc.splitTextToSize(data.houseAddress, CW);
    doc.text(addr, W / 2, y, { align: "center" });
    y += addr.length * 3 + 2;

    line();
    center("OFFICIAL RECEIPT", 8, true);

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    row("OR NO:", data.receiptNumber);
    row("DATE:", data.date);
    line();

    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.text("TENANT:", PAD, y); y += 4;
    doc.text(data.boarderName.toUpperCase(), PAD, y); y += 4;
    doc.setFont("courier", "normal");
    doc.text(`ROOM: ${data.roomName}`, PAD, y); y += 5;
    line();

    row(data.type.toUpperCase(), `PHP ${data.amount.toLocaleString()}`, true);
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.text(`(${data.month})`, PAD, y); y += 4;

    if (lateFee > 0) {
        row("LATE SURCHARGE", `PHP ${lateFee.toLocaleString()}`);
    }

    line();

    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    row("TOTAL:", `PHP ${total.toLocaleString()}`, true);
    y += 1;

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(`METHOD: ${data.paymentMethod || "Cash"}`, PAD, y); y += 5;

    line();

    center(`Received by: ${data.receivedBy.toUpperCase()}`, 7.5);
    y += 2;
    line();

    center("THANK YOU!", 9, true);
    y += 1;

    doc.setFont("courier", "italic");
    doc.setFontSize(6);
    doc.text("Electronically generated.", W / 2, y, { align: "center" });

    doc.save(`Receipt_${data.receiptNumber}.pdf`);
};

// ─────────────────────────────────────────────
//  generateFinancialSummaryPDF
// ─────────────────────────────────────────────
export const generateFinancialSummaryPDF = (data: {
    boarders: Array<{ id: string; fullName: string; advanceAmount: number; depositAmount: number }>;
    payments: Array<{ boarderId: string; amount: number; status: string; month?: string; date?: string; paidDate?: string; type: string; lateFee?: number }>;
    period: "monthly" | "yearly";
    periodLabel: string;
    houseName: string;
    houseAddress: string;
    houseContact: string;
}) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── Data calculations ──
    const periodPayments = data.payments.filter(p => {
        if (data.period === "monthly") return p.month === data.periodLabel;
        const year = p.month?.split(" ").pop() || (p.paidDate || p.date || "").substring(0, 4);
        return year === data.periodLabel;
    });

    const overallPaid   = data.payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const overallUnpaid = data.payments.filter(p => p.status !== "Paid").reduce((s, p) => s + p.amount + (p.lateFee || 0), 0);
    const periodIncome  = periodPayments.reduce((s, p) => s + p.amount, 0);
    const periodPaid    = periodPayments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const periodUnpaid  = periodPayments.filter(p => p.status !== "Paid").reduce((s, p) => s + p.amount + (p.lateFee || 0), 0);

    // ── Header ──
    let y = drawA4Header(
        doc,
        data.houseName, data.houseAddress, data.houseContact,
        "FINANCIAL SUMMARY REPORT",
        `Period: ${data.periodLabel}`,
        pageWidth,
    );

    // ── Summary cards ──
    const gap   = 4;
    const cardW = (pageWidth - M * 2 - gap * 2) / 3;
    const cardH = 24;
    const cardsData = [
        { label: "TOTAL BILLED", value: `PHP ${periodIncome.toLocaleString()}`, sub: "Charges for the period", color: C.accent },
        { label: "TOTAL COLLECTED", value: `PHP ${periodPaid.toLocaleString()}`, sub: "Payments received", color: C.success },
        { label: "TOTAL OUTSTANDING", value: `PHP ${periodUnpaid.toLocaleString()}`, sub: "Collectible balance", color: C.danger },
    ];
    cardsData.forEach((c, i) => drawCard(doc, M + i * (cardW + gap), y, cardW, cardH, c.label, c.value, c.sub, c.color));
    y += cardH + 10;

    // ── Boarder breakdown ──
    y = drawSectionHead(doc, "BOARDER BREAKDOWN", y, pageWidth);

    const tableData = data.boarders.map(b => {
        const bP = periodPayments.filter(p => p.boarderId === b.id);
        const bPaid   = bP.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
        const bUnpaid = bP.filter(p => p.status !== "Paid").reduce((s, p) => s + p.amount + (p.lateFee || 0), 0);
        const bTotal  = bP.reduce((s, p) => s + p.amount, 0);
        const remark  = bUnpaid === 0 && bPaid > 0 ? "SETTLED" : bUnpaid > 0 ? "COLLECTIBLE" : "NO RECORD";
        return [b.fullName, `PHP ${bTotal.toLocaleString()}`, `PHP ${bPaid.toLocaleString()}`, `PHP ${bUnpaid.toLocaleString()}`, remark];
    });

    autoTable(doc, {
        head: [["Boarder Name", "Billed", "Collected", "Outstanding", "Status"]],
        body: tableData,
        startY: y,
        theme: "grid",
        headStyles: {
            fillColor: C.theme,
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: "bold",
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        styles: {
            fontSize: 7,
            cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
            valign: "middle",
            lineWidth: 0.15,
            lineColor: C.border,
        },
        columnStyles: {
            0: { cellWidth: "auto" },
            1: { halign: "right", fontStyle: "bold" },
            2: { halign: "right", fontStyle: "bold", textColor: C.success },
            3: { halign: "right", fontStyle: "bold", textColor: C.danger },
            4: { halign: "center", fontStyle: "bold", cellWidth: 28 },
        },
        alternateRowStyles: { fillColor: C.lightBg },
        margin: { left: M, right: M, bottom: 16 },
        didParseCell: (h) => {
            if (h.column.index === 4 && h.section === "body") {
                const v = h.cell.text[0];
                if (v === "SETTLED")     h.cell.styles.textColor = C.success;
                else if (v === "COLLECTIBLE") h.cell.styles.textColor = C.danger;
                else                     h.cell.styles.textColor = C.muted;
            }
        },
        didDrawPage: () => { drawPageFooter(doc, "BHaws Management System — Financial Summary Report", pageWidth, pageHeight); },
    });

    // ── All-time totals footer box ──
    const finalY: number = ((doc as any).lastAutoTable?.finalY ?? pageHeight - 40) + 6;
    if (finalY < pageHeight - 22) {
        const boxH = 18;
        fill(doc, C.lightBg);
        draw(doc, C.border);
        doc.setLineWidth(0.25);
        doc.roundedRect(M, finalY, pageWidth - M * 2, boxH, 1.5, 1.5, "FD");

        // Left accent
        fill(doc, C.theme);
        doc.roundedRect(M, finalY, 3.5, boxH, 1, 1, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        text(doc, C.theme);
        doc.text("ALL-TIME TOTALS", M + 6, finalY + 7);

        const col = (pageWidth - M * 2 - 3.5) / 3;
        const metrics = [
            { label: "Total Collected", value: `PHP ${overallPaid.toLocaleString()}`, color: C.success },
            { label: "Total Receivable", value: `PHP ${overallUnpaid.toLocaleString()}`, color: C.danger },
            { label: "Net Balance", value: `PHP ${(overallPaid - overallUnpaid).toLocaleString()}`, color: C.theme },
        ];
        metrics.forEach((m, i) => {
            const cx = M + 3.5 + i * col + col / 2;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);
            text(doc, C.muted);
            doc.text(m.label, cx, finalY + 12, { align: "center" });
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            text(doc, m.color);
            doc.text(m.value, cx, finalY + 16, { align: "center" });
        });
    }

    doc.save(`Financial_Summary_${data.periodLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
};

// ─────────────────────────────────────────────
//  generateTenantPaymentReportPDF
// ─────────────────────────────────────────────
export const generateTenantPaymentReportPDF = (data: {
    boarder: {
        id: string; fullName: string; contactNumber: string; email: string;
        address: string; moveInDate: string; advanceAmount: number;
        depositAmount: number; status: string; gender?: string;
    };
    payments: Array<{
        id: string; type: string; amount: number; status: string;
        month?: string; date?: string; paidDate?: string;
        receiptNumber?: string; method?: string; lateFee?: number; notes?: string;
    }>;
    roomName: string;
    bedName: string;
    houseName: string;
    houseAddress: string;
    houseContact: string;
}) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const totalPaid     = data.payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
    const totalUnpaid   = data.payments.filter(p => p.status !== "Paid").reduce((s, p) => s + p.amount + (p.lateFee || 0), 0);
    const totalLateFees = data.payments.reduce((s, p) => s + (p.lateFee || 0), 0);

    // ── Header ──
    let y = drawA4Header(
        doc,
        data.houseName, data.houseAddress, data.houseContact,
        "TENANT PAYMENT REPORT",
        `Prepared for: ${data.boarder.fullName}`,
        pageWidth,
    );

    // ── Boarder info panel ──
    const panelH = 34;
    fill(doc, C.lightBg);
    draw(doc, C.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(M, y, pageWidth - M * 2, panelH, 1.5, 1.5, "FD");

    // Left accent bar
    const sColor = data.boarder.status === "Active" ? C.success : C.danger;
    fill(doc, sColor);
    doc.roundedRect(M, y, 4, panelH, 1, 1, "F");

    // Status pill (top-right)
    const pillW = 26;
    fill(doc, sColor);
    doc.roundedRect(pageWidth - M - pillW, y + 4, pillW, 7.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    text(doc, C.white);
    doc.text(data.boarder.status.toUpperCase(), pageWidth - M - pillW / 2, y + 9, { align: "center" });

    // Tenant name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    text(doc, C.theme);
    doc.text(data.boarder.fullName.toUpperCase(), M + 7, y + 9);

    // Two-column details
    const colL = M + 7;
    const colR = pageWidth / 2 + 4;

    const infoRow = (label: string, value: string, cx: number, cy: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        text(doc, C.muted);
        doc.text(label, cx, cy);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        text(doc, C.black);
        doc.text(value || "—", cx, cy + 4);
    };

    infoRow("CONTACT", data.boarder.contactNumber, colL, y + 16);
    infoRow("EMAIL", data.boarder.email || "—", colL, y + 24);

    infoRow("ROOM / BED", `${data.roomName}  ·  ${data.bedName}`, colR, y + 16);
    infoRow("MOVE-IN DATE", data.boarder.moveInDate, colR, y + 24);

    // Vertical divider
    draw(doc, C.border);
    doc.setLineWidth(0.2);
    doc.line(pageWidth / 2 + 1, y + 13, pageWidth / 2 + 1, y + panelH - 3);

    y += panelH + 8;

    // ── Summary cards ──
    const gap   = 4;
    const cardW = (pageWidth - M * 2 - gap * 2) / 3;
    const cardH = 22;
    const cardsData = [
        { label: "TOTAL PAID", value: `PHP ${totalPaid.toLocaleString()}`, sub: "All-time collected", color: C.success },
        { label: "OUTSTANDING", value: `PHP ${totalUnpaid.toLocaleString()}`, sub: "Remaining balance", color: C.danger },
        { label: "LATE FEES", value: `PHP ${totalLateFees.toLocaleString()}`, sub: "Penalty charges total", color: C.accent },
    ];
    cardsData.forEach((c, i) => drawCard(doc, M + i * (cardW + gap), y, cardW, cardH, c.label, c.value, c.sub, c.color));
    y += cardH + 10;

    // ── Payment history ──
    y = drawSectionHead(doc, "COMPLETE PAYMENT HISTORY", y, pageWidth);

    const sorted = [...data.payments].sort((a, b) =>
        new Date(b.paidDate || b.date || 0).getTime() - new Date(a.paidDate || a.date || 0).getTime()
    );

    const tableRows = sorted.map(p => [
        p.month || p.date || "—",
        p.receiptNumber || `OR-${p.id.slice(-6).toUpperCase()}`,
        p.type || "—",
        { content: `PHP ${p.amount.toLocaleString()}`, styles: { halign: "right", fontStyle: "bold" } },
        p.lateFee ? `PHP ${p.lateFee.toLocaleString()}` : "—",
        p.status || "—",
        p.paidDate || p.date || "—",
        p.method || "—",
    ]);

    autoTable(doc, {
        head: [["Period", "Receipt #", "Type", "Amount", "Late Fee", "Status", "Date", "Method"]],
        body: tableRows,
        startY: y,
        theme: "grid",
        headStyles: {
            fillColor: C.theme,
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: "bold",
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        },
        styles: {
            fontSize: 6.5,
            cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
            valign: "middle",
            lineWidth: 0.15,
            lineColor: C.border,
        },
        columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 24, fontStyle: "bold" },
            2: { cellWidth: "auto" },
            3: { halign: "right", fontStyle: "bold", cellWidth: 22 },
            4: { halign: "right", cellWidth: 18 },
            5: { halign: "center", fontStyle: "bold", cellWidth: 18 },
            6: { cellWidth: 22 },
            7: { cellWidth: 20 },
        },
        didParseCell: (h) => {
            if (h.column.index === 5 && h.section === "body") {
                const s = h.cell.text[0];
                if (s === "Paid")         h.cell.styles.textColor = C.success;
                else if (s === "Overdue") h.cell.styles.textColor = C.danger;
                else                      h.cell.styles.textColor = [170, 115, 0] as [number, number, number];
            }
        },
        alternateRowStyles: { fillColor: C.lightBg },
        margin: { left: M, right: M, bottom: 16 },
        didDrawPage: () => { drawPageFooter(doc, "BHaws Management System — Tenant Payment Report", pageWidth, pageHeight); },
    });

    // ── Totals footer row ──
    const finalY: number = ((doc as any).lastAutoTable?.finalY ?? pageHeight - 30) + 5;
    if (finalY < pageHeight - 18) {
        const rowH = 14;
        fill(doc, C.lightBg);
        draw(doc, C.border);
        doc.setLineWidth(0.25);
        doc.roundedRect(M, finalY, pageWidth - M * 2, rowH, 1.5, 1.5, "FD");

        const col = (pageWidth - M * 2) / 3;
        const metrics = [
            { label: "Total Paid", value: `PHP ${totalPaid.toLocaleString()}`, color: C.success },
            { label: "Outstanding Balance", value: `PHP ${totalUnpaid.toLocaleString()}`, color: C.danger },
            { label: "Late Fees Total", value: `PHP ${totalLateFees.toLocaleString()}`, color: C.accent },
        ];
        metrics.forEach((m, i) => {
            const cx = M + i * col + col / 2;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6);
            text(doc, C.muted);
            doc.text(m.label, cx, finalY + 5.5, { align: "center" });
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            text(doc, m.color);
            doc.text(m.value, cx, finalY + 11, { align: "center" });
        });
    }

    doc.save(`Tenant_Report_${data.boarder.fullName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
};
