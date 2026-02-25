/**
 * Generates a unique receipt number for every payment transaction.
 * Format: BH-YYYYMMDD-XXXXXX
 * Example: BH-20260225-482931
 */
export const generateReceiptNumber = (): string => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const random = Math.floor(100000 + Math.random() * 900000);     // 6-digit random
    return `BH-${date}-${random}`;
};
