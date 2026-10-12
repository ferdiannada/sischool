import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useWaliMuridDashboard = (userId) => {
    return useQuery({
        queryKey: ['dashboard', 'wali-murid', userId],
        queryFn: () => dashboardAPI.getWaliMuridDashboard(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
