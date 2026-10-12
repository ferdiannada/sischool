import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useClassSchedule = (userId) => {
    return useQuery({
        queryKey: ['schedule', 'class', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await dashboardAPI.getKetuaKelasSchedule(userId);

            if (result.success) {
                // Ensure default values
                return {
                    schedules: result.schedules || [],
                    kelas: result.kelas || null,
                    today: result.today || (new Date().getDay() || 7)
                };
            }
            return null;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};
