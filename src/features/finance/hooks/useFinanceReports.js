/**
 * TanStack Query Hooks for Finance Reports
 * Used by: LaporanPage
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { financeService } from '@/features/finance/api/financeService';
import { academicService } from '@/features/academic/api/academicService';

// ============================================
// QUERY KEYS
// ============================================
export const reportKeys = {
    all: ['finance', 'reports'],
    summary: (dateRange) => [...reportKeys.all, 'summary', dateRange],
    transactionLog: (filters) => [...reportKeys.all, 'transactionLog', filters],
    arrears: (classId) => [...reportKeys.all, 'arrears', classId],
    dailyRecap: (date) => [...reportKeys.all, 'dailyRecap', date],
    classes: () => ['classes'],
};

// ============================================
// QUERIES
// ============================================

/**
 * Get financial report summary (income, expense, net)
 */
export const useFinancialReportSummary = (startDate, endDate) => {
    return useQuery({
        queryKey: reportKeys.summary({ startDate, endDate }),
        queryFn: async () => {
            const res = await financeService.getFinancialReportSummary(startDate, endDate);
            return res?.data || res || {
                total_income: 0,
                total_expense: 0,
                net_cash_flow: 0,
                daily_trend: []
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Get financial transaction log (combined income + expense)
 */
export const useTransactionLog = (filters = {}) => {
    const { startDate = null, endDate = null, type = 'all', category = 'all' } = filters;

    return useQuery({
        queryKey: reportKeys.transactionLog({ startDate, endDate, type, category }),
        queryFn: async () => {
            const res = await financeService.getFinancialTransactionLog(startDate, endDate, type, category);
            return res?.data || res || [];
        },
        placeholderData: keepPreviousData,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Get arrears report (students with unpaid invoices)
 */
export const useArrearsReport = (classId = null) => {
    return useQuery({
        queryKey: reportKeys.arrears(classId),
        queryFn: async () => {
            const res = await financeService.getArrearsReport(classId);
            return res?.data || res || [];
        },
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Get daily finance recap
 */
export const useDailyRecap = (date) => {
    return useQuery({
        queryKey: reportKeys.dailyRecap(date),
        queryFn: () => financeService.getDailyFinanceRecap(date),
        enabled: !!date,
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Get TU dashboard stats (used by multiple pages)
 */
export const useTuDashboardStats = () => {
    return useQuery({
        queryKey: ['finance', 'dashboard'],
        queryFn: financeService.getTuDashboard,
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Get list of classes for filtering
 */
export const useClasses = () => {
    return useQuery({
        queryKey: reportKeys.classes(),
        queryFn: () => academicService.getClasses(),
        staleTime: Infinity, // Rarely changes
    });
};
