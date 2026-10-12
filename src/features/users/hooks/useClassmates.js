import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useClassmates = (userId) => {
    return useQuery({
        queryKey: ['classmates', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await dashboardAPI.getKetuaKelasClassmates(userId);
            return result.success ? result : null;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};
