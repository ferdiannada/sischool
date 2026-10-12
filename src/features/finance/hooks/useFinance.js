import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { financeService } from '@/features/finance/api/financeService';
import { toast } from 'react-hot-toast';

// ============================================
// QUERY KEYS
// ============================================
export const financeKeys = {
    all: ['finance'],
    dashboard: () => [...financeKeys.all, 'dashboard'],
    paymentTypes: () => [...financeKeys.all, 'paymentTypes'],
    payments: (filters) => [...financeKeys.all, 'payments', filters],
};

// ============================================
// QUERIES
// ============================================

export const useTuDashboardStats = () => {
    return useQuery({
        queryKey: financeKeys.dashboard(),
        queryFn: financeService.getTuDashboard,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const usePaymentTypes = () => {
    return useQuery({
        queryKey: financeKeys.paymentTypes(),
        queryFn: async () => {
            const res = await financeService.getPaymentTypes();
            return res?.data || res || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes - users may add types
    });
};

export const usePayments = ({ page, limit, search, type }) => {
    return useQuery({
        queryKey: financeKeys.payments({ page, limit, search, type }),
        queryFn: async () => {
            const res = await financeService.getPayments({
                page,
                limit,
                search,
                paymentTypeId: type !== 'all' ? parseInt(type) : null
            });
            return res; // Expecting { success, data, total }
        },
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000, // 1 minute
    });
};

// ============================================
// PAYMENT TYPE MUTATIONS
// ============================================

export const useCreatePaymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ nama, nominal, isRecurring, billingCycle }) =>
            financeService.createPaymentType(nama, nominal, isRecurring, billingCycle),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.paymentTypes() });
            toast.success('Jenis pembayaran berhasil ditambahkan');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menambahkan jenis pembayaran');
        },
    });
};

export const useUpdatePaymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, nama, nominal, isRecurring, description, isActive, billingCycle }) =>
            financeService.updatePaymentType(id, nama, nominal, isRecurring, description, isActive, billingCycle),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.paymentTypes() });
            toast.success('Jenis pembayaran berhasil diperbarui');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui jenis pembayaran');
        },
    });
};

export const useDeletePaymentType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => financeService.deletePaymentType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.paymentTypes() });
            toast.success('Jenis pembayaran berhasil dihapus');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menghapus jenis pembayaran');
        },
    });
};
