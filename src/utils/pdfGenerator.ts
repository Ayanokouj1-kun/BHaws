import jsPDF from "jspdf";
import "jspdf-autotable";

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

    // Generate Table
    (doc as any).autoTable({
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
}) => {
    const doc = new jsPDF({
        format: [80, 150], // Small receipt format
        unit: 'mm'
    });
    const themeColor = [79, 70, 229];

    // House Header
    doc.setFontSize(14);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text(data.houseName, 40, 15, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(data.houseAddress, 40, 20, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(10, 25, 70, 25);

    // Receipt Title
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('OFFICIAL RECEIPT', 40, 32, { align: 'center' });

    doc.setFontSize(8);
    doc.text(`No: ${data.receiptNumber}`, 10, 40);
    doc.text(`Date: ${data.date}`, 70, 40, { align: 'right' });

    // Details Grid
    doc.setFillColor(245, 247, 250);
    doc.rect(10, 45, 60, 40, 'F');

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('RECEIVED FROM', 15, 52);
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(data.boarderName.toUpperCase(), 15, 57);

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('PAYMENT FOR', 15, 65);
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`${data.type} (${data.month})`, 15, 70);

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('AMOUNT PAID', 15, 78);
    doc.setFontSize(12);
    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.text(`PHP ${data.amount.toLocaleString()}.00`, 15, 83);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Received by:', 10, 105);
    doc.setTextColor(0);
    doc.text(data.receivedBy, 10, 110);
    doc.line(10, 111, 40, 111);

    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text('Thank you for your stay!', 40, 130, { align: 'center' });
    doc.text('This is a computer generated receipt.', 40, 134, { align: 'center' });

    doc.save(`receipt_${data.receiptNumber}.pdf`);
};
