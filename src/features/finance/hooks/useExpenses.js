/**
 * TanStack Query Hooks for Expense Management
 * Used by: PengeluaranPage
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { financeService } from '@/features/finance/api/financeService';
import { toast } from 'react-hot-toast';

// ============================================
// QUERY KEYS
// ============================================
export const expenseKeys = {
    all: ['expenses'],
    list: (filters) => [...expenseKeys.all, 'list', filters],
    stats: () => [...expenseKeys.all, 'stats'],
    categories: () => [...expenseKeys.all, 'categories'],
    breakdown: (dateRange) => [...expenseKeys.all, 'breakdown', dateRange],
};

// ============================================
// QUERIES
// ============================================

/**
 * Get expense categories
 */
export const useExpenseCategories = () => {
    return useQuery({
        queryKey: expenseKeys.categories(),
        queryFn: async () => {
            const res = await financeService.getExpenseCategories();
            return res?.data || res || [];
        },
        staleTime: Infinity, // Rarely changes
    });
};

/**
 * Get expense statistics
 */
export const useExpenseStats = () => {
    return useQuery({
        queryKey: expenseKeys.stats(),
        queryFn: async () => {
            const res = await financeService.getExpenseStats();
            return res?.data || res || null;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Get expenses with filters and pagination
 */
export const useExpenses = (filters = {}) => {
    const { search = '', categoryId = null, status = null, limit = 10, offset = 0 } = filters;

    return useQuery({
        queryKey: expenseKeys.list({ search, categoryId, status, limit, offset }),
        queryFn: async () => {
            const res = await financeService.getExpenses({ search, categoryId, status, limit, offset });
            return res?.data || res || [];
        },
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000, // 1 minute
    });
};

/**
 * Get expense breakdown for reports
 */
export const useExpenseBreakdown = (startDate, endDate) => {
    return useQuery({
        queryKey: expenseKeys.breakdown({ startDate, endDate }),
        queryFn: async () => {
            const res = await financeService.getExpenseBreakdown(startDate, endDate);
            return res?.data || res || [];
        },
        staleTime: 5 * 60 * 1000,
    });
};

// ============================================
// MUTATIONS
// ============================================

/**
 * Create expense mutation
 */
export const useCreateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => financeService.createExpense(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Pengeluaran berhasil dicatat');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal mencatat pengeluaran');
        },
    });
};

/**
 * Update expense mutation
 */
export const useUpdateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }) => financeService.updateExpense(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Pengeluaran berhasil diperbarui');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui pengeluaran');
        },
    });
};

/**
 * Delete expense mutation
 */
export const useDeleteExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => financeService.deleteExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all });
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Pengeluaran berhasil dihapus');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menghapus pengeluaran');
        },
    });
};
