import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../api/financeService';
import { academicService } from '@/features/academic/api/academicService';
import { financeKeys } from './useFinance';

// ============================================
// QUERIES
// ============================================

export const useClasses = () => {
    return useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await academicService.getClasses();
            return res?.data || res || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const usePaymentTypes = () => {
    return useQuery({
        queryKey: financeKeys.paymentTypes(),
        queryFn: async () => {
            const res = await financeService.getPaymentTypes();
            return res?.data || res || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useBillingStatsByClass = () => {
    return useQuery({
        queryKey: ['billing-stats-by-class'],
        queryFn: async () => {
            const res = await financeService.getBillingStatsByClass();
            return res?.data || res || [];
        },
    });
};

export const useStudentBillingSummary = (classId) => {
    return useQuery({
        queryKey: ['student-billing-summary', classId],
        queryFn: async () => {
            const res = await financeService.getStudentBillingSummary(classId);
            return res?.data || res || [];
        },
        enabled: !!classId,
    });
};

export const useInvoices = ({ page, limit, status, studentId, classId, month, year }) => {
    return useQuery({
        queryKey: ['invoices', { page, limit, status, studentId, classId, month, year }],
        queryFn: () => financeService.getInvoices({ page, limit, status, studentId, classId, month, year }),
        keepPreviousData: true,
    });
};

export const useBillableInvoices = (studentId) => {
    return useQuery({
        queryKey: ['billable-invoices', studentId],
        queryFn: async () => {
            const res = await financeService.getBillableInvoices(studentId);
            return res?.data || res || [];
        },
        enabled: !!studentId,
    });
};

export const useCheckBatchInvoice = (paymentTypeId, month, year, classId = null) => {
    return useQuery({
        queryKey: ['check-batch-invoice', { paymentTypeId, month, year, classId }],
        queryFn: () => financeService.checkBatchInvoiceExists(paymentTypeId, month, year, classId),
        enabled: !!paymentTypeId && !!month && !!year,
    });
};

// ============================================
// MUTATIONS
// ============================================

export const useCreateInvoiceSingle = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => financeService.createInvoiceSingle(
            data.studentId,
            data.paymentTypeId,
            data.amount,
            data.month,
            data.year,
            data.dueDate,
            data.notes
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['billing-stats-by-class'] });
            queryClient.invalidateQueries({ queryKey: ['student-billing-summary'] });
        },
    });
};

export const useCreateInvoiceBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => financeService.createInvoiceBatch(
            data.paymentTypeId,
            data.classId,
            data.month,
            data.year,
            data.dueDate
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['billing-stats-by-class'] });
            queryClient.invalidateQueries({ queryKey: ['student-billing-summary'] });
        },
    });
};

export const useVoidInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => financeService.voidInvoice(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['billing-stats-by-class'] });
            queryClient.invalidateQueries({ queryKey: ['student-billing-summary'] });
        },
    });
};

export const useRecordPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ invoiceId, amount, method }) => financeService.recordPayment(invoiceId, amount, method),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['finance'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['billable-invoices'] });
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['billing-stats-by-class'] });
        },
    });
};
