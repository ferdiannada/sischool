import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import {
    FileText,
    Download,
    Calendar,
    User,
    Loader2,
    Eye,
    X,
    CheckCircle,
    Search,
    BarChart3
} from 'lucide-react';
import { useClassStudents } from '@/features/dashboard/wali-kelas/hooks/useWaliKelasStudents';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import useAuthStore from '../../../store/authStore';
import {
    generateMonthlyReportPDF,
    generateSemesterReportPDF,
    generateStudentCardPDF,
    generateReportExcel
} from '@/features/reports/utils/reportGenerator';
import toast from 'react-hot-toast';

// Report Preview Modal
const ReportPreviewModal = ({ isOpen, onClose, data, type, onDownload }) => {
    if (!isOpen || !data) return null;

    const formatPercentage = (val) => `${val?.toFixed(1) || 0}%`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">
                                {type === 'monthly' && `Laporan Bulanan - ${data.period?.month}/${data.period?.year}`}
                                {type === 'semester' && `Laporan Semester ${data.period?.semester_name} ${data.period?.year}`}
                                {type === 'student' && `Kartu Kehadiran - ${data.student?.name}`}
                            </h2>
                            <p className="text-indigo-100 text-sm">Kelas {data.kelas?.nama || data.student?.kelas}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Summary Stats */}
                        {type !== 'student' && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-indigo-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{data.students?.length || 0}</div>
                                    <div className="text-sm text-indigo-600">Total Siswa</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{formatPercentage(data.summary?.avg_attendance)}</div>
                                    <div className="text-sm text-green-600">Rata-rata Kehadiran</div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{data.period?.working_days || data.period?.total_days || 0}</div>
                                    <div className="text-sm text-blue-600">Hari Efektif</div>
                                </div>
                            </div>
                        )}

                        {/* Student Card Stats */}
                        {type === 'student' && (
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{data.attendance?.hadir || 0}</div>
                                    <div className="text-sm text-green-600">Hadir</div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{data.attendance?.sakit || 0}</div>
                                    <div className="text-sm text-blue-600">Sakit</div>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{data.attendance?.izin || 0}</div>
                                    <div className="text-sm text-yellow-600">Izin</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-red-600">{data.attendance?.alpha || 0}</div>
                                    <div className="text-sm text-red-600">Alpha</div>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        {(type === 'monthly' || type === 'semester') && data.students?.length > 0 && (
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">No</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">NIS</th>
                                            <th className="px-4 py-3 text-center font-semibold text-green-600">H</th>
                                            <th className="px-4 py-3 text-center font-semibold text-blue-600">S</th>
                                            <th className="px-4 py-3 text-center font-semibold text-yellow-600">I</th>
                                            <th className="px-4 py-3 text-center font-semibold text-red-600">A</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.students.map((student, index) => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-2 font-medium text-gray-900">{student.name}</td>
                                                <td className="px-4 py-2 text-gray-500">{student.nis}</td>
                                                <td className="px-4 py-2 text-center text-green-600">{student.hadir}</td>
                                                <td className="px-4 py-2 text-center text-blue-600">{student.sakit}</td>
                                                <td className="px-4 py-2 text-center text-yellow-600">{student.izin}</td>
                                                <td className="px-4 py-2 text-center text-red-600">{student.alpha}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <span className={`font-semibold ${student.percentage >= 90 ? 'text-green-600' : student.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {formatPercentage(student.percentage)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Monthly Breakdown for Student Card */}
                        {type === 'student' && data.monthly?.length > 0 && (
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Bulan</th>
                                            <th className="px-4 py-3 text-center font-semibold text-green-600">Hadir</th>
                                            <th className="px-4 py-3 text-center font-semibold text-blue-600">Sakit</th>
                                            <th className="px-4 py-3 text-center font-semibold text-yellow-600">Izin</th>
                                            <th className="px-4 py-3 text-center font-semibold text-red-600">Alpha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.monthly.map((month, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium text-gray-900">{month.month_name}</td>
                                                <td className="px-4 py-2 text-center text-green-600">{month.hadir}</td>
                                                <td className="px-4 py-2 text-center text-blue-600">{month.sakit}</td>
                                                <td className="px-4 py-2 text-center text-yellow-600">{month.izin}</td>
                                                <td className="px-4 py-2 text-center text-red-600">{month.alpha}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>Tutup</Button>
                        <Button onClick={() => onDownload('pdf')}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                        {type !== 'student' && (
                            <Button variant="outline" onClick={() => onDownload('excel')}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Excel
                            </Button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Report Card Component
const ReportCard = ({ title, description, icon: Icon, color, onGenerate, loading }) => {
    const colorClasses = {
        green: 'text-green-600 bg-green-100',
        blue: 'text-blue-600 bg-blue-100',
        purple: 'text-purple-600 bg-purple-100',
        indigo: 'text-indigo-600 bg-indigo-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
        >
            <div className="p-6">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-4">{description}</p>
                <Button
                    fullWidth
                    variant="outline"
                    onClick={onGenerate}
                    disabled={loading}
                    className="group-hover:bg-indigo-50"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Eye className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Memuat...' : 'Lihat Laporan'}
                </Button>
            </div>
        </motion.div>
    );
};

const WaliKelasReportsPage = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { data: studentsResult, isLoading: loadingStudents } = useClassStudents(user?.id);

    const students = studentsResult?.students || [];

    // Form states
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedSemester, setSelectedSemester] = useState(new Date().getMonth() >= 6 ? 1 : 2);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const debouncedSearch = useDebounce(studentSearch, 300);

    // Modal states
    const [previewData, setPreviewData] = useState(null);
    const [previewType, setPreviewType] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [reportLoading, setReportLoading] = useState({ monthly: false, semester: false, student: false });

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];



    const handleGenerateMonthly = async () => {
        setReportLoading(prev => ({ ...prev, monthly: true }));
        try {
            const result = await dashboardAPI.getWaliKelasMonthlyReport(user.id, selectedMonth, selectedYear);
            if (result.success) {
                setPreviewData(result);
                setPreviewType('monthly');
                setShowPreview(true);
            }
        } catch (error) {
            console.error("Failed to generate monthly report", error);
        } finally {
            setReportLoading(prev => ({ ...prev, monthly: false }));
        }
    };

    const handleGenerateSemester = async () => {
        setReportLoading(prev => ({ ...prev, semester: true }));
        try {
            const result = await dashboardAPI.getWaliKelasSemesterReport(user.id, selectedSemester, selectedYear);
            if (result.success) {
                setPreviewData(result);
                setPreviewType('semester');
                setShowPreview(true);
            }
        } catch (error) {
            console.error("Failed to generate semester report", error);
        } finally {
            setReportLoading(prev => ({ ...prev, semester: false }));
        }
    };

    const handleGenerateStudentCard = async () => {
        if (!selectedStudent) {
            toast.error('Pilih siswa terlebih dahulu');
            return;
        }
        setReportLoading(prev => ({ ...prev, student: true }));
        try {
            const result = await dashboardAPI.getStudentAttendanceCard(selectedStudent, selectedSemester, selectedYear);
            if (result.success) {
                setPreviewData(result);
                setPreviewType('student');
                setShowPreview(true);
            } else {
                toast.error(result.message || 'Gagal memuat kartu kehadiran siswa');
            }
        } catch (error) {
            console.error("Failed to generate student card", error);
            toast.error('Terjadi kesalahan saat memuat kartu kehadiran');
        } finally {
            setReportLoading(prev => ({ ...prev, student: false }));
        }
    };

    const handleDownload = (format) => {
        if (!previewData || !previewType) {
            toast.error('Tidak ada data untuk di-download');
            return;
        }

        try {
            let filename = '';

            if (format === 'pdf') {
                if (previewType === 'monthly') {
                    filename = generateMonthlyReportPDF(previewData);
                } else if (previewType === 'semester') {
                    filename = generateSemesterReportPDF(previewData);
                } else if (previewType === 'student') {
                    filename = generateStudentCardPDF(previewData);
                }
                toast.success(`PDF berhasil di-download: ${filename}`);
            } else if (format === 'excel') {
                if (previewType === 'monthly' || previewType === 'semester') {
                    filename = generateReportExcel(previewData, previewType);
                    toast.success(`Excel berhasil di-download: ${filename}`);
                } else {
                    toast.error('Format Excel tidak tersedia untuk kartu kehadiran siswa');
                }
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Gagal mendownload laporan. Silakan coba lagi.');
        }
    };

    const filteredStudents = useMemo(() => {
        if (!debouncedSearch) return students;
        return students.filter(s =>
            (s.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (s.nis || '').includes(debouncedSearch)
        );
    }, [students, debouncedSearch]);

    return (
        <div className="min-h-screen bg-gray-50/50 -m-6 p-6 space-y-6 font-sans">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-gray-900">Laporan Kelas</h1>
                <p className="text-gray-500">Generate dan download laporan kehadiran siswa</p>
            </motion.div>

            {/* Report Options */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Monthly Report */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                Laporan Bulanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500">Rekap absensi seluruh siswa dalam satu periode bulan.</p>

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value={2026}>2026</option>
                                    <option value={2025}>2025</option>
                                </select>
                            </div>

                            <Button
                                fullWidth
                                onClick={handleGenerateMonthly}
                                disabled={reportLoading.monthly}
                            >
                                {reportLoading.monthly ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Eye className="w-4 h-4 mr-2" />
                                )}
                                {reportLoading.monthly ? 'Memuat...' : 'Lihat Laporan'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Semester Report */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                Laporan Semester
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500">Ringkasan kehadiran selama satu semester penuh.</p>

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value={1}>Ganjil</option>
                                    <option value={2}>Genap</option>
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value={2026}>2025/2026</option>
                                    <option value={2025}>2024/2025</option>
                                </select>
                            </div>

                            <Button
                                fullWidth
                                onClick={handleGenerateSemester}
                                disabled={reportLoading.semester}
                            >
                                {reportLoading.semester ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Eye className="w-4 h-4 mr-2" />
                                )}
                                {reportLoading.semester ? 'Memuat...' : 'Lihat Laporan'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Student Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                    <User className="h-5 w-5" />
                                </div>
                                Kartu Kehadiran Siswa
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500">Download lembar penilaian absensi per siswa.</p>

                            {/* Student Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari siswa..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            >
                                <option value="">Pilih Siswa</option>
                                {filteredStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name} - {student.nis}
                                    </option>
                                ))}
                            </select>

                            <Button
                                fullWidth
                                onClick={handleGenerateStudentCard}
                                disabled={reportLoading.student || !selectedStudent}
                            >
                                {reportLoading.student ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Eye className="w-4 h-4 mr-2" />
                                )}
                                {reportLoading.student ? 'Memuat...' : 'Lihat Kartu'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Info Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
            >
                <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Panduan Laporan</h3>
                        <div className="grid md:grid-cols-3 gap-4 text-sm text-indigo-100">
                            <div>
                                <h4 className="font-semibold text-white mb-1">Laporan Bulanan</h4>
                                <p>Rekap kehadiran semua siswa per bulan. Cocok untuk evaluasi bulanan.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-1">Laporan Semester</h4>
                                <p>Ringkasan 6 bulan dengan breakdown per bulan. Untuk laporan akhir semester.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white mb-1">Kartu Kehadiran</h4>
                                <p>Laporan individual per siswa. Untuk diberikan kepada orang tua/wali.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Preview Modal */}
            <ReportPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                data={previewData}
                type={previewType}
                onDownload={handleDownload}
            />
        </div>
    );
};

export default WaliKelasReportsPage;
