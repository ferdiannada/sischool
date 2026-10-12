/**
 * Report Generator Service
 * Handles PDF and Excel generation for Wali Kelas reports
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createPDFDocument, addPDFFooter } from './reportService';
import { formatDate, formatMonth } from '../../../utils/format';

/**
 * Generate Monthly Report PDF
 */
export const generateMonthlyReportPDF = (data) => {
    const { kelas, students, summary, period } = data;

    const title = 'LAPORAN KEHADIRAN BULANAN';
    const subtitle = `Kelas ${kelas?.nama || '-'} | ${formatMonth(period?.month)} ${period?.year}`;

    const doc = createPDFDocument(title, subtitle);

    // Summary section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const summaryY = 40;
    doc.text(`Wali Kelas: ${kelas?.wali_kelas || '-'}`, 14, summaryY);
    doc.text(`Total Siswa: ${students?.length || 0}`, 14, summaryY + 6);
    doc.text(`Hari Efektif: ${period?.working_days || 0} hari`, 14, summaryY + 12);
    doc.text(`Rata-rata Kehadiran: ${summary?.avg_attendance?.toFixed(1) || 0}%`, 120, summaryY + 6);

    // Table
    const tableData = students?.map((s, idx) => [
        idx + 1,
        s.nis || '-',
        s.name || '-',
        s.hadir || 0,
        s.sakit || 0,
        s.izin || 0,
        s.alpha || 0,
        `${s.percentage?.toFixed(1) || 0}%`
    ]) || [];

    autoTable(doc, {
        startY: summaryY + 22,
        head: [['No', 'NIS', 'Nama Siswa', 'H', 'S', 'I', 'A', '%']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [79, 70, 229], // Indigo
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 12 },
            4: { halign: 'center', cellWidth: 12 },
            5: { halign: 'center', cellWidth: 12 },
            6: { halign: 'center', cellWidth: 12 },
            7: { halign: 'center', cellWidth: 18 }
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    });

    // Legend
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text('Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpha', 14, finalY);

    addPDFFooter(doc);

    const filename = `Laporan_Bulanan_${kelas?.nama || 'Kelas'}_${formatMonth(period?.month)}_${period?.year}.pdf`;
    doc.save(filename);

    return filename;
};

/**
 * Generate Semester Report PDF
 */
export const generateSemesterReportPDF = (data) => {
    const { kelas, students, summary, period } = data;

    const semesterName = period?.semester === 1 ? 'Ganjil' : 'Genap';
    const title = 'LAPORAN KEHADIRAN SEMESTER';
    const subtitle = `Kelas ${kelas?.nama || '-'} | Semester ${semesterName} ${period?.year}`;

    const doc = createPDFDocument(title, subtitle);

    // Summary section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const summaryY = 40;
    doc.text(`Wali Kelas: ${kelas?.wali_kelas || '-'}`, 14, summaryY);
    doc.text(`Total Siswa: ${students?.length || 0}`, 14, summaryY + 6);
    doc.text(`Total Hari Efektif: ${period?.total_days || 0} hari`, 14, summaryY + 12);
    doc.text(`Rata-rata Kehadiran: ${summary?.avg_attendance?.toFixed(1) || 0}%`, 120, summaryY + 6);

    // Table
    const tableData = students?.map((s, idx) => [
        idx + 1,
        s.nis || '-',
        s.name || '-',
        s.hadir || 0,
        s.sakit || 0,
        s.izin || 0,
        s.alpha || 0,
        `${s.percentage?.toFixed(1) || 0}%`
    ]) || [];

    autoTable(doc, {
        startY: summaryY + 22,
        head: [['No', 'NIS', 'Nama Siswa', 'H', 'S', 'I', 'A', '%']],
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
            1: { halign: 'center', cellWidth: 25 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 12 },
            4: { halign: 'center', cellWidth: 12 },
            5: { halign: 'center', cellWidth: 12 },
            6: { halign: 'center', cellWidth: 12 },
            7: { halign: 'center', cellWidth: 18 }
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    });

    // Legend
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text('Keterangan: H = Hadir, S = Sakit, I = Izin, A = Alpha', 14, finalY);

    addPDFFooter(doc);

    const filename = `Laporan_Semester_${semesterName}_${kelas?.nama || 'Kelas'}_${period?.year}.pdf`;
    doc.save(filename);

    return filename;
};

/**
 * Generate Student Attendance Card PDF
 */
