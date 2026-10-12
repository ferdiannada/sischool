import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useKetuaKelasProfile = (userId) => {
    return useQuery({
        queryKey: ['ketua-kelas', 'profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await dashboardAPI.getKetuaKelasProfile(userId);
            return result.success ? result.profile : null;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};
