import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CreditCard, FileText } from 'lucide-react';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 10 } }
};

const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * RecentTransactionsTable - Table showing recent payment transactions
 */
const RecentTransactionsTable = ({ transactions, onViewAll }) => (
    <motion.div variants={itemVariants}>
        <Card className="shadow-xl shadow-gray-100/50 border-gray-100 rounded-2xl overflow-hidden bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-500" />
                        Transaksi Terakhir
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">5 transaksi pembayaran terbaru yang masuk sistem.</p>
                </div>
                <Button variant="outline" size="sm" onClick={onViewAll} className="hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all">
                    Lihat Semua
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Siswa</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis Pembayaran</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {transactions.length > 0 ? transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 text-sm font-bold shadow-sm border border-indigo-50 ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
                                            {tx.student?.charAt(0) || '?'}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{tx.student}</div>
                                            <div className="text-xs text-gray-500 font-medium">{tx.class}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-700 font-medium bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                                    {formatRupiah(tx.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                    {tx.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center w-fit gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Berhasil
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                    <div className="flex flex-col items-center">
                                        <FileText className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="font-medium">Belum ada transaksi</p>
                                        <p className="text-sm mt-1">Data transaksi akan muncul di sini</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    </motion.div>
);

export default RecentTransactionsTable;
