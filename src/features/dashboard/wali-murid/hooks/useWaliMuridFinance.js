import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useWaliMuridChildren = (userId) => {
    return useQuery({
        queryKey: ['wali-murid-children', userId],
        queryFn: () => dashboardAPI.getWaliMuridChildren(userId),
        enabled: !!userId,
        staleTime: 10 * 60 * 1000,
    });
};

export const useChildInvoices = (childId) => {
    return useQuery({
        queryKey: ['child-invoices', childId],
        queryFn: async () => {
            const data = await dashboardAPI.getBillableInvoices(childId);
            return data.success ? data.data : [];
        },
        enabled: !!childId,
        staleTime: 5 * 60 * 1000,
    });
};
