import { useQuery } from '@tanstack/react-query';
import { academicService } from '@/features/academic/api/academicService';

export const useGuruDashboard = (userId) => {
    return useQuery({
        queryKey: ['dashboard', 'guru', userId],
        queryFn: () => academicService.getGuruDashboard(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
