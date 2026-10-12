import { useQuery } from '@tanstack/react-query';
import { siswaAPI } from '@/features/users/api/siswaAPI';

export const useAttendanceHistory = (userId, month, year) => {
    return useQuery({
        queryKey: ['attendance-history', userId, month, year],
        queryFn: async () => {
            const result = await siswaAPI.getAttendanceHistory(userId, month, year);
            if (result?.success) {
                return {
                    stats: result.stats || { hadir: 0, izin: 0, sakit: 0, alpha: 0 },
                    history: result.history || []
                };
            }
            throw new Error(result?.error || 'Gagal memuat data kehadiran');
        },
        enabled: !!userId && !!month && !!year,
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000,
    });
};
