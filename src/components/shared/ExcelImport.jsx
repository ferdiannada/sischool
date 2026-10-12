import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2, ArrowRight, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * Excel Import Component
 * Supports importing users (Guru/Siswa) with a 3-step wizard:
 * 1. Upload
 * 2. Preview & Validation
 * 3. Processing & Result
 */
const ExcelImport = ({
    isOpen,
    onClose,
    onImport,
    onValidate, // Optional async function(data) => returns { validData, errors }
    importType = 'users',
    templateData // Optional override for template
}) => {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]); // Array of { rowIndex, message }
    const [globalErrors, setGlobalErrors] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState('upload'); // upload, preview, importing, done
    const [importResult, setImportResult] = useState({ success: 0, failed: 0 });

    const expectedColumns = {
        users: ['nama', 'email', 'role', 'phone', 'kelas'],
        guru: ['nama', 'email', 'nip', 'bidang_studi', 'phone'],
        siswa: ['nama', 'email', 'nis', 'nisn', 'kelas', 'jenis_kelamin', 'tanggal_lahir', 'wali_nama', 'wali_email', 'wali_phone', 'wali_hubungan'],
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];

        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
            return;
        }

        setFile(selectedFile);
        parseExcel(selectedFile);
    };

    const parseExcel = async (file) => {
        setIsProcessing(true);
        setGlobalErrors([]);
        setValidationErrors([]);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                toast.error('File kosong atau tidak memiliki data');
                setIsProcessing(false);
                return;
            }

            // First row as headers
            const headers = jsonData[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

            // Validate headers
            const expected = expectedColumns[importType] || expectedColumns.users;
            const missingColumns = expected.filter(col => {
                // Relaxed check for wali columns (they are optional-ish or just enhancements)
                // But if we put them in expected, the current logic flags them as missing.
                // Let's modify the check to allow missing wali columns? 
                // Or better, keep them strict if the user wants this feature.
                // For now, let's keep strict for consistency or make them optional in logic below.
                // Actually, let's make wali columns optional by NOT including them in 'expected' check if we want,
                // but the prompt implied "supports importing".
                // Let's keep them in 'expectedColumns' but strictly checking 'required' only.
                // Ideally, we split 'expected' vs 'required'.
                // For simplified implementation, I will assume they are OPTIONAL in the validator below,
                // but if I add them to expectedColumns array here, the existing code:
                // const missingColumns = expected.filter(col => !headers.includes(col));
                // will fail if the user uploads an OLD template.
                // CAUTION: Breaking change for old templates if I add strictly to expectedColumns.
                // SOLUTION: Separate 'requiredColumns' from 'supportedColumns'.
                return !headers.includes(col) && !col.startsWith('wali_'); // Make wali_ optional
            });

            if (missingColumns.length > 0) {
                setGlobalErrors([`Kolom yang dibutuhkan tidak ditemukan: ${missingColumns.join(', ')}`]);
                setIsProcessing(false);
                setStep('preview'); // Stay on preview but show error
                setColumns(headers); // Show what we found
                return;
            }

            // ... (Rest of parseExcel)
            // Transform to objects
            let dataObjects = rows.map((row, idx) => {
                const obj = { _rowIndex: idx + 2 }; // Excel row number
                headers.forEach((header, i) => {
                    obj[header] = row[i] !== undefined ? String(row[i]).trim() : '';
                });
                return obj;
            });

            // ... (Rest of basic validation)
            const basicErrors = [];
            dataObjects.forEach((row) => {
                if (!row.nama) basicErrors.push({ rowIndex: row._rowIndex, message: 'Nama wajib diisi' });
                if (!row.email) basicErrors.push({ rowIndex: row._rowIndex, message: 'Email wajib diisi' });
                if (row.email && !row.email.includes('@')) basicErrors.push({ rowIndex: row._rowIndex, message: 'Format email tidak valid' });
            });

            // ...

            setValidationErrors(basicErrors);
            setColumns(headers);
            setPreviewData(dataObjects);
            setStep('preview');
        } catch (error) {
            // ...
            console.error('Error parsing Excel:', error);
            toast.error('Gagal membaca file Excel');
        } finally {
            setIsProcessing(false);
        }
    };

    // ...

    const handleImport = async () => {
        setIsProcessing(true);
        setStep('importing');

        // Filter out rows with validation errors
        const errorRowIndices = new Set(validationErrors.map(e => e.rowIndex));
        const validData = previewData.filter(row => !errorRowIndices.has(row._rowIndex));

        if (validData.length === 0) {
            toast.error('Tidak ada data valid untuk diimport');
            setIsProcessing(false);
            setStep('preview');
            return;
        }

        const importData = validData.map(row => ({
            name: row.nama,
            email: row.email,
            phone: row.phone || row.telepon || null,
            role: row.role || importType,
            // Guru specific
            nip: row.nip,
            bidangStudi: row.bidang_studi,
            // Siswa specific
            nis: row.nis,
            nisn: row.nisn,
            kelas: row.kelas,
            jenisKelamin: row.jenis_kelamin,
            tanggalLahir: row.tanggal_lahir,
            // Wali specific
            wali: row.wali_email ? {
                name: row.wali_nama,
                email: row.wali_email,
                phone: row.wali_phone,
                hubungan: row.wali_hubungan || 'Orang Tua'
            } : null
        }));

        const result = await onImport(importData);
        setImportResult(result || { success: importData.length, failed: 0 });
        setStep('done');

        if (result.success === 0 && result.failed > 0) {
            toast.error('Import gagal: Semua data gagal diproses');
        } else if (result.failed > 0) {
            toast.success('Import selesai dengan beberapa catatan');
        } else {
            toast.success('Proses import selesai');
        }
        // ...
    };

    const handleDownloadTemplate = () => {
        const defaultTemplates = {
            users: [
                { nama: 'Budi Guru', email: 'budi.guru@school.ai', role: 'guru', phone: '081234567890', kelas: '' },
                { nama: 'Ahmad Siswa', email: 'ahmad.siswa@school.ai', role: 'siswa', phone: '081234567891', kelas: 'X IPA 1' },
            ],
            guru: [
                { nama: 'Budi Guru', email: 'budi@school.ai', nip: '198001012020', bidang_studi: 'Matematika', phone: '081234567890' },
            ],
            siswa: [
                {
                    nama: 'Ahmad Siswa',
                    email: 'ahmad@school.ai',
                    nis: '2024001',
                    nisn: '0012345678',
                    kelas: 'X IPA 1',
                    jenis_kelamin: 'L',
                    tanggal_lahir: '2010-05-15',
                    wali_nama: 'Bapak Ahmad',
                    wali_email: 'bapak.ahmad@example.com',
                    wali_phone: '081234567000',
                    wali_hubungan: 'Ayah'
                },
            ],
        };

        const data = templateData || defaultTemplates[importType] || defaultTemplates.users;
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, `template_import_${importType}.xlsx`);
        toast.success('Template berhasil didownload');
    };

    const handleClose = () => {
        setFile(null);
        setPreviewData([]);
        setColumns([]);
        setValidationErrors([]);
        setGlobalErrors([]);
        setStep('upload');
        onClose();
    };

    const renderStepIndicator = () => {
        return (
            <div className="flex items-center justify-center mb-6">
                <div className={`flex items-center ${step === 'upload' ? 'text-primary-600 font-bold' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'upload' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>1</div>
                    <span className="ml-2">Upload</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-300 mx-4"></div>
                <div className={`flex items-center ${step === 'preview' ? 'text-primary-600 font-bold' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'preview' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>2</div>
                    <span className="ml-2">Validasi</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-300 mx-4"></div>
                <div className={`flex items-center ${['importing', 'done'].includes(step) ? 'text-primary-600 font-bold' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['importing', 'done'].includes(step) ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>3</div>
                    <span className="ml-2">Hasil</span>
                </div>
            </div>
        )
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Import Data Excel"
            description={`Import data ${importType} secara massal`}
            size="2xl"
            footer={null} // Custom footer per step
        >
            <div className="p-1">
                {renderStepIndicator()}

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div className="space-y-6">
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="bg-white p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center">
                                <Upload className="h-10 w-10 text-primary-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Upload File Excel
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                Klik di sini untuk memilih file atau drag & drop file Excel (.xlsx, .xls) Anda.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }}>
                                <Download className="mr-2 h-4 w-4" /> Download Template
                            </Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Format Kolom Wajib
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(expectedColumns[importType] || expectedColumns.users).map(col => (
                                    <Badge key={col} variant="secondary" className="bg-white text-blue-700 border-blue-200">
                                        {col}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview & Validate */}
                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FileSpreadsheet className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{file?.name}</h3>
                                    <p className="text-sm text-gray-500">{previewData.length} baris data ditemukan</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>Ubah File</Button>
                        </div>

                        {/* Validation Summary */}
                        {globalErrors.length > 0 ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex gap-2 text-red-700 font-medium mb-1">
                                    <XCircle className="w-5 h-5" />
                                    Error Format
                                </div>
                                <ul className="list-disc list-inside text-sm text-red-600 pl-7">
                                    {globalErrors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        ) : validationErrors.length > 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <div className="flex gap-2 text-amber-800 font-medium mb-1">
                                    <AlertCircle className="w-5 h-5" />
                                    Ditemukan {validationErrors.length} Masalah Data
                                </div>
                                <p className="text-sm text-amber-700 ml-7">
                                    Data dengan error tidak akan diimport (atau perlu konfirmasi).
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-2 text-green-800">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Semua data valid dan siap diimport!</span>
                            </div>
                        )}

                        {/* Table Preview */}
                        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-auto relative">
                            {isProcessing && (
                                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                                </div>
                            )}
                            <Table>
                                <TableHeader className="sticky top-0 z-0 bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        {columns.map(col => (
                                            <TableHead key={col} className="whitespace-nowrap capitalize">
                                                {col.replace(/_/g, ' ')}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, idx) => {
                                        const rowErrors = validationErrors.filter(e => e.rowIndex === row._rowIndex);
                                        const hasError = rowErrors.length > 0;
                                        return (
                                            <TableRow key={idx} className={hasError ? 'bg-red-50 hover:bg-red-100' : ''}>
                                                <TableCell className="text-gray-500 font-mono text-xs">
                                                    {idx + 1}
                                                </TableCell>
                                                {columns.map(col => (
                                                    <TableCell key={col} className="max-w-[200px]">
                                                        <div className="flex flex-col">
                                                            <span className="truncate">{row[col] || '-'}</span>
                                                            {hasError && rowErrors.find(e => e.message.toLowerCase().includes(col.split('_')[0])) && (
                                                                <span className="text-xs text-red-600 mt-1 font-medium">
                                                                    {rowErrors.find(e => e.message.toLowerCase().includes(col.split('_')[0]))?.message}
                                                                </span>
                                                            )}
                                                            {/* Generic row errors displayed in first column or specific logic */}
                                                            {col === columns[0] && hasError && rowErrors.some(e => !columns.some(c => e.message.toLowerCase().includes(c))) && (
                                                                <span className="text-xs text-red-600 mt-1 font-medium">
                                                                    {rowErrors.find(e => !columns.some(c => e.message.toLowerCase().includes(c)))?.message}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                            <Button variant="ghost" onClick={handleClose}>Batal</Button>
                            <Button
                                onClick={handleImport}
                                disabled={globalErrors.length > 0 || isProcessing}
                                variant={validationErrors.length > 0 ? "destructive" : "default"}
                            >
                                {isProcessing ? 'Memproses...' : (
                                    <>
                                        Import {previewData.length - (new Set(validationErrors.map(e => e.rowIndex)).size)} Data Valid
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Importing / Result */}
                {(step === 'importing' || step === 'done') && (
                    <div className="py-12 text-center">
                        {step === 'importing' ? (
                            <div className="space-y-4">
                                <Loader2 className="h-16 w-16 animate-spin text-primary-500 mx-auto" />
                                <h3 className="text-xl font-semibold text-gray-900">Sedang Mengimport Data...</h3>
                                <p className="text-gray-500">Mohon jangan tutup jendela ini.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Selesai!</h3>
                                    <div className="flex justify-center gap-8 text-center mt-6">
                                        <div>
                                            <p className="text-3xl font-bold text-green-600">{importResult?.success || 0}</p>
                                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Berhasil</p>
                                        </div>
                                        {importResult?.failed > 0 && (
                                            <div>
                                                <p className="text-3xl font-bold text-red-600">{importResult?.failed || 0}</p>
                                                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Gagal</p>
                                            </div>
                                        )}
                                    </div>
                                    {importResult?.failed > 0 && (
                                        <p className="text-sm text-red-600 mt-4 bg-red-50 py-2 px-4 rounded-full inline-block">
                                            Cek console untuk detail error data yang gagal.
                                        </p>
                                    )}
                                </div>
                                <div className="pt-6">
                                    <Button size="lg" onClick={handleClose} className="min-w-[150px]">
                                        Tutup
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ExcelImport;
