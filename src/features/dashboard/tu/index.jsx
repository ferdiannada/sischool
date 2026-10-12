import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    AlertCircle,
    Plus,
    FileText,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTuDashboardStats } from '@/features/finance/hooks/useFinance';

import StatsCard from '@/components/shared/StatsCard';
import { formatCurrency } from '@/utils/format';

// Extracted Components
import {
    CashFlowChart,
    PaymentMethodsChart,
    RecentTransactionsTable
} from '@/features/finance/components';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 10 }
    }
};

const TuDashboard = () => {
    const navigate = useNavigate();
    const [isMounted, setIsMounted] = useState(false);

    // TanStack Query Hook
    const { data: dashboardData, isLoading: loading } = useTuDashboardStats();

    const stats = dashboardData?.stats || {
        totalPemasukan: 0,
        totalTunggakan: 0,
        totalPengeluaran: 0,
        kasSaatIni: 0,
    };
    const recentTransactions = dashboardData?.recentTransactions || [];
    const monthlyTrend = dashboardData?.monthlyTrend || [];
    const paymentMethods = (dashboardData?.paymentMethods?.length > 0)
        ? dashboardData.paymentMethods
        : [
            { name: 'Transfer Bank', value: 0 },
            { name: 'Tunai', value: 0 },
            { name: 'E-Wallet', value: 0 },
        ];

    useEffect(() => {
        setIsMounted(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Stats configuration
    const statsConfig = [
        {
            label: 'Total Pemasukan',
            value: formatCurrency(stats.totalPemasukan),
            change: '+12.5%',
            trend: 'up',
            icon: TrendingUp,
            color: 'emerald'
        },
        {
            label: 'Total Tunggakan',
            value: formatCurrency(stats.totalTunggakan),
            change: '-2.4%',
            trend: 'down',
            icon: AlertCircle,
            color: 'rose'
        },
        {
            label: 'Total Pengeluaran',
            value: formatCurrency(stats.totalPengeluaran),
            change: '+5.2%',
            trend: 'down',
            icon: TrendingDown,
            color: 'amber'
        },
        {
            label: 'Kas Saat Ini',
            value: formatCurrency(stats.kasSaatIni),
            change: '+8.1%',
            trend: 'up',
            icon: Wallet,
            color: 'blue'
        }
    ];

    // Quick actions configuration
    const quickActions = [
        { label: 'Catat Pembayaran', icon: Plus, path: '/tu/pembayaran', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
        { label: 'Buat Tagihan', icon: FileText, path: '/tu/tagihan', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
        { label: 'Laporan', icon: FileSpreadsheet, path: '/tu/laporan', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Memuat dashboard keuangan...</p>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-8 p-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header & Quick Actions */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 mt-2 text-lg">Ringkasan kondisi keuangan sekolah & aktivitas terkini.</p>
                </motion.div>
                <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(action.path)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-sm ${action.color}`}
                        >
                            <action.icon className="w-4 h-4" />
                            {action.label}
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsConfig.map((stat, index) => (
                    <StatsCard
                        key={index}
                        variant="premium"
                        label={stat.label}
                        value={stat.value}
                        change={stat.change}
                        trend={stat.trend}
                        icon={stat.icon}
                        color={stat.color}
                        delay={index * 0.1}
                    />
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <CashFlowChart
                    data={monthlyTrend}
                    onViewDetails={() => navigate('/tu/laporan')}
                    isMounted={isMounted}
                />
                <PaymentMethodsChart
                    data={paymentMethods}
                    isMounted={isMounted}
                />
            </div>

            {/* Recent Transactions */}
            <RecentTransactionsTable
                transactions={recentTransactions}
                onViewAll={() => navigate('/tu/pembayaran')}
            />
        </motion.div>
    );
};

export default TuDashboard;
