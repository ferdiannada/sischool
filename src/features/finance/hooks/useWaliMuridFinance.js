import { useQuery } from '@tanstack/react-query';
import { financeService } from '../api/financeService';

export const useWaliMuridChildren = (userId) => {
    return useQuery({
        queryKey: ['wali-murid', 'children', userId],
        queryFn: async () => {
            const data = await financeService.getWaliMuridChildren(userId);
            return data || [];
        },
        enabled: !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useChildInvoices = (studentId) => {
    return useQuery({
        queryKey: ['wali-murid', 'invoices', studentId],
        queryFn: async () => {
            const res = await financeService.getChildInvoices(studentId);
            return res?.data || res || []; // Handle pagination wrapper if present
        },
        enabled: !!studentId,
    });
};
