import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/Table';
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Printer,
    Calendar,
    Receipt,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MoreHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTuDashboardStats, usePaymentTypes, usePayments } from '@/features/finance/hooks/useFinance';
import { motion, AnimatePresence } from 'framer-motion';

const PembayaranPage = () => {
    const navigate = useNavigate();

    // UI/Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1); // Reset page on type change
    }, [selectedType, limit]);

    // Hooks
    const { data: statsData } = useTuDashboardStats();
    const { data: typesData } = usePaymentTypes();
    const { data: paymentsData, isLoading: paymentsLoading, isFetching: paymentsFetching } = usePayments({
        page,
        limit,
        search: debouncedSearch,
        type: selectedType
    });

    // Derived Data
    const dashboardStats = statsData?.stats || { totalPemasukan: 0 };
    const paymentTypes = typesData || [];
    const payments = paymentsData?.data || [];
    const total = paymentsData?.total || 0;
    const loading = paymentsLoading;
    const isFetching = paymentsFetching;

    const handleCreatePayment = () => {
        navigate('/tu/pembayaran/create');
    };

    const handleRowClick = (id) => {
        // Navigate to detail page if implemented
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const getStatusBadge = (status) => {
        const styles = {
            'paid': 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            'partial': 'bg-amber-100 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
            'unpaid': 'bg-red-100 text-red-700 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
            'Lunas': 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            'Cicilan': 'bg-amber-100 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
        };

        const labels = {
            'paid': 'Lunas',
            'partial': 'Cicilan',
            'unpaid': 'Belum Lunas'
        };

        const icons = {
            'paid': CheckCircle,
            'partial': Clock,
            'unpaid': XCircle,
            'Lunas': CheckCircle,
            'Cicilan': Clock
        };

        const Icon = icons[status] || icons['Lunas'] || CheckCircle;
        const label = labels[status] || status;
        const style = styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style} transition-all duration-300 hover:scale-105`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
            </span>
        );
    };

    // Stats are now fetched via useTuDashboardStats hook above


    // Pagination Logic
    const totalPages = Math.ceil(total / limit);
    const startRange = total === 0 ? 0 : (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, total);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 p-1"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <motion.h1
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight"
                    >
                        Keuangan & Pembayaran
                    </motion.h1>
                    <p className="text-gray-500 mt-2 text-lg">Pantau arus kas dan kelola transaksi siswa dengan mudah.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 bg-white/80 backdrop-blur-sm hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm rounded-xl">
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={handleCreatePayment}
                            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 transition-all rounded-xl border-0"
                        >
                            <Plus className="w-5 h-5" />
                            Catat Pembayaran Baru
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                    <Card className="p-6 border-none shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white relative overflow-hidden h-full rounded-2xl group">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-8 -translate-y-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                            <Wallet size={150} />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="p-2 bg-white/10 rounded-lg w-fit mb-4 backdrop-blur-sm">
                                    <Wallet className="w-6 h-6 text-emerald-50" />
                                </div>
                                <p className="text-emerald-100 font-medium mb-1">Total Pemasukan</p>
                                <h3 className="text-4xl font-bold tracking-tight">{formatRupiah(dashboardStats.totalPemasukan)}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-emerald-50 text-sm bg-black/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                                <TrendingUp className="w-4 h-4" />
                                <span>Semua Waktu</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                    <Card className="p-6 border-none shadow-lg bg-white relative overflow-hidden h-full rounded-2xl group ring-1 ring-gray-100 hover:ring-emerald-500/50 transition-all">
                        <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-y-4 translate-x-4">
                            <Receipt size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-inner">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    Active
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">{total}</h3>
                            <p className="text-gray-500 text-sm font-medium">Total Transaksi Tercatat</p>
                        </div>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -5 }}>
                    <Card className="p-6 border-none shadow-lg bg-white relative overflow-hidden h-full rounded-2xl group ring-1 ring-gray-100 hover:ring-purple-500/50 transition-all">
                        <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-y-4 translate-x-4">
                            <CreditCard size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shadow-inner">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Tunai / Cash</h3>
                            <p className="text-gray-500 text-sm font-medium">Metode Pembayaran Terpopuler</p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div className="bg-purple-500 h-full rounded-full w-[85%]"></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-right">85% Transaksi</p>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Main Content Area */}
            <motion.div variants={itemVariants}>
                <Card className="border-none shadow-2xl shadow-gray-200/50 overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-gray-100">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-white/50 flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                        <div className="relative w-full lg:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari siswa, NIS, atau ID Pembayaran..."
                                className="block w-full pl-11 pr-4 py-3 border-none bg-gray-100/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all rounded-xl sm:text-sm font-medium shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                            <Button
                                variant={selectedType === 'all' ? 'default' : 'ghost'}
                                onClick={() => setSelectedType('all')}
                                className={`rounded-full px-4 ${selectedType === 'all' ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                Semua
                            </Button>
                            {paymentTypes.map(type => (
                                <Button
                                    key={type.id}
                                    variant={selectedType === String(type.id) ? 'default' : 'ghost'}
                                    onClick={() => setSelectedType(String(type.id))}
                                    className={`rounded-full px-4 whitespace-nowrap ${selectedType === String(type.id) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                >
                                    {type.nama}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-[400px] relative">
                        {isFetching && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-100 overflow-hidden z-20">
                                <div className="h-full bg-emerald-500 animate-progress"></div>
                            </div>
                        )}

                        {loading ? (
                            <div className="p-8 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-4 animate-pulse p-4 rounded-xl border border-gray-50">
                                        <div className="h-12 w-12 bg-gray-100 rounded-full"></div>
                                        <div className="flex-1 space-y-3 py-1">
                                            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                                            <div className="h-3 bg-gray-50 rounded w-1/4"></div>
                                        </div>
                                        <div className="h-8 w-24 bg-gray-50 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : payments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-gray-100">
                                        <TableHead className="py-5 pl-8 text-xs font-bold text-gray-500 uppercase tracking-wider">ID & Siswa</TableHead>
                                        <TableHead className="py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis Transaksi</TableHead>
                                        <TableHead className="py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</TableHead>
                                        <TableHead className="py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal</TableHead>
                                        <TableHead className="py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</TableHead>
                                        <TableHead className="py-5 pr-8 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {payments.map((payment, index) => (
                                            <motion.tr
                                                key={payment.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                className="group hover:bg-emerald-50/30 transition-colors cursor-pointer border-b border-gray-50 last:border-none"
                                                onClick={() => handleRowClick(payment.id)}
                                            >
                                                <TableCell className="pl-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-bold text-sm shadow-sm">
                                                            {payment.student_name?.charAt(0) || '#'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                                {payment.student_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">#{payment.id}</span>
                                                                <span>•</span>
                                                                <span>{payment.class_name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-700">{payment.payment_type}</span>
                                                        <span className="text-xs text-gray-400 capitalize flex items-center gap-1 mt-0.5">
                                                            <Wallet className="w-3 h-3" />
                                                            {payment.method}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="flex items-center text-gray-600 text-sm font-medium">
                                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                        {new Date(payment.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <span className="font-bold text-gray-900 text-base">{formatRupiah(payment.amount)}</span>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    {getStatusBadge(payment.invoice_status)}
                                                </TableCell>
                                                <TableCell className="pr-8 py-5 text-right">
                                                    <div className="flex justify-end items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all transform lg:translate-x-4 lg:group-hover:translate-x-0">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                                                            <Printer className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-20">
                                <EmptyState
                                    title="Tidak ada pembayaran ditemukan"
                                    description={searchTerm ? "Coba ubah kata kunci pencarian atau filter Anda." : "Belum ada pembayaran yang tercatat saat ini."}
                                    icon={Wallet}
                                    action={searchTerm ? {
                                        label: 'Reset Filter',
                                        onClick: () => { setSearchTerm(''); setSelectedType('all'); },
                                        props: { variant: 'outline', className: 'mt-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50' }
                                    } : {
                                        label: 'Mulai Catat Pembayaran',
                                        onClick: handleCreatePayment,
                                        props: { className: 'bg-emerald-600 hover:bg-emerald-700 text-white mt-6 shadow-lg shadow-emerald-200' }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {total > 0 && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500 gap-4 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                                    <span className="font-medium text-gray-900">{startRange}-{endRange}</span>
                                    <span>dari</span>
                                    <span className="font-medium text-gray-900">{total}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="h-8 rounded-lg border-gray-300 text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white"
                                        value={limit}
                                        onChange={(e) => setLimit(Number(e.target.value))}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span className="text-xs">per halaman</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={!hasPrevPage}
                                    onClick={() => setPage(page - 1)}
                                    className="h-9 w-9 rounded-lg border-gray-200"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex items-center px-4 font-medium text-gray-900 bg-white h-9 rounded-lg border border-gray-200 shadow-sm">
                                    Halaman {page}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={!hasNextPage}
                                    onClick={() => setPage(page + 1)}
                                    className="h-9 w-9 rounded-lg border-gray-200"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </motion.div>
        </motion.div>
    );
};

export default PembayaranPage;
