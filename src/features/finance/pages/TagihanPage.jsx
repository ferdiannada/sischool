import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import {
    Plus,
    Search,
    Filter,
    FileText,
    Send,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    Receipt,
    Users,
    BookOpen,
    ArrowLeft,
    ChevronRight,
    Calendar,
    Wallet,
    Trash2,
    Trash
} from 'lucide-react';
import {
    useBillingStatsByClass,
    useStudentBillingSummary,
    useInvoices,
    useClasses,
    usePaymentTypes,
    useCreateInvoiceSingle,
    useCreateInvoiceBatch,
    useCheckBatchInvoice,
    useVoidInvoice,
} from '@/features/finance/hooks/useBilling';
import { useTuDashboardStats } from '@/features/finance/hooks/useFinance';
import { academicService } from '@/features/academic/api/academicService';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentSelectionItem = ({ item, targetType, month, year, classId, onRemove, onAmountChange }) => {
    const { data: check, isLoading } = useCheckBatchInvoice(
        targetType !== 'single' ? item.id : null,
        month,
        year,
        targetType === 'class' ? classId : null
    );

    const hasWarning = targetType !== 'single' && check?.exists;
    const isError = targetType === 'class' && check?.exists;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isError ? 'bg-rose-50 border-rose-100' :
                hasWarning ? 'bg-amber-50 border-amber-100' :
                    'bg-white border-gray-100 shadow-sm'
                }`}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold truncate ${isError ? 'text-rose-900' : hasWarning ? 'text-amber-900' : 'text-gray-900'}`}>
                        {item.name}
                    </p>
                    {hasWarning && (
                        <div className="group relative">
                            <AlertCircle className={`w-4 h-4 ${isError ? 'text-rose-500' : 'text-amber-500'}`} />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                {targetType === 'all'
                                    ? 'Beberapa siswa sudah memiliki tagihan ini (akan dilewati).'
                                    : 'Kelas ini sudah memiliki tagihan ini.'}
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Nominal Tagihan</p>
            </div>

            <div className="w-32">
                <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">Rp</span>
                    <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                        className="h-9 pl-7 pr-2 text-sm font-mono focus:ring-emerald-500 border-gray-200"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="p-2 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                title="Hapus"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

const TagihanPage = () => {

    // UI State (keep as useState - these are truly UI state)
    const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'students' | 'list'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [students, setStudents] = useState([]); // For student search/dropdown in modal

    // Filter/Pagination State
    const [filters, setFilters] = useState({
        status: 'all',
        classId: '',
        studentId: '',
        month: '',
        year: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    });

    // Form State
    const [formData, setFormData] = useState({
        targetType: 'single',
        studentId: '',
        classId: '',
        selections: [], // [{ id, name, amount }]
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        notes: ''
    });

    // ============================================
    // TANSTACK QUERY HOOKS
    // ============================================

    // Reference data (cached)
    const { data: classes = [] } = useClasses();
    const { data: paymentTypes = [] } = usePaymentTypes();

    // Dashboard stats for income
    const { data: dashboardData } = useTuDashboardStats();

    // Class billing stats (for summary view)
    const { data: classStats = [], isLoading: isLoadingClassStats } = useBillingStatsByClass();

    // Student billing summary (for students view)
    const { data: studentStats = [], isLoading: isLoadingStudentStats } = useStudentBillingSummary(
        viewMode === 'students' || viewMode === 'list' ? filters.classId : null
    );

    // Invoices (for list view)
    const { data: invoicesData, isLoading: isLoadingInvoices } = useInvoices({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        studentId: filters.studentId,
        classId: filters.classId,
        month: filters.month,
        year: filters.year,
    });
    const invoices = useMemo(() => invoicesData?.data || [], [invoicesData?.data]);

    // Mutations
    const createSingleMutation = useCreateInvoiceSingle();
    const createBatchMutation = useCreateInvoiceBatch();
    const voidMutation = useVoidInvoice();

    // ============================================
    // COMPUTED VALUES
    // ============================================

    const isLoading = viewMode === 'summary' ? isLoadingClassStats :
        viewMode === 'students' ? isLoadingStudentStats :
            isLoadingInvoices;

    const isSubmitting = createSingleMutation.isPending || createBatchMutation.isPending;

    // Calculate stats based on current view
    const stats = useMemo(() => {
        let totalUnpaid = 0;
        let todayIncome = 0;
        let overdue = 0;

        // Get current month income from dashboard data
        if (dashboardData?.monthlyTrend?.length > 0) {
            const lastMonth = dashboardData.monthlyTrend[dashboardData.monthlyTrend.length - 1];
            todayIncome = lastMonth.income || 0;
        }

        if (viewMode === 'summary') {
            // Total from all classes
            totalUnpaid = classStats.reduce((acc, curr) => acc + (parseFloat(curr.total_unpaid_amount) || 0), 0);
        } else if (viewMode === 'students') {
            // Total from selected class students
            totalUnpaid = studentStats.reduce((acc, curr) => acc + (parseFloat(curr.total_unpaid_amount) || 0), 0);
        } else if (viewMode === 'list') {
            // Total from visible invoices
            totalUnpaid = invoices.reduce((acc, curr) => {
                if (curr.status === 'unpaid') return acc + (parseFloat(curr.amount) || 0);
                if (curr.status === 'partial') return acc + (parseFloat(curr.remaining_amount) || 0);
                return acc;
            }, 0);

            overdue = invoices.filter(i => {
                if (!i.due_date || (i.status !== 'unpaid' && i.status !== 'partial')) return false;
                return new Date(i.due_date) < new Date();
            }).length;
        }

        return { totalUnpaid, todayIncome, overdue };
    }, [viewMode, classStats, studentStats, invoices, dashboardData]);

    // Helper for selected context
    const selectedClass = classes.find(c => c.id == filters.classId);
    const selectedStudent = studentStats.find(s => s.student_id == filters.studentId);

    // ============================================
    // HANDLERS (no more fetch functions!)
    // ============================================

    // Navigation Handlers - simplified! No need to manually fetch
    const handleClassClick = (cls) => {
        setFilters(prev => ({ ...prev, classId: cls.class_id, studentId: '' }));
        setViewMode('students');
    };

    const handleStudentClick = (student) => {
        setFilters(prev => ({ ...prev, studentId: student.student_id, status: 'all' }));
        setViewMode('list');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleBack = () => {
        if (viewMode === 'list') {
            if (filters.studentId) {
                setFilters(prev => ({ ...prev, studentId: '' }));
                setViewMode('students');
            } else {
                setViewMode('summary');
            }
        } else if (viewMode === 'students') {
            setFilters(prev => ({ ...prev, classId: '' }));
            setViewMode('summary');
        }
    };

    // Actions - using mutations now!
    const handleCreateInvoice = async (e) => {
        e.preventDefault();

        const cleanReset = () => {
            setFormData({
                targetType: 'single',
                studentId: '',
                classId: '',
                selections: [],
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
                notes: ''
            });
            setStudents([]);
            setIsCreateModalOpen(false);
        };

        if (formData.targetType === 'single') {
            if (!formData.studentId || formData.selections.length === 0) return;

            try {
                // Sequential processing to avoid race conditions or overwhelming the server
                for (const item of formData.selections) {
                    await createSingleMutation.mutateAsync({
                        studentId: formData.studentId,
                        paymentTypeId: item.id,
                        amount: item.amount,
                        month: formData.month,
                        year: formData.year,
                        dueDate: formData.dueDate,
                        notes: formData.notes
                    });
                }
                cleanReset();
            } catch (error) {
                console.error('Failed to create single invoices:', error);
            }
        } else {
            const classIdToUse = formData.targetType === 'all' ? null : parseInt(formData.classId);
            if (formData.targetType === 'class' && !classIdToUse) return;
            if (formData.selections.length === 0) return;

            try {
                for (const item of formData.selections) {
                    await createBatchMutation.mutateAsync({
                        paymentTypeId: item.id,
                        classId: classIdToUse,
                        month: formData.month,
                        year: formData.year,
                        dueDate: formData.dueDate
                    });
                }
                cleanReset();
            } catch (error) {
                console.error('Failed to create batch invoices:', error);
            }
        }
    };

    const handleVoidInvoice = (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Batalkan tagihan ini? Data akan dihapus permanen.')) return;
        voidMutation.mutate(id);
    };

    const handleStudentSearch = async (query) => {
        if (query.length < 3) {
            setStudents([]);
            return;
        }
        const res = await academicService.getAllStudents(1, 10, query);
        if (res.success) {
            setStudents(res.data);
        }
    };

    // Utils
    const getStatusBadge = (status) => {
        const s = status?.toLowerCase() || 'unpaid';
        const styles = {
            'paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'partial': 'bg-amber-100 text-amber-800 border-amber-200',
            'unpaid': 'bg-rose-100 text-rose-800 border-rose-200'
        };
        const labels = { 'paid': 'Lunas', 'partial': 'Cicilan', 'unpaid': 'Belum Lunas' };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[s]} inline-flex items-center gap-1.5 shadow-sm`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s === 'paid' ? 'bg-emerald-500' : s === 'partial' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                {labels[s] || s}
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-20 min-h-screen bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {viewMode !== 'summary' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="rounded-full hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            {viewMode === 'summary' && 'Manajemen Tagihan'}
                            {viewMode === 'students' && (
                                <>
                                    <span className="text-gray-400 font-normal">Kelas</span>
                                    {selectedClass?.nama || 'Unknown'}
                                </>
                            )}
                            {viewMode === 'list' && selectedStudent && (
                                <>
                                    <span className="text-gray-400 font-normal">Tagihan</span>
                                    {selectedStudent.student_name}
                                </>
                            )}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {viewMode === 'summary' && 'Ringkasan posisi keuangan per kelas.'}
                            {viewMode === 'students' && `Daftar siswa di kelas ${selectedClass?.nama}.`}
                            {viewMode === 'list' && `Detail riwayat dan status pembayaran siswa.`}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all rounded-full px-6"
                >
                    <Plus className="w-5 h-5" />
                    Buat Tagihan
                </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-200 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-rose-100 font-medium text-sm mb-1">Total Belum Terbayar</p>
                        <h3 className="text-3xl font-bold">Rp {stats.totalUnpaid.toLocaleString('id-ID')}</h3>
                        <p className="text-xs text-rose-200 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Perlu ditindaklanjuti
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 mb-4 mr-4 text-rose-300 opacity-20">
                        <Wallet className="w-16 h-16" />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm mb-1">Pemasukan Bulan Ini</p>
                            <h3 className="text-3xl font-bold text-gray-800">Rp {stats.todayIncome.toLocaleString('id-ID')}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                        <span>Data real-time</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium text-sm mb-1">Jatuh Tempo</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.overdue} <span className="text-lg font-normal text-gray-400">Tagihan</span></h3>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-medium">
                        <span>Perlu diingatkan</span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {viewMode === 'summary' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
                            ))
                        ) : classStats.map((cls) => (
                            <div
                                key={cls.class_id}
                                onClick={() => handleClassClick(cls)}
                                className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <BookOpen className="w-20 h-20 text-emerald-600 rotate-12" />
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-4 relative z-10">{cls.class_name}</h3>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Total Tagihan</span>
                                        <span className="font-semibold text-rose-600">Rp {(parseFloat(cls.total_unpaid_amount) || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Belum Lunas</span>
                                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold" title="Jumlah siswa yang belum lunas">{cls.total_unpaid_students || 0} Siswa</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Siswa</span>
                                        <span className="text-gray-900 font-medium">{cls.total_students} Orang</span>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between group-hover:text-emerald-600 transition-colors">
                                    <span className="text-xs font-medium text-gray-400 group-hover:text-emerald-600">Lihat Detail</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600" />
                                </div>
                            </div>
                        ))}
                        {!isLoading && classStats.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                Belum ada data kelas.
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'students' && (
                    <Card className="overflow-hidden border-none shadow-xl shadow-gray-100/50 rounded-2xl bg-white">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 md:items-center">
                            <h3 className="font-bold text-lg text-gray-800">Daftar Siswa</h3>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Cari nama atau NIS..."
                                    className="pl-10 bg-gray-50 border-transparent focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="pl-6 py-4 rounded-tl-xl text-xs font-bold text-gray-500 uppercase tracking-wider">Siswa</TableHead>
                                        <TableHead className="py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</TableHead>
                                        <TableHead className="py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Tagihan</TableHead>
                                        <TableHead className="py-4 rounded-tr-xl w-20"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center text-gray-400">Memuat data...</TableCell>
                                        </TableRow>
                                    ) : studentStats.length > 0 ? (
                                        studentStats.map((student) => (
                                            <TableRow
                                                key={student.student_id}
                                                className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                                                onClick={() => handleStudentClick(student)}
                                            >
                                                <TableCell className="pl-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                            {student.student_name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{student.student_name}</div>
                                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{student.nis}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {student.total_unpaid_invoices > 0 ? (
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-600">
                                                            {student.total_unpaid_invoices} Tagihan
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-600">
                                                            Lunas
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-gray-900 text-base">
                                                    Rp {(parseFloat(student.total_unpaid_amount) || 0).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <Button variant="ghost" size="sm" className="text-gray-300 group-hover:text-emerald-600">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-40 text-center">
                                                <EmptyState title="Kosong" description="Tidak ada data siswa." icon={Users} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                )}

                {viewMode === 'list' && (
                    <div className="space-y-6">
                        {/* Student Profile Card - Only if selectedStudent exists */}
                        {filters.studentId && selectedStudent && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-200">
                                        {selectedStudent.student_name.slice(0, 1)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.student_name}</h2>
                                        <div className="flex items-center gap-3 mt-1 text-gray-500">
                                            <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4" /> NIS: {selectedStudent.nis || '-'}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {selectedClass?.nama}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
                                    <div className="text-center md:text-left">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Tagihan</p>
                                        <p className="text-2xl font-bold text-rose-600 mt-1">Rp {(parseFloat(selectedStudent.total_unpaid_amount) || 0).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jumlah Item</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{selectedStudent.total_unpaid_invoices || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Card className="overflow-hidden border-none shadow-xl shadow-gray-100/50 rounded-2xl bg-white">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <h3 className="font-bold text-gray-700">Rincian Tagihan</h3>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <select
                                        className="h-9 rounded-lg border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="unpaid">Belum Dibayar</option>
                                        <option value="partial">Cicilan</option>
                                        <option value="paid">Lunas</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50">
                                            <TableHead className="pl-6 py-4 font-bold text-xs text-gray-500 uppercase">Jenis Tagihan</TableHead>
                                            <TableHead className="py-4 font-bold text-xs text-gray-500 uppercase">Jatuh Tempo</TableHead>
                                            <TableHead className="py-4 font-bold text-xs text-gray-500 uppercase text-right">Nominal</TableHead>
                                            <TableHead className="py-4 font-bold text-xs text-gray-500 uppercase text-center">Status</TableHead>
                                            <TableHead className="py-4 w-20 text-right pr-6"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.length > 0 ? (
                                            invoices.map((inv) => (
                                                <TableRow key={inv.id} className="hover:bg-gray-50 transition-colors">
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="font-medium text-gray-900">{inv.payment_type}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{inv.notes || '-'}</div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className={`flex items-center gap-2 text-sm ${(inv.status === 'unpaid' && new Date(inv.due_date) < new Date()) ? 'text-rose-600 font-medium' : 'text-gray-600'}`}>
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(inv.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-4 font-mono font-medium text-gray-900">
                                                        Rp {parseInt(inv.amount).toLocaleString('id-ID')}
                                                        {inv.status === 'partial' && (
                                                            <div className="text-xs text-rose-500 mt-1">
                                                                Sisa: Rp {parseInt(inv.remaining_amount).toLocaleString('id-ID')}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        {getStatusBadge(inv.status)}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6 py-4">
                                                        {inv.status !== 'paid' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-full"
                                                                onClick={(e) => handleVoidInvoice(inv.id, e)}
                                                                title="Batalkan"
                                                            >
                                                                <XCircle className="w-5 h-5" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-gray-400">
                                                    Tidak ada tagihan yang ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {invoicesData?.total > 0 && (
                                <div className="p-4 border-t border-gray-100">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={Math.ceil((invoicesData.total || 0) / pagination.limit)}
                                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                                    />
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            {/* Create Invoice Modal - Kept largely same but styled */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Buat Tagihan Baru"
                description="Pilih metode pembuatan tagihan yang sesuai."
            >
                <form className="space-y-6">
                    {/* Target Selection Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${formData.targetType === 'single' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-opacity-50' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, targetType: 'single' }))}
                        >
                            <div className={`p-2 rounded-full ${formData.targetType === 'single' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                <Users className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-semibold ${formData.targetType === 'single' ? 'text-emerald-900' : 'text-gray-600'}`}>Perorangan</span>
                        </div>
                        <div
                            className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${formData.targetType === 'class' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-opacity-50' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, targetType: 'class' }))}
                        >
                            <div className={`p-2 rounded-full ${formData.targetType === 'class' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-semibold ${formData.targetType === 'class' ? 'text-emerald-900' : 'text-gray-600'}`}>Satu Kelas</span>
                        </div>
                        <div
                            className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${formData.targetType === 'all' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500 ring-opacity-50' : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'}`}
                            onClick={() => setFormData(prev => ({ ...prev, targetType: 'all' }))}
                        >
                            <div className={`p-2 rounded-full ${formData.targetType === 'all' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                <Users className="w-5 h-5" />
                            </div>
                            <span className={`text-xs font-semibold ${formData.targetType === 'all' ? 'text-emerald-900' : 'text-gray-600'}`}>Semua Kelas</span>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 p-5 rounded-2xl space-y-5 border border-gray-100">
                        {formData.targetType === 'single' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Cari Siswa</label>
                                <Input
                                    placeholder="Ketik nama (min. 3 huruf)..."
                                    onChange={(e) => handleStudentSearch(e.target.value)}
                                    className="bg-white"
                                />
                                {students.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-1 bg-white shadow-lg z-10 transition-all">
                                        {students.map(s => (
                                            <div
                                                key={s.id}
                                                className={`p-2 cursor-pointer hover:bg-emerald-50 rounded text-sm flex justify-between items-center ${formData.studentId === s.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'}`}
                                                onClick={() => setFormData(prev => ({ ...prev, studentId: s.id }))}
                                            >
                                                <span>{s.full_name}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.kelas?.nama}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : formData.targetType === 'class' ? (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Pilih Kelas</label>
                                <select
                                    className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    value={formData.classId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {(classes || []).map(c => (
                                        <option key={c.id} value={c.id}>{c.nama}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                                <Users className="w-5 h-5 text-emerald-500" />
                                <div className="text-sm text-emerald-700 font-medium">Tagihan akan diterapkan ke seluruh siswa aktif di semua kelas.</div>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Tambah Jenis Pembayaran</label>
                                    <select
                                        className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        value=""
                                        onChange={(e) => {
                                            const typeId = e.target.value;
                                            if (!typeId) return;
                                            const type = paymentTypes.find(t => t.id == typeId);
                                            if (type && !formData.selections.find(s => s.id == type.id)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    selections: [...prev.selections, { id: type.id, name: type.nama, amount: type.nominal_default }]
                                                }));
                                            }
                                        }}
                                    >
                                        <option value="">-- Pilih Jenis --</option>
                                        {(paymentTypes || []).map(t => (
                                            <option key={t.id} value={t.id} disabled={formData.selections.find(s => s.id == t.id)}>
                                                {t.nama}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Jatuh Tempo</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <Input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                            className="bg-white pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daftar Tagihan Terpilih</label>
                                    {formData.selections.length > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            {formData.selections.length} Jenis
                                        </span>
                                    )}
                                </div>

                                {formData.selections.length > 0 ? (
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        <AnimatePresence>
                                            {formData.selections.map((item, idx) => (
                                                <PaymentSelectionItem
                                                    key={item.id}
                                                    item={item}
                                                    targetType={formData.targetType}
                                                    month={formData.month}
                                                    year={formData.year}
                                                    classId={formData.classId}
                                                    onRemove={() => setFormData(prev => ({
                                                        ...prev,
                                                        selections: prev.selections.filter(s => s.id !== item.id)
                                                    }))}
                                                    onAmountChange={(val) => setFormData(prev => {
                                                        const newSels = [...prev.selections];
                                                        newSels[idx].amount = val;
                                                        return { ...prev, selections: newSels };
                                                    })}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3 bg-white/50">
                                        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <Receipt className="w-6 h-6 text-gray-200" />
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium">Silakan pilih jenis tagihan di atas</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-emerald-500" />
                                        <label className="text-sm font-semibold text-gray-700">Periode Tagihan</label>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-32 h-9 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            value={formData.month}
                                            onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                            className="w-24 h-9 text-xs font-bold text-center bg-white border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting} className="h-10 px-6 rounded-lg">
                            Batal
                        </Button>
                        <Button
                            onClick={handleCreateInvoice}
                            disabled={isSubmitting || formData.selections.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 shadow-lg shadow-emerald-200 rounded-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {isSubmitting ? 'Memproses...' : 'Buat Tagihan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TagihanPage;
