import { useQuery } from '@tanstack/react-query';
import { academicService } from '@/features/academic/api/academicService';

export const useWaliKelasDashboard = (userId) => {
    return useQuery({
        queryKey: ['dashboard', 'wali-kelas', userId],
        queryFn: () => academicService.getWaliKelasDashboard(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
