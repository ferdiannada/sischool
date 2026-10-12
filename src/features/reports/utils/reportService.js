/**
 * Shared Report Service
 * Centralizes PDF and Excel generation logic to reduce duplication
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from '../../../utils/format';

/**
 * Create a standard PDF document with header
 * @param {string} title Report Title
 * @param {string} subtitle Report Subtitle
 * @param {string} orientation 'portrait' or 'landscape'
 * @returns {jsPDF} The doc instance
 */
export const createPDFDocument = (title, subtitle = '', orientation = 'portrait') => {
    const doc = new jsPDF({ orientation });

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    if (subtitle) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    }

    return doc;
};

/**
 * Add standard footer to PDF pages
 * @param {jsPDF} doc The doc instance
 */
export const addPDFFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128);

        const footerText = `Dicetak pada: ${formatDate(new Date())} | Halaman ${i} dari ${pageCount}`;
        doc.text(footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
};

/**
 * Generate Excel File from data arrays
 * @param {Array<Array<any>>} data Array of arrays (rows)
 * @param {string} sheetName Name of the sheet
 * @param {string} filename Output filename
 * @param {Array<Object>} colWidths Optional column widths [{wch: 10}, ...]
 */
export const generateExcel = (data, sheetName, filename, colWidths = []) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    if (colWidths.length > 0) {
        ws['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);

    return filename;
};

export default {
    createPDFDocument,
    addPDFFooter,
    generateExcel
};
