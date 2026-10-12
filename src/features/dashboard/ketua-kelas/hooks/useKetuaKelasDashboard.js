import { useQuery } from '@tanstack/react-query';
import { academicService } from '@/features/academic/api/academicService';

export const useKetuaKelasDashboard = (userId) => {
    return useQuery({
        queryKey: ['dashboard', 'ketua-kelas', userId],
        queryFn: () => academicService.getKetuaKelasDashboard(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
