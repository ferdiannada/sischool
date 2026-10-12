import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
    Search,
    User,
    Plus,
    Trash2,
    Save,
    CreditCard,
    ArrowLeft,
    CheckCircle,
    Clock,
    History,
    AlertCircle,
    Receipt,
    Wallet,
    Building2,
    Banknote,
    X,
    Loader2,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useBillableInvoices,
    usePaymentTypes,
    useRecordPayment,
    useCreateInvoiceSingle,
    useInvoices,
} from '@/features/finance/hooks/useBilling';
import { academicService } from '@/features/academic/api/academicService';
import Pagination from '@/components/ui/Pagination';

const CatatPembayaranPage = () => {
    const navigate = useNavigate();

    // Core State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);

    // Search State
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' | 'history'
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastTransactionAmount, setLastTransactionAmount] = useState(0);
    const [historyPage, setHistoryPage] = useState(1);

    // Form State
    const [paymentItems, setPaymentItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'transfer'

    // ============================================
    // TANSTACK QUERY HOOKS
    // ============================================

    // Reference data
    const { data: paymentTypes = [] } = usePaymentTypes();

    // Student data - only fetch when student selected
    const { data: unpaidInvoices = [], isLoading: loadingUnpaid } = useBillableInvoices(
        selectedStudent?.id
    );

    const { data: historyData, isLoading: loadingHistory } = useInvoices({
        page: historyPage,
        limit: 10,
        status: 'paid',
        studentId: selectedStudent?.id,
    });
    const paymentHistory = useMemo(() => historyData?.data || [], [historyData?.data]);

    // Mutations
    const recordPaymentMutation = useRecordPayment();
    const createInvoiceMutation = useCreateInvoiceSingle();

    const loadingData = loadingUnpaid || loadingHistory;

    // Search Logic - keep useEffect for debounce
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchTerm.length >= 3 && !selectedStudent) {
                setSearchLoading(true);
                const { success, data } = await academicService.getAllStudents(1, 10, searchTerm);
                if (success) {
                    setSearchResults(data);
                    setShowResults(true);
                } else {
                    setSearchResults([]);
                }
                setSearchLoading(false);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedStudent]);

    const handleSelectStudent = (student) => {
        setSelectedStudent({
            id: student.id,
            name: student.full_name || student.user?.full_name,
            nis: student.nis,
            class: student.class_name || student.kelas?.nama || 'N/A',
            major: 'Umum'
        });
        setSearchTerm('');
        setShowResults(false);
    };

    const handleClearStudent = () => {
        setSelectedStudent(null);
        setSearchTerm('');
        setSearchResults([]);
        setPaymentItems([]);
        setPaymentMethod('cash');
    };

    // Form Logic
    const addItem = () => {
        const defaultType = paymentTypes[0];
        setPaymentItems([
            ...paymentItems,
            {
                id: Date.now(),
                typeId: defaultType?.id || '',
                amount: defaultType?.nominal_default || defaultType?.nominal || 0,
                description: '',
                isManual: true
            }
        ]);
    };

    const removeItem = (id) => {
        setPaymentItems(paymentItems.filter(item => item.id !== id));
    };

    const updateItem = (id, field, value) => {
        setPaymentItems(paymentItems.map(item => {
            if (item.id !== id) return item;
            const newItem = { ...item, [field]: value };
            if (field === 'typeId') {
                const type = paymentTypes.find(t => String(t.id) === String(value));
                if (type) {
                    newItem.amount = type.nominal_default || type.nominal || 0;
                }
            }
            return newItem;
        }));
    };

    const handlePayInvoice = (invoice) => {
        // Prevent duplicate addition
        const isAlreadyAdded = paymentItems.some(item => item.referenceInvoiceId === invoice.id);
        if (isAlreadyAdded) return;

        const matchingType = paymentTypes.find(t => t.nama === invoice.payment_type);
        const newItem = {
            id: Date.now(),
            typeId: matchingType ? matchingType.id : (paymentTypes[0]?.id || ''),
            amount: invoice.remaining_amount !== undefined ? invoice.remaining_amount : invoice.amount,
            description: `Pembayaran ${invoice.invoice_number} (${invoice.period || ''})`,
            referenceInvoiceId: invoice.id,
            originalInvoice: invoice
        };

        setPaymentItems(prev => [...prev, newItem]);
    };

    const totalAmount = paymentItems.reduce((sum, item) => sum + Number(item.amount), 0);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedStudent) return;
        setIsSaving(true);
        try {
            const today = new Date();
            const month = today.getMonth() + 1;
            const year = today.getFullYear();
            const dueDate = today.toISOString().split('T')[0];

            for (const item of paymentItems) {
                let invoiceIdToPay = item.referenceInvoiceId;

                // If no reference invoice (manual item), create a new invoice first
                if (!invoiceIdToPay) {
                    const result = await new Promise((resolve, reject) => {
                        createInvoiceMutation.mutate({
                            studentId: selectedStudent.id,
                            paymentTypeId: item.typeId,
                            amount: item.amount,
                            month,
                            year,
                            dueDate,
                            notes: item.description
                        }, {
                            onSuccess: (data) => resolve(data),
                            onError: (err) => reject(err)
                        });
                    });

                    if (!result?.invoice_id) {
                        throw new Error('Gagal membuat tagihan untuk ' + item.description);
                    }
                    invoiceIdToPay = result.invoice_id;
                }

                // Record payment with selected method
                await new Promise((resolve, reject) => {
                    recordPaymentMutation.mutate({
                        invoiceId: invoiceIdToPay,
                        amount: item.amount,
                        method: paymentMethod
                    }, {
                        onSuccess: resolve,
                        onError: reject
                    });
                });
            }

            setLastTransactionAmount(totalAmount);
            setShowSuccessModal(true);
            setPaymentItems([]); // Clear form
        } catch (error) {
            console.error(error);
            toast.error('Gagal: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
    };

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
            className="space-y-6 min-h-[85vh]"
        >
            {/* Header Section */}
            {!selectedStudent && (
                <div className="text-center pt-8 pb-4">
                    <motion.h1
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight mb-2"
                    >
                        Catat Pembayaran
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 max-w-md mx-auto"
                    >
                        Cari siswa untuk memulai transaksi. Gunakan NIS atau Nama untuk pencarian cepat.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-6"
                    >
                        <Button variant="outline" onClick={() => navigate('/tu/pembayaran')} className="rounded-full border-gray-300 text-gray-500 hover:text-emerald-600 hover:border-emerald-200">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar
                        </Button>
                    </motion.div>
                </div>
            )}

            {/* Main Search Area (Centered when no student selected) */}
            <AnimatePresence mode="wait">
                {!selectedStudent ? (
                    <motion.div
                        key="search-container"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        className="max-w-2xl mx-auto mt-4"
                    >
                        <Card className="p-10 shadow-2xl border-none ring-1 ring-gray-100 bg-white/80 backdrop-blur-xl relative overflow-visible group rounded-3xl">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none transform translate-x-10 -translate-y-10 group-hover:scale-110 duration-700">
                                <Wallet size={200} className="text-emerald-600" />
                            </div>

                            <div className="relative z-10">
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <Search className="h-6 w-6 text-gray-400 group-focus-within/input:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        autoFocus
                                        className="w-full pl-14 pr-6 h-16 text-xl rounded-2xl border-2 border-gray-100 bg-white shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-300"
                                        placeholder="Ketik Nama Siswa atau NIS..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchLoading && (
                                        <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Dropdown */}
                                <AnimatePresence>
                                    {showResults && searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute z-30 w-full mt-4 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar"
                                        >
                                            {searchResults.map((student, index) => (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    key={student.id}
                                                    className="p-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 flex items-center justify-between group last:border-none"
                                                    onClick={() => handleSelectStudent(student)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-inner">
                                                            {student.full_name?.charAt(0) || 'S'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg">{student.full_name || student.user?.full_name}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{student.nis}</span>
                                                                <span>•</span>
                                                                <span>{student.class_name || student.kelas?.nama}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-lg shadow-emerald-200">
                                                            Pilih
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {searchTerm.length >= 3 && !searchLoading && searchResults.length === 0 && showResults && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 text-center p-6 rounded-2xl bg-gray-50 border border-gray-100"
                                    >
                                        <p className="text-gray-500 font-medium">Siswa tidak ditemukan.</p>
                                    </motion.div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="transaction-page"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-140px)]"
                    >
                        {/* LEFT COLUMN: Student Info & Bills */}
                        <div className="xl:col-span-5 flex flex-col gap-6 h-full">
                            {/* Student Header Card */}
                            <Card className="p-1 border-none shadow-lg bg-white rounded-2xl overflow-visible z-20">
                                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full">

                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-300">
                                            {selectedStudent.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-lg font-bold text-gray-900 truncate">{selectedStudent.name}</h2>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> {selectedStudent.nis}</span>
                                                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {selectedStudent.class}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={handleClearStudent} className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </Card>

                            {/* Unpaid Bills Section */}
                            <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-lg bg-white rounded-2xl">
                                <div className="p-1 bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 flex p-2">
                                    <button
                                        onClick={() => setActiveTab('unpaid')}
                                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'unpaid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
                                    >
                                        <AlertCircle className="w-4 h-4" /> Tagihan ({unpaidInvoices.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
                                    >
                                        <History className="w-4 h-4" /> Riwayat
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30">
                                    {loadingData ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
                                        </div>
                                    ) : activeTab === 'unpaid' ? (
                                        unpaidInvoices.length > 0 ? (
                                            <div className="space-y-3">
                                                {unpaidInvoices.map(inv => {
                                                    const isAdded = paymentItems.some(item => item.referenceInvoiceId === inv.id);
                                                    return (
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            key={inv.id}
                                                            className={`p-5 rounded-2xl border transition-all relative group overflow-hidden
                                                                ${isAdded
                                                                    ? 'bg-emerald-50/50 border-emerald-100 opacity-60 grayscale-[0.5]'
                                                                    : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5'
                                                                }
                                                            `}
                                                        >
                                                            {/* Ticket Cutout Effect */}
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 rounded-r-full"></div>
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 rounded-l-full"></div>

                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md tracking-wider ${inv.status === 'partial' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                                                                            }`}>
                                                                            {inv.status === 'partial' ? 'Cicilan' : 'Belum Lunas'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400 font-mono">#{inv.invoice_number.slice(-6)}</span>
                                                                    </div>
                                                                    <p className="font-bold text-gray-800 text-lg leading-tight">{inv.payment_type}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">{inv.period || 'Tagihan Reguler'}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-xl text-gray-900 tracking-tight">Rp {Number(inv.amount).toLocaleString()}</div>
                                                                    {inv.status === 'partial' && (
                                                                        <div className="text-xs font-semibold text-orange-600 mt-0.5">Sisa: Rp {Number(inv.remaining_amount).toLocaleString()}</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 border-dashed">
                                                                <div className="flex items-center text-xs text-gray-400">
                                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                                    {new Date(inv.due_date).toLocaleDateString()}
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    disabled={isAdded}
                                                                    onClick={() => handlePayInvoice(inv)}
                                                                    className={`rounded-full h-8 px-4 text-xs font-bold transition-all ${isAdded
                                                                        ? 'bg-transparent text-emerald-600'
                                                                        : 'bg-gray-900 text-white hover:bg-emerald-600 shadow-lg shadow-gray-200'
                                                                        }`}
                                                                >
                                                                    {isAdded ? <span className="flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Ditambahkan</span> : 'Bayar'}
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <EmptyStateSmall icon={CheckCircle} title="Semua Lunas!" description="Tidak ada tagihan aktif." />
                                        )
                                    ) : (
                                        // History items with simplified logic for brevity, implementing similar improvements
                                        paymentHistory.length > 0 ? (
                                            <>
                                                <div className="space-y-4 ml-6 relative border-l-2 border-emerald-100 py-2">
                                                    {paymentHistory.map((inv, idx) => (
                                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} key={inv.id} className="relative pl-6">
                                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm glow-sm"></div>
                                                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="font-bold text-gray-800">{inv.payment_type}</span>
                                                                    <span className="font-bold text-emerald-600 text-sm">Rp {Number(inv.amount).toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">{new Date(inv.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                {historyData?.total > 0 && (
                                                    <div className="mt-4 px-2">
                                                        <Pagination
                                                            currentPage={historyPage}
                                                            totalPages={Math.ceil((historyData.total || 0) / 10)}
                                                            onPageChange={setHistoryPage}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <EmptyStateSmall icon={History} title="Belum ada riwayat" description="Data pembayaran kosong." />
                                        )
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Cart & Checkout */}
                        <div className="xl:col-span-7 h-full flex flex-col">
                            <Card className="flex-1 flex flex-col border-none shadow-2xl shadow-emerald-500/10 bg-white ring-1 ring-emerald-50 relative overflow-hidden rounded-3xl">
                                {/* Decorative Header */}
                                <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>

                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <Receipt className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900">Rincian Pembayaran</h3>
                                            <p className="text-xs text-gray-400 font-medium">{paymentItems.length} item ditambahkan</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={addItem} className="rounded-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                                        <Plus className="w-4 h-4 mr-1" /> Manual
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-4 custom-scrollbar">
                                    <AnimatePresence mode="popLayout">
                                        {paymentItems.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="h-full flex flex-col items-center justify-center text-center opacity-60"
                                            >
                                                <Receipt className="w-24 h-24 text-gray-300 mb-4" strokeWidth={1} />
                                                <p className="text-gray-500 font-medium">Keranjang masih kosong.</p>
                                                <p className="text-sm text-gray-400">Pilih tagihan dari sebelah kiri.</p>
                                            </motion.div>
                                        ) : (
                                            paymentItems.map((item, index) => (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                                    key={item.id}
                                                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group hover:border-emerald-300 transition-colors relative"
                                                >
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-12 gap-4 items-center">
                                                        <div className="col-span-12 sm:col-span-5">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Jenis Pembayaran</label>
                                                            {item.isManual ? (
                                                                <select
                                                                    className="w-full text-sm font-bold text-gray-900 border-none p-0 focus:ring-0 bg-transparent cursor-pointer"
                                                                    value={item.typeId}
                                                                    onChange={(e) => updateItem(item.id, 'typeId', e.target.value)}
                                                                >
                                                                    {paymentTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.nama}</option>)}
                                                                </select>
                                                            ) : (
                                                                <div className="font-bold text-gray-900">{paymentTypes.find(t => t.id === item.typeId)?.nama || 'Other'}</div>
                                                            )}
                                                            <input
                                                                className="text-xs text-gray-500 w-full border-none p-0 focus:ring-0 bg-transparent placeholder:text-gray-300"
                                                                placeholder="Tambahkan catatan..."
                                                                value={item.description}
                                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="col-span-12 sm:col-span-7 flex justify-end">
                                                            <div className="w-full sm:w-48 relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.amount}
                                                                    onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                                                                    className="w-full pl-8 pr-4 py-2 text-right font-mono font-bold text-lg rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-gray-50 focus:bg-white transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Checkout Footer */}
                                <div className="p-6 bg-white border-t border-gray-100 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                                    <div className="flex gap-4 mb-6">
                                        <div
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-emerald-200'
                                                }`}
                                        >
                                            <Banknote className="w-5 h-5" />
                                            <span className="font-bold">Tunai</span>
                                            {paymentMethod === 'cash' && <CheckCircle className="w-4 h-4 ml-2" />}
                                        </div>
                                        <div
                                            onClick={() => setPaymentMethod('transfer')}
                                            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${paymentMethod === 'transfer' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-blue-200'
                                                }`}
                                        >
                                            <Building2 className="w-5 h-5" />
                                            <span className="font-bold">Transfer</span>
                                            {paymentMethod === 'transfer' && <CheckCircle className="w-4 h-4 ml-2" />}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mb-6">
                                        <div className="text-gray-500 font-medium">Total Pembayaran</div>
                                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight">
                                            Rp {totalAmount.toLocaleString()}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSave}
                                        disabled={!selectedStudent || totalAmount <= 0 || isSaving}
                                        className="w-full h-14 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white rounded-xl shadow-xl shadow-gray-200 text-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:scale-100"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" /> : <Save className="w-5 h-5" />}
                                        Proses Pembayaran
                                    </Button>
                                </div>

                                {/* Receipt Jagged Edge */}
                                <div className="absolute bottom-0 left-0 w-full h-2 bg-[radial-gradient(circle_at_10px_0,_transparent_0,_transparent_10px,_#ffffff_10px)] bg-[length:20px_10px] transform rotate-180 opacity-0"></div>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <Modal isOpen={showSuccessModal} onClose={handleCloseSuccess} title="">
                <div className="text-center p-8">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
                    >
                        <Sparkles className="w-12 h-12 text-emerald-600" />
                    </motion.div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
                    <p className="text-gray-500 mb-8 text-lg">
                        Transaksi sebesar <span className="font-bold text-gray-900">Rp {lastTransactionAmount.toLocaleString()}</span> telah berhasil dicatat ke sistem.
                    </p>

                    <div className="grid gap-3">
                        <div className="flex gap-3">
                            <Button onClick={() => window.print()} variant="outline" className="flex-1 py-6 border-2 border-gray-100 hover:border-emerald-500 hover:text-emerald-600 font-bold rounded-xl text-md">
                                <Receipt className="w-5 h-5 mr-2" /> Cetak Struk
                            </Button>
                            <Button onClick={handleCloseSuccess} className="flex-1 py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-md shadow-lg shadow-emerald-200">
                                Transaksi Baru <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => navigate('/tu/pembayaran')} className="text-gray-400 hover:text-gray-600">
                            Kembali ke Menu Utama
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

const EmptyStateSmall = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
        <Icon className="w-12 h-12 text-gray-300 mb-2" />
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
    </div>
);

export default CatatPembayaranPage;
