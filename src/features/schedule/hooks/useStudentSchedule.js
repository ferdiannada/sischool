import { useQuery } from '@tanstack/react-query';
import { siswaAPI } from '@/features/users/api/siswaAPI';

export const useStudentSchedule = (studentId) => {
    return useQuery({
        queryKey: ['student', 'schedule', studentId],
        queryFn: async () => {
            if (!studentId) return null;
            const result = await siswaAPI.getSchedule(studentId);
            return result.success ? result : null; // result contains { kelas, schedules }
        },
        enabled: !!studentId,
        staleTime: 15 * 60 * 1000, // 15 mins cache
        refetchInterval: 15 * 60 * 1000, // Poll every 15 mins for changes
        keepPreviousData: true,
    });
};
