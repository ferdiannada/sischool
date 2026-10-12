import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/Table';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    Download,
    Calendar,
    FileSpreadsheet,
    Printer,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Filter,
    PieChart as PieIcon,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle,
    Loader2,
    Users,
    FileText,
    Wallet,
    Target
} from 'lucide-react';
import financeReportGenerator from '@/features/finance/utils/financeReportGenerator';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useFinancialReportSummary,
    useTransactionLog,
    useArrearsReport,
    useClasses,
} from '@/features/finance/hooks/useFinanceReports';
import { useExpenseBreakdown } from '@/features/finance/hooks/useExpenses';

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatCompactNumber = (number) => {
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + ' M';
    }
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(/\.0$/, '') + ' Jt';
    }
    if (number >= 1000) {
        return (number / 1000).toFixed(1).replace(/\.0$/, '') + ' Rb';
    }
    return number.toString();
};

const SimpleTooltip = ({ children, content }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none"
                    >
                        {content}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LaporanPage = () => {
    // Filter State
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 8) + '01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('finance');
    const [selectedCategory] = useState('all');  // Getter only, no UI filter for category yet
    const [selectedType, setSelectedType] = useState('all');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Always true on client-side (no SSR in this app)
    const isMounted = true;

    // ============================================
    // TANSTACK QUERY HOOKS
    // ============================================

    // Reference data
    const { data: classesData = [] } = useClasses();
    const classes = useMemo(() => classesData || [], [classesData]);

    // Financial summary
    const { data: summary = {}, isLoading: loadingSummary } = useFinancialReportSummary(startDate, endDate);

    // Expense breakdown for pie chart
    const { data: expenseBreakdown = [], isLoading: loadingBreakdown } = useExpenseBreakdown(startDate, endDate);

    // Transaction log
    const { data: transactions = [], isLoading: loadingTransactions } = useTransactionLog({
        startDate,
        endDate,
        type: selectedType,
        category: selectedCategory
    });

    // Arrears report
    const { data: arrears = [], isLoading: loadingArrears } = useArrearsReport(
        selectedClassId ? parseInt(selectedClassId) : null
    );

    // Combined loading state based on active tab
    const loading = activeTab === 'finance'
        ? loadingSummary || loadingBreakdown || loadingTransactions
        : loadingArrears;

    const handleExport = (format) => {
        try {
            const period = { startDate, endDate };
            let filename = '';

            if (activeTab === 'finance') {
                if (format === 'pdf') {
                    filename = financeReportGenerator.generateTransactionLogPDF(transactions, period);
                } else {
                    filename = financeReportGenerator.generateFinanceExcel(transactions, 'transaction', period);
                }
            } else {
                const classInfo = selectedClassId ? classes.find(c => c.id === parseInt(selectedClassId)) : null;
                const classData = classInfo ? { name: classInfo.nama } : null;

                if (format === 'pdf') {
                    filename = financeReportGenerator.generateArrearsReportPDF(classData, arrears);
                } else {
                    filename = financeReportGenerator.generateFinanceExcel(arrears, 'arrears', period);
                }
            }
            toast.success(`Laporan berhasil di-export: ${filename}`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Gagal export laporan");
        }
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-6">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight"
                    >
                        Laporan Keuangan
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 mt-1 font-medium"
                    >
                        Analisa komprehensif kondisi keuangan sekolah.
                    </motion.p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handleExport('pdf')}
                        className="gap-2 bg-white/50 backdrop-blur-sm border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-700 hover:bg-red-50 transition-all rounded-xl"
                    >
                        <Printer className="w-4 h-4" />
                        Cetak PDF
                    </Button>
                    <Button
                        onClick={() => handleExport('excel')}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 rounded-xl transition-all hover:scale-105"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <Card className="p-2 bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl sticky top-4 z-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2">
                    {/* Navigation Tabs */}
                    <div className="flex bg-gray-100/50 p-1.5 rounded-xl self-start md:self-auto w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('finance')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'finance'
                                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-gray-100'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            <Wallet className="w-4 h-4" />
                            Keuangan
                        </button>
                        <button
                            onClick={() => setActiveTab('arrears')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'arrears'
                                ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-gray-100'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                }`}
                        >
                            <Target className="w-4 h-4" />
                            Tunggakan
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-2 w-full sm:w-auto">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <input
                                type="date"
                                className="border-none p-0 text-sm font-medium text-gray-700 focus:ring-0 w-28 bg-transparent"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-300 mx-2">|</span>
                            <input
                                type="date"
                                className="border-none p-0 text-sm font-medium text-gray-700 focus:ring-0 w-28 bg-transparent text-right"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {activeTab === 'finance' ? (
                            <div className="relative w-full sm:w-48">
                                <select
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 pl-3 pr-10 bg-white"
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                >
                                    <option value="all">Semua Tipe</option>
                                    <option value="income">Pemasukan</option>
                                    <option value="expense">Pengeluaran</option>
                                </select>
                            </div>
                        ) : (
                            <div className="relative w-full sm:w-48">
                                <select
                                    className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 pl-3 pr-10 bg-white"
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                >
                                    <option value="">Semua Kelas</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nama}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key="loader"
                        className="flex justify-center items-center h-96"
                    >
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                    </motion.div>
                ) : activeTab === 'finance' ? (
                    <motion.div
                        key="finance"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Income Card */}
                            <motion.div variants={itemVariants} className="h-full">
                                <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-200 rounded-3xl border-none h-full flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                                <ArrowUpRight className="w-5 h-5 text-emerald-50" />
                                            </div>
                                            <p className="text-emerald-50 text-sm font-bold tracking-wide">Pemasukan</p>
                                        </div>
                                        <SimpleTooltip content={`Total Pemasukan: ${formatRupiah(summary.total_income)}`}>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-medium opacity-80">Rp</span>
                                                <h3 className="text-2xl xl:text-4xl font-extrabold mb-1 tracking-tight">
                                                    {formatCompactNumber(summary.total_income)}
                                                </h3>
                                            </div>
                                        </SimpleTooltip>
                                        <p className="text-emerald-100 text-xs font-medium opacity-80 pt-1">Periode ini</p>
                                    </div>
                                    {/* Deco */}
                                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                </Card>
                            </motion.div>

                            {/* Expense Card */}
                            <motion.div variants={itemVariants} className="h-full">
                                <Card className="p-6 relative overflow-hidden bg-white text-gray-900 shadow-xl shadow-gray-100 rounded-3xl border border-gray-100 group hover:border-red-200 transition-colors h-full flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
                                                <ArrowDownRight className="w-5 h-5" />
                                            </div>
                                            <p className="text-gray-500 text-sm font-bold tracking-wide">Pengeluaran</p>
                                        </div>
                                        <SimpleTooltip content={`Total Pengeluaran: ${formatRupiah(summary.total_expense)}`}>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-medium text-gray-500">Rp</span>
                                                <h3 className="text-2xl xl:text-4xl font-extrabold mb-1 tracking-tight text-gray-900">
                                                    {formatCompactNumber(summary.total_expense)}
                                                </h3>
                                            </div>
                                        </SimpleTooltip>
                                        <p className="text-gray-400 text-xs font-medium pt-1">Periode ini</p>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Net Flow Card */}
                            <motion.div variants={itemVariants} className="h-full">
                                <Card className="p-6 relative overflow-hidden bg-white text-gray-900 shadow-xl shadow-gray-100 rounded-3xl border border-gray-100 group hover:border-emerald-200 transition-colors h-full flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <p className="text-gray-500 text-sm font-bold tracking-wide">Net Cash Flow</p>
                                        </div>
                                        <SimpleTooltip content={`${summary.net_cash_flow > 0 ? 'Surplus' : 'Defisit'}: ${formatRupiah(summary.net_cash_flow)}`}>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-lg font-medium ${summary.net_cash_flow > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {summary.net_cash_flow > 0 ? '+' : ''}Rp
                                                </span>
                                                <h3 className={`text-2xl xl:text-4xl font-extrabold mb-1 tracking-tight ${summary.net_cash_flow > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {formatCompactNumber(Math.abs(summary.net_cash_flow))}
                                                </h3>
                                            </div>
                                        </SimpleTooltip>
                                        <p className="text-gray-400 text-xs font-medium pt-1">Surplus / Defisit</p>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Tx Count Card */}
                            <motion.div variants={itemVariants} className="h-full">
                                <Card className="p-6 relative overflow-hidden bg-white text-gray-900 shadow-xl shadow-gray-100 rounded-3xl border border-gray-100 group hover:border-purple-200 transition-colors h-full flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <p className="text-gray-500 text-sm font-bold tracking-wide">Total Transaksi</p>
                                        </div>
                                        <SimpleTooltip content="Jumlah Transaksi Tercatat">
                                            <h3 className="text-2xl xl:text-4xl font-extrabold mb-1 tracking-tight text-gray-900">
                                                {transactions.length}
                                            </h3>
                                        </SimpleTooltip>
                                        <p className="text-gray-400 text-xs font-medium pt-1">Aktivitas tercatat</p>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <motion.div variants={itemVariants} className="lg:col-span-2">
                                <Card className="p-6 shadow-xl shadow-gray-100 border border-gray-100 rounded-3xl bg-white h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Analisa Arus Kas</h3>
                                            <p className="text-sm text-gray-500">Tren pemasukan dan pengeluaran harian</p>
                                        </div>
                                    </div>
                                    <div className="h-80 w-full">
                                        {isMounted && summary.daily_trend && summary.daily_trend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                                                <AreaChart data={summary.daily_trend}>
                                                    <defs>
                                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                        dy={10}
                                                        tickFormatter={(value) => value.split('-')[2]}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `${value / 1000}k`}
                                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        formatter={(value) => formatRupiah(value)}
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                                                        cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                                                    />
                                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="income"
                                                        name="Pemasukan"
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorIncome)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="expense"
                                                        name="Pengeluaran"
                                                        stroke="#ef4444"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorExpense)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                                <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
                                                <p className="font-medium">Belum ada data tren untuk periode ini</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Card className="p-6 shadow-xl shadow-gray-100 border border-gray-100 rounded-3xl bg-white h-full">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">Distribusi Biaya</h3>
                                        <p className="text-sm text-gray-500">Breakdown pengeluaran</p>
                                    </div>
                                    <div className="h-64 w-full">
                                        {isMounted && expenseBreakdown && expenseBreakdown.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                                                <PieChart>
                                                    <Pie
                                                        data={expenseBreakdown}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="total_amount"
                                                        nameKey="category_name"
                                                    >
                                                        {expenseBreakdown.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value) => formatRupiah(value)}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Legend layout="horizontal" verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                                <PieIcon className="w-16 h-16 mb-4 opacity-50" />
                                                <p className="font-medium">Belum ada pengeluaran</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Detailed Log Table */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden shadow-xl shadow-gray-100 border border-gray-100 rounded-3xl bg-white">
                                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-xl">Jurnal Transaksi</h3>
                                        <p className="text-sm text-gray-500 mt-1">Detail semua aktivitas keuangan</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="hover:bg-transparent border-gray-100">
                                                <TableHead className="font-semibold text-gray-400 pl-8">Tanggal</TableHead>
                                                <TableHead className="font-semibold text-gray-400">Tipe</TableHead>
                                                <TableHead className="font-semibold text-gray-400">Kategori</TableHead>
                                                <TableHead className="font-semibold text-gray-400 w-1/3">Deskripsi</TableHead>
                                                <TableHead className="font-semibold text-gray-400">PIC</TableHead>
                                                <TableHead className="font-semibold text-gray-400 text-right pr-8">Jumlah</TableHead>
                                                <TableHead className="font-semibold text-gray-400 text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.length > 0 ? transactions.map((log, index) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    key={log.id}
                                                    className="hover:bg-emerald-50/30 transition-colors border-gray-50 group"
                                                >
                                                    <TableCell className="font-medium text-gray-900 pl-8 py-4">
                                                        {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${log.type === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {log.type === 'Pemasukan' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                                            {log.type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-gray-600 text-sm font-medium bg-gray-100 px-2 py-1 rounded-lg">{log.category}</span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 font-medium py-4">{log.description}</TableCell>
                                                    <TableCell className="text-gray-500 text-sm py-4">{log.pic}</TableCell>
                                                    <TableCell className={`text-right font-bold font-mono text-base pr-8 py-4 ${log.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {log.amount > 0 ? '+' : ''}{formatRupiah(log.amount)}
                                                    </TableCell>
                                                    <TableCell className="text-center py-4">
                                                        {log.status === 'Verified' || log.status === 'Approved' ? (
                                                            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                                                        ) : (
                                                            <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">{log.status || 'Verified'}</span>
                                                        )}
                                                    </TableCell>
                                                </motion.tr>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                                                        <div className="flex flex-col items-center">
                                                            <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                            <p>Belum ada data transaksi ditemukan</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="arrears"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        {/* Arrears Report */}
                        <motion.div variants={itemVariants}>
                            <Card className="overflow-hidden shadow-xl shadow-gray-100 border border-gray-100 rounded-3xl bg-white">
                                <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between bg-white gap-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-xl">Laporan Tunggakan Siswa</h3>
                                        <p className="text-sm text-gray-500 mt-1">Monitor piutang sekolah dari siswa</p>
                                    </div>
                                    <div className="bg-red-50 text-red-700 px-6 py-3 rounded-2xl font-bold border border-red-100 shadow-sm flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm text-red-500">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Total Tunggakan</p>
                                            <p className="text-xl">{formatRupiah((arrears || []).reduce((sum, item) => sum + (parseFloat(item.total_arrears_amount) || 0), 0))}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="hover:bg-transparent border-gray-100">
                                                <TableHead className="font-semibold text-gray-400 pl-8 w-16">No</TableHead>
                                                <TableHead className="font-semibold text-gray-400">Nama Siswa</TableHead>
                                                <TableHead className="font-semibold text-gray-400">NIS</TableHead>
                                                <TableHead className="font-semibold text-gray-400">Kelas</TableHead>
                                                <TableHead className="font-semibold text-gray-400 text-center">Jml Tagihan</TableHead>
                                                <TableHead className="font-semibold text-gray-400 text-right pr-8">Total Tunggakan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {arrears.length > 0 ? arrears.map((student, index) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    key={student.student_id}
                                                    className="hover:bg-red-50/30 transition-colors border-gray-50 group"
                                                >
                                                    <TableCell className="text-gray-400 font-medium pl-8 py-4">{index + 1}</TableCell>
                                                    <TableCell className="font-bold text-gray-900 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 text-sm font-bold shadow-sm">
                                                                {(student.student_name || '?').charAt(0)}
                                                            </div>
                                                            {student.student_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 font-mono text-sm py-4">{student.student_nis}</TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="bg-white text-gray-700 px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 shadow-sm">
                                                            {student.class_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-gray-900 py-4">
                                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md">{student.total_unpaid_invoices}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-extrabold text-red-600 py-4 pr-8 text-lg">
                                                        {formatRupiah(student.total_arrears_amount)}
                                                    </TableCell>
                                                </motion.tr>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-16 text-gray-400">
                                                        <div className="flex flex-col items-center">
                                                            <CheckCircle className="w-16 h-16 mb-4 text-emerald-500 opacity-20" />
                                                            <p className="font-medium text-gray-900 text-lg">Tidak ada tunggakan ditemukan</p>
                                                            <p className="text-sm">Semua siswa (di filter ini) sudah lunas.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LaporanPage;
