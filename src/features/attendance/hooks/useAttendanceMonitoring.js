import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

/**
 * Hook for Attendance Monitoring Data
 * Supports polling for real-time updates and caching for smooth navigation
 * 
 * @param {Object} params
 * @param {string} params.userId - Current User ID
 * @param {number} params.month - Selected Month (1-12)
 * @param {number} params.year - Selected Year
 */
export const useAttendanceMonitoring = ({ userId, month, year }) => {
    return useQuery({
        queryKey: ['attendance', 'monitoring', userId, month, year],
        queryFn: async () => {
            if (!userId) return null;
            const result = await dashboardAPI.getWaliKelasMonitoring(userId, month, year);
            return result.success ? result : null;
        },
        enabled: !!userId,
        keepPreviousData: true, // Smooth transition between months
        staleTime: 60 * 1000,   // Data is fresh for 1 minute
        refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes (Realtime-ish)
    });
};