export const generateStudentCardPDF = (data) => {
    const { student, attendance, monthly, period } = data;

    const semesterName = period?.semester === 1 ? 'Ganjil' : 'Genap';
    const title = 'KARTU KEHADIRAN SISWA';
    const subtitle = `Semester ${semesterName} Tahun ${period?.year}`;

    const doc = createPDFDocument(title, subtitle);

    // Student info section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);

    const infoY = 40;
    doc.setFont('helvetica', 'bold');
    doc.text('DATA SISWA', 14, infoY);
    doc.setFont('helvetica', 'normal');

    doc.text(`Nama: ${student?.name || '-'}`, 14, infoY + 8);
    doc.text(`NIS: ${student?.nis || '-'}`, 14, infoY + 14);
    doc.text(`Kelas: ${student?.kelas || '-'}`, 14, infoY + 20);
    doc.text(`Jenis Kelamin: ${student?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`, 14, infoY + 26);

    // Attendance summary box
    const boxY = infoY + 36;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, boxY, 180, 25, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEHADIRAN', 104, boxY + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    const statsY = boxY + 18;
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Hadir: ${attendance?.hadir || 0}`, 30, statsY);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text(`Sakit: ${attendance?.sakit || 0}`, 70, statsY);
    doc.setTextColor(234, 179, 8); // Yellow
    doc.text(`Izin: ${attendance?.izin || 0}`, 110, statsY);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Alpha: ${attendance?.alpha || 0}`, 150, statsY);

    doc.setTextColor(0);

    // Monthly breakdown table
    const tableData = monthly?.map(m => [
        m.month_name?.trim() || '-',
        m.hadir || 0,
        m.sakit || 0,
        m.izin || 0,
        m.alpha || 0
    ]) || [];

    autoTable(doc, {
        startY: boxY + 35,
        head: [['Bulan', 'Hadir', 'Sakit', 'Izin', 'Alpha']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [147, 51, 234], // Purple
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 30 }
        },
        styles: {
            fontSize: 10,
            cellPadding: 4
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    });

    // Signature area
    const signatureY = doc.lastAutoTable.finalY + 25;
    doc.setFontSize(10);
    doc.text(`Jakarta, ${formatDate()}`, 140, signatureY);
    doc.text('Wali Kelas,', 140, signatureY + 8);
    doc.text('____________________', 140, signatureY + 35);

    addPDFFooter(doc);

    const filename = `Kartu_Kehadiran_${student?.name?.replace(/\s+/g, '_') || 'Siswa'}_Semester_${semesterName}_${period?.year}.pdf`;
    doc.save(filename);

    return filename;
};

/**
 * Generate Excel Report (Monthly or Semester)
 */
export const generateReportExcel = (data, type = 'monthly') => {
    const { kelas, students, summary, period } = data;

    // Prepare data for Excel
    const worksheetData = [];

    // Header info
    const title = type === 'monthly'
        ? `Laporan Kehadiran Bulanan - ${formatMonth(period?.month)} ${period?.year}`
        : `Laporan Kehadiran Semester ${period?.semester === 1 ? 'Ganjil' : 'Genap'} ${period?.year}`;

    worksheetData.push([title]);
    worksheetData.push([`Kelas: ${kelas?.nama || '-'}`]);
    worksheetData.push([`Wali Kelas: ${kelas?.wali_kelas || '-'}`]);
    worksheetData.push([`Hari Efektif: ${period?.working_days || period?.total_days || 0}`]);
    worksheetData.push([`Rata-rata Kehadiran: ${summary?.avg_attendance?.toFixed(1) || 0}%`]);
    worksheetData.push([]); // Empty row

    // Table header
    worksheetData.push(['No', 'NIS', 'Nama Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpha', 'Persentase']);

    // Table data
    students?.forEach((s, idx) => {
        worksheetData.push([
            idx + 1,
            s.nis || '-',
            s.name || '-',
            s.hadir || 0,
            s.sakit || 0,
            s.izin || 0,
            s.alpha || 0,
            `${s.percentage?.toFixed(1) || 0}%`
        ]);
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 15 },  // NIS
        { wch: 30 },  // Nama
        { wch: 8 },   // Hadir
        { wch: 8 },   // Sakit
        { wch: 8 },   // Izin
        { wch: 8 },   // Alpha
        { wch: 12 }   // Persentase
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kehadiran');

    // Generate filename
    const filename = type === 'monthly'
        ? `Laporan_Bulanan_${kelas?.nama || 'Kelas'}_${formatMonth(period?.month)}_${period?.year}.xlsx`
        : `Laporan_Semester_${period?.semester === 1 ? 'Ganjil' : 'Genap'}_${kelas?.nama || 'Kelas'}_${period?.year}.xlsx`;

    XLSX.writeFile(wb, filename);

    return filename;
};

export default {
    generateMonthlyReportPDF,
    generateSemesterReportPDF,
    generateStudentCardPDF,
    generateReportExcel
};
