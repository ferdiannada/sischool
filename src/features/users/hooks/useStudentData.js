import { useQuery } from '@tanstack/react-query';
import { siswaAPI } from '@/features/users/api/siswaAPI';

export const useStudentProfile = (userId) => {
    return useQuery({
        queryKey: ['student', 'profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await siswaAPI.getProfile(userId);
            return result.success ? result : null;
        },
        enabled: !!userId,
        staleTime: Infinity, // Profile rarely changes
        cacheTime: Infinity,
    });
};
