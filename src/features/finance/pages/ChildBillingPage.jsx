import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    AlertCircle, CheckCircle, Clock, Wallet, CreditCard, Receipt,
    ChevronRight, ChevronDown, Download
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import { formatCurrency } from '@/utils/format';
import { useWaliMuridChildren, useChildInvoices } from '@/features/finance/hooks/useWaliMuridFinance';
import { motion, AnimatePresence } from 'framer-motion';

const ChildBillingPage = () => {
    const { user } = useAuthStore();
    const { data: children = [], isLoading: loadingChildren } = useWaliMuridChildren(user?.id);
    const [selectedChild, setSelectedChild] = useState(null);
    const [activeTab, setActiveTab] = useState('unpaid');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Auto-select first child if not selected
    useEffect(() => {
        if (!selectedChild && children.length > 0) {
            setSelectedChild(children[0]);
        }
    }, [children, selectedChild]);

    const { data: invoices = [], isLoading: loadingInvoices } = useChildInvoices(selectedChild?.id);

    const loading = loadingChildren || loadingInvoices;

    const stats = useMemo(() => {
        const totalUnpaid = invoices
            .filter(i => i.status !== 'lunas')
            .reduce((sum, i) => sum + (i.remaining_amount || i.amount), 0);

        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const currentMonthBill = invoices
            .filter(i => {
                // Assuming invoice has created_at or we parse period. 
                // Using simple heuristic if bulan/tahun columns exist from previous context
                return i.bulan === currentMonth && i.tahun === currentYear;
            })
            .reduce((sum, i) => sum + i.amount, 0);

        return { totalUnpaid, currentMonthBill };
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        if (activeTab === 'unpaid') {
            return invoices.filter(i => i.status === 'unpaid' || i.status === 'partial');
        }
        return invoices.filter(i => i.status === 'lunas');
    }, [invoices, activeTab]);

    const getIconStyle = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('spp')) return { bg: 'bg-blue-100', text: 'text-blue-600', icon: Wallet };
        if (t.includes('gedung') || t.includes('pangkal')) return { bg: 'bg-purple-100', text: 'text-purple-600', icon: CreditCard };
        return { bg: 'bg-orange-100', text: 'text-orange-600', icon: Receipt };
    };

    if (loading && children.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tagihan Sekolah</h1>
                    <p className="text-gray-500 text-sm">Kelola pembayaran SPP dan administrasi lainnya.</p>
                </div>

                {children.length > 1 && (
                    <div className="relative">
                        <select
                            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer font-medium text-gray-700 min-w-[200px]"
                            value={selectedChild?.id || ''}
                            onChange={(e) => {
                                const child = children.find(c => c.id === parseInt(e.target.value));
                                setSelectedChild(child);
                            }}
                        >
                            {children.map(child => (
                                <option key={child.id} value={child.id}>{child.full_name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Tunggakan */}
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-pink-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-pink-100 font-medium text-sm mb-1">Total Tunggakan</p>
                        <h2 className="text-3xl font-bold tracking-tight mb-4">{formatCurrency(stats.totalUnpaid)}</h2>
                        <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                            <Clock className="h-3 w-3" />
                            <span>Jatuh tempo segera</span>
                        </div>
                    </div>
                </div>

                {/* Tagihan Bulan Ini */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 text-gray-50 opacity-50 group-hover:text-primary-50 transition-colors">
                        <Wallet className="h-20 w-20 transform rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <span className="text-gray-500 font-medium text-sm">Tagihan Bulan Ini</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.currentMonthBill)}</h2>
                        <p className="text-xs text-gray-400">Periode {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Status Akun (Placeholder for now) */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <p className="text-gray-500 font-medium text-sm mb-2">Status Pembayaran</p>
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${stats.totalUnpaid > 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                <span className={`font-semibold ${stats.totalUnpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {stats.totalUnpaid > 0 ? 'Belum Lunas' : 'Aman'}
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4 justify-between group">
                            Unduh Rekap
                            <Download className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('unpaid')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'unpaid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Belum Lunas
                    {invoices.filter(i => i.status !== 'lunas').length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">
                            {invoices.filter(i => i.status !== 'lunas').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'history'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Riwayat Lunas
                </button>
            </div>

            {/* Invoice List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice, index) => {
                            const style = getIconStyle(invoice.payment_type);
                            const Icon = style.icon;
                            // Calculate progress for partial
                            const paid = invoice.paid_amount || 0;
                            const total = invoice.amount;
                            const progress = Math.min(100, Math.round((paid / total) * 100));

                            return (
                                <motion.div
                                    key={invoice.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                                            {/* Left: Icon & Info */}
                                            <div className="flex gap-4 items-start">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-900">{invoice.payment_type}</h4>
                                                        {invoice.status === 'partial' && (
                                                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">Cicilan</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Jatuh Tempo: {new Date(invoice.due_date).toLocaleDateString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Middle: Amount & Progress */}
                                            <div className="flex-1 md:text-right md:px-8">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-gray-400 mb-1">Sisa Tagihan</span>
                                                    <span className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(invoice.remaining_amount || invoice.amount)}
                                                    </span>
                                                    {invoice.status === 'partial' && (
                                                        <div className="w-full max-w-[140px] mt-2">
                                                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                                <span>{progress}%</span>
                                                                <span>Terbayar</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-orange-400 rounded-full"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Action */}
                                            <div>
                                                {/* <span className="text-gray-400">{invoice.reference_id}</span> */}
                                                <Button
                                                    size="sm"
                                                    className={`${invoice.status === 'lunas' ? 'bg-gray-100 text-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
                                                    disabled={invoice.status === 'lunas'}
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                >
                                                    {invoice.status === 'lunas' ? 'Lunas' : 'Bayar Sekarang'}
                                                    {invoice.status !== 'lunas' && <ChevronRight className="ml-1 h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="bg-gray-50 p-4 rounded-full mb-3">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-gray-900 font-medium">Tidak ada tagihan</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {activeTab === 'unpaid' ? 'Semua tagihan telah lunas.' : 'Belum ada riwayat pembayaran.'}
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {selectedInvoice && (
                    <PaymentInstructionModal
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const PaymentInstructionModal = ({ invoice, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Instruksi Pembayaran</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <ChevronDown className="h-6 w-6 transform rotate-180" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-gray-500 mb-1">Total yang harus dibayar</p>
                        <h2 className="text-2xl font-bold text-blue-700">{formatCurrency(invoice.remaining_amount || invoice.amount)}</h2>
                        <p className="text-xs text-blue-600 mt-1">{invoice.payment_type} - {invoice.bulan}/{invoice.tahun}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary-200 transition-colors cursor-pointer">
                            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">BCA</div>
                            <div>
                                <p className="font-semibold text-gray-900">Transfer Bank BCA</p>
                                <p className="text-sm text-gray-500">1234 5678 90 a.n Sekolah</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary-200 transition-colors cursor-pointer">
                            <div className="h-10 w-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">BNI</div>
                            <div>
                                <p className="font-semibold text-gray-900">Transfer Bank BNI</p>
                                <p className="text-sm text-gray-500">0987 6543 21 a.n Sekolah</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
                        <p>Setelah melakukan transfer, mohon konfirmasi ke bagian Tata Usaha atau kirim bukti pembayaran melalui WhatsApp.</p>
                    </div>

                    <Button className="w-full" onClick={onClose}>
                        Tutup
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ChildBillingPage;
