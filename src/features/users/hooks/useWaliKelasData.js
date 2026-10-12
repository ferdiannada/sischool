import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useWaliKelasProfile = (userId) => {
    return useQuery({
        queryKey: ['wali-kelas', 'profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await dashboardAPI.getWaliKelasProfile(userId);
            return result.success ? result : null;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};
