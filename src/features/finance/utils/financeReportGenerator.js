/**
 * Finance Report Generator Service
 * Handles PDF and Excel generation for Tata Usaha financial reports
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createPDFDocument, addPDFFooter } from '../../reports/utils/reportService';
import { formatCurrency, formatDate } from '../../../utils/format';

/**
 * Generate Financial Transaction Log PDF
 */
export const generateTransactionLogPDF = (transactions, period) => {
    const title = 'JURNAL TRANSAKSI KEUANGAN';
    const subtitle = `Periode: ${formatDate(period.startDate)} s/d ${formatDate(period.endDate)}`;

    const doc = createPDFDocument(title, subtitle);

    const startY = 45;

    // Table
    const tableData = transactions.map((t, idx) => [
        idx + 1,
        formatDate(t.date),
        t.type,
        t.category || '-',
        t.description,
        t.pic || '-',
        formatCurrency(t.amount)
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'PIC', 'Jumlah']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // Blue
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: 20 },
            3: { cellWidth: 25 },
            4: { cellWidth: 'auto' }, // Description gets auto width
            5: { cellWidth: 20 },
            6: { halign: 'right', cellWidth: 30 }
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        },
        didParseCell: function (data) {
            if (data.column.index === 6 && data.cell.raw) {
                // Color amounts: Green for Income (+), Red for Expense (-)
                // Assuming raw text contains 'Rp' or negative sign logic handled inside
                // Actually amount is string formatted here.
                // We can check row data or keep simple black/red.
                // Let's keep it simple for now.
            }
        }
    });

    // Summary info at the end
    const totalIncome = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pemasukan:`, 130, finalY);
    doc.text(`${formatCurrency(totalIncome)}`, 190, finalY, { align: 'right' });

    doc.text(`Total Pengeluaran:`, 130, finalY + 6);
    doc.text(`${formatCurrency(totalExpense)}`, 190, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Akhir:`, 130, finalY + 14);
    doc.text(`${formatCurrency(totalIncome - totalExpense)}`, 190, finalY + 14, { align: 'right' });

    addPDFFooter(doc);

    const filename = `Laporan_Transaksi_${period.startDate}_to_${period.endDate}.pdf`;
    doc.save(filename);

    return filename;
};

/**
 * Generate Arrears Report PDF
 */
export const generateArrearsReportPDF = (classData, arrearsData) => {
    const title = 'LAPORAN TUNGGAKAN SISWA';
    const subtitle = classData ? `Kelas: ${classData.name}` : 'Semua Kelas';

    const doc = createPDFDocument(title, subtitle);

    const startY = 45;

    // Table
    const tableData = arrearsData.map((s, idx) => [
        idx + 1,
        s.student_nis,
        s.student_name,
        s.class_name,
        s.total_unpaid_invoices,
        formatCurrency(s.total_arrears_amount)
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['No', 'NIS', 'Nama Siswa', 'Kelas', 'Jml Tagihan', 'Total Tunggakan']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [220, 38, 38], // Red
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 40 }
        },
        styles: {
            fontSize: 10,
            cellPadding: 3
        }
    });

    // Grand Total
    const grandTotal = arrearsData.reduce((sum, item) => sum + parseFloat(item.total_arrears_amount), 0);
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Tunggakan:', 140, finalY);
    doc.text(formatCurrency(grandTotal), 190, finalY, { align: 'right' });

    addPDFFooter(doc);

    const filename = `Laporan_Tunggakan_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return filename;
};

/**
 * Generate Excel Report
 */
export const generateFinanceExcel = (data, type = 'transaction', period) => {
    const wb = XLSX.utils.book_new();
    let ws;
    let filename = '';

    if (type === 'transaction') {
        const worksheetData = [
            ['JURNAL TRANSAKSI KEUANGAN'],
            [`Periode: ${formatDate(period.startDate)} s/d ${formatDate(period.endDate)}`],
            [],
            ['No', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'PIC', 'Jumlah', 'Status']
        ];

        data.forEach((t, idx) => {
            worksheetData.push([
                idx + 1,
                formatDate(t.date),
                t.type,
                t.category || '-',
                t.description,
                t.pic || '-',
                t.amount, // Keep as number for Excel math
                t.status
            ]);
        });

        ws = XLSX.utils.aoa_to_sheet(worksheetData);
        filename = `Laporan_Transaksi_${period.startDate}_to_${period.endDate}.xlsx`;
    } else if (type === 'arrears') {
        const worksheetData = [
            ['LAPORAN TUNGGAKAN SISWA'],
            [`Dicetak pada: ${formatDate(new Date())}`],
            [],
            ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Jumlah Tagihan', 'Total Tunggakan']
        ];

        data.forEach((s, idx) => {
            worksheetData.push([
                idx + 1,
                s.student_nis,
                s.student_name,
                s.class_name,
                s.total_unpaid_invoices,
                s.total_arrears_amount
            ]);
        });

        ws = XLSX.utils.aoa_to_sheet(worksheetData);
        filename = `Laporan_Tunggakan_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    if (ws) {
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
        XLSX.writeFile(wb, filename);
    }

    return filename;
};

export default {
    generateTransactionLogPDF,
    generateArrearsReportPDF,
    generateFinanceExcel
};
