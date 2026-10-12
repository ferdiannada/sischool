import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useParentData = (userId) => {
    return useQuery({
        queryKey: ['parent', 'children', userId],
        queryFn: async () => {
            if (!userId) return [];
            return await dashboardAPI.getWaliMuridChildren(userId);
        },
        enabled: !!userId,
        staleTime: Infinity, // Children list rarely changes
        cacheTime: Infinity,
    });
};


export const useChildDetail = (studentId) => {
    return useQuery({
        queryKey: ['student', 'detail', studentId],
        queryFn: async () => {
            if (!studentId) return null;
            const result = await dashboardAPI.getStudentProfileDetail(studentId);
            return result.success ? result.data : null;
        },
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });
};

export const useParentProfile = (userId) => {
    return useQuery({
        queryKey: ['parent', 'profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            const result = await dashboardAPI.getWaliMuridProfile(userId);
            return result.success ? result.data : null;
        },
        enabled: !!userId,
        staleTime: Infinity,
    });
};
