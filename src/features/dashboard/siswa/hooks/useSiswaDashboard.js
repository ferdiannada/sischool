import { useQuery } from '@tanstack/react-query';
import { academicService } from '@/features/academic/api/academicService';

export const useSiswaDashboard = (userId) => {
    return useQuery({
        queryKey: ['dashboard', 'siswa', userId],
        queryFn: () => academicService.getSiswaDashboard(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
